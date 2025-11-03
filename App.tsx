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

  useEffect(() => {
    const handleTokenLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (token && !currentUser) {
        try {
          const user = await api.loginWithQrToken(token);
          if (user) {
            login(user);
          } else {
            alert('유효하지 않은 QR 코드입니다.');
          }
        } catch (error) {
          console.error('QR Login failed', error);
          alert('QR 코드로 로그인 중 오류가 발생했습니다.');
        } finally {
          // Clean up URL
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    };
    handleTokenLogin();
  }, [login, currentUser]);


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
        <div className="w-full h-full md:max-w-5xl md:h-[calc(100vh-2rem)] md:max-h-[900px] bg-white md:rounded-2xl shadow-lg overflow-hidden flex flex-col">
          <AppContent />
        </div>
      </div>
    </AuthContext.Provider>
  );
};

export default App;