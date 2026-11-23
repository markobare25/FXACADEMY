import React, { useMemo, useRef, useState } from 'react';
import { GraduationCap, PlayCircle } from 'lucide-react';
import { LessonReaderView } from '../components/academy/LessonReaderView';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch } from '../lib/api';
import type { AcademyResumeState, Course } from '../types';

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

type PathFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';

const FOOTER_PATH_BUTTONS: Array<{ id: PathFilter; label: string }> = [
  { id: 'All', label: 'All 15 Courses' },
  { id: 'Beginner', label: 'Beginner' },
  { id: 'Intermediate', label: 'Intermediate' },
  { id: 'Advanced', label: 'Advanced' },
];

export const AcademyPage: React.FC = () => {
  const { user, courses, setCourses, setResumeState } = usePlatform();
  const [pathFilter, setPathFilter] = useState<PathFilter>('All');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedScrollPct, setSelectedScrollPct] = useState<number>(0);
  const coursesTopRef = useRef<HTMLDivElement | null>(null);

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
    if (pathFilter === 'All') return sortedCourses;
    return sortedCourses.filter((c) => c.level === pathFilter);
  }, [sortedCourses, pathFilter]);

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

  const handleSelectFooterPath = (path: PathFilter) => {
    setPathFilter(path);
    if (coursesTopRef.current) {
      coursesTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
    <div ref={coursesTopRef} className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Academy
        </h1>
        <span className="text-xs font-semibold text-[#881337] dark:text-rose-400">
          {FOOTER_PATH_BUTTONS.find((b) => b.id === pathFilter)?.label} ({filteredCourses.length})
        </span>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <div className="p-5 space-y-1.5">
                  <p className="text-xs font-medium text-[#881337] dark:text-rose-400">
                    {course.level} · {total} Lessons
                  </p>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {course.title}
                  </h2>
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

                <button
                  type="button"
                  onClick={() =>
                    course.enrolled ? openCourse(course) : handleEnrollAndOpen(course)
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#15803D] py-2.5 px-4 text-xs font-semibold text-white hover:bg-[#166534] transition-colors min-h-[44px]"
                >
                  {course.enrolled ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>{done > 0 ? 'Resume Course' : 'Open Course'}</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4" />
                      <span>Open Course</span>
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Footer Navigation Buttons: Only All 15 Courses, Beginner, Intermediate, Advanced */}
      <footer
        aria-label="Academy course levels"
        className="sticky bottom-16 lg:bottom-0 z-20 -mx-4 sm:mx-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B101B]/95 backdrop-blur-md px-3 py-2.5 sm:rounded-2xl sm:border"
      >
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {FOOTER_PATH_BUTTONS.map((btn) => {
            const active = pathFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleSelectFooterPath(btn.id)}
                className={`px-2 py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap truncate min-h-[44px] transition-colors ${
                  active
                    ? 'bg-[#881337] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
