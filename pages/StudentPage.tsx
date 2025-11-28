
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Account, Transaction, StockProduct, StudentStock, SavingsProduct, StudentSaving, User, Job } from '../types';
import { HomeIcon, TransferIcon, NewStockIcon, NewPiggyBankIcon, BackIcon, XIcon, CheckIcon, ErrorIcon, PlusIcon, MinusIcon, NewJobIcon, NewTaxIcon } from '../components/icons';

type View = 'home' | 'transfer' | 'stocks' | 'savings';
type NotificationType = { type: 'success' | 'error', text: string };

interface StudentPageProps {
    initialView?: string;
}

// --- Custom Modals for Student Page ---
const ConfirmModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
}> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "확인" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
                <p className="text-gray-600 mb-6 whitespace-pre-wrap">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">취소</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-[#2B548F] text-white rounded-lg font-medium hover:bg-[#234576]">
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

// --- Main Student Page Component ---
const StudentPage: React.FC<StudentPageProps> = ({ initialView }) => {
    const { currentUser } = useContext(AuthContext);
    
    // initialView가 유효한 View 타입이면 그것을 사용하고, 아니면 'transfer'(송금)를 기본값으로 사용
    // (이전 로직 유지: 탭 순서만 시각적으로 변경하고 기본 진입 화면 로직은 유지합니다)
    const validViews: View[] = ['home', 'transfer', 'stocks', 'savings'];
    const startView: View = (initialView && validViews.includes(initialView as View)) 
        ? (initialView as View) 
        : 'transfer'; 

    const [view, setView] = useState<View>(startView);
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<NotificationType | null>(null);

    // initialView prop이 변경되면 view 상태도 업데이트 (QR 로그인 시 화면 전환 보장)
    useEffect(() => {
        if (initialView && validViews.includes(initialView as View)) {
            setView(initialView as View);
        }
    }, [initialView]);

    const showNotification = useCallback((type: 'success' | 'error', text: string) => {
        setNotification({ type, text });
        setTimeout(() => {
            setNotification(null);
        }, 2000);
    }, []);

    const fetchAccount = useCallback(async () => {
        if (currentUser) {
            setLoading(true);
            try {
                const acc = await api.getStudentAccountByUserId(currentUser.userId);
                setAccount(acc);
            } catch (error) {
                console.error("Failed to fetch student account", error);
            } finally {
                setLoading(false);
            }
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAccount();
    }, [fetchAccount]);

    const renderView = () => {
        if (loading || !currentUser || !account) return <div className="text-center p-8">로딩 중...</div>;
        switch (view) {
            case 'home':
                return <HomeView account={account} currentUser={currentUser} refreshAccount={fetchAccount} />;
            case 'transfer':
                return <TransferView currentUser={currentUser} account={account} refreshAccount={fetchAccount} showNotification={showNotification} />;
            case 'stocks':
                return <StocksView currentUser={currentUser} refreshAccount={fetchAccount} />;
            case 'savings':
                return <SavingsView currentUser={currentUser} refreshAccount={fetchAccount} />;
            default:
                return <TransferView currentUser={currentUser} account={account} refreshAccount={fetchAccount} showNotification={showNotification} />;
        }
    };
    
    return (
        <div className="flex h-full bg-gray-50">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-56 bg-white/80 backdrop-blur-sm border-r p-4">
                <div className="px-2">
                    <h1 className="text-2xl font-bold text-gray-800">{currentUser?.name}님</h1>
                </div>
                <nav className="mt-8 flex flex-col space-y-2">
                    {/* 탭 순서 복구: 홈 -> 송금 -> 주식 -> 적금 */}
                    <DesktopNavButton label="홈" Icon={HomeIcon} active={view === 'home'} onClick={() => setView('home')} />
                    <DesktopNavButton label="송금" Icon={TransferIcon} active={view === 'transfer'} onClick={() => setView('transfer')} />
                    <DesktopNavButton label="주식" Icon={NewStockIcon} active={view === 'stocks'} onClick={() => setView('stocks')} />
                    <DesktopNavButton label="적금" Icon={NewPiggyBankIcon} active={view === 'savings'} onClick={() => setView('savings')} />
                </nav>
            </aside>
    
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full">
                {/* Header for Mobile */}
                <header className="md:hidden p-4 flex justify-between items-center bg-white border-b sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{currentUser?.name}님</h1>
                    </div>
                </header>
    
                <main className="flex-grow overflow-y-auto p-4 bg-[#D1D3D8]">
                    {renderView()}
                </main>
    
                {/* Bottom Nav for Mobile */}
                <nav className="md:hidden grid grid-cols-4 bg-white p-1 border-t sticky bottom-0 z-10">
                    {/* 탭 순서 복구: 홈 -> 송금 -> 주식 -> 적금 */}
                    <NavButton label="홈" Icon={HomeIcon} active={view === 'home'} onClick={() => setView('home')} />
                    <NavButton label="송금" Icon={TransferIcon} active={view === 'transfer'} onClick={() => setView('transfer')} />
                    <NavButton label="주식" Icon={NewStockIcon} active={view === 'stocks'} onClick={() => setView('stocks')} />
                    <NavButton label="적금" Icon={NewPiggyBankIcon} active={view === 'savings'} onClick={() => setView('savings')} />
                </nav>
            </div>

            {/* Global Notification Modal */}
            {notification && notification.type === 'success' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm text-center">
                        <CheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">송금 완료</h3>
                        <p className="text-gray-700">{notification.text}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Common Components ---
const NavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void }> = ({ label, Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors ${active ? 'text-indigo-600' : 'text-gray-500 hover:bg-indigo-50'}`}>
        <Icon className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">{label}</span>
    </button>
);

const DesktopNavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void }> = ({ label, Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center w-full p-3 rounded-lg transition-colors text-sm font-semibold ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
    </button>
);


// --- Home View ---
const HomeView: React.FC<{ account: Account; currentUser: User; refreshAccount: () => void }> = ({ account, currentUser, refreshAccount }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [myJobs, setMyJobs] = useState<Job[]>([]);
    const [unpaidTaxes, setUnpaidTaxes] = useState<{ recipientId: string, taxId: string, name: string, amount: number, dueDate: string }[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Tax Payment Modal States
    const [taxToPay, setTaxToPay] = useState<{id: string, name: string} | null>(null);
    const [messageModal, setMessageModal] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({isOpen: false, type: 'success', message: ''});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch transactions
            const trans = await api.getTransactionsByAccountId(account.accountId);
            setTransactions(trans.slice(0, 10));

            // Fetch jobs
            if (currentUser) {
                const allJobs = await api.getJobs();
                const assignedJobs = allJobs.filter(job =>
                    job.assigned_students.some(student => student.userId === currentUser.userId)
                );
                setMyJobs(assignedJobs);
                
                // Fetch unpaid taxes
                const taxes = await api.getMyUnpaidTaxes(currentUser.userId);
                setUnpaidTaxes(taxes);
            }
        } catch (error) {
            console.error("Failed to fetch home view data", error);
        } finally {
            setLoading(false);
        }
    }, [account.accountId, currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePayClick = (taxId: string, taxName: string) => {
        setTaxToPay({ id: taxId, name: taxName });
    };

    const executePayTax = async () => {
        if (!taxToPay) return;
        setTaxToPay(null);
        try {
            await api.payTax(currentUser.userId, taxToPay.id);
            setMessageModal({isOpen: true, type: 'success', message: "세금을 납부했습니다."});
            fetchData();
            refreshAccount();
        } catch (err: any) {
            setMessageModal({isOpen: true, type: 'error', message: `오류: ${err.message}`});
        }
    };

    if (loading) return <div className="text-center p-8">데이터를 불러오는 중...</div>;

    return (
        <div>
            <div className="bg-[#2B548F] text-white p-6 rounded-2xl shadow-lg mb-6">
                <p className="text-sm font-mono text-blue-200 opacity-80">{account.accountId}</p>
                <p className="text-4xl font-bold mt-2 tracking-tight">
                    {account.balance.toLocaleString()}
                    <span className="text-2xl font-medium ml-1">권</span>
                </p>
            </div>

            {myJobs.length > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-md mb-6">
                    <div className="flex items-center mb-3">
                        <NewJobIcon className="w-6 h-6 mr-2"/>
                        <h2 className="text-lg font-bold text-gray-800">나의 직업</h2>
                    </div>
                    <div className="space-y-2">
                        {myJobs.map(job => (
                            <div key={job.id} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-semibold text-gray-700">{job.jobName}</p>
                                {job.description && <p className="text-sm text-gray-500 mt-1">{job.description}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Unpaid Tax Alerts */}
            {unpaidTaxes.length > 0 && (
                <div className="bg-red-50 p-4 rounded-2xl shadow-md mb-6 border border-red-100">
                    <div className="flex items-center mb-3">
                        <NewTaxIcon className="w-6 h-6 mr-2"/>
                        <h2 className="text-lg font-bold text-red-800">미납 세금 고지서 ({unpaidTaxes.length}건)</h2>
                    </div>
                    <div className="space-y-3">
                        {unpaidTaxes.map(tax => (
                            <div key={tax.recipientId} className="p-3 bg-white rounded-lg border border-red-200 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-bold text-gray-800">{tax.name}</p>
                                    <p className="text-xs text-red-500 font-semibold">{new Date(tax.dueDate).toLocaleDateString()} 마감</p>
                                </div>
                                <div className="text-right">
                                     <p className="font-bold mb-1">{tax.amount.toLocaleString()}권</p>
                                     <button 
                                        onClick={() => handlePayClick(tax.taxId, tax.name)}
                                        className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-md font-bold hover:bg-red-700 shadow-sm"
                                     >
                                         납부하기
                                     </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h2 className="text-xl font-bold text-gray-800 mb-4">최근 거래 내역</h2>
            {transactions.length > 0 ? (
                <ul className="space-y-2">
                    {transactions.map(t => (
                        <li key={t.transactionId} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-700">{t.description}</p>
                                <p className="text-sm text-gray-500">{new Date(t.date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</p>
                            </div>
                            <p className={`font-bold text-lg ${t.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                                <span className="font-medium text-base ml-1">권</span>
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-gray-500 py-8 bg-white rounded-lg shadow-sm">
                    <p>거래 내역이 없습니다.</p>
                </div>
            )}
            
            <ConfirmModal 
                isOpen={!!taxToPay}
                title="세금 납부"
                message={`'${taxToPay?.name}' 세금을 납부하시겠습니까?`}
                onConfirm={executePayTax}
                onCancel={() => setTaxToPay(null)}
                confirmText="납부"
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


// --- Transfer View ---
const TransferView: React.FC<{
    currentUser: User;
    account: Account;
    refreshAccount: () => void;
    showNotification: (type: 'success' | 'error', text: string) => void;
}> = ({ currentUser, account, refreshAccount, showNotification }) => {
    type TransferTarget = 'mart' | 'teacher' | 'friend';
    type RecipientDetails = { user: User; account: Account };

    const [selectedTab, setSelectedTab] = useState<TransferTarget>('mart');
    const [amount, setAmount] = useState('');
    const [recipientAccountIdInput, setRecipientAccountIdInput] = useState('');
    const [memo, setMemo] = useState('');
    
    const [recipientDetails, setRecipientDetails] = useState<RecipientDetails | null>(null);
    const [isCheckingAccount, setIsCheckingAccount] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const resetForm = useCallback(() => {
        setAmount('');
        setRecipientAccountIdInput('');
        setMemo('');
        setRecipientDetails(null);
        setError('');
    }, []);

    useEffect(() => {
        resetForm();
    }, [selectedTab, resetForm]);

    const handleAccountBlur = async () => {
        if (!recipientAccountIdInput) {
            setRecipientDetails(null);
            setError('');
            return;
        }

        setIsCheckingAccount(true);
        setError('');
        setRecipientDetails(null);
        try {
            const fullAccountId = `권쌤은행 ${recipientAccountIdInput}`;
            const details = await api.getRecipientDetailsByAccountId(fullAccountId);
            if (details) {
                if (details.account.userId === currentUser.userId) {
                    setError('자기 자신에게는 송금할 수 없습니다.');
                } else {
                    setRecipientDetails(details);
                }
            } else {
                setError('존재하지 않는 계좌번호입니다.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCheckingAccount(false);
        }
    };
    
    const handleSubmit = async () => {
        setLoading(true); // Disable button immediately
        setError('');

        try {
            const transferAmount = parseInt(amount);

            if (isNaN(transferAmount) || transferAmount <= 0) {
                throw new Error('송금할 금액을 올바르게 입력해주세요.');
            }
            if (transferAmount > account.balance) {
                throw new Error('잔액이 부족합니다.');
            }

            let targetName = '';
            let recipientId = '';

            if (selectedTab === 'mart' || selectedTab === 'teacher') {
                targetName = selectedTab === 'mart' ? '마트' : '권쌤';
            } else if (selectedTab === 'friend') {
                if (!recipientDetails) {
                    throw new Error('받는 분 계좌를 먼저 확인해주세요.');
                }
                targetName = recipientDetails.user.name;
                recipientId = recipientDetails.account.id; // Use the UUID PK
            }

            let responseMessage;
            if (selectedTab === 'mart' || selectedTab === 'teacher') {
                responseMessage = await api.studentWithdraw(currentUser.userId, transferAmount, selectedTab);
            } else {
                responseMessage = await api.transfer(currentUser.userId, recipientId, transferAmount, memo);
            }
            
            const successMessage = responseMessage || `${transferAmount.toLocaleString()}권 송금이 완료되었습니다.`;
            
            resetForm();
            await refreshAccount();
            showNotification('success', successMessage);

        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
            setError(errorMessage);
        } finally {
            setLoading(false); // Always re-enable button
        }
    };


    const targetDisplayName = useMemo(() => {
        if (selectedTab === 'mart') return '마트';
        if (selectedTab === 'teacher') return '권쌤';
        return '친구';
    }, [selectedTab]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">송금하기</h2>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
                 {([['mart', '마트'], ['teacher', '권쌤'], ['friend', '친구']] as const).map(([key, name]) => (
                    <button 
                        key={key} 
                        onClick={() => setSelectedTab(key)} 
                        className={`p-3 rounded-lg font-semibold text-center transition-colors ${selectedTab === key ? 'bg-[#2B548F] text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                        {name}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {selectedTab === 'friend' && (
                    <div>
                        <label className="font-semibold text-gray-700">받는 분 계좌번호</label>
                        <div className="flex items-center mt-1">
                            <span className="p-3 bg-gray-100 border border-r-0 rounded-l-lg text-gray-600 w-2/5 text-center">권쌤은행</span>
                            <input 
                                type="text" 
                                value={recipientAccountIdInput} 
                                onChange={(e) => {
                                    setRecipientAccountIdInput(e.target.value);
                                    setRecipientDetails(null);
                                }}
                                onBlur={handleAccountBlur}
                                placeholder="계좌번호" 
                                className="w-3/5 p-3 border rounded-r-lg" 
                            />
                        </div>
                        {isCheckingAccount && <p className="text-sm text-gray-500 mt-1">계좌 확인 중...</p>}
                        {recipientDetails && !isCheckingAccount && <p className="text-sm text-green-600 font-semibold mt-1">받는 분: {recipientDetails.user.name}</p>}
                    </div>
                )}

                <div>
                    <label className="font-semibold text-gray-700">보낼 금액</label>
                     <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full p-3 border rounded-lg mt-1"
                    />
                     <p className="text-sm text-gray-500 text-right mt-1">내 잔액: {account.balance.toLocaleString()}권</p>
                </div>
                
                <div>
                    <label className="font-semibold text-gray-700">메모</label>
                    <input 
                        type="text" 
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="(선택) 메모를 남겨주세요."
                        className="w-full p-3 border rounded-lg mt-1"
                    />
                </div>
            </div>
            
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

            <button 
                onClick={handleSubmit}
                disabled={loading || isCheckingAccount}
                className="mt-6 w-full p-4 bg-[#2B548F] text-white font-bold rounded-xl text-lg disabled:bg-gray-400"
            >
                {loading || isCheckingAccount ? '처리 중...' : `${targetDisplayName}에게 송금`}
            </button>
        </div>
    );
};


// --- Stocks View ---
const StocksView: React.FC<{ currentUser: User, refreshAccount: () => void }> = ({ currentUser, refreshAccount }) => {
    const [products, setProducts] = useState<StockProduct[]>([]);
    const [myStocks, setMyStocks] = useState<StudentStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState<StockProduct | null>(null);
    const [showMyStocks, setShowMyStocks] = useState(false);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [prods, my] = await Promise.all([
                api.getStockProducts(),
                api.getStudentStocks(currentUser.userId)
            ]);
            setProducts(prods);
            setMyStocks(my);
        } catch (error) {
            console.error("Failed to fetch stock data", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser.userId]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTransactionComplete = () => {
        setSelectedStock(null);
        refreshAccount();
        fetchData();
    };

    const myTotalValue = useMemo(() => myStocks.reduce((sum, s) => sum + (s.stock?.currentPrice ?? 0) * s.quantity, 0), [myStocks]);
    const myTotalPurchase = useMemo(() => myStocks.reduce((sum, s) => sum + s.purchasePrice * s.quantity, 0), [myStocks]);
    const profit = myTotalValue - myTotalPurchase;
    const profitRate = myTotalPurchase > 0 ? (profit / myTotalPurchase) * 100 : 0;
    
    if (loading) return <div className="text-center p-8">주식 정보를 불러오는 중...</div>;

    return (
        <div>
            <div className="bg-white p-4 rounded-xl shadow-md mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">내 주식</h2>
                <div className="text-right">
                    <p className={`font-bold text-lg ${profit >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {profit.toLocaleString()}권 ({profitRate.toFixed(2)}%)
                    </p>
                    <p className="text-sm text-gray-500">{myTotalValue.toLocaleString()}권</p>
                </div>
            </div>

            <div className="flex justify-center mb-4">
                <div className="flex rounded-lg bg-gray-200 p-1">
                    <button onClick={() => setShowMyStocks(false)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${!showMyStocks ? 'bg-white shadow' : ''}`}>전체 종목</button>
                    <button onClick={() => setShowMyStocks(true)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${showMyStocks ? 'bg-white shadow' : ''}`}>보유 종목</button>
                </div>
            </div>
            
            <div className="space-y-2">
                {(showMyStocks ? myStocks.map(ms => ({ ...ms.stock, myQuantity: ms.quantity })) : products).map(s => s && (
                    <button key={s.id} onClick={() => setSelectedStock(s)} className="w-full flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50">
                        <div>
                            <p className="font-bold text-left">{s.name}</p>
                            {(s as any).myQuantity && <p className="text-xs text-gray-500 text-left">{(s as any).myQuantity}주 보유</p>}
                        </div>
                        <p className="font-mono font-semibold text-right">{s.currentPrice.toLocaleString()}권</p>
                    </button>
                ))}
            </div>
            
            {selectedStock && <StockTransactionModal stock={selectedStock} myStock={myStocks.find(s => s.stockId === selectedStock.id)} onClose={() => setSelectedStock(null)} onComplete={handleTransactionComplete} userId={currentUser.userId} />}
        </div>
    );
};

const StockTransactionModal: React.FC<{
    stock: StockProduct;
    myStock?: StudentStock;
    onClose: () => void;
    onComplete: () => void;
    userId: string;
}> = ({ stock, myStock, onClose, onComplete, userId }) => {
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleTransaction = async () => {
        if (quantity <= 0) {
            setResult({ type: 'error', text: '수량은 1 이상이어야 합니다.'});
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const apiCall = mode === 'buy' ? api.buyStock : api.sellStock;
            const message = await apiCall(userId, stock.id, quantity);
            setResult({ type: 'success', text: message });
            setTimeout(() => onComplete(), 1500);
        } catch(err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const totalPrice = stock.currentPrice * quantity;
    const maxSell = myStock?.quantity || 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2">{stock.name}</h3>
                <p className="font-mono mb-4">현재가: {stock.currentPrice.toLocaleString()}권</p>

                <div className="flex rounded-lg bg-gray-200 p-1 mb-4">
                    <button onClick={() => setMode('buy')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition ${mode === 'buy' ? 'bg-white shadow' : ''}`}>매수</button>
                    <button onClick={() => setMode('sell')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition ${mode === 'sell' ? 'bg-white shadow' : ''}`} disabled={!myStock}>매도</button>
                </div>
                
                <div className="flex items-center justify-between my-4">
                    <p>수량:</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1 border rounded-full"><MinusIcon className="w-5 h-5"/></button>
                        <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-16 text-center font-bold text-lg border-b-2"/>
                        <button onClick={() => setQuantity(q => q + 1)} className="p-1 border rounded-full"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                 {mode === 'sell' && <p className="text-right text-sm text-gray-500 mb-2">최대 {maxSell}주 매도 가능</p>}

                <div className="flex justify-between items-center font-bold text-lg my-4">
                    <p>총 {mode === 'buy' ? '금액' : '예상 정산액'}:</p>
                    <p>{totalPrice.toLocaleString()}권</p>
                </div>

                {result && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <ErrorIcon className="w-5 h-5 mr-2" />}
                        <p className="text-sm">{result.text}</p>
                    </div>
                )}
                
                <button onClick={handleTransaction} disabled={loading} className={`w-full p-3 font-bold rounded-lg text-white mt-4 ${mode === 'buy' ? 'bg-red-500' : 'bg-blue-500'}`}>
                    {mode === 'buy' ? '매수하기' : '매도하기'}
                </button>
            </div>
        </div>
    );
};


// --- Savings View ---
const SavingsView: React.FC<{ currentUser: User, refreshAccount: () => void }> = ({ currentUser, refreshAccount }) => {
    const [products, setProducts] = useState<SavingsProduct[]>([]);
    const [mySavings, setMySavings] = useState<StudentSaving[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<SavingsProduct | null>(null);
    const [savingToCancel, setSavingToCancel] = useState<StudentSaving | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [prods, my] = await Promise.all([
                api.getSavingsProducts(),
                api.getStudentSavings(currentUser.userId)
            ]);
            setProducts(prods);
            setMySavings(my);
        } catch (error) {
            console.error("Failed to fetch savings data", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser.userId]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTransactionComplete = () => {
        setSelectedProduct(null);
        setSavingToCancel(null);
        refreshAccount();
        fetchData();
    };

    if (loading) return <div className="text-center p-8">적금 정보를 불러오는 중...</div>;

    return (
        <div>
            {mySavings.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-2">내 적금</h2>
                    <div className="space-y-2">
                        {mySavings.map(s => <MySavingCard key={s.savingId} saving={s} onCancel={() => setSavingToCancel(s)} />)}
                    </div>
                </div>
            )}
            
            <h2 className="text-xl font-bold mb-2">적금 상품</h2>
            <div className="space-y-2">
                {products.map(p => <SavingProductCard key={p.id} product={p} onJoin={() => setSelectedProduct(p)} />)}
            </div>

            {selectedProduct && <JoinSavingModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onComplete={handleTransactionComplete} userId={currentUser.userId}/>}
            {savingToCancel && <CancelSavingModal saving={savingToCancel} onClose={() => setSavingToCancel(null)} onComplete={handleTransactionComplete} userId={currentUser.userId}/>}
        </div>
    );
};

const MySavingCard: React.FC<{saving: StudentSaving, onCancel: () => void}> = ({ saving, onCancel }) => {
    if (!saving.product) return null;
    const maturityDate = new Date(saving.maturityDate);
    const today = new Date();
    const daysLeft = Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{saving.product.name}</p>
                    <p className="text-sm text-gray-500">{saving.amount.toLocaleString()}권 · 이자율 {(saving.product.rate * 100).toFixed(1)}%</p>
                </div>
                <button onClick={onCancel} className="text-xs text-red-500 font-semibold border border-red-200 px-2 py-1 rounded-md hover:bg-red-50">해지</button>
            </div>
            <div className="mt-2 text-right">
                <p className="text-sm font-semibold">{daysLeft > 0 ? `만기까지 D-${daysLeft}` : '만기 완료'}</p>
                <p className="text-xs text-gray-500">{maturityDate.toLocaleDateString()} 만기</p>
            </div>
        </div>
    );
}

const SavingProductCard: React.FC<{product: SavingsProduct, onJoin: () => void}> = ({ product, onJoin }) => (
     <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold">{product.name}</p>
                <p className="text-sm text-gray-500">
                    만기 {product.maturityDays}일 · 최대 {product.maxAmount.toLocaleString()}권
                </p>
            </div>
            <p className="text-lg font-bold text-indigo-600">{(product.rate * 100).toFixed(1)}%</p>
        </div>
        <button onClick={onJoin} className="mt-2 w-full text-center text-sm font-bold text-indigo-600 bg-indigo-50 py-2 rounded-lg hover:bg-indigo-100">
            가입하기
        </button>
    </div>
);

const JoinSavingModal: React.FC<{
    product: SavingsProduct;
    onClose: () => void;
    onComplete: () => void;
    userId: string;
}> = ({ product, onClose, onComplete, userId }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleJoin = async () => {
        if (!amount || parseInt(amount) <= 0) {
            setResult({ type: 'error', text: '금액을 입력해주세요.' });
            return;
        }
        if (parseInt(amount) > product.maxAmount) {
            setResult({ type: 'error', text: `최대 가입 금액(${product.maxAmount.toLocaleString()}권)을 초과했습니다.`});
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const message = await api.joinSavings(userId, product.id, parseInt(amount));
            setResult({ type: 'success', text: message });
            setTimeout(() => onComplete(), 1500);
        } catch (err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-4">최대 {product.maxAmount.toLocaleString()}권까지 가입할 수 있습니다.</p>

                <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="가입할 금액" 
                    className="w-full p-3 border rounded-lg text-lg"
                />

                {result && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <ErrorIcon className="w-5 h-5 mr-2" />}
                        <p className="text-sm">{result.text}</p>
                    </div>
                )}
                
                <button onClick={handleJoin} disabled={loading} className="w-full p-3 font-bold rounded-lg text-white mt-4 bg-indigo-600">
                    가입하기
                </button>
            </div>
        </div>
    );
};

const CancelSavingModal: React.FC<{
    saving: StudentSaving;
    onClose: () => void;
    onComplete: () => void;
    userId: string;
}> = ({ saving, onClose, onComplete, userId }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleCancel = async () => {
        setLoading(true);
        setResult(null);
        try {
            const message = await api.cancelSavings(userId, saving.savingId);
            setResult({ type: 'success', text: message });
            setTimeout(() => onComplete(), 1500);
        } catch(err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };
    
    if(!saving.product) return null;
    const expectedReturn = Math.round(saving.amount * (1 + saving.product.cancellationRate));

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2">적금을 해지하시겠습니까?</h3>
                <p className="text-sm text-gray-600 mb-4">
                    지금 해지하면 해지 이율({(saving.product.cancellationRate * 100).toFixed(1)}%)이 적용되어 약 {expectedReturn.toLocaleString()}권을 돌려받게 됩니다.
                </p>

                {result && (
                    <div className={`my-4 p-3 rounded-lg flex items-center ${result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <ErrorIcon className="w-5 h-5 mr-2" />}
                        <p className="text-sm">{result.text}</p>
                    </div>
                )}
                
                 <div className="flex gap-4 mt-4">
                    <button onClick={onClose} disabled={loading} className="flex-1 p-3 bg-gray-200 font-bold rounded-lg">취소</button>
                    <button onClick={handleCancel} disabled={loading} className="flex-1 p-3 text-white bg-red-600 font-bold rounded-lg">해지하기</button>
                </div>
            </div>
        </div>
    );
};


export default StudentPage;
