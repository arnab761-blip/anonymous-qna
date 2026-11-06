import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeModal from './ThemeModal';
import { User, LogOut, LogIn, LayoutDashboard, Shield, Palette } from 'lucide-react';

export default function Navbar({ onNavigate, currentPage }) {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        <div
          className="app-logo-box"
          onClick={() => onNavigate('feed')}
        >
          <div className="app-logo-icon">
            <span>🎓</span>
          </div>
          <div className="app-logo-text-group">
            <span className="app-logo-text">অ্যানোনিমাস Q&A</span>
            <span className="app-logo-sub">শিক্ষার্থীদের মুক্ত ফোরাম</span>
          </div>
        </div>

        <div className="nav-right-cluster">
          {/* Theme Palette Switcher Button */}
          <button
            className="theme-nav-btn"
            onClick={() => setIsThemeOpen(true)}
            title={`থিম পরিবর্তন করুন (বর্তমান: ${currentTheme.name})`}
          >
            <Palette size={14} />
            <span className="theme-nav-btn-label">থিম</span>
          </button>

          {user ? (
            <>
              {/* Student Dashboard Button */}
              <button
                onClick={() => onNavigate('dashboard')}
                className={`nav-action-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
                title="আমার ড্যাশবোর্ড"
              >
                <LayoutDashboard size={13} />
                <span className="nav-btn-text">ড্যাশবোর্ড</span>
              </button>

              {/* Admin Panel Button */}
              {user.role === 'admin' && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`nav-action-btn admin-btn ${currentPage === 'admin' ? 'active' : ''}`}
                  title="অ্যাডমিন প্যানেল"
                >
                  <Shield size={13} />
                  <span className="nav-btn-text">প্যানেল</span>
                </button>
              )}

              {/* Clickable Student Alias Badge */}
              <div
                className={`alias-badge clickable ${currentPage === 'dashboard' ? 'active-alias' : ''}`}
                title="আপনার গোপন ছদ্মনাম (ড্যাশবোর্ড দেখতে ক্লিক করুন)"
                onClick={() => onNavigate('dashboard')}
              >
                <User size={12} />
                <span className="alias-text">{user.alias}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="nav-icon-btn"
                title="লগআউট"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button
              className="btn-primary btn-login-nav"
              onClick={() => onNavigate('auth')}
            >
              <LogIn size={13} />
              <span>লগইন</span>
            </button>
          )}
        </div>
      </header>

      {/* Interactive Theme Selection Modal */}
      <ThemeModal isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
    </>
  );
}
