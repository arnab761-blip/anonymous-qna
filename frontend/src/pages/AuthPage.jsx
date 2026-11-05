import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function AuthPage({ onAuthSuccess }) {
  const { login, register, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!name || name.trim().length < 2) {
        setError('অনুগ্রহ করে আপনার সঠিক পূর্ণ নাম লিখুন।');
        return;
      }
    }

    if (!identifier || identifier.trim().length < 5) {
      setError('সঠিক ইমেইল অথবা ১১ ডিজিটের মোবাইল নম্বর দিন।');
      return;
    }

    if (!password || password.length < 6) {
      setError('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
      return;
    }

    let result;
    if (isRegister) {
      result = await register(name.trim(), identifier.trim(), password);
    } else {
      result = await login(identifier.trim(), password);
    }

    if (result.success) {
      onAuthSuccess();
    } else {
      setError(result.message || 'ব্যর্থ হয়েছে, আবার চেষ্টা করুন।');
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '400px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e3a8a' }}>
          {isRegister ? 'ছাত্র রেজিস্ট্রেশন' : 'ফোরামে লগইন করুন'}
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
          {isRegister
            ? 'আপনার পরিচয় ছাত্রদের কাছে গোপন থাকবে এবং একটি ইউনিক আইডি তৈরি হবে।'
            : 'প্রশ্ন জিজ্ঞাসা এবং আলোচনায় অংশ নিতে লগইন করুন।'}
        </p>
      </div>

      {isRegister && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#1e40af'
          }}
        >
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>কঠোর গোপনীয়তা:</strong> আপনার আসল নাম ও নম্বর শুধুমাত্র শিক্ষক দেখতে পারবেন। অন্য কোনো ছাত্র দেখতে পাবে না।
          </span>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {isRegister && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
              আপনার আসল নাম (শিক্ষকের জন্য)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="উদাঃ মোঃ রফিকুল ইসলাম"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            ইমেইল অথবা মোবাইল নম্বর
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="017XXXXXXXX বা student@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            পাসওয়ার্ড
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="ন্যূনতম ৬ অক্ষরের পাসওয়ার্ড"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? 'প্রসেস হচ্ছে...' : isRegister ? 'অ্যাকাউন্ট তৈরি করুন' : 'লগইন'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
        {isRegister ? (
          <span>
            ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
            <button
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              style={{ color: '#2563eb', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              লগইন করুন
            </button>
          </span>
        ) : (
          <span>
            নতুন ছাত্র?{' '}
            <button
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              style={{ color: '#2563eb', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              রেজিস্ট্রেশন করুন
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
