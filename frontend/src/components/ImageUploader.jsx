import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function ImageUploader({ onUploadSuccess, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [compressProgress, setCompressProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');

    // 1. Validate file size (max 5 MB raw file)
    if (file.size > 5 * 1024 * 1024) {
      setError('ফাইলের সাইজ ৫ MB-এর বেশি হতে পারবে না।');
      return;
    }

    // 2. Validate format (jpg, png, webp only)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি গ্রহণযোগ্য।');
      return;
    }

    // 3. Show immediate local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      setIsProcessing(true);
      setCompressProgress(10);

      // 4. Client-side compression to WebP (max 1280px, max ~200KB)
      const options = {
        maxSizeMB: 0.2,           // ~200KB target
        maxWidthOrHeight: 1280,   // max dimension 1280px
        useWebWorker: true,
        fileType: 'image/webp',
        onProgress: (progress) => {
          setCompressProgress(Math.min(90, Math.round(progress)));
        }
      };

      const compressedFile = await imageCompression(file, options);
      setCompressProgress(95);

      // 5. Request direct signed-upload credentials from backend
      const sigData = await api.get('/upload/signature');
      if (!sigData.success) {
        throw new Error(sigData.message || 'আপলোড সিগনেচার পাওয়া যায়নি।');
      }

      const { uploadUrl, apiKey, timestamp, signature, folder } = sigData.data;

      // 6. Direct upload to Cloudinary (zero backend bandwidth usage!)
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const cloudRes = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      const cloudData = await cloudRes.json();
      if (!cloudData.secure_url) {
        throw new Error('Cloudinary আপলোড সম্পন্ন হতে পারেনি।');
      }

      setCompressProgress(100);
      setIsProcessing(false);
      onUploadSuccess(cloudData.secure_url);
    } catch (err) {
      setIsProcessing(false);
      setError(err.message || 'ছবি আপলোড করতে ব্যর্থ হয়েছে।');
      setPreviewUrl(null);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setCompressProgress(0);
    setError('');
    if (onRemove) onRemove();
  };

  return (
    <div style={{ marginTop: '12px', marginBottom: '12px' }}>
      {!previewUrl ? (
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            border: '2px dashed #cbd5e1',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <ImagePlus size={24} color="#64748b" />
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginTop: '6px' }}>
            খাতার ছবি বা স্ক্রিনশট যোগ করুন (ঐচ্ছিক)
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            সর্বোচ্চ ৫ MB (স্বয়ংক্রিয়ভাবে 1280px ও ~200KB WebP-তে অপ্টিমাইজ হবে)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <img
            src={previewUrl}
            alt="Upload Preview"
            style={{ width: '100%', height: '180px', objectFit: 'cover' }}
          />

          {isProcessing ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Loader2 className="animate-spin" size={24} style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>
                কম্প্রেস ও আপলোড হচ্ছে... {compressProgress}%
              </span>
              <div
                style={{
                  width: '160px',
                  height: '6px',
                  backgroundColor: '#334155',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  marginTop: '8px'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${compressProgress}%`,
                    backgroundColor: '#10b981',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="ছবি মুছুন"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: '500' }}>
          {error}
        </p>
      )}
    </div>
  );
}
