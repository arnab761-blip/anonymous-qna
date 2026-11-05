import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import FeedPage from './pages/FeedPage';
import AskQuestionPage from './pages/AskQuestionPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
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

      <main style={{ flex: 1, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', minHeight: '100%' }}
          >
            {currentPage === 'feed' && (
              <FeedPage
                onOpenDetail={handleOpenDetail}
                onNavigateAsk={handleNavigateAsk}
              />
            )}

            {currentPage === 'dashboard' && (
              <StudentDashboardPage
                onBack={() => setCurrentPage('feed')}
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
          </motion.div>
        </AnimatePresence>
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
