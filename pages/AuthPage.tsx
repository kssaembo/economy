import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Role, User } from '../types';
import { BankIcon, MartIcon, StudentIcon, ManageIcon } from '../components/icons';

type AuthMode = 'main' | 'login' | 'student-select';

const AuthPage: React.FC = () => {
    const { login } = useContext(AuthContext);
    const [mode, setMode] = useState<AuthMode>('main');
    const [loginTarget, setLoginTarget] = useState<{ role: Role, title: string, userId: string } | null>(null);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [students, setStudents] = useState<User[]>([]);

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
    
    const reset = () => {
        setMode('main');
        setLoginTarget(null);
        setPassword('');
        setError('');
    };

    if (loading && mode !== 'main') {
        return <div className="flex items-center justify-center h-full text-white bg-gray-800">로딩 중...</div>;
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
            <div className="flex flex-col h-full p-8 bg-[#D1D3D8]">
                <button onClick={reset} className="self-start mb-4 text-gray-500 hover:text-gray-800">{'<'} 뒤로</button>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">학생을 선택하세요</h2>
                <div className="space-y-3 overflow-y-auto">
                    {students.map(student => (
                        <button key={student.userId} onClick={() => handleLogin(student.userId)}
                            className="w-full p-4 bg-white rounded-lg text-lg text-gray-800 text-left hover:bg-gray-100 transition shadow-sm">
                            {student.grade}-{student.class} {student.number}번 {student.name}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6 bg-[#D1D3D8]">
            <div className="flex-grow flex flex-col items-center justify-center">
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-extrabold text-gray-800 tracking-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.1)', fontFamily: "'Gamja Flower', cursive"}}>Class Bank</h1>
                    <p className="text-2xl font-medium text-gray-600 mt-4" style={{ fontFamily: "'Gamja Flower', cursive" }}>권쌤과 경제활동</p>
                </div>

                <div className="w-full max-w-xs space-y-4">
                    <button 
                        onClick={() => { setLoginTarget({ role: Role.TEACHER, title: "교사 관리자", userId: 'teacher-01' }); setMode('login'); }}
                        className="relative w-full py-6 rounded-2xl border-2 border-white/80 shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/30 hover:-translate-y-1.5">
                        <div 
                            className="absolute inset-0 bg-cover bg-center filter blur-[4px] brightness-90 transition-all duration-500 group-hover:scale-110 group-hover:brightness-100"
                            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1932&auto=format&fit=crop')` }}
                        />
                        <div className="absolute inset-0 bg-black/30"></div>
                        <div className="shimmer absolute top-0 -left-full w-3/4 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12" />
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <ManageIcon className="w-10 h-10 text-white mb-2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}/>
                            <span className="font-bold text-white text-xl" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>교사 관리자</span>
                        </div>
                    </button>
                     <button
                        onClick={() => { setLoginTarget({ role: Role.BANKER, title: "은행원", userId: 'banker-01' }); setMode('login'); }}
                        className="relative w-full py-6 rounded-2xl border-2 border-white/80 shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/30 hover:-translate-y-1.5">
                        <div 
                            className="absolute inset-0 bg-cover bg-center filter blur-[4px] brightness-90 transition-all duration-500 group-hover:scale-110 group-hover:brightness-100"
                            style={{ backgroundImage: `url('https://cdn.pixabay.com/photo/2024/08/30/23/40/ai-generated-9010160_1280.jpg')` }}
                        />
                        <div className="absolute inset-0 bg-black/30"></div>
                        <div className="shimmer absolute top-0 -left-full w-3/4 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12" />
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <BankIcon className="w-10 h-10 text-white mb-2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}/>
                            <span className="font-bold text-white text-xl" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>은행원</span>
                        </div>
                    </button>
                     <button
                        onClick={() => { setLoginTarget({ role: Role.MART, title: "마트", userId: 'mart-01' }); setMode('login'); }}
                        className="relative w-full py-6 rounded-2xl border-2 border-white/80 shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/30 hover:-translate-y-1.5">
                        <div 
                            className="absolute inset-0 bg-cover bg-center filter blur-[4px] brightness-90 transition-all duration-500 group-hover:scale-110 group-hover:brightness-100"
                            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=1974&auto=format&fit=crop')` }}
                        />
                        <div className="absolute inset-0 bg-black/30"></div>
                        <div className="shimmer absolute top-0 -left-full w-3/4 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12" />
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <MartIcon className="w-10 h-10 text-white mb-2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}/>
                            <span className="font-bold text-white text-xl" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>마트</span>
                        </div>
                    </button>
                </div>
            </div>
            
            <div className="w-full max-w-xs mx-auto mb-4">
                <button
                    onClick={() => setMode('student-select')}
                    className="relative w-full p-4 bg-[#4CAF50] text-white rounded-2xl shadow-lg font-bold text-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-1 hover:bg-opacity-95 flex items-center justify-center"
                >
                    <div className="shimmer absolute top-0 -left-full w-3/4 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12" />
                    <StudentIcon className="w-6 h-6 mr-3"/>
                    학생 (QR 로그인)
                </button>
            </div>
            
            <footer className="text-center text-gray-500/80">
                <p className="text-sm font-semibold">ⓒ 2025. Kwon's class. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default AuthPage;