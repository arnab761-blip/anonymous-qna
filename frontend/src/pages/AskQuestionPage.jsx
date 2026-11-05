import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import ImageUploader from '../components/ImageUploader';
import { ArrowLeft, Search, HelpCircle, Loader2 } from 'lucide-react';

const SUBJECT_OPTIONS = [
  'পদার্থবিজ্ঞান (Physics)',
  'উচ্চতর গণিত (Math)',
  'রসায়ন (Chemistry)',
  'জীববিজ্ঞান (Biology)',
  'আইসিটি (ICT)',
  'সাধারণ জ্ঞান (GK)'
];

export default function AskQuestionPage({ onBack, onQuestionCreated, onOpenDetail }) {
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [chapter, setChapter] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState(null);

  // Duplicate / Similar Questions Search State
  const [similarQuestions, setSimilarQuestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debounceTimer = useRef(null);

  // 500ms Debounced Duplicate Search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.trim().length >= 4) {
      setIsSearching(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const res = await api.get(`/questions/search?q=${encodeURIComponent(text.trim())}`);
          if (res.success) {
            setSimilarQuestions(res.results || []);
          }
        } catch {
          // Silent fallback for search errors
        } finally {
          setIsSearching(false);
        }
      }, 500);
    } else {
      setSimilarQuestions([]);
      setIsSearching(false);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [text]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (text.trim().length < 10) {
      setError('প্রশ্নের বিবরণ অন্তত ১০ অক্ষরের হতে হবে।');
      return;
    }

    if (!chapter.trim()) {
      setError('অধ্যায় বা চ্যাপ্টারের নাম লিখুন।');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/questions', {
        subject,
        chapter: chapter.trim(),
        text: text.trim(),
        imageUrl
      });

      if (res.success) {
        onQuestionCreated(res.question._id);
      }
    } catch (err) {
      setError(err.message || 'প্রশ্ন পোস্ট করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
        >
          <ArrowLeft size={20} color="#334155" />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>নতুন প্রশ্ন করুন</h2>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            বিষয় (Subject)
          </label>
          <select
            className="form-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {SUBJECT_OPTIONS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            অধ্যায় (Chapter)
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="উদাঃ ভেক্টর, নিউটনিয়ান বলবিদ্যা"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            প্রশ্নের বিস্তারিত বিবরণ
          </label>
          <textarea
            className="form-input"
            rows="5"
            placeholder="আপনার প্রশ্নটি স্পষ্টভাবে লিখুন (ন্যূনতম ১০ অক্ষর)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            <span>মার্জিত ভাষা ব্যবহার করুন</span>
            <span>{text.length}/2000</span>
          </div>
        </div>

        {/* Live Duplicate Question Detector Box */}
        {isSearching && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={14} />
            <span>একই রকম প্রশ্ন পূর্বে করা হয়েছে কিনা খোঁজা হচ্ছে...</span>
          </div>
        )}

        {similarQuestions.length > 0 && (
          <div className="similar-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#b45309', marginBottom: '6px' }}>
              <HelpCircle size={15} />
              <span>একই রকম আগের কিছু প্রশ্ন পাওয়া গেছে:</span>
            </div>
            <p style={{ fontSize: '11px', color: '#92400e', marginBottom: '8px' }}>
              নতুন প্রশ্ন পোস্ট করার আগে দেখুন আপনার উত্তর আগেই দেওয়া আছে কিনা:
            </p>
            {similarQuestions.map((sq) => (
              <div
                key={sq._id}
                className="similar-item"
                onClick={() => onOpenDetail(sq._id)}
              >
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a8a' }}>
                  {sq.text}
                </p>
                <span style={{ fontSize: '11px', color: '#78350f' }}>
                  বিষয়: {sq.subject} • {sq.answerCount || 0} টি উত্তর
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Image Attachment (Signed Cloudinary Upload) */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
            ছবি বা স্ক্রিনশট (ঐচ্ছিক)
          </label>
          <ImageUploader
            onUploadSuccess={(url) => setImageUrl(url)}
            onRemove={() => setImageUrl(null)}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: '100%', padding: '12px', marginTop: '8px' }}
        >
          {loading ? 'পোস্ট করা হচ্ছে...' : 'প্রশ্নটি পোস্ট করুন'}
        </button>
      </form>
    </div>
  );
}
