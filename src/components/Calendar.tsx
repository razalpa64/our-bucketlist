"use client";

import { useState } from "react";
import type { CalendarPlan, CalendarPlanType } from "@/lib/types";
import type { Workspace } from "@/hooks/useWorkspace";
import { fmtDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Button, Confirm, Modal, SectionHeading } from "./ui";
import { DoodleStar, DoodleHeart } from "./doodles";

const PLAN_META: Record<
  CalendarPlanType,
  { label: string; badge: string; icon: string; bg: string; text: string }
> = {
  tentative: {
    label: "Tentative Date",
    badge: "Tentative idea",
    icon: "💭",
    bg: "bg-ochre-soft/60",
    text: "text-ink",
  },
  planned: {
    label: "Planned Trip / Date",
    badge: "Planned date",
    icon: "🗓️",
    bg: "bg-terracotta/15",
    text: "text-terracotta-deep",
  },
  confirmed: {
    label: "Confirmed Booking",
    badge: "Confirmed booking ✈️",
    icon: "🎟️",
    bg: "bg-forest/15",
    text: "text-forest-deep",
  },
  anniversary: {
    label: "Anniversary / Milestone",
    badge: "Anniversary 💕",
    icon: "💐",
    bg: "bg-rose-soft/70",
    text: "text-terracotta-deep",
  },
  trip: {
    label: "Shared Vacation",
    badge: "Trip itinerary",
    icon: "🏝️",
    bg: "bg-sage-mist",
    text: "text-forest",
  },
};

export function CalendarSection({ ws }: { ws: Workspace }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarPlan | null>(null);
  const [toDelete, setToDelete] = useState<CalendarPlan | null>(null);

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [planType, setPlanType] = useState<CalendarPlanType>("tentative");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setTitle("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setPlanType("tentative");
    setLocation("");
    setNotes("");
    setModalOpen(true);
  };

  const openEdit = (p: CalendarPlan) => {
    setEditing(p);
    setTitle(p.title);
    setStartDate(p.start_date);
    setEndDate(p.end_date ?? "");
    setPlanType(p.plan_type);
    setLocation(p.location ?? "");
    setNotes(p.notes ?? "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast("Give your plan a title.", "error");
      return;
    }
    if (!startDate) {
      toast("Choose a target start date.", "error");
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      start_date: startDate,
      end_date: endDate || null,
      plan_type: planType,
      location: location.trim() || null,
      notes: notes.trim() || null,
    };

    const ok = editing
      ? await ws.actions.updateCalendarPlan(editing.id, payload)
      : await ws.actions.addCalendarPlan(payload);

    setSaving(false);
    if (ok !== false) setModalOpen(false);
  };

  const plans = ws.data.calendarPlans.slice().sort((a, b) => a.start_date.localeCompare(b.start_date));

  return (
    <section id="calendar" className="relative mt-28 scroll-mt-24 bg-sage-soft/20 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Dates & Milestones"
          title="Our someday calendar"
          sub="Target dates, anniversary plans, and tentative trips. Distinguish tentative ideas from confirmed flights and bookings."
        />

        <div className="mb-10 text-center">
          <Button variant="accent" onClick={openNew}>
            <DoodleStar className="h-4 w-4 text-ochre" /> Add a shared date
          </Button>
        </div>

        {plans.length === 0 ? (
          <div className="mx-auto max-w-md rounded-[10px] border-2 border-dashed border-sage/70 bg-ivory/80 px-8 py-12 text-center shadow-paper">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft text-2xl">📅</span>
            <p className="mt-4 font-serif text-2xl text-forest">No calendar dates pinned yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Add your next reunion date, tentative flight periods, anniversary dinners, or tentative trip windows. Either of you can update anytime.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p, i) => {
              const meta = PLAN_META[p.plan_type] ?? PLAN_META.tentative;
              const isPast = new Date(p.start_date).getTime() < Date.now() - 24 * 3600 * 1000;

              return (
                <article
                  key={p.id}
                  className={`paper-card relative px-6 py-6 shadow-lift transition-all hover:-translate-y-0.5 ${
                    isPast ? "opacity-75" : ""
                  } ${i % 2 ? "rotate-[0.4deg]" : "rotate-[-0.4deg]"}`}
                >
                  <span aria-hidden className="washi -top-2.5 left-6" />

                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.bg} ${meta.text}`}>
                      <span>{meta.icon}</span>
                      <span>{meta.badge}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-ink-faint">
                      {isPast ? "Past date" : "Upcoming"}
                    </span>
                  </div>

                  <h3 className="mt-3 font-serif text-2xl font-semibold leading-snug text-forest">
                    {p.title}
                  </h3>

                  {/* Date presentation */}
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-terracotta-deep">
                    <span className="text-base">📆</span>
                    <span>
                      {fmtDate(p.start_date)}
                      {p.end_date ? ` – ${fmtDate(p.end_date)}` : ""}
                    </span>
                  </div>

                  {p.location && (
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
                      <span>📍</span>
                      <span>{p.location}</span>
                    </div>
                  )}

                  {p.notes && (
                    <p className="mt-2.5 rounded-sm bg-paper/60 p-2.5 text-xs italic text-ink/80">
                      “{p.notes}”
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink/15 pt-3 text-[11px] text-ink-faint">
                    <span>Added by {ws.authorOf(p.created_by)}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => setToDelete(p)}>Remove</Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Plan Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} labelledBy="calendar-plan-title">
        <div className="p-7 md:p-8">
          <div className="flex items-center gap-2 text-forest">
            <span className="text-xl">📅</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Calendar Plan</span>
          </div>
          <h3 id="calendar-plan-title" className="mt-2 font-serif text-3xl font-semibold text-forest">
            {editing ? "Update shared plan" : "Add to our someday calendar"}
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            Clearly label whether this is a tentative plan or a confirmed booking.
          </p>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="field-label" htmlFor="cp-title">Title / Plan Name *</label>
              <input
                id="cp-title"
                className="field-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Next flight reunion, First anniversary trip, Weekend cabin…"
                maxLength={140}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="cp-start">Target / Start Date *</label>
                <input
                  id="cp-start"
                  type="date"
                  className="field-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cp-end">End Date (optional)</label>
                <input
                  id="cp-end"
                  type="date"
                  className="field-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="cp-type">Status & Plan Type</label>
              <select
                id="cp-type"
                className="field-input"
                value={planType}
                onChange={(e) => setPlanType(e.target.value as CalendarPlanType)}
              >
                <option value="tentative">💭 Tentative idea (aiming for this month/date)</option>
                <option value="planned">🗓️ Planned date (agreed upon, not yet booked)</option>
                <option value="confirmed">🎟️ Confirmed booking ✈️ (tickets or hotel booked!)</option>
                <option value="anniversary">💐 Anniversary / Special milestone</option>
                <option value="trip">🏝️ Vacation / Shared itinerary</option>
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="cp-location">Location / Destination (optional)</label>
              <input
                id="cp-location"
                className="field-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Manila, Kerala, Boracay, Bali…"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="cp-notes">Notes & details</label>
              <input
                id="cp-notes"
                className="field-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Flight details, Airbnb reservation, or things to pack"
              />
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <Button variant="soft" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update plan" : "Save to calendar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Remove calendar plan?"
        body={`“${toDelete?.title}” will be removed from our calendar.`}
        confirmLabel="Remove plan"
        onConfirm={() => toDelete && ws.actions.deleteCalendarPlan(toDelete.id)}
      />
    </section>
  );
}
