import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Layers, RotateCcw, Search } from 'lucide-react';
import { ACADEMY_FLASHCARDS, ACADEMY_GLOSSARY, type GlossaryEntry } from '../../data/glossaryData';
import { usePlatform } from '../../context/PlatformContext';
import { apiFetch } from '../../lib/api';

const GUEST_FC_KEY = 'mfx_guest_flashcards_v1';

export const GlossaryAndFlashcards: React.FC = () => {
  const { user, resumeState, setResumeState } = usePlatform();
  const [subMode, setSubMode] = useState<'glossary' | 'flashcards'>('glossary');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('All');

  // Flashcards state
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [guestFc, setGuestFc] = useState<Record<string, 'mastered' | 'review'>>(() => {
    try {
      const raw = localStorage.getItem(GUEST_FC_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const fcProgress = user ? resumeState?.flashcard_progress || {} : guestFc;

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(ACADEMY_GLOSSARY.map((g) => g.category)))],
    []
  );

  const filteredGlossary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ACADEMY_GLOSSARY.filter((g) => {
      if (catFilter !== 'All' && g.category !== catFilter) return false;
      if (!q) return true;
      return (
        g.term.toLowerCase().includes(q) ||
        g.shortDefinition.toLowerCase().includes(q) ||
        g.fullExplanation.toLowerCase().includes(q) ||
        (g.aliases || []).some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [search, catFilter]);

  const filteredCards = useMemo(() => {
    if (catFilter === 'All') return ACADEMY_FLASHCARDS;
    return ACADEMY_FLASHCARDS.filter((c) => c.category === catFilter);
  }, [catFilter]);

  const activeCard = filteredCards[cardIdx % Math.max(1, filteredCards.length)] || ACADEMY_FLASHCARDS[0];
  const masteredCount = ACADEMY_FLASHCARDS.filter((c) => fcProgress[c.id] === 'mastered').length;

  const markCard = async (cardId: string, status: 'mastered' | 'review') => {
    if (user) {
      try {
        const res = await apiFetch<{ flashcard_progress: Record<string, 'mastered' | 'review'> }>(
          '/api/academy/flashcards/progress',
          {
            method: 'POST',
            body: JSON.stringify({ card_id: cardId, status }),
          }
        );
        setResumeState((prev) => ({
          last_course_id: prev?.last_course_id ?? null,
          last_lesson_id: prev?.last_lesson_id ?? null,
          last_scroll_pct: prev?.last_scroll_pct ?? 0,
          flashcard_progress: res.flashcard_progress,
          updated_at: new Date().toISOString(),
        }));
      } catch {
        // ignore network error
      }
    } else {
      const next = { ...guestFc, [cardId]: status };
      setGuestFc(next);
      try {
        localStorage.setItem(GUEST_FC_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
    setFlipped(false);
    setCardIdx((i) => (i + 1) % Math.max(1, filteredCards.length));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Searchable FX Glossary &amp; Flashcard Studio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {ACADEMY_GLOSSARY.length} verified terminology entries · {masteredCount} of {ACADEMY_FLASHCARDS.length} flashcards mastered
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setSubMode('glossary')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                subMode === 'glossary'
                  ? 'bg-[#881337] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Glossary ({filteredGlossary.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubMode('flashcards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                subMode === 'flashcards'
                  ? 'bg-[#881337] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcards ({ACADEMY_FLASHCARDS.length})</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          {subMode === 'glossary' && (
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search term, acronym (BOS, FVG, ATR, TIPS)..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white min-h-[40px]"
              />
            </div>
          )}

          <select
            value={catFilter}
            onChange={(e) => {
              setCatFilter(e.target.value);
              setCardIdx(0);
              setFlipped(false);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white min-h-[40px]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {subMode === 'glossary' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((item: GlossaryEntry) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-2"
              >
                <p className="text-[11px] font-medium text-[#881337] dark:text-rose-400">
                  {item.category}
                </p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.term}</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {item.fullExplanation}
                </p>
                {item.example && (
                  <p className="text-[11.5px] font-mono text-slate-500 dark:text-slate-400">
                    Example: {item.example}
                  </p>
                )}
              </article>
            ))}
            {filteredGlossary.length === 0 && (
              <p className="text-xs text-slate-500 col-span-full py-6 text-center">
                No glossary terms match "{search}".
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4 py-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
              <span>
                Card {(cardIdx % Math.max(1, filteredCards.length)) + 1} of {filteredCards.length} · {activeCard.category}
              </span>
              <span>
                Status: {fcProgress[activeCard.id] === 'mastered' ? 'Mastered' : fcProgress[activeCard.id] === 'review' ? 'Needs Review' : 'New'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFlipped((v) => !v)}
              className="w-full min-h-[220px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-6 text-left flex flex-col justify-between transition-colors hover:border-[#881337]/50"
            >
              <span className="text-[11px] font-mono text-[#881337] dark:text-rose-400">
                {flipped ? 'ANSWER / EXPLANATION' : 'PROMPT (Click to Flip)'}
              </span>
              <div className="py-4">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {flipped ? activeCard.back : activeCard.front}
                </p>
                {!flipped && activeCard.hint && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Hint: {activeCard.hint}
                  </p>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {flipped ? 'Rate your recall below to advance' : 'Tap card to reveal answer'}
              </span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setFlipped(false);
                  setCardIdx((i) => (i - 1 + filteredCards.length) % filteredCards.length);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 min-h-[40px]"
              >
                Previous Card
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => markCard(activeCard.id, 'review')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/20 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 min-h-[40px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Need Review</span>
                </button>
                <button
                  type="button"
                  onClick={() => markCard(activeCard.id, 'mastered')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534] min-h-[40px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mastered</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
