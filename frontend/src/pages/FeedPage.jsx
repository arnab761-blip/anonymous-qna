import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import QuestionCard from '../components/QuestionCard';
import { Plus, Loader2, RefreshCw, BookOpen } from 'lucide-react';

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
  const { user } = useAuth();
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
  }, [subject, chapter, user]);

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
          className="filter-select filter-chapter-input"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
        />

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => fetchFeed(true, null)}
          className="filter-refresh-btn"
          title="রিফ্রেশ করুন"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* Error notification */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: '14px 16px',
            padding: '12px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          {error}
        </motion.div>
      )}

      {/* Questions Feed List */}
      <div style={{ padding: '0 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 16px', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 10px', color: '#2563eb' }} />
            <p style={{ fontSize: '14px', fontWeight: '500' }}>প্রশ্নগুলো লোড হচ্ছে...</p>
          </div>
        ) : questions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="empty-feed-card"
          >
            <div className="empty-icon-circle">
              <BookOpen size={30} color="#6366f1" />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
              কোনো প্রশ্ন পাওয়া যায়নি
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', maxWidth: '300px', margin: '0 auto 16px' }}>
              {subject || chapter
                ? 'এই ফিল্টারে কোনো প্রশ্ন নেই। অন্য বিষয় নির্বাচন করুন।'
                : 'প্রথম প্রশ্নটি করার মাধ্যমে আলোচনা শুরু করুন!'}
            </p>
            <button className="btn-primary" onClick={onNavigateAsk} style={{ margin: '0 auto' }}>
              <Plus size={16} />
              <span>প্রথম প্রশ্নটি করুন</span>
            </button>
          </motion.div>
        ) : (
          <div className="questions-container">
            {questions.map((q) => (
              <QuestionCard
                key={q._id}
                question={q}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cursor-based "আরও দেখুন" (Load More) Button */}
      {hasMore && !loading && (
        <div className="load-more-section">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="btn-secondary"
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
          >
            {loadingMore ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>আরও প্রশ্ন আসছে...</span>
              </>
            ) : (
              'আরও দেখুন (Load More)'
            )}
          </motion.button>
        </div>
      )}

      {/* Floating Action Button (প্রশ্ন করুন) */}
      <motion.button
        className="fab-ask"
        onClick={onNavigateAsk}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus size={20} />
        <span>প্রশ্ন করুন</span>
      </motion.button>
    </div>
  );
}
