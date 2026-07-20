import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Role, User } from '../types';
import { StudentIcon, MainAdminIcon, MainBankIcon, MainMartIcon, CheckIcon, ErrorIcon, BackIcon, XIcon, NewspaperIcon } from '../components/icons';
import { guestDb } from '../services/guestDb';
import { replicateMasterData } from '../services/guestReplication';
import { supabase } from '../services/supabaseClient';

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

const GuestSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (role: 'teacher' | 'student') => void;
    onReset: () => void;
    isReplicating: boolean;
}> = ({ isOpen, onClose, onSelect, onReset, isReplicating }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] w-full max-w-md p-8 flex flex-col shadow-2xl relative">
                {isReplicating ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="animate-spin rounded-full h-14 w-14 border-4 border-t-indigo-600 border-indigo-100 mb-6"></div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">게스트 체험 공간으로 입장 중...</h3>
                        <p className="text-xs text-gray-400 font-semibold leading-relaxed max-w-[280px]">
                            잠시만 기다려 주세요.
                        </p>
                    </div>
                ) : (
                    <>
                        <button onClick={onClose} className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <XIcon className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900">클래스뱅크 게스트 체험 🏦</h3>
                            <p className="text-xs text-gray-400 mt-1 font-semibold">로그인 없이 모든 기능을 직접 체험해 보세요!</p>
                        </div>
                        
                        <div className="space-y-3.5">
                            <button 
                                onClick={() => onSelect('teacher')}
                                className="w-full p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 rounded-2xl text-left transition-all active:scale-[0.98] group flex gap-3 items-start"
                            >
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5">교사</div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">교사 모드 체험하기 (추천)</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">교사관리자, 은행, 마트 등 다양한 역할 뿐만 아니라 학생 개별 화면까지 모두 체험할 수 있습니다.</p>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => onSelect('student')}
                                className="w-full p-4 bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-100 rounded-2xl text-left transition-all active:scale-[0.98] group flex gap-3 items-start"
                            >
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5">학생</div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">학생 모드 체험하기</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">게스트 교사 모드와 연동된 학생 페이지를 체험합니다. 교사 모드 체험하기-학생 페이지에서 동일하게 학생 모드를 체험할 수 있습니다.</p>
                                </div>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const GuestStudentSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (student: any) => void;
    isReplicating: boolean;
    students: any[];
    loadingStudents: boolean;
}> = ({ isOpen, onClose, onSelect, isReplicating, students, loadingStudents }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] w-full max-w-lg p-8 flex flex-col shadow-2xl relative max-h-[85vh]">
                <button onClick={onClose} className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <XIcon className="w-5 h-5 text-gray-400" />
                </button>
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-900">체험할 학생 선택 👥</h3>
                    <p className="text-xs text-gray-400 mt-1 font-semibold">게스트 모드로 접속할 학생을 선택해 주세요.</p>
                </div>

                {isReplicating ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="animate-spin rounded-full h-14 w-14 border-4 border-t-indigo-600 border-indigo-100 mb-6"></div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">학생 게스트 모드 생성 중...</h3>
                        <p className="text-xs text-gray-400 font-semibold">잠시만 기다려 주세요.</p>
                    </div>
                ) : loadingStudents ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-indigo-600 border-indigo-100 mb-4"></div>
                        <p className="text-xs text-gray-400 font-semibold">학생 목록을 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto flex-1 pr-1 max-h-[50vh] space-y-2.5">
                        {students.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 font-semibold text-sm">
                                개설된 학생 계정이 없습니다.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {students.map((student) => (
                                    <button
                                        key={student.userId || student.user_id}
                                        onClick={() => onSelect(student)}
                                        className="p-4 bg-gray-50 hover:bg-indigo-50/50 border border-gray-100 hover:border-indigo-200 rounded-2xl text-left transition-all active:scale-[0.98] flex items-center gap-3 group"
                                    >
                                        <div className="w-10 h-10 bg-indigo-100/60 text-indigo-700 rounded-xl flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            {student.number || student.num || '0'}번
                                        </div>
                                        <div className="truncate">
                                            <p className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors truncate">
                                                {student.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                {student.grade || '1'}학년 {student.class || '1'}반
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
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
    const [guestModalOpen, setGuestModalOpen] = useState(false);


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
    const [isReplicating, setIsReplicating] = useState(false);

    const [studentGuestModalOpen, setStudentGuestModalOpen] = useState(false);
    const [guestStudents, setGuestStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'app' && mode !== 'student-login' && mode !== 'student-password-change') {
            setMode('student-login');
        }
    }, [mode]);

    const handleStartGuestMode = async (role: 'teacher' | 'student') => {
        try {
            setIsReplicating(true);
            const user = await replicateMasterData(role);
            localStorage.setItem('class_bank_is_guest', 'true');
            localStorage.setItem('class_bank_user_id', user.userId);
            login(user);
            setGuestModalOpen(false);
        } catch (error: any) {
            console.error('Guest replication failed', error);
            alert('게스트 체험 모드 가상 환경 생성 중 오류가 발생했습니다: ' + (error.message || error));
        } finally {
            setIsReplicating(false);
        }
    };

    const handleStartStudentGuestMode = async (studentUserObj: any) => {
        try {
            setIsReplicating(true);
            const { data: teachers, error: teacherErr } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', 'd6172c07-26f3-439f-9b00-d8e60700b8c5');

            if (teacherErr || !teachers || teachers.length === 0) {
                throw new Error('선생님 데이터를 데이터베이스에서 찾을 수 없습니다.');
            }
            const teacherObj = teachers[0];

            const userObj: User = {
                userId: studentUserObj.userId || studentUserObj.user_id,
                name: studentUserObj.name,
                role: Role.STUDENT,
                grade: studentUserObj.grade,
                class: studentUserObj.class || studentUserObj.cls,
                number: studentUserObj.number || studentUserObj.num,
                teacher_id: 'd6172c07-26f3-439f-9b00-d8e60700b8c5',
                teacherAlias: studentUserObj.teacherAlias || studentUserObj.teacher_alias || '은하쌤',
                currencyUnit: teacherObj.currencyUnit || teacherObj.currency_unit || '톨',
                classCode: teacherObj.classCode || teacherObj.class_code || '1111',
            };

            localStorage.setItem('class_bank_is_guest', 'true');
            localStorage.setItem('class_bank_user_id', userObj.userId);
            login(userObj);
            setStudentGuestModalOpen(false);
        } catch (err: any) {
            console.error('Student guest login failed', err);
            alert('학생 게스트 로그인 중 오류가 발생했습니다: ' + (err.message || err));
        } finally {
            setIsReplicating(false);
        }
    };

    useEffect(() => {
        if (studentGuestModalOpen) {
            const fetchStudents = async () => {
                setLoadingStudents(true);
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('teacher_id', 'd6172c07-26f3-439f-9b00-d8e60700b8c5')
                        .eq('role', 'student')
                        .order('number', { ascending: true });
                    if (error) throw error;
                    setGuestStudents(data || []);
                } catch (err) {
                    console.error('Failed to fetch guest students', err);
                } finally {
                    setLoadingStudents(false);
                }
            };
            fetchStudents();
        }
    }, [studentGuestModalOpen]);

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
            {`클래스 뱅크 개인정보 처리방침

1. 개인정보의 수집 및 이용 목적
  본 서비스는 수집한 개인정보를 다음의 목적을 위해 활용합니다. 
  처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
    - 학급 경제 시스템 운영 : 학급 내 가상 화폐 배정, 직업별 월급 지급, 세금 징수, 물품 및 쿠폰 구매 등 경제 활동 기록 관리
    - 학생 관리 및 서비스 제공 : 학급 코드별 학생 식별, 개인별 경제 활동 데이터 통계 제공, 교사의 학습 지도 및 피드백 제공
    - 법정대리인 동의 확인 : 만 14세 미만 아동의 개인정보 수집에 대한 법정대리인의 동의 여부 확인 및 고지사항 전달
2. 수집하는 개인정보 항목
  - 교사 : 이메일 주소(아이디), 별칭, 학급 코드
  - 학생 : 이름, 학년, 반, 번호
  - 법정대리인 : (아동 정보 수집 시) 성명, 연락처 등 동의 확인을 위한 최소 정보

3. 개인정보의 처리 및 보유 기간
  - 학년도 종료 시 파기 : 학급 경제 활동 데이터 및 학생 정보는 해당 학년도 교육 활동이 종료되는 시점인 매년 2월 28일에 일괄 자동 파기됩니다.
  - 탈퇴 시 파기 : 교사(관리자) 계정 정보는 서비스 탈퇴 시 즉시 파기됩니다.

4. 만 14세 미만 아동의 개인정보 처리에 관한 사항
  본 서비스는 14세 미만 아동의 개인정보를 처리하기 위해 법정대리인의 동의를 받습니다.
  교사가 학부모로부터 오프라인(가정통신문 등)으로 확인한 동의 사실을 시스템에 반영하거나, 수집된 법정대리인의 연락처를 통해 동의 여부를 확인하는 절차를 거칩니다.

5. 정보주체와 법정대리인의 권리·의무 및 행사방법
  이용자 및 법정대리인은 언제든지 개인정보의 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다.
    - 행사 절차 
      가. 해당 학급의 담당 교사(관리자)에게 구두 또는 서면으로 요청할 수 있습니다.
      나. 아래 제7조의 '개인정보 보호책임자'에게 이메일을 통해 권리 행사를 요청하시면 지체 없이 조치하겠습니다.

6. 개인정보의 파기 절차 및 방법
  - 파기절차 : 보유 기간이 경과한 개인정보(매년 2월 28일 도래 등)는 파기 사유가 발생한 즉시 선정하여 파기합니다.
  - 파기방법 : 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 영구 삭제합니다.

7. 개인정보 보호책임자
  서비스 운영자는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
    - 성명(부서) : 클래스 뱅크 운영팀
    - 연락처(이메일) :sinjoppo@naver.com

8. 개인정보의 기술적 보호 조치
  - 비밀번호 암호화 : 모든 비밀번호는 일방향 해시 함수(bcrypt)를 사용하여 안전하게 암호화 저장됩니다.
  - 접근 통제 : 인가된 관리자 외의 서버 및 데이터베이스 접근을 엄격히 통제합니다.`}
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
                            <li>예금 관리: 예금 상품을 신설/삭제하고 가입자 명단을 관리합니다.</li>
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
                        <strong className="text-gray-900">주요 기능:</strong> 홈(자산/세금), 금융(송금/주식/펀드/예금) 등 모든 금융 활동을 스스로 수행합니다.
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
            if (err.message && (err.message.includes('accounts_pkey') || err.message.includes('duplicate key value violates unique constraint "accounts_pkey"'))) {
                setError('선생님 별칭이 중복되었습니다. 다른 별칭을 사용해주세요.');
            } else {
                setError(err.message);
            }
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
                <div className="bg-white rounded-[32px] p-10 max-sm w-full shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-gray-100 animate-fadeIn text-center">
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
                            <button onClick={() => { resetStates(); setMode('login'); setGuestModalOpen(true); }} className="text-xs font-bold text-indigo-600 hover:underline transition-colors">게스트 모드로 시작</button>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setStudentGuestModalOpen(true)}
                    disabled={isReplicating || loading}
                    className="w-full max-w-[400px] mt-6 p-4 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-2 border-indigo-500/80 rounded-[24px] shadow-md hover:shadow-lg font-black text-base hover:ring-4 hover:ring-indigo-100/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {isReplicating ? '학생 체험 환경 생성 중...' : '학생 체험용 게스트 모드로 바로 시작 👥'}
                </button>
                <GuestStudentSelectionModal
                    isOpen={studentGuestModalOpen}
                    onClose={() => setStudentGuestModalOpen(false)}
                    onSelect={handleStartStudentGuestMode}
                    isReplicating={isReplicating}
                    students={guestStudents}
                    loadingStudents={loadingStudents}
                />
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

            <button 
                onClick={() => setGuestModalOpen(true)}
                className="w-full max-w-[380px] mt-3.5 p-4 bg-gradient-to-r from-[#0066FF]/5 to-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20 rounded-[24px] shadow-sm font-black text-base hover:from-[#0066FF]/10 hover:to-[#0066FF]/15 hover:ring-4 hover:ring-blue-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
                체험용 게스트 모드로 둘러보기 👥
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
            <GuestSelectionModal 
                isOpen={guestModalOpen} 
                onClose={() => setGuestModalOpen(false)} 
                onSelect={handleStartGuestMode} 
                onReset={() => {
                    localStorage.removeItem('class_bank_user_id');
                    localStorage.removeItem('class_bank_is_guest');
                }} 
                isReplicating={isReplicating}
            />
            <GuestStudentSelectionModal
                isOpen={studentGuestModalOpen}
                onClose={() => setStudentGuestModalOpen(false)}
                onSelect={handleStartStudentGuestMode}
                isReplicating={isReplicating}
                students={guestStudents}
                loadingStudents={loadingStudents}
            />
        </div>
    );
};

export default AuthPage;
