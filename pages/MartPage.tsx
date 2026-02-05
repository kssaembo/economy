
import { api } from '../services/api';
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { User, Role, Account, Transaction } from '../types';
import { LogoutIcon, StudentIcon, CheckIcon, ErrorIcon, BackIcon, TransferIcon, NewMartIcon, NewHistoryIcon } from '../components/icons';

type MartView = 'pos' | 'transfer' | 'history';

// Message Modal Component
const MessageModal: React.FC<{
    isOpen: boolean;
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
}> = ({ isOpen, type, message, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm flex flex-col items-center text-center">
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

const MartPage: React.FC<{ onBackToMenu?: () => void }> = ({ onBackToMenu }) => {
    const { currentUser, logout } = useContext(AuthContext);
    const [view, setView] = useState<MartView>('pos');
    const [martAccount, setMartAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);

    const handleLogout = onBackToMenu || logout;

    const fetchMartAccount = useCallback(async (silent = false) => {
        if (currentUser) {
            if (!silent) setLoading(true);
            try {
                const acc = await api.getStudentAccountByUserId(currentUser.userId);
                setMartAccount(acc);
            } catch (error) {
                console.error("Failed to fetch mart account", error);
            } finally {
                if (!silent) setLoading(false);
            }
        }
    }, [currentUser]);

    useEffect(() => {
        fetchMartAccount();
    }, [fetchMartAccount]);

    const renderContent = () => {
        if (loading || !martAccount) {
            return <div className="text-center p-8">마트 정보를 불러오는 중...</div>;
        }

        switch (view) {
            case 'pos':
                return <PosView currentUser={currentUser} />;
            case 'transfer':
                // Pass silent refresh to prevent unmounting TransferView (and hiding modal)
                return <TransferView martAccount={martAccount} refreshAccount={() => fetchMartAccount(true)} />;
            case 'history':
                return <HistoryView martAccount={martAccount} />;
            default:
                return <PosView currentUser={currentUser} />;
        }
    };

    return (
        <div className="flex h-full bg-gray-100">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-56 bg-white/80 backdrop-blur-sm border-r p-4">
                <div className="px-2">
                    <h1 className="text-xl font-bold text-gray-800">마트 모드</h1>
                    <p className="text-sm text-gray-500">{currentUser?.name}</p>
                </div>
                <nav className="mt-8 flex flex-col space-y-2">
                    <DesktopNavButton label="마트 계산대" Icon={NewMartIcon} active={view === 'pos'} onClick={() => setView('pos')} />
                    <DesktopNavButton label="송금" Icon={TransferIcon} active={view === 'transfer'} onClick={() => setView('transfer')} />
                    <DesktopNavButton label="세부내역" Icon={NewHistoryIcon} active={view === 'history'} onClick={() => setView('history')} />
                </nav>
                <div className="mt-auto">
                    <button onClick={handleLogout} className="w-full flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors">
                        <LogoutIcon className="w-5 h-5 mr-3" />
                        {onBackToMenu ? '메뉴로' : '로그아웃'}
                    </button>
                </div>
            </aside>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full">
                {/* Header for Mobile */}
                <header className="md:hidden p-4 flex justify-between items-center bg-white border-b sticky top-0 z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">마트 모드</h1>
                        <p className="text-sm text-gray-500">{currentUser?.name}</p>
                    </div>
                    <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-100">
                        <LogoutIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto bg-[#D1D3D8]">
                    {renderContent()}
                </main>

                {/* Bottom Nav for Mobile */}
                <nav className="md:hidden grid grid-cols-3 bg-white p-1 border-t sticky bottom-0 z-10">
                    <NavButton label="마트 계산대" Icon={NewMartIcon} active={view === 'pos'} onClick={() => setView('pos')} />
                    <NavButton label="송금" Icon={TransferIcon} active={view === 'transfer'} onClick={() => setView('transfer')} />
                    <NavButton label="세부내역" Icon={NewHistoryIcon} active={view === 'history'} onClick={() => setView('history')} />
                </nav>
            </div>
        </div>
    );
};

const PosView: React.FC<{currentUser: User | null}> = ({currentUser}) => {
    type PosSubView = 'student-select' | 'payment' | 'result';

    const unit = currentUser?.currencyUnit || '권';
    const [students, setStudents] = useState<(User & { account: Account | null })[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<(User & { account: Account | null }) | null>(null);
    const [amount, setAmount] = useState('');
    const [subView, setSubView] = useState<PosSubView>('student-select');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const users = await api.getUsersByRole(Role.STUDENT, currentUser?.userId || '');
            const usersWithAccounts = await Promise.all(
                users.map(async u => ({ ...u, account: await api.getStudentAccountByUserId(u.userId) }))
            );
            usersWithAccounts.sort((a,b) => (a.number || 0) - (b.number || 0));
            setStudents(usersWithAccounts);
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.userId]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleStudentSelect = (student: User & { account: Account | null }) => {
        setSelectedStudent(student);
        setSubView('payment');
    };

    const handlePayment = async () => {
        if (!selectedStudent?.account || !amount || parseInt(amount) <= 0) {
            setResult({ type: 'error', text: '결제 정보가 올바르지 않습니다.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            // 학생 계좌번호(accountId)를 문자열로 명확히 전달
            const studentAccId = String(selectedStudent.account.accountId);
            const paymentAmount = parseInt(amount);
            
            const message = await api.martTransfer(studentAccId, paymentAmount, 'FROM_STUDENT');
            setResult({ type: 'success', text: message });
            fetchStudents();
        } catch (err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
            setSubView('result');
        }
    };

    const reset = () => {
        setSelectedStudent(null);
        setAmount('');
        setSubView('student-select');
        setResult(null);
    };

    if (loading && subView === 'student-select') {
        return <div className="text-center p-8">학생 목록을 불러오는 중...</div>;
    }

    if (subView === 'result') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                {result?.type === 'success' ? <CheckIcon className="w-20 h-20 text-green-500 mb-6" /> : <ErrorIcon className="w-20 h-20 text-red-500 mb-6" />}
                <h2 className="text-3xl font-bold mb-4">{result?.type === 'success' ? '결제 완료' : '결제 실패'}</h2>
                <p className="text-lg text-gray-600 mb-8">{result?.text}</p>
                <button onClick={reset} className="w-full max-w-xs p-4 bg-[#2B548F] text-white font-bold rounded-xl text-lg">
                    확인
                </button>
            </div>
        );
    }

    if (subView === 'payment' && selectedStudent) {
        return <PaymentView student={selectedStudent} amount={amount} setAmount={setAmount} onPay={handlePayment} onBack={reset} loading={loading} unit={unit} />;
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">학생 선택</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {students.map(s => (
                    <button 
                        key={s.userId} 
                        onClick={() => handleStudentSelect(s)}
                        className="p-3 bg-white rounded-xl shadow-md flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:bg-indigo-50 transition-all"
                    >
                        <StudentIcon className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="font-bold text-gray-800 text-sm">{s.name}</span>
                        <span className="font-mono text-gray-500 text-xs mt-1">
                            {(s.account?.balance ?? 0).toLocaleString()}{unit}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const PaymentView: React.FC<{
    student: User & { account: Account | null };
    amount: string;
    setAmount: (val: string) => void;
    onPay: () => void;
    onBack: () => void;
    loading: boolean;
    unit: string;
}> = ({ student, amount, setAmount, onPay, onBack, loading, unit }) => {

    const handleKeypadClick = (key: string) => {
        if (key === 'del') {
            setAmount(amount.slice(0, -1));
        } else if (amount.length < 9) {
            setAmount(amount + key);
        }
    };
    
    const KeypadButton = ({ value }: { value: string }) => (
        <button onClick={() => handleKeypadClick(value)} className="p-4 text-2xl md:text-3xl font-bold bg-white rounded-xl shadow-sm hover:bg-gray-100 active:bg-gray-200 transition-colors">
            {value}
        </button>
    );

    return (
        <div className="flex flex-col h-full p-2 sm:p-4">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900">
                    <BackIcon className="w-6 h-6 mr-1" />
                    학생 선택
                </button>
                <div className="text-right">
                    <p className="font-bold text-lg">{student.name}</p>
                    <p className="text-sm text-gray-500">잔액: {(student.account?.balance ?? 0).toLocaleString()}{unit}</p>
                </div>
            </div>

            <div className="flex-grow flex flex-col md:flex-row md:gap-8 justify-between">
                <div className="flex-grow flex items-center justify-center text-center p-4">
                     <p className="text-5xl font-mono font-bold tracking-tight text-gray-800 break-all sm:text-6xl">
                        {parseInt(amount || '0').toLocaleString()}
                        <span className="text-3xl ml-2 font-sans font-medium">{unit}</span>
                     </p>
                </div>
                
                <div className="w-full md:w-72 flex flex-col">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <KeypadButton value="1" />
                        <KeypadButton value="2" />
                        <KeypadButton value="3" />
                        <KeypadButton value="4" />
                        <KeypadButton value="5" />
                        <KeypadButton value="6" />
                        <KeypadButton value="7" />
                        <KeypadButton value="8" />
                        <KeypadButton value="9" />
                        <button onClick={() => setAmount('')} className="p-4 text-xl font-bold bg-white rounded-xl shadow-sm hover:bg-gray-100">C</button>
                        <KeypadButton value="0" />
                        <button onClick={() => handleKeypadClick('del')} className="p-4 text-xl font-bold bg-white rounded-xl shadow-sm hover:bg-gray-100">⌫</button>
                    </div>
                    
                     <button 
                        onClick={onPay} 
                        disabled={loading || !amount || parseInt(amount) <= 0}
                        className="w-full mt-auto p-4 bg-green-500 text-white font-bold text-xl rounded-xl shadow-lg disabled:bg-gray-400"
                    >
                        {loading ? '결제 중...' : '결제하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TransferView: React.FC<{ martAccount: Account, refreshAccount: () => void }> = ({ martAccount, refreshAccount }) => {
    const { currentUser } = useContext(AuthContext);
    const unit = currentUser?.currencyUnit || '권';
    const [target, setTarget] = useState<'student' | 'teacher'>('student');
    const [accountId, setAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [messageModal, setMessageModal] = useState<{ isOpen: boolean, type: 'success' | 'error', text: string }>({ 
        isOpen: false, type: 'success', text: '' 
    });

    // 은행 이름 결정 로직 수정: 교사 별칭을 우선 사용하고 '은행' 접두사를 붙임
    const bankName = currentUser?.teacherAlias 
        ? (currentUser.teacherAlias.endsWith('은행') ? currentUser.teacherAlias : `${currentUser.teacherAlias}은행`)
        : martAccount.accountId.split(' ').slice(0, -1).join(' ');

    const handleTransfer = async () => {
        if (!amount || parseInt(amount) <= 0) {
            setMessageModal({ isOpen: true, type: 'error', text: '금액을 올바르게 입력해주세요.' });
            return;
        }

        setLoading(true);

        try {
            let message = '';
            if (target === 'student') {
                // UI에 표시된 bankName과 동일한 접두사를 사용하여 계좌번호 생성
                const fullAccountId = `${bankName} ${accountId}`;
                if (!accountId) throw new Error('계좌번호를 입력해주세요.');
                message = await api.martTransfer(fullAccountId, parseInt(amount), 'TO_STUDENT');
            } else {
                if (!currentUser) throw new Error('로그인 정보가 없습니다.');
                const teacherAcc = await api.getTeacherAccount();
                if (!teacherAcc) throw new Error('교사(국고) 계좌를 찾을 수 없습니다.');
                message = await api.transfer(currentUser.userId, teacherAcc.accountId, parseInt(amount), '마트 수익금 송금');
            }
            
            setMessageModal({ isOpen: true, type: 'success', text: message });
            refreshAccount();
            setAccountId('');
            setAmount('');
        } catch (err: any) {
            setMessageModal({ isOpen: true, type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold mb-4">송금하기</h2>
                <div className="mb-4">
                    <p className="text-sm text-gray-500">마트 계좌 잔액</p>
                    <p className="text-2xl font-bold">{martAccount.balance.toLocaleString()}{unit}</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                    <button 
                        onClick={() => { setTarget('student'); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${target === 'student' ? 'bg-white shadow text-[#2B548F]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        학생에게 송금
                    </button>
                    <button 
                        onClick={() => { setTarget('teacher'); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${target === 'teacher' ? 'bg-white shadow text-[#2B548F]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        담임(국고)에게 송금
                    </button>
                </div>

                <div className="space-y-4">
                    {target === 'student' ? (
                        <div>
                            <label className="font-semibold text-gray-700">받는 학생 계좌번호</label>
                            <div className="flex items-center mt-1">
                                <span className="p-3 bg-gray-100 border border-r-0 rounded-l-lg text-gray-600 w-2/3 text-center truncate">{bankName}</span>
                                <input type="text" value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="000000" className="w-1/3 p-3 border rounded-r-lg" />
                            </div>
                        </div>
                    ) : (
                         <div>
                            <label className="font-semibold text-gray-700">받는 분</label>
                            <div className="mt-1 p-3 bg-gray-50 border rounded-lg text-gray-800 font-bold flex items-center">
                                <span className="bg-[#2B548F] text-white text-xs px-2 py-1 rounded mr-2">국고</span>
                                {currentUser?.teacherAlias || '담임선생님'}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="font-semibold text-gray-700">보낼 금액</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full p-3 border rounded-lg mt-1" />
                    </div>
                </div>
                
                <button onClick={handleTransfer} disabled={loading} className="mt-6 w-full p-3 bg-[#2B548F] text-white font-bold rounded-lg disabled:bg-gray-400">
                    {loading ? '확인...' : '확인'}
                </button>
            </div>
            
            <MessageModal 
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                message={messageModal.text}
                onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

const HistoryView: React.FC<{ martAccount: Account }> = ({ martAccount }) => {
    const { currentUser } = useContext(AuthContext);
    const unit = currentUser?.currencyUnit || '권';
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const trans = await api.getTransactionsByAccountId(martAccount.accountId);
                setTransactions(trans);
            } catch (error) {
                console.error("Failed to fetch mart transactions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [martAccount.accountId]);

    if (loading) return <div className="text-center p-8">거래 내역을 불러오는 중...</div>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">세부 내역</h2>
            {transactions.length > 0 ? (
                <ul className="space-y-2">
                    {transactions.map(t => (
                        <li key={t.transactionId} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{t.description.replace(' 학생으로부터', '')}</p>
                                <p className="text-sm text-gray-500">{new Date(t.date).toLocaleString()}</p>
                            </div>
                            <p className={`font-bold ${t.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}{unit}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-gray-500 py-8 bg-white rounded-lg shadow-sm">
                    <p>거래 내역이 없습니다.</p>
                </div>
            )}
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

export default MartPage;
