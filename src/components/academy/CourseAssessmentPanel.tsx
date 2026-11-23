import React, { useState } from 'react';
import { Award, CheckCircle2, Printer, RotateCcw, X } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { apiFetch } from '../../lib/api';
import type { Course } from '../../types';

interface CourseAssessmentPanelProps {
  course: Course;
  onAssessmentSaved: () => Promise<void>;
}

interface GradedResponse {
  score: number;
  correct: number;
  total: number;
  passed_score: boolean;
  all_lessons_completed: boolean;
  passed: boolean;
  certificate_id: string | null;
  breakdown: Array<{
    question_id: string;
    correct_index: number;
    picked_index: number;
    is_correct: boolean;
    explanation: string;
  }>;
}

export const CourseAssessmentPanel: React.FC<CourseAssessmentPanelProps> = ({
  course,
  onAssessmentSaved,
}) => {
  const { user, navigate } = usePlatform();
  const questions = course.assessment || [];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GradedResponse | null>(null);
  const [showCert, setShowCert] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (questions.length === 0) return null;

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!user) {
      navigate('/profile');
      return;
    }
    const payload = questions.map((_, idx) => answers[idx] ?? -1);
    if (payload.some((v) => v < 0)) {
      setErrorMsg('Please select an answer for every assessment question before grading.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<GradedResponse>(`/api/academy/courses/${course.id}/assessment`, {
        method: 'POST',
        body: JSON.stringify({ answers: payload }),
      });
      setResult(res);
      await onAssessmentSaved();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to grade assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const certId = result?.certificate_id || course.assessment_record?.certificate_id;
  const passed = Boolean(result?.passed || course.assessment_record?.passed);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <p className="text-xs font-semibold text-[#881337] dark:text-rose-400">
            End-of-Course Mastery Assessment · Pass Threshold: 70% + All Lessons Completed
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {course.title} — Final Assessment ({questions.length} Questions)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {course.assessment_record && (
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
              Best: {course.assessment_record.best_score}% ({course.assessment_record.attempts} attempts)
            </span>
          )}
          {passed && certId && (
            <button
              type="button"
              onClick={() => setShowCert(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534] min-h-[38px]"
            >
              <Award className="w-4 h-4" />
              <span>View Completion Record</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => {
          const graded = result?.breakdown[qIdx];
          return (
            <div
              key={q.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {qIdx + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isPicked = answers[qIdx] === optIdx;
                  const isRight = graded && graded.correct_index === optIdx;
                  const isWrongPicked = graded && isPicked && !graded.is_correct;
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs sm:text-sm cursor-pointer transition-colors ${
                        isRight
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-900 dark:text-white'
                          : isWrongPicked
                          ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-slate-900 dark:text-white'
                          : isPicked
                          ? 'border-[#881337] bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`assess-${course.id}-${qIdx}`}
                        checked={isPicked}
                        onChange={() => setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                        className="mt-0.5 accent-[#881337]"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>

              {graded && (
                <p
                  className={`text-xs leading-relaxed ${
                    graded.is_correct
                      ? 'text-[#15803D] dark:text-emerald-400'
                      : 'text-[#9F1239] dark:text-rose-400'
                  }`}
                >
                  <strong>{graded.is_correct ? 'Correct:' : 'Incorrect:'}</strong> {graded.explanation || q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {errorMsg && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errorMsg}</p>}

      {result && (
        <div
          className={`rounded-xl border p-4 text-xs sm:text-sm space-y-1 ${
            result.passed
              ? 'border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/20 text-[#15803D] dark:text-emerald-300'
              : 'border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
          }`}
        >
          <p className="font-bold">
            Assessment Score: {result.score}% ({result.correct}/{result.total} correct)
          </p>
          {!result.passed_score && (
            <p>Review the missed concepts above and retry to score 70% or higher.</p>
          )}
          {result.passed_score && !result.all_lessons_completed && (
            <p>
              Score passed! Complete all remaining lessons in this course to unlock your Completion Record.
            </p>
          )}
          {result.passed && (
            <p>Course mastery verified and recorded to your learning transcript.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{submitting ? 'Grading...' : user ? 'Submit Course Assessment' : 'Premium Member Sign In to Submit'}</span>
        </button>

        {result && (
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setResult(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 min-h-[44px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Assessment</span>
          </button>
        )}
      </div>

      {/* Educational Completion Record Modal */}
      {showCert && certId && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
          <div className="max-w-xl w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1321] p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#881337] dark:text-rose-400 font-bold">
                MERIDIANFX ACADEMY · EDUCATIONAL RECORD
              </span>
              <button
                type="button"
                onClick={() => setShowCert(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-3 bg-slate-50/70 dark:bg-slate-900/50">
              <Award className="w-10 h-10 text-[#15803D] dark:text-emerald-400 mx-auto" />
              <p className="text-xs font-medium text-slate-500">Certificate of Educational Completion</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.name || 'Academy Learner'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                successfully completed all lessons and passed the mastery assessment for
              </p>
              <p className="text-base font-bold text-[#881337] dark:text-rose-400">
                {course.title}
              </p>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[11px] font-mono text-slate-500">
                <span>Best Score: {course.assessment_record?.best_score ?? result?.score ?? 100}%</span>
                <span>Record ID: {certId}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Disclaimer: This is an internal educational completion record issued by MeridianFX Academy. It does not constitute regulatory financial licensing, professional certification, or investment advice.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 min-h-[40px]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Record</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCert(false)}
                className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white min-h-[40px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
