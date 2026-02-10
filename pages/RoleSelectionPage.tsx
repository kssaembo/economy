
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Role, Account } from '../types';
import { MainAdminIcon, MainBankIcon, MainMartIcon, StudentIcon, LogoutIcon, NewspaperIcon } from '../components/icons';

interface RoleSelectionPageProps {
  onSelect: (view: 'admin' | 'banker' | 'mart' | 'student') => void;
}

const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onSelect }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const [teacherAccount, setTeacherAccount] = useState<Account | null>(null);

  // 자동 로그인을 위해 선생님의 국고 계좌(qrToken 포함) 정보를 가져옵니다.
  useEffect(() => {
    if (currentUser?.role === Role.TEACHER) {
      api.getTeacherAccount()
        .then(setTeacherAccount)
        .catch(err => console.error("선생님 계좌 정보를 가져오는데 실패했습니다.", err));
    }
  }, [currentUser]);

  // 경제 뉴스 서비스 주소에 토큰을 포함시킵니다.
  const newsUrl = teacherAccount?.qrToken 
    ? `https://kidseconews.vercel.app/?token=${teacherAccount.qrToken}`
    : `https://kidseconews.vercel.app/`;

  const roles = [
    { 
      id: 'admin', 
      title: '교사 관리자', 
      desc: '학급 경제 시스템 전체 세팅, 학생 및 직업/세금 관리', 
      icon: MainAdminIcon, 
      color: 'bg-[#0066FF]',
      target: 'admin' as const
    },
    { 
      id: 'banker', 
      title: '은행원 모드', 
      desc: '입출금 처리, 주식 상장/가격 관리 및 적금 상품 관리', 
      icon: MainBankIcon, 
      color: 'bg-[#5856D6]',
      target: 'banker' as const
    },
    { 
      id: 'mart', 
      title: '마트 모드', 
      desc: '마트 POS기기를 통한 결제 관리 및 마트 수익금 송금', 
      icon: MainMartIcon, 
      color: 'bg-[#34C759]',
      target: 'mart' as const
    },
    { 
      id: 'student', 
      title: '학생 페이지', 
      desc: '학생의 시점에서 자산 확인, 송금 및 투자 시스템 확인', 
      icon: StudentIcon, 
      color: 'bg-[#FF9500]/50',
      target: 'student' as const
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F2F4F7] p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col justify-center py-12">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              안녕하세요, <br className="md:hidden" />
              <span className="text-[#0066FF]">{currentUser?.teacherAlias || currentUser?.name}</span> 선생님
            </h1>
            <p className="text-gray-500 font-bold text-sm tracking-tight">오늘은 어떤 업무를 수행하시겠습니까?</p>
          </div>
          <button 
            onClick={logout} 
            className="group flex items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-white hover:border-red-100 hover:bg-red-50 transition-all active:scale-95"
          >
            <span className="text-xs font-bold text-gray-400 group-hover:text-red-500">로그아웃</span>
            <LogoutIcon className="w-5 h-5 text-gray-300 group-hover:text-red-500" />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => onSelect(role.target)}
              className="group relative bg-white p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:scale-[1.03] hover:border-[#0066FF]/20 transition-all flex items-center text-left"
            >
              {role.id === 'student' ? (
                <div className={`w-20 h-20 ${role.color} rounded-[28px] flex items-center justify-center mr-6 shadow-lg shadow-gray-200 group-hover:rotate-6 transition-transform overflow-hidden shrink-0`}>
                  <role.icon className="w-10 h-10 text-white" />
                </div>
              ) : (
                <role.icon className="w-20 h-20 mr-6 group-hover:rotate-6 transition-transform shrink-0 object-contain" />
              )}
              
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-[#0066FF] transition-colors">{role.title}</h3>
                <p className="text-sm text-gray-400 font-bold leading-snug tracking-tight">{role.desc}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#0066FF] transition-colors shrink-0">
                <svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* 경제 뉴스 버튼 추가 - 동적 링크 적용 */}
        <div className="mt-8 flex justify-center">
          <a
            href={newsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-8 py-5 bg-white rounded-[30px] shadow-[0_8px_25px_rgba(0,0,0,0.03)] border border-white hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:scale-[1.02] hover:border-indigo-100 transition-all active:scale-95 w-full md:w-auto md:min-w-[320px] justify-center"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <NewspaperIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-lg font-black text-gray-800 group-hover:text-indigo-600 transition-colors">경제 뉴스 바로가기</span>
          </a>
        </div>
        
        <footer className="mt-16 text-center text-black">
            <p className="text-sm font-bold mb-1">
                제안이나 문의사항이 있으시면 언제든 메일 주세요.
            </p>
            <p className="text-sm font-bold mb-4">
                Contact: sinjoppo@naver.com
            </p>
            <p className="text-[10px] font-medium opacity-80">
                ⓒ 2026. Kwon's class. All rights reserved.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
