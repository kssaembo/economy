
import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { User, Role, Account, Transaction, Job, AssignedStudent, TransactionType, TaxItemWithRecipients } from '../types';
import { LogoutIcon, QrCodeIcon, UserAddIcon, XIcon, CheckIcon, ErrorIcon, BackIcon, NewDashboardIcon, NewBriefcaseIcon, NewManageAccountsIcon, ManageIcon, NewTaxIcon } from '../components/icons';

type View = 'dashboard' | 'students' | 'jobs' | 'accounts' | 'taxes';

// --- Custom Modals for Sandbox Environment ---
const ConfirmModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    isDangerous?: boolean;
}> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "확인", isDangerous = false }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
                <p className="text-gray-600 mb-6 whitespace-pre-wrap">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">취소</button>
                    <button onClick={onConfirm} className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2B548F] hover:bg-[#234576]'}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MessageModal: React.FC<{
    isOpen: boolean;
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
}> = ({ isOpen, type, message, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center text-center">
                {type === 'success' ? <CheckIcon className="w-12 h-12 text-green-500 mb-4" /> : <ErrorIcon className="w-12 h-12 text-red-500 mb-4" />}
                <h3 className={`text-xl font-bold mb-2 ${type === 'success' ? 'text-gray-900' : 'text-red-600'}`}>
                    {type === 'success' ? '성공' : '오류'}
                </h3>
                <p className="text-gray-600 mb-6 whitespace-pre-wrap">{message}</p>
                <button onClick={onClose} className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">
                    확인
                </button>
            </div>
        </div>
    );
};


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

// Helper to generate full QR URL from base and token
const generateQrUrl = (baseUrl: string, token: string) => {
    try {
        // Ensure baseUrl doesn't end with slash
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        // Add token AND view=transfer to force the transfer screen
        return `${cleanBase}?token=${token}&view=transfer`;
    } catch (e) {
        return `${baseUrl}?token=${token}&view=transfer`;
    }
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
            case 'taxes':
                 return <TaxView students={studentData.students} />;
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
                    <DesktopNavButton label="세금 관리" Icon={NewTaxIcon} active={view === 'taxes'} onClick={() => setView('taxes')} />
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

                <nav className="md:hidden grid grid-cols-5 bg-white p-1 border-t sticky bottom-0 z-10">
                    <NavButton label="대시보드" Icon={NewDashboardIcon} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                    <NavButton label="학생등록" Icon={UserAddIcon} active={view === 'students'} onClick={() => setView('students')} />
                    <NavButton label="1인1역" Icon={NewBriefcaseIcon} active={view === 'jobs'} onClick={() => setView('jobs')} />
                    <NavButton label="계좌관리" Icon={NewManageAccountsIcon} active={view === 'accounts'} onClick={() => setView('accounts')} />
                    <NavButton label="세금관리" Icon={NewTaxIcon} active={view === 'taxes'} onClick={() => setView('taxes')} />
                </nav>
            </div>
        </div>
    );
};

const NavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void }> = ({ label, Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors ${active ? 'text-[#2B548F]' : 'text-gray-500 hover:bg-blue-50'}`}>
        <Icon className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium whitespace-nowrap">{label}</span>
    </button>
);

const DesktopNavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void }> = ({ label, Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center w-full p-3 rounded-lg transition-colors text-sm font-semibold ${active ? 'bg-[#2B548F] text-white' : 'text-gray-600 hover:bg-gray-200/50'}`}>
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
    </button>
);

type NotificationItem = {
    id: string;
    date: string;
    message: string;
};

