import React, { useState } from 'react';
import { getThumbnailUrl, getFullImageUrl } from '../utils/cloudinaryHelper';
import { Maximize2, X } from 'lucide-react';

export default function FeedImage({ imageUrl }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!imageUrl) return null;

  return (
    <>
      <div
        className="feed-image-container"
        style={{ marginTop: '10px', cursor: 'pointer', position: 'relative' }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <img
          src={getThumbnailUrl(imageUrl)}
          loading="lazy"
          alt="সংযুক্ত ছবি"
          style={{
            maxHeight: '220px',
            width: '100%',
            objectFit: 'cover',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: '#2563eb',
            fontWeight: '600',
            marginTop: '4px'
          }}
        >
          <Maximize2 size={12} />
          বড় করে দেখতে ছবিতে চাপুন
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '-36px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '50%',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
            <img
              src={getFullImageUrl(imageUrl)}
              alt="বড় ভিউ"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: '8px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
