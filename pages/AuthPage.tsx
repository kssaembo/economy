import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Role, User } from '../types';
import { BankIcon, MartIcon, StudentIcon } from '../components/icons';

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

    if (loading) {
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
            <div className="flex flex-col h-full p-8 bg-white">
                <button onClick={reset} className="self-start mb-4 text-gray-500 hover:text-gray-800">{'<'} 뒤로</button>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">학생을 선택하세요</h2>
                <div className="space-y-3 overflow-y-auto">
                    {students.map(student => (
                        <button key={student.userId} onClick={() => handleLogin(student.userId)}
                            className="w-full p-4 bg-gray-100 rounded-lg text-lg text-gray-800 text-left hover:bg-gray-200 transition">
                            {student.grade}-{student.class} {student.number}번 {student.name}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-200">
            <div className="text-center mb-12 p-6 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
                <h1 className="text-5xl font-black text-gray-800 tracking-tight">Class Bank</h1>
                <p className="text-xl font-semibold text-gray-600 mt-6">권쌤과 경제활동</p>
            </div>

            <div className="w-full max-w-md space-y-4">
                <button onClick={() => { setLoginTarget({ role: Role.TEACHER, title: "교사 관리자", userId: 'teacher-01' }); setMode('login'); }}
                    className="w-full p-4 bg-white rounded-xl shadow-md font-bold text-gray-800 text-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    교사 관리자
                </button>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { setLoginTarget({ role: Role.BANKER, title: "은행원", userId: 'banker-01' }); setMode('login'); }}
                        className="p-6 bg-white rounded-xl shadow-md flex flex-col items-center justify-center aspect-square hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <BankIcon className="w-10 h-10 text-blue-500 mb-2" />
                        <span className="font-bold text-gray-800">은행원</span>
                    </button>
                    <button onClick={() => { setLoginTarget({ role: Role.MART, title: "마트", userId: 'mart-01' }); setMode('login'); }}
                        className="p-6 bg-white rounded-xl shadow-md flex flex-col items-center justify-center aspect-square hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <MartIcon className="w-10 h-10 text-orange-500 mb-2" />
                        <span className="font-bold text-gray-800">마트</span>
                    </button>
                </div>

                <div className="pt-4">
                    <button onClick={() => setMode('student-select')}
                        className="w-full p-4 bg-green-500 text-white rounded-xl shadow-lg font-bold text-lg hover:bg-green-600 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                        <StudentIcon className="w-6 h-6 mr-2"/>
                        학생 (QR 로그인)
                    </button>
                </div>
            </div>
            
            <footer className="mt-auto pt-6 text-center text-gray-500">
                <p className="text-sm font-semibold">ⓒ 2025. Kwon's class. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default AuthPage;