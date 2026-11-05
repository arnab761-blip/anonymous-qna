import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, LogIn, MessageSquarePlus } from 'lucide-react';

export default function Navbar({ onNavigate, currentPage }) {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        onClick={() => onNavigate('feed')}
      >
        <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a8a' }}>
          🎓 অ্যানোনিমাস Q&A
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user ? (
          <>
            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                style={{
                  backgroundColor: currentPage === 'admin' ? '#1e40af' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                প্যানেল
              </button>
            )}
            <span className="alias-badge" title="আপনার স্থায়ী গোপন পরিচয়">
              <User size={13} />
              {user.alias}
            </span>
            <button
              onClick={logout}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="লগআউট"
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <button
            className="btn-secondary"
            onClick={() => onNavigate('auth')}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            <LogIn size={13} />
            লগইন
          </button>
        )}
      </div>
    </header>
  );
}
