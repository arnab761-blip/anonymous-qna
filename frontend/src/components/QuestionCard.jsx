import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, MessageCircle, User } from 'lucide-react';
import TeacherVerifiedBadge from './TeacherVerifiedBadge';
import FeedImage from './FeedImage';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const getSubjectBadgeClass = (subject = '') => {
  if (subject.includes('Physics') || subject.includes('পদার্থবিজ্ঞান')) return 'badge-physics';
  if (subject.includes('Math') || subject.includes('গণিত')) return 'badge-math';
  if (subject.includes('Chemistry') || subject.includes('রসায়ন')) return 'badge-chemistry';
  if (subject.includes('Biology') || subject.includes('জীববিজ্ঞান')) return 'badge-biology';
  if (subject.includes('ICT') || subject.includes('আইসিটি')) return 'badge-ict';
  if (subject.includes('GK') || subject.includes('সাধারণ জ্ঞান')) return 'badge-gk';
  return 'badge-default';
};

export default function QuestionCard({ question, onOpenDetail }) {
  const { user } = useAuth();

  // Optimistic UI state for Helpful / Like button
  const [liked, setLiked] = useState(Boolean(question.userHasLiked));
  const [likeCount, setLikeCount] = useState(question.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setLiked(Boolean(question.userHasLiked));
    setLikeCount(question.likeCount || 0);
  }, [question.userHasLiked, question.likeCount]);

  const handleToggleLike = async (e) => {
    e.stopPropagation();

    if (!user) {
      alert('লাইক দিতে অনুগ্রহ করে আগে লগইন করুন।');
      return;
    }

    if (isLiking) return;

    // 1. Optimistic Update (Immediate UI reaction)
    const prevLiked = liked;
    const prevCount = likeCount;

    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setLiked(nextLiked);
    setLikeCount(nextCount);
    question.userHasLiked = nextLiked;
    question.likeCount = nextCount;
    setIsLiking(true);

    // 2. Perform API request in background
    try {
      const res = await api.post(`/like/question/${question._id}`);
      if (res.success) {
        setLiked(res.liked);
        setLikeCount(res.likeCount);
        question.userHasLiked = res.liked;
        question.likeCount = res.likeCount;
      }
    } catch (err) {
      // Revert if error occurs
      setLiked(prevLiked);
      setLikeCount(prevCount);
      question.userHasLiked = prevLiked;
      question.likeCount = prevCount;
      alert(err.message || 'লাইক আপডেট করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsLiking(false);
    }
  };

  const formattedDate = new Date(question.createdAt).toLocaleDateString('bn-BD', {
    month: 'short',
    day: 'numeric'
  });

  const badgeClass = getSubjectBadgeClass(question.subject);

  return (
    <motion.article
      className="question-card"
      onClick={() => onOpenDetail(question._id)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <div className="card-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className={`tag-subject ${badgeClass}`}>{question.subject}</span>
          {question.chapter && (
            <span className="tag-chapter">{question.chapter}</span>
          )}
        </div>
        {question.isVerifiedByTeacher && <TeacherVerifiedBadge />}
      </div>

      <h3 className="question-title">{question.text}</h3>

      {question.imageUrl && <FeedImage imageUrl={question.imageUrl} />}

      <div className="question-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="alias-badge">
            <User size={11} />
            <span>{question.alias}</span>
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {formattedDate}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={`btn-helpful ${liked ? 'active' : ''}`}
            onClick={handleToggleLike}
            title={liked ? 'লাইক দেওয়া আছে (ক্লিক করে আনলাইক করুন)' : 'উপকারী (লাইক দিন)'}
          >
            <ThumbsUp size={14} className={liked ? 'active-thumb-icon' : ''} />
            <span>{likeCount}</span>
          </motion.button>

          <div className="answer-count-pill">
            <MessageCircle size={14} />
            <span>{question.answerCount || 0}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
