
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
    const [password, setTeacherEmailPassword] = useState('');
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
본 약관은 '클래스 뱅크'(이하 '서비스')가 제공하는 학급 경제 시뮬레이션 시스템의 이용 조건 및 절차, 이용자와 서비스 제공자 간의 권리 및 의무를 규정함을 목적으로 합니다.

제 2 조 (용어의 정의)
교사 이용자: 학급 경제 시스템을 생성하고 운영하며 학생 데이터를 관리하는 사용자.
학생 이용자: 교사의 승인 하에 서비스에 접속하여 경제 활동을 체험하는 사용자.
가상 자산: 서비스 내에서 통용되는 가상 화폐, 주식, 펀드, 예금 등의 데이터.

제 3 조 (가상 자산의 성격)
서비스 내 모든 가상 자산은 교육적 목적을 위해 생성된 수치 데이터일 뿐입니다.
가상 자산은 어떠한 경우에도 현실의 현금이나 재화로 교환될 수 없으며, 서비스 외부에서의 거래는 엄격히 금지됩니다.

제 4 조 (이용자의 의무 및 금지 행위)
이용자는 타인의 계정 정보를 도용하거나 시스템의 취약점을 이용해 부당하게 가상 자산을 조작해서는 안 됩니다.
교사 이용자는 학생의 개인정보 및 학급 데이터를 보호할 관리 책임이 있습니다.
부적절한 방법으로 서비스 운영을 방해할 경우 이용이 제한될 수 있습니다.

제 5 조 (면책 조항)
서비스는 기술적 결함으로 인한 일시적 중단에 대해 책임을 지지 않으며, 가상 데이터의 유실에 대해 복구 의무를 지지 않습니다.
이용자 간의 분쟁(학생 간 거래 등)은 교육적 지도의 영역이며, 서비스 제공자는 이에 대해 법적 책임을 지지 않습니다.`}
        </div>
    );

    const PRIVACY_CONTENT = (
        <div className="whitespace-pre-wrap">
            {`클래스 뱅크 개인정보처리방침

1. 수집하는 개인정보 항목
서비스는 원활한 학급 경제 시스템 운영을 위해 최소한의 정보를 수집합니다.
- 교사: 이메일 주소(아이디), 별칭, 학급 코드.
- 학생: 이름, 학년, 반, 번호 (학교명은 수집하지 않음).

2. 개인정보의 수집 및 이용 목적
수집된 정보는 다음의 목적으로만 활용됩니다.
- 서비스 회원 가입 및 본인 확인
- 학급별 데이터 구분 및 경제 활동 기록 관리
- 비밀번호 분실 시 복구 지원 및 주요 공지사항 전달

3. 개인정보의 보유 및 파기
- 보유 기간: 서비스 탈퇴 시 또는 교사가 학급 데이터를 삭제할 때까지 보유합니다.
- 파기 방법: 이용자가 탈퇴를 요청하거나 목적이 달성된 경우, 복구 불가능한 방법으로 즉시 삭제합니다.

4. 이용자의 권리 (법정대리인 포함)
- 학생 이용자 및 그 보호자는 언제든지 자신의 개인정보 열람, 수정 및 삭제를 요청할 수 있습니다.
- 교사 이용자는 관리자 페이지를 통해 학생의 정보를 직접 수정하거나 초기화할 수 있습니다.

