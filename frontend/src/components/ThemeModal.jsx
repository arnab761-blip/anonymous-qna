import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Palette, Check, X, Sparkles } from 'lucide-react';

export default function ThemeModal({ isOpen, onClose }) {
  const { theme, selectTheme, themes } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="theme-modal-overlay" onClick={onClose}>
        <motion.div
          className="theme-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="theme-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="theme-header-icon-box">
                <Palette size={18} color="#ffffff" />
              </div>
              <div>
                <h3 className="theme-modal-title">থিম ও ব্যাকগ্রাউন্ড ইন্টারফেস</h3>
                <p className="theme-modal-subtitle">আপনার পছন্দের অনন্য থিমটি নির্বাচন করুন</p>
              </div>
            </div>
            <button className="theme-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="theme-options-grid">
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <motion.div
                  key={t.id}
                  className={`theme-option-card ${isSelected ? 'selected' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    selectTheme(t.id);
                  }}
                >
                  <div className="theme-swatch-box" style={{ backgroundColor: t.bgPreview }}>
                    <div
                      className="theme-swatch-accent"
                      style={{ backgroundColor: t.previewColor }}
                    />
                    {isSelected && (
                      <div className="theme-check-badge">
                        <Check size={12} color="#ffffff" />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <span className="theme-name">{t.name}</span>
                      <span className="theme-tag">{t.tag}</span>
                    </div>
                    <p className="theme-desc">{t.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="theme-modal-footer">
            <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              <Sparkles size={15} />
              <span>প্রয়োগ করুন ও ব্রাউজ করুন</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
