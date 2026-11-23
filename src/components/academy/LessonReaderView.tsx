import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  FileText,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { AcademyVisuals } from './AcademyVisuals';
import { CourseAssessmentPanel } from './CourseAssessmentPanel';
import { LessonAudioControls, LessonProse } from './LessonProse';
import { usePlatform } from '../../context/PlatformContext';
import { apiFetch, formatLocalDateTime } from '../../lib/api';
import type { Course, Lesson } from '../../types';

interface LessonReaderViewProps {
  course: Course;
  initialLessonId?: string | null;
  initialScrollPct?: number;
  onBackToCatalog: () => void;
  onRefreshCourses: () => Promise<void>;
  onSelectLesson: (lessonId: string) => void;
}

const GUEST_PROGRESS_KEY = 'mfx_guest_lesson_progress_v1';

export const LessonReaderView: React.FC<LessonReaderViewProps> = ({
  course,
  initialLessonId,
  initialScrollPct = 0,
  onBackToCatalog,
  onRefreshCourses,
  onSelectLesson,
}) => {
  const { user, navigate, setResumeState } = usePlatform();
  const lessons = useMemo(
    () => (course.lessons || []).slice().sort((a, b) => a.order_index - b.order_index),
    [course.lessons]
  );

  const [showAssessment, setShowAssessment] = useState(false);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [scrollPct, setScrollPct] = useState(0);

  // Report Content Issue
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  // Guest fallback local progress
  const [guestProgress, setGuestProgress] = useState<
    Record<string, { completed?: boolean; bookmarked?: boolean; quiz_score?: number }>
  >(() => {
    try {
      const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const activeLesson: Lesson | null = useMemo(() => {
    if (lessons.length === 0) return null;
    return lessons.find((l) => l.id === initialLessonId) || lessons[0];
  }, [lessons, initialLessonId]);

  const activeIndex = activeLesson ? lessons.findIndex((l) => l.id === activeLesson.id) : -1;
  const prevLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  const readerRef = useRef<HTMLDivElement>(null);
  const restoredScrollRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  // Reset per-lesson UI states when switching lesson
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizFeedback(null);
    setCheckedSteps({});
    setReportStatus(null);
  }, [activeLesson?.id]);

  // Restore scroll position once when opening lesson with saved scroll_pct
  useEffect(() => {
    if (!activeLesson || showAssessment) return;
    if (restoredScrollRef.current === activeLesson.id) return;
    restoredScrollRef.current = activeLesson.id;

    const targetPct = activeLesson.scroll_pct || initialScrollPct || 0;
    if (targetPct > 5 && targetPct < 98) {
      window.setTimeout(() => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 200) {
          window.scrollTo({ top: Math.round((targetPct / 100) * docHeight), behavior: 'smooth' });
        }
      }, 180);
    }
  }, [activeLesson, initialScrollPct, showAssessment]);

  // Track reading scroll & auto-save resume state
  useEffect(() => {
    if (!activeLesson || showAssessment) return;

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100))) : 0;
      setScrollPct(pct);

      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        const payload = {
          last_course_id: course.id,
          last_lesson_id: activeLesson.id,
          last_scroll_pct: pct,
        };
        if (user) {
          apiFetch('/api/academy/resume', {
            method: 'PUT',
            body: JSON.stringify(payload),
          }).catch(() => undefined);
          setResumeState((prev) => ({
            last_course_id: course.id,
            last_lesson_id: activeLesson.id,
            last_scroll_pct: pct,
            flashcard_progress: prev?.flashcard_progress || {},
            updated_at: new Date().toISOString(),
          }));
        } else {
          try {
            localStorage.setItem('mfx_guest_resume_v1', JSON.stringify(payload));
          } catch {
            // ignore
          }
        }
      }, 900);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [activeLesson, course.id, showAssessment, user, setResumeState]);

  const handleLessonAction = async (
    lesson: Lesson,
    payload: { completed?: boolean; bookmarked?: boolean; quiz_answers?: number[]; clear_review?: boolean }
  ) => {
    if (!user) {
      if (payload.quiz_answers && lesson.quiz.length > 0) {
        let correct = 0;
        lesson.quiz.forEach((q, idx) => {
          if (payload.quiz_answers![idx] === q.correct_index) correct++;
        });
        const pct = Math.round((correct / lesson.quiz.length) * 100);
        const nextGuest = {
          ...guestProgress,
          [lesson.id]: {
            ...guestProgress[lesson.id],
            completed: true,
            quiz_score: pct,
          },
        };
        setGuestProgress(nextGuest);
        localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(nextGuest));
        setQuizSubmitted(true);
        setQuizFeedback(`Score: ${pct}% (Saved locally on this browser — sign in to sync across devices).`);
        return;
      }

      if (payload.completed !== undefined || payload.bookmarked !== undefined) {
        const nextGuest = {
          ...guestProgress,
          [lesson.id]: {
            ...guestProgress[lesson.id],
            ...(payload.completed !== undefined ? { completed: payload.completed } : {}),
            ...(payload.bookmarked !== undefined ? { bookmarked: payload.bookmarked } : {}),
          },
        };
        setGuestProgress(nextGuest);
        localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(nextGuest));
        return;
      }
      navigate('/profile');
      return;
    }

    setSavingProgress(true);
    try {
      const res = await apiFetch<{
        completed: boolean;
        bookmarked: boolean;
        quiz_score: number | null;
      }>(`/api/academy/lessons/${lesson.id}/progress`, {
        method: 'POST',
        body: JSON.stringify({ ...payload, scroll_pct: scrollPct }),
      });
      if (payload.quiz_answers && res.quiz_score !== null) {
        setQuizSubmitted(true);
        setQuizFeedback(`Quiz score ${res.quiz_score}% saved to your learning profile.`);
      }
      await onRefreshCourses();
    } finally {
      setSavingProgress(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLesson || reportReason.trim().length < 5) return;
    try {
      await apiFetch(`/api/academy/lessons/${activeLesson.id}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason: reportReason.trim() }),
      });
      setReportStatus('Report submitted to Academy Editorial Desk. Thank you.');
      setReportReason('');
      setTimeout(() => setShowReportModal(false), 1600);
    } catch (err) {
      setReportStatus(err instanceof Error ? err.message : 'Unable to submit report.');
    }
  };

  const isCompleted = activeLesson
    ? user
      ? Boolean(activeLesson.completed)
      : Boolean(guestProgress[activeLesson.id]?.completed)
    : false;

  const isBookmarked = activeLesson
    ? user
      ? Boolean(activeLesson.bookmarked)
      : Boolean(guestProgress[activeLesson.id]?.bookmarked)
    : false;

  const savedQuizScore = activeLesson
    ? user
      ? activeLesson.quiz_score
      : guestProgress[activeLesson.id]?.quiz_score ?? null
    : null;

  const narrationText = activeLesson
    ? [
        activeLesson.learning_objective ? `Learning Objective: ${activeLesson.learning_objective}` : '',
        activeLesson.introduction || '',
        activeLesson.content,
        activeLesson.demonstration ? `Step-by-step demonstration: ${activeLesson.demonstration}` : '',
        activeLesson.summary_recap ? `Lesson summary: ${activeLesson.summary_recap}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')
    : '';

  return (
    <div ref={readerRef} className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All 15 Courses</span>
        </button>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{course.level_label || course.level}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {course.completed_lessons || 0} / {course.total_lessons || lessons.length} lessons completed
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">Scroll {scrollPct}%</span>
        </div>
      </div>

      {/* Course Overview Strip */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <p className="text-xs font-medium text-[#881337] dark:text-rose-400">
              Course {String(course.course_number || 1).padStart(2, '0')} · {course.category} ·{' '}
              {course.estimated_hours ? `${course.estimated_hours} hrs est.` : 'Self-paced'}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {course.description}
            </p>
          </div>

          {course.assessment && course.assessment.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAssessment((v) => !v)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold min-h-[40px] shrink-0 transition-colors ${
                showAssessment
                  ? 'bg-[#881337] text-white'
                  : 'border border-[#881337] text-[#881337] dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              {showAssessment ? 'Return to Lessons' : `Course Assessment (${course.assessment.length} Qs)`}
            </button>
          )}
        </div>

        {(course.prerequisites || (course.learning_outcomes && course.learning_outcomes.length > 0)) && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
            {course.prerequisites && (
              <p>
                <strong className="text-slate-800 dark:text-slate-100">Prerequisites:</strong>{' '}
                {course.prerequisites}
              </p>
            )}
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <p>
                <strong className="text-slate-800 dark:text-slate-100">Core Outcomes:</strong>{' '}
                {course.learning_outcomes.join(' · ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Layout: Sidebar Syllabus + Lesson Reader / Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-2">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Course Syllabus</h2>
            <span className="text-xs font-mono text-slate-500">{lessons.length} lessons</span>
          </div>

          <div className="space-y-1 max-h-[65vh] overflow-y-auto pr-1">
            {lessons.map((l, idx) => {
              const isCurrent = !showAssessment && activeLesson?.id === l.id;
              const done = user ? Boolean(l.completed) : Boolean(guestProgress[l.id]?.completed);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setShowAssessment(false);
                    onSelectLesson(l.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full text-left rounded-lg p-3 transition-colors flex items-start justify-between gap-2.5 min-h-[44px] ${
                    isCurrent
                      ? 'bg-rose-50 text-[#881337] dark:bg-rose-950/30 dark:text-rose-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-snug">
                      {idx + 1}. {l.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {l.duration_minutes}m read
                      {l.quiz?.length ? ` · ${l.quiz.length}Q check` : ''}
                      {l.needs_review ? ' · Updated' : ''}
                    </p>
                  </div>
                  {done && (
                    <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {course.assessment && course.assessment.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAssessment(true)}
              className={`w-full text-left rounded-lg p-3 border text-xs font-semibold transition-colors min-h-[44px] ${
                showAssessment
                  ? 'border-[#881337] bg-[#881337] text-white'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
              }`}
            >
              Final Course Assessment ({course.assessment.length} Questions)
            </button>
          )}
        </aside>

        <section className="lg:col-span-8 space-y-6">
          {showAssessment ? (
            <CourseAssessmentPanel course={course} onAssessmentSaved={onRefreshCourses} />
          ) : activeLesson ? (
            <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-7 space-y-6">
              {/* Lesson Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="space-y-1.5 max-w-2xl">
                  <p className="text-xs font-medium text-[#881337] dark:text-rose-400">
                    Lesson {activeIndex + 1} of {lessons.length} · {activeLesson.category} ·{' '}
                    {activeLesson.duration_minutes} min study
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {activeLesson.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {activeLesson.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Text Size */}
                  <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                    {(['sm', 'base', 'lg'] as const).map((sz, idx) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setTextSize(sz)}
                        className={`px-2.5 py-1 text-xs font-mono rounded-md ${
                          textSize === sz
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'text-slate-500'
                        }`}
                        title={`Text size: ${sz}`}
                      >
                        {idx === 0 ? 'A-' : idx === 1 ? 'A' : 'A+'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={savingProgress}
                    onClick={() => handleLessonAction(activeLesson, { bookmarked: !isBookmarked })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium min-h-[40px] ${
                      isBookmarked
                        ? 'border-[#881337] bg-rose-50 text-[#881337] dark:bg-rose-950/30 dark:text-rose-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingProgress}
                    onClick={() => handleLessonAction(activeLesson, { completed: !isCompleted })}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold min-h-[40px] ${
                      isCompleted
                        ? 'bg-[#15803D] text-white'
                        : 'bg-[#881337] text-white hover:bg-[#6B0F2B]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
                  </button>
                </div>
              </div>

              {/* Needs Review Banner if Admin Updated Materially */}
              {activeLesson.needs_review && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Updated Lesson Material (v{activeLesson.material_version || 2})</p>
                      <p>{activeLesson.needs_review_note || 'Curriculum was updated since your completion.'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLessonAction(activeLesson, { clear_review: true })}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Mark Reviewed
                  </button>
                </div>
              )}

              {/* 1. Learning Objective */}
              {activeLesson.learning_objective && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-1">
                  <p className="text-xs font-bold text-[#881337] dark:text-rose-400">
                    Learning Objective
                  </p>
                  <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                    {activeLesson.learning_objective}
                  </p>
                </div>
              )}

              {/* 2. Audio Narration & Transcript */}
              <LessonAudioControls
                title={activeLesson.title}
                narrationText={narrationText}
                audioUrl={activeLesson.audio_url}
                transcript={activeLesson.transcript}
              />

              {/* 3. Simple Introduction */}
              {activeLesson.introduction && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Simple Introduction
                  </h3>
                  <LessonProse text={activeLesson.introduction} textSize={textSize} />
                </div>
              )}

              {/* 4. Visual Diagram & Media */}
              <AcademyVisuals
                visualKey={activeLesson.visual_key}
                imageUrl={activeLesson.image_url}
                title={activeLesson.title}
              />

              {activeLesson.video_url && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                  <video src={activeLesson.video_url} controls className="w-full max-h-96" />
                </div>
              )}

              {activeLesson.pdf_url && (
                <div>
                  <a
                    href={activeLesson.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <FileText className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                    <span>Open Attached Lesson PDF Guide</span>
                  </a>
                </div>
              )}

              {/* 5. Detailed Explanation (Interactive Glossary Terms Highlighted) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Core Concept &amp; Detailed Explanation
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click any dotted term for its glossary definition
                  </span>
                </div>
                <LessonProse text={activeLesson.content} textSize={textSize} />
              </div>

              {/* 6. Step-by-Step Practical Demonstration */}
              {activeLesson.demonstration && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/15 p-5 space-y-2">
                  <h3 className="text-base font-bold text-[#15803D] dark:text-emerald-400">
                    Step-by-Step Practical Demonstration
                  </h3>
                  <LessonProse text={activeLesson.demonstration} textSize={textSize} />
                </div>
              )}

              {/* 7. Common Mistakes to Avoid */}
              {activeLesson.common_mistakes && activeLesson.common_mistakes.length > 0 && (
                <div className="rounded-xl border border-rose-500/25 bg-rose-50/40 dark:bg-rose-950/15 p-5 space-y-2.5">
                  <h3 className="text-base font-bold text-[#9F1239] dark:text-rose-400">
                    Common Mistakes to Avoid
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                    {activeLesson.common_mistakes.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 8. Lesson Summary */}
              {activeLesson.summary_recap && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-5 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lesson Summary</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeLesson.summary_recap}
                  </p>
                </div>
              )}

              {/* 9. Knowledge Check Quiz */}
              {activeLesson.quiz && activeLesson.quiz.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Knowledge Check Quiz
                    </h3>
                    {savedQuizScore !== null && savedQuizScore !== undefined && (
                      <span className="font-mono text-xs font-semibold text-[#15803D] dark:text-emerald-400">
                        Best Saved Score: {savedQuizScore}%
                      </span>
                    )}
                  </div>

                  {activeLesson.quiz.map((q, qIdx) => {
                    const picked = quizAnswers[qIdx];
                    const hasPicked = picked !== undefined;
                    const isCorrect = picked === q.correct_index;

                    return (
                      <div
                        key={q.id || qIdx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                      >
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const selected = picked === optIdx;
                            const showCorrectHighlight =
                              (hasPicked || quizSubmitted) && optIdx === q.correct_index;
                            const showWrongHighlight =
                              (hasPicked || quizSubmitted) && selected && optIdx !== q.correct_index;

                            return (
                              <label
                                key={optIdx}
                                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                                  showCorrectHighlight
                                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-900 dark:text-white'
                                    : showWrongHighlight
                                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-slate-900 dark:text-white'
                                    : selected
                                    ? 'border-[#881337] bg-slate-50 dark:bg-slate-900'
                                    : 'border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`lesson-q-${activeLesson.id}-${qIdx}`}
                                  checked={selected}
                                  onChange={() =>
                                    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))
                                  }
                                  className="mt-1 accent-[#881337]"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>

                        {hasPicked && (
                          <p
                            className={`text-xs leading-relaxed ${
                              isCorrect
                                ? 'text-[#15803D] dark:text-emerald-400'
                                : 'text-[#9F1239] dark:text-rose-400'
                            }`}
                          >
                            <strong>{isCorrect ? 'Correct:' : 'Review:'}</strong>{' '}
                            {q.explanation ||
                              `The correct option is "${q.options[q.correct_index]}".`}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {quizFeedback && (
                    <p className="text-xs font-semibold text-[#15803D] dark:text-emerald-400">
                      {quizFeedback}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={savingProgress}
                      onClick={() => {
                        const arr = activeLesson.quiz.map((_, i) => quizAnswers[i] ?? -1);
                        handleLessonAction(activeLesson, { completed: true, quiz_answers: arr });
                      }}
                      className="rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
                    >
                      Save Quiz &amp; Complete Lesson
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setQuizFeedback(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 min-h-[44px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Quiz</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 10. Practical Exercise */}
              {activeLesson.practical_exercise && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-5 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#881337] dark:text-rose-400">
                      Hands-On Practical Exercise
                    </p>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeLesson.practical_exercise.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {activeLesson.practical_exercise.objective}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {activeLesson.practical_exercise.steps.map((step, sIdx) => (
                      <label key={sIdx} className="flex items-start gap-2.5 text-xs sm:text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(checkedSteps[sIdx])}
                          onChange={(e) =>
                            setCheckedSteps((prev) => ({ ...prev, [sIdx]: e.target.checked }))
                          }
                          className="mt-1 accent-[#15803D]"
                        />
                        <span className={checkedSteps[sIdx] ? 'line-through text-slate-400' : ''}>
                          {step}
                        </span>
                      </label>
                    ))}
                  </div>

                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <strong>Deliverable:</strong> {activeLesson.practical_exercise.deliverable}
                  </p>
                </div>
              )}

              {/* 11. Sources, Updated Date & Educational Disclaimer */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3 text-xs text-slate-500 dark:text-slate-400">
                {activeLesson.sources && activeLesson.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Official Sources:
                    </span>
                    {activeLesson.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#881337] dark:text-rose-400 hover:underline"
                      >
                        <span>{src.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p>
                    Updated {formatLocalDateTime(activeLesson.updated_at || activeLesson.created_at)} ·
                    Educational content only — not financial advice or a live signal guarantee.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-[#881337] dark:hover:text-rose-400 font-medium"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report Content Issue</span>
                  </button>
                </div>
              </div>

              {/* 12. Prev / Next Lesson Navigation */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!prevLesson}
                  onClick={() => {
                    if (prevLesson) {
                      onSelectLesson(prevLesson.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{prevLesson ? `Previous: ${prevLesson.title}` : 'Start of Course'}</span>
                </button>

                {nextLesson ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLesson(nextLesson.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#881337] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
                  >
                    <span>Next: {nextLesson.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : course.assessment && course.assessment.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssessment(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#166534] min-h-[44px]"
                  >
                    <span>Proceed to Final Course Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </article>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500">
              No published lessons in this course yet.
            </div>
          )}
        </section>
      </div>

      {/* Report Content Modal */}
      {showReportModal && activeLesson && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <form
            onSubmit={handleReportSubmit}
            className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Report Lesson Content Issue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lesson: <strong>{activeLesson.title}</strong>. Flag any typo, unclear diagram, or outdated citation for the MeridianFX Editorial Team.
            </p>
            <textarea
              rows={4}
              required
              minLength={5}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue clearly..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
            {reportStatus && (
              <p className="text-xs font-semibold text-[#15803D] dark:text-emerald-400">
                {reportStatus}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white min-h-[40px]"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
