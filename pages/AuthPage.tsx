

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Role, User } from '../types';
import { StudentIcon, MainAdminIcon, MainBankIcon, MainMartIcon, CheckIcon, ErrorIcon } from '../components/icons';

type AuthMode = 'main' | 'login' | 'student-select' | 'app-login' | 'app-change-password';

const AuthPage: React.FC = () => {
    const { login } = useContext(AuthContext);
    const [mode, setMode] = useState<AuthMode>('main');
    const [loginTarget, setLoginTarget] = useState<{ role: Role, title: string, userId: string } | null>(null);
    const [password, setPassword] = useState('');
    
    // App Login State
    const [grade, setGrade] = useState('');
    const [cls, setCls] = useState('');
    const [num, setNum] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [newAppPassword, setNewAppPassword] = useState(''); // For password change
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [students, setStudents] = useState<User[]>([]);

    // 1. 초기 로드 시 URL만 확인 (Dependency Array 비움 [])
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'app') {
            setMode('app-login');
        }
    }, []);

    // 2. 모드가 변경될 때 필요한 데이터 로딩 (학생 선택 모드일 때만)
    useEffect(() => {
        if (mode === 'student-select') {
            api.getUsersByRole(Role.STUDENT).then(setStudents);
        }
    }, [mode]);

    const handleAdminLogin = async () => {
        if (!loginTarget) return;
        if (password !== '1234') {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }
        await handleLogin(loginTarget.userId);
    };
    
    const handleLogin = async (userId: string) => {
        setLoading(true);
        setError('');
        try {
            const user = await api.login(userId);
            if (user) {
                login(user);
            } else {
                setError('사용자를 찾을 수 없습니다.');
            }
        } catch (err) {
            setError('로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleAppLogin = async () => {
        if (!grade || !cls || !num || !appPassword) {
            setError('모든 정보를 입력해주세요.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const user = await api.loginWithPassword(parseInt(grade), parseInt(cls), parseInt(num), appPassword);
            if (user) {
                login(user);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!grade || !cls || !num || !appPassword || !newAppPassword) {
            setError('모든 정보를 입력해주세요.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            // 1. Verify credentials first by trying to login
            const user = await api.loginWithPassword(parseInt(grade), parseInt(cls), parseInt(num), appPassword);
            if (user) {
                // 2. If valid, change password
                await api.changePassword(user.userId, appPassword, newAppPassword);
                setSuccessMessage('비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.');
                // Clear fields for login
                setAppPassword(''); 
                setNewAppPassword('');
                setTimeout(() => {
                    setMode('app-login');
                    setSuccessMessage('');
                }, 2000);
            }
        } catch (err: any) {
            setError(err.message === '비밀번호가 일치하지 않습니다.' ? '현재 비밀번호가 일치하지 않습니다.' : err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const reset = () => {
        // If in app mode, stay in app mode but clear errors
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'app' || mode === 'app-login' || mode === 'app-change-password') {
             if (mode === 'app-change-password') {
                 setMode('app-login'); // Go back to login form
             }
             setGrade(''); setCls(''); setNum(''); setAppPassword(''); setNewAppPassword(''); setError(''); setSuccessMessage('');
             return;
        }
        
        setMode('main');
        setLoginTarget(null);
        setPassword('');
        setError('');
    };

    if (loading && mode !== 'main') {
        return <div className="flex items-center justify-center h-full text-white bg-gray-800">로딩 중...</div>;
    }
    
    // Student App Login View
    if (mode === 'app-login') {
        return (
            <div className="flex flex-col h-full p-8 bg-gray-50">
                 <div className="flex-grow flex flex-col items-center justify-center max-w-sm mx-auto w-full">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full">
                        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">학생 로그인</h2>
                        <p className="text-center text-gray-500 mb-6">학번과 비밀번호를 입력하세요.</p>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                <input type="number" value={grade} onChange={e => setGrade(e.target.value)} placeholder="학년" className="p-3 border rounded-lg text-center" />
                                <input type="number" value={cls} onChange={e => setCls(e.target.value)} placeholder="반" className="p-3 border rounded-lg text-center" />
                                <input type="number" value={num} onChange={e => setNum(e.target.value)} placeholder="번호" className="p-3 border rounded-lg text-center" />
                            </div>
                            <input 
                                type="password" 
                                value={appPassword} 
                                onChange={e => setAppPassword(e.target.value)} 
                                placeholder="비밀번호" 
                                className="w-full p-3 border rounded-lg"
                                onKeyDown={e => e.key === 'Enter' && handleAppLogin()}
                            />
                            
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {successMessage && <p className="text-green-600 text-sm text-center">{successMessage}</p>}
                            
                            <button onClick={handleAppLogin} disabled={loading} className="w-full p-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-transform active:scale-95 disabled:bg-gray-400">
                                {loading ? '로그인 중...' : '로그인'}
                            </button>

                            <button onClick={() => { setError(''); setMode('app-change-password'); }} className="w-full text-sm text-gray-500 hover:text-indigo-600 hover:underline mt-2">
                                비밀번호 변경
                            </button>
                        </div>
                    </div>
                    <p className="mt-8 text-xs text-gray-400">Class Bank Student App</p>
                 </div>
            </div>
        );
    }

    // Student App Change Password View
    if (mode === 'app-change-password') {
        return (
            <div className="flex flex-col h-full p-8 bg-gray-50">
                 <div className="flex-grow flex flex-col items-center justify-center max-w-sm mx-auto w-full">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full">
                        <div className="flex items-center mb-4">
                            <button onClick={() => setMode('app-login')} className="text-gray-400 hover:text-gray-600 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800">비밀번호 변경</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">본인 확인을 위해 정보를 입력해주세요.</p>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                <input type="number" value={grade} onChange={e => setGrade(e.target.value)} placeholder="학년" className="p-3 border rounded-lg text-center" />
                                <input type="number" value={cls} onChange={e => setCls(e.target.value)} placeholder="반" className="p-3 border rounded-lg text-center" />
                                <input type="number" value={num} onChange={e => setNum(e.target.value)} placeholder="번호" className="p-3 border rounded-lg text-center" />
                            </div>
                            <input 
                                type="password" 
                                value={appPassword} 
                                onChange={e => setAppPassword(e.target.value)} 
                                placeholder="현재 비밀번호" 
                                className="w-full p-3 border rounded-lg"
                            />
                            <input 
                                type="password" 
                                value={newAppPassword} 
                                onChange={e => setNewAppPassword(e.target.value)} 
                                placeholder="새 비밀번호 (4자리 이상)" 
                                className="w-full p-3 border rounded-lg bg-indigo-50"
                            />
                            
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {successMessage && <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">{successMessage}</div>}
                            
                            {!successMessage && (
                                <button onClick={handleChangePassword} disabled={loading} className="w-full p-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-transform active:scale-95 disabled:bg-gray-400">
                                    {loading ? '변경 중...' : '비밀번호 변경하기'}
                                </button>
                            )}
                        </div>
                    </div>
                 </div>
            </div>
        );
    }
    
    if (mode === 'login' && loginTarget) {
        return (
            <div className="flex flex-col h-full p-8 bg-gray-800 text-white">
                <button onClick={reset} className="self-start mb-8 text-gray-400 hover:text-white">{'<'} 뒤로</button>
                <div className="flex-grow flex flex-col items-center justify-center">
                    <h2 className="text-3xl font-bold mb-2">{loginTarget.title}</h2>
                    <p className="text-gray-400 mb-8">비밀번호를 입력하세요.</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                        className="w-full max-w-xs p-3 mb-4 text-center bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <button onClick={handleAdminLogin} className="w-full max-w-xs p-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition">
                        {loginTarget.title === '교사 관리자' ? '관리자 로그인' : `${loginTarget.title} 로그인`}
                    </button>
                </div>
            </div>
        );
    }
    
    if (mode === 'student-select') {
        return (
           <div className="flex flex-col h-full p-4 bg-[#D1D3D8]">
               <button onClick={reset} className="self-start mb-4 text-gray-500 hover:text-gray-800">{'<'} 뒤로</button>
               <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">학생을 선택하세요</h2>
               <div className="flex-grow grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-y-auto pr-1 content-start">
                   {students.map(student => (
                       <button 
                           key={student.userId} 
                           onClick={() => handleLogin(student.userId)}
                           className="p-2 bg-white rounded-xl text-gray-800 text-center hover:bg-indigo-50 transition-shadow shadow-md hover:shadow-lg flex flex-col items-center justify-center aspect-square"
                       >
                           <StudentIcon className="w-1/3 h-1/3 text-gray-400 mb-1"/>
                           <span className="font-bold text-base leading-tight truncate w-full">{student.name}</span>
                           <span className="text-xs text-gray-500">{`${student.grade}-${student.class} ${student.number}번`}</span>
                       </button>
                   ))}
               </div>
           </div>
       );
   }

    return (
        <div className="flex flex-col h-full p-6 bg-[length:auto_100%] bg-center bg-no-repeat transition-all duration-500 bg-[url('https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/Gemini_Generated_Image_nhj2hmnhj2hmnhj2.png')] landscape:bg-cover landscape:bg-[url('https://anvdmcqszhmipbnxltsg.supabase.co/storage/v1/object/public/images/Gemini_Generated_Image_aeqmp5aeqmp5aeqm.png')]">
            <div className="flex-grow flex flex-col items-center justify-center">
                {/* Title Section: Mobile Landscape (smaller margin/text) vs Tablet Landscape (larger) */}
                <div className="text-center mb-6 landscape:mb-2 md:landscape:mb-8">
                    <h1 className="text-6xl font-extrabold text-gray-800 tracking-tight landscape:text-4xl md:landscape:text-7xl" style={{textShadow: '2px 2px 4px rgba(255,255,255,0.5)', fontFamily: "'Gamja Flower', cursive"}}>Class Bank</h1>
                    <p className="text-2xl font-medium text-gray-800 mt-4 landscape:mt-1 landscape:text-xl md:landscape:mt-4 md:landscape:text-3xl" style={{ fontFamily: "'Gamja Flower', cursive", textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>권쌤과 경제활동</p>
                </div>

                {/* 
                    Button Container Strategy:
                    1. Mobile Landscape ('landscape:'): Height 24vh (approx 3/4 of previous 32vh), Row layout.
                    2. Tablet Landscape ('md:landscape:'): Height 22.5vh (approx 3/4 of previous 30vh), Row layout.
                */}
                <div className="w-full max-w-xs flex flex-col gap-4 
                    landscape:flex-row landscape:max-w-5xl landscape:w-full landscape:px-4 landscape:gap-3 landscape:h-[24vh] landscape:items-stretch
                    md:landscape:max-w-7xl md:landscape:px-8 md:landscape:gap-6 md:landscape:h-[22.5vh]">
                    
                    <button 
                        onClick={() => { setLoginTarget({ role: Role.TEACHER, title: "교사 관리자", userId: 'teacher-01' }); setMode('login'); }}
                        className="relative w-full py-4 rounded-2xl border-2 border-gray-400 shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/30 hover:-translate-y-1.5 bg-[#EBEFF3]
                        landscape:flex-1 landscape:rounded-2xl landscape:py-0 
                        md:landscape:rounded-3xl">
                        <div className="shimmer absolute top-0 -left-full w-3/4 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12" />
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                            {/* Icon Size: Half of previous (w-32 -> w-16, etc) */}
                            <MainAdminIcon className="w-16 h-16 mb-2 landscape:w-10 landscape:h-10 landscape:mb-1 md:landscape:w-24 md:landscape:h-24 md:landscape:mb-3"/>
                            {/* Text Size: Mobile (Small) -> Tablet (Large) */}
                            <span className="font-bold text-gray-800 text-xl landscape:text-sm md:landscape:text-2xl">교사 관리자</span>
                        </div>
                    </button>
                     <button
                        onClick={() => { setLoginTarget({ role: Role.BANKER, title: "은행원", userId: 'banker-01' }); setMode('login'); }}
                        className="relative w-full py-4 rounded-2xl border-2 border-gray-400 shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/30 hover:-translate-y-1.5 bg-[#EBEFF3]
                        landscape:flex-1 landscape:rounded-2xl landscape:py-0 
                        md:landscape:rounded-3xl">
                        <div className="shimmer absolute top-0 -left-full w-3/4 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12" />
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                            <MainBankIcon className="w-16 h-16 mb-2 landscape:w-10 landscape:h-10 landscape:mb-1 md:landscape:w-24 md:landscape:h-24 md:landscape:mb-3"/>
                            <span className="font-bold text-gray-800 text-xl landscape:text-sm md:landscape:text-2xl">은행원</span>
                        </div>
                    </button>
                     <button
                        onClick={() => { setLoginTarget({ role: Role.MART, title: "마트", userId: 'mart-01' }); setMode('login'); }}
                        className="relative w-full py-4 rounded-2xl border-2 border-gray-400 shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/30 hover:-translate-y-1.5 bg-[#EBEFF3]
                        landscape:flex-1 landscape:rounded-2xl landscape:py-0 
                        md:landscape:rounded-3xl">
                        <div className="shimmer absolute top-0 -left-full w-3/4 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12" />
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                            <MainMartIcon className="w-16 h-16 mb-2 landscape:w-10 landscape:h-10 landscape:mb-1 md:landscape:w-24 md:landscape:h-24 md:landscape:mb-3"/>
                            <span className="font-bold text-gray-800 text-xl landscape:text-sm md:landscape:text-2xl">마트</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setMode('student-select')}
                        className="relative w-full p-4 bg-[#4CAF50] text-white rounded-2xl shadow-lg font-bold text-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-1 hover:bg-opacity-95 flex items-center justify-center 
                        landscape:flex-1 landscape:flex-col landscape:p-0 landscape:rounded-2xl landscape:h-full
                        md:landscape:rounded-3xl"
                    >
                        <div className="shimmer absolute top-0 -left-full w-3/4 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12" />
                        <StudentIcon className="w-6 h-6 mr-3 landscape:mr-0 landscape:mb-1 landscape:w-6 landscape:h-6 md:landscape:w-14 md:landscape:h-14 md:landscape:mb-4"/>
                        <span className="landscape:text-sm md:landscape:text-2xl">학생 (QR)</span>
                    </button>
                </div>
            </div>
            
            <footer className="text-center text-gray-600/90 mt-4 landscape:mt-0">
                <p className="text-sm font-semibold" style={{ textShadow: '1px 1px 1px rgba(255,255,255,0.8)' }}>ⓒ 2025. Kwon's class. All rights reserved.</p>
            </footer>

            {/* 임시 버튼: 프리뷰 환경에서 학생 로그인 페이지로 이동하기 위함 */}
            <button 
                onClick={() => setMode('app-login')}
                className="fixed bottom-2 right-2 px-2 py-1 bg-white/50 hover:bg-white/80 rounded border border-gray-300 text-[10px] text-gray-600 backdrop-blur-sm transition-colors z-50 shadow-sm"
            >
                학생 로그인 페이지
            </button>
        </div>
    );
};

export default AuthPage;