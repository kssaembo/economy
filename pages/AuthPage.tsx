
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Role, User } from '../types';
import { StudentIcon, MainAdminIcon, MainBankIcon, MainMartIcon, CheckIcon, ErrorIcon } from '../components/icons';

type AuthMode = 'login' | 'signup' | 'recovery' | 'recovery-reset';

const AuthPage: React.FC = () => {
    const { login } = useContext(AuthContext);
    
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Teacher Auth State
    const [teacherEmail, setTeacherEmail] = useState('');
    const [password, setPassword] = useState('');
    const [teacherAlias, setTeacherAlias] = useState('');
    const [currencyUnit, setCurrencyUnit] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
    const [recoveryConfirmChecked, setRecoveryConfirmChecked] = useState(false);

    const validatePassword = (pw: string) => {
        // 보안을 위해 더 강력한 검사 권장되나 기존 규칙 유지
        const regex = /^[a-z0-9]+$/;
        return regex.test(pw);
    };

    const handleTeacherSignup = async () => {
        if (!teacherEmail || !password || !teacherAlias || !currencyUnit) {
            setError('모든 항목을 입력해주세요.');
            return;
        }
        if (!validatePassword(password)) {
            setError('비밀번호는 영어 소문자와 숫자만 사용 가능합니다.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await api.signupTeacher(teacherEmail, password, teacherAlias, currencyUnit);
            setRecoveryCode(result.recoveryCode);
            setRecoveryModalVisible(true);
            setSuccessMessage('회원가입이 완료되었습니다!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTeacherLogin = async () => {
        if (!teacherEmail || !password) return;
        setLoading(true);
        setError('');
        try {
            const user = await api.loginTeacher(teacherEmail, password);
            if (user) {
                login(user);
            } else {
                setError('이메일 또는 비밀번호가 일치하지 않습니다.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendRecoveryEmail = async () => {
        if (!teacherEmail) {
            setError('이메일을 입력해주세요.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const success = await api.requestRecoveryCode(teacherEmail);
            if (success) {
                setSuccessMessage('입력하신 이메일로 복구 코드가 발송되었습니다.');
            } else {
                setError('등록되지 않은 이메일입니다.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    };

    const handleRecoveryVerify = async () => {
        if (!teacherEmail || !recoveryCode) {
            setError('이메일과 복구 코드를 입력해주세요.');
            return;
        }
        setLoading(true);
        try {
            const isValid = await api.verifyRecoveryCode(teacherEmail, recoveryCode);
            if (isValid) {
                setMode('recovery-reset');
                setError('');
            } else {
                setError('복구 코드가 일치하지 않습니다.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!newPassword) return;
        if (!validatePassword(newPassword)) {
            setError('비밀번호는 영어 소문자와 숫자만 사용 가능합니다.');
            return;
        }
        setLoading(true);
        try {
            await api.resetTeacherPassword(teacherEmail, recoveryCode, newPassword);
            setSuccessMessage('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
            setTimeout(() => {
                setMode('login');
                setSuccessMessage('');
                setRecoveryCode('');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentLoginRedirect = () => {
        window.location.href = 'https://economy-rho.vercel.app/?mode=app';
    };

    if (recoveryModalVisible) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fadeIn">
                    <div className="bg-amber-50 p-4 rounded-2xl mb-6 flex flex-col items-center">
                        <ErrorIcon className="w-12 h-12 text-amber-500 mb-2" />
                        <h3 className="text-xl font-bold text-amber-900">복구 코드 안내</h3>
                    </div>
                    <p className="text-gray-600 text-center mb-6 leading-relaxed">
                        비밀번호를 잊어버렸을 때 사용하는 <span className="font-bold text-gray-900">비밀번호 복구 코드</span>입니다. 보안을 위해 안전한 곳에 기록하세요!
                    </p>
                    <div className="bg-gray-100 p-4 rounded-xl text-center mb-6 font-mono font-extrabold text-2xl tracking-widest text-indigo-600">
                        {recoveryCode}
                    </div>
                    <label className="flex items-center gap-3 mb-8 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={recoveryConfirmChecked} 
                            onChange={e => setRecoveryConfirmChecked(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">코드를 안전하게 기록했습니다.</span>
                    </label>
                    <button 
                        disabled={!recoveryConfirmChecked}
                        onClick={() => { setRecoveryModalVisible(false); setMode('login'); }}
                        className="w-full p-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-all active:scale-95"
                    >
                        확인
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'signup') {
        return (
            <div className="flex flex-col h-full p-6 bg-gray-50 items-center justify-center">
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl">
                    <button onClick={() => setMode('login')} className="text-gray-400 mb-4 hover:text-gray-600">{'<'} 뒤로</button>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">선생님 가입</h2>
                    <div className="space-y-4">
                        <input type="email" placeholder="이메일 주소" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                        <div>
                            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                            <p className="text-[10px] text-gray-400 mt-1 ml-2">* 영어 소문자와 숫자만 사용 가능합니다.</p>
                        </div>
                        <input type="text" placeholder="선생님 별칭 (예: 권쌤, 민수쌤)" value={teacherAlias} onChange={e => setTeacherAlias(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="text" placeholder="화폐 단위 (예: 권, 원, 달러)" value={currencyUnit} onChange={e => setCurrencyUnit(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button onClick={handleTeacherSignup} disabled={loading} className="w-full p-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                            {loading ? '가입 중...' : '회원가입 완료'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'recovery') {
        return (
            <div className="flex flex-col h-full p-6 bg-gray-50 items-center justify-center">
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl">
                    <button onClick={() => setMode('login')} className="text-gray-400 mb-4 hover:text-gray-600">{'<'} 뒤로</button>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">비밀번호 찾기</h2>
                    <p className="text-sm text-gray-500 mb-6">등록하신 이메일로 복구 코드를 보내드립니다.</p>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input type="email" placeholder="이메일 주소" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} className="flex-grow p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                            <button onClick={handleSendRecoveryEmail} disabled={loading} className="px-4 bg-gray-100 text-gray-600 text-xs font-bold rounded-2xl hover:bg-gray-200">
                                {loading ? '발송 중' : '코드 발송'}
                            </button>
                        </div>
                        <input type="text" placeholder="복구 코드 입력" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {successMessage && <p className="text-green-600 text-sm text-center">{successMessage}</p>}
                        <button onClick={handleRecoveryVerify} disabled={loading} className="w-full p-4 bg-amber-500 text-white font-bold rounded-2xl shadow-lg hover:bg-amber-600 transition-all active:scale-95">
                            코드 확인
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'recovery-reset') {
        return (
            <div className="flex flex-col h-full p-6 bg-gray-50 items-center justify-center">
                <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">새 비밀번호 설정</h2>
                    <div className="space-y-4 mt-6">
                        <div>
                            <input type="password" placeholder="새 비밀번호" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                            <p className="text-[10px] text-gray-400 mt-1 ml-2">* 영어 소문자와 숫자만 사용 가능합니다.</p>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {successMessage && <p className="text-green-600 text-sm text-center">{successMessage}</p>}
                        <button onClick={handlePasswordReset} disabled={loading} className="w-full p-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                            비밀번호 변경 완료
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6 bg-white transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

            <div className="flex-grow flex flex-col items-center justify-center relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-7xl font-black text-gray-900 tracking-tighter mb-4" style={{fontFamily: "'Gamja Flower', cursive"}}>Class Bank</h1>
                    <p className="text-base font-medium text-gray-500 max-w-xs mx-auto leading-relaxed">우리 학급만의 특별한 경제활동 시스템</p>
                </div>

                <div className="w-full max-w-sm bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/20">
                    <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">선생님 로그인</h2>
                    <div className="space-y-4">
                        <input type="email" placeholder="이메일" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()} className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                        <button onClick={handleTeacherLogin} disabled={loading} className="w-full p-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                        <div className="flex justify-between px-2">
                            <button onClick={() => setMode('recovery')} className="text-xs text-gray-400 hover:text-indigo-600">비밀번호 찾기</button>
                            <button onClick={() => setMode('signup')} className="text-xs font-bold text-indigo-600 hover:underline">회원가입</button>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-sm mt-8">
                    <button 
                        onClick={handleStudentLoginRedirect}
                        className="w-full p-5 bg-white text-gray-800 border-2 border-gray-50 rounded-2xl shadow-sm font-bold text-lg hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center"
                    >
                        학생 로그인
                    </button>
                </div>
            </div>
            
            <footer className="text-center text-gray-400 mt-8 relative z-10">
                <p className="text-[10px] font-semibold">ⓒ 2025 Class Bank Economy. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default AuthPage;
