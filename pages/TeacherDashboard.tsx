import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { User, Role, Account, Transaction, Job, AssignedStudent } from '../types';
import { LogoutIcon, UsersIcon, QrCodeIcon, UserAddIcon, XIcon, CheckIcon, ErrorIcon, DashboardIcon, BackIcon, BriefcaseIcon } from '../components/icons';

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
        <div className="flex flex-col h-full bg-gray-50">
            <header className="p-4 flex justify-between items-center bg-white border-b sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">교사 관리자</h1>
                    <p className="text-sm text-gray-500">{currentUser?.name}</p>
                </div>
                <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100">
                    <LogoutIcon className="w-6 h-6 text-gray-600" />
                </button>
            </header>

            <main className="flex-grow overflow-y-auto p-4 bg-gray-100">
                {renderView()}
            </main>

            <nav className="grid grid-cols-4 bg-white p-1 border-t sticky bottom-0 z-10">
                <NavButton label="대시보드" Icon={DashboardIcon} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                <NavButton label="학생 등록" Icon={UserAddIcon} active={view === 'students'} onClick={() => setView('students')} />
                <NavButton label="1인 1역" Icon={BriefcaseIcon} active={view === 'jobs'} onClick={() => setView('jobs')} />
                <NavButton label="계좌 관리" Icon={UsersIcon} active={view === 'accounts'} onClick={() => setView('accounts')} />
            </nav>
        </div>
    );
};

const NavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void }> = ({ label, Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors ${active ? 'text-indigo-600' : 'text-gray-500 hover:bg-indigo-50'}`}>
        <Icon className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">{label}</span>
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
        const active = [...activity].sort((a, b) => b.activityCount - a.activityCount).slice(0, 5);
        const inactive = [...activity].sort((a, b) => a.activityCount - b.activityCount).slice(0, 5);

        return { rich, active, inactive };
    }, [students, transactions]);

    const notifications = useMemo(() => {
        const alerts = [];
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0:Sun, 1:Mon, ..., 4:Thu, 5:Fri

        if (dayOfWeek === 4) {
            alerts.push({ id: 'salary-d1', type: '급여', text: '급여 지급 D-1일 입니다.' });
        }
        if (dayOfWeek === 5) {
            alerts.push({ id: 'salary-d0', type: '급여', text: '오늘은 급여 지급일입니다!' });
        }
        // Placeholder for other notifications
        // alerts.push({id: 'dummy1', type: '적금만기', text: '김민준 학생의 적금이 만기되었습니다.'});
        return alerts;
    }, []);

    if (loading) return <div className="text-center p-8">대시보드 데이터를 불러오는 중...</div>;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <SystemStatusCard title="총 학급 자산" value={`${totalAssets.toLocaleString()}권`} />
                <SystemStatusCard title="총 학생 수" value={`${students.length}명`} />
                <SystemStatusCard title="평균 잔액" value={`${Math.round(avgBalance).toLocaleString()}권`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <RankingCard title="부자 랭킹" items={rankings.rich.map(s => ({...s, id: s.userId}))} onClick={(item) => handleRankingClick(item, 'balance')} />
                <RankingCard title="활동성 랭킹" items={rankings.active.map(s => ({...s, id: s.userId}))} onClick={(item) => handleRankingClick(item, 'transactions')} />
                <RankingCard title="비활동성 랭킹" items={rankings.inactive.map(s => ({...s, id: s.userId}))} onClick={(item) => handleRankingClick(item, 'transactions')} />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="font-bold text-lg mb-2">주요 활동 알림</h3>
                 {notifications.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                       {notifications.map(n => (
                           <li key={n.id} className="p-2 bg-indigo-50 rounded-md">
                               <span className={`font-semibold ${n.type === '급여' ? 'text-green-600' : 'text-blue-600'}`}>{`[${n.type}]`}</span> {n.text}
                           </li>
                       ))}
                    </ul>
                ) : <p className="text-sm text-gray-500">새로운 알림이 없습니다.</p>}
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
    <div className="bg-white p-4 rounded-xl shadow-md text-center">
        <h3 className="text-sm font-semibold text-gray-500 whitespace-nowrap">{title}</h3>
        <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
);

const RankingCard: React.FC<{ title: string; items: (User & {id: string, account: Account | null})[]; onClick: (item: User & { account: Account | null }) => void }> = ({ title, items, onClick }) => {
    const titleParts = title.split(' ');
    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="font-bold text-center mb-3">
                {titleParts.length > 1 ? (
                    <>
                        {titleParts[0]}
                        <br />
                        {titleParts[1]}
                    </>
                ) : (
                    title
                )}
            </h3>
            <ol className="space-y-2 text-sm">
                {items.map((item, index) => (
                    <li key={item.id} className="flex items-center">
                        <span className="font-bold w-6">{index + 1}.</span>
                         <button onClick={() => onClick(item)} className="font-bold text-black hover:underline">
                            {item.name}
                        </button>
                    </li>
                ))}
            </ol>
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

    if (loading) return <div className="text-center p-8">학생 정보를 불러오는 중...</div>;
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">학생 목록</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-gray-700">
                        <QrCodeIcon className="w-4 h-4" />
                        일괄 출력
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-indigo-700">
                        <UserAddIcon className="w-4 h-4" />
                        학생 추가
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
            <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
                <BackIcon className="w-5 h-5 mr-1" />
                뒤로가기
            </button>
            <h2 className="text-2xl font-bold mb-1">{student.name}</h2>
            <p className="text-gray-600 mb-4">잔액: <span className="font-bold">{student.account?.balance.toLocaleString() ?? 0}권</span></p>

            <h3 className="font-bold text-lg mb-2">거래 내역</h3>
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
const JobManagementView: React.FC<{ allStudents: (User & { account: Account | null })[] }> = ({ allStudents }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getJobs();
            setJobs(data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handlePayAll = async () => {
        if(window.confirm('모든 직업의 급여를 일괄 지급하시겠습니까?')) {
            try {
                const message = await api.payAllSalaries();
                alert(message);
                fetchJobs();
            } catch(err: any) {
                alert(`오류: ${err.message}`);
            }
        }
    }

    if (loading) return <div className="text-center p-8">직업 정보를 불러오는 중...</div>;

    return (
        <div>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">1인 1역 관리</h2>
                <div>
                     <button onClick={handlePayAll} className="px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-green-700 mr-2">일괄 지급</button>
                     {/* Placeholder for Add Job */}
                     <button onClick={() => alert('직업 추가 기능 준비 중')} className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-indigo-700">직업 추가</button>
                </div>
            </div>
            <div className="space-y-3">
                {jobs.map(job => (
                    <JobCard key={job.id} job={job} allStudents={allStudents} refreshJobs={fetchJobs} />
                ))}
            </div>
        </div>
    );
};

const JobCard: React.FC<{ job: Job; allStudents: User[]; refreshJobs: () => void; }> = ({ job, allStudents, refreshJobs }) => {
    
    const handlePay = async () => {
        try {
            const message = await api.payJobSalary(job.id);
            alert(message);
            refreshJobs();
        } catch(err: any) {
            alert(`오류: ${err.message}`);
        }
    }
    
    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg">{job.jobName}</h3>
                    <p className="text-sm text-gray-500">{job.description}</p>
                </div>
                {/* Placeholder for Delete Job */}
                <button onClick={() => alert('삭제 기능 준비 중')} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-5 h-5 text-gray-500"/></button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center">
                    <label className="w-20 font-semibold">기본급</label>
                    <p>{job.salary.toLocaleString()}권</p>
                </div>
                <div className="flex items-center">
                    <label className="w-20 font-semibold">인센티브</label>
                    {/* Placeholder for Incentive input */}
                    <input type="number" defaultValue={job.incentive} className="w-24 p-1 border rounded" />
                </div>
                 <div className="flex items-start">
                    <label className="w-20 font-semibold mt-2">담당 학생</label>
                    {/* Placeholder for Student Select */}
                    <div className="flex-1 p-2 border rounded bg-gray-50 text-gray-600">
                        {job.assigned_students.map(s => s.name).join(', ') || '담당 학생 없음'}
                    </div>
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button onClick={handlePay} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700">급여 지급</button>
            </div>
        </div>
    );
}


export default TeacherDashboard;
