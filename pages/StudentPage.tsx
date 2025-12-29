
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Account, Transaction, StockProduct, StudentStock, SavingsProduct, StudentSaving, User, Job, StockHistory, Fund, FundInvestment, FundStatus } from '../types';
import { HomeIcon, TransferIcon, NewStockIcon, NewPiggyBankIcon, BackIcon, XIcon, CheckIcon, ErrorIcon, PlusIcon, MinusIcon, NewJobIcon, NewTaxIcon, LogoutIcon, NewFundIcon, ArrowUpIcon, ArrowDownIcon, NewspaperIcon } from '../components/icons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type View = 'home' | 'transfer' | 'stocks' | 'savings' | 'funds';
type NotificationType = { type: 'success' | 'error', text: string };

interface StudentPageProps {
    initialView?: string;
}

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

const ChangePasswordModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { currentUser } = useContext(AuthContext);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success'|'error', text: string } | null>(null);

    const handleSubmit = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            setMessage({ type: 'error', text: '모든 항목을 입력해주세요.' });
            return;
        }
        if (newPw !== confirmPw) {
            setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            if (currentUser) {
                await api.changePassword(currentUser.userId, currentPw, newPw);
                setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' });
                setTimeout(() => onClose(), 1500);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4 text-center">비밀번호 변경</h3>
                <div className="space-y-3">
                    <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="현재 비밀번호" className="w-full p-3 border rounded-lg" />
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="새 비밀번호" className="w-full p-3 border rounded-lg" />
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="새 비밀번호 확인" className="w-full p-3 border rounded-lg" />
                </div>
                {message && (
                    <p className={`mt-3 text-sm text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.text}
                    </p>
                )}
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 p-3 bg-gray-200 font-bold rounded-lg text-gray-700">취소</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 p-3 bg-indigo-600 text-white font-bold rounded-lg disabled:bg-gray-400">변경</button>
                </div>
            </div>
        </div>
    );
};

const StudentPage: React.FC<StudentPageProps> = ({ initialView }) => {
    const { currentUser, logout } = useContext(AuthContext);
    
    const validViews: View[] = ['home', 'transfer', 'stocks', 'funds', 'savings'];
    const startView: View = (initialView && validViews.includes(initialView as View)) 
        ? (initialView as View) 
        : 'transfer'; 

    const [view, setView] = useState<View>(startView);
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<NotificationType | null>(null);

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

    const handleLogout = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('mode', 'app');
        window.history.replaceState({}, '', url.toString());
        logout();
    };

    // 경제뉴스 자동 로그인 URL 생성
    const newsUrl = useMemo(() => {
        if (!currentUser) return 'https://kidseconews.vercel.app/';
        const params = new URLSearchParams();
        params.append('name', currentUser.name);
        params.append('grade', String(currentUser.grade || ''));
        params.append('class', String(currentUser.class || ''));
        params.append('number', String(currentUser.number || ''));
        return `https://kidseconews.vercel.app/?${params.toString()}`;
    }, [currentUser]);

    const renderView = () => {
        if (loading || !currentUser || !account) return <div className="text-center p-8">로딩 중...</div>;
        switch (view) {
            case 'home':
                return <HomeView account={account} currentUser={currentUser} refreshAccount={fetchAccount} showNotification={showNotification} />;
            case 'transfer':
                return <TransferView currentUser={currentUser} account={account} refreshAccount={fetchAccount} showNotification={showNotification} />;
            case 'stocks':
                return <StocksView currentUser={currentUser} refreshAccount={fetchAccount} showNotification={showNotification} />;
            case 'funds':
                return <FundView currentUser={currentUser} refreshAccount={fetchAccount} />;
            case 'savings':
                return <SavingsView currentUser={currentUser} refreshAccount={fetchAccount} />;
            default:
                return <TransferView currentUser={currentUser} account={account} refreshAccount={fetchAccount} showNotification={showNotification} />;
        }
    };
    
    return (
        <div className="flex h-full bg-gray-50">
            <aside className="hidden md:flex flex-col w-56 bg-white/80 backdrop-blur-sm border-r p-4">
                <div className="px-2">
                    <h1 className="text-2xl font-bold text-gray-800">{currentUser?.name}님</h1>
                </div>
                <nav className="mt-8 flex flex-col space-y-2">
                    <DesktopNavButton label="홈" Icon={HomeIcon} active={view === 'home'} onClick={() => setView('home')} />
                    <DesktopNavButton label="송금" Icon={TransferIcon} active={view === 'transfer'} onClick={() => setView('transfer')} />
                    <DesktopNavButton label="주식" Icon={NewStockIcon} active={view === 'stocks'} onClick={() => setView('stocks')} />
                    <DesktopNavButton label="펀드" Icon={NewFundIcon} active={view === 'funds'} onClick={() => setView('funds')} />
                    <DesktopNavButton label="적금" Icon={NewPiggyBankIcon} active={view === 'savings'} onClick={() => setView('savings')} />
                </nav>
                 <div className="mt-auto space-y-2">
                    <a 
                        href={newsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full flex items-center p-3 text-sm font-semibold text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                        <NewspaperIcon className="w-5 h-5 mr-3" />
                        경제뉴스
                    </a>
                    <button onClick={handleLogout} className="w-full flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors">
                        <LogoutIcon className="w-5 h-5 mr-3" />
                        로그아웃
                    </button>
                </div>
            </aside>
    
            <div className="flex-1 flex flex-col h-full">
                <header className="md:hidden p-4 flex justify-between items-center bg-white border-b sticky top-0 z-10">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold text-gray-800 mr-3">{currentUser?.name}님</h1>
                        <a 
                            href={newsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
                            title="경제뉴스 서비스"
                        >
                            <NewspaperIcon className="w-6 h-6" />
                        </a>
                    </div>
                     <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-100">
                        <LogoutIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </header>
    
                <main className="flex-grow overflow-y-auto p-4 bg-[#D1D3D8]">
                    {renderView()}
                </main>
    
                <nav className="md:hidden grid grid-cols-5 bg-white p-1 border-t sticky bottom-0 z-10">
                    <NavButton label="홈" Icon={HomeIcon} active={view === 'home'} onClick={() => setView('home')} />
                    <NavButton label="송금" Icon={TransferIcon} active={view === 'transfer'} onClick={() => setView('transfer')} />
                    <NavButton label="주식" Icon={NewStockIcon} active={view === 'stocks'} onClick={() => setView('stocks')} />
                    <NavButton label="펀드" Icon={NewFundIcon} active={view === 'funds'} onClick={() => setView('funds')} />
                    <NavButton label="적금" Icon={NewPiggyBankIcon} active={view === 'savings'} onClick={() => setView('savings')} />
                </nav>
            </div>

            {notification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-sm text-center">
                        {notification.type === 'success' ? (
                            <CheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        ) : (
                            <ErrorIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        )}
                        <h3 className={`text-2xl font-bold mb-2 ${notification.type === 'success' ? 'text-gray-900' : 'text-red-600'}`}>
                            {notification.type === 'success' ? '성공!' : '오류'}
                        </h3>
                        <p className="text-gray-700">{notification.text}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const NavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void }> = ({ label, Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-colors ${active ? 'text-indigo-600' : 'text-gray-500 hover:bg-indigo-50'}`}>
        <Icon className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium scale-90">{label}</span>
    </button>
);

const DesktopNavButton: React.FC<{ label: string, Icon: React.FC<any>, active: boolean, onClick: () => void }> = ({ label, Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center w-full p-3 rounded-lg transition-colors text-sm font-semibold ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
    </button>
);

const HomeView: React.FC<{ account: Account, currentUser: User, refreshAccount: () => void, showNotification: (type: 'success'|'error', text: string) => void }> = ({ account, currentUser, refreshAccount, showNotification }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [myStocks, setMyStocks] = useState<StudentStock[]>([]);
    const [mySavings, setMySavings] = useState<StudentSaving[]>([]);
    const [unpaidTaxes, setUnpaidTaxes] = useState<any[]>([]);
    const [taxToPay, setTaxToPay] = useState<{taxId: string, amount: number, name: string} | null>(null);
    const [visibleCount, setVisibleCount] = useState(5);

    useEffect(() => {
        api.getTransactionsByAccountId(account.accountId).then(setTransactions);
        api.getStudentStocks(currentUser.userId).then(setMyStocks);
        api.getStudentSavings(currentUser.userId).then(setMySavings);
        api.getMyUnpaidTaxes(currentUser.userId).then(setUnpaidTaxes);
    }, [account.accountId, currentUser.userId]);

    const stockValue = myStocks.reduce((sum, item) => sum + (item.quantity * (item.stock?.currentPrice || 0)), 0);
    const savingsValue = mySavings.reduce((sum, item) => sum + item.amount, 0);
    const totalAssets = account.balance + stockValue + savingsValue;

    const handlePayClick = (taxId: string, amount: number, name: string) => {
        if (account.balance < amount) {
            showNotification('error', '잔액이 부족하여 세금을 납부할 수 없습니다.');
            return;
        }
        setTaxToPay({ taxId, amount, name });
    };

    const handleConfirmPayment = async () => {
        if (!taxToPay) return;
        try {
            const message = await api.payTax(currentUser.userId, taxToPay.taxId);
            showNotification('success', message);
            api.getMyUnpaidTaxes(currentUser.userId).then(setUnpaidTaxes);
            refreshAccount();
        } catch(e: any) { 
            showNotification('error', e.message); 
        } finally {
            setTaxToPay(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 mb-1 font-medium">내 총 자산</p>
                <h2 className="text-4xl font-extrabold text-gray-800">{totalAssets.toLocaleString()}<span className="text-2xl ml-1 font-normal text-gray-600">권</span></h2>
                
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-50">
                    <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">현금</div>
                        <div className="font-bold text-gray-700">{account.balance.toLocaleString()}</div>
                    </div>
                    <div className="text-center border-l border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">주식</div>
                        <div className="font-bold text-blue-600">{stockValue.toLocaleString()}</div>
                    </div>
                     <div className="text-center border-l border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">적금</div>
                        <div className="font-bold text-green-600">{savingsValue.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {unpaidTaxes.length > 0 && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <h3 className="font-bold text-red-700 mb-2 flex items-center"><NewTaxIcon className="w-5 h-5 mr-2"/> 미납 세금 고지서</h3>
                    <div className="space-y-2">
                        {unpaidTaxes.map(tax => (
                            <div key={tax.recipientId} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-gray-800">{tax.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">~{new Date(tax.dueDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-red-600">{tax.amount.toLocaleString()}권</span>
                                    <button onClick={() => handlePayClick(tax.taxId, tax.amount, tax.name)} className="px-3 py-1 bg-red-600 text-white text-xs rounded-full font-bold hover:bg-red-700 transition-colors">납부</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 ml-1">최근 활동</h3>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {transactions.slice(0, visibleCount).map(t => (
                        <div key={t.transactionId} className="p-4 border-b last:border-0 flex justify-between items-center">
                            <div>
                                <div className="font-medium text-gray-800">{t.description}</div>
                                <div className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</div>
                            </div>
                            <div className={`font-bold ${t.amount > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {transactions.length > visibleCount && (
                        <button 
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            className="w-full py-4 text-sm font-bold text-indigo-600 hover:bg-indigo-50 border-t transition-colors bg-white active:bg-indigo-100"
                        >
                            활동 더보기 (+10건)
                        </button>
                    )}
                    {transactions.length === 0 && <div className="p-6 text-center text-gray-400">거래 내역이 없습니다.</div>}
                </div>
            </div>

            <ConfirmModal 
                isOpen={!!taxToPay}
                title="세금 납부"
                message={`'${taxToPay?.name}' 세금 ${taxToPay?.amount.toLocaleString()}권을 납부하시겠습니까?`}
                onConfirm={handleConfirmPayment}
                onCancel={() => setTaxToPay(null)}
                confirmText="납부하기"
            />
        </div>
    );
};

const TransferView: React.FC<{ currentUser: User, account: Account, refreshAccount: () => void, showNotification: (type: 'success' | 'error', text: string) => void }> = ({ currentUser, account, refreshAccount, showNotification }) => {
    const [targetType, setTargetType] = useState<'student' | 'teacher'>('student');
    const [targetAccountId, setTargetAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);
    const [recipientInfo, setRecipientInfo] = useState<{name: string, grade: number, class: number, number: number} | null>(null);

    useEffect(() => {
        if(targetType === 'student' && targetAccountId.length >= 3) {
            const timer = setTimeout(async () => {
                try {
                    const fullId = `권쌤은행 ${targetAccountId}`;
                    const details = await api.getRecipientDetailsByAccountId(fullId);
                    if(details) {
                        setRecipientInfo({
                            name: details.user.name,
                            grade: details.user.grade || 0,
                            class: details.user.class || 0,
                            number: details.user.number || 0
                        });
                    } else {
                        setRecipientInfo(null);
                    }
                } catch(e) { setRecipientInfo(null); }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setRecipientInfo(null);
        }
    }, [targetAccountId, targetType]);

    const safeHandleTransfer = async () => {
        if (!amount || parseInt(amount) <= 0) return;
        setLoading(true);
        try {
             if (targetType === 'teacher') {
                const teacherAcc = await api.getTeacherAccount();
                if (!teacherAcc) throw new Error("선생님 계좌를 찾을 수 없습니다.");
                await api.transfer(currentUser.userId, teacherAcc.accountId, parseInt(amount), memo || '선생님께 송금');
             } else {
                 const fullId = `권쌤은행 ${targetAccountId}`;
                 const details = await api.getRecipientDetailsByAccountId(fullId);
                 if(!details) throw new Error("받는 사람 계좌가 존재하지 않습니다.");
                 await api.transfer(currentUser.userId, details.account.accountId, parseInt(amount), memo || '송금');
             }
             showNotification('success', '송금이 완료되었습니다.');
             setAmount('');
             setMemo('');
             setTargetAccountId('');
             setRecipientInfo(null);
             refreshAccount();
        } catch (e: any) {
             showNotification('error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">송금하기</h2>
            
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button 
                    onClick={() => setTargetType('student')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${targetType === 'student' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                    친구에게
                </button>
                <button 
                    onClick={() => setTargetType('teacher')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${targetType === 'teacher' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                    선생님께
                </button>
            </div>

            <div className="space-y-4">
                {targetType === 'student' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">받는 사람 계좌</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                권쌤은행
                            </span>
                            <input 
                                type="text" 
                                value={targetAccountId}
                                onChange={e => setTargetAccountId(e.target.value)}
                                placeholder="000-000"
                                className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        {recipientInfo && (
                            <div className="mt-2 text-sm text-green-600 flex items-center bg-green-50 p-2 rounded">
                                <CheckIcon className="w-4 h-4 mr-1"/>
                                {recipientInfo.grade}-{recipientInfo.class} {recipientInfo.number} {recipientInfo.name}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-indigo-50 p-4 rounded-xl flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">T</div>
                        <div>
                            <div className="font-bold text-gray-800">담임 선생님</div>
                            <div className="text-xs text-gray-500">국고 계좌</div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">보낼 금액</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
                            placeholder="0"
                        />
                        <span className="absolute right-3 top-3.5 text-gray-500 font-medium">권</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 text-right">
                        잔액: {account.balance.toLocaleString()}권
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">메모 (선택)</label>
                     <input 
                        type="text" 
                        value={memo} 
                        onChange={e => setMemo(e.target.value)}
                        placeholder="예: 과자값"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                     />
                </div>
            </div>

            <button 
                onClick={safeHandleTransfer} 
                disabled={loading || (targetType === 'student' && !recipientInfo) || !amount}
                className="w-full mt-8 p-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:shadow-none transition-all active:scale-95"
            >
                {loading ? '송금 중...' : '보내기'}
            </button>
        </div>
    );
};

const StocksView: React.FC<{ currentUser: User, refreshAccount: () => void, showNotification: (type: 'success' | 'error', text: string) => void }> = ({ currentUser, refreshAccount, showNotification }) => {
    const [stocks, setStocks] = useState<StockProduct[]>([]);
    const [myStocks, setMyStocks] = useState<StudentStock[]>([]);
    const [selectedStock, setSelectedStock] = useState<StockProduct | null>(null);
    const [history, setHistory] = useState<StockHistory[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'my'>('list');

    const fetchData = useCallback(async () => {
        const stockList = await api.getStockProducts();
        setStocks(stockList);
        const myStockList = await api.getStudentStocks(currentUser.userId);
        setMyStocks(myStockList);
    }, [currentUser.userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleStockClick = async (stock: StockProduct) => {
        setSelectedStock(stock);
        const hist = await api.getStockHistory(stock.id);
        setHistory(hist);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex bg-gray-200 p-1 rounded-lg mb-4 flex-shrink-0">
                <button onClick={() => setViewMode('list')} className={`flex-1 py-2 text-sm font-bold rounded-md ${viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>주식 시장</button>
                <button onClick={() => setViewMode('my')} className={`flex-1 py-2 text-sm font-bold rounded-md ${viewMode === 'my' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>내 주식</button>
            </div>

            <div className="flex-grow overflow-auto">
                {viewMode === 'list' ? (
                    <div className="grid grid-cols-1 gap-3">
                        {stocks.map(s => (
                            <div key={s.id} onClick={() => handleStockClick(s)} className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center">
                                <span className="font-bold text-gray-800">{s.name}</span>
                                <div className="text-right">
                                    <div className="font-mono font-bold">{s.currentPrice.toLocaleString()}권</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {myStocks.map(ms => {
                            const currentVal = ms.quantity * (ms.stock?.currentPrice || 0);
                            const buyVal = ms.quantity * ms.purchasePrice;
                            const profit = currentVal - buyVal;
                            const profitRate = buyVal > 0 ? (profit / buyVal) * 100 : 0;
                            
                            return (
                                <div key={ms.stockId} onClick={() => ms.stock && handleStockClick(ms.stock)} className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold">{ms.stock?.name}</span>
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{ms.quantity}주 보유</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-xs text-gray-400">평가손익</div>
                                            <div className={`font-bold ${profit >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                                {profit > 0 ? '+' : ''}{profit.toLocaleString()} ({profitRate.toFixed(1)}%)
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400">평가금액</div>
                                            <div className="font-bold">{currentVal.toLocaleString()}권</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {myStocks.length === 0 && <div className="text-center text-gray-500 mt-10">보유한 주식이 없습니다.</div>}
                    </div>
                )}
            </div>

            {selectedStock && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStock(null)}>
                    <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">{selectedStock.name}</h3>
                            <button onClick={() => setSelectedStock(null)}><XIcon className="w-6 h-6 text-gray-400"/></button>
                        </div>
                        
                        <div className="p-4 flex-shrink-0 h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <XAxis dataKey="createdAt" hide />
                                    <YAxis domain={['auto', 'auto']} hide />
                                    <Tooltip labelFormatter={() => ''} formatter={(val: number) => [`${val}권`, '가격']} />
                                    <Line type="monotone" dataKey="price" stroke="#4F46E5" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="p-4 bg-white border-t">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-500">현재가</span>
                                <span className="text-2xl font-bold">{selectedStock.currentPrice.toLocaleString()}권</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setSelectedStock({...selectedStock, mode: 'buy'} as any)}
                                    className="py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100"
                                >
                                    매수 (사기)
                                </button>
                                <button 
                                    onClick={() => setSelectedStock({...selectedStock, mode: 'sell'} as any)}
                                    className="py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100"
                                >
                                    매도 (팔기)
                                </button>
                            </div>
                        </div>

                        {(selectedStock as any).mode && (
                            <StockTransactionModal 
                                mode={(selectedStock as any).mode} 
                                stock={selectedStock} 
                                userId={currentUser.userId}
                                onClose={() => setSelectedStock(null)}
                                onComplete={(msg) => {
                                    if(msg) showNotification('success', msg);
                                    setSelectedStock(null);
                                    fetchData();
                                    refreshAccount();
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const StockTransactionModal: React.FC<{ mode: 'buy'|'sell', stock: StockProduct, userId: string, onClose: ()=>void, onComplete: (msg?: string)=>void }> = ({mode, stock, userId, onClose, onComplete}) => {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleTrade = async () => {
        setLoading(true);
        setError(null);
        try {
            let message = '';
            if(mode === 'buy') {
                message = await api.buyStock(userId, stock.id, quantity);
            } else {
                message = await api.sellStock(userId, stock.id, quantity);
            }
            onComplete(message);
        } catch(e: any) { 
            setError(e.message); 
        }
        finally { setLoading(false); }
    };

    return (
        <div className="absolute inset-0 bg-white z-10 flex flex-col p-6">
            <h3 className="text-xl font-bold mb-6 text-center">{mode === 'buy' ? '매수하기' : '매도하기'}</h3>
            <div className="flex-grow flex flex-col justify-center items-center">
                <div className="text-gray-500 mb-2">{stock.name}</div>
                <div className="text-3xl font-bold mb-8">{stock.currentPrice.toLocaleString()}권</div>
                
                <div className="flex items-center gap-6 mb-8">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 rounded-full bg-gray-100"><MinusIcon className="w-6 h-6"/></button>
                    <span className="text-4xl font-mono font-bold w-20 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="p-3 rounded-full bg-gray-100"><PlusIcon className="w-6 h-6"/></button>
                </div>

                <div className="text-lg text-gray-600 mb-4">
                    총 {mode === 'buy' ? '구매' : '판매'} 금액: <span className="font-bold text-black">{(stock.currentPrice * quantity).toLocaleString()}권</span>
                </div>

                {error && (
                    <div className="w-full p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-auto">
                <button onClick={onClose} className="py-3 bg-gray-200 font-bold rounded-xl text-gray-700">취소</button>
                <button onClick={handleTrade} disabled={loading} className={`py-3 text-white font-bold rounded-xl ${mode === 'buy' ? 'bg-red-500' : 'bg-blue-500'}`}>
                    {loading ? '처리 중...' : '확인'}
                </button>
            </div>
        </div>
    );
};

const SavingsView: React.FC<{ currentUser: User, refreshAccount: () => void }> = ({ currentUser, refreshAccount }) => {
    const [products, setProducts] = useState<SavingsProduct[]>([]);
    const [mySavings, setMySavings] = useState<StudentSaving[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<SavingsProduct | null>(null);
    const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const prodList = await api.getSavingsProducts();
            setProducts(prodList);
            const myList = await api.getStudentSavings(currentUser.userId);
            setMySavings(myList);
        } catch (error) {
            console.error("Failed to fetch savings data", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser.userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleJoin = async (amount: number) => {
        if(!selectedProduct) return;
        try {
            await api.joinSavings(currentUser.userId, selectedProduct.id, amount);
            setSelectedProduct(null);
            fetchData();
            refreshAccount();
        } catch(e: any) { alert(e.message); }
    };

    const handleConfirmCancel = async () => {
        if(!cancelTargetId) return;
        try {
            await api.cancelSavings(currentUser.userId, cancelTargetId);
            fetchData();
            refreshAccount();
        } catch(e: any) { alert(e.message); }
        finally { setCancelTargetId(null); }
    };

    const requestCancel = (id: string) => {
        setCancelTargetId(id);
    };

    return (
        <div className="space-y-6">
            {/* 가입한 적금 목록 (가장 상단 배치) */}
            {mySavings.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 ml-1 flex items-center">
                        <CheckIcon className="w-5 h-5 mr-1 text-green-600"/> 내 적금 현황
                    </h3>
                    <div className="space-y-4">
                        {mySavings.map(s => {
                            const rate = s.product?.rate || 0;
                            const cancelRate = s.product?.cancellationRate || 0;
                            const maturityInterest = Math.floor(s.amount * rate);
                            const cancelRefund = Math.floor(s.amount * cancelRate);

                            // 해지 가능일 계산: 가입 기간의 2/3가 지나야 함
                            const joinTime = new Date(s.joinDate).getTime();
                            const maturityTime = new Date(s.maturityDate).getTime();
                            const duration = maturityTime - joinTime;
                            const possibleTime = joinTime + (duration * 2 / 3);
                            const canCancel = Date.now() >= possibleTime;
                            const possibleDateStr = new Date(possibleTime).toLocaleDateString();

                            return (
                                <div key={s.savingId} className="bg-white p-5 rounded-2xl shadow-sm border-l-8 border-green-500 overflow-hidden relative group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="font-extrabold text-xl text-gray-800 mb-1">{s.product?.name || '가입한 적금'}</div>
                                            <div className="text-xs text-gray-400">가입일: {new Date(s.joinDate).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <button 
                                                onClick={() => canCancel && requestCancel(s.savingId)} 
                                                disabled={!canCancel}
                                                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${canCancel ? 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500' : 'bg-gray-50 text-gray-200 cursor-not-allowed border border-gray-100'}`}
                                            >
                                                해지
                                            </button>
                                            {!canCancel && <span className="text-[9px] text-red-400 mt-1 font-bold">기간 미달</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 mb-1 font-medium">가입 원금</span>
                                            <span className="font-bold text-gray-800 text-lg">{s.amount.toLocaleString()}<span className="text-xs font-normal ml-0.5">권</span></span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 mb-1 font-medium">만기 예정일</span>
                                            <span className="font-bold text-blue-600">{new Date(s.maturityDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex flex-col p-3 bg-indigo-50 rounded-xl">
                                            <span className="text-[10px] text-indigo-400 mb-1 font-bold">만기 시 예상 이자 (+{(rate * 100).toFixed(0)}%)</span>
                                            <span className="font-extrabold text-indigo-600 text-base">+{maturityInterest.toLocaleString()}<span className="text-[10px] font-normal ml-0.5 text-indigo-400">권</span></span>
                                        </div>
                                        <div className="flex flex-col p-3 bg-red-50 rounded-xl">
                                            <span className="text-[10px] text-red-400 mb-1 font-bold">중도 해지 시 환급액 ({(cancelRate * 100).toFixed(0)}%)</span>
                                            <span className="font-extrabold text-red-600 text-base">{cancelRefund.toLocaleString()}<span className="text-[10px] font-normal ml-0.5 text-red-400">권</span></span>
                                            <span className={`text-[9px] mt-1 font-bold ${canCancel ? 'text-green-500' : 'text-red-400'}`}>
                                                {canCancel ? '✓ 현재 해지 가능' : `🔒 해지 가능일: ${possibleDateStr} 이후`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-300 italic">* 가입 기간의 2/3가 지나야 중도 해지가 가능합니다.</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading && <div className="text-center py-4 text-gray-400 text-sm">정보 업데이트 중...</div>}

            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 ml-1">가입 가능한 적금 상품</h3>
                <div className="grid grid-cols-1 gap-3">
                    {products.map(p => (
                        <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white p-5 rounded-xl shadow-sm cursor-pointer hover:bg-green-50 transition-colors border border-transparent hover:border-green-200">
                            <div className="font-bold text-lg mb-2 text-gray-800">{p.name}</div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>이자율</span>
                                <span className="font-bold text-green-600">{(p.rate * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mt-1">
                                <span>기간</span>
                                <span>{p.maturityDays}일</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mt-1">
                                <span>최대 가입 가능 금액</span>
                                <span>{p.maxAmount.toLocaleString()}권</span>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && !loading && <div className="text-center py-10 text-gray-400">현재 가입 가능한 적금 상품이 없습니다.</div>}
                </div>
            </div>

            {selectedProduct && (
                <JoinSavingsModal 
                    product={selectedProduct} 
                    onClose={() => setSelectedProduct(null)} 
                    onJoin={handleJoin} 
                />
            )}

            <ConfirmModal 
                isOpen={!!cancelTargetId}
                title="적금 해지"
                message="정말로 적금을 해지하시겠습니까? 중도 해지 시 약정된 이자를 받을 수 없으며 원금의 일부(해지이율 적용)만 돌려받을 수 있습니다."
                onConfirm={handleConfirmCancel}
                onCancel={() => setCancelTargetId(null)}
                confirmText="해지하기"
            />
        </div>
    );
};

const FundView: React.FC<{ currentUser: User, refreshAccount: () => void }> = ({ currentUser, refreshAccount }) => {
    const [funds, setFunds] = useState<Fund[]>([]);
    const [myInvestments, setMyInvestments] = useState<FundInvestment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFund, setSelectedFund] = useState<Fund | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [fundList, myInv] = await Promise.all([
                api.getFunds(),
                api.getMyFundInvestments(currentUser.userId)
            ]);
            setFunds(fundList);
            setMyInvestments(myInv);
        } catch (error) {
            console.error("Failed to fetch funds", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser.userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getStatusBadge = (status: FundStatus) => {
        switch (status) {
            case FundStatus.RECRUITING: return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">모집중</span>;
            case FundStatus.ONGOING: return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">운용중</span>;
            case FundStatus.SUCCESS: return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">달성 완료</span>;
            case FundStatus.EXCEED: return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">초과 달성</span>;
            case FundStatus.FAIL: return <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">실패</span>;
            default: return null;
        }
    };

    if (loading) return <div className="text-center p-8">펀드 정보를 불러오는 중...</div>;

    return (
        <div className="space-y-6">
            {myInvestments.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">내 투자 현황</h3>
                    <div className="space-y-3">
                        {myInvestments.map(inv => (
                            <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold">{inv.fund?.name}</div>
                                    {inv.fund && getStatusBadge(inv.fund.status)}
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>투자 금액</span>
                                    <span className="font-bold">{(inv.units * (inv.fund?.unitPrice || 0)).toLocaleString()}권 ({inv.units}좌)</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>평가일</span>
                                    <span className="text-blue-600">{inv.fund?.maturityDate ? new Date(inv.fund.maturityDate).toLocaleDateString() : '-'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">투자 가능한 펀드</h3>
                <div className="grid grid-cols-1 gap-3">
                    {funds.map(f => (
                        <div key={f.id} onClick={() => f.status === FundStatus.RECRUITING && setSelectedFund(f)} className={`bg-white p-5 rounded-xl shadow-sm transition-colors ${f.status === FundStatus.RECRUITING ? 'cursor-pointer hover:bg-green-50' : 'opacity-70'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-lg">{f.name}</div>
                                {getStatusBadge(f.status)}
                            </div>
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{f.description}</p>
                            
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>1좌 가격</span>
                                <span className="font-bold">{f.unitPrice.toLocaleString()}권</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mt-1">
                                <span>모집 마감</span>
                                <span>{new Date(f.recruitmentDeadline).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mt-1">
                                <span>성공 보상</span>
                                <span className="text-blue-600">+{f.baseReward.toLocaleString()}권/좌</span>
                            </div>
                        </div>
                    ))}
                    {funds.length === 0 && <div className="text-center text-gray-500 py-4">현재 모집 중인 펀드가 없습니다.</div>}
                </div>
            </div>

            {selectedFund && (
                <JoinFundModal 
                    fund={selectedFund} 
                    userId={currentUser.userId}
                    onClose={() => setSelectedFund(null)} 
                    onComplete={() => {
                        fetchData();
                        refreshAccount();
                    }} 
                />
            )}
        </div>
    );
};

const JoinFundModal: React.FC<{
    fund: Fund;
    onClose: () => void;
    onComplete: () => void;
    userId: string;
}> = ({ fund, onClose, onComplete, userId }) => {
    const [units, setUnits] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleJoin = async () => {
        if (units <= 0) {
            setResult({ type: 'error', text: '1좌 이상 투자해야 합니다.' });
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const message = await api.joinFund(userId, fund.id, units);
            setResult({ type: 'success', text: message });
            setTimeout(() => onComplete(), 1500);
        } catch (err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const totalCost = units * fund.unitPrice;
    const expectedReward = units * fund.baseReward;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2">{fund.name}</h3>
                <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                    {fund.description}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                    <p className="font-medium text-gray-700">투자 수량 (좌)</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setUnits(u => Math.max(1, u - 1))} className="p-1 border rounded-full"><MinusIcon className="w-5 h-5"/></button>
                        <input type="number" value={units} onChange={e => setUnits(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-center font-bold text-lg border-b-2"/>
                        <button onClick={() => setUnits(u => u + 1)} className="p-1 border rounded-full"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">1좌 가격</span>
                        <span>{fund.unitPrice.toLocaleString()}권</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>총 투자 금액</span>
                        <span className="text-blue-600">{totalCost.toLocaleString()}권</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-green-600 mt-2">
                        <span>성공 시 예상 수익</span>
                        <span>+{expectedReward.toLocaleString()}권 (총 {(totalCost + expectedReward).toLocaleString()}권)</span>
                    </div>
                </div>

                {result && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <ErrorIcon className="w-5 h-5 mr-2" />}
                        <p className="text-sm">{result.text}</p>
                    </div>
                )}
                
                <button onClick={handleJoin} disabled={loading} className="w-full p-3 font-bold rounded-lg text-white mt-4 bg-indigo-600 shadow-md">
                    {loading ? '투자 처리 중...' : '투자하기'}
                </button>
            </div>
        </div>
    );
};

const JoinSavingsModal: React.FC<{ product: SavingsProduct, onClose: ()=>void, onJoin: (amount: number)=>void }> = ({product, onClose, onJoin}) => {
    const [amount, setAmount] = useState('');
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                <h3 className="text-xl font-bold mb-2">{product.name} 가입</h3>
                <p className="text-sm text-gray-500 mb-4">
                    {product.maturityDays}일 뒤에 이자 {(product.rate * 100).toFixed(0)}%가 추가되어 지급됩니다.<br/>
                    중도 해지 시 {(product.cancellationRate * 100).toFixed(0)}%의 수수료가 발생합니다.
                </p>
                
                <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder={`최대 ${product.maxAmount}권`}
                    className="w-full p-3 border rounded-lg mb-4"
                />
                
                <button 
                    onClick={() => {
                        const val = parseInt(amount);
                        if(val > 0 && val <= product.maxAmount) onJoin(val);
                        else alert('올바른 금액을 입력하세요.');
                    }} 
                    className="w-full p-3 bg-green-600 text-white font-bold rounded-lg mb-2"
                >
                    가입하기
                </button>
                <button onClick={onClose} className="w-full p-3 text-gray-500">취소</button>
            </div>
        </div>
    );
};

export default StudentPage;
