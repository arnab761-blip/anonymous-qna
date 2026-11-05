import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import TeacherVerifiedBadge from '../components/TeacherVerifiedBadge';
import FeedImage from '../components/FeedImage';
import {
  BarChart3,
  ShieldAlert,
  FileText,
  Users,
  CheckCircle2,
  Trash2,
  Ban,
  UserCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';

export default function AdminDashboardPage({ onBack }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'questions' | 'reports' | 'users'

  // Stats State
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Questions State
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [answersMap, setAnswersMap] = useState({});
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  // Reports State
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Users State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [message, setMessage] = useState('');

  const showFeedback = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3500);
  };

  // Fetch Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/stats');
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      alert(err.message || 'স্ট্যাটস লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Questions with Real Identity
  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.get('/admin/questions');
      if (res.success) {
        setQuestions(res.questions);
      }
    } catch (err) {
      alert(err.message || 'প্রশ্ন তালিকা লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch Answers for Question
  const toggleExpandQuestion = async (qId) => {
    if (expandedQuestionId === qId) {
      setExpandedQuestionId(null);
      return;
    }

    setExpandedQuestionId(qId);
    if (!answersMap[qId]) {
      setLoadingAnswers(true);
      try {
        const res = await api.get(`/admin/questions/${qId}/answers`);
        if (res.success) {
          setAnswersMap((prev) => ({ ...prev, [qId]: res.answers }));
        }
      } catch (err) {
        alert(err.message || 'উত্তরগুলো লোড করা যায়নি।');
      } finally {
        setLoadingAnswers(false);
      }
    }
  };

  // Fetch Reports
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get('/admin/reports?status=all');
      if (res.success) {
        setReports(res.reports);
      }
    } catch (err) {
      alert(err.message || 'রিপোর্টগুলো লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get(`/admin/users?q=${encodeURIComponent(userSearch)}`);
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      alert(err.message || 'ছাত্র তালিকা লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'questions') fetchQuestions();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  // Actions
  const handleToggleVerify = async (qId) => {
    try {
      const res = await api.post(`/admin/questions/${qId}/verify`, {});
      // Support PATCH if needed, api client does post by default, or use fetch:
      const rawRes = await fetch(`/admin/questions/${qId}/verify`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await rawRes.json();
      if (data.success) {
        setQuestions((prev) =>
          prev.map((q) =>
            q._id === qId ? { ...q, isVerifiedByTeacher: data.isVerifiedByTeacher } : q
          )
        );
        showFeedback(data.message);
      }
    } catch (err) {
      alert(err.message || 'যাচাই স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই প্রশ্ন এবং এর সব উত্তর মুছে ফেলতে চান?')) return;

    try {
      const res = await fetch(`/admin/questions/${qId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setQuestions((prev) => prev.filter((q) => q._id !== qId));
        showFeedback('প্রশ্নটি সফলভাবে মুছে ফেলা হয়েছে।');
      }
    } catch (err) {
      alert(err.message || 'প্রশ্ন মোছা যায়নি।');
    }
  };

  const handleDeleteAnswer = async (qId, aId) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই উত্তরটি মুছে ফেলতে চান?')) return;

    try {
      const res = await fetch(`/admin/answers/${aId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setAnswersMap((prev) => ({
          ...prev,
          [qId]: (prev[qId] || []).filter((a) => a._id !== aId)
        }));
        showFeedback('উত্তরটি মুছে ফেলা হয়েছে।');
      }
    } catch (err) {
      alert(err.message || 'উত্তর মোছা যায়নি।');
    }
  };

  const handleToggleBan = async (uId) => {
    try {
      const res = await fetch(`/admin/users/${uId}/ban`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === uId ? { ...u, isBanned: data.isBanned } : u))
        );
        // Also update questions author status if open
        setQuestions((prev) =>
          prev.map((q) => {
            if (q.authorId && q.authorId._id === uId) {
              return { ...q, authorId: { ...q.authorId, isBanned: data.isBanned } };
            }
            return q;
          })
        );
        showFeedback(data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert(err.message || 'ব্যান আপডেট করা যায়নি।');
    }
  };

  const handleUpdateReport = async (repId, status) => {
    try {
      const res = await fetch(`/admin/reports/${repId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) => (r._id === repId ? { ...r, status } : r))
        );
        showFeedback('রিপোর্ট স্ট্যাটাস আপডেট হয়েছে।');
      }
    } catch (err) {
      alert(err.message || 'রিপোর্ট আপডেট করতে ব্যর্থ হয়েছে।');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontWeight: '600' }}>
          শুধুমাত্র অ্যাডমিন (শিক্ষক) এই পেজটি দেখতে পারেন।
        </p>
        <button className="btn-secondary" onClick={onBack} style={{ marginTop: '12px' }}>
          ফিডে ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Top Banner */}
      <div style={{ backgroundColor: '#1e3a8a', color: '#ffffff', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700' }}>শিক্ষক ও অ্যাডমিন কন্ট্রোল প্যানেল</h1>
            <p style={{ fontSize: '12px', opacity: 0.9 }}>
              সকল ছাত্রের আসল পরিচয়, প্রশ্ন যাচাই ও নিরাপত্তা নিয়ন্ত্রণ
            </p>
          </div>
          <button
            onClick={onBack}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ফিডে ফিরুন
          </button>
        </div>
      </div>

      {/* Floating feedback message */}
      {message && (
        <div
          style={{
            position: 'sticky',
            top: '60px',
            zIndex: 30,
            margin: '10px 16px',
            padding: '10px 14px',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            borderRadius: '8px',
            border: '1px solid #a7f3d0',
            fontSize: '13px',
            fontWeight: '600',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          ✓ {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            flex: 1,
            padding: '12px 6px',
            fontSize: '13px',
            fontWeight: activeTab === 'stats' ? '700' : '500',
            border: 'none',
            borderBottom: activeTab === 'stats' ? '3px solid #2563eb' : 'none',
            color: activeTab === 'stats' ? '#2563eb' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <BarChart3 size={15} /> স্ট্যাটস
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          style={{
            flex: 1,
            padding: '12px 6px',
            fontSize: '13px',
            fontWeight: activeTab === 'questions' ? '700' : '500',
            border: 'none',
            borderBottom: activeTab === 'questions' ? '3px solid #2563eb' : 'none',
            color: activeTab === 'questions' ? '#2563eb' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <FileText size={15} /> প্রশ্ন ও উত্তর
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          style={{
            flex: 1,
            padding: '12px 6px',
            fontSize: '13px',
            fontWeight: activeTab === 'reports' ? '700' : '500',
            border: 'none',
            borderBottom: activeTab === 'reports' ? '3px solid #2563eb' : 'none',
            color: activeTab === 'reports' ? '#2563eb' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <ShieldAlert size={15} /> রিপোর্ট
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            flex: 1,
            padding: '12px 6px',
            fontSize: '13px',
            fontWeight: activeTab === 'users' ? '700' : '500',
            border: 'none',
            borderBottom: activeTab === 'users' ? '3px solid #2563eb' : 'none',
            color: activeTab === 'users' ? '#2563eb' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Users size={15} /> ছাত্র তালিকা
        </button>
      </div>

      {/* TAB 1: System Statistics */}
      {activeTab === 'stats' && (
        <div style={{ padding: '16px' }}>
          {loadingStats ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
            </div>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>মোট নিবন্ধিত ছাত্র</span>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#1e3a8a', marginTop: '4px' }}>
                  {stats.totalUsers} জন
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>আজকের নতুন প্রশ্ন</span>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
                  {stats.todayQuestions} টি
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>সর্বমোট প্রশ্ন</span>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#334155', marginTop: '4px' }}>
                  {stats.totalQuestions} টি
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>সর্বমোট উত্তর</span>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#334155', marginTop: '4px' }}>
                  {stats.totalAnswers} টি
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>পেন্ডিং রিপোর্ট</span>
                <p style={{ fontSize: '24px', fontWeight: '700', color: stats.pendingReports > 0 ? '#dc2626' : '#059669', marginTop: '4px' }}>
                  {stats.pendingReports} টি
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>ডাটাবেজ সাইজ (Atlas M0)</span>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb', marginTop: '4px' }}>
                  {stats.storageSizeMB} MB
                </p>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>সর্বোচ্চ সীমা: ৫১২ MB</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: Questions & Answers Moderation with Real Identities */}
      {activeTab === 'questions' && (
        <div style={{ padding: '16px' }}>
          {loadingQuestions ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
            </div>
          ) : questions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>কোনো প্রশ্ন নেই।</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {questions.map((q) => (
                <div
                  key={q._id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Real identity banner visible ONLY to Teacher */}
                  <div
                    style={{
                      backgroundColor: '#f1f5f9',
                      borderLeft: '4px solid #2563eb',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      fontSize: '12px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <div>
                      <strong>আইডি:</strong> {q.alias} &nbsp;|&nbsp;
                      <strong>আসল নাম:</strong> {q.authorId?.name || 'অজানা'} &nbsp;|&nbsp;
                      <strong>ফোন/ইমেইল:</strong> {q.authorId?.identifier || 'N/A'}
                    </div>
                    {q.authorId?.isBanned && (
                      <span style={{ color: '#dc2626', fontWeight: '700' }}>[ব্যান করা ইউজার]</span>
                    )}
                  </div>

                  {/* Question Content */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span className="tag-subject">{q.subject}</span>
                    <span className="tag-chapter">{q.chapter}</span>
                    {q.isVerifiedByTeacher && <TeacherVerifiedBadge />}
                  </div>

                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                    {q.text}
                  </p>

                  {q.imageUrl && <FeedImage imageUrl={q.imageUrl} />}

                  {/* Teacher Action Controls */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid #f1f5f9'
                    }}
                  >
                    {/* Toggle Teacher Verified */}
                    <button
                      onClick={() => handleToggleVerify(q._id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #a7f3d0',
                        backgroundColor: q.isVerifiedByTeacher ? '#d1fae5' : '#ffffff',
                        color: '#065f46',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle2 size={13} />
                      {q.isVerifiedByTeacher ? 'যাচাইকৃত (মুছুন)' : 'Teacher Verified বসান'}
                    </button>

                    {/* Ban Author */}
                    {q.authorId && (
                      <button
                        onClick={() => handleToggleBan(q.authorId._id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          backgroundColor: q.authorId.isBanned ? '#fef2f2' : '#ffffff',
                          color: '#dc2626',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Ban size={13} />
                        {q.authorId.isBanned ? 'আনব্যান করুন' : 'ছাত্রকে ব্যান করুন'}
                      </button>
                    )}

                    {/* Delete Question */}
                    <button
                      onClick={() => handleDeleteQuestion(q._id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #fca5a5',
                        backgroundColor: '#ffffff',
                        color: '#b91c1c',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                      প্রশ্ন মুছুন
                    </button>

                    {/* View Answers with Real Identity */}
                    <button
                      onClick={() => toggleExpandQuestion(q._id)}
                      style={{
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f8fafc',
                        color: '#334155',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>উত্তর ({q.answerCount || 0})</span>
                      {expandedQuestionId === q._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Expanded Answers List */}
                  {expandedQuestionId === q._id && (
                    <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#1e293b' }}>
                        উত্তরসমূহের আসল পরিচয়:
                      </h4>

                      {loadingAnswers ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (answersMap[q._id] || []).length === 0 ? (
                        <p style={{ fontSize: '12px', color: '#64748b' }}>কোনো উত্তর নেই।</p>
                      ) : (
                        (answersMap[q._id] || []).map((ans) => (
                          <div
                            key={ans._id}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              marginBottom: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                              <span>
                                <strong>{ans.alias}</strong> (নাম: {ans.authorId?.name || 'N/A'}, ফোন: {ans.authorId?.identifier || 'N/A'})
                              </span>
                              <button
                                onClick={() => handleDeleteAnswer(q._id, ans._id)}
                                style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }}
                                title="উত্তর মুছুন"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <p style={{ fontSize: '13px', color: '#1e293b' }}>{ans.text}</p>
                            {ans.imageUrl && <FeedImage imageUrl={ans.imageUrl} />}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Reports Moderation */}
      {activeTab === 'reports' && (
        <div style={{ padding: '16px' }}>
          {loadingReports ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
            </div>
          ) : reports.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>কোনো রিপোর্ট জমা নেই।</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.map((rep) => (
                <div
                  key={rep._id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: rep.status === 'pending' ? '4px solid #ef4444' : '4px solid #10b981',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                    <span style={{ fontWeight: '700', color: rep.status === 'pending' ? '#b91c1c' : '#047857' }}>
                      স্ট্যাটাস: {rep.status === 'pending' ? 'অমীমাংসিত (Pending)' : rep.status === 'resolved' ? 'মীমাংসিত (Resolved)' : 'খারিজ (Dismissed)'}
                    </span>
                    <span style={{ color: '#94a3b8' }}>
                      {new Date(rep.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '600', marginBottom: '6px' }}>
                    রিপোর্টের কারণ: {rep.reason}
                  </p>

                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
                    <span>রিপোর্টকারী: <strong>{rep.reporterId?.name}</strong> ({rep.reporterId?.alias} - {rep.reporterId?.identifier})</span>
                  </div>

                  {/* Target Content Preview */}
                  {rep.targetContent ? (
                    <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', marginBottom: '10px', fontSize: '13px', border: '1px dashed #cbd5e1' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                        অভিযুক্ত কনটেন্ট ({rep.targetType === 'question' ? 'প্রশ্ন' : 'উত্তর'}):
                      </span>
                      <p style={{ fontWeight: '500' }}>"{rep.targetContent.text}"</p>
                      <span style={{ fontSize: '11px', color: '#2563eb', marginTop: '4px', display: 'block' }}>
                        লেখক: {rep.targetContent.authorId?.name} ({rep.targetContent.alias} - {rep.targetContent.authorId?.identifier})
                      </span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '8px' }}>
                      [কনটেন্টটি ইতিমধ্যে মুছে ফেলা হয়েছে]
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {rep.targetContent && rep.targetContent.authorId && (
                      <button
                        onClick={() => handleToggleBan(rep.targetContent.authorId._id)}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '4px 8px', color: '#dc2626' }}
                      >
                        <Ban size={12} /> অভিযুক্ত ছাত্রকে ব্যান
                      </button>
                    )}

                    {rep.targetContent && (
                      <button
                        onClick={() =>
                          rep.targetType === 'question'
                            ? handleDeleteQuestion(rep.targetId)
                            : handleDeleteAnswer(rep.targetContent.questionId, rep.targetId)
                        }
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '4px 8px', color: '#b91c1c' }}
                      >
                        <Trash2 size={12} /> কনটেন্ট মুছুন
                      </button>
                    )}

                    {rep.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateReport(rep._id, 'resolved')}
                          className="btn-primary"
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#059669' }}
                        >
                          মীমাংসা করুন
                        </button>
                        <button
                          onClick={() => handleUpdateReport(rep._id, 'dismissed')}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          খারিজ করুন
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Students / Users Management */}
      {activeTab === 'users' && (
        <div style={{ padding: '16px' }}>
          {/* Search box */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="আসল নাম, ফোন বা alias দিয়ে খুঁজুন..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <button className="btn-primary" onClick={fetchUsers}>
              <Search size={16} />
            </button>
          </div>

          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.map((u) => (
                <div
                  key={u._id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        {u.name}
                      </span>
                      {u.role === 'admin' && (
                        <span style={{ fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                          শিক্ষক
                        </span>
                      )}
                      {u.isBanned && (
                        <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                          নিষিদ্ধ
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      <span>ফোন/ইমেইল: {u.identifier}</span> &nbsp;•&nbsp;
                      <span>আইডি: <strong>{u.alias}</strong></span>
                    </div>
                  </div>

                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleToggleBan(u._id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: u.isBanned ? '1px solid #86efac' : '1px solid #fca5a5',
                        backgroundColor: u.isBanned ? '#ecfdf5' : '#fef2f2',
                        color: u.isBanned ? '#047857' : '#dc2626',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {u.isBanned ? 'ব্যান প্রত্যাহার' : 'ব্যান করুন'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
