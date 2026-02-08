import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Role, User } from '../types';
import { StudentIcon, MainAdminIcon, MainBankIcon, MainMartIcon, CheckIcon, ErrorIcon, BackIcon, XIcon, NewspaperIcon } from '../components/icons';

type AuthMode = 'login' | 'signup' | 'recovery' | 'recovery-reset' | 'student-login' | 'student-password-change';

// --- Shared UI Components ---
const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
        {...props} 
        className={`w-full p-3.5 bg-white border border-gray-200 rounded-2xl outline-none transition-all focus:border-[#0066FF] focus:ring-4 focus:ring-blue-50 placeholder:text-gray-300 font-medium text-gray-900 ${props.className}`}
    />
);

const PrimaryButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button 
        {...props}
        className={`w-full p-4 bg-[#1D1D1F] text-white font-black rounded-2xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:hover:scale-100 ${props.className}`}
    >
        {children}
    </button>
);

const LegalModal: React.FC<{ title: string; content: React.ReactNode; isOpen: boolean; onClose: () => void }> = ({ title, content, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><XIcon className="w-6 h-6 text-gray-400" /></button>
                </div>
                <div className="p-8 overflow-y-auto text-sm text-gray-600 leading-relaxed font-medium">
                    {content}
                </div>
                <div className="p-6 border-t text-center bg-gray-50">
                    <button onClick={onClose} className="px-10 py-3.5 bg-gray-900 text-white rounded-2xl font-black hover:scale-105 active:scale-95 transition-all">닫기</button>
                </div>
            </div>
        </div>
    );
};