5. 개인정보의 기술적 보호 조치
- 강력한 암호화: 모든 비밀번호는 일방향 해시 함수인 bcrypt를 사용하여 암호화 저장됩니다. 이는 관리자도 원문을 알 수 없는 수준의 보안을 제공합니다.
- 데이터 접근 제한: 서버 인프라에 대한 접근은 인가된 관리자만 가능하도록 엄격히 통제됩니다.`}
        </div>
    );

    const GUIDE_CONTENT = (
        <div className="space-y-8">
            <div className="text-center pb-4 border-b">
                <h3 className="text-2xl font-black text-gray-900 mb-2">🏦 클래스뱅크(ClassBank) 사용 설명서</h3>
                <p className="text-indigo-600 font-bold">"우리 교실 속 작은 경제 세상, 클래스뱅크에 오신 것을 환영합니다!"</p>
            </div>

            <section>
                <h4 className="font-black text-lg text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                    시작하기 : 첫 단추 끼우기
                </h4>
                <div className="space-y-3 pl-8">
                    <p className="text-gray-700 leading-relaxed">
                        <strong className="text-gray-900">비밀번호와 복구코드:</strong> 회원가입 시 발급되는 <span className="text-red-600 font-bold">'복구코드'</span>를 반드시 안전한 곳에 기록하세요. 비밀번호 분실 시 유일한 해결책입니다. (복구코드까지 잃어버렸다면? 관리자 메일 sinjoppo@naver.com으로 연락 주세요!)
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        <strong className="text-gray-900">신중한 초기 설정:</strong> 가입 시 입력하는 교사 별칭과 화폐 단위은 경제 시스템의 기초가 되며, 추후 수정이 불가능합니다. 우리 학급만의 개성 있는 이름을 신중히 결정해 주세요.
                    </p>
                </div>
            </section>

            <section>
                <h4 className="font-black text-lg text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                    교사 관리자 기능 : 경제 시스템의 컨트롤 타워
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="font-black text-gray-900 mb-1 text-sm">📊 대시보드</p>
                        <p className="text-xs text-gray-600">국고 잔액과 거래 내역을 확인합니다. 고액 거래나 주식 폭등락 등 주요 알림을 체크하고 화폐를 발행할 수 있습니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="font-black text-gray-900 mb-1 text-sm">👥 학생 관리</p>
                        <p className="text-xs text-gray-600">학생 추가/삭제 및 계좌 관리를 담당합니다. 전용 접속 QR코드를 발급하거나 비밀번호를 초기화할 수 있습니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="font-black text-gray-900 mb-1 text-sm">💼 직업 관리</p>
                        <p className="text-xs text-gray-600">직업별 급여를 설정합니다. '인센티브' 기능을 통해 기본급 외에 추가 보상을 주거나 삭감할 수 있습니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="font-black text-gray-900 mb-1 text-sm">💸 세금 관리</p>
                        <p className="text-xs text-gray-600">납부 기한을 정해 세금을 부과합니다. 납부 여부를 리스트를 통해 즉시 확인 가능합니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 md:col-span-2">
                        <p className="font-black text-gray-900 mb-1 text-sm">📈 펀드 관리</p>
                        <p className="text-xs text-gray-600">학생이 직접 실천 계획을 세워 펀드를 개설하면 교사가 승인합니다. 성공 여부에 따라 투자자들에게 수익을 배분하는 주도적 경제 활동입니다.</p>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="font-black text-lg text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
                    운영 모드 : 은행원 & 마트
                </h4>
                <div className="space-y-4 pl-8">
                    <div className="border-l-4 border-indigo-200 pl-4">
                        <p className="font-black text-gray-900 text-sm mb-1">🏦 은행원 모드 (온·오프라인 연결)</p>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                            <li>입/출금: 오프라인 종이 화폐와 온라인 계좌 간의 환전을 지원합니다.</li>
                            <li>주식거래소: 관리자가 직접 가격을 입력해 시세를 조절하며 경제 흐름을 교육합니다.</li>
                            <li>적금 관리: 예금 상품을 신설/삭제하고 가입자 명단을 관리합니다.</li>
                        </ul>
                    </div>
                    <div className="border-l-4 border-green-200 pl-4">
                        <p className="font-black text-gray-900 text-sm mb-1">🛒 마트 모드 (결제 시스템)</p>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                            <li>마트 계산대: 학생을 선택하고 금액을 입력하면 계좌에서 자동 출금됩니다.</li>
                            <li>송금 & 내역: 마트 수익금을 국고나 다른 학생에게 송금하고 내역을 관리합니다.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="font-black text-lg text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs">4</span>
                    학생 페이지 & 로그인 가이드
                </h4>
                <div className="space-y-3 pl-8">
                    <p className="text-gray-700 text-sm leading-relaxed">
                        <strong className="text-gray-900">로그인 방법:</strong> 1. 교사가 배부한 QR코드로 간편하게 접속하거나, 2. 학생 로그인 페이지에서 학급 코드(숫자 4자리), 학년/반/번호, 비밀번호를 입력합니다. (초기 비번: 1234)
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        <strong className="text-gray-900">주요 기능:</strong> 홈(자산/세금), 금융(송금/주식/펀드/적금) 등 모든 금융 활동을 스스로 수행합니다.
                    </p>
                </div>
            </section>

            <section>
                <h4 className="font-black text-lg text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs">5</span>
                    경제 뉴스 : 살아있는 경제 공부
                </h4>
                <div className="pl-8">
                    <p className="text-gray-700 text-sm leading-relaxed">
                        뉴스를 읽고 포인트를 쌓으며 실전 지식을 익힙니다. 학생이 뉴스를 읽고 댓글(20자 이상)을 달면 <span className="text-indigo-600 font-bold">1포인트(학급 화폐 1단위)</span>를 얻습니다. 어려운 내용은 AI 요약 기능을 활용해 보세요.
                    </p>
                </div>
            </section>

            <section className="bg-blue-50 p-6 rounded-[32px] border border-blue-100">
                <h4 className="font-black text-blue-800 mb-4 flex items-center gap-2">
                    💡 클래스뱅크 활용 꿀팁!
                </h4>
                <ul className="text-xs text-blue-700 space-y-3 font-medium">
                    <li>• <strong className="text-blue-900">우리반 페이 경험:</strong> 마트에서 학생 QR을 찍으면 '마트 결제' 탭이 자동 활성화되어 현대적인 결제 시스템을 체감할 수 있습니다.</li>
                    <li>• <strong className="text-blue-900">펀드 성공/실패 시스템:</strong> 성공 시 보수 지급, 실패 시 약속 미이행으로 원금의 50%만 반환되므로 투자의 위험성을 배웁니다.</li>
                    <li>• <strong className="text-blue-900">현명한 주식 운영:</strong> '우리 반 주식'을 통해 학급 상점 활성화나 학생들의 노력에 비례해 우상향하는 '우리사주' 개념으로 활용해보세요.</li>
                    <li>• <strong className="text-blue-900">수수료의 비밀:</strong> 매도 시 발생하는 수수료를 통해 단타 매매보다는 장기 투자의 중요성을 안내해 주세요.</li>
                </ul>
            </section>

            <p className="text-center text-[10px] text-gray-400 font-bold">의견이나 제안이 있으신가요? sinjoppo@naver.com으로 소중한 의견을 보내주세요!</p>
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
                            <InputField type="password" placeholder="비밀번호" value={password} onChange={e => setTeacherEmailPassword(e.target.value)} />
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
                    <InputField type="password" placeholder="비밀번호" value={password} onChange={e => setTeacherEmailPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()} />
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
