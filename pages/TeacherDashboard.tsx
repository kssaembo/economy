
import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { User, Role, Account, Transaction, Job, AssignedStudent, TransactionType, TaxItemWithRecipients, Fund, FundStatus } from '../types';
import { LogoutIcon, QrCodeIcon, UserAddIcon, XIcon, CheckIcon, ErrorIcon, BackIcon, NewDashboardIcon, NewBriefcaseIcon, NewManageAccountsIcon, ManageIcon, NewTaxIcon, NewFundIcon, NewStudentIcon } from '../components/icons';

type View = 'dashboard' | 'students' | 'jobs' | 'taxes' | 'funds';

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
            case 'taxes':
                 return <TaxView students={studentData.students} />;
            case 'funds':
                return <FundManagementView students={studentData.students} />;
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
                    <DesktopNavButton label="대시보드" Icon={NewDashboardIcon} active={view === 'dashboard'} onClick={() => setView('dashboard')} iconClassName="w-16 h-16" />
                    <DesktopNavButton label="학생 관리" Icon={NewStudentIcon} active={view === 'students'} onClick={() => setView('students')} iconClassName="w-16 h-16" />
                    <DesktopNavButton label="1인 1역" Icon={NewBriefcaseIcon} active={view === 'jobs'} onClick={() => setView('jobs')} iconClassName="w-16 h-16" />
                    <DesktopNavButton label="세금 관리" Icon={NewTaxIcon} active={view === 'taxes'} onClick={() => setView('taxes')} iconClassName="w-16 h-16" />
                    <DesktopNavButton label="펀드 관리" Icon={NewFundIcon} active={view === 'funds'} onClick={() => setView('funds')} iconClassName="w-16 h-16" />
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
                    <NavButton label="대시보드" Icon={NewDashboardIcon} active={view === 'dashboard'} onClick={() => setView('dashboard')} iconClassName="w-12 h-12" />
                    <NavButton label="학생관리" Icon={NewStudentIcon} active={view === 'students'} onClick={() => setView('students')} iconClassName="w-9 h-9" />
                    <NavButton label="1인1역" Icon={NewBriefcaseIcon} active={view === 'jobs'} onClick={() => setView('jobs')} iconClassName="w-9 h-9" />
                    <NavButton label="세금관리" Icon={NewTaxIcon} active={view === 'taxes'} onClick={() => setView('taxes')} iconClassName="w-11 h-11" />
                    <NavButton label="펀드관리" Icon={NewFundIcon} active={view === 'funds'} onClick={() => setView('funds')} iconClassName="w-11 h-11" />
                </nav>
            </div>
        </div>
    );
};

const NavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void, iconClassName?: string }> = ({ label, Icon, active, onClick, iconClassName }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors ${active ? 'text-[#2B548F]' : 'text-gray-500 hover:bg-blue-50'}`}>
        <Icon className={`${iconClassName || 'w-6 h-6'} mb-1 object-contain transition-all`} />
        <span className="text-xs font-medium whitespace-nowrap scale-90">{label}</span>
    </button>
);

const DesktopNavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void, iconClassName?: string }> = ({ label, Icon, active, onClick, iconClassName }) => (
    <button onClick={onClick} className={`flex items-center w-full p-3 rounded-lg transition-colors text-sm font-semibold ${active ? 'bg-[#2B548F] text-white' : 'text-gray-600 hover:bg-gray-200/50'}`}>
        <Icon className={`${iconClassName || 'w-5 h-5'} mr-3 object-contain transition-all`} />
        <span>{label}</span>
    </button>
);

const DashboardView: React.FC<{ students: (User & { account: Account | null })[], transactions: Transaction[], loading: boolean }> = ({ students, transactions, loading }) => {
    const [teacherAccount, setTeacherAccount] = useState<Account | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [teacherTransactions, setTeacherTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const acc = await api.getTeacherAccount();
                setTeacherAccount(acc);
                if (acc) {
                    const trans = await api.getTransactionsByAccountId(acc.accountId);
                    setTeacherTransactions(trans);
                }
            } catch (err) {
                console.error("Failed to fetch teacher account", err);
            }
        };
        fetchTeacherData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
    
    const totalAssets = students.reduce((acc, s) => acc + (s.account?.balance || 0), 0);
    const avgAssets = students.length > 0 ? Math.round(totalAssets / students.length) : 0;
    
    const richList = [...students].sort((a, b) => (b.account?.balance || 0) - (a.account?.balance || 0)).slice(0, 3);
    const recentTransactions = transactions.slice(0, 5);

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div onClick={() => setShowHistoryModal(true)} className="bg-[#2B548F] text-white p-6 rounded-xl shadow-lg cursor-pointer hover:bg-[#234576] transition-colors relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="font-medium text-blue-200 text-sm mb-1">권쌤 지갑 (국고)</h3>
                        <p className="text-3xl font-bold">{teacherAccount?.balance.toLocaleString() ?? 0}권</p>
                        <p className="text-xs text-blue-200 mt-2 flex items-center">내역 보기 <span className="ml-1">→</span></p>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm">총 통화량</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{totalAssets.toLocaleString()}권</p>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm">평균 자산</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{avgAssets.toLocaleString()}권</p>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm">등록 학생</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{students.length}명</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                     <div className="p-4 border-b">
                         <h3 className="font-bold text-gray-800">자산 순위 TOP 3</h3>
                     </div>
                     <ul>
                         {richList.map((s, index) => (
                             <li key={s.userId} className="p-4 border-b last:border-b-0 flex items-center justify-between">
                                 <div className="flex items-center">
                                     <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-800'}`}>
                                         {index + 1}
                                     </span>
                                     <span className="font-medium">{s.name}</span>
                                 </div>
                                 <span className="font-mono text-gray-600">{(s.account?.balance || 0).toLocaleString()}권</span>
                             </li>
                         ))}
                         {richList.length === 0 && <li className="p-4 text-center text-gray-400">데이터 없음</li>}
                     </ul>
                 </div>
                 
                 <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                     <div className="p-4 border-b">
                         <h3 className="font-bold text-gray-800">최근 거래 내역</h3>
                     </div>
                     <ul>
                         {recentTransactions.map(t => (
                             <li key={t.transactionId} className="p-4 border-b last:border-b-0">
                                 <div className="flex justify-between items-start mb-1">
                                     <span className="font-medium text-sm">{t.description}</span>
                                     <span className={`font-bold text-sm ${t.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                         {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                                     </span>
                                 </div>
                                 <div className="text-xs text-gray-400 text-right">
                                     {new Date(t.date).toLocaleString()}
                                 </div>
                             </li>
                         ))}
                         {recentTransactions.length === 0 && <li className="p-4 text-center text-gray-400">거래 내역 없음</li>}
                     </ul>
                 </div>
             </div>

             {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">권쌤 지갑 내역 (국고)</h3>
                            <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-full hover:bg-gray-200">
                                <XIcon className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {teacherTransactions.length > 0 ? (
                                <ul className="space-y-2">
                                    {teacherTransactions.map(t => (
                                        <li key={t.transactionId} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-sm">{t.description}</p>
                                                <p className="text-xs text-gray-500">{new Date(t.date).toLocaleString()}</p>
                                            </div>
                                            <p className={`font-bold ${t.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-8">거래 내역이 없습니다.</p>
                            )}
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
};

// --- Student Manage View ---
const StudentManageView: React.FC<{ students: (User & { account: Account | null })[], loading: boolean, refresh: () => void }> = ({ students, loading, refresh }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [messageModal, setMessageModal] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });
    
    // New states for functionality
    const [selectedDetailStudent, setSelectedDetailStudent] = useState<(User & { account: Account | null }) | null>(null);
    const [selectedQrStudent, setSelectedQrStudent] = useState<(User & { account: Account | null }) | null>(null);
    const [showBatchQr, setShowBatchQr] = useState(false);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        try {
            const message = await api.deleteStudents(selectedIds);
            setMessageModal({ isOpen: true, type: 'success', message });
            setSelectedIds([]);
            setConfirmDelete(false);
            refresh();
        } catch (error: any) {
            setMessageModal({ isOpen: true, type: 'error', message: error.message });
        }
    };

    const handleResetPassword = async (userId: string) => {
        if(!window.confirm('비밀번호를 "1234"로 초기화하시겠습니까?')) return;
        try {
            await api.resetPassword(userId);
            setMessageModal({ isOpen: true, type: 'success', message: '비밀번호가 1234로 초기화되었습니다.' });
        } catch(err: any) {
            setMessageModal({ isOpen: true, type: 'error', message: err.message });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800">학생 관리 ({students.length}명)</h2>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <button onClick={() => setConfirmDelete(true)} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200">
                            선택 삭제 ({selectedIds.length})
                        </button>
                    )}
                    <button onClick={() => setShowBatchQr(true)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 flex items-center">
                        <QrCodeIcon className="w-4 h-4 mr-1"/> QR 일괄 출력
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center">
                        <UserAddIcon className="w-4 h-4 mr-1" /> 학생 추가
                    </button>
                </div>
            </div>
            
            <div className="flex-grow overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th className="p-4 w-4">
                                <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? students.map(s => s.userId) : [])} checked={selectedIds.length === students.length && students.length > 0} />
                            </th>
                            <th className="p-4 min-w-[105px]">번호/이름</th>
                            <th className="p-4">계좌번호</th>
                            <th className="p-4 text-center">기능</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.userId} className="border-b hover:bg-gray-50">
                                <td className="p-4">
                                    <input type="checkbox" checked={selectedIds.includes(s.userId)} onChange={() => toggleSelect(s.userId)} />
                                </td>
                                <td className="p-4 font-medium text-gray-900">
                                    <div 
                                        className="flex items-center cursor-pointer hover:bg-gray-100 rounded p-1 -m-1"
                                        onClick={() => setSelectedDetailStudent(s)}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3 shrink-0">
                                            {s.number}
                                        </div>
                                        <div>
                                            <div className="font-bold underline decoration-dotted decoration-gray-400 underline-offset-2 whitespace-nowrap">{s.name}</div>
                                            <div className="text-xs text-gray-500 whitespace-nowrap">{s.grade}학년 {s.class}반</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-gray-600">
                                    {s.account ? s.account.accountId : <span className="text-red-500">계좌 없음</span>}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => setSelectedQrStudent(s)} 
                                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 border border-gray-200"
                                            title="QR 코드 보기"
                                        >
                                            QR
                                        </button>
                                        <button 
                                            onClick={() => handleResetPassword(s.userId)} 
                                            className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 border border-red-100 whitespace-nowrap"
                                            title="비밀번호 초기화"
                                        >
                                            초기화
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">등록된 학생이 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onComplete={refresh} />}
            
            {/* Student Detail Modal */}
            {selectedDetailStudent && (
                <StudentDetailModal 
                    student={selectedDetailStudent} 
                    onClose={() => setSelectedDetailStudent(null)} 
                />
            )}

            {/* QR View Modal */}
            {selectedQrStudent && selectedQrStudent.account && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedQrStudent(null)}>
                    <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-2">{selectedQrStudent.name}의 QR 코드</h3>
                        <p className="text-gray-500 mb-6 text-sm">학생 앱 로그인 또는 송금 시 사용하세요.</p>
                        <div className="bg-white p-4 inline-block rounded-xl border-4 border-gray-100 mb-6">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateQrUrl(window.location.origin, selectedQrStudent.account.qrToken || ''))}`} 
                                alt="QR Code" 
                                className="w-48 h-48"
                            />
                        </div>
                        <p className="text-xs text-gray-400 break-all mb-6">{generateQrUrl(window.location.origin, selectedQrStudent.account.qrToken || '')}</p>
                        <button onClick={() => setSelectedQrStudent(null)} className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold">닫기</button>
                    </div>
                </div>
            )}

            {/* Batch QR Print Modal */}
            {showBatchQr && (
                <BatchQrPrintModal 
                    students={students} 
                    onClose={() => setShowBatchQr(false)} 
                />
            )}

            <ConfirmModal 
                isOpen={confirmDelete} 
                title="학생 삭제" 
                message={`선택한 ${selectedIds.length}명의 학생을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 관련된 계좌와 거래 내역도 모두 삭제됩니다.`} 
                onConfirm={handleDelete} 
                onCancel={() => setConfirmDelete(false)}
                isDangerous={true}
                confirmText="삭제"
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

const StudentDetailModal: React.FC<{ student: User & { account: Account | null }, onClose: () => void }> = ({ student, onClose }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState({ cash: 0, stock: 0, savings: 0, total: 0 });

    useEffect(() => {
        const fetchData = async () => {
            if (!student.account) return;
            setLoading(true);
            try {
                // Fetch transactions
                const trans = await api.getTransactionsByAccountId(student.account.accountId);
                setTransactions(trans);

                // Fetch stocks
                const stocks = await api.getStudentStocks(student.userId);
                const stockVal = stocks.reduce((sum, s) => sum + (s.quantity * (s.stock?.currentPrice || 0)), 0);

                // Fetch savings
                const savings = await api.getStudentSavings(student.userId);
                const savingsVal = savings.reduce((sum, s) => sum + s.amount, 0);

                setAssets({
                    cash: student.account.balance,
                    stock: stockVal,
                    savings: savingsVal,
                    total: student.account.balance + stockVal + savingsVal
                });
            } catch (error) {
                console.error("Error fetching detail data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [student]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                            {student.name} 
                            <span className="text-sm font-normal text-gray-500 ml-2 bg-gray-200 px-2 py-0.5 rounded-full">
                                {student.number}번
                            </span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">{student.userId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <XIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">데이터 로딩 중...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">총 자산</p>
                                    <p className="font-bold text-lg text-gray-800">{assets.total.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">현금</p>
                                    <p className="font-bold text-lg text-gray-800">{assets.cash.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">주식</p>
                                    <p className="font-bold text-lg text-gray-800">{assets.stock.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">적금</p>
                                    <p className="font-bold text-lg text-gray-800">{assets.savings.toLocaleString()}</p>
                                </div>
                            </div>

                            <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">최근 거래 내역</h4>
                            <div className="bg-white rounded-lg border border-gray-100">
                                {transactions.length > 0 ? (
                                    <ul className="divide-y divide-gray-100">
                                        {transactions.map(t => (
                                            <li key={t.transactionId} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{t.description}</p>
                                                    <p className="text-xs text-gray-400">{new Date(t.date).toLocaleString()}</p>
                                                </div>
                                                <span className={`font-bold text-sm ${t.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                    {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-gray-400 py-6">거래 내역이 없습니다.</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
                
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 shadow-sm">
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

const BatchQrPrintModal: React.FC<{ students: (User & { account: Account | null })[], onClose: () => void }> = ({ students, onClose }) => {
    // Filter only students with accounts
    const validStudents = students.filter(s => s.account && s.account.qrToken);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             {/* The modal content container */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">QR 코드 일괄 출력</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => window.print()} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                            </svg>
                            인쇄하기
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300">닫기</button>
                    </div>
                </div>

                <div className="overflow-y-auto p-8 bg-gray-100" id="print-section">
                    <div className="grid grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
                        {validStudents.map(s => (
                            <div key={s.userId} className="bg-white p-4 rounded-lg border border-gray-300 flex flex-col items-center justify-center text-center page-break-inside-avoid shadow-sm">
                                <p className="font-bold text-lg text-gray-800 mb-1">{s.number}. {s.name}</p>
                                <p className="text-xs text-gray-500 mb-2">{s.grade}학년 {s.class}반</p>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateQrUrl(window.location.origin, s.account!.qrToken!))}`} 
                                    alt="QR Code" 
                                    className="w-32 h-32 mb-2 border p-1"
                                />
                                <p className="text-[10px] text-gray-400 break-all leading-tight">{s.account!.qrToken!.substring(0, 8)}...</p>
                            </div>
                        ))}
                    </div>
                     {validStudents.length === 0 && <p className="text-center text-gray-500">출력할 QR 코드가 없습니다.</p>}
                </div>
            </div>
            {/* Print Styles Injection */}
             <style>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    body * { visibility: hidden; }
                    #print-section, #print-section * { visibility: visible; }
                    #print-section { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible; background: white; padding: 0; }
                    .page-break-inside-avoid { break-inside: avoid; }
                    /* Hide scrollbars during print */
                    ::-webkit-scrollbar { display: none; }
                }
            `}</style>
        </div>
    );
};

const AddStudentModal: React.FC<{ onClose: () => void, onComplete: () => void }> = ({ onClose, onComplete }) => {
    const [formData, setFormData] = useState({ name: '', grade: 6, classNum: 1, startNum: 1, endNum: 1 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            if (formData.endNum < formData.startNum) {
                // Single add
                await api.addStudent(formData.name, formData.grade, formData.classNum, formData.startNum);
            } else {
                // Batch add (Logic simplified for UI, assuming API handles one by one or we loop here)
                // For this demo, let's just support single add properly or loop
                 if (!formData.name && formData.endNum > formData.startNum) {
                     // Batch add by number range
                     for (let i = formData.startNum; i <= formData.endNum; i++) {
                         await api.addStudent(`학생${i}`, formData.grade, formData.classNum, i);
                     }
                 } else {
                     await api.addStudent(formData.name, formData.grade, formData.classNum, formData.startNum);
                 }
            }
            onComplete();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">학생 등록</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                         <input type="number" value={formData.grade} onChange={e => setFormData({...formData, grade: parseInt(e.target.value)})} placeholder="학년" className="p-2 border rounded"/>
                         <input type="number" value={formData.classNum} onChange={e => setFormData({...formData, classNum: parseInt(e.target.value)})} placeholder="반" className="p-2 border rounded"/>
                    </div>
                    <input type="number" value={formData.startNum} onChange={e => setFormData({...formData, startNum: parseInt(e.target.value)})} placeholder="번호" className="w-full p-2 border rounded"/>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="이름" className="w-full p-2 border rounded"/>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <button onClick={handleSubmit} disabled={loading} className="mt-4 w-full p-3 bg-blue-600 text-white font-bold rounded-lg disabled:bg-gray-400">
                    {loading ? '등록 중...' : '등록하기'}
                </button>
                <button onClick={onClose} className="mt-2 w-full p-2 text-gray-500">취소</button>
            </div>
        </div>
    );
};

// --- Job Management View ---
const JobManagementView: React.FC<{ allStudents: User[] }> = ({ allStudents }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [messageModal, setMessageModal] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });

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

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const handlePaySalary = async (jobId: string) => {
        try {
            const msg = await api.payJobSalary(jobId);
            setMessageModal({ isOpen: true, type: 'success', message: msg });
        } catch (err: any) {
            setMessageModal({ isOpen: true, type: 'error', message: err.message });
        }
    };
    
    const handleDeleteJob = async (jobId: string) => {
        if (!window.confirm('정말로 이 직업을 삭제하시겠습니까?')) return;
        try {
            const msg = await api.deleteJob(jobId);
            setMessageModal({ isOpen: true, type: 'success', message: msg });
            fetchJobs();
        } catch (err: any) {
            setMessageModal({ isOpen: true, type: 'error', message: err.message });
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">1인 1역 관리</h2>
                <div className="flex gap-2">
                     <button onClick={async () => {
                        if(window.confirm('모든 직업의 월급을 일괄 지급하시겠습니까?')) {
                            try {
                                const msg = await api.payAllSalaries();
                                setMessageModal({ isOpen: true, type: 'success', message: msg });
                            } catch(e: any) {
                                setMessageModal({ isOpen: true, type: 'error', message: e.message });
                            }
                        }
                    }} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow hover:bg-green-700">
                        전체 월급 지급
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-[#2B548F] text-white rounded-lg text-sm font-bold shadow hover:bg-[#234576]">
                        + 직업 추가
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
                {jobs.map(job => (
                    <div key={job.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-800">{job.jobName}</h3>
                            <button onClick={() => handleDeleteJob(job.id)} className="text-gray-400 hover:text-red-500"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <p className="text-sm text-gray-500 mb-3 h-10 line-clamp-2">{job.description}</p>
                        
                        <div className="bg-gray-50 p-3 rounded-lg mb-3 text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-500">기본급</span>
                                <span className="font-bold">{job.salary.toLocaleString()}권</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">인센티브</span>
                                <span className="font-bold text-blue-600">+{job.incentive.toLocaleString()}권</span>
                            </div>
                        </div>

                        <div className="mb-4 flex-grow">
                            <p className="text-xs text-gray-400 mb-1">담당 학생 ({job.assigned_students?.length || 0}명)</p>
                            <div className="flex flex-wrap gap-1">
                                {job.assigned_students?.map(s => (
                                    <span key={s.userId} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">{s.name}</span>
                                ))}
                                {(!job.assigned_students || job.assigned_students.length === 0) && <span className="text-xs text-gray-400">-</span>}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                            <button onClick={() => { setSelectedJob(job); setShowAssignModal(true); }} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200">
                                담당 배정
                            </button>
                            <button onClick={() => handlePaySalary(job.id)} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100">
                                월급 지급
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">새 직업 추가</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as any;
                            try {
                                await api.addJob(form.name.value, form.desc.value, parseInt(form.salary.value));
                                setShowAddModal(false);
                                fetchJobs();
                            } catch(err: any) { alert(err.message); }
                        }}>
                            <input name="name" placeholder="직업명" className="w-full p-2 border rounded mb-2" required />
                            <input name="desc" placeholder="하는 일" className="w-full p-2 border rounded mb-2" required />
                            <input name="salary" type="number" placeholder="월급" className="w-full p-2 border rounded mb-4" required />
                            <button type="submit" className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold">추가</button>
                            <button type="button" onClick={() => setShowAddModal(false)} className="w-full p-2 mt-2 text-gray-500">취소</button>
                        </form>
                    </div>
                </div>
            )}

            {showAssignModal && selectedJob && (
                <AssignStudentModal 
                    job={selectedJob} 
                    allStudents={allStudents} 
                    onClose={() => setShowAssignModal(false)} 
                    onComplete={() => { fetchJobs(); setShowAssignModal(false); }} 
                />
            )}
            
            <MessageModal 
                isOpen={messageModal.isOpen} 
                type={messageModal.type} 
                message={messageModal.message} 
                onClose={() => setMessageModal({ ...messageModal, isOpen: false })} 
            />
        </div>
    );
};

const AssignStudentModal: React.FC<{ job: Job, allStudents: User[], onClose: () => void, onComplete: () => void }> = ({ job, allStudents, onClose, onComplete }) => {
    const [assignedIds, setAssignedIds] = useState<string[]>(job.assigned_students?.map(s => s.userId) || []);
    
    const handleSave = async () => {
        try {
            await api.manageJobAssignment(job.id, assignedIds);
            onComplete();
        } catch(err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold mb-2">{job.jobName} 담당 배정</h3>
                <p className="text-sm text-gray-500 mb-4">담당할 학생들을 선택해주세요.</p>
                
                <div className="flex-grow overflow-y-auto grid grid-cols-2 gap-2 mb-4 p-2 border rounded bg-gray-50">
                    {allStudents.map(s => (
                        <label key={s.userId} className="flex items-center space-x-2 p-2 bg-white rounded shadow-sm cursor-pointer hover:bg-indigo-50">
                            <input 
                                type="checkbox" 
                                checked={assignedIds.includes(s.userId)} 
                                onChange={e => {
                                    if(e.target.checked) setAssignedIds([...assignedIds, s.userId]);
                                    else setAssignedIds(assignedIds.filter(id => id !== s.userId));
                                }}
                                className="rounded text-indigo-600"
                            />
                            <span className="text-sm">{s.name} ({s.number}번)</span>
                        </label>
                    ))}
                </div>
                
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 p-3 bg-gray-200 text-gray-700 rounded-lg font-bold">취소</button>
                    <button onClick={handleSave} className="flex-1 p-3 bg-blue-600 text-white rounded-lg font-bold">저장</button>
                </div>
            </div>
        </div>
    );
};

// --- Tax View ---
const TaxView: React.FC<{ students: User[] }> = ({ students }) => {
    const [taxes, setTaxes] = useState<TaxItemWithRecipients[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchTaxes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getTaxes();
            setTaxes(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

    const handleDelete = async (id: string) => {
        if(!window.confirm('이 세금 항목을 삭제하시겠습니까?')) return;
        await api.deleteTax(id);
        fetchTaxes();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">세금 관리</h2>
                <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-[#2B548F] text-white rounded-lg text-sm font-bold shadow hover:bg-[#234576]">
                    + 세금 고지
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taxes.map(tax => {
                    const paidCount = tax.recipients.filter(r => r.isPaid).length;
                    const totalCount = tax.recipients.length;
                    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
                    
                    return (
                        <div key={tax.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg">{tax.name}</h3>
                                    <p className="text-sm text-gray-500">납부 기한: {new Date(tax.dueDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-lg text-red-600">{tax.amount.toLocaleString()}권</span>
                                    <button onClick={() => handleDelete(tax.id)} className="text-xs text-gray-400 hover:text-red-500 underline mt-1">삭제</button>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600">납부율</span>
                                    <span className="font-bold text-indigo-600">{Math.round(progress)}% ({paidCount}/{totalCount})</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showAddModal && (
                <AddTaxModal students={students} onClose={() => setShowAddModal(false)} onComplete={fetchTaxes} />
            )}
        </div>
    );
};

const AddTaxModal: React.FC<{ students: User[], onClose: () => void, onComplete: () => void }> = ({ students, onClose, onComplete }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(students.map(s => s.userId)); // Default all
    
    const handleSubmit = async () => {
        try {
            await api.createTax(name, parseInt(amount), dueDate, selectedIds);
            onComplete();
            onClose();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">새 세금 고지</h3>
                <div className="space-y-3 mb-4">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="세금 항목명 (예: 소득세)" className="w-full p-2 border rounded"/>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="금액" className="w-full p-2 border rounded"/>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border rounded"/>
                </div>
                
                <p className="font-bold text-sm mb-2">납부 대상 선택 ({selectedIds.length}명)</p>
                <div className="h-40 overflow-y-auto border rounded p-2 bg-gray-50 mb-4 grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2 col-span-2 border-b pb-2 mb-2">
                        <input type="checkbox" checked={selectedIds.length === students.length} onChange={(e) => setSelectedIds(e.target.checked ? students.map(s => s.userId) : [])} />
                        <span className="font-bold text-sm">전체 선택</span>
                    </label>
                    {students.map(s => (
                        <label key={s.userId} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={selectedIds.includes(s.userId)} onChange={(e) => {
                                if(e.target.checked) setSelectedIds([...selectedIds, s.userId]);
                                else setSelectedIds(selectedIds.filter(id => id !== s.userId));
                            }} />
                            <span>{s.name}</span>
                        </label>
                    ))}
                </div>

                <button onClick={handleSubmit} className="w-full p-3 bg-blue-600 text-white font-bold rounded-lg">고지하기</button>
                <button onClick={onClose} className="w-full p-2 mt-2 text-gray-500">취소</button>
            </div>
        </div>
    );
};


// --- Fund Management View ---
const FundManagementView: React.FC<{ students: (User & { account: Account | null })[] }> = ({ students }) => {
    const [funds, setFunds] = useState<Fund[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [messageModal, setMessageModal] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({isOpen: false, type: 'success', message: ''});
    
    // Settlement Modal
    const [settleModal, setSettleModal] = useState<{ isOpen: boolean, fund: Fund | null }>({ isOpen: false, fund: null });

    const fetchFunds = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFunds();
            setFunds(data);
        } catch (error) {
            console.error("Failed to fetch funds", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFunds();
    }, [fetchFunds]);

    const handleSettle = async (status: FundStatus) => {
        if (!settleModal.fund) return;
        try {
            const resultMsg = await api.settleFund(settleModal.fund.id, status);
            setMessageModal({ isOpen: true, type: 'success', message: resultMsg });
            setSettleModal({ isOpen: false, fund: null });
            fetchFunds();
        } catch (error: any) {
            setMessageModal({ isOpen: true, type: 'error', message: error.message });
        }
    };
    
    if (loading) return <div className="text-center p-8">펀드 정보를 불러오는 중...</div>;

    const getStatusBadge = (status: FundStatus) => {
        switch (status) {
            case FundStatus.RECRUITING: return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">모집중</span>;
            case FundStatus.ONGOING: return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">운용중(평가대기)</span>;
            case FundStatus.SUCCESS: return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">달성 완료</span>;
            case FundStatus.EXCEED: return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">초과 달성</span>;
            case FundStatus.FAIL: return <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">실패</span>;
            default: return null;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">펀드 관리</h2>
                <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-[#3F649A] text-white text-xs font-semibold rounded-lg shadow hover:bg-[#32507b]">
                    펀드 개설
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {funds.map(fund => (
                    <div key={fund.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border hover:border-blue-200 transition-colors">
                        <div className="p-4 flex justify-between items-start border-b">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{fund.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">제안: {fund.creatorName} 학생</p>
                            </div>
                            {getStatusBadge(fund.status)}
                        </div>
                        <div className="p-4 flex-grow space-y-2 text-sm">
                             <div className="flex justify-between">
                                <span className="text-gray-500">모집 마감</span>
                                <span className="font-medium">{new Date(fund.recruitmentDeadline).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">평가(종료)일</span>
                                <span className="font-medium text-blue-600">{new Date(fund.maturityDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">투자 단위</span>
                                <span className="font-medium">{fund.unitPrice.toLocaleString()}권</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">현재 모집액</span>
                                <span className="font-bold text-green-600">{(fund.totalInvestedAmount || 0).toLocaleString()}권</span>
                            </div>
                             <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                                <p>성공 시: {fund.baseReward.toLocaleString()}권 추가 지급</p>
                                <p>초과 달성 시: {(fund.baseReward + fund.incentiveReward).toLocaleString()}권 추가 지급</p>
                            </div>
                        </div>
                        
                        {/* Action Buttons for Ongoing Funds */}
                        {fund.status === FundStatus.ONGOING && (
                            <div className="p-3 bg-gray-50 border-t flex gap-2">
                                <button onClick={() => setSettleModal({ isOpen: true, fund })} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm">
                                    결과 입력 및 정산
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {funds.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">개설된 펀드가 없습니다.</div>}
            </div>

            {showAddModal && <AddFundModal students={students} onClose={() => setShowAddModal(false)} onComplete={fetchFunds} />}
            
            {settleModal.isOpen && settleModal.fund && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-2">펀드 결과 입력</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            '{settleModal.fund.name}' 펀드의 결과를 선택하세요.<br/>
                            선택 즉시 학생들에게 정산금이 지급됩니다.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => handleSettle(FundStatus.SUCCESS)} className="w-full p-3 bg-blue-100 text-blue-800 font-bold rounded-lg hover:bg-blue-200 text-left px-4">
                                <span className="block text-lg">🎯 달성 (성공)</span>
                                <span className="text-xs font-normal">원금 + 기본 보상 지급</span>
                            </button>
                            <button onClick={() => handleSettle(FundStatus.EXCEED)} className="w-full p-3 bg-purple-100 text-purple-800 font-bold rounded-lg hover:bg-purple-200 text-left px-4">
                                <span className="block text-lg">🚀 초과 달성</span>
                                <span className="text-xs font-normal">원금 + 기본 + 인센티브 지급</span>
                            </button>
                             <button onClick={() => handleSettle(FundStatus.FAIL)} className="w-full p-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 text-left px-4">
                                <span className="block text-lg">😢 실패</span>
                                <span className="text-xs font-normal">원금 - 기본 보상 차감 지급</span>
                            </button>
                        </div>
                        <button onClick={() => setSettleModal({ isOpen: false, fund: null })} className="mt-4 w-full p-2 text-gray-500 hover:text-gray-800">취소</button>
                    </div>
                </div>
            )}

            <MessageModal 
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                message={messageModal.message}
                onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
            />
        </div>
    );
};

const AddFundModal: React.FC<{ students: (User & { account: Account | null })[], onClose: () => void, onComplete: () => void }> = ({ students, onClose, onComplete }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', creatorId: '', unitPrice: 1000, targetAmount: 100000,
        baseReward: 100, incentiveReward: 200, recruitmentDeadline: '', maturityDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['unitPrice', 'targetAmount', 'baseReward', 'incentiveReward'].includes(name) ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async () => {
        if (Object.values(formData).some(v => v === '' || v === 0)) {
            setError('모든 항목을 입력해주세요.');
            return;
        }
        if (formData.baseReward > formData.unitPrice) {
            setError('기본 보상금액은 투자 단위 금액보다 클 수 없습니다. (원금 손실 방지)');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            await api.createFund(formData);
            onComplete();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">새 펀드 개설</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                
                <div className="space-y-3 text-sm">
                    <div>
                        <label className="block font-medium text-gray-700">펀드명</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded mt-1" placeholder="예: 6학년 1반 환경미화 펀드"/>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700">목표 및 상세 내용</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded mt-1 h-20" placeholder="목표와 계획을 자세히 적어주세요."/>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700">제안 학생 (성공 시 보너스 지급 대상)</label>
                        <select name="creatorId" value={formData.creatorId} onChange={handleChange} className="w-full p-2 border rounded mt-1 bg-white">
                            <option value="">학생 선택</option>
                            {students.map(s => <option key={s.userId} value={s.userId}>{s.name} ({s.number}번)</option>)}
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block font-medium text-gray-700">투자 단위 금액 (1좌)</label>
                            <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
                        </div>
                         <div>
                            <label className="block font-medium text-gray-700">목표 모금액 (참고용)</label>
                            <input type="number" name="targetAmount" value={formData.targetAmount} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block font-medium text-gray-700 text-blue-600">성공 시 기본 보상</label>
                            <input type="number" name="baseReward" value={formData.baseReward} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
                        </div>
                         <div>
                            <label className="block font-medium text-gray-700 text-purple-600">초과 달성 시 인센티브</label>
                            <input type="number" name="incentiveReward" value={formData.incentiveReward} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block font-medium text-gray-700">모집 마감일</label>
                            <input type="date" name="recruitmentDeadline" value={formData.recruitmentDeadline} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
                        </div>
                         <div>
                            <label className="block font-medium text-gray-700">평가(종료)일</label>
                            <input type="date" name="maturityDate" value={formData.maturityDate} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                
                <button onClick={handleSubmit} disabled={loading} className="mt-6 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg disabled:bg-gray-300">
                    {loading ? '개설 중...' : '펀드 개설하기'}
                </button>
            </div>
        </div>
    );
};

export default TeacherDashboard;
