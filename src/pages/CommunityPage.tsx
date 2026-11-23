import React, { useEffect, useState } from 'react';
import { Flag, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatRelativeTime } from '../lib/api';
import type { CommunityPost } from '../types';

const COMMUNITY_CATEGORIES = [
  'Market Discussion',
  'Educational Questions',
  'Strategy Lab',
  'Trade Reviews',
];

export const CommunityPage: React.FC = () => {
  const { user, navigate } = usePlatform();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(COMMUNITY_CATEGORIES[0]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadPosts = async () => {
    try {
      const res = await apiFetch<{ posts: CommunityPost[] }>('/api/community/posts');
      setPosts(res.posts);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/profile');
      return;
    }
    try {
      await apiFetch('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify({ title, content, category }),
      });
      setTitle('');
      setContent('');
      await loadPosts();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to publish post.');
    }
  };

  const handleComment = async (postId: string) => {
    if (!user) {
      navigate('/profile');
      return;
    }
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    await apiFetch(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: text }),
    });
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    await loadPosts();
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      navigate('/profile');
      return;
    }
    await apiFetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
    await loadPosts();
  };

  const handleDelete = async (postId: string) => {
    await apiFetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleReport = async (postId: string) => {
    if (!reportReason.trim()) return;
    await apiFetch(`/api/community/posts/${postId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason: reportReason }),
    });
    setReportingId(null);
    setReportReason('');
    setFeedback('Report submitted to platform moderators.');
  };

  const filtered = posts.filter(
    (p) => categoryFilter === 'All' || p.category === categoryFilter
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Trader Community & Discussion Desk
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Discuss macroeconomic developments, ask Academy questions, and share educational trade reviews. Moderated against spam and solicitation.
        </p>
      </div>

      {feedback && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 text-xs font-medium text-[#15803D] dark:text-emerald-400">
          {feedback}
        </div>
      )}

      {/* Composer */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Start a Discussion</h2>
        {user ? (
          <form onSubmit={handleCreatePost} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Discussion headline..."
                className="sm:col-span-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                {COMMUNITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your market thesis, educational question, or chart observation..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[40px]"
              >
                Publish Post
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Approved Premium Members can sign in via Profile to post and reply in community threads.
            </p>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B]"
            >
              Premium Member Sign In
            </button>
          </div>
        )}
      </section>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', ...COMMUNITY_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-[#881337] text-white'
                : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post) => {
          const canDelete =
            user && (user.id === post.user_id || ['admin', 'moderator'].includes(user.role));

          return (
            <article
              key={post.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {post.author_name}
                    </span>{' '}
                    {post.author_role === 'admin' ? '(Desk Strategist) ' : ''}· {post.category} ·{' '}
                    {formatRelativeTime(post.created_at)}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {post.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  {user && (
                    <button
                      type="button"
                      onClick={() => setReportingId(reportingId === post.id ? null : post.id)}
                      title="Report post"
                      className="p-2 text-slate-400 hover:text-[#9F1239] rounded-lg"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      title="Delete post"
                      className="p-2 text-slate-400 hover:text-[#9F1239] rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {post.content}
              </p>

              {reportingId === post.id && (
                <div className="flex flex-col sm:flex-row gap-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 p-3">
                  <input
                    type="text"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Reason for reporting (spam, scam, abuse)..."
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleReport(post.id)}
                    className="rounded-lg bg-[#881337] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6B0F2B]"
                  >
                    Submit Report
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleLike(post.id)}
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    post.liked_by_me ? 'text-[#9F1239] dark:text-rose-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Heart className="w-4 h-4" fill={post.liked_by_me ? 'currentColor' : 'none'} />
                  <span className="font-mono tabular-nums">{post.likes_count}</span>
                </button>
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-mono tabular-nums">{post.comments_count}</span>
                </span>
              </div>

              {/* Comments */}
              {post.comments && post.comments.length > 0 && (
                <div className="space-y-2.5 pl-4 border-l border-slate-200 dark:border-slate-800">
                  {post.comments.map((c) => (
                    <div key={c.id} className="text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {c.author_name}
                      </span>{' '}
                      <span className="text-slate-400">{formatRelativeTime(c.created_at)}</span>
                      <p className="mt-0.5 text-slate-700 dark:text-slate-300">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {user && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Write a reply..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleComment(post.id)}
                    className="p-2 rounded-lg bg-[#881337] text-white hover:bg-[#6B0F2B]"
                    aria-label="Send comment"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
