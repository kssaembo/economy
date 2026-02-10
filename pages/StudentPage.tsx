import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
    Account, Transaction, StockProduct, StudentStock, SavingsProduct, 
    StudentSaving, User, Role, StockHistory, Fund, FundInvestment, FundStatus 
} from '../types';
import { 
    HomeIcon, TransferIcon, NewStockIcon, NewPiggyBankIcon, BackIcon, 
    XIcon, CheckIcon, ErrorIcon, PlusIcon, MinusIcon, NewTaxIcon, 
    LogoutIcon, NewFundIcon, NewspaperIcon, StudentIcon 
} from '../components/icons';
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
                    <button onClick={onConfirm} className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentSelectionView: React.FC<{ students: User[], onSelect: (s: User) => void }> = ({ students, onSelect }) => {
    return (
        <div className="p-4 flex flex-col h-full bg-[#F2F4F7]">
            <h2 className="text-2xl font-black text-gray-900 mb-6 px-2 tracking-tight">학생을 선택하세요</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {students.map(s => (
                    <button 
                        key={s.userId} 
                        onClick={() => onSelect(s)}
                        className="p-4 bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center aspect-square hover:shadow-xl hover:scale-105 transition-all border border-transparent hover:border-indigo-100 active:scale-95 group"
                    >
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                             <StudentIcon className="w-7 h-7 text-indigo-500" />
                        </div>
                        <span className="font-bold text-gray-900 text-sm truncate w-full text-center">{s.name}</span>
                        <span className="text-[10px] text-gray-400 mt-1 font-black">{s.number}번</span>
                    </button>
                ))}
            </div>
            {students.length === 0 && (
                <div className="flex-grow flex flex-col items-center justify-center py-20">
                    <ErrorIcon className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold">등록된 학생이 없습니다.</p>
                </div>
            )}
        </div>
    );
};

// --- Sub-Views ---

