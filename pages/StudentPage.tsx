
/* ... imports ... */
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Account, Transaction, StockProduct, StudentStock, SavingsProduct, StudentSaving, User, Role, Job, StockHistory, Fund, FundInvestment, FundStatus } from '../types';
import { HomeIcon, TransferIcon, NewStockIcon, NewPiggyBankIcon, BackIcon, XIcon, CheckIcon, ErrorIcon, PlusIcon, MinusIcon, NewJobIcon, NewTaxIcon, LogoutIcon, NewFundIcon, ArrowUpIcon, ArrowDownIcon, NewspaperIcon } from '../components/icons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type View = 'home' | 'transfer' | 'stocks' | 'savings' | 'funds';
type NotificationType = { type: 'success' | 'error', text: string };

interface StudentPageProps {
    initialView?: string;
    onBackToMenu?: () => void;
}

// --- Common Components ---

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
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm">
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
            <div className="bg-white rounded-xl shadow-2xl p-6 max-sm flex flex-col items-center text-center">
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

// --- Sub-Views ---

const HomeView: React.FC<{ account: Account, currentUser: User, refreshAccount: () => void, showNotification: (type: 'success'|'error', text: string) => void }> = ({ account, currentUser, refreshAccount, showNotification }) => {
    const alias = currentUser?.teacherAlias || '권쌤';
    const unit = currentUser?.currencyUnit || '권';
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
            showNotification('error', `잔액이 부족하여 세금을 납부할 수 없습니다.`);
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
                <h2 className="text-4xl font-extrabold text-gray-800">{Math.floor(totalAssets).toLocaleString()}<span className="text-2xl ml-1 font-normal text-gray-600">{unit}</span></h2>
                
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-50">
                    <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">현금</div>
                        <div className="font-bold text-gray-700">{account.balance.toLocaleString()}</div>
                    </div>
                    <div className="text-center border-l border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">주식</div>
                        <div className="font-bold text-blue-600">{Math.floor(stockValue).toLocaleString()}</div>
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
                                    <span className="font-bold text-red-600">{tax.amount.toLocaleString()}{unit}</span>
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
                        <div key={t.transactionId} className="p-4 border-b last:0 flex justify-between items-center">
                            <div>
                                <div className="font-medium text-gray-800">{t.description}</div>
                                <div className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</div>
                            </div>
                            <div className={`font-bold ${t.amount > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && <div className="p-8 text-center text-gray-400">최근 활동 내역이 없습니다.</div>}
                    {transactions.length > visibleCount && (
                        <button onClick={() => setVisibleCount(v => v + 5)} className="w-full py-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">더보기</button>
                    )}
                </div>
            </div>

            <ConfirmModal 
                isOpen={!!taxToPay}
                title="세금 납부"
                message={`'${taxToPay?.name}' 세금 ${taxToPay?.amount.toLocaleString()}${unit}을 납부하시겠습니까?`}
                onConfirm={handleConfirmPayment}
                onCancel={() => setTaxToPay(null)}
                confirmText="납부하기"
            />
        </div>
    );
};

const TransferView: React.FC<{ currentUser: User, account: Account, refreshAccount: () => void, showNotification: (type: 'success' | 'error', text: string) => void }> = ({ currentUser, account, refreshAccount, showNotification }) => {
    const [targetType, setTargetType] = useState<'mart' | 'student' | 'teacher'>('mart');
    const [targetAccountId, setTargetAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);

    const alias = currentUser?.teacherAlias || '권쌤';
    const unit = currentUser?.currencyUnit || '권';

    const safeHandleTransfer = async () => {
        if (!amount || parseInt(amount) <= 0) return;
        setLoading(true);
        try {
             if (targetType === 'teacher') {
                const teacherAcc = await api.getTeacherAccount();
                if (!teacherAcc) throw new Error(`${alias} 계좌를 찾을 수 없습니다.`);
                await api.transfer(currentUser.userId, teacherAcc.accountId, parseInt(amount), memo || `${alias}께 송금`);
             } else if (targetType === 'mart') {
                const martUsers = await api.getUsersByRole(Role.MART, currentUser.teacher_id || '');
                if (!martUsers || martUsers.length === 0) throw new Error("마트 계좌를 찾을 수 없습니다.");
                const martAcc = await api.getStudentAccountByUserId(martUsers[0].userId);
                if (!martAcc) throw new Error("마트 계좌를 찾을 수 없습니다.");
                await api.transfer(currentUser.userId, martAcc.accountId, parseInt(amount), memo || '마트 결제');
             } else {
                 const fullId = `권쌤은행 ${targetAccountId}`;
                 const details = await api.getRecipientDetailsByAccountId(fullId);
                 if(!details) throw new Error("받는 사람 계좌가 존재하지 않습니다.");
                 await api.transfer(currentUser.userId, details.account.accountId, parseInt(amount), memo || '송금');
             }
             showNotification('success', '송금이 완료되었습니다.');
             setAmount(''); setMemo(''); setTargetAccountId(''); refreshAccount();
        } catch (e: any) {
             showNotification('error', e.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">송금하기</h2>
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button onClick={() => setTargetType('mart')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${targetType === 'mart' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>마트</button>
                <button onClick={() => setTargetType('student')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${targetType === 'student' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>친구에게</button>
                <button onClick={() => setTargetType('teacher')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${targetType === 'teacher' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>{alias}께</button>
            </div>
            <div className="space-y-4">
                {targetType === 'teacher' && (
                    <div className="bg-indigo-50 p-4 rounded-xl flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">T</div>
                        <div><div className="font-bold text-gray-800">담임 {alias}</div><div className="text-xs text-gray-500">국고 계좌</div></div>
                    </div>
                )}
                {targetType === 'student' && (
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">받는 친구 계좌번호</label>
                         <div className="flex">
                             <span className="p-3 bg-gray-100 border border-r-0 rounded-l-lg text-gray-400 font-medium whitespace-nowrap">권쌤은행</span>
                             <input type="text" value={targetAccountId} onChange={e => setTargetAccountId(e.target.value)} className="w-full p-3 border rounded-r-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="000-000" />
                         </div>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">보낼 금액</label>
                    <div className="relative">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg" placeholder="0" />
                        <span className="absolute right-3 top-3.5 text-gray-500 font-medium">{unit}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 text-right">잔액: {account.balance.toLocaleString()}{unit}</div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">메모 (선택)</label>
                    <input type="text" value={memo} onChange={e => setMemo(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="송금 메모를 입력하세요" />
                </div>
            </div>
            <button onClick={safeHandleTransfer} disabled={loading} className="w-full mt-8 p-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-all active:scale-95">
                {loading ? '보내는 중...' : '보내기'}
            </button>
        </div>
    );
};

// --- Main StudentPage Component ---

const StudentPage: React.FC<StudentPageProps> = ({ initialView, onBackToMenu }) => {
    const { currentUser, logout } = useContext(AuthContext);
    const [view, setView] = useState<View>((initialView as View) || 'home');
    const [account, setAccount] = useState<Account | null>(null);
    const [notification, setNotification] = useState<NotificationType | null>(null);

    const handleLogout = onBackToMenu || logout;

    const refreshAccount = useCallback(async () => {
        if (!currentUser) return;
        try {
            const acc = await api.getStudentAccountByUserId(currentUser.userId);
            setAccount(acc);
        } catch (e) {
            console.error(e);
        }
    }, [currentUser]);

    useEffect(() => {
        refreshAccount();
    }, [refreshAccount]);

    const showNotification = (type: 'success' | 'error', text: string) => {
        setNotification({ type, text });
    };

    if (!currentUser || !account) return null;

    const renderView = () => {
        switch (view) {
            case 'home': return <HomeView account={account} currentUser={currentUser} refreshAccount={refreshAccount} showNotification={showNotification} />;
            case 'transfer': return <TransferView currentUser={currentUser} account={account} refreshAccount={refreshAccount} showNotification={showNotification} />;
            default: return <HomeView account={account} currentUser={currentUser} refreshAccount={refreshAccount} showNotification={showNotification} />;
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
            <header className="bg-white px-6 py-4 flex justify-between items-center border-b sticky top-0 z-20">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{currentUser.name}</h1>
                    <p className="text-xs text-gray-500">{currentUser.grade}학년 {currentUser.class}반 {currentUser.number}번</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <LogoutIcon className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-grow overflow-y-auto p-4 md:p-8 pb-24">
                {renderView()}
            </main>

            <nav className="bg-white border-t border-gray-100 flex justify-around p-2 sticky bottom-0 z-20">
                <button onClick={() => setView('home')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${view === 'home' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}>
                    <HomeIcon className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">홈</span>
                </button>
                <button onClick={() => setView('transfer')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${view === 'transfer' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}>
                    <TransferIcon className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">송금</span>
                </button>
            </nav>

            <MessageModal 
                isOpen={!!notification}
                type={notification?.type || 'success'}
                message={notification?.text || ''}
                onClose={() => setNotification(null)}
            />
        </div>
    );
};

export default StudentPage;