const AuthPage: React.FC = () => {
    const { login } = useContext(AuthContext);
    
    // URL 파라미터 확인 및 초기 모드 설정
    const [mode, setMode] = useState<AuthMode>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('mode') === 'app') {
                return 'student-login';
            }
        }
        return 'login';
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal State
    const [modalState, setModalState] = useState<{ type: 'terms' | 'privacy' | 'guide' | null }>({ type: null });

    // Teacher Auth State
    const [teacherEmail, setTeacherEmail] = useState('');
    const [password, setPassword] = useState('');
    const [teacherAlias, setTeacherAlias] = useState('');
    const [currencyUnit, setCurrencyUnit] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
    const [recoveryConfirmChecked, setRecoveryConfirmChecked] = useState(false);

    // Student App State
    const [classCode, setClassCode] = useState('');
    const [grade, setGrade] = useState('');
    const [cls, setCls] = useState('');
    const [num, setNum] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [newAppPassword, setNewAppPassword] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'app' && mode !== 'student-login' && mode !== 'student-password-change') {
            setMode('student-login');
        }
    }, [mode]);

    const TERMS_CONTENT = (
        <div className="whitespace-pre-wrap">
            {`제 1 조 (목적)
본 약관은 '클래스 뱅크'(이하 '서비스')가 제공하는 학급 경제 시뮬레이션 시스템의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.

제 2 조 (가상 화폐 및 자산)
1. 서비스 내에서 통용되는 모든 화폐, 주식, 펀드, 적금 등은 교육적 목적을 위한 가상 데이터입니다.
2. 본 서비스의 가상 자산은 어떠한 경우에도 현실의 현금이나 재화로 교환될 수 없으며, 실제 금융 가치가 전혀 없음을 이용자는 인지합니다.

제 3 조 (데이터 관리 및 책임)
1. 교사 이용자는 담당 학급 학생들의 데이터를 관리할 권한과 책임을 가집니다.
2. 이용자의 부주의로 인한 계정 정보 노출이나 데이터 오용에 대한 책임은 이용자 본인에게 있습니다.

제 4 조 (서비스의 중단)
시스템 점검, 서버 교체 또는 기타 기술적 결함으로 인해 서비스가 일시적으로 중단될 수 있으며, 이 경우 사전 공지 혹은 사후 통보가 이루어질 수 있습니다.`}
        </div>
    );

    const PRIVACY_CONTENT = (
        <div className="whitespace-pre-wrap">
            {`클래스 뱅크 개인정보처리방침

1. 개인정보 수집 항목
- 교사: 이메일 주소, 별칭(선생님 이름), 가상 화폐 단위.
- 학생: 이름, 학년, 반, 번호.

2. 개인정보 수집 및 이용 목적
수집된 정보는 서비스 내 학급 경제 시스템 운영, 회원 인증, 학급별 데이터 구분 및 서비스 제공의 목적으로만 사용됩니다.

3. 개인정보의 보유 및 이용 기간
이용자가 서비스 탈퇴를 요청하거나, 교사가 학급 데이터를 삭제하는 경우 수집된 개인정보는 지체 없이 파기됩니다.

4. 개인정보의 보안 관리 (핵심 보안 사항)
본 서비스는 이용자의 보안을 최우선으로 합니다.
- 모든 이용자의 비밀번호는 일방향 해시 함수(bcrypt)를 사용하여 안전하게 암호화되어 저장됩니다.
- 암호화된 비밀번호는 관리자를 포함한 그 누구도 원문을 복원할 수 없도록 설계되어 보호됩니다.`}
        </div>
    );

    const GUIDE_CONTENT = (
        <div className="space-y-6">
            <section>
                <h4 className="font-black text-indigo-600 text-lg mb-2">1. 시작하기 (교사)</h4>
                <p className="text-gray-700">회원가입 후 발급되는 4자리 <b>학급 코드</b>를 학생들에게 공유하세요. 관리자 메뉴에서 학생 명부를 등록하면 시스템 준비가 끝납니다.</p>
            </section>
            <section>
                <h4 className="font-black text-indigo-600 text-lg mb-2">2. 경제 시스템 구축</h4>
                <p className="text-gray-700">직업을 생성하고 학생들을 배정하여 '월급 일괄 지급'으로 경제 흐름을 만드세요. 세금 고지를 통해 공공 자금을 환수할 수도 있습니다.</p>
            </section>
            <section>
                <h4 className="font-black text-indigo-600 text-lg mb-2">3. 금융 및 투자 활동</h4>
                <p className="text-gray-700">학생들은 주식, 펀드, 적금 상품을 통해 자산을 불려 나갈 수 있습니다. 은행원 모드를 통해 오프라인 거래를 지원하세요.</p>
            </section>
            <section>
                <h4 className="font-black text-indigo-600 text-lg mb-2">4. 마트 POS기기</h4>
                <p className="text-gray-700">마트 담당 학생은 마트 모드에 접속하여 실시간으로 물건 값을 결제 받고 판매 수익을 관리할 수 있습니다.</p>
            </section>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-700 font-bold leading-relaxed">💡 팁: 학생 로그인 시 QR 코드를 인쇄해 교실에 붙여두면 더욱 간편하게 접속할 수 있습니다.</p>
            </div>
        </div>
    );

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

    const handleAppLogin = async () => {
        if (!classCode || !grade || !cls || !num || !appPassword) {
            setError('모든 정보를 입력해주세요.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const user = await api.loginWithPassword(classCode, parseInt(grade), parseInt(cls), parseInt(num), appPassword);
            if (user) {
                login(user);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentPasswordChange = async () => {
        if (!classCode || !grade || !cls || !num || !appPassword || !newAppPassword) {
            setError('모든 정보를 입력해주세요.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // 먼저 기존 정보로 로그인 시도하여 확인
            const user = await api.loginWithPassword(classCode, parseInt(grade), parseInt(cls), parseInt(num), appPassword);
            if (user) {
                await api.changePassword(user.userId, appPassword, newAppPassword);
                setSuccessMessage('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
                setTimeout(() => {
                    setMode('student-login');
                    setSuccessMessage('');
                    setAppPassword('');
                    setNewAppPassword('');
                }, 2000);
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

    const resetStates = () => {
        setError('');
        setSuccessMessage('');
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

    // --- Student Login UI ---
    if (mode === 'student-login') {
        return (
            <div className="flex flex-col h-full bg-[#F2F4F7] items-center justify-center p-6">
                <div className="w-full max-w-[420px] text-center mb-8">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2" style={{fontFamily: "'Gamja Flower', cursive"}}>Class Bank</h1>
                    <p className="text-gray-500 font-bold tracking-tight text-sm uppercase tracking-widest">Student Portal</p>
                </div>
                <div className="w-full max-w-[400px] bg-white p-10 rounded-[40px] shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-white">
                    <h2 className="text-2xl font-black mb-2 text-gray-900 text-center">학생 로그인</h2>
                    <p className="text-gray-400 text-sm mb-8 text-center font-medium">학급 코드와 학번 정보를 입력하세요.</p>
                    <div className="space-y-4">
                        <div className="relative">
                            <InputField 
                                type="text" 
                                placeholder="학급 코드 (4자리 숫자)" 
                                value={classCode} 
                                maxLength={4}
                                onChange={e => setClassCode(e.target.value.replace(/[^0-9]/g, ''))} 
                                className="text-center font-black bg-blue-50/50 border-blue-100 text-[#0066FF] placeholder:text-blue-200"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <InputField type="number" placeholder="학년" value={grade} onChange={e => setGrade(e.target.value)} className="text-center font-bold" />
                            <InputField type="number" placeholder="반" value={cls} onChange={e => setCls(e.target.value)} className="text-center font-bold" />
                            <InputField type="number" placeholder="번호" value={num} onChange={e => setNum(e.target.value)} className="text-center font-bold" />
                        </div>
                        <InputField type="password" placeholder="비밀번호" value={appPassword} onChange={e => setAppPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAppLogin()} />
                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                        <PrimaryButton onClick={handleAppLogin} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                            {loading ? '로그인 중...' : '로그인'}
                        </PrimaryButton>
                        <div className="flex justify-between items-center px-1">
                            <button onClick={() => { resetStates(); setMode('student-password-change'); }} className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors">비밀번호 변경</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Student Password Change UI ---
    if (mode === 'student-password-change') {
        return (
            <div className="flex flex-col h-full bg-[#F2F4F7] items-center justify-center p-6">
                <div className="w-full max-w-[400px] bg-white p-10 rounded-[40px] shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-white">
                    <button onClick={() => setMode('student-login')} className="text-gray-400 mb-6 text-sm font-medium hover:text-gray-900 flex items-center gap-1 transition-colors">
                        <BackIcon className="w-5 h-5" /> 뒤로가기
                    </button>
                    <h2 className="text-2xl font-black mb-2 text-gray-900">비밀번호 변경</h2>
                    <p className="text-gray-400 text-sm mb-8 font-medium">학급 코드 및 본인 확인 후 비밀번호를 설정합니다.</p>
                    <div className="space-y-4">
                        <InputField 
                            type="text" 
                            placeholder="학급 코드 (4자리)" 
                            value={classCode} 
                            maxLength={4}
                            onChange={e => setClassCode(e.target.value.replace(/[^0-9]/g, ''))} 
                            className="text-center font-black bg-blue-50/50 border-blue-100 text-[#0066FF]"
                        />
                        <div className="grid grid-cols-3 gap-3">
                            <InputField type="number" placeholder="학년" value={grade} onChange={e => setGrade(e.target.value)} className="text-center font-bold" />
                            <InputField type="number" placeholder="반" value={cls} onChange={e => setCls(e.target.value)} className="text-center font-bold" />
                            <InputField type="number" placeholder="번호" value={num} onChange={e => setNum(e.target.value)} className="text-center font-bold" />
                        </div>
                        <InputField type="password" placeholder="현재 비밀번호" value={appPassword} onChange={e => setAppPassword(e.target.value)} />
                        <InputField type="password" placeholder="새로운 비밀번호" value={newAppPassword} onChange={e => setNewAppPassword(e.target.value)} className="bg-indigo-50/50 border-indigo-100" />
                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                        {successMessage && <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl text-center border border-green-100">{successMessage}</div>}
                        {!successMessage && (
                            <PrimaryButton onClick={handleStudentPasswordChange} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                                {loading ? '변경 중...' : '비밀번호 변경하기'}
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'signup') {
        return (
            <div className="flex flex-col h-full bg-[#F2F4F7] items-center justify-center p-6">
                <div className="w-full max-w-[400px] bg-white p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white">
                    <button onClick={() => setMode('login')} className="text-gray-400 mb-6 text-sm font-medium hover:text-gray-900 flex items-center gap-1 transition-colors">
                        <BackIcon className="w-5 h-5" /> 뒤로가기
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
                        <BackIcon className="w-5 h-5" /> 뒤로가기
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
        <div className="flex flex-col h-full bg-[#F2F4F7] items-center justify-center p-4 transition-all duration-700 overflow-y-auto">
            <div className="w-full max-w-[420px] text-center mb-6 pt-10">
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
                        <button onClick={() => { resetStates(); setMode('recovery'); }} className="text-[11px] font-bold text-black hover:text-[#0066FF] transition-colors">비밀번호 찾기</button>
                        <button onClick={() => { resetStates(); setMode('signup'); }} className="text-[11px] font-bold text-[#0066FF] hover:underline">무료 회원가입</button>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => { resetStates(); setMode('student-login'); }}
                className="w-full max-w-[380px] mt-6 p-4 bg-white text-gray-800 border border-gray-100 rounded-[24px] shadow-lg font-black text-base hover:bg-white hover:border-[#0066FF] hover:ring-4 hover:ring-blue-50 transition-all active:scale-[0.98] flex items-center justify-center"
            >
                학생 로그인 페이지로 이동
            </button>

            <footer className="mt-12 mb-10 text-center">
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mb-6">
                    <button onClick={() => setModalState({ type: 'terms' })} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">이용약관</button>
                    <button onClick={() => setModalState({ type: 'privacy' })} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">개인정보처리방침</button>
                    <button 
                        onClick={() => setModalState({ type: 'guide' })} 
                        className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px] border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-1 shadow-sm"
                    >
                        <NewspaperIcon className="w-3 h-3" />
                        사용 가이드
                    </button>
                </div>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed mb-1">
                    제안이나 문의사항이 있으시면 언제든 메일 주세요.<br/>
                    <span className="text-gray-900 font-bold">Contact: sinjoppo@naver.com</span>
                </p>
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                    &copy; 2025 Class Bank Economy.
                </p>
            </footer>

            <LegalModal title="이용약관" content={TERMS_CONTENT} isOpen={modalState.type === 'terms'} onClose={() => setModalState({ type: null })} />
            <LegalModal title="개인정보처리방침" content={PRIVACY_CONTENT} isOpen={modalState.type === 'privacy'} onClose={() => setModalState({ type: null })} />
            <LegalModal title="클래스뱅크 사용 가이드" content={GUIDE_CONTENT} isOpen={modalState.type === 'guide'} onClose={() => setModalState({ type: null })} />
        </div>
    );
};

export default AuthPage;