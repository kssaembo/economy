
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Role, User } from '../types';
import { StudentIcon, MainAdminIcon, MainBankIcon, MainMartIcon, CheckIcon, ErrorIcon } from '../components/icons';

type AuthMode = 'login' | 'signup' | 'recovery' | 'recovery-reset';

// --- Shared UI Components (Defined outside to prevent focus loss) ---
const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
        {...props} 
        className={`w-full p-3.5 bg-white border border-gray-200 rounded-2xl outline-none transition-all focus:border-[#0066FF] focus:ring-4 focus:ring-blue-50 placeholder:text-gray-300 font-medium ${props.className}`}
    />
);

const PrimaryButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button 
        {...props}
        className={`w-full p-4 bg-[#1D1D1F] text-white font-bold rounded-2xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:hover:scale-100 ${props.className}`}
    >
        {children}
    </button>
);

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
            <div className="fixed inset-0 bg-white/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-[32px] p-10 max-w-sm w-full shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-gray-100 animate-fadeIn text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckIcon className="w-8 h-8 text-[#0066FF]" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-3">복구 코드 확인</h3>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        비밀번호를 분실했을 때 사용하는 마스터 코드입니다.<br/>
                        <span className="text-red-500 font-bold">절대로 타인에게 노출하지 마세요.</span>
                    </p>
                    <div className="bg-gray-50 p-6 rounded-2xl mb-8 font-mono font-black text-3xl tracking-[0.2em] text-[#0066FF] border border-gray-100 select-all">
                        {recoveryCode}
                    </div>
                    <label className="flex items-center justify-center gap-3 mb-10 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={recoveryConfirmChecked} 
                            onChange={e => setRecoveryConfirmChecked(e.target.checked)}
                            className="w-5 h-5 rounded-full border-gray-300 text-[#0066FF] focus:ring-0" 
                        />
                        <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900">코드를 안전하게 기록했습니다</span>
                    </label>
                    <PrimaryButton 
                        disabled={!recoveryConfirmChecked}
                        onClick={() => { setRecoveryModalVisible(false); setMode('login'); }}
                        className="bg-[#0066FF] hover:bg-[#0055DD]"
                    >
                        시작하기
                    </PrimaryButton>
                    <p className="mt-6 text-[10px] text-gray-300">분실 시 문의: sinjoppo@naver.com</p>
                </div>
            </div>
        );
    }

    if (mode === 'signup') {
        return (
            <div className="flex flex-col h-full bg-[#F2F4F7] items-center justify-center p-6">
                <div className="w-full max-w-[400px] bg-white p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white">
                    <button onClick={() => setMode('login')} className="text-gray-400 mb-6 text-sm font-medium hover:text-gray-900 flex items-center gap-1 transition-colors">
                        <span className="text-lg">←</span> 뒤로가기
                    </button>
                    <h2 className="text-3xl font-black mb-2 text-gray-900 tracking-tight">선생님 가입</h2>
                    <p className="text-gray-400 text-sm mb-8">학급 경제를 위한 새로운 계정을 만드세요.</p>
                    <div className="space-y-4">
                        <InputField type="email" placeholder="이메일 주소" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} />
                        <div>
                            <InputField type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} />
                            <p className="text-[10px] text-gray-300 mt-2 ml-1">영어 소문자와 숫자만 사용 가능</p>
                        </div>
                        <InputField type="text" placeholder="선생님 별칭 (예: 민수쌤)" value={teacherAlias} onChange={e => setTeacherAlias(e.target.value)} />
                        <InputField type="text" placeholder="화폐 단위 (예: 원, 달러, 톨)" value={currencyUnit} onChange={e => setCurrencyUnit(e.target.value)} />
                        {error && <p className="text-red-500 text-xs font-bold text-center animate-pulse">{error}</p>}
                        <PrimaryButton onClick={handleTeacherSignup} disabled={loading} className="mt-4 bg-[#0066FF] hover:bg-[#0055DD]">
                            {loading ? '가입 처리 중...' : '가입 완료'}
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'recovery') {
        return (
            <div className="flex flex-col h-full bg-[#F2F4F7] items-center justify-center p-6">
                <div className="w-full max-w-[400px] bg-white p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white">
                    <button onClick={() => setMode('login')} className="text-gray-400 mb-6 text-sm font-medium hover:text-gray-900 flex items-center gap-1 transition-colors">
                        <span className="text-lg">←</span> 뒤로가기
                    </button>
                    <h2 className="text-3xl font-black mb-2 text-gray-900 tracking-tight">비밀번호 찾기</h2>
                    <p className="text-gray-400 text-sm mb-8">가입 시 발급받은 복구 코드를 입력하세요.</p>
                    <div className="space-y-4">
                        <InputField type="email" placeholder="이메일 주소" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} />
                        <InputField type="text" placeholder="복구 코드 입력" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} className="font-mono tracking-widest uppercase" />
                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                        <PrimaryButton onClick={handleRecoveryVerify} disabled={loading} className="mt-4">
                            코드 확인
                        </PrimaryButton>
                        <div className="text-center pt-8 border-t border-gray-50 mt-4">
                            <p className="text-xs text-gray-400 mb-1">복구 코드를 분실하셨나요?</p>
                            <p className="text-xs font-black text-gray-900">문의: sinjoppo@naver.com</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'recovery-reset') {
        return (
            <div className="flex flex-col h-full bg-[#F2F4F7] items-center justify-center p-6">
                <div className="w-full max-w-[400px] bg-white p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white">
                    <h2 className="text-3xl font-black mb-2 text-gray-900 tracking-tight">비밀번호 재설정</h2>
                    <p className="text-gray-400 text-sm mb-8">사용하실 새로운 비밀번호를 입력해주세요.</p>
                    <div className="space-y-4">
                        <InputField type="password" placeholder="새 비밀번호" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                        <PrimaryButton onClick={handlePasswordReset} disabled={loading} className="mt-4 bg-[#0066FF] hover:bg-[#0055DD]">
                            변경 완료
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F2F4F7] items-center justify-center p-4 transition-all duration-700">
            <div className="w-full max-w-[420px] text-center mb-6">
                <div className="w-16 h-16 bg-[#0066FF] rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-[0_12px_24px_rgba(0,102,255,0.25)] border-2 border-white/20">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{fontFamily: "'Gamja Flower', cursive"}}>Class Bank</h1>
                <p className="text-gray-500 font-medium tracking-tight text-sm">우리 학급만의 특별한 경제활동 시스템</p>
            </div>

            <div className="w-full max-w-[380px] bg-white p-8 rounded-[32px] shadow-[0_24px_48px_rgba(0,0,0,0.1)] border border-white relative transition-shadow hover:shadow-[0_32px_64px_rgba(0,0,0,0.12)]">
                <h2 className="text-lg font-black mb-6 text-gray-900 text-center tracking-tight">선생님 로그인</h2>
                <div className="space-y-3.5">
                    <InputField type="email" placeholder="이메일" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} />
                    <InputField type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()} />
                    {error && <p className="text-red-500 text-[11px] font-bold text-center">{error}</p>}
                    <PrimaryButton onClick={handleTeacherLogin} disabled={loading} className="mt-2 bg-[#0066FF] hover:bg-[#0055DD] shadow-md shadow-blue-200">
                        {loading ? '인증 중...' : '로그인'}
                    </PrimaryButton>
                    <div className="flex justify-between px-1 mt-4">
                        <button onClick={() => setMode('recovery')} className="text-[11px] font-bold text-black hover:text-[#0066FF] transition-colors">비밀번호 찾기</button>
                        <button onClick={() => setMode('signup')} className="text-[11px] font-bold text-[#0066FF] hover:underline">무료 회원가입</button>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleStudentLoginRedirect}
                className="w-full max-w-[380px] mt-6 p-4 bg-white text-gray-800 border border-gray-100 rounded-[24px] shadow-lg font-black text-base hover:bg-white hover:border-[#0066FF] hover:ring-4 hover:ring-blue-50 transition-all active:scale-[0.98] flex items-center justify-center"
            >
                학생 로그인 페이지로 이동
            </button>
            
            <footer className="mt-10 text-center">
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed mb-1">
                    제안이나 문의사항이 있으시면 언제든 메일 주세요.<br/>
                    <span className="text-gray-900 font-bold">Contact: sinjoppo@naver.com</span>
                </p>
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                    &copy; 2025 Class Bank Economy.
                </p>
            </footer>
        </div>
    );
};

export default AuthPage;
