import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, User } from 'lucide-react';
import TeacherVerifiedBadge from './TeacherVerifiedBadge';
import FeedImage from './FeedImage';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function QuestionCard({ question, onOpenDetail }) {
  const { user } = useAuth();

  // Optimistic UI state for Helpful / Like button
  const [liked, setLiked] = useState(question.userHasLiked || false);
  const [likeCount, setLikeCount] = useState(question.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

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
    setIsLiking(true);

    // 2. Perform API request in background
    try {
      const res = await api.post(`/like/question/${question._id}`);
      if (res.success) {
        setLiked(res.liked);
        setLikeCount(res.likeCount);
      }
    } catch (err) {
      // Revert if error occurs
      setLiked(prevLiked);
      setLikeCount(prevCount);
      alert(err.message || 'লাইক আপডেট করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsLiking(false);
    }
  };

  const formattedDate = new Date(question.createdAt).toLocaleDateString('bn-BD', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <article className="question-card" onClick={() => onOpenDetail(question._id)}>
      <div className="card-meta">
        <div>
          <span className="tag-subject">{question.subject}</span>
          <span className="tag-chapter">{question.chapter}</span>
        </div>
        {question.isVerifiedByTeacher && <TeacherVerifiedBadge />}
      </div>

      <h3 className="question-title">{question.text}</h3>

      {question.imageUrl && <FeedImage imageUrl={question.imageUrl} />}

      <div className="question-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="alias-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
            <User size={11} />
            {question.alias}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {formattedDate}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`btn-helpful ${liked ? 'active' : ''}`}
            onClick={handleToggleLike}
            title="Helpful (উপকারী)"
          >
            <ThumbsUp size={14} className={liked ? 'fill-blue-600 text-blue-600' : ''} />
            <span>{likeCount}</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#64748b',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            <MessageCircle size={15} />
            <span>{question.answerCount || 0}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
