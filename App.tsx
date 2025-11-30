
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
  const [requestedView, setRequestedView] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleTokenLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      let token = params.get('token');
      let viewParam = params.get('view');

      // Check for token/view in hash (HashRouter support or specific hash params)
      if (window.location.hash) {
        const hashParts = window.location.hash.split('?');
        if (hashParts.length > 1) {
            const hashParams = new URLSearchParams(hashParts[1]);
            if (!token) token = hashParams.get('token');
            if (!viewParam) viewParam = hashParams.get('view');
        }
        // Handle case like #/token=xyz
        if (!token) {
             const match = window.location.hash.match(/token=([^&]*)/);
             if (match) token = match[1];
        }
         // Handle case like #/...&view=xyz
        if (!viewParam) {
             const match = window.location.hash.match(/view=([^&]*)/);
             if (match) viewParam = match[1];
        }
      }

      if (token && !currentUser) {
        try {
          const user = await api.loginWithQrToken(token);
          if (user) {
            login(user);
            
            if (viewParam) {
                // URL에 명시된 화면이 있으면 그곳으로 이동
                setRequestedView(viewParam);
            } else {
                // URL에 화면 정보가 없을 경우 (기존 QR 등)
                // 학생이면 '송금(transfer)' 화면을 기본값으로, 그 외는 '홈(home)'을 기본값으로 설정
                const defaultView = user.role === Role.STUDENT ? 'transfer' : 'home';
                setRequestedView(defaultView);
            }

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
      return <StudentPage initialView={requestedView} />;
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

  // Auto-login on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('class_bank_user_id');
    if (storedUserId) {
        api.login(storedUserId).then(user => {
            if(user) setCurrentUser(user);
        }).catch(err => {
            console.error("Auto login failed", err);
            localStorage.removeItem('class_bank_user_id');
        });
    }
  }, []);

  const authContextValue = useMemo(() => ({
    currentUser,
    login: (user: User) => {
        // Save to local storage for persistence
        localStorage.setItem('class_bank_user_id', user.userId);
        setCurrentUser(user);
    },
    logout: () => {
        // Clear local storage
        localStorage.removeItem('class_bank_user_id');
        setCurrentUser(null);
    },
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
