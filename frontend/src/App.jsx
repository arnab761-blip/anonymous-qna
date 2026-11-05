import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import FeedPage from './pages/FeedPage';
import AskQuestionPage from './pages/AskQuestionPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import AuthPage from './pages/AuthPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('feed');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const handleOpenDetail = (questionId) => {
    setSelectedQuestionId(questionId);
    setCurrentPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAsk = () => {
    if (!user) {
      setCurrentPage('auth');
      return;
    }
    setCurrentPage('ask');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuestionCreated = (newQuestionId) => {
    setSelectedQuestionId(newQuestionId);
    setCurrentPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <Navbar onNavigate={(page) => setCurrentPage(page)} currentPage={currentPage} />

      <main style={{ flex: 1 }}>
        {currentPage === 'feed' && (
          <FeedPage
            onOpenDetail={handleOpenDetail}
            onNavigateAsk={handleNavigateAsk}
          />
        )}

        {currentPage === 'ask' && (
          <AskQuestionPage
            onBack={() => setCurrentPage('feed')}
            onQuestionCreated={handleQuestionCreated}
            onOpenDetail={handleOpenDetail}
          />
        )}

        {currentPage === 'detail' && selectedQuestionId && (
          <QuestionDetailPage
            questionId={selectedQuestionId}
            onBack={() => setCurrentPage('feed')}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onAuthSuccess={() => setCurrentPage('feed')}
          />
        )}

        {currentPage === 'admin' && (
          <AdminDashboardPage
            onBack={() => setCurrentPage('feed')}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