const HomeView: React.FC<{ account: Account, currentUser: User, refreshAccount: () => void, showNotification: (type: 'success'|'error', text: string) => void }> = ({ account, currentUser, refreshAccount, showNotification }) => {
    // 화폐 단위 로직: DB 데이터가 우선, 없으면 기본값 '권'
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
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <p className="text-gray-800 mb-2 font-black text-sm">내 총 자산</p>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                    {Math.floor(totalAssets).toLocaleString()}<span className="text-2xl ml-1 font-black text-gray-800">{unit}</span>
                </h2>
                
                <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100">
                    <div className="text-center">
                        <div className="text-xs text-gray-800 font-black mb-1">현금</div>
                        <div className="font-black text-gray-900 text-lg">{account.balance.toLocaleString()}</div>
                    </div>
                    <div className="text-center border-l border-gray-100">
                        <div className="text-xs text-gray-800 font-black mb-1">주식</div>
                        <div className="font-black text-blue-700 text-lg">{Math.floor(stockValue).toLocaleString()}</div>
                    </div>
                     <div className="text-center border-l border-gray-100">
                        <div className="text-xs text-gray-800 font-black mb-1">적금</div>
                        <div className="font-black text-green-700 text-lg">{savingsValue.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {unpaidTaxes.length > 0 && (
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                    <h3 className="font-black text-red-700 mb-4 flex items-center tracking-tight text-lg">
                        <NewTaxIcon className="w-6 h-6 mr-2"/> 미납 세금 고지서
                    </h3>
                    <div className="space-y-3">
                        {unpaidTaxes.map(tax => (
                            <div key={tax.recipientId} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
                                <div>
                                    <span className="font-black text-gray-900">{tax.name}</span>
                                    <span className="text-xs text-gray-700 ml-2 font-bold">~{new Date(tax.dueDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-red-600">{tax.amount.toLocaleString()}{unit}</span>
                                    <button 
                                        onClick={() => setTaxToPay({ taxId: tax.taxId, amount: tax.amount, name: tax.name })} 
                                        className="px-4 py-2 bg-red-600 text-white text-xs rounded-full font-bold hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-100"
                                    >
                                        납부
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 ml-1 tracking-tight">최근 활동</h3>
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                    {transactions.slice(0, visibleCount).map(t => (
                        <div key={t.transactionId} className="p-5 border-b last:border-0 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div>
                                <div className="font-black text-gray-900 text-sm">{t.description}</div>
                                <div className="text-[11px] text-gray-700 font-bold mt-1 uppercase">{new Date(t.date).toLocaleString()}</div>
                            </div>
                            <div className={`font-black text-lg ${t.amount > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && <div className="p-12 text-center text-gray-500 font-black">활동 내역이 없습니다.</div>}
                    {transactions.length > visibleCount && (
                        <button 
                            onClick={() => setVisibleCount(v => v + 5)} 
                            className="w-full py-5 text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-all border-t border-gray-100 active:bg-indigo-100"
                        >
                            활동 내역 더보기
                        </button>
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
    const unit = currentUser?.currencyUnit || '권';
    const [targetType, setTargetType] = useState<'mart' | 'student' | 'teacher'>('mart');
    const [targetAccountId, setTargetAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);
    const [recipientInfo, setRecipientInfo] = useState<{name: string, grade: number, class: number, number: number} | null>(null);

    const bankName = useMemo(() => {
        if (!account.accountId) return '선생님은행';
        const parts = account.accountId.split(' ');
        if (parts.length > 1) return parts[0];
        return '선생님은행';
    }, [account.accountId]);

    const alias = currentUser?.teacherAlias || bankName.replace('은행', '') || '선생님';

    useEffect(() => {
        if(targetType === 'student' && targetAccountId.length >= 3) {
            const timer = setTimeout(async () => {
                try {
                    const fullId = `${bankName} ${targetAccountId}`;
                    const details = await api.getRecipientDetailsByAccountId(fullId);
                    if(details) {
                        setRecipientInfo({
                            name: details.user.name,
                            grade: details.user.grade || 0,
                            class: details.user.class || 0,
                            number: details.user.number || 0
                        });
                    } else { setRecipientInfo(null); }
                } catch(e) { setRecipientInfo(null); }
            }, 500);
            return () => clearTimeout(timer);
        } else { setRecipientInfo(null); }
    }, [targetAccountId, targetType, bankName]);

    const safeHandleTransfer = async () => {
        if (!amount || parseInt(amount) <= 0) return;
        setLoading(true);
        try {
             if (targetType === 'teacher') {
                const teacherAcc = await api.getTeacherAccount();
                if (!teacherAcc) throw new Error(`선생님 계좌를 찾을 수 없습니다.`);
                await api.transfer(currentUser.userId, teacherAcc.accountId, parseInt(amount), memo || `${alias}께 송금`);
             } else if (targetType === 'mart') {
                const teacherId = currentUser.teacher_id;
                if (!teacherId) throw new Error("선생님 정보를 찾을 수 없습니다.");
                const martAcc = await api.getMartAccountByTeacherId(teacherId);
                if (!martAcc) throw new Error("학급 마트 계좌를 찾을 수 없습니다.");
                await api.transfer(currentUser.userId, martAcc.accountId, parseInt(amount), memo || '마트 결제');
             } else {
                 const fullId = `${bankName} ${targetAccountId}`;
                 const details = await api.getRecipientDetailsByAccountId(fullId);
                 if(!details) throw new Error("받는 사람 계좌가 존재하지 않습니다.");
                 await api.transfer(currentUser.userId, details.account.accountId, parseInt(amount), memo || '송금');
             }
             showNotification('success', '송금이 완료되었습니다.');
             setAmount(''); setMemo(''); setTargetAccountId(''); setRecipientInfo(null); refreshAccount();
        } catch (e: any) {
             showNotification('error', e.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 max-w-md mx-auto">
            <h2 className="text-2xl font-black mb-8 text-gray-900 tracking-tight">송금하기</h2>
            
            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
                <button onClick={() => setTargetType('mart')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${targetType === 'mart' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-800'}`}>마트</button>
                <button onClick={() => setTargetType('student')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${targetType === 'student' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-800'}`}>친구에게</button>
                <button onClick={() => setTargetType('teacher')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${targetType === 'teacher' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-800'}`}>선생님께(국고)</button>
            </div>

            <div className="space-y-6">
                {targetType === 'teacher' ? (
                    <div className="bg-indigo-50 p-5 rounded-2xl flex items-center border border-indigo-100 animate-fadeIn">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-black mr-4 shadow-lg shadow-indigo-100 text-xl">T</div>
                        <div>
                            <div className="font-black text-gray-900">선생님 계좌</div>
                            <div className="text-xs text-indigo-700 font-bold uppercase tracking-tighter">국고 공식 계좌</div>
                        </div>
                    </div>
                ) : targetType === 'mart' ? (
                    <div className="bg-orange-50 p-5 rounded-2xl flex items-center border border-orange-100 animate-fadeIn">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black mr-4 shadow-lg shadow-orange-100 text-xl">M</div>
                        <div>
                            <div className="font-black text-gray-900">학교 마트</div>
                            <div className="text-xs text-orange-700 font-bold uppercase tracking-tighter">마트 공식 계좌</div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-black text-gray-800 mb-2 ml-1 uppercase">받는 친구 계좌번호</label>
                        <div className="flex">
                            <span className="p-4 bg-gray-100 border border-r-0 rounded-l-2xl text-gray-700 font-black text-sm whitespace-nowrap">{bankName}</span>
                            <input type="text" value={targetAccountId} onChange={e => setTargetAccountId(e.target.value)} className="w-full p-4 border rounded-r-2xl outline-none focus:ring-4 focus:ring-indigo-50/50 font-bold text-gray-900" placeholder="000-000" />
                        </div>
                        {recipientInfo && (
                            <div className="mt-2 text-xs text-indigo-800 font-bold flex items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100 animate-fadeIn">
                                <CheckIcon className="w-4 h-4 mr-2"/>
                                {recipientInfo.grade}-{recipientInfo.class} {recipientInfo.number} {recipientInfo.name}님께 보냅니다.
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-black text-gray-800 mb-2 ml-1 uppercase">보낼 금액</label>
                    <div className="relative">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-5 pr-12 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 outline-none font-black text-2xl tracking-tight text-gray-900" placeholder="0" />
                        <span className="absolute right-5 top-5 text-gray-800 font-black text-lg">{unit}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-800 font-black text-right">내 잔액: {account.balance.toLocaleString()}{unit}</div>
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-800 mb-2 ml-1 uppercase">메모 (선택)</label>
                    <input type="text" value={memo} onChange={e => setMemo(e.target.value)} className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50/50 font-bold text-gray-900" placeholder="송금 메모를 입력하세요" />
                </div>
            </div>

            <button 
                onClick={safeHandleTransfer} 
                disabled={loading || !amount || (targetType === 'student' && !recipientInfo)} 
                className="w-full mt-10 p-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none transition-all active:scale-[0.98] text-lg"
            >
                {loading ? '보내는 중...' : '송금하기'}
            </button>
        </div>
    );
};

// --- Stock Transaction Modal ---
const StockTransactionModal: React.FC<{ 
    mode: 'buy' | 'sell', 
    stock: StockProduct, 
    userId: string, 
    ownedQuantity: number, 
    unit: string, 
    onClose: () => void, 
    onComplete: (msg: string) => void 
}> = ({ mode, stock, userId, ownedQuantity, unit, onClose, onComplete }) => {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const calcTrade = useMemo(() => {
        const vol = stock.volatility || 0.01;
        const oldP = stock.currentPrice;
        
        if (mode === 'buy') {
            const newP = oldP * Math.exp(vol * quantity);
            const execP = (oldP + newP) / 2;
            const finalCost = Math.ceil(execP * quantity);
            return { execPrice: execP, feeRate: 0, feeAmount: 0, finalAmount: finalCost };
        } else {
            const newP = Math.max(1, oldP * Math.exp(-vol * quantity));
            const execP = (oldP + newP) / 2;
            const impactPct = ((oldP - newP) / oldP) * 100;
            
            let feeRate = (impactPct * 1.05) + 2.0;
            if (feeRate < 2.0) feeRate = 2.0;
            if (feeRate > 33.5) feeRate = 33.5;
            
            const grossVal = execP * quantity;
            const feeAmt = Math.ceil(grossVal * (feeRate / 100));
            const finalPayout = Math.floor(grossVal - feeAmt);
            
            return { execPrice: execP, feeRate: parseFloat(feeRate.toFixed(1)), feeAmount: feeAmt, finalAmount: finalPayout };
        }
    }, [mode, stock, quantity]);

    const handleTrade = async () => {
        setLoading(true);
        setError(null);
        try {
            const message = mode === 'buy' 
                ? await api.buyStock(userId, stock.id, quantity)
                : await api.sellStock(userId, stock.id, quantity);
            onComplete(message);
        } catch (e: any) {
            setError(e.message);
            setShowConfirm(false);
        } finally {
            setLoading(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="absolute inset-0 bg-white z-[110] flex flex-col animate-fadeIn rounded-[40px]">
                <div className="flex-grow overflow-y-auto p-8 pt-12 flex flex-col">
                    <h3 className="text-2xl font-black mb-2 text-center text-gray-900">주식 {mode === 'buy' ? '매수' : '매도'} 확인</h3>
                    <p className="text-red-600 text-xs font-bold mb-8 text-center leading-tight">
                        {mode === 'buy' 
                            ? '* 체결 과정에서 발생하는 소수점 금액은 "올림" 처리되어 인출됩니다.' 
                            : '* 체결 과정에서 발생하는 소수점 금액은 "버림" 처리되어 입금됩니다.'}
                    </p>
                    <div className="bg-gray-50 p-8 rounded-[32px] space-y-5 border border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-bold">종목</span>
                            <span className="font-black text-gray-900">{stock.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-bold">거래 수량</span>
                            <span className="font-black text-gray-900">{quantity}주</span>
                        </div>
                        <div className="border-t border-gray-300 pt-5 flex justify-between items-center">
                            <span className="text-gray-700 font-bold">평균 체결 예상가</span>
                            <span className="font-black text-gray-900">{calcTrade.execPrice.toFixed(2)}{unit}</span>
                        </div>
                        {mode === 'sell' && (
                            <>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 font-bold">수수료율 ({calcTrade.feeRate}%)</span>
                                    <span className="font-black text-red-600">-{calcTrade.feeAmount.toLocaleString()}{unit}</span>
                                </div>
                            </>
                        )}
                        <div className="border-t border-gray-300 pt-5 flex justify-between items-center">
                            <span className="text-gray-900 font-black text-lg">최종 {mode === 'buy' ? '결제' : '입금'} 예정액</span>
                            <span className="text-3xl font-black text-indigo-600">{calcTrade.finalAmount.toLocaleString()}{unit}</span>
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-white border-t border-gray-100 grid grid-cols-2 gap-4">
                    <button onClick={() => setShowConfirm(false)} className="py-5 bg-gray-100 font-black rounded-3xl text-gray-600 active:scale-[0.98] transition-all">취소</button>
                    <button onClick={handleTrade} disabled={loading} className={`py-5 text-white font-black rounded-3xl shadow-xl transition-all active:scale-[0.98] ${mode === 'buy' ? 'bg-red-600 shadow-red-100' : 'bg-blue-600 shadow-blue-100'}`}>
                        {loading ? '처리 중...' : '확정하기'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-white z-[110] flex flex-col animate-fadeIn rounded-[40px]">
            <div className="flex-grow overflow-y-auto p-8 pt-16 flex flex-col items-center">
                <h3 className="text-2xl font-black mb-8 text-center text-gray-900">{mode === 'buy' ? '얼마나 살까요?' : '얼마나 팔까요?'}</h3>
                
                {mode === 'sell' && (
                    <div className="mb-6 px-5 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black">
                        보유 중인 주식: {ownedQuantity}주
                    </div>
                )}

                <div className="text-gray-700 font-black mb-2 uppercase tracking-widest">{stock.name}</div>
                <div className="text-4xl font-black mb-12 text-gray-900">{stock.currentPrice.toLocaleString()}{unit}</div>
                
                <div className="flex items-center gap-8 mb-12">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 active:scale-[0.9] transition-all"><MinusIcon className="w-7 h-7 text-gray-600"/></button>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={quantity} 
                            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                            className="w-24 text-center font-black text-5xl bg-transparent outline-none border-b-4 border-indigo-100 focus:border-indigo-500 transition-colors text-gray-900"
                        />
                        <span className="absolute -right-6 bottom-2 font-black text-gray-400">주</span>
                    </div>
                    <button onClick={() => setQuantity(mode === 'sell' ? Math.min(ownedQuantity, quantity + 1) : quantity + 1)} className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 active:scale-[0.9] transition-all"><PlusIcon className="w-7 h-7 text-indigo-600"/></button>
                </div>

                <div className="w-full max-w-sm space-y-4">
                    {mode === 'buy' ? (
                        <div className="text-center p-6 bg-gray-50 rounded-[28px] border border-gray-100">
                            <div className="text-xs text-gray-700 font-black mb-2 uppercase">총 구매 예정 금액</div>
                            <div className="text-3xl font-black text-gray-900">{calcTrade.finalAmount.toLocaleString()}{unit}</div>
                            <div className="text-[10px] text-indigo-600 mt-3 font-bold">* 소수점 올림 정산이 포함된 금액입니다.</div>
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-50 rounded-[28px] space-y-3 border border-gray-100">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 font-bold">예상 체결가</span>
                                <span className="font-black text-red-600">{calcTrade.execPrice.toFixed(2)}{unit}</span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 font-bold">예상 수수료 ({calcTrade.feeRate}%)</span>
                                <span className="font-black text-gray-800">-{calcTrade.feeAmount.toLocaleString()}{unit}</span>
                            </div>
                             <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                <span className="font-black text-gray-900">입금 예정액</span>
                                <span className="font-black text-indigo-600 text-xl">{calcTrade.finalAmount.toLocaleString()}{unit}</span>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="w-full mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center border border-red-100 animate-pulse">
                        {error}
                    </div>
                )}
            </div>
            <div className="p-8 bg-white border-t border-gray-100 grid grid-cols-2 gap-4">
                <button onClick={onClose} className="py-5 bg-gray-100 font-black rounded-3xl text-gray-700 hover:bg-gray-200 transition-all">취소</button>
                <button 
                    onClick={() => {
                        const val = Number(quantity);
                        if (mode === 'sell' && (ownedQuantity <= 0 || val > ownedQuantity)) {
                            return;
                        }
                        setShowConfirm(true);
                    }} 
                    disabled={mode === 'sell' && (ownedQuantity <= 0 || quantity > ownedQuantity)}
                    className="py-5 bg-black text-white font-black rounded-3xl hover:bg-gray-900 transition-all active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-500"
                >
                    다음 단계
                </button>
            </div>
        </div>
    );
};

const StocksView: React.FC<{ currentUser: User, refreshAccount: () => void, showNotification: (type: 'success' | 'error', text: string) => void }> = ({ currentUser, refreshAccount, showNotification }) => {
    const unit = currentUser?.currencyUnit || '권';
    const [stocks, setStocks] = useState<StockProduct[]>([]);
    const [myStocks, setMyStocks] = useState<StudentStock[]>([]);
    const [selectedStock, setSelectedStock] = useState<(StockProduct & { mode?: 'buy' | 'sell' }) | null>(null);
    const [history, setHistory] = useState<StockHistory[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'my'>('list');

    const fetchData = useCallback(async () => {
        const stockList = await api.getStockProducts(currentUser.teacher_id || '');
        setStocks(stockList);
        const myStockList = await api.getStudentStocks(currentUser.userId);
        setMyStocks(myStockList);
    }, [currentUser.teacher_id, currentUser.userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleStockClick = async (stock: StockProduct) => {
        setSelectedStock(stock);
        const hist = await api.getStockHistory(stock.id);
        setHistory(hist);
    };

    const currentOwned = useMemo(() => {
        if (!selectedStock) return 0;
        return myStocks.find(ms => ms.stockId === selectedStock.id)?.quantity || 0;
    }, [selectedStock, myStocks]);

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex bg-gray-200 p-1 rounded-2xl flex-shrink-0">
                <button onClick={() => setViewMode('list')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-800'}`}>주식 시장</button>
                <button onClick={() => setViewMode('my')} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${viewMode === 'my' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-800'}`}>내 주식</button>
            </div>

            <div className="flex-grow space-y-3">
                {viewMode === 'list' ? (
                    stocks.map(s => (
                        <button key={s.id} onClick={() => handleStockClick(s)} className="w-full bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex justify-between items-center group">
                            <span className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{s.name}</span>
                            <div className="text-right">
                                <div className="font-black text-lg text-gray-900">{s.currentPrice.toLocaleString()}{unit}</div>
                                <div className="text-[10px] text-gray-700 font-bold uppercase">현재가</div>
                            </div>
                        </button>
                    ))
                ) : (
                    myStocks.map(ms => {
                        const currentVal = ms.quantity * (ms.stock?.currentPrice || 0);
                        const buyVal = ms.quantity * ms.purchasePrice;
                        const profit = currentVal - buyVal;
                        const profitRate = buyVal > 0 ? (profit / buyVal) * 100 : 0;
                        return (
                            <button key={ms.stockId} onClick={() => ms.stock && handleStockClick(ms.stock)} className="w-full bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 text-left hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-black text-xl text-gray-900">{ms.stock?.name}</span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 font-black text-[10px] rounded-full">{ms.quantity}주 보유</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-[10px] text-gray-700 font-black uppercase mb-1">평가손익</div>
                                        <div className={`font-black text-lg ${profit >= 0 ? 'text-red-600' : 'text-blue-700'}`}>
                                            {profit > 0 ? '+' : ''}{profit.toLocaleString()} ({profitRate.toFixed(2)}%)
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-700 font-black uppercase mb-1">평가금액</div>
                                        <div className="font-black text-2xl text-gray-900">{currentVal.toLocaleString()}{unit}</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
                {viewMode === 'my' && myStocks.length === 0 && <div className="p-20 text-center text-gray-500 font-black">보유한 주식이 없습니다.</div>}
            </div>

            {selectedStock && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fadeIn" onClick={() => setSelectedStock(null)}>
                    <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-2xl text-gray-900 tracking-tight">{selectedStock.name}</h3>
                                <p className="text-xs text-indigo-700 font-black">현재 보유: {currentOwned}주</p>
                            </div>
                            <button onClick={() => setSelectedStock(null)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><XIcon className="w-6 h-6 text-gray-600"/></button>
                        </div>
                        
                        <div className="p-6 h-48 w-full bg-gray-50">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <XAxis dataKey="createdAt" hide />
                                    <YAxis domain={['auto', 'auto']} hide />
                                    <Tooltip labelFormatter={() => ''} formatter={(val: number) => [`${val.toLocaleString()}${unit}`, '가격']} />
                                    <Line type="monotone" dataKey="price" stroke="#4F46E5" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="p-8 bg-white space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-black uppercase text-sm">현재가</span>
                                <span className="text-3xl font-black text-gray-900">{selectedStock.currentPrice.toLocaleString()}{unit}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button 
                                    onClick={() => setSelectedStock({ ...selectedStock, mode: 'buy' })}
                                    className="py-5 bg-red-50 text-red-700 font-black rounded-3xl hover:bg-red-100 transition-all active:scale-[0.98] text-lg"
                                >
                                    주식 매수 (사기)
                                </button>
                                <button 
                                    onClick={() => setSelectedStock({ ...selectedStock, mode: 'sell' })}
                                    disabled={currentOwned === 0}
                                    className="py-5 bg-blue-50 text-blue-700 font-black rounded-3xl hover:bg-blue-100 transition-all active:scale-[0.98] text-lg disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-500"
                                >
                                    주식 매도 (팔기)
                                </button>
                            </div>
                        </div>

                        {selectedStock.mode && (
                            <StockTransactionModal 
                                mode={selectedStock.mode}
                                stock={selectedStock}
                                userId={currentUser.userId}
                                ownedQuantity={currentOwned}
                                unit={unit}
                                onClose={() => setSelectedStock({ ...selectedStock, mode: undefined })}
                                onComplete={(msg) => {
                                    showNotification('success', msg);
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

// --- Join Savings Modal ---
const JoinSavingsModal: React.FC<{ 
    product: SavingsProduct, 
    unit: string, 
    onClose: () => void, 
    onJoin: (amount: number) => void 
}> = ({ product, unit, onClose, onJoin }) => {
    const [amount, setAmount] = useState('');
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-[40px] p-10 max-sm w-full text-center shadow-2xl border border-white" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <NewPiggyBankIcon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{product.name} 가입</h3>
                <p className="text-gray-700 text-sm font-bold mb-8">얼마를 가입할까요? (최대 {product.maxAmount.toLocaleString()}{unit})</p>
                
                <div className="relative mb-8">
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        placeholder="금액 입력"
                        className="w-full p-5 border border-gray-200 rounded-3xl outline-none focus:ring-4 focus:ring-green-50 focus:border-green-500 font-black text-2xl text-center text-gray-900"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onClose} className="py-4 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all">취소</button>
                    <button 
                        onClick={() => {
                            const val = Number(amount);
                            if (val > 0 && val <= product.maxAmount) {
                                onJoin(val);
                            } else {
                                alert(`최대 ${product.maxAmount.toLocaleString()}${unit}까지 가능합니다.`);
                            }
                        }} 
                        className="py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-[0.98]"
                    >
                        가입 완료
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Join Fund Modal (구좌 수 입력 추가) ---
const JoinFundModal: React.FC<{ 
    fund: Fund, 
    unit: string, 
    onClose: () => void, 
    onJoin: (units: number) => void 
}> = ({ fund, unit, onClose, onJoin }) => {
    const [units, setUnits] = useState(1);
    const totalCost = units * fund.unitPrice;
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-[40px] p-10 max-sm w-full text-center shadow-2xl border border-white" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <NewFundIcon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{fund.name} 투자</h3>
                <p className="text-gray-700 text-sm font-bold mb-6">투자할 구좌 수를 선택하세요.<br/>(1구좌당 {fund.unitPrice.toLocaleString()}{unit})</p>
                
                <div className="flex items-center justify-center gap-6 mb-8">
                    <button onClick={() => setUnits(Math.max(1, units - 1))} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 active:scale-[0.9] transition-all"><MinusIcon className="w-6 h-6 text-gray-700"/></button>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={units} 
                            onChange={e => setUnits(Math.max(1, parseInt(e.target.value) || 1))} 
                            className="w-20 text-center font-black text-4xl bg-transparent outline-none border-b-2 border-indigo-100 focus:border-indigo-500 transition-colors text-gray-900"
                        />
                        <span className="absolute -right-6 bottom-1 font-black text-gray-500">좌</span>
                    </div>
                    <button onClick={() => setUnits(units + 1)} className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 active:scale-[0.9] transition-all"><PlusIcon className="w-6 h-6 text-indigo-700"/></button>
                </div>

                <div className="bg-gray-50 p-6 rounded-3xl mb-8 border border-gray-100">
                    <div className="text-[10px] text-gray-700 font-black uppercase mb-1">총 결제 예정 금액</div>
                    <div className="text-2xl font-black text-indigo-700">{totalCost.toLocaleString()}{unit}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onClose} className="py-4 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all">취소</button>
                    <button 
                        onClick={() => onJoin(units)} 
                        className="py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                    >
                        투자 완료
                    </button>
                </div>
            </div>
        </div>
    );
};

const SavingsView: React.FC<{ currentUser: User, refreshAccount: () => void, showNotification: (type: 'success' | 'error', text: string) => void }> = ({ currentUser, refreshAccount, showNotification }) => {
    const unit = currentUser?.currencyUnit || '권';
    const [products, setProducts] = useState<SavingsProduct[]>([]);
    const [mySavings, setMySavings] = useState<StudentSaving[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<SavingsProduct | null>(null);
    const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
    const [maturityTargetId, setMaturityTargetId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        const prodList = await api.getSavingsProducts(currentUser.teacher_id || '');
        setProducts(prodList);
        const myList = await api.getStudentSavings(currentUser.userId);
        setMySavings(myList);
    }, [currentUser.teacher_id, currentUser.userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleJoin = async (amount: number) => {
        if(!selectedProduct) return;
        try {
            // [중요] 확실하게 정제된 숫자와 문자열(text)로 가공하여 전송
            const joinAmount = Math.floor(Number(amount));
            const productIdStr = String(selectedProduct.id);
            const userIdStr = String(currentUser.userId);
            
            const msg = await api.joinSavings(userIdStr, productIdStr, joinAmount);
            showNotification('success', msg || '적금에 가입되었습니다!');
            setSelectedProduct(null); fetchData(); refreshAccount();
        } catch(e: any) { 
            showNotification('error', e.message); 
        }
    };

    const handleMaturitySettle = async () => {
        if (!maturityTargetId) return;
        try {
            const msg = await api.processSavingsMaturity(currentUser.userId, maturityTargetId);
            showNotification('success', msg);
            setMaturityTargetId(null); fetchData(); refreshAccount();
        } catch (e: any) {
            showNotification('error', e.message);
        }
    };

    return (
        <div className="space-y-8">
            {mySavings.length > 0 && (
                <div>
                    <h3 className="text-lg font-black text-gray-900 mb-4 ml-1 tracking-tight">내 적금 현황</h3>
                    <div className="space-y-4">
                        {mySavings.map(s => {
                            const rate = s.product?.rate || 0;
                            const cancelRate = s.product?.cancellationRate || 0;
                            const maturityInterest = Math.floor(s.amount * rate);
                            // [수정] 중도 해지 환급액 표시 로직을 '원금 + 이자'로 수정
                            const cancelRefund = Math.floor(s.amount + (s.amount * cancelRate));
                            
                            const joinTime = new Date(s.joinDate).getTime();
                            const maturityTime = new Date(s.maturityDate).getTime();
                            const duration = maturityTime - joinTime;
                            
                            // 2/3 경과 시 해지 가능 로직
                            const possibleTime = joinTime + (duration * 2 / 3);
                            const canCancel = Date.now() >= possibleTime;
                            const possibleDateStr = new Date(possibleTime).toLocaleDateString();

                            // [수정] 만기 여부 판단 로직 (날짜 단위 비교로 변경)
                            const now = new Date();
                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                            const mDate = new Date(s.maturityDate);
                            const maturityDay = new Date(mDate.getFullYear(), mDate.getMonth(), mDate.getDate()).getTime();
                            const isMatured = today >= maturityDay;

                            return (
                                <div key={s.savingId} className={`bg-white p-6 rounded-[32px] shadow-sm border-l-[12px] relative overflow-hidden ${isMatured ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-green-500'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="font-black text-2xl text-gray-900 mb-1">{s.product?.name}</div>
                                                {isMatured && <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase">만기 달성</span>}
                                            </div>
                                            <div className="text-[10px] text-gray-700 font-bold uppercase">가입일: {new Date(s.joinDate).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {!isMatured && (
                                                <button 
                                                    onClick={() => canCancel && setCancelTargetId(s.savingId)} 
                                                    className={`px-4 py-2 text-[10px] font-black rounded-full transition-all ${canCancel ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                                                    title={!canCancel ? `${possibleDateStr}부터 해지 가능합니다.` : ""}
                                                >
                                                    해지
                                                </button>
                                            )}
                                            {isMatured && (
                                                <button 
                                                    onClick={() => setMaturityTargetId(s.savingId)} 
                                                    className="px-6 py-2 bg-indigo-600 text-white text-xs font-black rounded-full hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
                                                >
                                                    만기금 수령하기
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <div className="text-[10px] text-gray-700 font-black uppercase mb-1">가입 원금</div>
                                            <div className="font-black text-gray-900 text-lg">{s.amount.toLocaleString()}{unit}</div>
                                        </div>
                                        <div className={`p-4 rounded-2xl ${isMatured ? 'bg-indigo-50 border border-indigo-100' : 'bg-indigo-50'}`}>
                                            <div className={`text-[10px] font-black uppercase mb-1 ${isMatured ? 'text-indigo-600' : 'text-indigo-700'}`}>만기 예정일</div>
                                            <div className={`font-black text-lg ${isMatured ? 'text-indigo-700' : 'text-indigo-700'}`}>{new Date(s.maturityDate).toLocaleDateString()}</div>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-2xl">
                                            <div className="text-[10px] text-green-700 font-black uppercase mb-1">만기 시 예상 이자</div>
                                            <div className="font-black text-green-800 text-lg">+{maturityInterest.toLocaleString()}{unit}</div>
                                        </div>
                                        {!isMatured ? (
                                            <div className="p-4 bg-orange-50 rounded-2xl relative">
                                                <div className="text-[10px] text-orange-700 font-black uppercase mb-1">중도 해지 환급액</div>
                                                <div className="font-black text-orange-800 text-lg">{cancelRefund.toLocaleString()}{unit}</div>
                                                {!canCancel && <span className="absolute bottom-1 right-2 text-[8px] font-bold text-red-600 tracking-tighter">해지 제한: {possibleDateStr}~</span>}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-indigo-600 rounded-2xl flex flex-col justify-center items-center text-white">
                                                <div className="text-[10px] font-black uppercase mb-0.5 opacity-80">최종 수령액</div>
                                                <div className="font-black text-xl">{(s.amount + maturityInterest).toLocaleString()}{unit}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 ml-1 tracking-tight">추천 적금 상품</h3>
                <div className="grid grid-cols-1 gap-4">
                    {products.map(p => (
                        <button key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 text-left hover:scale-[1.02] transition-all group">
                            <div className="font-black text-xl text-gray-900 mb-4 group-hover:text-green-700 transition-colors">{p.name}</div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] text-gray-700 font-black uppercase mb-1">연 이자율</div>
                                    <div className="font-black text-2xl text-green-700">{(p.rate * 100).toFixed(1)}%</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-700 font-black uppercase mb-1">가입 기간</div>
                                    <div className="font-black text-xl text-gray-900">{p.maturityDays}일</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {selectedProduct && (
                <JoinSavingsModal 
                    product={selectedProduct} 
                    unit={unit} 
                    onClose={() => setSelectedProduct(null)} 
                    onJoin={handleJoin} 
                />
            )}

            <ConfirmModal 
                isOpen={!!cancelTargetId}
                title="적금 해지"
                message="정말로 적금을 해지하시겠습니까? 중도 해지 시 약정 이자를 받을 수 없으나 가입하셨던 원금은 안전하게 입금됩니다."
                onConfirm={async () => {
                    try {
                        const msg = await api.cancelSavings(String(currentUser.userId), String(cancelTargetId));
                        showNotification('success', msg || '해지가 완료되었습니다.');
                        setCancelTargetId(null); fetchData(); refreshAccount();
                    } catch(e: any) { showNotification('error', e.message); }
                }}
                onCancel={() => setCancelTargetId(null)}
                confirmText="해지하기"
                isDangerous
            />

            <ConfirmModal 
                isOpen={!!maturityTargetId}
                title="만기 정산 수령"
                message="축하합니다! 적금 만기일이 되었습니다. 지금 원금과 이자를 수령하시겠습니까?"
                onConfirm={handleMaturitySettle}
                onCancel={() => setMaturityTargetId(null)}
                confirmText="수령하기"
            />
        </div>
    );
};

const FundView: React.FC<{ currentUser: User, refreshAccount: () => void, showNotification: (type: 'success' | 'error', text: string) => void }> = ({ currentUser, refreshAccount, showNotification }) => {
    const unit = currentUser?.currencyUnit || '권';
    const [funds, setFunds] = useState<Fund[]>([]);
    const [myInvestments, setMyInvestments] = useState<FundInvestment[]>([]);
    const [selectedFund, setSelectedFund] = useState<Fund | null>(null);

    const fetchData = useCallback(async () => {
        const fundList = await api.getFunds(currentUser.teacher_id || '');
        setFunds(fundList);
        const myInv = await api.getMyFundInvestments(currentUser.userId);
        setMyInvestments(myInv);
    }, [currentUser.teacher_id, currentUser.userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleJoin = async (units: number) => {
        if(!selectedFund) return;
        try {
            const userIdStr = String(currentUser.userId);
            const fundIdStr = String(selectedFund.id);
            const msg = await api.joinFund(userIdStr, fundIdStr, units);
            showNotification('success', msg);
            setSelectedFund(null); fetchData(); refreshAccount();
        } catch(e: any) { 
            showNotification('error', e.message); 
        }
    };

    const getStatusBadge = (status: FundStatus) => {
        switch (status) {
            case FundStatus.RECRUITING: return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">모집중</span>;
            case FundStatus.ONGOING: return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">운용중</span>;
            default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-black uppercase">{status}</span>;
        }
    };

    return (
        <div className="space-y-8">
            {myInvestments.length > 0 && (
                <div>
                    <h3 className="text-lg font-black text-gray-900 mb-4 ml-1 tracking-tight">내 투자 현황</h3>
                    <div className="space-y-4">
                        {myInvestments.map(inv => (
                            <div key={inv.id} className="bg-white p-6 rounded-[32px] shadow-sm border-l-[12px] border-indigo-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="font-black text-xl text-gray-900">{inv.fund?.name}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black">{inv.units}좌 보유</span>
                                        {inv.fund && getStatusBadge(inv.fund.status)}
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 font-bold">투자 원금</span>
                                    <span className="font-black text-indigo-700">{(inv.units * (inv.fund?.unitPrice || 0)).toLocaleString()}{unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 ml-1 tracking-tight">진행 중인 펀드</h3>
                <div className="grid grid-cols-1 gap-4">
                    {funds.map(f => (
                        <div key={f.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="font-black text-2xl text-gray-900 mb-2">{f.name}</h4>
                                    <p className="text-sm text-gray-800 font-bold line-clamp-2">{f.description}</p>
                                </div>
                                {getStatusBadge(f.status)}
                            </div>
                            <div className="bg-gray-50 p-6 rounded-3xl grid grid-cols-2 gap-4 mb-6 border border-gray-100">
                                <div>
                                    <div className="text-[10px] text-gray-700 font-black uppercase mb-1">1좌당 가격</div>
                                    <div className="font-black text-lg text-gray-900">{f.unitPrice.toLocaleString()}{unit}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-700 font-black uppercase mb-1">목표 금액</div>
                                    <div className="font-black text-lg text-gray-900">{f.targetAmount.toLocaleString()}{unit}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedFund(f)}
                                disabled={f.status !== FundStatus.RECRUITING}
                                className={`w-full py-5 rounded-[24px] font-black text-lg transition-all active:scale-[0.98] ${f.status === FundStatus.RECRUITING ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-gray-100 text-gray-500'}`}
                            >
                                {f.status === FundStatus.RECRUITING ? '지금 투자하기' : '모집 종료'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedFund && (
                <JoinFundModal 
                    fund={selectedFund} 
                    unit={unit} 
                    onClose={() => setSelectedFund(null)} 
                    onJoin={handleJoin} 
                />
            )}
        </div>
    );
};

// --- Main StudentPage Component ---

const StudentPage: React.FC<StudentPageProps> = ({ initialView, onBackToMenu }) => {
    const { currentUser, logout } = useContext(AuthContext);
    const [view, setView] = useState<View>((initialView as View) || 'home');
    const [account, setAccount] = useState<Account | null>(null);
    const [notification, setNotification] = useState<NotificationType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [activeStudent, setActiveStudent] = useState<User | null>(null);
    const [students, setStudents] = useState<User[]>([]);

    const handleLogout = onBackToMenu || logout;

    const refreshAccount = useCallback(async () => {
        const targetUser = (currentUser?.role === Role.TEACHER) ? activeStudent : currentUser;
        if (!targetUser) return;
        
        setIsLoading(true);
        try {
            const acc = await api.getStudentAccountByUserId(targetUser.userId);
            setAccount(acc);
        } catch (e: any) {
            setNotification({ type: 'error', text: e.message || '정보를 가져오는데 실패했습니다.' });
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, activeStudent]);

    useEffect(() => {
        if (currentUser?.role === Role.TEACHER && !activeStudent) {
            api.getUsersByRole(Role.STUDENT, currentUser.userId).then(setStudents);
        }
    }, [currentUser, activeStudent]);

    useEffect(() => { refreshAccount(); }, [refreshAccount]);

    const newsUrl = useMemo(() => {
        const user = activeStudent || currentUser;
        if (!user) return 'https://kidseconews.vercel.app/';
        const params = new URLSearchParams();
        params.append('name', user.name);
        params.append('grade', String(user.grade || ''));
        params.append('class', String(user.class || ''));
        params.append('number', String(user.number || ''));
        return `https://kidseconews.vercel.app/?${params.toString()}`;
    }, [currentUser, activeStudent]);

    if (!currentUser) return null;

    // 공통 화폐 단위 결정 (효과적 사용자 객체 또는 현재 사용자 객체에서 참조)
    const effectiveUser = activeStudent || currentUser;
    // 주입된 currencyUnit이 있는 경우 그것을 최우선으로 사용
    const currentUnit = effectiveUser?.currencyUnit || currentUser?.currencyUnit || '권';

    const renderView = () => {
        if (currentUser.role === Role.TEACHER && !activeStudent) {
            return <StudentSelectionView students={students} onSelect={setActiveStudent} />;
        }

        if (isLoading) return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-32 animate-pulse">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-lg font-black tracking-tight">데이터 동기화 중...</p>
            </div>
        );

        if (!account) return <div className="text-center py-20 font-black text-gray-400">계좌 정보가 없습니다.</div>;

        switch (view) {
            case 'home': return <HomeView account={account} currentUser={{...effectiveUser, currencyUnit: currentUnit}} refreshAccount={refreshAccount} showNotification={(type, text) => setNotification({type, text})} />;
            case 'transfer': return <TransferView currentUser={{...effectiveUser, currencyUnit: currentUnit}} account={account} refreshAccount={refreshAccount} showNotification={(type, text) => setNotification({type, text})} />;
            case 'stocks': return <StocksView currentUser={{...effectiveUser, currencyUnit: currentUnit}} refreshAccount={refreshAccount} showNotification={(type, text) => setNotification({type, text})} />;
            case 'savings': return <SavingsView currentUser={{...effectiveUser, currencyUnit: currentUnit}} refreshAccount={refreshAccount} showNotification={(type, text) => setNotification({type, text})} />;
            case 'funds': return <FundView currentUser={{...effectiveUser, currencyUnit: currentUnit}} refreshAccount={refreshAccount} showNotification={(type, text) => setNotification({type, text})} />;
            default: return <HomeView account={account} currentUser={{...effectiveUser, currencyUnit: currentUnit}} refreshAccount={refreshAccount} showNotification={(type, text) => setNotification({type, text})} />;
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row bg-[#F2F4F7] overflow-hidden">
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 z-30">
                <div className="mb-10 px-2">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tighter mb-1">
                        {activeStudent ? activeStudent.name : (currentUser.role === Role.TEACHER ? '학생 페이지' : currentUser.name)}
                    </h1>
                    <p className="text-xs text-gray-700 font-bold uppercase tracking-widest">Student Dashboard</p>
                </div>
                
                {(activeStudent || currentUser.role === Role.STUDENT) && (
                    <nav className="space-y-2 flex-grow">
                        <DesktopNavBtn icon={HomeIcon} label="홈" active={view === 'home'} onClick={() => setView('home')} />
                        <DesktopNavBtn icon={TransferIcon} label="송금" active={view === 'transfer'} onClick={() => setView('transfer')} />
                        <DesktopNavBtn icon={NewStockIcon} label="주식" active={view === 'stocks'} onClick={() => setView('stocks')} />
                        <DesktopNavBtn icon={NewFundIcon} label="펀드" active={view === 'funds'} onClick={() => setView('funds')} />
                        <DesktopNavBtn icon={NewPiggyBankIcon} label="적금" active={view === 'savings'} onClick={() => setView('savings')} />
                    </nav>
                )}

                <div className="mt-auto space-y-4">
                    <a href={newsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-sm hover:bg-indigo-100 transition-all group">
                        <NewspaperIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 경제뉴스
                    </a>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 text-gray-600 hover:text-red-600 font-black text-sm rounded-2xl hover:bg-red-50 transition-all">
                        <LogoutIcon className="w-5 h-5" /> {onBackToMenu ? '메뉴로' : '로그아웃'}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full relative">
                <header className="md:hidden bg-white/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-gray-100 sticky top-0 z-40">
                    <div className="flex items-center">
                        {currentUser.role === Role.TEACHER && activeStudent && (
                            <button onClick={() => { setActiveStudent(null); setAccount(null); }} className="mr-4 p-2 -ml-2 hover:bg-gray-100 rounded-2xl transition-all"><BackIcon className="w-6 h-6 text-gray-800" /></button>
                        )}
                        <div>
                            <h1 className="text-lg font-black text-gray-900 leading-tight tracking-tight">
                                {activeStudent ? activeStudent.name : (currentUser.role === Role.TEACHER ? '학생 페이지' : currentUser.name)}
                            </h1>
                        </div>
                    </div>
                    <a href={newsUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl shadow-sm border border-indigo-100 transition-all active:scale-90"><NewspaperIcon className="w-6 h-6" /></a>
                </header>

                <main className="flex-grow overflow-y-auto p-4 md:p-10 pb-28 md:pb-10">
                    <div className="max-w-4xl mx-auto">{renderView()}</div>
                </main>

                {(activeStudent || currentUser.role === Role.STUDENT) && (
                    <nav className="md:hidden bg-white/90 backdrop-blur-2xl border-t border-gray-100 flex justify-around p-2.5 fixed bottom-0 left-0 right-0 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                        <MobileNavBtn icon={HomeIcon} label="홈" active={view === 'home'} onClick={() => setView('home')} />
                        <MobileNavBtn icon={TransferIcon} label="송금" active={view === 'transfer'} onClick={() => setView('transfer')} />
                        <MobileNavBtn icon={NewStockIcon} label="주식" active={view === 'stocks'} onClick={() => setView('stocks')} />
                        <MobileNavBtn icon={NewFundIcon} label="펀드" active={view === 'funds'} onClick={() => setView('funds')} />
                        <MobileNavBtn icon={NewPiggyBankIcon} label="적금" active={view === 'savings'} onClick={() => setView('savings')} />
                    </nav>
                )}
            </div>

            {notification && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fadeIn" onClick={() => setNotification(null)}>
                    <div className="bg-white rounded-[40px] p-10 max-sm w-full text-center shadow-2xl border border-white" onClick={e => e.stopPropagation()}>
                        {notification.type === 'success' ? (
                            <div className="w-20 h-20 bg-green-50 rounded-[28px] flex items-center justify-center mx-auto mb-6"><CheckIcon className="w-10 h-10 text-green-600" /></div>
                        ) : (
                            <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center mx-auto mb-6"><ErrorIcon className="w-10 h-10 text-red-600" /></div>
                        )}
                        <h3 className="text-2xl font-black text-gray-900 mb-2">{notification.type === 'success' ? '완료' : '오류'}</h3>
                        <p className="text-gray-700 font-bold mb-8 leading-relaxed">{notification.text}</p>
                        <button onClick={() => setNotification(null)} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all">확인</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DesktopNavBtn = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-800 hover:bg-gray-100'}`}>
        <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-600'}`} /> {label}
    </button>
);

const MobileNavBtn = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all flex-1 ${active ? 'text-indigo-600 bg-indigo-50' : 'text-gray-800'}`}>
        <Icon className={`w-6 h-6 mb-1 ${active ? 'text-indigo-600' : 'text-gray-600'}`} />
        <span className="text-[10px] font-black tracking-tight">{label}</span>
    </button>
);

export default StudentPage;
