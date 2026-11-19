import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Bookmark,
  Calculator,
  CandlestickChart,
  CheckCircle2,
  Compass,
  GraduationCap,
  Layers,
  PlayCircle,
  Search,
} from 'lucide-react';
import { AcademyTools } from '../components/academy/AcademyTools';
import { ChartPracticeLab } from '../components/academy/ChartPracticeLab';
import { GlossaryAndFlashcards } from '../components/academy/GlossaryAndFlashcards';
import { LessonReaderView } from '../components/academy/LessonReaderView';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch } from '../lib/api';
import type { AcademyResumeState, Course, Lesson } from '../types';

export const ACADEMY_CATEGORIES = [
  'Introduction to Forex',
  'Understanding currency pairs',
  'Candlestick patterns',
  'Technical analysis',
  'Fundamental analysis',
  'Support and Resistance',
  'Trendlines',
  'Indicators and Oscillators',
  'Price Action',
  'Trading Strategies',
  'Risk Management',
  'Trading Psychology',
  'Gold Trading (XAUUSD)',
  'Cryptocurrency Trading',
  'Advanced Trading Techniques',
];

type AcademySectionTab = 'curriculum' | 'tools' | 'practice' | 'glossary' | 'progress';
type PathFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Essential';

export const AcademyPage: React.FC = () => {
  const { user, courses, setCourses, resumeState, setResumeState, navigate } = usePlatform();
  const [sectionTab, setSectionTab] = useState<AcademySectionTab>('curriculum');
  const [pathFilter, setPathFilter] = useState<PathFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedScrollPct, setSelectedScrollPct] = useState<number>(0);

  const guestResume: { last_course_id?: string; last_lesson_id?: string; last_scroll_pct?: number } | null =
    useMemo(() => {
      if (user) return null;
      try {
        const raw = localStorage.getItem('mfx_guest_resume_v1');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }, [user]);

  const activeResumeCourse = useMemo(() => {
    const cId = user ? resumeState?.last_course_id : guestResume?.last_course_id;
    const lId = user ? resumeState?.last_lesson_id : guestResume?.last_lesson_id;
    const pct = user ? resumeState?.last_scroll_pct || 0 : guestResume?.last_scroll_pct || 0;
    if (!cId) return null;
    const course = courses.find((c) => c.id === cId);
    if (!course) return null;
    const lesson = (course.lessons || []).find((l) => l.id === lId) || course.lessons?.[0];
    if (!lesson) return null;
    return { course, lesson, scrollPct: pct };
  }, [user, resumeState, guestResume, courses]);

  const selectedCourse: Course | null = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const sortedCourses = useMemo(
    () =>
      courses
        .slice()
        .sort((a, b) => (a.course_number || 999) - (b.course_number || 999)),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedCourses.filter((c) => {
      if (pathFilter === 'Beginner' && c.level !== 'Beginner') return false;
      if (pathFilter === 'Intermediate' && c.level !== 'Intermediate') return false;
      if (pathFilter === 'Advanced' && c.level !== 'Advanced') return false;
      if (pathFilter === 'Essential') {
        const num = c.course_number || 0;
        const isEssential = num === 1 || num === 2 || num === 11 || num === 12;
        if (!isEssential) return false;
      }

      if (categoryFilter !== 'All') {
        const matchCat =
          c.category.toLowerCase() === categoryFilter.toLowerCase() ||
          (c.lessons || []).some((l) => l.category.toLowerCase() === categoryFilter.toLowerCase());
        if (!matchCat) return false;
      }

      if (q) {
        const inCourse =
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q);
        const inLessons = (c.lessons || []).some(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.summary.toLowerCase().includes(q) ||
            (l.tags || []).some((t) => t.toLowerCase().includes(q))
        );
        if (!inCourse && !inLessons) return false;
      }
      return true;
    });
  }, [sortedCourses, pathFilter, categoryFilter, searchQuery]);

  const refreshCourses = async () => {
    const res = await apiFetch<{ courses: Course[]; resume_state?: AcademyResumeState | null }>(
      '/api/academy/courses'
    );
    setCourses(res.courses);
    if (res.resume_state !== undefined) {
      setResumeState(res.resume_state);
    }
  };

  const openCourse = (course: Course, targetLessonId?: string | null, scrollPct = 0) => {
    setSelectedCourseId(course.id);
    const ordered = (course.lessons || []).slice().sort((a, b) => a.order_index - b.order_index);
    const resolvedLessonId =
      targetLessonId || course.last_lesson_id || ordered[0]?.id || null;
    setSelectedLessonId(resolvedLessonId);
    setSelectedScrollPct(scrollPct);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleEnrollAndOpen = async (course: Course) => {
    if (!user) {
      openCourse(course);
      return;
    }
    await apiFetch(`/api/academy/courses/${course.id}/enroll`, { method: 'POST' });
    await refreshCourses();
    openCourse(course);
  };

  // Aggregate learner progress across all 15 courses
  const overallProgress = useMemo(() => {
    const totalLessons = courses.reduce((acc, c) => acc + (c.total_lessons || c.lessons?.length || 0), 0);
    const completedLessons = courses.reduce((acc, c) => acc + (c.completed_lessons || 0), 0);
    const passedCourses = courses.filter((c) => c.assessment_record?.passed);
    const bookmarkedLessons: Array<{ course: Course; lesson: Lesson }> = [];
    const needsReviewLessons: Array<{ course: Course; lesson: Lesson }> = [];

    for (const c of sortedCourses) {
      for (const l of c.lessons || []) {
        if (l.bookmarked) bookmarkedLessons.push({ course: c, lesson: l });
        if (l.needs_review) needsReviewLessons.push({ course: c, lesson: l });
      }
    }

    return {
      totalLessons,
      completedLessons,
      pct: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      passedCourses,
      bookmarkedLessons,
      needsReviewLessons,
    };
  }, [courses, sortedCourses]);

  if (selectedCourse) {
    return (
      <LessonReaderView
        course={selectedCourse}
        initialLessonId={selectedLessonId}
        initialScrollPct={selectedScrollPct}
        onBackToCatalog={() => {
          setSelectedCourseId(null);
          setSelectedLessonId(null);
          setSelectedScrollPct(0);
        }}
        onRefreshCourses={refreshCourses}
        onSelectLesson={(lid) => {
          setSelectedLessonId(lid);
          setSelectedScrollPct(0);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Academy Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <p className="text-xs font-semibold text-[#881337] dark:text-rose-400">
              MeridianFX Trading University · 15 Structured Courses · {overallProgress.totalLessons} Lessons
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Forex, Gold, Crypto &amp; Risk Engineering Academy
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Step-by-step curriculum designed from first currency quote to quantitative walk-forward testing. Educational content strictly separated from live MeridianFX signals and carries no financial advice or profit promises.
            </p>
          </div>

          {user && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-5 py-3.5 min-w-[220px] space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Overall Mastery</span>
                <span className="font-mono font-bold tabular-nums text-[#15803D] dark:text-emerald-400">
                  {overallProgress.pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#15803D] rounded-full"
                  style={{ width: `${overallProgress.pct}%` }}
                />
              </div>
              <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {overallProgress.completedLessons} / {overallProgress.totalLessons} lessons ·{' '}
                {overallProgress.passedCourses.length} assessments passed
              </p>
            </div>
          )}
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'curriculum' as const, label: 'Curriculum & Paths', icon: BookOpen },
            { id: 'tools' as const, label: 'Calculators & Simulators', icon: Calculator },
            { id: 'practice' as const, label: 'Chart Practice Lab', icon: CandlestickChart },
            { id: 'glossary' as const, label: 'Glossary & Flashcards', icon: Layers },
            { id: 'progress' as const, label: 'My Progress & Bookmarks', icon: Award },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSectionTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px] transition-colors ${
                  sectionTab === t.id
                    ? 'bg-[#881337] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resume Where You Left Off Banner */}
      {activeResumeCourse && sectionTab === 'curriculum' && (
        <div className="rounded-xl border border-[#881337]/30 bg-rose-50/50 dark:bg-rose-950/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-[#881337] dark:text-rose-400">
              Resume Where You Left Off · Last scroll {activeResumeCourse.scrollPct}%
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Course {String(activeResumeCourse.course.course_number || 1).padStart(2, '0')}:{' '}
              {activeResumeCourse.lesson.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {activeResumeCourse.course.title}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              openCourse(
                activeResumeCourse.course,
                activeResumeCourse.lesson.id,
                activeResumeCourse.scrollPct
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#881337] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[42px] shrink-0"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Continue Lesson</span>
          </button>
        </div>
      )}

      {/* TAB 1: CURRICULUM & LEARNING PATHS */}
      {sectionTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Learning Path Segmented Filter */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 w-fit">
              {[
                { id: 'All' as const, label: 'All 15 Courses' },
                { id: 'Beginner' as const, label: 'Beginner Path' },
                { id: 'Intermediate' as const, label: 'Intermediate Path' },
                { id: 'Advanced' as const, label: 'Advanced Path' },
                { id: 'Essential' as const, label: 'Essential Risk & Psych' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPathFilter(p.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    pathFilter === p.id
                      ? 'bg-[#881337] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses or lessons..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white min-h-[40px]"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs font-medium text-slate-900 dark:text-white max-w-full min-h-[40px]"
              >
                <option value="All">All 15 Curriculum Topics</option>
                {ACADEMY_CATEGORIES.map((cat, idx) => (
                  <option key={cat} value={cat}>
                    {String(idx + 1).padStart(2, '0')}. {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const total = course.total_lessons || course.lessons?.length || 0;
              const done = course.completed_lessons || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <article
                  key={course.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 bg-slate-100 dark:bg-slate-900 overflow-hidden">
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
                    <div className="p-5 space-y-2">
                      <p className="text-xs font-medium text-[#881337] dark:text-rose-400">
                        {course.level_label || course.level} · {total} Lessons ·{' '}
                        {course.estimated_hours || 3} hrs
                      </p>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {course.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 space-y-3">
                    {(course.enrolled || done > 0) && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Progress</span>
                          <span className="font-mono tabular-nums">
                            {done}/{total} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-[#15803D] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          course.enrolled
                            ? openCourse(course)
                            : handleEnrollAndOpen(course)
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
                            <span>{user ? 'Enroll & Study' : 'Start Studying'}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openCourse(course)}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[42px]"
                      >
                        Syllabus
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center space-y-2">
              <Compass className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-500">
                No courses match this learning path or search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPathFilter('All');
                  setCategoryFilter('All');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
              >
                Reset all Academy filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CALCULATORS & SIMULATORS */}
      {sectionTab === 'tools' && <AcademyTools />}

      {/* TAB 3: CHART PRACTICE LAB */}
      {sectionTab === 'practice' && <ChartPracticeLab />}

      {/* TAB 4: GLOSSARY & FLASHCARDS */}
      {sectionTab === 'glossary' && <GlossaryAndFlashcards />}

      {/* TAB 5: MY PROGRESS, COMPLETION RECORDS & BOOKMARKS */}
      {sectionTab === 'progress' && (
        <div className="space-y-6">
          {!user && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Sync Your Progress Across Devices
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sign in to persist lesson completions, quiz scores, bookmarks, and completion records across mobile, tablet, and desktop.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white min-h-[40px]"
              >
                Sign In to MeridianFX
              </button>
            </div>
          )}

          {/* Flagged Review Lessons */}
          {overallProgress.needsReviewLessons.length > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20 p-5 space-y-3">
              <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Updated Lessons Recommended for Review ({overallProgress.needsReviewLessons.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overallProgress.needsReviewLessons.map(({ course, lesson }) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => openCourse(course, lesson.id)}
                    className="text-left rounded-lg border border-amber-500/30 bg-white dark:bg-slate-900 p-3 hover:border-[#881337]"
                  >
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {lesson.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {course.title} · {lesson.needs_review_note || 'Updated curriculum'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookmarked Lessons */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                <span>Bookmarked Lessons ({overallProgress.bookmarkedLessons.length})</span>
              </h2>
              {overallProgress.bookmarkedLessons.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  No bookmarked lessons yet. Click Bookmark inside any lesson to save it here.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {overallProgress.bookmarkedLessons.map(({ course, lesson }) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => openCourse(course, lesson.id)}
                      className="w-full py-3 text-left flex items-center justify-between gap-3 hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {lesson.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{course.title}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#881337] dark:text-rose-400 shrink-0">
                        Open
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Course Completion Records */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
                <span>Course Mastery &amp; Completion Records ({overallProgress.passedCourses.length})</span>
              </h2>
              {overallProgress.passedCourses.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  Complete all lessons and score ≥70% on a Course Final Assessment to unlock its Educational Completion Record.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {overallProgress.passedCourses.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {c.title}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500">
                          Best Score: {c.assessment_record?.best_score}% · ID: {c.assessment_record?.certificate_id}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCourse(c)}
                        className="text-xs font-semibold text-[#15803D] dark:text-emerald-400 shrink-0 hover:underline"
                      >
                        Open Record
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
