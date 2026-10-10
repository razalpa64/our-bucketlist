"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isConfigured } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import type {
  Category,
  Dream,
  Favorite,
  Place,
  Profile,
  Relationship,
  SharedNote,
  FutureLetter,
  SavingsGoal,
  SavingsContribution,
  CalendarPlan,
  WorkspaceData,
} from "@/lib/types";

type ConnectionState = "connecting" | "live" | "offline";

const EMPTY: WorkspaceData = {
  relationship: null,
  profiles: [],
  categories: [],
  dreams: [],
  favorites: [],
  places: [],
  notes: [],
  futureLetters: [],
  savingsGoals: [],
  savingsContributions: [],
  calendarPlans: [],
};

function upsert<T extends { id: string }>(rows: T[], row: T): T[] {
  const i = rows.findIndex((r) => r.id === row.id);
  if (i === -1) return [row, ...rows];
  const next = rows.slice();
  next[i] = row;
  return next;
}

function remove<T extends { id: string }>(rows: T[], id: string): T[] {
  return rows.filter((r) => r.id !== id);
}

export function useWorkspace() {
  const [data, setData] = useState<WorkspaceData>(EMPTY);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const relIdRef = useRef<string | null>(null);
  const signedCache = useRef(new Map<string, { url: string; at: number }>());

  const load = useCallback(async () => {
    if (!isConfigured) {
      setFatal("missing-config");
      setLoading(false);
      return;
    }
    const sb = supabase();
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) {
      setFatal("no-session");
      setLoading(false);
      return;
    }
    const uid = session.user.id;

    const { data: memberships, error: mErr } = await sb
      .from("relationship_members")
      .select("relationship_id")
      .eq("user_id", uid);
    if (mErr) {
      setFatal(mErr.message);
      setLoading(false);
      return;
    }
    const relId = memberships?.[0]?.relationship_id ?? null;
    if (!relId) {
      setFatal("no-workspace");
      setLoading(false);
      return;
    }
    relIdRef.current = relId;

    const [rel, profiles, categories, dreams, favorites, places, notes, futureLetters, savingsGoals, savingsContribs, calendarPlans, myProfile] =
      await Promise.all([
        sb.from("relationships").select("*").eq("id", relId).maybeSingle(),
        sb.from("profiles").select("*").order("created_at"),
        sb.from("categories").select("*").eq("relationship_id", relId).order("sort_order"),
        sb.from("bucket_list_items").select("*").eq("relationship_id", relId).order("created_at", { ascending: false }),
        sb.from("item_favorites").select("*"),
        sb.from("locations").select("*").eq("relationship_id", relId).order("created_at", { ascending: false }),
        sb.from("shared_notes").select("*").eq("relationship_id", relId).order("created_at", { ascending: false }),
        sb.from("future_letters").select("*").eq("relationship_id", relId).order("reveal_at", { ascending: true }),
        sb.from("savings_goals").select("*").eq("relationship_id", relId).order("created_at", { ascending: false }),
        sb.from("savings_contributions").select("*").eq("relationship_id", relId).order("created_at", { ascending: false }),
        sb.from("calendar_plans").select("*").eq("relationship_id", relId).order("start_date", { ascending: true }),
        sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
      ]);

    const itemIds = new Set((dreams.data ?? []).map((d: Dream) => d.id));
    setData({
      relationship: rel.data,
      profiles: profiles.data ?? [],
      categories: categories.data ?? [],
      dreams: dreams.data ?? [],
      favorites: (favorites.data ?? []).filter((f: Favorite) => itemIds.has(f.item_id)),
      places: places.data ?? [],
      notes: notes.data ?? [],
      futureLetters: futureLetters.data ?? [],
      savingsGoals: savingsGoals.data ?? [],
      savingsContributions: savingsContribs.data ?? [],
      calendarPlans: calendarPlans.data ?? [],
    });
    setMe(myProfile.data ?? { id: uid, display_name: session.user.email?.split("@")[0] ?? "me", avatar_url: null, created_at: new Date().toISOString() });
    setLoading(false);

    // ------------------------------------------------ realtime
    const apply =
      (key: "dreams" | "categories" | "places" | "notes" | "futureLetters" | "savingsGoals" | "savingsContributions" | "calendarPlans") =>
      (payload: { eventType: string; new: unknown; old: unknown }) => {
        setData((prev) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            return { ...prev, [key]: remove(prev[key] as { id: string }[], old.id) } as typeof prev;
          }
          const row = payload.new as { id: string };
          return { ...prev, [key]: upsert(prev[key] as { id: string }[], row) } as typeof prev;
        });
      };

    const channel = sb
      .channel(`workspace-${relId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bucket_list_items", filter: `relationship_id=eq.${relId}` }, apply("dreams"))
      .on("postgres_changes", { event: "*", schema: "public", table: "categories", filter: `relationship_id=eq.${relId}` }, apply("categories"))
      .on("postgres_changes", { event: "*", schema: "public", table: "locations", filter: `relationship_id=eq.${relId}` }, apply("places"))
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_notes", filter: `relationship_id=eq.${relId}` }, apply("notes"))
      .on("postgres_changes", { event: "*", schema: "public", table: "future_letters", filter: `relationship_id=eq.${relId}` }, apply("futureLetters"))
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_goals", filter: `relationship_id=eq.${relId}` }, apply("savingsGoals"))
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_contributions", filter: `relationship_id=eq.${relId}` }, apply("savingsContributions"))
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_plans", filter: `relationship_id=eq.${relId}` }, apply("calendarPlans"))
      .on("postgres_changes", { event: "*", schema: "public", table: "relationships", filter: `id=eq.${relId}` }, (payload: { eventType: string; new: unknown }) => {
        if (payload.eventType !== "DELETE") {
          setData((prev) => ({ ...prev, relationship: payload.new as Relationship }));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "item_favorites" }, (payload: { eventType: string; new: unknown; old: unknown }) => {
        setData((prev) => {
          const itemIds = new Set(prev.dreams.map((d) => d.id));
          if (payload.eventType === "DELETE") {
            const old = payload.old as Favorite;
            if (!itemIds.has(old.item_id)) return prev;
            return { ...prev, favorites: prev.favorites.filter((f) => !(f.item_id === old.item_id && f.user_id === old.user_id)) };
          }
          const row = payload.new as Favorite;
          if (!itemIds.has(row.item_id)) return prev;
          const rest = prev.favorites.filter((f) => !(f.item_id === row.item_id && f.user_id === row.user_id));
          return { ...prev, favorites: [...rest, row] };
        });
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") setConnection("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setConnection("offline");
      });
    channelRef.current = channel;
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then(() => {
      if (cancelled) channelRef.current && supabase().removeChannel(channelRef.current);
    });
    return () => {
      cancelled = true;
      if (channelRef.current) supabase().removeChannel(channelRef.current);
    };
  }, [load]);

  // ------------------------------------------------------------ helpers
  const categoryOf = useCallback(
    (d: Dream) => data.categories.find((c) => c.id === d.category_id) ?? null,
    [data.categories]
  );
  const authorOf = useCallback(
    (id: string) => data.profiles.find((p) => p.id === id)?.display_name ?? "one of us",
    [data.profiles]
  );
  const favoritesOf = useCallback(
    (itemId: string) => data.favorites.filter((f) => f.item_id === itemId),
    [data.favorites]
  );
  const myFavorite = useCallback(
    (itemId: string) => Boolean(me && data.favorites.some((f) => f.item_id === itemId && f.user_id === me.id)),
    [data.favorites, me]
  );

  const signedUrl = useCallback(async (path: string | null): Promise<string | null> => {
    if (!path) return null;
    const hit = signedCache.current.get(path);
    if (hit && Date.now() - hit.at < 50 * 60 * 1000) return hit.url;
    const { data, error } = await supabase().storage.from("dream-media").createSignedUrl(path, 3600);
    if (error || !data) return null;
    signedCache.current.set(path, { url: data.signedUrl, at: Date.now() });
    return data.signedUrl;
  }, []);

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const relId = relIdRef.current;
      if (!relId || !me) throw new Error("Not signed in");
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        throw new Error("Please choose a JPG, PNG, WebP or GIF image.");
      }
      if (file.size > 4 * 1024 * 1024) throw new Error("Let's keep images under 4 MB.");
      const safe = file.name.replace(/[^a-z0-9.-]+/gi, "-").slice(-40);
      const path = `${relId}/${me.id}/${Date.now()}-${safe}`;
      const { error } = await supabase().storage.from("dream-media").upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);
      return path;
    },
    [me]
  );

  // ------------------------------------------------------------ mutations
  const guard = (error: { message: string } | null, okMsg?: string) => {
    if (error) {
      toast(`That didn't save — ${error.message}`, "error");
      return false;
    }
    if (okMsg) toast(okMsg, "success");
    return true;
  };

  const addDream = useCallback(
    async (input: Partial<Dream>): Promise<Dream | null> => {
      const relId = relIdRef.current;
      if (!relId) return null;
      const { data: rows, error } = await supabase()
        .from("bucket_list_items")
        .insert({ ...input, relationship_id: relId })
        .select()
        .single();
      if (guard(error, "Saved to our book.")) return rows as Dream;
      return null;
    },
    []
  );

  const updateDream = useCallback(async (id: string, patch: Partial<Dream>) => {
    const { error } = await supabase().from("bucket_list_items").update(patch).eq("id", id);
    return guard(error);
  }, []);

  const deleteDream = useCallback(async (id: string) => {
    const { error } = await supabase().from("bucket_list_items").delete().eq("id", id);
    return guard(error, "The page was torn out.");
  }, []);

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      if (!me) return;
      const isFav = data.favorites.some((f) => f.item_id === itemId && f.user_id === me.id);
      // optimistic
      setData((prev) => ({
        ...prev,
        favorites: isFav
          ? prev.favorites.filter((f) => !(f.item_id === itemId && f.user_id === me.id))
          : [...prev.favorites, { item_id: itemId, user_id: me.id, created_at: new Date().toISOString() }],
      }));
      const { error } = isFav
        ? await supabase().from("item_favorites").delete().eq("item_id", itemId).eq("user_id", me.id)
        : await supabase().from("item_favorites").insert({ item_id: itemId, user_id: me.id });
      if (error) {
        // rollback
        setData((prev) => ({
          ...prev,
          favorites: isFav
            ? [...prev.favorites, { item_id: itemId, user_id: me.id, created_at: new Date().toISOString() }]
            : prev.favorites.filter((f) => !(f.item_id === itemId && f.user_id === me.id)),
        }));
        toast(`Couldn't update the favorite — ${error.message}`, "error");
      }
    },
    [me, data.favorites]
  );

  const setFeatured = useCallback(async (itemId: string | null) => {
    const relId = relIdRef.current;
    if (!relId) return;
    const { error } = await supabase().from("relationships").update({ featured_item_id: itemId }).eq("id", relId);
    guard(error, itemId ? "That's today's featured dream." : undefined);
  }, []);

  const completeDream = useCallback(
    async (id: string, meta: { completed_at?: string; completion_note?: string | null; completion_image_path?: string | null }) => {
      const { error } = await supabase()
        .from("bucket_list_items")
        .update({ status: "completed", completed_at: meta.completed_at ?? new Date().toISOString(), completion_note: meta.completion_note ?? null, completion_image_path: meta.completion_image_path ?? null })
        .eq("id", id);
      return guard(error);
    },
    []
  );

  const reopenDream = useCallback(async (id: string) => {
    const { error } = await supabase()
      .from("bucket_list_items")
      .update({ status: "dreaming", completed_at: null, completion_note: null, completion_image_path: null })
      .eq("id", id);
    return guard(error, "Back on the dreaming pages.");
  }, []);

  const addCategory = useCallback(async (name: string, icon: string) => {
    const relId = relIdRef.current;
    if (!relId) return;
    const nextOrder = Math.max(0, ...data.categories.map((c) => c.sort_order)) + 1;
    const { error } = await supabase().from("categories").insert({ relationship_id: relId, name, icon, sort_order: nextOrder });
    return guard(error, "New chapter added.");
  }, [data.categories]);

  const updateCategory = useCallback(async (id: string, patch: Partial<Category>) => {
    const { error } = await supabase().from("categories").update(patch).eq("id", id);
    return guard(error);
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase().from("categories").delete().eq("id", id);
    return guard(error, "Chapter removed.");
  }, []);

  const addPlace = useCallback(async (input: Partial<Place>) => {
    const relId = relIdRef.current;
    if (!relId) return;
    const { error } = await supabase().from("locations").insert({ ...input, relationship_id: relId });
    return guard(error, "A new pin on our map.");
  }, []);

  const updatePlace = useCallback(async (id: string, patch: Partial<Place>) => {
    const { error } = await supabase().from("locations").update(patch).eq("id", id);
    return guard(error);
  }, []);

  const deletePlace = useCallback(async (id: string) => {
    const { error } = await supabase().from("locations").delete().eq("id", id);
    return guard(error, "Pin removed.");
  }, []);

  const addNote = useCallback(async (input: Partial<SharedNote>) => {
    const relId = relIdRef.current;
    if (!relId) return;
    const { error } = await supabase().from("shared_notes").insert({ ...input, relationship_id: relId });
    return guard(error, "Tucked between the pages.");
  }, []);

  const updateNote = useCallback(async (id: string, patch: Partial<SharedNote>) => {
    const { error } = await supabase().from("shared_notes").update(patch).eq("id", id);
    return guard(error);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    const { error } = await supabase().from("shared_notes").delete().eq("id", id);
    return guard(error, "Note removed.");
  }, []);

  const addFutureLetter = useCallback(async (input: { title: string; content: string; reveal_at: string; delivery_years?: number }) => {
    const relId = relIdRef.current;
    if (!relId) return;
    const { error } = await supabase().from("future_letters").insert({ ...input, relationship_id: relId });
    return guard(error, "Sealed in our time capsule.");
  }, []);

  const updateFutureLetter = useCallback(async (id: string, patch: Partial<FutureLetter>) => {
    const { error } = await supabase().from("future_letters").update(patch).eq("id", id);
    return guard(error, "Letter updated.");
  }, []);

  const deleteFutureLetter = useCallback(async (id: string) => {
    const { error } = await supabase().from("future_letters").delete().eq("id", id);
    return guard(error, "Time capsule letter removed.");
  }, []);

  const addSavingsGoal = useCallback(async (input: Partial<SavingsGoal>) => {
    const relId = relIdRef.current;
    if (!relId) return;
    const { error } = await supabase().from("savings_goals").insert({ ...input, relationship_id: relId });
    return guard(error, "Savings goal tucked in.");
  }, []);

  const updateSavingsGoal = useCallback(async (id: string, patch: Partial<SavingsGoal>) => {
    const { error } = await supabase().from("savings_goals").update(patch).eq("id", id);
    return guard(error);
  }, []);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    const { error } = await supabase().from("savings_goals").delete().eq("id", id);
    return guard(error, "Savings goal removed.");
  }, []);

  const addContribution = useCallback(async (input: { goal_id: string; amount: number; currency: string; note?: string | null }) => {
    const relId = relIdRef.current;
    if (!relId) return;
    const { error } = await supabase().from("savings_contributions").insert({ ...input, relationship_id: relId });
    return guard(error, "Contribution logged with love.");
  }, []);

  const deleteContribution = useCallback(async (id: string) => {
    const { error } = await supabase().from("savings_contributions").delete().eq("id", id);
    return guard(error, "Contribution removed.");
  }, []);

  const addCalendarPlan = useCallback(async (input: Partial<CalendarPlan>) => {
    const relId = relIdRef.current;
    if (!relId) return;
    const { error } = await supabase().from("calendar_plans").insert({ ...input, relationship_id: relId });
    return guard(error, "Saved to our someday calendar.");
  }, []);

  const updateCalendarPlan = useCallback(async (id: string, patch: Partial<CalendarPlan>) => {
    const { error } = await supabase().from("calendar_plans").update(patch).eq("id", id);
    return guard(error);
  }, []);

  const deleteCalendarPlan = useCallback(async (id: string) => {
    const { error } = await supabase().from("calendar_plans").delete().eq("id", id);
    return guard(error, "Calendar plan removed.");
  }, []);

  const updateDreamDoodle = useCallback(async (id: string, doodle: string) => {
    const { error } = await supabase().from("bucket_list_items").update({ doodle }).eq("id", id);
    return guard(error, "Little drawing tucked in.");
  }, []);

  const seedStarters = useCallback(
    async (items: { title: string; icon: string; priority?: string }[]) => {
      const relId = relIdRef.current;
      if (!relId) return;
      const rows = items.map((s) => {
        const cat = data.categories.find((c) => c.icon === s.icon);
        return { relationship_id: relId, title: s.title, category_id: cat?.id ?? null, priority: s.priority ?? "whenever" };
      });
      const { error } = await supabase().from("bucket_list_items").insert(rows);
      return guard(error, "A few first pages, just for us.");
    },
    [data.categories]
  );

  const partner = useMemo(() => data.profiles.find((p) => p.id !== me?.id) ?? null, [data.profiles, me]);

  return {
    data,
    me,
    partner,
    loading,
    fatal,
    connection,
    reload: load,
    categoryOf,
    authorOf,
    favoritesOf,
    myFavorite,
    signedUrl,
    uploadImage,
    actions: {
      addDream,
      updateDream,
      deleteDream,
      toggleFavorite,
      setFeatured,
      completeDream,
      reopenDream,
      addCategory,
      updateCategory,
      deleteCategory,
      addPlace,
      updatePlace,
      deletePlace,
      addNote,
      updateNote,
      deleteNote,
      addFutureLetter,
      updateFutureLetter,
      deleteFutureLetter,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      addContribution,
      deleteContribution,
      addCalendarPlan,
      updateCalendarPlan,
      deleteCalendarPlan,
      updateDreamDoodle,
      seedStarters,
    },
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
