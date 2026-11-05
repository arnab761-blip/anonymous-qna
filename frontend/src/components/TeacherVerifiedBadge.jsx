import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function TeacherVerifiedBadge() {
  return (
    <span className="verified-badge" title="শিক্ষক এই উত্তর বা প্রশ্নটি সঠিক বলে যাচাই করেছেন">
      <CheckCircle2 size={13} className="text-emerald-600" />
      শিক্ষক কর্তৃক যাচাইকৃত
    </span>
  );
}
