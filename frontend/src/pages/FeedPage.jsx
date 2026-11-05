import React, { useState, useEffect } from 'react';
import { api } from '../api';
import QuestionCard from '../components/QuestionCard';
import { Plus, Filter, Loader2, RefreshCw } from 'lucide-react';

const SUBJECTS = [
  'সব বিষয়',
  'পদার্থবিজ্ঞান (Physics)',
  'উচ্চতর গণিত (Math)',
  'রসায়ন (Chemistry)',
  'জীববিজ্ঞান (Biology)',
  'আইসিটি (ICT)',
  'সাধারণ জ্ঞান (GK)'
];

export default function FeedPage({ onOpenDetail, onNavigateAsk }) {
  const [questions, setQuestions] = useState([]);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Fetch initial feed or when filters change
  const fetchFeed = async (isInitial = true, currentCursor = null) => {
    if (isInitial) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (subject && subject !== 'সব বিষয়') params.append('subject', subject);
      if (chapter && chapter.trim()) params.append('chapter', chapter.trim());
      if (currentCursor) params.append('cursor', currentCursor);

      const res = await api.get(`/questions?${params.toString()}`);
      if (res.success) {
        if (isInitial) {
          setQuestions(res.questions);
        } else {
          setQuestions((prev) => [...prev, ...res.questions]);
        }
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      setError(err.message || 'ফিড লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed(true, null);
  }, [subject, chapter]);

  const handleLoadMore = () => {
    if (cursor && !loadingMore) {
      fetchFeed(false, cursor);
    }
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      {/* Subject & Chapter Filter Bar */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s === 'সব বিষয়' ? '' : s}>
              {s}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="অধ্যায় (ঐচ্ছিক)"
          className="filter-select"
          style={{ flex: '0.8' }}
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
        />

        <button
          onClick={() => fetchFeed(true, null)}
          title="রিফ্রেশ করুন"
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            padding: '6px 10px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error notification */}
      {error && (
        <div style={{ margin: '16px', padding: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Questions Feed List */}
      <div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '14px' }}>প্রশ্নগুলো লোড হচ্ছে...</p>
          </div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>কোনো প্রশ্ন পাওয়া যায়নি</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>প্রথম প্রশ্নটি করার জন্য নিচের বাটনে চাপুন।</p>
          </div>
        ) : (
          questions.map((q) => (
            <QuestionCard
              key={q._id}
              question={q}
              onOpenDetail={onOpenDetail}
            />
          ))
        )}
      </div>

      {/* Cursor-based "আরও দেখুন" (Load More) Button */}
      {hasMore && !loading && (
        <div className="load-more-section">
          <button
            className="btn-secondary"
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{ width: '100%', padding: '12px' }}
          >
            {loadingMore ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                আরও প্রশ্ন আসছে...
              </>
            ) : (
              'আরও দেখুন (Load More)'
            )}
          </button>
        </div>
      )}

      {/* Floating Action Button (প্রশ্ন করুন) */}
      <button className="fab-ask" onClick={onNavigateAsk}>
        <Plus size={20} />
        <span>প্রশ্ন করুন</span>
      </button>
    </div>
  );
}
