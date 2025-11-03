import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Account, Transaction, StockProduct, StudentStock, SavingsProduct, StudentSaving, User, Job } from '../types';
import { HomeIcon, TransferIcon, NewStockIcon, NewPiggyBankIcon, BackIcon, XIcon, CheckIcon, ErrorIcon, PlusIcon, MinusIcon, NewJobIcon } from '../components/icons';

type View = 'home' | 'transfer' | 'stocks' | 'savings';

// --- Main Student Page Component ---
const StudentPage: React.FC = () => {
    const { currentUser } = useContext(AuthContext);
    const [view, setView] = useState<View>('home');
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);

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
                return <HomeView account={account} currentUser={currentUser} />;
            case 'transfer':
                return <TransferView currentUser={currentUser} refreshAccount={fetchAccount} />;
            case 'stocks':
                return <StocksView currentUser={currentUser} refreshAccount={fetchAccount} />;
            case 'savings':
                return <SavingsView currentUser={currentUser} refreshAccount={fetchAccount} />;
            default:
                return <HomeView account={account} currentUser={currentUser} />;
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
                    <NavButton label="홈" Icon={HomeIcon} active={view === 'home'} onClick={() => setView('home')} />
                    <NavButton label="송금" Icon={TransferIcon} active={view === 'transfer'} onClick={() => setView('transfer')} />
                    <NavButton label="주식" Icon={NewStockIcon} active={view === 'stocks'} onClick={() => setView('stocks')} />
                    <NavButton label="적금" Icon={NewPiggyBankIcon} active={view === 'savings'} onClick={() => setView('savings')} />
                </nav>
            </div>
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
const HomeView: React.FC<{ account: Account; currentUser: User }> = ({ account, currentUser }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [myJobs, setMyJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
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
                }
            } catch (error) {
                console.error("Failed to fetch home view data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [account.accountId, currentUser]);

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

            <h2 className="text-xl font-bold text-gray-800 mb-2">최근 거래 내역</h2>
            {transactions.length > 0 ? (
                <ul className="space-y-2">
                    {transactions.map(t => (
                        <li key={t.transactionId} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{t.description}</p>
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


// --- Transfer View ---
const TransferView: React.FC<{ currentUser: User; refreshAccount: () => void; }> = ({ currentUser, refreshAccount }) => {
    const [accountId, setAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState<{ user: User, account: Account } | null>(null);
    const [step, setStep] = useState<'input' | 'confirm' | 'result'>('input');
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCheckRecipient = async () => {
        if (!accountId) {
            setResult({ type: 'error', text: '계좌번호를 입력해주세요.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const recipientDetails = await api.getRecipientDetailsByAccountId(`권쌤은행 ${accountId}`);
            if (recipientDetails) {
                if (recipientDetails.account.userId === currentUser.userId) {
                    setResult({ type: 'error', text: '자신에게는 송금할 수 없습니다.' });
                } else {
                    setRecipient(recipientDetails);
                    setStep('confirm');
                }
            } else {
                setResult({ type: 'error', text: '받는 분의 계좌를 찾을 수 없습니다.' });
            }
        } catch (err) {
            setResult({ type: 'error', text: '조회 중 오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!recipient || !amount || parseInt(amount) <= 0) {
            setResult({ type: 'error', text: '송금 정보가 올바르지 않습니다.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const message = await api.transfer(currentUser.userId, recipient.account.accountId, parseInt(amount));
            setResult({ type: 'success', text: message });
            refreshAccount();
        } catch (err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
            setStep('result');
        }
    };
    
    const reset = () => {
        setAccountId('');
        setAmount('');
        setRecipient(null);
        setResult(null);
        setStep('input');
    };

    if (step === 'confirm' && recipient) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <button onClick={() => setStep('input')} className="flex items-center text-sm text-gray-500 mb-4"><BackIcon className="w-4 h-4 mr-1" />뒤로</button>
                <h2 className="text-2xl font-bold mb-4">송금 정보 확인</h2>
                <p className="text-lg mb-2">받는 분: <span className="font-bold">{recipient.user.name}</span></p>
                <p className="text-lg mb-4">보내는 금액: <span className="font-bold">{parseInt(amount).toLocaleString()}권</span></p>
                {result && <p className={`text-sm mb-4 ${result.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{result.text}</p>}
                <button onClick={handleTransfer} disabled={loading} className="w-full p-3 bg-[#2B548F] text-white font-bold rounded-lg disabled:bg-gray-400">
                    {loading ? '송금 중...' : '송금 실행'}
                </button>
            </div>
        )
    }

    if (step === 'result') {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
                {result?.type === 'success' ? <CheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" /> : <ErrorIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />}
                <h2 className="text-2xl font-bold mb-2">{result?.type === 'success' ? '송금 완료' : '송금 실패'}</h2>
                <p className="mb-6">{result?.text}</p>
                <button onClick={reset} className="w-full p-3 bg-[#2B548F] text-white font-bold rounded-lg">확인</button>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">송금하기</h2>
            <div className="space-y-4">
                <div>
                    <label className="font-semibold text-gray-700">받는 분 계좌번호</label>
                    <div className="flex items-center mt-1">
                        <span className="p-3 bg-gray-100 border border-r-0 rounded-l-lg text-gray-600">권쌤은행</span>
                        <input type="text" value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="000-000" className="flex-grow p-3 border rounded-r-lg" />
                    </div>
                </div>
                 <div>
                    <label className="font-semibold text-gray-700">보낼 금액</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full p-3 border rounded-lg mt-1" />
                </div>
            </div>
            {result && <p className="text-red-500 text-sm mt-4">{result.text}</p>}
            <button onClick={handleCheckRecipient} disabled={loading || !amount || parseInt(amount) <= 0} className="mt-6 w-full p-3 bg-[#2B548F] text-white font-bold rounded-lg disabled:bg-gray-400">
                {loading ? '조회 중...' : '다음'}
            </button>
        </div>
    );
};


// --- Stocks View ---
const StocksView: React.FC<{ currentUser: User; refreshAccount: () => void; }> = ({ currentUser, refreshAccount }) => {
    const [allStocks, setAllStocks] = useState<StockProduct[]>([]);
    const [myStocks, setMyStocks] = useState<StudentStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState<StockProduct | null>(null);
    const [mode, setMode] = useState<'buy' | 'sell' | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [all, mine] = await Promise.all([
                api.getStockProducts(),
                api.getStudentStocks(currentUser.userId)
            ]);
            setAllStocks(all as StockProduct[]);
            setMyStocks(mine);
        } catch (error) {
            console.error("Failed to fetch stock data", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser.userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleTxnComplete = () => {
        setSelectedStock(null);
        setMode(null);
        fetchData();
        refreshAccount();
    };
    
    const valuation = useMemo(() => myStocks.reduce((sum, s) => sum + (s.quantity * (s.stock?.currentPrice ?? 0)), 0), [myStocks]);
    const totalPurchase = useMemo(() => myStocks.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0), [myStocks]);
    const profit = valuation - totalPurchase;

    if (loading) return <div className="text-center p-8">주식 정보를 불러오는 중...</div>;

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="text-lg font-bold mb-2">내 주식 현황</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500">총 평가액</p>
                        <p className="font-bold text-lg">{valuation.toLocaleString()}권</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">수익</p>
                        <p className={`font-bold text-lg ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}{profit.toLocaleString()}권
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold mb-2">보유 주식</h3>
                {myStocks.length > 0 ? (
                     <div className="space-y-2">
                        {myStocks.map(s => (
                            <div key={s.stockId} className="bg-white p-3 rounded-lg shadow-sm flex items-center">
                                <div className="flex-grow">
                                    <p className="font-bold">{s.stock?.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {s.quantity}주 • 평단 {s.purchasePrice.toLocaleString()}권
                                    </p>
                                </div>
                                <button onClick={() => { setSelectedStock(s.stock!); setMode('sell'); }} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg">매도</button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-center text-gray-500 py-4 bg-white rounded-lg">보유 주식이 없습니다.</p>}
            </div>

            <div>
                <h3 className="text-lg font-bold mb-2">전체 주식 목록</h3>
                <div className="space-y-2">
                    {allStocks.map(s => (
                         <div key={s.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center">
                            <div className="flex-grow">
                                <p className="font-bold">{s.name}</p>
                                <p className="text-sm text-gray-600">
                                    현재가: {s.currentPrice.toLocaleString()}권
                                </p>
                            </div>
                            <button onClick={() => { setSelectedStock(s); setMode('buy'); }} className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg">매수</button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedStock && mode && (
                <StockTxnModal 
                    stock={selectedStock} 
                    mode={mode} 
                    myStock={myStocks.find(s => s.stockId === selectedStock.id)}
                    onClose={() => { setSelectedStock(null); setMode(null); }} 
                    onComplete={handleTxnComplete} 
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

const StockTxnModal: React.FC<{ 
    stock: StockProduct; 
    mode: 'buy' | 'sell';
    myStock?: StudentStock;
    onClose: () => void; 
    onComplete: () => void;
    currentUser: User;
}> = ({ stock, mode, myStock, onClose, onComplete, currentUser }) => {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const maxQuantity = mode === 'sell' ? (myStock?.quantity ?? 0) : 100;
    const totalPrice = quantity * stock.currentPrice;

    const handleSubmit = async () => {
        if (quantity <= 0) {
            setResult({ type: 'error', text: '수량을 입력해주세요.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            if (mode === 'buy') {
                await api.buyStock(currentUser.userId, stock.id, quantity);
            } else {
                await api.sellStock(currentUser.userId, stock.id, quantity);
            }
            setResult({ type: 'success', text: `${mode === 'buy' ? '매수' : '매도'}가 완료되었습니다.` });
            setTimeout(onComplete, 1500);
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
                    <h3 className="text-xl font-bold">{stock.name} {mode === 'buy' ? '매수' : '매도'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                <div className="text-center mb-4">
                    <p className="text-gray-600">현재가</p>
                    <p className="text-3xl font-bold">{stock.currentPrice.toLocaleString()}권</p>
                </div>
                <div className="flex items-center justify-center gap-4 mb-4">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 rounded-full bg-gray-200"><MinusIcon className="w-6 h-6"/></button>
                    <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))} className="w-24 text-center text-2xl font-bold border-b-2"/>
                    <button onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))} className="p-2 rounded-full bg-gray-200"><PlusIcon className="w-6 h-6"/></button>
                </div>
                {mode === 'sell' && <p className="text-center text-sm text-gray-500 mb-4">보유 수량: {myStock?.quantity ?? 0}주</p>}
                <div className="bg-gray-100 p-3 rounded-lg text-center mb-6">
                    <p className="text-gray-600">총 예상 금액</p>
                    <p className="font-bold text-xl">{totalPrice.toLocaleString()}권</p>
                </div>

                <button onClick={handleSubmit} disabled={loading} className={`w-full p-3 font-bold text-white rounded-lg disabled:bg-gray-400 ${mode === 'buy' ? 'bg-blue-500' : 'bg-red-500'}`}>
                    {loading ? '처리 중...' : `${quantity}주 ${mode === 'buy' ? '매수' : '매도'}하기`}
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

// --- Savings View ---
const SavingsView: React.FC<{ currentUser: User; refreshAccount: () => void; }> = ({ currentUser, refreshAccount }) => {
    const [products, setProducts] = useState<SavingsProduct[]>([]);
    const [mySavings, setMySavings] = useState<StudentSaving[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<SavingsProduct | null>(null);
    const [selectedSaving, setSelectedSaving] = useState<StudentSaving | null>(null);
    const [mode, setMode] = useState<'join' | 'cancel' | null>(null);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [all, mine] = await Promise.all([
                api.getSavingsProducts(),
                api.getStudentSavings(currentUser.userId)
            ]);
            setProducts(all);
            setMySavings(mine);
        } catch(error) {
            console.error("Failed to fetch savings data", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser.userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleTxnComplete = () => {
        setSelectedProduct(null);
        setSelectedSaving(null);
        setMode(null);
        fetchData();
        refreshAccount();
    };

    const isJoined = (productId: string) => mySavings.some(s => s.productId === productId);

    if (loading) return <div className="text-center p-8">적금 정보를 불러오는 중...</div>;
    
    return (
        <div className="space-y-4">
             <div>
                <h3 className="text-lg font-bold mb-2">내 적금</h3>
                {mySavings.length > 0 ? (
                     <div className="space-y-2">
                        {mySavings.map(s => (
                            <div key={s.savingId} className="bg-white p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{s.product?.name}</p>
                                        <p className="text-sm text-gray-600">가입 금액: {s.amount.toLocaleString()}권</p>
                                        <p className="text-sm text-gray-500">만기일: {new Date(s.maturityDate).toLocaleDateString()}</p>
                                    </div>
                                    <button onClick={() => { setSelectedSaving(s); setMode('cancel'); }} className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg">해지</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-center text-gray-500 py-4 bg-white rounded-lg">가입한 적금이 없습니다.</p>}
            </div>

            <div>
                <h3 className="text-lg font-bold mb-2">적금 상품</h3>
                <div className="space-y-2">
                    {products.map(p => (
                         <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{p.name}</p>
                                    <p className="text-sm text-blue-600 font-semibold">이자율: {(p.rate * 100).toFixed(1)}% (만기 {p.maturityDays}일)</p>
                                    <p className="text-xs text-gray-500">최대 {p.maxAmount.toLocaleString()}권 가입 가능</p>
                                </div>
                                <button 
                                    onClick={() => { setSelectedProduct(p); setMode('join'); }} 
                                    className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg disabled:bg-gray-400"
                                    disabled={isJoined(p.id)}
                                >
                                    {isJoined(p.id) ? '가입완료' : '가입'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {mode === 'join' && selectedProduct && (
                <JoinSavingModal product={selectedProduct} onClose={() => setMode(null)} onComplete={handleTxnComplete} currentUser={currentUser} />
            )}
            {mode === 'cancel' && selectedSaving && (
                <CancelSavingModal saving={selectedSaving} onClose={() => setMode(null)} onComplete={handleTxnComplete} currentUser={currentUser} />
            )}
        </div>
    );
};

const JoinSavingModal: React.FC<{
    product: SavingsProduct;
    onClose: () => void;
    onComplete: () => void;
    currentUser: User;
}> = ({ product, onClose, onComplete, currentUser }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async () => {
        const joinAmount = parseInt(amount);
        if (!joinAmount || joinAmount <= 0) {
            setResult({ type: 'error', text: '가입 금액을 입력해주세요.' }); return;
        }
        if (joinAmount > product.maxAmount) {
            setResult({ type: 'error', text: `최대 ${product.maxAmount.toLocaleString()}권까지 가입 가능합니다.` }); return;
        }

        setLoading(true);
        setResult(null);
        try {
            await api.joinSavings(currentUser.userId, product.id, joinAmount);
            setResult({ type: 'success', text: '적금에 가입했습니다.' });
            setTimeout(onComplete, 1500);
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
                    <h3 className="text-xl font-bold">{product.name} 가입</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="가입 금액" className="w-full p-3 border rounded-lg mb-4"/>
                <button onClick={handleSubmit} disabled={loading} className="w-full p-3 bg-green-500 text-white font-bold rounded-lg disabled:bg-gray-400">
                    {loading ? '가입 중...' : '가입하기'}
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

const CancelSavingModal: React.FC<{
    saving: StudentSaving;
    onClose: () => void;
    onComplete: () => void;
    currentUser: User;
}> = ({ saving, onClose, onComplete, currentUser }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        setResult(null);
        try {
            await api.cancelSavings(currentUser.userId, saving.savingId);
            setResult({ type: 'success', text: '적금을 해지했습니다.' });
            setTimeout(onComplete, 1500);
        } catch (err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
                 <h3 className="text-xl font-bold mb-2">적금 해지 확인</h3>
                 <p className="mb-4 text-gray-600">정말로 '{saving.product?.name}' 적금을 해지하시겠습니까? 중도 해지 이율이 적용됩니다.</p>
                <div className="flex gap-4">
                    <button onClick={onClose} disabled={loading} className="flex-1 p-3 bg-gray-200 font-bold rounded-lg">취소</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 p-3 text-white bg-red-600 font-bold rounded-lg">해지하기</button>
                </div>
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

export default StudentPage;