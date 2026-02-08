

import React, { useState, useMemo, useEffect, useContext } from 'react';
import AuthPage from './pages/AuthPage';
// Fix: Use default import for TeacherDashboard to match the standard export pattern used in other page components
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPage from './pages/StudentPage';
import MartPage from './pages/MartPage';
import BankerPage from './pages/BankerPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import { User, Role } from './types';
import { AuthContext } from './contexts/AuthContext';
import { api } from './services/api';
import { HomeIcon } from './components/icons';

const AppContent: React.FC = () => {
  const { currentUser, login } = useContext(AuthContext);
  const [isTokenProcessing, setIsTokenProcessing] = useState(true);
  const [requestedView, setRequestedView] = useState<string | undefined>(undefined);
  
  // 선생님 계정일 때 현재 보고 있는 화면 모드 상태
  const [teacherActiveView, setTeacherActiveView] = useState<'admin' | 'banker' | 'mart' | 'student' | null>(null);

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
                setRequestedView(viewParam);
            } else {
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
          <div className="flex flex-col items-center justify-center h-full text-gray-600 bg-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066FF] mb-4"></div>
              <p className="text-lg font-medium">QR 코드로 접속 중입니다...</p>
          </div>
      );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  // 선생님인 경우 통합 메뉴 페이지 로직
  if (currentUser.role === Role.TEACHER) {
      if (!teacherActiveView) {
          return <RoleSelectionPage onSelect={setTeacherActiveView} />;
      }

      return (
          <div className="flex flex-col h-full relative">
              <div className="flex-1 h-full overflow-hidden">
                  {teacherActiveView === 'admin' && <TeacherDashboard onBackToMenu={() => setTeacherActiveView(null)} />}
                  {teacherActiveView === 'banker' && <BankerPage onBackToMenu={() => setTeacherActiveView(null)} />}
                  {teacherActiveView === 'mart' && <MartPage onBackToMenu={() => setTeacherActiveView(null)} />}
                  {teacherActiveView === 'student' && <StudentPage initialView={requestedView} onBackToMenu={() => setTeacherActiveView(null)} />}
              </div>
          </div>
      );
  }

  switch (currentUser.role) {
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
        // 현재 유저의 역할을 명확히 확인
        const role = currentUser?.role;
        // Fix: Removed redundant string comparison ('student') to resolve TypeScript narrowing error.
        // Role.STUDENT is already 'student', and the first part of the original comparison 
        // narrowed the 'role' variable such that the second part was considered unreachable/unintentional.
        const isStudent = role === Role.STUDENT;
        
        // 로컬 스토리지 비우기
        localStorage.removeItem('class_bank_user_id');
        
        // 주소 깨짐 방지를 위해 상대 경로 기반으로 리다이렉트 주소 설정
        // 학생인 경우 mode=app 파라미터를 붙여 학생 로그인 창이 뜨도록 함
        const redirectUrl = isStudent ? "/?mode=app" : "/";
        
        // 상태 초기화
        setCurrentUser(null);
        
        // 페이지 새로고침과 함께 리다이렉트
        window.location.href = redirectUrl;
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