const NotificationsView: React.FC<{ students: (User & { account: Account | null })[], transactions: Transaction[] }> = ({ students, transactions }) => {
    const [limit, setLimit] = useState(5);

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "년 전";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "달 전";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "일 전";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "시간 전";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "분 전";
        return "방금 전";
    };

    const notifications = useMemo(() => {
        const findStudentByAccountId = (accId: string) => students.find(s => s.account?.accountId === accId);
        const findStudentByUserId = (userId: string) => students.find(s => s.userId === userId);

        const generatedNotifications: NotificationItem[] = transactions
            .map(tx => {
                const student = findStudentByAccountId(tx.accountId);
                if (!student) return null;

                let message = '';
                switch (tx.type) {
                    case TransactionType.TRANSFER:
                        if (tx.amount < 0) { // Outgoing transfer
                            const receiver = tx.receiverId ? findStudentByUserId(tx.receiverId) : null;
                            if (receiver) {
                                message = `${student.name} 학생이 ${receiver.name} 학생에게 ${(-tx.amount).toLocaleString()}권을 송금했습니다.`;
                            }
                        }
                        break;
                    case TransactionType.STOCK_BUY:
                        message = `${student.name} 학생이 ${tx.description.replace('주식 매수', '')} 주식을 ${(-tx.amount).toLocaleString()}권에 매수했습니다.`;
                        break;
                    case TransactionType.STOCK_SELL:
                        message = `${student.name} 학생이 ${tx.description.replace('주식 매도', '')} 주식을 ${tx.amount.toLocaleString()}권에 매도했습니다.`;
                        break;
                    case TransactionType.SAVINGS_JOIN:
                        message = `${student.name} 학생이 ${tx.description}에 ${(-tx.amount).toLocaleString()}권을 가입했습니다.`;
                        break;
                    case TransactionType.SAVINGS_MATURITY:
                        message = `${student.name} 학생의 ${tx.description}이(가) 만기되어 ${tx.amount.toLocaleString()}권을 받았습니다.`;
                        break;
                    case TransactionType.TAX:
                         if (tx.amount < 0) {
                             message = `${student.name} 학생이 ${tx.description.replace(' 납부', '')}을(를) 납부했습니다.`;
                         } else {
                             // This handles incoming tax to teacher account if we were tracking teacher transactions here directly,
                             // but currently we track student transactions.
                             // We could add logic if the teacher's account view is used.
                         }
                        break;
                }

                if (message) {
                    return { id: tx.transactionId, date: tx.date, message };
                }
                return null;
            })
            .filter((item): item is NotificationItem => item !== null)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Add weekly salary notification on Fridays
        if (new Date().getDay() === 5) {
            generatedNotifications.unshift({
                id: 'weekly-salary-day',
                date: new Date().toISOString(),
                message: '주급 지급일입니다.'
            });
        }

        return generatedNotifications;
    }, [students, transactions]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-base">주요 활동 알림</h3>
            {notifications.length > 0 ? (
                <div>
                    <ul className="space-y-3">
                        {notifications.slice(0, limit).map(item => (
                            <li key={item.id} className="text-sm flex items-start">
                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3"></div>
                                <div className="flex-grow">
                                    <p className="text-gray-800">{item.message}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.date)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {notifications.length > limit && (
                        <button
                            onClick={() => setLimit(prev => prev + 5)}
                            className="w-full mt-4 text-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                            더보기
                        </button>
                    )}
                </div>
            ) : (
                <p className="text-center text-gray-400 text-sm py-4">최근 활동이 없습니다.</p>
            )}
        </div>
    );
};


// --- Dashboard View ---
const DashboardView: React.FC<ReturnType<typeof useStudentsWithAccounts>> = ({ students, transactions, loading }) => {
    const [selectedStudent, setSelectedStudent] = useState<(User & { account: Account | null }) | null>(null);
    const [modalContent, setModalContent] = useState<'balance' | 'transactions' | null>(null);
    const [teacherAccount, setTeacherAccount] = useState<Account | null>(null);
    const [showTeacherWallet, setShowTeacherWallet] = useState(false);

    useEffect(() => {
        api.getTeacherAccount().then(setTeacherAccount);
    }, []);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Teacher Wallet Card */}
                <div 
                    onClick={() => setShowTeacherWallet(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white cursor-pointer hover:scale-[1.02] transition-transform"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 font-medium mb-1">권쌤 지갑 (국고)</p>
                            <h3 className="text-3xl font-bold">{teacherAccount?.balance.toLocaleString() ?? 0}권</h3>
                        </div>
                         <ManageIcon className="w-8 h-8 text-blue-200 opacity-80" />
                    </div>
                    <p className="text-xs text-blue-200 mt-4 text-right">클릭하여 내역 확인 &rarr;</p>
                </div>
                 
                 <NotificationsView students={students} transactions={transactions} />
            </div>

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
            
            {showTeacherWallet && teacherAccount && (
                <TeacherWalletModal account={teacherAccount} onClose={() => setShowTeacherWallet(false)} />
            )}
        </div>
    );
};

const TeacherWalletModal: React.FC<{ account: Account; onClose: () => void }> = ({ account, onClose }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.getTransactionsByAccountId(account.accountId)
            .then(setTransactions)
            .finally(() => setLoading(false));
    }, [account.accountId]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">권쌤 지갑 내역</h3>
                        <p className="text-sm text-gray-500 font-mono">{account.accountId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                        <XIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-center">
                    <p className="text-gray-500 text-sm mb-1">현재 잔액</p>
                    <p className="text-2xl font-bold text-blue-600">{account.balance.toLocaleString()}권</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <p className="text-center py-4 text-gray-500">내역을 불러오는 중...</p>
                    ) : transactions.length > 0 ? (
                        <ul className="space-y-3">
                            {transactions.map(t => (
                                <li key={t.transactionId} className="bg-white border p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">{t.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(t.date).toLocaleString()}</p>
                                    </div>
                                    <span className={`font-bold ${t.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center py-10 text-gray-400">거래 내역이 없습니다.</p>
                    )}
                </div>
            </div>
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
    items: (User & { account: Account | null, activityCount?: number })[];
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
                            <li key={item.userId}>
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
    
    // Delete Functionality States
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [messageModal, setMessageModal] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({isOpen: false, type: 'success', message: ''});

    // Fixed Base URL
    const baseUrl = "https://economy-rho.vercel.app";

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(studentId) 
            ? prev.filter(id => id !== studentId) 
            : [...prev, studentId]
        );
    };

    const handleDeleteClick = () => {
        if (selectedStudentIds.length === 0) return;
        setShowConfirmDelete(true);
    };

    const executeDeleteStudents = async () => {
        setShowConfirmDelete(false);
        setIsDeleting(true);
        try {
            const resultMessage = await api.deleteStudents(selectedStudentIds);
            refresh();
            setDeleteMode(false);
            setSelectedStudentIds([]);
            setMessageModal({isOpen: true, type: 'success', message: resultMessage});
        } catch (error: any) {
            setMessageModal({isOpen: true, type: 'error', message: `삭제 중 오류가 발생했습니다: ${error.message}`});
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="text-center p-8 text-gray-500">학생 정보를 불러오는 중...</div>;
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">학생 목록</h2>
                <div className="flex gap-2">
                    {deleteMode ? (
                        <>
                             <button onClick={() => { setDeleteMode(false); setSelectedStudentIds([]); }} disabled={isDeleting} className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-gray-300 disabled:opacity-50">
                                취소
                            </button>
                            <button onClick={handleDeleteClick} disabled={selectedStudentIds.length === 0 || isDeleting} className="px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-red-700 disabled:bg-gray-400">
                                {isDeleting ? '삭제 중...' : `삭제 (${selectedStudentIds.length})`}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-gray-50">
                                <QrCodeIcon className="w-4 h-4" />
                                일괄 출력
                            </button>
                            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-2 bg-[#2B548F] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-opacity-90">
                                <UserAddIcon className="w-4 h-4" />
                                학생 추가
                            </button>
                            <button onClick={() => setDeleteMode(true)} className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-red-600">
                                학생 삭제
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-5">
                            <tr>
                                {deleteMode && <th className="p-3 w-10"></th>}
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
                                    {deleteMode && (
                                        <td className="p-3 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedStudentIds.includes(s.userId)} 
                                                onChange={() => toggleStudentSelection(s.userId)}
                                                disabled={isDeleting}
                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 disabled:opacity-50"
                                            />
                                        </td>
                                    )}
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
            
            {/* Modals */}
            {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onComplete={refresh} />}
            {showQrModal && <QrCodeModal student={showQrModal} baseUrl={baseUrl} onClose={() => setShowQrModal(null)} />}
            {showPrintModal && <PrintQrModal students={students} baseUrl={baseUrl} onClose={() => setShowPrintModal(false)} />}
            
            <ConfirmModal 
                isOpen={showConfirmDelete}
                title="학생 삭제"
                message={`선택한 ${selectedStudentIds.length}명의 학생을 정말 삭제하시겠습니까?\n\n계좌, 거래내역, 주식 등 관련된 모든 정보가 함께 영구적으로 삭제됩니다.`}
                onConfirm={executeDeleteStudents}
                onCancel={() => setShowConfirmDelete(false)}
                confirmText="삭제"
                isDangerous={true}
            />
            
            <MessageModal 
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                message={messageModal.message}
                onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
            />
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

const QrCodeModal: React.FC<{ student: User & { account: Account | null }; baseUrl: string; onClose: () => void; }> = ({ student, baseUrl, onClose }) => {
    const qrToken = student.account?.qrToken;
    const loginUrl = qrToken ? generateQrUrl(baseUrl, qrToken) : '';
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2">{student.name}</h3>
                
                {loginUrl ? (
                    <>
                     <div className="mb-4 p-2 bg-white rounded-lg border border-gray-100 shadow-inner flex justify-center items-center min-h-[250px]">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(loginUrl)}`} 
                            alt={`${student.name} QR Code`} 
                            className="max-w-full" 
                        />
                     </div>
                     
                     <div className="text-left text-xs text-gray-500 mb-4">
                         <p className="font-bold text-gray-700 mb-1">QR 연결 주소</p>
                         <p className="break-all border p-2 rounded bg-gray-50 select-all">
                             {loginUrl}
                         </p>
                     </div>
                    </>
                ) : (
                    <p className="text-gray-500">QR 코드를 생성할 수 없습니다.</p>
                )}
                 <button onClick={onClose} className="mt-2 w-full p-3 bg-gray-200 font-bold rounded-lg">닫기</button>
            </div>
        </div>
    );
};

const PrintQrModal: React.FC<{ students: (User & { account: Account | null })[]; baseUrl: string; onClose: () => void }> = ({ students, baseUrl, onClose }) => {
    const handlePrint = () => {
        window.print();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[95vh] flex flex-col">
                 <header className="p-4 flex justify-between items-center border-b">
                    <div>
                        <h3 className="text-xl font-bold">QR 코드 일괄 출력</h3>
                        <p className="text-xs text-gray-500 mt-1">연결 주소: {baseUrl}</p>
                    </div>
                    <div>
                        <button onClick={handlePrint} className="mr-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg">인쇄하기</button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                    </div>
                </header>
                <div id="print-section" className="p-6 grid grid-cols-4 gap-6 overflow-y-auto">
                    {students.map(s => {
                        const loginUrl = s.account?.qrToken ? generateQrUrl(baseUrl, s.account.qrToken) : '';
                        return (
                             <div key={s.userId} className="text-center p-2 border rounded-lg break-inside-avoid">
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

    if (loading) return <div className="text-center p-8">학생 정보를 불러오는 중...</div>;

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

    // Delete Functionality States
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [messageModal, setMessageModal] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({isOpen: false, type: 'success', message: ''});


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
            setMessageModal({isOpen: true, type: 'success', message: message});
            fetchJobs();
        } catch(err: any) {
            setMessageModal({isOpen: true, type: 'error', message: `오류: ${err.message}`});
        }
    };

    const handleBonusBlur = async (jobId: string, value: number) => {
        const originalBonus = jobs.find(j => j.id === jobId)?.incentive || 0;
        if (value === originalBonus) return;
        try {
            await api.updateJobIncentive(jobId, value);
            fetchJobs(); // Refresh data to confirm change
        } catch(err: any) {
            setMessageModal({isOpen: true, type: 'error', message: `보너스 업데이트 실패: ${err.message}`});
            // Revert local state on failure
            setBonuses(prev => ({...prev, [jobId]: originalBonus}));
        }
    };

    const toggleJobSelection = (jobId: string) => {
        setSelectedJobIds(prev => 
            prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
        );
    };

    const handleDeleteClick = () => {
        if (selectedJobIds.length === 0) return;
        setShowConfirmDelete(true);
    }

    const executeDeleteJobs = async () => {
        setShowConfirmDelete(false);
        setIsDeleting(true);
        try {
            const resultMessage = await api.deleteJobs(selectedJobIds);
            fetchJobs();
            setDeleteMode(false);
            setSelectedJobIds([]);
            setMessageModal({isOpen: true, type: 'success', message: resultMessage});
        } catch (error: any) {
            setMessageModal({isOpen: true, type: 'error', message: `삭제 중 오류가 발생했습니다: ${error.message}`});
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="text-center p-8 text-gray-500">직업 정보를 불러오는 중...</div>;

    return (
        <div>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">1인 1역 관리</h2>
                <div className="flex gap-2">
                    {deleteMode ? (
                        <>
                            <button onClick={() => { setDeleteMode(false); setSelectedJobIds([]); }} disabled={isDeleting} className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-gray-300 disabled:opacity-50">
                                취소
                            </button>
                            <button onClick={handleDeleteClick} disabled={selectedJobIds.length === 0 || isDeleting} className="px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-red-700 disabled:bg-gray-400">
                                {isDeleting ? '삭제 중...' : `삭제 (${selectedJobIds.length})`}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setShowAddJobModal(true)} className="px-3 py-2 bg-[#3F649A] text-white text-xs font-semibold rounded-lg shadow hover:bg-[#32507b]">직업 추가</button>
                            <button onClick={() => setDeleteMode(true)} className="px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg shadow hover:bg-red-600">
                                직업 삭제
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-5 text-gray-600">
                        <tr>
                            {deleteMode && <th className="p-3 w-10"></th>}
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
                                {deleteMode && (
                                    <td className="p-3 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedJobIds.includes(job.id)} 
                                            onChange={() => toggleJobSelection(job.id)}
                                            disabled={isDeleting}
                                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 disabled:opacity-50"
                                        />
                                    </td>
                                )}
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
            
            <ConfirmModal 
                isOpen={showConfirmDelete}
                title="직업 삭제"
                message={`선택한 ${selectedJobIds.length}개의 직업을 정말 삭제하시겠습니까?`}
                onConfirm={executeDeleteJobs}
                onCancel={() => setShowConfirmDelete(false)}
                confirmText="삭제"
                isDangerous={true}
            />

             <MessageModal 
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                message={messageModal.message}
                onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
            />
        </div>
    );
};

// --- Tax Management View ---
const TaxView: React.FC<{ students: (User & { account: Account | null })[] }> = ({ students }) => {
    const [taxes, setTaxes] = useState<TaxItemWithRecipients[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedTaxId, setExpandedTaxId] = useState<string | null>(null);
    const [messageModal, setMessageModal] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [taxToDelete, setTaxToDelete] = useState<string | null>(null);

    const fetchTaxes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getTaxes();
            setTaxes(data);
        } catch (error) {
            console.error("Failed to fetch taxes", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTaxes();
    }, [fetchTaxes]);

    const handleDeleteClick = (taxId: string) => {
        setTaxToDelete(taxId);
        setShowConfirmDelete(true);
    }

    const executeDeleteTax = async () => {
        if (!taxToDelete) return;
        setShowConfirmDelete(false);
        try {
            await api.deleteTax(taxToDelete);
            fetchTaxes();
            setMessageModal({isOpen: true, type: 'success', message: "세금 항목이 삭제되었습니다."});
        } catch (error: any) {
            setMessageModal({isOpen: true, type: 'error', message: error.message});
        } finally {
            setTaxToDelete(null);
        }
    }

    const toggleExpand = (taxId: string) => {
        setExpandedTaxId(prev => prev === taxId ? null : taxId);
    }

    if (loading) return <div className="text-center p-8">세금 정보를 불러오는 중...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">세금 관리</h2>
                <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-[#3F649A] text-white text-xs font-semibold rounded-lg shadow hover:bg-[#32507b]">
                    세금 추가
                </button>
            </div>

            <div className="space-y-4">
                {taxes.map(tax => {
                    const paidCount = tax.recipients.filter(r => r.isPaid).length;
                    const totalCount = tax.recipients.length;
                    
                    return (
                        <div key={tax.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(tax.id)}>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{tax.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(tax.dueDate).toLocaleDateString()} 마감 · {tax.amount.toLocaleString()}권
                                    </p>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                     <div className="text-sm">
                                        <span className="font-bold text-blue-600">{paidCount}</span>
                                        <span className="text-gray-400"> / {totalCount}명 납부</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(tax.id); }} className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded">
                                        삭제
                                    </button>
                                </div>
                            </div>
                            
                            {expandedTaxId === tax.id && (
                                <div className="border-t p-4 bg-gray-50">
                                    <h4 className="font-semibold text-sm mb-2 text-gray-700">납부 현황</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {tax.recipients.map(r => {
                                            const student = students.find(s => s.userId === r.studentUserId);
                                            return (
                                                <span 
                                                    key={r.id} 
                                                    className={`px-2 py-1 rounded-md text-xs font-semibold border ${r.isPaid ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300'}`}
                                                >
                                                    {student?.name || r.studentUserId}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {taxes.length === 0 && <div className="text-center py-8 text-gray-500">등록된 세금 고지서가 없습니다.</div>}
            </div>

            {showAddModal && <AddTaxModal students={students} onClose={() => setShowAddModal(false)} onComplete={fetchTaxes} />}
            
            <ConfirmModal 
                isOpen={showConfirmDelete}
                title="세금 항목 삭제"
                message="정말로 이 세금 항목을 삭제하시겠습니까?"
                onConfirm={executeDeleteTax}
                onCancel={() => setShowConfirmDelete(false)}
                confirmText="삭제"
                isDangerous={true}
            />

             <MessageModal 
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                message={messageModal.message}
                onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
            />
        </div>
    );
};

const AddTaxModal: React.FC<{ students: (User & { account: Account | null })[], onClose: () => void, onComplete: () => void }> = ({ students, onClose, onComplete }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Select all by default or none? Let's select none.
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
    
    const toggleSelectAll = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.userId));
        }
    }

    const handleSubmit = async () => {
        if (!name || !amount || !dueDate || selectedIds.length === 0) {
            alert("모든 정보를 입력하고 학생을 최소 1명 선택해주세요.");
            return;
        }
        setLoading(true);
        try {
            // ISO string for date
            const dateObj = new Date(dueDate);
            await api.createTax(name, parseInt(amount), dateObj.toISOString(), selectedIds);
            onComplete();
            onClose();
        } catch (err: any) {
            alert(`오류: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">새 세금 고지서 발송</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                
                <div className="space-y-3 mb-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="세금 이름 (예: 4월 전기세)" className="w-full p-3 border rounded-lg"/>
                    <div className="flex gap-2">
                         <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="금액" className="w-1/2 p-3 border rounded-lg"/>
                         <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-1/2 p-3 border rounded-lg"/>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-2">
                    <label className="font-semibold text-gray-700">대상 학생 선택 ({selectedIds.length}명)</label>
                    <button onClick={toggleSelectAll} className="text-sm text-blue-600 hover:underline">
                        {selectedIds.length === students.length ? '전체 해제' : '전체 선택'}
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto border rounded-lg p-2 space-y-1">
                    {students.map(s => (
                        <label key={s.userId} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input type="checkbox" checked={selectedIds.includes(s.userId)} onChange={() => toggleSelection(s.userId)} className="mr-3 h-4 w-4 text-blue-600"/>
                            <span className="text-sm">{s.grade}-{s.class} {s.number} {s.name}</span>
                        </label>
                    ))}
                </div>

                <button onClick={handleSubmit} disabled={loading} className="mt-4 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg disabled:bg-gray-300">
                    {loading ? '발송 중...' : '고지서 발송'}
                </button>
            </div>
        </div>
    )
}

export default TeacherDashboard;
