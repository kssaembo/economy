import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { User, Role, Account, Transaction } from '../types';
import { LogoutIcon, StudentIcon, CheckIcon, ErrorIcon, BackIcon, TransferIcon } from '../components/icons';

type MartView = 'pos' | 'transfer' | 'history';

const MartPage: React.FC = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const [view, setView] = useState<MartView>('pos');
    const [martAccount, setMartAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMartAccount = useCallback(async () => {
        if (currentUser) {
            setLoading(true);
            try {
                const acc = await api.getStudentAccountByUserId(currentUser.userId);
                setMartAccount(acc);
            } catch (error) {
                console.error("Failed to fetch mart account", error);
            } finally {
                setLoading(false);
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
                return <TransferView martAccount={martAccount} refreshAccount={fetchMartAccount} />;
            case 'history':
                return <HistoryView martAccount={martAccount} />;
            default:
                return <PosView currentUser={currentUser} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <header className="p-4 flex justify-between items-center bg-white border-b sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">마트 모드</h1>
                    <p className="text-sm text-gray-500">{currentUser?.name}</p>
                </div>
                <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100">
                    <LogoutIcon className="w-6 h-6 text-gray-600" />
                </button>
            </header>
            
            <nav className="flex justify-around bg-white p-2 border-b">
                <TabButton label="마트 계산대" active={view === 'pos'} onClick={() => setView('pos')} />
                <TabButton label="송금" active={view === 'transfer'} onClick={() => setView('transfer')} />
                <TabButton label="세부내역" active={view === 'history'} onClick={() => setView('history')} />
            </nav>

            <main className="flex-grow overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};


const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold rounded-lg transition-colors text-sm ${active ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 hover:bg-indigo-100'}`}
    >
        {label}
    </button>
);


// --- POS View ---
const PosView: React.FC<{currentUser: User | null}> = ({currentUser}) => {
    type PosSubView = 'student-select' | 'payment' | 'result';

    const [students, setStudents] = useState<(User & { account: Account | null })[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<(User & { account: Account | null }) | null>(null);
    const [amount, setAmount] = useState('');
    const [subView, setSubView] = useState<PosSubView>('student-select');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const users = await api.getUsersByRole(Role.STUDENT);
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
    }, []);

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
            const message = await api.martTransfer(selectedStudent.account.accountId, parseInt(amount), 'FROM_STUDENT');
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
                <button onClick={reset} className="w-full max-w-xs p-4 bg-indigo-600 text-white font-bold rounded-xl text-lg">
                    확인
                </button>
            </div>
        );
    }

    if (subView === 'payment' && selectedStudent) {
        return <PaymentView student={selectedStudent} amount={amount} setAmount={setAmount} onPay={handlePayment} onBack={reset} loading={loading} />;
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">학생 선택</h2>
            <div className="grid grid-cols-3 gap-3">
                {students.map(s => (
                    <button 
                        key={s.userId} 
                        onClick={() => handleStudentSelect(s)}
                        className="p-3 bg-white rounded-xl shadow-md flex flex-col items-center justify-center aspect-square hover:shadow-lg hover:bg-indigo-50 transition-all"
                    >
                        <StudentIcon className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="font-bold text-gray-800 text-sm">{s.name}</span>
                        <span className="font-mono text-gray-500 text-xs mt-1">
                            {(s.account?.balance ?? 0).toLocaleString()}권
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
}> = ({ student, amount, setAmount, onPay, onBack, loading }) => {

    const handleKeypadClick = (key: string) => {
        if (key === 'del') {
            setAmount(amount.slice(0, -1));
        } else if (amount.length < 9) {
            setAmount(amount + key);
        }
    };
    
    const KeypadButton = ({ value }: { value: string }) => (
        <button onClick={() => handleKeypadClick(value)} className="p-4 text-3xl font-bold bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400">
            {value}
        </button>
    );

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900">
                    <BackIcon className="w-6 h-6 mr-1" />
                    학생 선택
                </button>
                <div className="text-right">
                    <p className="font-bold text-lg">{student.name}</p>
                    <p className="text-sm text-gray-500">잔액: {(student.account?.balance ?? 0).toLocaleString()}권</p>
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-between">
                <div className="text-center p-4">
                     <p className="text-5xl font-mono font-bold tracking-tight text-gray-800 break-all">
                        {parseInt(amount || '0').toLocaleString()}
                        <span className="text-3xl ml-2 font-sans font-medium">권</span>
                     </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                    <KeypadButton value="1" />
                    <KeypadButton value="2" />
                    <KeypadButton value="3" />
                    <KeypadButton value="4" />
                    <KeypadButton value="5" />
                    <KeypadButton value="6" />
                    <KeypadButton value="7" />
                    <KeypadButton value="8" />
                    <KeypadButton value="9" />
                    <button onClick={() => setAmount('')} className="p-4 text-xl font-bold bg-gray-200 rounded-lg">C</button>
                    <KeypadButton value="0" />
                    <button onClick={() => handleKeypadClick('del')} className="p-4 text-xl font-bold bg-gray-200 rounded-lg">⌫</button>
                </div>
                
                 <button 
                    onClick={onPay} 
                    disabled={loading || !amount || parseInt(amount) <= 0}
                    className="w-full mt-4 p-4 bg-green-500 text-white font-bold text-xl rounded-xl shadow-lg disabled:bg-gray-400"
                >
                    {loading ? '결제 중...' : '결제하기'}
                </button>
            </div>
        </div>
    );
};


// --- Transfer View ---
const TransferView: React.FC<{ martAccount: Account, refreshAccount: () => void }> = ({ martAccount, refreshAccount }) => {
    const [accountId, setAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleTransfer = async () => {
        const fullAccountId = `권쌤은행 ${accountId}`;
        if (!accountId || !amount || parseInt(amount) <= 0) {
            setResult({ type: 'error', text: '계좌번호와 금액을 올바르게 입력해주세요.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const message = await api.martTransfer(fullAccountId, parseInt(amount), 'TO_STUDENT');
            setResult({ type: 'success', text: message });
            refreshAccount(); // Refresh mart balance
            setAccountId('');
            setAmount('');
        } catch (err: any) {
            setResult({ type: 'error', text: err.message });
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
                    <p className="text-2xl font-bold">{martAccount.balance.toLocaleString()}권</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="font-semibold text-gray-700">받는 학생 계좌번호</label>
                        <div className="flex items-center mt-1">
                            <span className="p-3 bg-gray-100 border border-r-0 rounded-l-lg text-gray-600 w-2/3 text-center">권쌤은행</span>
                            <input type="text" value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="000-000" className="w-1/3 p-3 border rounded-r-lg" />
                        </div>
                    </div>
                    <div>
                        <label className="font-semibold text-gray-700">보낼 금액</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full p-3 border rounded-lg mt-1" />
                    </div>
                </div>
                {result && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <ErrorIcon className="w-5 h-5 mr-2" />}
                        <p className="text-sm">{result.text}</p>
                    </div>
                )}
                <button onClick={handleTransfer} disabled={loading} className="mt-6 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg disabled:bg-gray-400">
                    {loading ? '송금 중...' : '확인'}
                </button>
            </div>
        </div>
    );
};


// --- History View ---
const HistoryView: React.FC<{ martAccount: Account }> = ({ martAccount }) => {
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
                                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}권
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

export default MartPage;