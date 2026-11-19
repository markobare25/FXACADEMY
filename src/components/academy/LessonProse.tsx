import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Pause, Play, Square, Volume2, X } from 'lucide-react';
import { ACADEMY_GLOSSARY, type GlossaryEntry } from '../../data/glossaryData';

interface LessonProseProps {
  text: string;
  textSize: 'sm' | 'base' | 'lg';
}

const TERM_LOOKUP = new Map<string, GlossaryEntry>();
const MATCHABLE_PHRASES: string[] = [];

for (const entry of ACADEMY_GLOSSARY) {
  const keys = [entry.term, ...(entry.aliases || [])];
  for (const k of keys) {
    const clean = k.trim();
    if (clean.length >= 3) {
      TERM_LOOKUP.set(clean.toLowerCase(), entry);
      MATCHABLE_PHRASES.push(clean);
    }
  }
}

MATCHABLE_PHRASES.sort((a, b) => b.length - a.length);
const ESCAPED = MATCHABLE_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const TERM_REGEX = new RegExp(`\\b(${ESCAPED.join('|')})\\b`, 'gi');

function ParagraphWithGlossary({
  paragraph,
  onSelectTerm,
}: {
  paragraph: string;
  onSelectTerm: (entry: GlossaryEntry) => void;
}) {
  const nodes = useMemo(() => {
    const parts: React.ReactNode[] = [];
    const seenInParagraph = new Set<string>();
    let lastIdx = 0;
    const regex = new RegExp(TERM_REGEX.source, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(paragraph)) !== null) {
      const matchedText = match[0];
      const entry = TERM_LOOKUP.get(matchedText.toLowerCase());
      if (!entry || seenInParagraph.has(entry.id)) {
        continue;
      }
      seenInParagraph.add(entry.id);

      if (match.index > lastIdx) {
        parts.push(paragraph.slice(lastIdx, match.index));
      }
      parts.push(
        <button
          key={`${entry.id}-${match.index}`}
          type="button"
          onClick={() => onSelectTerm(entry)}
          className="underline decoration-dotted decoration-[#881337]/60 dark:decoration-rose-400/60 underline-offset-4 font-medium text-slate-900 dark:text-slate-100 hover:text-[#881337] dark:hover:text-rose-300 transition-colors"
          title={`Click for glossary definition: ${entry.term}`}
        >
          {matchedText}
        </button>
      );
      lastIdx = match.index + matchedText.length;
    }

    if (lastIdx < paragraph.length) {
      parts.push(paragraph.slice(lastIdx));
    }
    return parts.length > 0 ? parts : [paragraph];
  }, [paragraph, onSelectTerm]);

  return <>{nodes}</>;
}

export const LessonProse: React.FC<LessonProseProps> = ({ text, textSize }) => {
  const [activeEntry, setActiveEntry] = useState<GlossaryEntry | null>(null);

  const paragraphs = useMemo(
    () =>
      text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [text]
  );

  const sizeClass =
    textSize === 'lg'
      ? 'text-[17px] leading-[1.8]'
      : textSize === 'base'
      ? 'text-[15.5px] leading-[1.72]'
      : 'text-sm leading-[1.65]';

  return (
    <div className="space-y-4">
      {activeEntry && (
        <div
          role="dialog"
          aria-label={`Glossary term: ${activeEntry.term}`}
          className="rounded-xl border border-[#881337]/30 bg-rose-50/70 dark:bg-rose-950/20 p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#881337] dark:text-rose-400">
                Glossary · {activeEntry.category}
              </p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{activeEntry.term}</h4>
            </div>
            <button
              type="button"
              onClick={() => setActiveEntry(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close glossary definition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {activeEntry.fullExplanation}
          </p>
          {activeEntry.example && (
            <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
              Example: {activeEntry.example}
            </p>
          )}
        </div>
      )}

      <div className={`space-y-4 text-slate-700 dark:text-slate-300 ${sizeClass}`}>
        {paragraphs.map((block, idx) => {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          const isList = lines.length > 1 && lines.every((l) => /^(\d+\.|[-•*])\s/.test(l));

          if (isList) {
            return (
              <ul key={idx} className="space-y-2 pl-5 list-disc">
                {lines.map((line, lIdx) => (
                  <li key={lIdx}>
                    <ParagraphWithGlossary
                      paragraph={line.replace(/^(\d+\.|[-•*])\s+/, '')}
                      onSelectTerm={setActiveEntry}
                    />
                  </li>
                ))}
              </ul>
            );
          }

          return (
            <p key={idx}>
              <ParagraphWithGlossary paragraph={block} onSelectTerm={setActiveEntry} />
            </p>
          );
        })}
      </div>
    </div>
  );
};

interface LessonAudioControlsProps {
  title: string;
  narrationText: string;
  audioUrl?: string | null;
  transcript?: string | null;
}

export const LessonAudioControls: React.FC<LessonAudioControlsProps> = ({
  title,
  narrationText,
  audioUrl,
  transcript,
}) => {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      if (hasSpeech) window.speechSynthesis.cancel();
    };
  }, [title, hasSpeech]);

  const handlePlaySpeech = () => {
    if (!hasSpeech) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setSpeaking(true);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(`${title}. ${narrationText}`);
    utter.rate = rate;
    utter.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utter.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
    setPaused(false);
  };

  const handlePauseSpeech = () => {
    if (!hasSpeech) return;
    window.speechSynthesis.pause();
    setPaused(true);
  };

  const handleStopSpeech = () => {
    if (!hasSpeech) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
          <Volume2 className="w-4 h-4 text-[#881337] dark:text-rose-400" />
          <span>Audio Study Mode</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasSpeech && (
            <>
              {!speaking || paused ? (
                <button
                  type="button"
                  onClick={handlePlaySpeech}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#881337] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[36px]"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{paused ? 'Resume Audio' : 'Listen to Lesson'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseSpeech}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 min-h-[36px]"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}

              {(speaking || paused) && (
                <button
                  type="button"
                  onClick={handleStopSpeech}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 min-h-[36px]"
                >
                  <Square className="w-3 h-3" />
                  <span>Stop</span>
                </button>
              )}

              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                aria-label="Narration speed"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-200 min-h-[36px]"
              >
                <option value={0.9}>0.9x</option>
                <option value={1}>1.0x</option>
                <option value={1.2}>1.2x</option>
                <option value={1.4}>1.4x</option>
              </select>
            </>
          )}

          {transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 min-h-[36px]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{showTranscript ? 'Hide Transcript' : 'Transcript'}</span>
            </button>
          )}
        </div>
      </div>

      {audioUrl && (
        <audio src={audioUrl} controls className="w-full h-10" preload="metadata" />
      )}

      {showTranscript && transcript && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
          {transcript}
        </div>
      )}
    </div>
  );
};
