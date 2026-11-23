import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Eye,
  History,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ACADEMY_CATEGORIES } from '../../pages/AcademyPage';
import { ALL_VISUAL_KEYS, AcademyVisuals } from '../academy/AcademyVisuals';
import { formatLocalDateTime } from '../../lib/api';
import { adminApiFetch, adminUploadMediaFile } from '../../lib/adminApi';
import type {
  AcademyAuditLog,
  AcademyContentReport,
  ContentPublishStatus,
  Course,
  CourseLevel,
  Lesson,
  LessonVersion,
  QuizQuestion,
} from '../../types';

interface AdminAcademyManagerProps {
  studentProgress: Array<{
    id: string;
    name: string;
    email: string;
    courses_enrolled: number;
    lessons_completed: number;
    avg_quiz_score: number | null;
  }>;
  onNotify: (msg: string) => void;
  onError: (msg: string) => void;
  onGlobalRefresh: () => Promise<void>;
}

const EMPTY_QUIZ = (): QuizQuestion => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  question: '',
  options: ['', '', '', ''],
  correct_index: 0,
  explanation: '',
});

export const AdminAcademyManager: React.FC<AdminAcademyManagerProps> = ({
  studentProgress,
  onNotify,
  onError,
  onGlobalRefresh,
}) => {
  const [subTab, setSubTab] = useState<'cms' | 'reports' | 'students'>('cms');
  const [adminCourses, setAdminCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<AcademyAuditLog[]>([]);
  const [contentReports, setContentReports] = useState<AcademyContentReport[]>([]);

  // Course Editor State
  const [showCourseEditor, setShowCourseEditor] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: ACADEMY_CATEGORIES[0],
    level: 'Beginner' as CourseLevel,
    level_label: 'Beginner',
    prerequisites: 'None — open to beginners',
    learning_outcomes_text: '',
    estimated_hours: 3.0,
    status: 'published' as ContentPublishStatus,
    is_premium: false,
    cover_image_url: '',
  });

  // Lesson Editor State
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    course_id: '',
    title: '',
    category: ACADEMY_CATEGORIES[0],
    summary: '',
    learning_objective: '',
    introduction: '',
    content: '',
    demonstration: '',
    common_mistakes_text: '',
    summary_recap: '',
    exercise_title: '',
    exercise_objective: '',
    exercise_steps_text: '',
    exercise_deliverable: '',
    visual_key: '',
    video_url: '',
    audio_url: '',
    transcript: '',
    pdf_url: '',
    image_url: '',
    duration_minutes: 15,
    order_index: 1,
    status: 'published' as ContentPublishStatus,
    is_premium: false,
    scheduled_at: '',
    send_push: false,
    material_update: false,
    change_note: '',
  });
  const [quizItems, setQuizItems] = useState<QuizQuestion[]>([EMPTY_QUIZ()]);
  const [generatingImg, setGeneratingImg] = useState(false);

  // Preview & Version Modals
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile' | null>(null);
  const [versionsLessonTitle, setVersionsLessonTitle] = useState<string | null>(null);
  const [versionsList, setVersionsList] = useState<LessonVersion[]>([]);

  const loadAdminAcademy = useCallback(async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        adminApiFetch<{ courses: Course[] }>('/api/academy/courses?includeAll=true'),
        adminApiFetch<{ logs: AcademyAuditLog[]; reports: AcademyContentReport[] }>('/api/admin/academy/audit'),
      ]);
      const sorted = (cRes.courses || [])
        .slice()
        .sort((a, b) => (a.course_number || 999) - (b.course_number || 999));
      setAdminCourses(sorted);
      setAuditLogs(aRes.logs || []);
      setContentReports(aRes.reports || []);
      setSelectedCourseId((prev) => prev || sorted[0]?.id || '');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load Academy CMS data.');
    }
  }, [onError]);

  useEffect(() => {
    loadAdminAcademy();
  }, [loadAdminAcademy]);

  const activeCourse = useMemo(
    () => adminCourses.find((c) => c.id === selectedCourseId) || adminCourses[0] || null,
    [adminCourses, selectedCourseId]
  );

  const orderedLessons = useMemo(
    () =>
      (activeCourse?.lessons || []).slice().sort((a, b) => a.order_index - b.order_index),
    [activeCourse]
  );

  useEffect(() => {
    if (activeCourse && !editingLessonId) {
      setLessonForm((f) => ({
        ...f,
        course_id: activeCourse.id,
        category: activeCourse.category,
        order_index: (activeCourse.lessons?.length || 0) + 1,
      }));
    }
  }, [activeCourse, editingLessonId]);

  const handleUpload = async (file: File | undefined, cb: (url: string) => void) => {
    if (!file) return;
    try {
      const res = await adminUploadMediaFile(file);
      cb(res.url);
      onNotify(`Uploaded ${res.original_name}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'File upload failed.');
    }
  };

  // --- Course Actions ---
  const openEditCourse = (c: Course) => {
    setEditingCourseId(c.id);
    setCourseForm({
      title: c.title,
      description: c.description,
      category: c.category,
      level: c.level,
      level_label: c.level_label || c.level,
      prerequisites: c.prerequisites || '',
      learning_outcomes_text: (c.learning_outcomes || []).join('\n'),
      estimated_hours: c.estimated_hours || 3.0,
      status: c.status || 'published',
      is_premium: Boolean(c.is_premium),
      cover_image_url: c.cover_image_url || '',
    });
    setShowCourseEditor(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.category,
        level: courseForm.level,
        level_label: courseForm.level_label,
        prerequisites: courseForm.prerequisites,
        learning_outcomes: courseForm.learning_outcomes_text
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        estimated_hours: Number(courseForm.estimated_hours) || 3,
        status: courseForm.status,
        is_premium: courseForm.is_premium,
        cover_image_url: courseForm.cover_image_url || null,
      };
      if (editingCourseId) {
        await adminApiFetch(`/api/academy/courses/${editingCourseId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        onNotify('Course updated.');
      } else {
        await adminApiFetch('/api/academy/courses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        onNotify('New course created.');
      }
      setShowCourseEditor(false);
      setEditingCourseId(null);
      await Promise.all([loadAdminAcademy(), onGlobalRefresh()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save course.');
    }
  };

  // --- Lesson Actions ---
  const loadLessonIntoEditor = (l: Lesson) => {
    setEditingLessonId(l.id);
    setLessonForm({
      course_id: l.course_id,
      title: l.title,
      category: l.category,
      summary: l.summary,
      learning_objective: l.learning_objective || '',
      introduction: l.introduction || '',
      content: l.content,
      demonstration: l.demonstration || '',
      common_mistakes_text: (l.common_mistakes || []).join('\n'),
      summary_recap: l.summary_recap || '',
      exercise_title: l.practical_exercise?.title || '',
      exercise_objective: l.practical_exercise?.objective || '',
      exercise_steps_text: (l.practical_exercise?.steps || []).join('\n'),
      exercise_deliverable: l.practical_exercise?.deliverable || '',
      visual_key: l.visual_key || '',
      video_url: l.video_url || '',
      audio_url: l.audio_url || '',
      transcript: l.transcript || '',
      pdf_url: l.pdf_url || '',
      image_url: l.image_url || '',
      duration_minutes: l.duration_minutes,
      order_index: l.order_index,
      status: l.status || 'published',
      is_premium: Boolean(l.is_premium),
      scheduled_at: l.scheduled_at ? l.scheduled_at.slice(0, 16) : '',
      send_push: false,
      material_update: false,
      change_note: '',
    });
    setQuizItems(l.quiz && l.quiz.length > 0 ? l.quiz : [EMPTY_QUIZ()]);
  };

  const resetLessonEditor = () => {
    setEditingLessonId(null);
    setLessonForm({
      course_id: activeCourse?.id || '',
      title: '',
      category: activeCourse?.category || ACADEMY_CATEGORIES[0],
      summary: '',
      learning_objective: '',
      introduction: '',
      content: '',
      demonstration: '',
      common_mistakes_text: '',
      summary_recap: '',
      exercise_title: '',
      exercise_objective: '',
      exercise_steps_text: '',
      exercise_deliverable: '',
      visual_key: '',
      video_url: '',
      audio_url: '',
      transcript: '',
      pdf_url: '',
      image_url: '',
      duration_minutes: 15,
      order_index: orderedLessons.length + 1,
      status: 'published',
      is_premium: false,
      scheduled_at: '',
      send_push: false,
      material_update: false,
      change_note: '',
    });
    setQuizItems([EMPTY_QUIZ()]);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanedQuiz = quizItems
        .filter((q) => q.question.trim().length > 2 && q.options.filter((o) => o.trim()).length >= 2)
        .map((q) => ({
          id: q.id || `q-${Date.now()}`,
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()).filter(Boolean),
          correct_index: Math.min(q.correct_index, q.options.filter((o) => o.trim()).length - 1),
          explanation: q.explanation?.trim() || '',
        }));

      const practicalExercise =
        lessonForm.exercise_title.trim() && lessonForm.exercise_steps_text.trim()
          ? {
              title: lessonForm.exercise_title.trim(),
              objective: lessonForm.exercise_objective.trim(),
              steps: lessonForm.exercise_steps_text
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
              deliverable: lessonForm.exercise_deliverable.trim(),
            }
          : null;

      const payload = {
        course_id: lessonForm.course_id || activeCourse?.id,
        title: lessonForm.title,
        category: lessonForm.category,
        summary: lessonForm.summary,
        learning_objective: lessonForm.learning_objective || undefined,
        introduction: lessonForm.introduction || undefined,
        content: lessonForm.content,
        demonstration: lessonForm.demonstration || undefined,
        common_mistakes: lessonForm.common_mistakes_text
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        summary_recap: lessonForm.summary_recap || undefined,
        practical_exercise: practicalExercise,
        visual_key: lessonForm.visual_key || null,
        video_url: lessonForm.video_url || null,
        audio_url: lessonForm.audio_url || null,
        transcript: lessonForm.transcript || null,
        pdf_url: lessonForm.pdf_url || null,
        image_url: lessonForm.image_url || null,
        duration_minutes: Number(lessonForm.duration_minutes) || 15,
        order_index: Number(lessonForm.order_index) || 1,
        status: lessonForm.status,
        is_premium: lessonForm.is_premium,
        scheduled_at: lessonForm.scheduled_at
          ? new Date(lessonForm.scheduled_at).toISOString()
          : null,
        quiz: cleanedQuiz,
        send_push: lessonForm.send_push,
        ...(editingLessonId
          ? {
              material_update: lessonForm.material_update,
              change_note: lessonForm.change_note || undefined,
            }
          : {}),
      };

      if (editingLessonId) {
        await adminApiFetch(`/api/academy/lessons/${editingLessonId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        onNotify('Lesson updated & versioned.');
      } else {
        await adminApiFetch('/api/academy/lessons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        onNotify('New lesson saved.');
      }
      resetLessonEditor();
      await Promise.all([loadAdminAcademy(), onGlobalRefresh()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save lesson.');
    }
  };

  const handleMoveLesson = async (idx: number, dir: -1 | 1) => {
    if (!activeCourse) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= orderedLessons.length) return;
    const reordered = orderedLessons.slice();
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(swapIdx, 0, moved);
    try {
      await adminApiFetch('/api/academy/lessons/reorder', {
        method: 'POST',
        body: JSON.stringify({
          course_id: activeCourse.id,
          lesson_ids: reordered.map((l) => l.id),
        }),
      });
      onNotify('Lesson sequence updated.');
      await Promise.all([loadAdminAcademy(), onGlobalRefresh()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Reorder failed.');
    }
  };

  const handleQuickLessonStatus = async (lesson: Lesson, status: ContentPublishStatus) => {
    try {
      await adminApiFetch(`/api/academy/lessons/${lesson.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, change_note: `Status changed to ${status}` }),
      });
      onNotify(`"${lesson.title}" set to ${status}.`);
      await Promise.all([loadAdminAcademy(), onGlobalRefresh()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    await adminApiFetch(`/api/academy/lessons/${id}`, { method: 'DELETE' });
    onNotify('Lesson deleted.');
    if (editingLessonId === id) resetLessonEditor();
    await Promise.all([loadAdminAcademy(), onGlobalRefresh()]);
  };

  const handleGenerateIllustration = async () => {
    if (!lessonForm.title.trim()) {
      onError('Enter a Lesson Title first so the illustration matches your topic.');
      return;
    }
    setGeneratingImg(true);
    try {
      const res = await adminApiFetch<{ url: string }>('/api/admin/academy/generate-illustration', {
        method: 'POST',
        body: JSON.stringify({
          topic: lessonForm.title,
          description:
            lessonForm.summary || lessonForm.learning_objective || lessonForm.content.slice(0, 300),
        }),
      });
      setLessonForm((f) => ({ ...f, image_url: res.url }));
      onNotify('Educational SVG illustration generated and attached.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Illustration generation failed.');
    } finally {
      setGeneratingImg(false);
    }
  };

  const handleViewVersions = async (lesson: Lesson) => {
    try {
      const res = await adminApiFetch<{ versions: LessonVersion[] }>(
        `/api/academy/lessons/${lesson.id}/versions`
      );
      setVersionsLessonTitle(lesson.title);
      setVersionsList(res.versions || []);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to load version history.');
    }
  };

  const handleResolveReport = async (id: string, status: 'resolved' | 'dismissed') => {
    await adminApiFetch(`/api/admin/academy/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    onNotify(`Report marked ${status}.`);
    await loadAdminAcademy();
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation inside Admin Academy */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
          {[
            { id: 'cms' as const, label: 'Courses & Lesson CMS' },
            { id: 'reports' as const, label: `Reports & Audit (${contentReports.filter((r) => r.status === 'open').length} open)` },
            { id: 'students' as const, label: 'Student Progress' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                subTab === t.id
                  ? 'bg-[#881337] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {subTab === 'cms' && (
          <button
            type="button"
            onClick={() => {
              setEditingCourseId(null);
              setCourseForm({
                title: '',
                description: '',
                category: ACADEMY_CATEGORIES[0],
                level: 'Beginner',
                level_label: 'Beginner',
                prerequisites: '',
                learning_outcomes_text: '',
                estimated_hours: 3,
                status: 'published',
                is_premium: false,
                cover_image_url: '',
              });
              setShowCourseEditor(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534] min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Course</span>
          </button>
        )}
      </div>

      {/* Course Create/Edit Drawer */}
      {showCourseEditor && (
        <form
          onSubmit={handleSaveCourse}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingCourseId ? 'Edit Course Metadata' : 'Create New Academy Course'}
            </h3>
            <button
              type="button"
              onClick={() => setShowCourseEditor(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Course Title"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
            <select
              value={courseForm.category}
              onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            >
              {ACADEMY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={courseForm.level}
                onChange={(e) =>
                  setCourseForm({
                    ...courseForm,
                    level: e.target.value as CourseLevel,
                    level_label: e.target.value,
                  })
                }
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <select
                value={courseForm.status}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, status: e.target.value as ContentPublishStatus })
                }
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="unpublished">Unpublished</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <textarea
            rows={2}
            required
            placeholder="Course description..."
            value={courseForm.description}
            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Prerequisites"
              value={courseForm.prerequisites}
              onChange={(e) => setCourseForm({ ...courseForm, prerequisites: e.target.value })}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
            <input
              type="text"
              placeholder="Learning outcomes (one per line or brief list)"
              value={courseForm.learning_outcomes_text}
              onChange={(e) =>
                setCourseForm({ ...courseForm, learning_outcomes_text: e.target.value })
              }
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{courseForm.cover_image_url ? 'Cover Ready' : 'Upload Cover Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleUpload(e.target.files?.[0], (url) =>
                      setCourseForm((f) => ({ ...f, cover_image_url: url }))
                    )
                  }
                />
              </label>

              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={courseForm.is_premium}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, is_premium: e.target.checked })
                  }
                  className="accent-[#881337]"
                />
                <span>Premium Members Only</span>
              </label>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white"
            >
              {editingCourseId ? 'Save Course Updates' : 'Create Course'}
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 1: CMS */}
      {subTab === 'cms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Course Selector & Ordered Lessons List */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Managing Course ({adminCourses.length})
                </label>
                {activeCourse && (
                  <button
                    type="button"
                    onClick={() => openEditCourse(activeCourse)}
                    className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
                  >
                    Edit Course Details
                  </button>
                )}
              </div>
              <select
                value={activeCourse?.id || ''}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setEditingLessonId(null);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
              >
                {adminCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {String(c.course_number || 0).padStart(2, '0')}. {c.title} ({c.status || 'published'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Course Lessons ({orderedLessons.length})
              </p>
              <button
                type="button"
                onClick={resetLessonEditor}
                className="text-xs font-semibold text-[#15803D] dark:text-emerald-400 hover:underline"
              >
                + New Lesson in Course
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[70vh] overflow-y-auto pr-1">
              {orderedLessons.map((lesson, idx) => (
                <div key={lesson.id} className="py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {idx + 1}. {lesson.title}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {lesson.status || 'published'}
                      {lesson.is_premium ? ' · Premium' : ''} · v{lesson.material_version || 1} · {lesson.duration_minutes}m
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveLesson(idx, -1)}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedLessons.length - 1}
                      onClick={() => handleMoveLesson(idx, 1)}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickLessonStatus(
                          lesson,
                          lesson.status === 'published' ? 'unpublished' : 'published'
                        )
                      }
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-semibold"
                    >
                      {lesson.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadLessonIntoEditor(lesson)}
                      className="p-1 text-slate-400 hover:text-[#881337]"
                      title="Edit Lesson"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewVersions(lesson)}
                      className="p-1 text-slate-400 hover:text-sky-600"
                      title="Version History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-1 text-slate-400 hover:text-red-500"
                      title="Delete Lesson"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comprehensive Lesson Studio Form */}
          <form
            onSubmit={handleSaveLesson}
            className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingLessonId ? 'Edit Structured Lesson' : 'Create Structured Lesson'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                {editingLessonId && (
                  <button
                    type="button"
                    onClick={resetLessonEditor}
                    className="text-xs text-slate-500 underline"
                  >
                    New Lesson Instead
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={lessonForm.course_id}
                onChange={(e) => setLessonForm({ ...lessonForm, course_id: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                {adminCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <select
                value={lessonForm.status}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, status: e.target.value as ContentPublishStatus })
                }
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="published">Status: Published</option>
                <option value="draft">Status: Draft</option>
                <option value="unpublished">Status: Unpublished</option>
                <option value="scheduled">Status: Scheduled</option>
                <option value="archived">Status: Archived</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="Mins"
                  value={lessonForm.duration_minutes}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, duration_minutes: Number(e.target.value) })
                  }
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-mono"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Order"
                  value={lessonForm.order_index}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, order_index: Number(e.target.value) })
                  }
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-mono"
                />
              </div>
            </div>

            {lessonForm.status === 'scheduled' && (
              <input
                type="datetime-local"
                value={lessonForm.scheduled_at}
                onChange={(e) => setLessonForm({ ...lessonForm, scheduled_at: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
            )}

            <input
              type="text"
              required
              placeholder="Lesson Title"
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold"
            />
            <input
              type="text"
              required
              placeholder="Short Summary"
              value={lessonForm.summary}
              onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
            <input
              type="text"
              placeholder="Learning Objective (What the student can do after finishing)"
              value={lessonForm.learning_objective}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, learning_objective: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
            <textarea
              rows={2}
              placeholder="Simple Introduction..."
              value={lessonForm.introduction}
              onChange={(e) => setLessonForm({ ...lessonForm, introduction: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
            <textarea
              rows={5}
              required
              placeholder="Detailed Explanation (full educational prose)..."
              value={lessonForm.content}
              onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
            <textarea
              rows={3}
              placeholder="Step-by-Step Practical Demonstration..."
              value={lessonForm.demonstration}
              onChange={(e) => setLessonForm({ ...lessonForm, demonstration: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                rows={2}
                placeholder="Common Mistakes (one per line)"
                value={lessonForm.common_mistakes_text}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, common_mistakes_text: e.target.value })
                }
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <textarea
                rows={2}
                placeholder="Lesson Summary Recap"
                value={lessonForm.summary_recap}
                onChange={(e) => setLessonForm({ ...lessonForm, summary_recap: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
            </div>

            {/* Visuals, AI Diagram Generator & Multimedia */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Educational Visuals, Video, Audio &amp; PDF
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={lessonForm.visual_key}
                  onChange={(e) => setLessonForm({ ...lessonForm, visual_key: e.target.value })}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs"
                >
                  <option value="">No Built-In Diagram Key</option>
                  {ALL_VISUAL_KEYS.map((vk) => (
                    <option key={vk.key} value={vk.key}>
                      {vk.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={generatingImg}
                  onClick={handleGenerateIllustration}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#881337] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingImg ? 'Generating Diagram...' : 'AI Generate SVG Illustration'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lessonForm.image_url ? 'Image Attached' : 'Upload Image/SVG'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleUpload(e.target.files?.[0], (url) =>
                        setLessonForm((f) => ({ ...f, image_url: url }))
                      )
                    }
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lessonForm.video_url ? 'Video Ready' : 'Upload Video'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    onChange={(e) =>
                      handleUpload(e.target.files?.[0], (url) =>
                        setLessonForm((f) => ({ ...f, video_url: url }))
                      )
                    }
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lessonForm.audio_url ? 'Audio Ready' : 'Upload Audio'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) =>
                      handleUpload(e.target.files?.[0], (url) =>
                        setLessonForm((f) => ({ ...f, audio_url: url }))
                      )
                    }
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lessonForm.pdf_url ? 'PDF Ready' : 'Upload PDF Guide'}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      handleUpload(e.target.files?.[0], (url) =>
                        setLessonForm((f) => ({ ...f, pdf_url: url }))
                      )
                    }
                  />
                </label>
              </div>
            </div>

            {/* Multi-Question Quiz Builder */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Knowledge-Check Quiz Builder ({quizItems.length} Questions)
                </p>
                <button
                  type="button"
                  onClick={() => setQuizItems((prev) => [...prev, EMPTY_QUIZ()])}
                  className="text-xs font-semibold text-[#15803D] dark:text-emerald-400"
                >
                  + Add Question
                </button>
              </div>

              {quizItems.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">Question {qIdx + 1}</span>
                    {quizItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setQuizItems((prev) => prev.filter((_, idx) => idx !== qIdx))
                        }
                        className="text-red-500 text-[11px]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Question prompt..."
                    value={q.question}
                    onChange={(e) =>
                      setQuizItems((prev) =>
                        prev.map((item, idx) =>
                          idx === qIdx ? { ...item, question: e.target.value } : item
                        )
                      )
                    }
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <input
                        key={optIdx}
                        type="text"
                        placeholder={`Option ${optIdx + 1}${q.correct_index === optIdx ? ' (Correct)' : ''}`}
                        value={opt}
                        onChange={(e) =>
                          setQuizItems((prev) =>
                            prev.map((item, idx) =>
                              idx === qIdx
                                ? {
                                    ...item,
                                    options: item.options.map((o, oI) =>
                                      oI === optIdx ? e.target.value : o
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                        className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={q.correct_index}
                      onChange={(e) =>
                        setQuizItems((prev) =>
                          prev.map((item, idx) =>
                            idx === qIdx ? { ...item, correct_index: Number(e.target.value) } : item
                          )
                        )
                      }
                      className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                    >
                      <option value={0}>Correct: Option 1</option>
                      <option value={1}>Correct: Option 2</option>
                      <option value={2}>Correct: Option 3</option>
                      <option value={3}>Correct: Option 4</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Answer explanation..."
                      value={q.explanation || ''}
                      onChange={(e) =>
                        setQuizItems((prev) =>
                          prev.map((item, idx) =>
                            idx === qIdx ? { ...item, explanation: e.target.value } : item
                          )
                        )
                      }
                      className="sm:col-span-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            {editingLessonId && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15 p-3 space-y-2 text-xs">
                <label className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                  <input
                    type="checkbox"
                    checked={lessonForm.material_update}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, material_update: e.target.checked })
                    }
                  />
                  <span>Material update (preserve student completion &amp; flag for review)</span>
                </label>
                <input
                  type="text"
                  placeholder="Version change note (e.g. Updated Gold margin specification)"
                  value={lessonForm.change_note}
                  onChange={(e) => setLessonForm({ ...lessonForm, change_note: e.target.value })}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lessonForm.is_premium}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, is_premium: e.target.checked })
                    }
                    className="accent-[#881337]"
                  />
                  <span>Premium Members Only</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lessonForm.send_push}
                    onChange={(e) => setLessonForm({ ...lessonForm, send_push: e.target.checked })}
                    className="accent-[#881337]"
                  />
                  <span>Send Push Notification when Published</span>
                </label>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-[#15803D] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#166534] min-h-[42px]"
              >
                {editingLessonId ? 'Save Lesson Update' : 'Save & Publish Lesson'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: REPORTS & AUDIT LOG */}
      {subTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Learner Content Issue Reports ({contentReports.length})
            </h3>
            {contentReports.length === 0 ? (
              <p className="text-xs text-slate-500">No learner content reports filed.</p>
            ) : (
              <div className="space-y-3">
                {contentReports.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-2"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {r.lesson_title} · Status: {r.status}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {r.reporter_name}: {r.reason}
                    </p>
                    {r.status === 'open' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(r.id, 'resolved')}
                          className="rounded bg-[#15803D] px-2.5 py-1 text-white font-semibold"
                        >
                          Mark Resolved
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(r.id, 'dismissed')}
                          className="rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Academy Editorial Audit Log
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {log.action} · {log.actor_name}
                  </p>
                  <p className="text-slate-500">
                    {log.details} · {formatLocalDateTime(log.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STUDENT PROGRESS */}
      {subTab === 'students' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Student Progress Monitoring
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4 text-right">Enrolled</th>
                  <th className="py-2 pr-4 text-right">Lessons Done</th>
                  <th className="py-2 text-right">Avg Quiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentProgress.map((st) => (
                  <tr key={st.id}>
                    <td className="py-2 pr-4 font-medium">{st.name}</td>
                    <td className="py-2 pr-4 text-slate-500">{st.email}</td>
                    <td className="py-2 pr-4 text-right font-mono tabular-nums">{st.courses_enrolled}</td>
                    <td className="py-2 pr-4 text-right font-mono tabular-nums">{st.lessons_completed}</td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {st.avg_quiz_score !== null ? `${st.avg_quiz_score}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LIVE LESSON PREVIEW MODAL (Mobile / Desktop) */}
      {previewViewport && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1321] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md ${
                    previewViewport === 'desktop' ? 'bg-[#881337] text-white' : ''
                  }`}
                >
                  Desktop Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md ${
                    previewViewport === 'mobile' ? 'bg-[#881337] text-white' : ''
                  }`}
                >
                  Mobile (375px)
                </button>
              </div>
              <button type="button" onClick={() => setPreviewViewport(null)} className="p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`mx-auto rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 ${
                previewViewport === 'mobile' ? 'max-w-[375px]' : 'w-full'
              }`}
            >
              <p className="text-xs font-medium text-[#881337] dark:text-rose-400">
                {lessonForm.category} · {lessonForm.duration_minutes}m · {lessonForm.status}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {lessonForm.title || 'Untitled Lesson'}
              </h3>
              {lessonForm.learning_objective && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Objective:</strong> {lessonForm.learning_objective}
                </p>
              )}
              <AcademyVisuals
                visualKey={lessonForm.visual_key}
                imageUrl={lessonForm.image_url}
                title={lessonForm.title || 'Lesson Preview'}
              />
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {lessonForm.content || 'Detailed lesson explanation appears here.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {versionsLessonTitle && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1321] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Version History — {versionsLessonTitle}
              </h3>
              <button type="button" onClick={() => setVersionsLessonTitle(null)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {versionsList.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#881337] dark:text-rose-400">
                      v{v.version_number} · {v.changed_by}
                    </span>
                    <span className="text-slate-500">{formatLocalDateTime(v.created_at)}</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{v.change_note}</p>
                  <p className="text-slate-500 line-clamp-2">{v.content}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonForm((f) => ({
                        ...f,
                        title: v.title,
                        content: v.content,
                        change_note: `Restored from v${v.version_number}`,
                      }));
                      setVersionsLessonTitle(null);
                      onNotify(`Loaded v${v.version_number} into editor. Review and save to restore.`);
                    }}
                    className="text-xs font-semibold text-[#15803D] dark:text-emerald-400 hover:underline"
                  >
                    Load into Editor
                  </button>
                </div>
              ))}
              {versionsList.length === 0 && (
                <p className="text-xs text-slate-500">No historical snapshots recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
