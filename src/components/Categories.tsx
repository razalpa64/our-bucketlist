"use client";

import { useEffect, useState } from "react";
import { CATEGORY_ART } from "@/lib/config";
import type { Workspace } from "@/hooks/useWorkspace";
import { Button, Confirm, Modal } from "./ui";

export function CategoriesModal({ ws, open, onClose }: { ws: Workspace; open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("other");
  const [toDelete, setToDelete] = useState<{ id: string; name: string; count: number } | null>(null);

  useEffect(() => {
    if (open) {
      setRows(ws.data.categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })));
      setNewName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    for (const r of rows) {
      const orig = ws.data.categories.find((c) => c.id === r.id);
      if (orig && (orig.name !== r.name || orig.icon !== r.icon)) {
        await ws.actions.updateCategory(r.id, { name: r.name.trim() || orig.name, icon: r.icon });
      }
    }
    onClose();
  };

  return (
    <>
      <Modal open={open} onClose={onClose} labelledBy="cats-title">
        <div className="p-7 md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">The book's chapters</p>
          <h3 id="cats-title" className="mt-2 font-serif text-3xl font-semibold text-forest">Manage chapters</h3>
          <p className="mt-2 text-sm text-ink-soft">Rename, re-illustrate or add chapters. Removing one simply sets its dreams free (they stay on the list).</p>

          <div className="mt-6 grid max-h-[46vh] gap-2.5 overflow-y-auto scroll-slim pr-1">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-2.5">
                <img src={CATEGORY_ART[r.icon] ?? CATEGORY_ART.other} alt="" className="h-9 w-9 rounded-md object-cover shadow-pin" />
                <select
                  aria-label="Chapter illustration"
                  className="field-input !w-auto !py-1 text-xs"
                  value={r.icon}
                  onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, icon: e.target.value } : x)))}
                >
                  {Object.keys(CATEGORY_ART).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <input
                  aria-label="Chapter name"
                  className="field-input !py-1.5 text-sm"
                  value={r.name}
                  maxLength={60}
                  onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))}
                />
                <Button
                  variant="danger"
                  size="sm"
                  aria-label={`Remove ${r.name}`}
                  onClick={() => {
                    const count = ws.data.dreams.filter((d) => d.category_id === r.id).length;
                    setToDelete({ id: r.id, name: r.name, count });
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2.5 border-t border-dashed border-ink/15 pt-5">
            <img src={CATEGORY_ART[newIcon]} alt="" className="h-9 w-9 rounded-md object-cover shadow-pin" />
            <select aria-label="New chapter illustration" className="field-input !w-auto !py-1 text-xs" value={newIcon} onChange={(e) => setNewIcon(e.target.value)}>
              {Object.keys(CATEGORY_ART).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <input aria-label="New chapter name" className="field-input !py-1.5 text-sm" placeholder="New chapter name…" value={newName} maxLength={60} onChange={(e) => setNewName(e.target.value)} />
            <Button
              variant="soft"
              size="sm"
              onClick={async () => {
                if (!newName.trim()) return;
                await ws.actions.addCategory(newName.trim(), newIcon);
                setNewName("");
              }}
            >
              Add
            </Button>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <Button variant="soft" onClick={onClose}>Close</Button>
            <Button variant="accent" onClick={save}>Save chapters</Button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title={`Remove “${toDelete?.name}”?`}
        body={
          toDelete && toDelete.count > 0
            ? `${toDelete.count} dream${toDelete.count === 1 ? "" : "s"} live in this chapter. They won't be deleted — they'll just lose their chapter.`
            : "This chapter will disappear for both of you."
        }
        confirmLabel="Remove chapter"
        onConfirm={() => {
          if (toDelete) {
            ws.actions.deleteCategory(toDelete.id);
            setRows((prev) => prev.filter((r) => r.id !== toDelete.id));
          }
        }}
      />
    </>
  );
}
