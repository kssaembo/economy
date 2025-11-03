import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { User, Role, Account, Transaction, Job, AssignedStudent } from '../types';
import { LogoutIcon, QrCodeIcon, UserAddIcon, XIcon, CheckIcon, ErrorIcon, BackIcon, NewDashboardIcon, NewBriefcaseIcon, NewManageAccountsIcon } from '../components/icons';

type View = 'dashboard' | 'students' | 'jobs' | 'accounts';

const useStudentsWithAccounts = () => {
    const [students, setStudents] = useState<(User & { account: Account | null })[]>([]);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const studentUsers = await api.getUsersByRole(Role.STUDENT);
            const studentsWithAccounts = await Promise.all(
                studentUsers.map(async (user) => {
                    const account = await api.getStudentAccountByUserId(user.userId);
                    return { ...user, account };
                })
            );
            
            studentsWithAccounts.sort((a, b) => {
                if (a.grade !== b.grade) return (a.grade || 0) - (b.grade || 0);
                if (a.class !== b.class) return (a.class || 0) - (b.class || 0);
                return (a.number || 0) - (b.number || 0);
            });
            setStudents(studentsWithAccounts);

            const allTransactions = (await Promise.all(
                studentsWithAccounts
                    .filter(s => s.account)
                    .map(s => api.getTransactionsByAccountId(s.account!.accountId))
            )).flat();
            setTransactions(allTransactions);

        } catch (error) {
            console.error("Failed to fetch students data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    return { students, transactions, loading, refresh: fetchAllData };
};


const TeacherDashboard: React.FC = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const [view, setView] = useState<View>('dashboard');
    const studentData = useStudentsWithAccounts();

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <DashboardView {...studentData} />;
            case 'students':
                return <StudentManageView students={studentData.students} loading={studentData.loading} refresh={studentData.refresh} />;
            case 'jobs':
                return <JobManagementView allStudents={studentData.students} />;
            case 'accounts':
                 return <AccountManageView students={studentData.students} loading={studentData.loading} />;
            default:
                return <DashboardView {...studentData} />;
        }
    };

    return (
        <div className="flex h-full bg-gray-100">
            <aside className="hidden md:flex flex-col w-56 bg-white/80 backdrop-blur-sm border-r p-4">
                <div className="px-2">
                    <h1 className="text-xl font-bold text-gray-800">교사 관리자</h1>
                    <p className="text-sm text-gray-500">{currentUser?.name}</p>
                </div>
                <nav className="mt-8 flex flex-col space-y-2">
                    <DesktopNavButton label="대시보드" Icon={NewDashboardIcon} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                    <DesktopNavButton label="학생 등록" Icon={UserAddIcon} active={view === 'students'} onClick={() => setView('students')} />
                    <DesktopNavButton label="1인 1역" Icon={NewBriefcaseIcon} active={view === 'jobs'} onClick={() => setView('jobs')} />
                    <DesktopNavButton label="계좌 관리" Icon={NewManageAccountsIcon} active={view === 'accounts'} onClick={() => setView('accounts')} />
                </nav>
                <div className="mt-auto">
                    <button onClick={logout} className="w-full flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors">
                        <LogoutIcon className="w-5 h-5 mr-3" />
                        로그아웃
                    </button>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col h-full">
                <header className="md:hidden p-4 flex justify-between items-center bg-white border-b sticky top-0 z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">교사 관리자</h1>
                        <p className="text-sm text-gray-500">{currentUser?.name}</p>
                    </div>
                    <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100">
                        <LogoutIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-2 sm:p-4 bg-[#d1d3d8]">
                    {renderView()}
                </main>

                <nav className="md:hidden grid grid-cols-4 bg-white p-1 border-t sticky bottom-0 z-10">
                    <NavButton label="대시보드" Icon={NewDashboardIcon} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                    <NavButton label="학생 등록" Icon={UserAddIcon} active={view === 'students'} onClick={() => setView('students')} />
                    <NavButton label="1인 1역" Icon={NewBriefcaseIcon} active={view === 'jobs'} onClick={() => setView('jobs')} />
                    <NavButton label="계좌 관리" Icon={NewManageAccountsIcon} active={view === 'accounts'} onClick={() => setView('accounts')} />
                </nav>
            </div>
        </div>
    );
};

const NavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void }> = ({ label, Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors ${active ? 'text-[#2B548F]' : 'text-gray-500 hover:bg-blue-50'}`}>
        <Icon className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">{label}</span>
    </button>
);

const DesktopNavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void }> = ({ label, Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center w-full p-3 rounded-lg transition-colors text-sm font-semibold ${active ? 'bg-[#2B548F] text-white' : 'text-gray-600 hover:bg-gray-200/50'}`}>
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
    </button>
);


// --- Dashboard View ---
const DashboardView: React.FC<ReturnType<typeof useStudentsWithAccounts>> = ({ students, transactions, loading }) => {
    const [selectedStudent, setSelectedStudent] = useState<(User & { account: Account | null }) | null>(null);
    const [modalContent, setModalContent] = useState<'balance' | 'transactions' | null>(null);

    const closeModal = () => {
        setSelectedStudent(null);
        setModalContent(null);
    };

    const handleRankingClick = (student: User & { account: Account | null }, type: 'balance' | 'transactions') => {
        setSelectedStudent(student);
        setModalContent(type);
    }
    
    const { totalAssets, avgBalance } = useMemo(() => {
        if (!students || students.length === 0) return { totalAssets: 0, avgBalance: 0 };
        const total = students.reduce((sum, s) => sum + (s.account?.balance || 0), 0);
        return { totalAssets: total, avgBalance: total / students.length };
    }, [students]);
    
    const rankings = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentTransactions = transactions.filter(t => new Date(t.date) > sevenDaysAgo);
        
        const activity = students.map(s => {
            const count = s.account ? recentTransactions.filter(t => t.accountId === s.account!.accountId).length : 0;
            return { ...s, activityCount: count };
        });

        const rich = [...students].sort((a, b) => (b.account?.balance || 0) - (a.account?.balance || 0)).slice(0, 5);
        const maxBalance = rich[0]?.account?.balance || 1;

        const active = [...activity].sort((a, b) => b.activityCount - a.activityCount).slice(0, 5);
        const maxActivity = active[0]?.activityCount || 1;
        
        const inactive = [...activity].sort((a, b) => a.activityCount - b.activityCount).slice(0, 5);

        return { rich, active, inactive, maxBalance, maxActivity };
    }, [students, transactions]);

    if (loading) return <div className="text-center p-8 text-gray-500">대시보드 데이터를 불러오는 중...</div>;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <SystemStatusCard title="총 학급 자산" value={`${totalAssets.toLocaleString()}권`} />
                <SystemStatusCard title="총 학생 수" value={`${students.length}명`} />
                <SystemStatusCard title="평균 잔액" value={`${Math.round(avgBalance).toLocaleString()}권`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RankingCard title="부자 랭킹" items={rankings.rich} maxValue={rankings.maxBalance} onClick={(item) => handleRankingClick(item, 'balance')} />
                <RankingCard title={<>활동성<br/>랭킹</>} items={rankings.active} maxValue={rankings.maxActivity} onClick={(item) => handleRankingClick(item, 'transactions')} />
                <RankingCard title="비활동성 랭킹" items={rankings.inactive} maxValue={rankings.maxActivity} onClick={(item) => handleRankingClick(item, 'transactions')} />
            </div>

            {selectedStudent && modalContent && (
                <RankingDetailModal 
                    student={selectedStudent} 
                    type={modalContent}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

const SystemStatusCard: React.FC<{ title: string, value: string }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm text-center flex flex-col justify-center">
        <h3 className="text-sm font-semibold text-gray-500 whitespace-nowrap">{title}</h3>
        <p className="text-lg font-extrabold text-[#2B548F] mt-2 whitespace-nowrap">{value}</p>
    </div>
);

const RankingCard: React.FC<{
    title: React.ReactNode;
    items: (User & { id: string, account: Account | null, activityCount?: number })[];
    maxValue: number;
    onClick: (item: User & { account: Account | null }) => void
}> = ({ title, items, onClick, maxValue }) => {
    const isInactive = typeof title === 'string' && title.includes('비활동성');
    const barColor = isInactive ? 'bg-amber-400' : 'bg-[#2B548F]';

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm h-full">
            <h3 className="font-bold text-gray-800 text-center mb-4 text-base leading-tight">{title}</h3>
            {items.length > 0 ? (
                <ul className="space-y-4 text-sm">
                    {items.map((item, index) => {
                        const isRichList = typeof title === 'string' && title.includes('부자');
                        const value = isRichList ? (item.account?.balance || 0) : (item.activityCount ?? 0);
                        const percentage = maxValue > 0 ? Math.max(1, (value / maxValue) * 100) : 0;

                        return (
                            <li key={item.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <button onClick={() => onClick(item)} className="font-semibold text-gray-700 hover:text-[#2B548F] transition-colors truncate text-sm">
                                        {index + 1}. {item.name}
                                    </button>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            ) : <p className="text-center text-gray-400 text-sm pt-4">데이터 없음</p>}
        </div>
    );
};

const RankingDetailModal: React.FC<{student: User & { account: Account | null }, type: 'balance' | 'transactions', onClose: () => void}> = ({ student, type, onClose }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (type === 'transactions' && student.account) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            api.getTransactionsByAccountId(student.account.accountId)
                .then(allTrans => {
                    const recent = allTrans.filter(t => new Date(t.date) >= sevenDaysAgo);
                    setTransactions(recent);
                });
        }
    }, [student, type]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{student.name} 상세 정보</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                {type === 'balance' ? (
                    <div>
                        <p className="text-lg">현재 잔액: <span className="font-bold text-indigo-600">{student.account?.balance.toLocaleString() ?? 0}권</span></p>
                    </div>
                ) : (
                    <div>
                        <h4 className="font-bold mb-2">최근 7일 거래 내역</h4>
                        {transactions.length > 0 ? (
                             <ul className="space-y-2 max-h-60 overflow-y-auto">
                                {transactions.map(t => (
                                    <li key={t.transactionId} className="text-sm p-2 bg-gray-50 rounded-md flex justify-between">
                                        <span>{t.description}</span>
                                        <span className={`font-semibold ${t.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>{t.amount.toLocaleString()}권</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">최근 거래 내역이 없습니다.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Student Management View ---
const StudentManageView: React.FC<{ students: (User & { account: Account | null })[]; loading: boolean; refresh: () => void; }> = ({ students, loading, refresh }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState<(User & { account: Account | null }) | null>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);

    if (loading) return <div className="text-center p-8 text-gray-500">학생 정보를 불러오는 중...</div>;
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">학생 목록</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-gray-50">
                        <QrCodeIcon className="w-4 h-4" />
                        일괄 출력
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-2 bg-[#2B548F] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-opacity-90">
                        <UserAddIcon className="w-4 h-4" />
                        학생 추가
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left w-1/6">학년</th>
                                <th className="p-3 text-left w-1/6">번호</th>
                                <th className="p-3 text-left w-2/6">이름</th>
                                <th className="p-3 text-left w-3/6">계좌번호</th>
                                <th className="p-3 text-center w-1/6">QR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.userId} className="border-t">
                                    <td className="p-3">{s.grade}-{s.class}</td>
                                    <td className="p-3">{s.number}</td>
                                    <td className="p-3 font-medium">{s.name}</td>
                                    <td className="p-3 font-mono text-xs">{(s.account?.accountId || '').replace('권쌤은행 ', '')}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => setShowQrModal(s)} className="p-1 rounded-md hover:bg-gray-200">
                                            <QrCodeIcon className="w-5 h-5 text-gray-600"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onComplete={refresh} />}
            {showQrModal && <QrCodeModal student={showQrModal} onClose={() => setShowQrModal(null)} />}
            {showPrintModal && <PrintQrModal students={students} onClose={() => setShowPrintModal(false)} />}
        </div>
    );
};

const AddStudentModal: React.FC<{ onClose: () => void; onComplete: () => void; }> = ({ onClose, onComplete }) => {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [cls, setCls] = useState('');
    const [num, setNum] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async () => {
        if (!name || !grade || !cls || !num) {
            setResult({ type: 'error', text: '모든 항목을 입력해주세요.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            await api.addStudent(name, parseInt(grade), parseInt(cls), parseInt(num));
            setResult({ type: 'success', text: `${name} 학생을 추가했습니다.` });
            setTimeout(() => {
                onComplete();
                onClose();
            }, 1500);
        } catch (err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">새 학생 추가</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                <div className="space-y-3">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름" className="w-full p-3 border rounded-lg"/>
                    <div className="grid grid-cols-3 gap-2">
                        <input type="number" value={grade} onChange={e => setGrade(e.target.value)} placeholder="학년" className="w-full p-3 border rounded-lg"/>
                        <input type="number" value={cls} onChange={e => setCls(e.target.value)} placeholder="반" className="w-full p-3 border rounded-lg"/>
                        <input type="number" value={num} onChange={e => setNum(e.target.value)} placeholder="번호" className="w-full p-3 border rounded-lg"/>
                    </div>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="mt-6 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg disabled:bg-gray-300">
                    {loading ? '추가 중...' : '추가하기'}
                </button>
                 {result && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <ErrorIcon className="w-5 h-5 mr-2" />}
                        <p className="text-sm">{result.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const QrCodeModal: React.FC<{ student: User & { account: Account | null }; onClose: () => void; }> = ({ student, onClose }) => {
    const loginUrl = student.account?.qrToken ? `${window.location.origin}/?token=${student.account.qrToken}` : '';
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">{student.name}</h3>
                {loginUrl ? (
                     <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(loginUrl)}`} 
                        alt={`${student.name} QR Code`} 
                        className="mx-auto" 
                    />
                ) : (
                    <p className="text-gray-500">QR 코드를 생성할 수 없습니다.</p>
                )}
                 <button onClick={onClose} className="mt-6 w-full p-3 bg-gray-200 font-bold rounded-lg">닫기</button>
            </div>
        </div>
    );
};

const PrintQrModal: React.FC<{ students: (User & { account: Account | null })[]; onClose: () => void }> = ({ students, onClose }) => {
    
    const handlePrint = () => {
        window.print();
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[95vh] flex flex-col">
                 <header className="p-4 flex justify-between items-center border-b">
                    <h3 className="text-xl font-bold">QR 코드 일괄 출력</h3>
                    <div>
                        <button onClick={handlePrint} className="mr-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg">인쇄하기</button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                    </div>
                </header>
                <div id="print-section" className="p-6 grid grid-cols-4 gap-6 overflow-y-auto">
                    {students.map(s => {
                        const loginUrl = s.account?.qrToken ? `${window.location.origin}/?token=${s.account.qrToken}` : '';
                        return (
                             <div key={s.userId} className="text-center p-2 border rounded-lg">
                                 {loginUrl && <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(loginUrl)}`} 
                                    alt={`${s.name} QR Code`} 
                                    className="mx-auto" 
                                />}
                                <p className="mt-2 font-semibold text-sm">{s.name}</p>
                             </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};


// --- Account Management View ---
const AccountManageView: React.FC<{ students: (User & { account: Account | null })[]; loading: boolean; }> = ({ students, loading }) => {
    const [selectedStudent, setSelectedStudent] = useState<(User & { account: Account | null }) | null>(null);

    if (loading) return <div className="text-center p-8 text-gray-500">학생 정보를 불러오는 중...</div>;

    if (selectedStudent) {
        return <AccountDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">계좌 관리</h2>
            <div className="space-y-2">
                {students.map(s => (
                    <button key={s.userId} onClick={() => setSelectedStudent(s)} className="w-full p-4 bg-white rounded-lg shadow-sm text-left hover:bg-gray-50 transition flex justify-between items-center">
                        <span className="font-semibold">{s.grade}-{s.class} {s.number}번 {s.name}</span>
                        <span className="font-mono text-gray-700">{s.account?.balance.toLocaleString() ?? 'N/A'}권</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

const AccountDetailView: React.FC<{ student: User & { account: Account | null }, onBack: () => void }> = ({ student, onBack }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if(student.account) {
            api.getTransactionsByAccountId(student.account.accountId).then(setTransactions);
        }
    }, [student]);

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-800 mb-4">
                <BackIcon className="w-5 h-5 mr-1" />
                뒤로가기
            </button>
            <h2 className="text-2xl font-bold mb-1 text-gray-800">{student.name}</h2>
            <p className="text-gray-600 mb-4">잔액: <span className="font-bold">{student.account?.balance.toLocaleString() ?? 0}권</span></p>

            <h3 className="font-bold text-lg mb-2 text-gray-800">거래 내역</h3>
            <ul className="space-y-2">
                {transactions.map(t => (
                     <li key={t.transactionId} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{t.description}</p>
                            <p className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                        </div>
                        <p className={`font-bold ${t.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}권
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// --- Job Management View ---
const AddJobModal: React.FC<{ onClose: () => void; onComplete: () => void; }> = ({ onClose, onComplete }) => {
    const [jobName, setJobName] = useState('');
    const [description, setDescription] = useState('');
    const [salary, setSalary] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async () => {
        if (!jobName || !salary) {
            setResult({ type: 'error', text: '직업명과 주급을 입력해주세요.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            await api.addJob(jobName, description, parseInt(salary));
            setResult({ type: 'success', text: '직업을 추가했습니다.' });
            setTimeout(() => {
                onComplete();
                onClose();
            }, 1500);
        } catch (err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">새 직업 추가</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                <div className="space-y-3">
                    <input type="text" value={jobName} onChange={e => setJobName(e.target.value)} placeholder="직업명" className="w-full p-3 border rounded-lg"/>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="소개" className="w-full p-3 border rounded-lg"/>
                    <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="주급" className="w-full p-3 border rounded-lg"/>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="mt-6 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg disabled:bg-gray-300">
                    {loading ? '추가 중...' : '확인'}
                </button>
                 {result && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <ErrorIcon className="w-5 h-5 mr-2" />}
                        <p className="text-sm">{result.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AssignStudentModal: React.FC<{ job: Job; allStudents: User[]; onClose: () => void; onComplete: () => void; }> = ({ job, allStudents, onClose, onComplete }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>(() => job.assigned_students.map(s => s.userId));
    const [loading, setLoading] = useState(false);

    const handleToggle = (studentId: string) => {
        setSelectedIds(prev => 
            prev.includes(studentId) 
            ? prev.filter(id => id !== studentId) 
            : [...prev, studentId]
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.manageJobAssignment(job.id, selectedIds);
            onComplete();
            onClose();
        } catch (err: any) {
            alert(`오류: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col max-h-[80vh]">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{job.jobName} 담당자 지정</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                <div className="space-y-2 overflow-y-auto flex-grow pr-2">
                    {allStudents.map(student => (
                        <label key={student.userId} className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input 
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={selectedIds.includes(student.userId)}
                                onChange={() => handleToggle(student.userId)}
                            />
                            <span className="ml-3 text-gray-700">{student.name}</span>
                        </label>
                    ))}
                </div>
                <button onClick={handleSubmit} disabled={loading} className="mt-6 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg disabled:bg-gray-300">
                    {loading ? '저장 중...' : '확인'}
                </button>
            </div>
        </div>
    )
}

const JobManagementView: React.FC<{ allStudents: (User & { account: Account | null })[] }> = ({ allStudents }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [bonuses, setBonuses] = useState<Record<string, number>>({});
    const [showAddJobModal, setShowAddJobModal] = useState(false);
    const [showAssignStudentModal, setShowAssignStudentModal] = useState<Job | null>(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getJobs();
            setJobs(data);
            const initialBonuses = data.reduce((acc, job) => {
                acc[job.id] = job.incentive || 0;
                return acc;
            }, {} as Record<string, number>);
            setBonuses(initialBonuses);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handlePaySingle = async (jobId: string) => {
         try {
            const message = await api.payJobSalary(jobId);
            alert(message);
            fetchJobs();
        } catch(err: any) {
            alert(`오류: ${err.message}`);
        }
    };

    const handleBonusBlur = async (jobId: string, value: number) => {
        const originalBonus = jobs.find(j => j.id === jobId)?.incentive || 0;
        if (value === originalBonus) return;
        try {
            await api.updateJobIncentive(jobId, value);
            fetchJobs(); // Refresh data to confirm change
        } catch(err: any) {
            alert(`보너스 업데이트 실패: ${err.message}`);
            // Revert local state on failure
            setBonuses(prev => ({...prev, [jobId]: originalBonus}));
        }
    };

    if (loading) return <div className="text-center p-8 text-gray-500">직업 정보를 불러오는 중...</div>;

    return (
        <div>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">1인 1역 관리</h2>
                <div>
                     <button onClick={() => setShowAddJobModal(true)} className="px-3 py-2 bg-[#3F649A] text-white text-xs font-semibold rounded-lg shadow hover:bg-[#32507b]">직업 추가</button>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-3 whitespace-nowrap w-[35%]">직업명</th>
                            <th className="p-3 whitespace-nowrap w-[15%]">주급</th>
                            <th className="p-3 whitespace-nowrap w-[20%]">학생명</th>
                            <th className="p-3 whitespace-nowrap w-[15%]">보너스</th>
                            <th className="p-3 text-center whitespace-nowrap w-[15%]">지급</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {jobs.map(job => (
                            <tr key={job.id}>
                                <td className="p-3 font-medium">{job.jobName}</td>
                                <td className="p-3">{job.salary.toLocaleString()}</td>
                                <td className="p-3">
                                    <button onClick={() => setShowAssignStudentModal(job)} className="text-indigo-600 hover:underline text-left">
                                        {job.assigned_students.map(s => s.name).join(' ') || '없음'}
                                    </button>
                                </td>
                                <td className="p-3">
                                    <input
                                        type="number"
                                        className="w-14 p-1 border rounded text-right"
                                        value={bonuses[job.id] ?? 0}
                                        onChange={(e) => {
                                            const value = e.target.valueAsNumber >= 0 ? e.target.valueAsNumber : 0;
                                            setBonuses(prev => ({ ...prev, [job.id]: value }));
                                        }}
                                        onBlur={(e) => handleBonusBlur(job.id, e.target.valueAsNumber >= 0 ? e.target.valueAsNumber : 0)}
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => handlePaySingle(job.id)} className="w-full px-2 py-1.5 bg-[#3F649A] text-white text-sm font-semibold rounded-md shadow-sm hover:bg-[#32507b] whitespace-nowrap">
                                        지급
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddJobModal && <AddJobModal onClose={() => setShowAddJobModal(false)} onComplete={fetchJobs} />}
            {showAssignStudentModal && <AssignStudentModal job={showAssignStudentModal} allStudents={allStudents} onClose={() => setShowAssignStudentModal(null)} onComplete={fetchJobs} />}
        </div>
    );
};


export default TeacherDashboard;