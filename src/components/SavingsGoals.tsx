"use client";

import { useState } from "react";
import type { SavingsGoal, CurrencyCode, SavingsGoalCategory } from "@/lib/types";
import type { Workspace } from "@/hooks/useWorkspace";
import { fmtDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Button, Confirm, Modal, SectionHeading } from "./ui";
import { DoodleStar, DoodleHeart } from "./doodles";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: "₹",
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const CATEGORY_LABELS: Record<SavingsGoalCategory, { label: string; icon: string }> = {
  tickets: { label: "Flight Tickets", icon: "✈️" },
  trip: { label: "Shared Trip", icon: "🗺️" },
  experience: { label: "Special Experience", icon: "✨" },
  stay: { label: "Cozy Stay", icon: "🏡" },
  special: { label: "Little Milestone", icon: "🎁" },
};

export function SavingsGoals({ ws }: { ws: Workspace }) {
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [toDelete, setToDelete] = useState<SavingsGoal | null>(null);

  // Goal Form State
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [category, setCategory] = useState<SavingsGoalCategory>("tickets");
  const [linkedDreamId, setLinkedDreamId] = useState("");
  const [notes, setNotes] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // Contribution Form State
  const [contribAmount, setContribAmount] = useState("");
  const [contribCurrency, setContribCurrency] = useState<CurrencyCode>("INR");
  const [contribNote, setContribNote] = useState("");
  const [savingContrib, setSavingContrib] = useState(false);

  const openNewGoal = () => {
    setTitle("");
    setTargetAmount("");
    setCurrency("INR");
    setCategory("tickets");
    setLinkedDreamId("");
    setNotes("");
    setGoalModalOpen(true);
  };

  const openAddContrib = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContribAmount("");
    setContribCurrency(goal.currency);
    setContribNote("");
    setContribModalOpen(true);
  };

  const handleSaveGoal = async () => {
    const num = parseFloat(targetAmount);
    if (!title.trim()) {
      toast("Give your savings goal a title.", "error");
      return;
    }
    if (isNaN(num) || num <= 0) {
      toast("Enter a valid target amount.", "error");
      return;
    }

    setSavingGoal(true);
    const ok = await ws.actions.addSavingsGoal({
      title: title.trim(),
      target_amount: num,
      currency,
      category,
      bucket_list_item_id: linkedDreamId || null,
      notes: notes.trim() || null,
    });
    setSavingGoal(false);
    if (ok !== false) setGoalModalOpen(false);
  };

  const handleSaveContrib = async () => {
    if (!selectedGoal) return;
    const num = parseFloat(contribAmount);
    if (isNaN(num) || num <= 0) {
      toast("Enter a valid contribution amount.", "error");
      return;
    }

    setSavingContrib(true);
    const ok = await ws.actions.addContribution({
      goal_id: selectedGoal.id,
      amount: num,
      currency: contribCurrency,
      note: contribNote.trim() || null,
    });
    setSavingContrib(false);
    if (ok !== false) setContribModalOpen(false);
  };

  const goals = ws.data.savingsGoals;

  return (
    <section id="savings" className="relative mt-28 scroll-mt-24 bg-forest-deep/5 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="For our travels & dreams"
          title="Dreams we're saving for"
          sub="Optional savings milestones for flight tickets, trips, and adventures together across India and the Philippines."
        />

        {/* Currency & Cost Disclaimer Banner */}
        <div className="mx-auto mb-10 max-w-2xl rounded-lg border border-ochre/30 bg-paper/90 p-4 text-center shadow-paper">
          <p className="text-xs leading-relaxed text-ink-soft">
            <span className="font-semibold text-ochre">✦ Two countries, two currencies:</span> Track targets in Indian Rupee (₹), Philippine Peso (₱), or international currencies.
            All budgets are <strong className="text-forest">user estimates</strong> and never presented as verified booking quotes.
          </p>
        </div>

        <div className="mb-10 text-center">
          <Button variant="accent" onClick={openNewGoal}>
            <DoodleStar className="h-4 w-4 text-ochre" /> Start a savings goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <div className="mx-auto max-w-md rounded-[10px] border-2 border-dashed border-sage/70 bg-ivory/80 px-8 py-12 text-center shadow-paper">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft text-2xl">🌱</span>
            <p className="mt-4 font-serif text-2xl text-forest">No savings milestones yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Set a target for Manila flights, beach trips, or quiet weekend escapes. You can log little contributions whenever you put money aside.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((g, i) => {
              const contribs = ws.data.savingsContributions.filter((c) => c.goal_id === g.id);
              // Sum contributions with basic conversion note if currency matches
              const totalSavedInCurrency = contribs
                .filter((c) => c.currency === g.currency)
                .reduce((acc, c) => acc + Number(c.amount), 0);
              const otherContribsCount = contribs.filter((c) => c.currency !== g.currency).length;
              const percent = Math.min(100, Math.round((totalSavedInCurrency / g.target_amount) * 100));

              return (
                <article
                  key={g.id}
                  className={`paper-card relative px-6 py-6 shadow-lift transition-all hover:-translate-y-0.5 ${
                    i % 2 ? "rotate-[0.5deg]" : "rotate-[-0.5deg]"
                  }`}
                >
                  <span aria-hidden className="washi -top-2.5 right-6" />

                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-mist px-2.5 py-0.5 text-[11px] font-medium text-forest">
                      <span>{CATEGORY_LABELS[g.category]?.icon ?? "🌱"}</span>
                      {CATEGORY_LABELS[g.category]?.label ?? g.category}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-ink-faint">
                      Estimated target
                    </span>
                  </div>

                  <h3 className="mt-3 font-serif text-2xl font-semibold leading-snug text-forest">
                    {g.title}
                  </h3>

                  {g.notes && (
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">{g.notes}</p>
                  )}

                  {/* Target & Saved Stats */}
                  <div className="mt-4 rounded-md border border-ink/10 bg-ivory/80 p-3.5">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-ink-faint">Saved so far</span>
                        <div className="font-serif text-xl font-bold text-forest">
                          {CURRENCY_SYMBOLS[g.currency]}{totalSavedInCurrency.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-ink-faint">Estimated Target</span>
                        <div className="font-serif text-base font-semibold text-ink-soft">
                          {CURRENCY_SYMBOLS[g.currency]}{Number(g.target_amount).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-sage-mist">
                      <div
                        className="h-full rounded-full bg-forest transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-ink-faint">
                      <span>{percent}% of estimated target</span>
                      {otherContribsCount > 0 && (
                        <span>+{otherContribsCount} in other currencies</span>
                      )}
                    </div>
                  </div>

                  {/* Recent contributions preview */}
                  {contribs.length > 0 && (
                    <div className="mt-3.5 border-t border-dashed border-ink/15 pt-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                        Recent contributions:
                      </p>
                      <div className="mt-1.5 space-y-1">
                        {contribs.slice(0, 3).map((c) => (
                          <div key={c.id} className="flex items-center justify-between text-xs text-ink-soft">
                            <span>
                              {ws.authorOf(c.user_id)} {c.note ? `· “${c.note}”` : ""}
                            </span>
                            <span className="font-medium text-forest">
                              +{CURRENCY_SYMBOLS[c.currency]}{Number(c.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-dashed border-ink/15 pt-3">
                    <Button variant="accent" size="sm" onClick={() => openAddContrib(g)}>
                      + Add savings
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(g)}>
                      Remove
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* New Goal Modal */}
      <Modal open={goalModalOpen} onClose={() => setGoalModalOpen(false)} labelledBy="new-goal-title">
        <div className="p-7 md:p-8">
          <div className="flex items-center gap-2 text-forest">
            <span className="text-xl">✈️</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Savings Milestone</span>
          </div>
          <h3 id="new-goal-title" className="mt-2 font-serif text-3xl font-semibold text-forest">
            A dream we're saving for.
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            Track flight tickets, trips, or stays. This is an estimated savings goal, not a verified ticket cost.
          </p>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="field-label" htmlFor="sg-title">What are we saving for? *</label>
              <input
                id="sg-title"
                className="field-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Flights: Kochi ↔ Manila, Beach Cottage Stay…"
                maxLength={140}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="sg-target">Estimated Target *</label>
                <input
                  id="sg-target"
                  type="number"
                  min="1"
                  className="field-input"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="35000"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="sg-currency">Currency</label>
                <select
                  id="sg-currency"
                  className="field-input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="PHP">PHP (₱) - Philippine Peso</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="sg-category">Category</label>
              <select
                id="sg-category"
                className="field-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as SavingsGoalCategory)}
              >
                <option value="tickets">Flight Tickets & Transit ✈️</option>
                <option value="trip">Shared Trip & Tour 🗺️</option>
                <option value="stay">Cozy Stay & Accommodation 🏡</option>
                <option value="experience">Special Experience / Date ✨</option>
                <option value="special">Milestone / Gift 🎁</option>
              </select>
            </div>

            {ws.data.dreams.length > 0 && (
              <div>
                <label className="field-label" htmlFor="sg-link">Link to a bucket list dream (optional)</label>
                <select
                  id="sg-link"
                  className="field-input"
                  value={linkedDreamId}
                  onChange={(e) => setLinkedDreamId(e.target.value)}
                >
                  <option value="">None (standalone savings goal)</option>
                  {ws.data.dreams.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="sg-notes">Notes or research links</label>
              <input
                id="sg-notes"
                className="field-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rough average round-trip rate from Cebu Pacific / IndiGo"
              />
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <Button variant="soft" onClick={() => setGoalModalOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleSaveGoal} disabled={savingGoal}>
              {savingGoal ? "Saving…" : "Plant this goal"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contribution Modal */}
      <Modal open={contribModalOpen} onClose={() => setContribModalOpen(false)} labelledBy="add-contrib-title">
        {selectedGoal && (
          <div className="p-7 md:p-8">
            <div className="flex items-center gap-2 text-forest">
              <DoodleHeart className="h-5 w-5 text-rose" />
              <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Log Contribution</span>
            </div>
            <h3 id="add-contrib-title" className="mt-2 font-serif text-3xl font-semibold text-forest">
              Put savings toward “{selectedGoal.title}”
            </h3>

            <div className="mt-5 grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="ca-amount">Amount saved *</label>
                  <input
                    id="ca-amount"
                    type="number"
                    min="1"
                    className="field-input"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="ca-curr">Currency</label>
                  <select
                    id="ca-curr"
                    className="field-input"
                    value={contribCurrency}
                    onChange={(e) => setContribCurrency(e.target.value as CurrencyCode)}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="PHP">PHP (₱)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="ca-note">Little note (optional)</label>
                <input
                  id="ca-note"
                  className="field-input"
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
                  placeholder="Set aside from this month's freelance / salary"
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <Button variant="soft" onClick={() => setContribModalOpen(false)}>Cancel</Button>
              <Button variant="accent" onClick={handleSaveContrib} disabled={savingContrib}>
                {savingContrib ? "Logging…" : "Log savings"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Confirm
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Remove savings goal?"
        body={`“${toDelete?.title}” and its logged history will be removed.`}
        confirmLabel="Remove goal"
        onConfirm={() => toDelete && ws.actions.deleteSavingsGoal(toDelete.id)}
      />
    </section>
  );
}
