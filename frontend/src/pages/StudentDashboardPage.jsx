import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import QuestionCard from '../components/QuestionCard';
import FeedImage from '../components/FeedImage';
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  ThumbsUp,
  Calendar,
  User,
  ShieldCheck,
  Loader2,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react';

export default function StudentDashboardPage({ onBack, onOpenDetail, onNavigateAsk }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    profile: null,
    stats: {
      totalQuestions: 0,
      totalAnswers: 0,
      verifiedQuestions: 0,
      totalLikesReceived: 0,
      totalLikesGiven: 0
    },
    questions: [],
    answers: []
  });
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'answers'

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/dashboard');
      if (res.success) {
        setData({
          profile: res.profile,
          stats: res.stats || {},
          questions: res.questions || [],
          answers: res.answers || []
        });
      }
    } catch (err) {
      setError(err.message || 'ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Compute student level based on activity
  const totalActivity = (data.stats.totalQuestions || 0) + (data.stats.totalAnswers || 0);
  const userLevel =
    totalActivity >= 15
      ? { title: 'সুপার কন্ট্রিবিউটর', color: '#8b5cf6', badge: '⭐⭐⭐' }
      : totalActivity >= 5
      ? { title: 'সক্রিয় শিক্ষার্থী', color: '#0ea5e9', badge: '⭐⭐' }
      : { title: 'নতুন শিক্ষার্থী', color: '#10b981', badge: '⭐' };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px', color: '#4f46e5' }} />
        <p style={{ fontSize: '15px', fontWeight: '500' }}>আপনার ড্যাশবোর্ড প্রস্তুত হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
          <p style={{ color: '#b91c1c', fontWeight: '600', marginBottom: '12px' }}>{error}</p>
          <button className="btn-secondary" onClick={fetchDashboard} style={{ marginRight: '8px' }}>
            আবার চেষ্টা করুন
          </button>
          <button className="btn-primary" onClick={onBack}>
            ফিডে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ paddingBottom: '90px' }}
    >
      {/* Top Header */}
      <div className="dashboard-topbar">
        <button
          onClick={onBack}
          className="back-btn"
          title="ফিডে ফিরে যান"
        >
          <ArrowLeft size={18} />
          <span>ফিড</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="#4f46e5" />
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
            শিক্ষার্থী ড্যাশবোর্ড
          </span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Profile Card */}
        <motion.div
          className="dashboard-profile-card"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="profile-avatar-box">
              <User size={28} color="#ffffff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="profile-alias">{data.profile?.alias || user?.alias}</span>
                <span className="profile-level-badge" style={{ backgroundColor: `${userLevel.color}15`, color: userLevel.color, borderColor: `${userLevel.color}40` }}>
                  {userLevel.badge} {userLevel.title}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px', fontWeight: '500' }}>
                {data.profile?.name} • <span style={{ color: '#64748b' }}>{data.profile?.identifier}</span>
              </p>
              {data.profile?.joinedAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  <Calendar size={12} />
                  <span>যুক্ত হয়েছেন: {new Date(data.profile.joinedAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Analytics & Stats Grid */}
        <div className="stats-grid">
          <motion.div
            className="stat-card"
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <div className="stat-icon-wrap" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <span className="stat-number">{data.stats.totalQuestions}</span>
              <span className="stat-label">মোট প্রশ্ন</span>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <div className="stat-icon-wrap" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <span className="stat-number">{data.stats.totalAnswers}</span>
              <span className="stat-label">উত্তর দিয়েছেন</span>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <div className="stat-icon-wrap" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <ThumbsUp size={20} />
            </div>
            <div>
              <span className="stat-number">{data.stats.totalLikesReceived}</span>
              <span className="stat-label">লাইক পেয়েছেন</span>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <div className="stat-icon-wrap" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="stat-number">{data.stats.verifiedQuestions}</span>
              <span className="stat-label">যাচাইকৃত প্রশ্ন</span>
            </div>
          </motion.div>
        </div>

        {/* Tab Selector */}
        <div className="dashboard-tab-bar">
          <button
            className={`dashboard-tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <HelpCircle size={15} />
            <span>আমার প্রশ্নসমূহ ({data.questions.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'answers' ? 'active' : ''}`}
            onClick={() => setActiveTab('answers')}
          >
            <MessageSquare size={15} />
            <span>আমার উত্তরসমূহ ({data.answers.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'questions' && (
            <motion.div
              key="questions-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {data.questions.length === 0 ? (
                <div className="dashboard-empty-state">
                  <div className="empty-icon-box">
                    <HelpCircle size={32} color="#94a3b8" />
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    আপনি এখনও কোনো প্রশ্ন করেননি
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                    যেকোনো বিষয়ে কনফিউশন থাকলে নির্ভয়ে প্রথম প্রশ্নটি এখনই পোস্ট করুন!
                  </p>
                  <button className="btn-primary" onClick={onNavigateAsk} style={{ margin: '0 auto' }}>
                    <Plus size={16} />
                    <span>প্রশ্ন করুন</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.questions.map((q) => (
                    <QuestionCard
                      key={q._id}
                      question={q}
                      onOpenDetail={onOpenDetail}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'answers' && (
            <motion.div
              key="answers-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {data.answers.length === 0 ? (
                <div className="dashboard-empty-state">
                  <div className="empty-icon-box">
                    <MessageSquare size={32} color="#94a3b8" />
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    আপনি এখনও কোনো উত্তর দেননি
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                    ফিডে গিয়ে সহপাঠীদের প্রশ্নের সমাধান দিয়ে সাহায্য করুন এবং পয়েন্ট অর্জন করুন!
                  </p>
                  <button className="btn-secondary" onClick={onBack} style={{ margin: '0 auto' }}>
                    <span>ফিডে প্রশ্নগুলো দেখুন</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.answers.map((ans) => (
                    <motion.article
                      key={ans._id}
                      className="my-answer-card"
                      whileHover={{ scale: 1.01 }}
                      onClick={() => ans.questionId?._id && onOpenDetail(ans.questionId._id)}
                    >
                      {ans.questionId && (
                        <div className="my-answer-question-header">
                          <span className="tag-subject" style={{ fontSize: '11px', padding: '1px 6px' }}>
                            {ans.questionId.subject}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ans.questionId.text}
                          </span>
                          <ExternalLink size={13} color="#94a3b8" />
                        </div>
                      )}

                      <div style={{ marginTop: '8px' }}>
                        <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                          {ans.text}
                        </p>
                        {ans.imageUrl && <FeedImage imageUrl={ans.imageUrl} />}
                      </div>

                      <div className="my-answer-footer">
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(ans.createdAt).toLocaleDateString('bn-BD', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontSize: '12px', fontWeight: '600' }}>
                          <ThumbsUp size={13} />
                          <span>{ans.likeCount || 0} টি সহায়ক ভোট</span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
