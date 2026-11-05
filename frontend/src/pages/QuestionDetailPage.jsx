import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import TeacherVerifiedBadge from '../components/TeacherVerifiedBadge';
import FeedImage from '../components/FeedImage';
import ImageUploader from '../components/ImageUploader';
import { ArrowLeft, ThumbsUp, Send, User, AlertOctagon, Loader2 } from 'lucide-react';

export default function QuestionDetailPage({ questionId, onBack }) {
  const { user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMoreAnswers, setLoadingMoreAnswers] = useState(false);

  // Optimistic Helpful State for Question
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Answer Submission State
  const [answerText, setAnswerText] = useState('');
  const [answerImageUrl, setAnswerImageUrl] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Report Modal State
  const [reportTarget, setReportTarget] = useState(null); // { type, id }
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const [error, setError] = useState('');

  // Fetch question and initial answers
  const fetchQuestionDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/questions/${questionId}`);
      if (res.success) {
        setQuestion(res.question);
        setAnswers(res.answers || []);
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setLiked(res.question.userHasLiked || false);
        setLikeCount(res.question.likeCount || 0);
      }
    } catch (err) {
      setError(err.message || 'প্রশ্নটি লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionDetails();
  }, [questionId, user]);

  // Load more answers with cursor pagination
  const handleLoadMoreAnswers = async () => {
    if (!cursor || loadingMoreAnswers) return;

    setLoadingMoreAnswers(true);
    try {
      const res = await api.get(`/questions/${questionId}?cursor=${cursor}`);
      if (res.success) {
        setAnswers((prev) => [...prev, ...res.answers]);
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      alert(err.message || 'আরও উত্তর লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoadingMoreAnswers(false);
    }
  };

  // Optimistic Toggle Like on Question
  const handleToggleLike = async () => {
    if (!user) {
      alert('লাইক দিতে আগে লগইন করুন।');
      return;
    }

    const prevLiked = liked;
    const prevCount = likeCount;

    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      const res = await api.post(`/like/question/${questionId}`);
      if (res.success) {
        setLiked(res.liked);
        setLikeCount(res.likeCount);
      }
    } catch (err) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      alert(err.message || 'লাইক দিতে সমস্যা হয়েছে।');
    }
  };

  // Post new answer
  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('উত্তর দিতে আগে লগইন করুন।');
      return;
    }

    if (answerText.trim().length < 5) {
      alert('উত্তর অন্তত ৫ অক্ষরের হতে হবে।');
      return;
    }

    setSubmittingAnswer(true);
    try {
      const res = await api.post(`/questions/${questionId}/answers`, {
        text: answerText.trim(),
        imageUrl: answerImageUrl
      });

      if (res.success) {
        setAnswers((prev) => [...prev, res.answer]);
        setAnswerText('');
        setAnswerImageUrl(null);
        setQuestion((prev) => ({
          ...prev,
          answerCount: (prev.answerCount || 0) + 1
        }));
      }
    } catch (err) {
      alert(err.message || 'উত্তর পোস্ট করতে ব্যর্থ হয়েছে।');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Submit report to teacher
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setReporting(true);
    try {
      const res = await api.post('/reports', {
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason.trim()
      });

      if (res.success) {
        alert(res.message);
        setReportTarget(null);
        setReportReason('');
      }
    } catch (err) {
      alert(err.message || 'রিপোর্ট করা সম্ভব হয়নি।');
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 16px', color: '#64748b' }}>
        <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 8px' }} />
        <p>প্রশ্ন বিস্তারিত লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontWeight: '600' }}>{error || 'প্রশ্ন পাওয়া যায়নি।'}</p>
        <button className="btn-secondary" onClick={onBack} style={{ marginTop: '12px' }}>
          ফিডে ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Top Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: '600' }}
        >
          <ArrowLeft size={18} /> ফিড
        </button>

        <button
          onClick={() => setReportTarget({ type: 'question', id: question._id })}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
        >
          <AlertOctagon size={14} /> রিপোর্ট
        </button>
      </div>

      {/* Question Details View */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <span className="tag-subject">{question.subject}</span>
            <span className="tag-chapter">{question.chapter}</span>
          </div>
          {question.isVerifiedByTeacher && <TeacherVerifiedBadge />}
        </div>

        <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '12px 0', lineHeight: 1.4 }}>
          {question.text}
        </h1>

        {question.imageUrl && <FeedImage imageUrl={question.imageUrl} />}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
          <span className="alias-badge">
            <User size={12} />
            {question.alias}
          </span>

          <button className={`btn-helpful ${liked ? 'active' : ''}`} onClick={handleToggleLike}>
            <ThumbsUp size={15} />
            <span>উপকারী ({likeCount})</span>
          </button>
        </div>
      </div>

      {/* Answers Section */}
      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
          উত্তরসমূহ ({answers.length})
        </h3>

        {answers.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#64748b' }}>এখনো কোনো উত্তর আসেনি। প্রথম উত্তরটি আপনিই দিন!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {answers.map((ans) => (
              <div
                key={ans._id}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="alias-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    <User size={11} /> {ans.alias}
                  </span>
                  <button
                    onClick={() => setReportTarget({ type: 'answer', id: ans._id })}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    title="রিপোর্ট করুন"
                  >
                    <AlertOctagon size={13} />
                  </button>
                </div>

                <p style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-line' }}>{ans.text}</p>

                {ans.imageUrl && <FeedImage imageUrl={ans.imageUrl} />}
              </div>
            ))}
          </div>
        )}

        {/* Load more answers with cursor pagination */}
        {hasMore && (
          <button
            className="btn-secondary"
            onClick={handleLoadMoreAnswers}
            disabled={loadingMoreAnswers}
            style={{ width: '100%', marginTop: '12px', padding: '8px' }}
          >
            {loadingMoreAnswers ? 'আরও উত্তর আসছে...' : 'আরও উত্তর দেখুন'}
          </button>
        )}
      </div>

      {/* Answer Submission Box */}
      <div style={{ padding: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
          আপনার উত্তর লিখুন
        </h4>

        <form onSubmit={handlePostAnswer}>
          <textarea
            className="form-input"
            rows="3"
            placeholder="সহায়ক ও মার্জিত ভাষায় সমাধানটি লিখুন..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            required
          />

          <ImageUploader
            onUploadSuccess={(url) => setAnswerImageUrl(url)}
            onRemove={() => setAnswerImageUrl(null)}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={submittingAnswer}
            style={{ width: '100%', marginTop: '8px' }}
          >
            <Send size={15} />
            <span>{submittingAnswer ? 'উত্তর পাঠানো হচ্ছে...' : 'উত্তর পোস্ট করুন'}</span>
          </button>
        </form>
      </div>

      {/* Report Modal */}
      {reportTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', maxWidth: '380px', width: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#b91c1c', marginBottom: '8px' }}>
              শিক্ষকের কাছে রিপোর্ট করুন
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              ভুল তথ্য, গালিগালাজ বা অননুমোদিত আচরণ থাকলে কারণ লিখে জমা দিন।
            </p>

            <form onSubmit={handleSubmitReport}>
              <textarea
                className="form-input"
                rows="3"
                placeholder="রিপোর্টের কারণ সংক্ষেপে লিখুন..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
              />

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setReportTarget(null)}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, backgroundColor: '#dc2626' }}
                  disabled={reporting}
                >
                  {reporting ? 'জমা হচ্ছে...' : 'রিপোর্ট পাঠান'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
