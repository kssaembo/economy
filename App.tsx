import React, { useState, useMemo, useEffect, useContext } from 'react';
import AuthPage from './pages/AuthPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPage from './pages/StudentPage';
import MartPage from './pages/MartPage';
import BankerPage from './pages/BankerPage';
import { User, Role } from './types';
import { AuthContext } from './contexts/AuthContext';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { currentUser, login } = useContext(AuthContext);
  const [isTokenProcessing, setIsTokenProcessing] = useState(true);

  useEffect(() => {
    const handleTokenLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      let token = params.get('token');

      // Check for token in hash (HashRouter support or specific hash params)
      if (!token && window.location.hash.includes('token=')) {
        const hashParts = window.location.hash.split('?');
        if (hashParts.length > 1) {
            const hashParams = new URLSearchParams(hashParts[1]);
            token = hashParams.get('token');
        }
        // Handle case like #/token=xyz
        if (!token && window.location.hash.includes('token=')) {
             const match = window.location.hash.match(/token=([^&]*)/);
             if (match) token = match[1];
        }
      }

      if (token && !currentUser) {
        try {
          const user = await api.loginWithQrToken(token);
          if (user) {
            login(user);
          } else {
            alert('유효하지 않은 QR 코드이거나 만료된 토큰입니다.');
          }
        } catch (error) {
          console.error('QR Login failed', error);
          alert('QR 코드로 로그인 중 오류가 발생했습니다.');
        } finally {
          // Clean up URL to prevent re-login on refresh
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          setIsTokenProcessing(false);
        }
      } else {
          setIsTokenProcessing(false);
      }
    };
    
    // Slight delay to ensure router/window is ready
    handleTokenLogin();
  }, [login, currentUser]);

  if (isTokenProcessing) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium">QR 코드로 접속 중입니다...</p>
          </div>
      );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  switch (currentUser.role) {
    case Role.TEACHER:
      return <TeacherDashboard />;
    case Role.STUDENT:
      return <StudentPage />;
    case Role.MART:
      return <MartPage />;
    case Role.BANKER:
      return <BankerPage />;
    default:
      return <AuthPage />;
  }
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const authContextValue = useMemo(() => ({
    currentUser,
    login: (user: User) => setCurrentUser(user),
    logout: () => setCurrentUser(null),
  }), [currentUser]);

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-gray-100 md:p-4 flex justify-center items-center">
        <div className="w-full h-screen md:max-w-5xl md:h-[calc(100vh-2rem)] md:max-h-[900px] bg-white md:rounded-2xl shadow-lg overflow-hidden flex flex-col">
          <AppContent />
        </div>
      </div>
    </AuthContext.Provider>
  );
};

export default App;