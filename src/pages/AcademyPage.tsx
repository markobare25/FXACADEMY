import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  PlayCircle,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch } from '../lib/api';
import type { Course, CourseLevel, Lesson } from '../types';

export const ACADEMY_CATEGORIES = [
  'Introduction to Forex',
  'Understanding currency pairs',
  'Candlestick patterns',
  'Technical analysis',
  'Fundamental analysis',
  'Support and resistance',
  'Trendlines',
  'Indicators and oscillators',
  'Price action',
  'Trading strategies',
  'Risk management',
  'Trading psychology',
  'Gold trading',
  'Cryptocurrency trading',
  'Advanced trading techniques',
];

export const AcademyPage: React.FC = () => {
  const { user, courses, setCourses, navigate } = usePlatform();
  const [levelFilter, setLevelFilter] = useState<'All' | CourseLevel>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);

  const selectedCourse: Course | null = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const selectedLesson: Lesson | null = useMemo(() => {
    if (!selectedCourse?.lessons) return null;
    return (
      selectedCourse.lessons.find((l) => l.id === selectedLessonId) ||
      selectedCourse.lessons[0] ||
      null
    );
  }, [selectedCourse, selectedLessonId]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (levelFilter !== 'All' && c.level !== levelFilter) return false;
      if (categoryFilter !== 'All') {
        const hasCat =
          c.category === categoryFilter ||
          (c.lessons || []).some((l) => l.category === categoryFilter);
        if (!hasCat) return false;
      }
      return true;
    });
  }, [courses, levelFilter, categoryFilter]);

  const refreshCourses = async () => {
    const res = await apiFetch<{ courses: Course[] }>('/api/academy/courses');
    setCourses(res.courses);
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    await apiFetch(`/api/academy/courses/${courseId}/enroll`, { method: 'POST' });
    await refreshCourses();
    setSelectedCourseId(courseId);
  };

  const handleLessonAction = async (
    lesson: Lesson,
    payload: { completed?: boolean; bookmarked?: boolean; quiz_answers?: number[] }
  ) => {
    if (!user) {
      navigate('/login');
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
        body: JSON.stringify(payload),
      });
      if (payload.quiz_answers && res.quiz_score !== null) {
        setQuizFeedback(`Quiz submitted: ${res.quiz_score}% score saved to your learning profile.`);
      }
      await refreshCourses();
    } finally {
      setSavingProgress(false);
    }
  };

  if (selectedCourse) {
    const lessons = selectedCourse.lessons || [];
    const activeLesson = selectedLesson;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedCourseId(null);
              setSelectedLessonId(null);
              setQuizAnswers({});
              setQuizFeedback(null);
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Academy</span>
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selectedCourse.level} · {selectedCourse.completed_lessons || 0} of{' '}
            {selectedCourse.total_lessons || lessons.length} lessons completed
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lesson List */}
          <aside className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-2 h-fit">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white px-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              {selectedCourse.title}
            </h2>
            {lessons.map((l, idx) => {
              const isCurrent = activeLesson?.id === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setSelectedLessonId(l.id);
                    setQuizAnswers({});
                    setQuizFeedback(null);
                  }}
                  className={`w-full text-left rounded-xl p-3 transition-colors flex items-start justify-between gap-3 ${
                    isCurrent
                      ? 'bg-rose-50 text-[#881337] dark:bg-rose-950/30 dark:text-rose-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {idx + 1}. {l.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {l.category} · {l.duration_minutes}m
                    </p>
                  </div>
                  {l.completed && <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </aside>

          {/* Lesson Reader */}
          <section className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-6">
            {activeLesson ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <p className="text-xs text-[#881337] dark:text-rose-400 font-semibold">
                      {activeLesson.category} · {activeLesson.duration_minutes} min read
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                      {activeLesson.title}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={savingProgress}
                      onClick={() =>
                        handleLessonAction(activeLesson, { bookmarked: !activeLesson.bookmarked })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium min-h-[40px] ${
                        activeLesson.bookmarked
                          ? 'border-[#881337] bg-rose-50 text-[#881337] dark:bg-rose-950/30 dark:text-rose-300'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>{activeLesson.bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={savingProgress}
                      onClick={() =>
                        handleLessonAction(activeLesson, { completed: !activeLesson.completed })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold min-h-[40px] ${
                        activeLesson.completed
                          ? 'bg-[#15803D] text-white'
                          : 'bg-[#881337] text-white hover:bg-[#6B0F2B]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{activeLesson.completed ? 'Completed' : 'Mark Complete'}</span>
                    </button>
                  </div>
                </div>

                {activeLesson.image_url && (
                  <img
                    src={activeLesson.image_url}
                    alt={activeLesson.title}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-72 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                  />
                )}

                {activeLesson.video_url && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                    <video src={activeLesson.video_url} controls className="w-full max-h-80" />
                  </div>
                )}

                {activeLesson.pdf_url && (
                  <a
                    href={activeLesson.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <FileText className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                    <span>Download Lesson PDF Guide</span>
                  </a>
                )}

                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {activeLesson.content}
                </div>

                {/* Interactive Quiz */}
                {activeLesson.quiz && activeLesson.quiz.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Knowledge Check Quiz
                      </h3>
                      {activeLesson.quiz_score !== null && activeLesson.quiz_score !== undefined && (
                        <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Best Score: {activeLesson.quiz_score}%
                        </span>
                      )}
                    </div>

                    {activeLesson.quiz.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
                      >
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`q-${qIdx}`}
                                checked={quizAnswers[qIdx] === optIdx}
                                onChange={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                                className="accent-[#881337]"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    {quizFeedback && (
                      <p className="text-xs font-semibold text-[#15803D] dark:text-emerald-400">
                        {quizFeedback}
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={savingProgress}
                      onClick={() => {
                        const arr = activeLesson.quiz.map((_, i) => quizAnswers[i] ?? -1);
                        handleLessonAction(activeLesson, { completed: true, quiz_answers: arr });
                      }}
                      className="rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
                    >
                      Submit Quiz Answers
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">No lessons added to this course yet.</p>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Forex Trading Academy
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Structured curriculum from foundational market mechanics to institutional macro and risk engineering. Cached automatically for offline study.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
          {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                levelFilter === lvl
                  ? 'bg-[#881337] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs font-medium text-slate-900 dark:text-white max-w-full"
        >
          <option value="All">All 15 Academy Topics</option>
          {ACADEMY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const total = course.total_lessons || 0;
          const done = course.completed_lessons || 0;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <article
              key={course.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="h-44 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <img
                    src={
                      course.cover_image_url ||
                      '/src/assets/images/academy_forex_cover_1795085836938.jpg'
                    }
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium text-[#881337] dark:text-rose-400">
                    {course.level} · {course.category} · {total} Lessons
                  </p>
                  <h2 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
                    {course.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 space-y-3">
                {course.enrolled && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Progress</span>
                      <span className="font-mono tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-[#15803D] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      course.enrolled ? setSelectedCourseId(course.id) : handleEnroll(course.id)
                    }
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#15803D] py-2.5 px-4 text-xs font-semibold text-white hover:bg-[#166534] transition-colors min-h-[42px]"
                  >
                    {course.enrolled ? (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        <span>{done > 0 ? 'Resume Course' : 'Start Lessons'}</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-4 h-4" />
                        <span>Enroll & Study</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[42px]"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">
            No courses match this topic or level filter yet.
          </p>
        </div>
      )}
    </div>
  );
};
