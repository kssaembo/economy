/* ... existing sql comments ... */
import { api } from '../services/api';
import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { User, Role, Account, Transaction, Job, AssignedStudent, TransactionType, TaxItemWithRecipients, Fund, FundStatus } from '../types';
import { LogoutIcon, QrCodeIcon, UserAddIcon, XIcon, CheckIcon, ErrorIcon, BackIcon, NewDashboardIcon, NewBriefcaseIcon, NewManageAccountsIcon, ManageIcon, NewTaxIcon, NewFundIcon, NewStudentIcon, PencilIcon, ArrowDownIcon, ArrowUpIcon, PlusIcon, BellIcon } from '../components/icons';
import { QRCodeSVG } from 'qrcode.react';

// --- Helpers ---
const getQrBaseUrl = () => {
    return 'https://economy-rho.vercel.app';
};

const getDDay = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    target.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = target.getTime() - today.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

interface AlarmItem {
    id: string;
    type: 'danger' | 'warning' | 'info';
    category: string;
    message: string;
    date: Date;
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

// --- Modals ---

const AddJobModal: React.FC<{ onClose: () => void, onComplete: () => void }> = ({ onClose, onComplete }) => {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [salary, setSalary] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !salary) return;
        setLoading(true);
        try {
            await api.addJob(name, desc, parseInt(salary));
            onComplete();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">새 직업 추가</h3>
                <div className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="직업명" className="w-full p-3 border rounded-lg" />
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="설명" className="w-full p-3 border rounded-lg" rows={3} />
                    <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="월급" className="w-full p-3 border rounded-lg" />
                    <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-[#2B548F] text-white font-bold rounded-lg disabled:bg-gray-300">
                        {loading ? '추가 중...' : '추가하기'}
                    </button>
                    <button onClick={onClose} className="w-full py-2 text-gray-500 font-medium">닫기</button>
                </div>
            </div>
        </div>
    );
};

const AssignJobModal: React.FC<{ job: Job, students: User[], onClose: () => void, onComplete: () => void }> = ({ job, students, onClose, onComplete }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>(job.assigned_students?.map(s => s.userId) || []);
    const [loading, setLoading] = useState(false);

    const toggleStudent = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.manageJobAssignment(job.id, selectedIds);
            onComplete();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col max-h-[80vh]">
                <h3 className="text-xl font-bold mb-4">학생 배정: {job.jobName}</h3>
                <div className="flex-grow overflow-y-auto space-y-1 mb-4">
                    {students.map(s => (
                        <button key={s.userId} onClick={() => toggleStudent(s.userId)} className={`w-full flex justify-between items-center p-3 rounded-lg border transition-colors ${selectedIds.includes(s.userId) ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:bg-gray-50 text-gray-600'}`}>
                            <span className="font-medium">{s.grade}-{s.class} {s.number} {s.name}</span>
                            {selectedIds.includes(s.userId) && <CheckIcon className="w-5 h-5" />}
                        </button>
                    ))}
                </div>
                <button onClick={handleSave} disabled={loading} className="w-full py-3 bg-[#2B548F] text-white font-bold rounded-lg">
                    {loading ? '저장 중...' : '저장하기'}
                </button>
                <button onClick={onClose} className="w-full py-2 text-gray-500 mt-2">닫기</button>
            </div>
        </div>
    );
};

const AddTaxModal: React.FC<{ students: User[], onClose: () => void, onComplete: () => void }> = ({ students, onClose, onComplete }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(students.map(s => s.userId));
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name || !amount || !dueDate || selectedIds.length === 0) return;
        setLoading(true);
        try {
            await api.createTax(name, parseInt(amount), dueDate, selectedIds);
            onComplete();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col max-h-[90vh]">
                <h3 className="text-xl font-bold mb-4">세금 고지</h3>
                <div className="space-y-4 mb-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="세금 명칭 (예: 건강보험)" className="w-full p-3 border rounded-lg" />
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="금액" className="w-full p-3 border rounded-lg" />
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 border rounded-lg" />
                </div>
                <div className="flex-grow overflow-y-auto border rounded-lg p-2 mb-4">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase px-2">대상 학생 선택</p>
                    {students.map(s => (
                        <label key={s.userId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input type="checkbox" checked={selectedIds.includes(s.userId)} onChange={() => setSelectedIds(prev => prev.includes(s.userId) ? prev.filter(i => i !== s.userId) : [...prev, s.userId])} className="w-5 h-5 text-indigo-600 rounded" />
                            <span className="text-sm font-medium">{s.grade}-{s.class} {s.number} {s.name}</span>
                        </label>
                    ))}
                </div>
                <button onClick={handleCreate} disabled={loading} className="w-full py-3 bg-[#2B548F] text-white font-bold rounded-lg">
                    {loading ? '고지 중...' : '고지하기'}
                </button>
                <button onClick={onClose} className="w-full py-2 text-gray-500 mt-2">닫기</button>
            </div>
        </div>
    );
};

// --- Sub-Views ---

const DashboardView: React.FC<{ students: (User & { account: Account | null })[], refresh: () => void }> = ({ students }) => {
    const { currentUser } = useContext(AuthContext);
    const [teacherAccount, setTeacherAccount] = useState<Account | null>(null);
    const [teacherTransactions, setTeacherTransactions] = useState<Transaction[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [visibleTeacherTxns, setVisibleTeacherTxns] = useState(5);
    const [visibleHistoryModalTxns, setVisibleHistoryModalTxns] = useState(10);
    const [activeTab, setActiveTab] = useState<'assets' | 'activity_up' | 'activity_down'>('assets');
    const [visibleRankingCount, setVisibleRankingCount] = useState(3);
    const [studentActivities, setStudentActivities] = useState<Record<string, number>>({});
    const [alarms, setAlarms] = useState<AlarmItem[]>([]);
    const [isAlarmsLoading, setIsAlarmsLoading] = useState(false);

    const alias = currentUser?.teacherAlias || '권쌤';
    const unit = currentUser?.currencyUnit || '권';

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

    useEffect(() => {
        const fetchData = async () => {
            setIsAlarmsLoading(true);
            const activityMap: Record<string, number> = {};
            const newAlarms: AlarmItem[] = [];
            const todayStr = new Date().toLocaleDateString();

            try {
                const [taxes, funds] = await Promise.all([api.getTaxes(), api.getFunds()]);
                
                taxes.forEach(tax => {
                    const dDay = getDDay(tax.dueDate);
                    if (dDay >= 0 && dDay <= 3) {
                        newAlarms.push({
                            id: `tax-${tax.id}-${dDay}`,
                            type: dDay === 0 ? 'danger' : 'warning',
                            category: '세금',
                            message: `'${tax.name}' 세금 납부 마감 ${dDay === 0 ? '당일' : 'D-' + dDay}입니다.`,
                            date: new Date()
                        });
                    }
                });

                funds.forEach(fund => {
                    if (fund.status === FundStatus.ONGOING || fund.status === FundStatus.RECRUITING) {
                        const dDay = getDDay(fund.maturityDate);
                        if (dDay >= 0 && dDay <= 3) {
                             newAlarms.push({
                                id: `fund-${fund.id}-${dDay}`,
                                type: dDay === 0 ? 'danger' : 'warning',
                                category: '펀드',
                                message: `'${fund.name}' 펀드 만기 ${dDay === 0 ? '당일' : 'D-' + dDay}입니다.`,
                                date: new Date()
                            });
                        }
                    }
                });

                await Promise.all(students.map(async (s) => {
                    if (s.account) {
                        const txns = await api.getTransactionsByAccountId(s.account.accountId);
                        activityMap[s.userId] = txns.length;

                        txns.forEach(t => {
                            const tDate = new Date(t.date).toLocaleDateString();
                            if (tDate === todayStr) {
                                if (Math.abs(t.amount) >= 100) {
                                    newAlarms.push({
                                        id: `large-tx-${t.transactionId}`,
                                        type: 'info',
                                        category: '고액거래',
                                        message: `${s.name} 학생: ${Math.abs(t.amount).toLocaleString()}${unit} 고액 거래 발생 (${t.description})`,
                                        date: new Date(t.date)
                                    });
                                }
                                if (t.type === 'StockBuy' || t.type === 'StockSell') {
                                    newAlarms.push({
                                        id: `stock-${t.transactionId}`,
                                        type: 'info',
                                        category: '주식',
                                        message: `${s.name} 학생이 주식을 ${t.type === 'StockBuy' ? '구입' : '판매'}했습니다.`,
                                        date: new Date(t.date)
                                    });
                                }
                                if (t.type === 'SavingsJoin') {
                                    newAlarms.push({
                                        id: `saving-join-${t.transactionId}`,
                                        type: 'info',
                                        category: '적금',
                                        message: `${s.name} 학생이 신규 적금에 가입했습니다.`,
                                        date: new Date(t.date)
                                    });
                                }
                                if (t.type === 'FundJoin') {
                                    newAlarms.push({
                                        id: `fund-join-${t.transactionId}`,
                                        type: 'info',
                                        category: '펀드',
                                        message: `${s.name} 학생이 펀드에 투자했습니다.`,
                                        date: new Date(t.date)
                                    });
                                }
                            }
                        });

                        const studentSavings = await api.getStudentSavings(s.userId);
                        studentSavings.forEach(ss => {
                            const dDay = getDDay(ss.maturityDate);
                            if (dDay === 0 || dDay === 1) {
                                newAlarms.push({
                                    id: `saving-mat-${ss.savingId}-${dDay}`,
                                    type: dDay === 0 ? 'danger' : 'warning',
                                    category: '적금',
                                    message: `${s.name} 학생의 '${ss.product?.name}' 적금이 ${dDay === 0 ? '오늘' : '내일'} 만기입니다.`,
                                    date: new Date()
                                });
                            }
                        });

                    } else {
                        activityMap[s.userId] = 0;
                    }
                }));

                setStudentActivities(activityMap);
                setAlarms(newAlarms.sort((a,b) => b.date.getTime() - a.date.getTime()));
            } catch (err) {
                console.error("Failed to gather activity data", err);
            } finally {
                setIsAlarmsLoading(false);
            }
        };
        if (students.length > 0) fetchData();
    }, [students, unit]);

    const totalAssets = students.reduce((acc, s) => acc + (s.account?.balance || 0), 0);
    const avgAssets = students.length > 0 ? Math.round(totalAssets / students.length) : 0;
    
    const sortedRankingList = useMemo(() => {
        let list = [...students];
        if (activeTab === 'assets') {
            list.sort((a, b) => (b.account?.balance || 0) - (a.account?.balance || 0));
        } else if (activeTab === 'activity_up') {
            list.sort((a, b) => (studentActivities[b.userId] || 0) - (studentActivities[a.userId] || 0));
        } else if (activeTab === 'activity_down') {
            list.sort((a, b) => (studentActivities[a.userId] || 0) - (studentActivities[b.userId] || 0));
        }
        return list;
    }, [students, activeTab, studentActivities]);

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div onClick={() => { setVisibleHistoryModalTxns(10); setShowHistoryModal(true); }} className="bg-[#2B548F] text-white p-6 rounded-xl shadow-lg cursor-pointer hover:bg-[#234576] transition-colors relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="font-medium text-blue-200 text-sm mb-1">{alias} 지갑 (국고)</h3>
                        <p className="text-3xl font-bold">{teacherAccount?.balance.toLocaleString() ?? 0}{unit}</p>
                        <p className="text-xs text-blue-200 mt-2 flex items-center">내역 보기 <span className="ml-1">→</span></p>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm">총 통화량 (학생)</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{totalAssets.toLocaleString()}{unit}</p>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm">평균 자산</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{avgAssets.toLocaleString()}{unit}</p>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm">등록 학생</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{students.length}명</p>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <BellIcon className="w-5 h-5 mr-2 text-red-500 animate-bounce" /> 학급 경제 주요 알림
                    </h3>
                    <span className="text-xs text-gray-400">실시간 집계</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {isAlarmsLoading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">데이터 분석 중...</div>
                    ) : alarms.length > 0 ? (
                        alarms.map(alarm => (
                            <div key={alarm.id} className="p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alarm.type === 'danger' ? 'bg-red-500' : alarm.type === 'warning' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${alarm.type === 'danger' ? 'bg-red-50 text-red-600' : alarm.type === 'warning' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {alarm.category}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{new Date(alarm.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-gray-700 font-medium">{alarm.message}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-gray-400 text-sm">현재 중요한 알림이 없습니다.</div>
                    )}
                </div>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col">
                     <div className="p-1 border-b bg-gray-50 flex">
                         <button 
                            onClick={() => { setActiveTab('assets'); setVisibleRankingCount(3); }}
                            className={`flex-1 py-3 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'assets' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                             자산 순위
                         </button>
                         <button 
                            onClick={() => { setActiveTab('activity_up'); setVisibleRankingCount(3); }}
                            className={`flex-1 py-3 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'activity_up' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                             활동량 ↑
                         </button>
                         <button 
                            onClick={() => { setActiveTab('activity_down'); setVisibleRankingCount(3); }}
                            className={`flex-1 py-3 text-sm font-bold transition-colors rounded-t-lg ${activeTab === 'activity_down' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                             활동량 ↓
                         </button>
                     </div>
                     <ul className="flex-grow">
                         {sortedRankingList.slice(0, visibleRankingCount).map((s, index) => (
                             <li key={s.userId} className="p-4 border-b last:border-b-0 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                 <div className="flex items-center">
                                     <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-400'}`}>
                                         {index + 1}
                                     </span>
                                     <div>
                                         <p className="font-bold text-gray-800">{s.name}</p>
                                         <p className="text-xs text-gray-500">{s.grade}학년 {s.class}반 {s.number}번</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                    <span className="block font-mono font-bold text-indigo-600">{(s.account?.balance || 0).toLocaleString()}{unit}</span>
                                    <span className="text-[10px] text-gray-400">활동 {studentActivities[s.userId] || 0}회</span>
                                 </div>
                             </li>
                         ))}
                         {sortedRankingList.length === 0 && <li className="p-8 text-center text-gray-400">데이터가 없습니다.</li>}
                     </ul>
                     {sortedRankingList.length > visibleRankingCount && (
                         <button 
                            onClick={() => setVisibleRankingCount(prev => prev + 5)}
                            className="w-full py-4 text-sm font-bold text-indigo-600 hover:bg-indigo-50 border-t transition-colors bg-white active:bg-indigo-100"
                         >
                            순위 더보기 (+5명)
                         </button>
                     )}
                 </div>
                 
                 <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col">
                     <div className="p-4 border-b bg-gray-50">
                         <h3 className="font-bold text-gray-800">국고 최근 거래 내역</h3>
                     </div>
                     <ul className="flex-grow max-h-[460px] overflow-y-auto">
                         {teacherTransactions.slice(0, visibleTeacherTxns).map(t => (
                             <li key={t.transactionId} className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                                 <div className="flex justify-between items-start mb-1">
                                     <span className="font-medium text-sm text-gray-800">{t.description}</span>
                                     <span className={`font-bold text-sm ${t.amount > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                         {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                                     </span>
                                 </div>
                                 <div className="text-xs text-gray-400 text-right">
                                     {new Date(t.date).toLocaleString()}
                                 </div>
                             </li>
                         ))}
                         {teacherTransactions.length === 0 && <li className="p-8 text-center text-gray-400">거래 내역이 없습니다.</li>}
                     </ul>
                     {teacherTransactions.length > visibleTeacherTxns && (
                         <button 
                            onClick={() => setVisibleTeacherTxns(prev => prev + 10)}
                            className="w-full py-4 text-sm font-bold text-[#2B548F] hover:bg-blue-50 border-t transition-colors bg-white active:bg-blue-100"
                         >
                            거래 내역 더보기 (+10건)
                         </button>
                     )}
                 </div>
             </div>

             {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm md:max-w-4xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                <ManageIcon className="w-5 h-5 mr-2 text-[#2B548F]"/> {alias} 지갑 내역 (국고)
                            </h3>
                            <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                                <XIcon className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto pr-1">
                            {teacherTransactions.length > 0 ? (
                                <>
                                    <ul className="divide-y divide-gray-100">
                                        {teacherTransactions.slice(0, visibleHistoryModalTxns).map(t => (
                                            <li key={t.transactionId} className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg transition-colors">
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{t.description}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{new Date(t.date).toLocaleString()}</p>
                                                </div>
                                                <p className={`font-extrabold text-base ${t.amount > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                                    {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}<span className="text-xs ml-0.5 font-normal">{unit}</span>
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                    {teacherTransactions.length > visibleHistoryModalTxns && (
                                        <button 
                                            onClick={() => setVisibleHistoryModalTxns(prev => prev + 10)}
                                            className="w-full mt-4 py-4 bg-gray-50 text-[#2B548F] font-bold text-sm rounded-xl border border-gray-100 hover:bg-blue-50 transition-colors active:scale-95"
                                        >
                                            내역 더보기 (+10건)
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <ErrorIcon className="w-12 h-12 text-gray-200 mb-3" />
                                    <p className="text-center text-gray-400">거래 내역이 존재하지 않습니다.</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-3 border-t text-right">
                             <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2.5 bg-gray-800 text-white font-bold rounded-lg hover:bg-black transition-colors">
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
};

const StudentManagementView: React.FC<{ students: (User & { account: Account | null })[], refresh: () => void }> = ({ students, refresh }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const toggleStudent = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDelete = async () => {
        try {
            await api.deleteStudents(selectedIds);
            setSelectedIds([]);
            setConfirmDelete(false);
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">학생 관리</h2>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <button onClick={() => setConfirmDelete(true)} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">삭제 ({selectedIds.length})</button>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 w-12"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? students.map(s => s.userId) : [])} checked={selectedIds.length === students.length && students.length > 0} /></th>
                            <th className="p-3 text-left">번호</th>
                            <th className="p-3 text-left">이름</th>
                            <th className="p-3 text-left">계좌번호</th>
                            <th className="p-3 text-right">잔액</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.map(s => (
                            <tr key={s.userId} className="hover:bg-gray-50">
                                <td className="p-3 text-center"><input type="checkbox" checked={selectedIds.includes(s.userId)} onChange={() => toggleStudent(s.userId)} /></td>
                                <td className="p-3">{s.grade}-{s.class} {s.number}</td>
                                <td className="p-3 font-bold">{s.name}</td>
                                <td className="p-3 font-mono text-xs">{s.account?.accountId.replace('권쌤은행 ', '') || '-'}</td>
                                <td className="p-3 text-right font-bold text-indigo-600">{s.account?.balance.toLocaleString() || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ConfirmModal isOpen={confirmDelete} title="학생 삭제" message="선택한 학생들을 영구적으로 삭제하시겠습니까? 계좌 및 모든 기록이 사라집니다." onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} isDangerous />
        </div>
    );
};

const JobManagementView: React.FC<{ refresh: () => void }> = ({ refresh }) => {
    const { currentUser } = useContext(AuthContext);
    const unit = currentUser?.currencyUnit || '권';
    const [jobs, setJobs] = useState<Job[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [assignJob, setAssignJob] = useState<Job | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'pay_all' | 'delete' | 'pay_one', data: any } | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [j, s] = await Promise.all([api.getJobs(), api.getUsersByRole(Role.STUDENT)]);
            setJobs(j);
            setStudents(s);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handlePaySalaries = async () => {
        try {
            const msg = await api.payAllSalaries();
            setMessage({ type: 'success', text: msg });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setConfirmAction(null);
        }
    };

    const handleDeleteJob = async () => {
        if (!confirmAction || confirmAction.type !== 'delete') return;
        const jobId = confirmAction.data;
        try {
            const msg = await api.deleteJob(jobId);
            setMessage({ type: 'success', text: msg });
            fetchData();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setConfirmAction(null);
        }
    };

    const handlePayOneSalary = async () => {
        if (!confirmAction || confirmAction.type !== 'pay_one') return;
        const jobId = confirmAction.data;
        try {
            const msg = await api.payJobSalary(jobId);
            setMessage({ type: 'success', text: msg });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setConfirmAction(null);
        }
    };

    const handleUpdateIncentive = async (jobId: string, value: string) => {
        const numValue = parseInt(value) || 0;
        try {
            await api.updateJobIncentive(jobId, numValue);
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, incentive: numValue } : j));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">직업 관리</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-[#2B548F] text-white rounded-lg text-sm font-bold shadow hover:bg-[#234576]">
                        + 직업 추가
                    </button>
                    <button onClick={() => setConfirmAction({ type: 'pay_all', data: null })} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow hover:bg-green-700">
                        월급 일괄 지급
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                {jobs.map(job => (
                    <div key={job.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{job.jobName}</h3>
                            <button onClick={() => setConfirmAction({ type: 'delete', data: job.id })} className="text-gray-400 hover:text-red-500"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 flex-grow">{job.description}</p>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm mb-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">기본 월급</span>
                                <span className="font-bold">{job.salary.toLocaleString()}{unit}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">인센티브</span>
                                <input 
                                    type="number" 
                                    defaultValue={job.incentive} 
                                    onBlur={(e) => handleUpdateIncentive(job.id, e.target.value)}
                                    className="w-20 p-1 text-right border rounded text-xs font-bold text-blue-600 bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                                />
                            </div>
                            <div className="border-t pt-2 flex justify-between items-center font-bold text-indigo-600">
                                <span>총 지급액</span>
                                <span>{(job.salary + (job.incentive || 0)).toLocaleString()}{unit}</span>
                            </div>
                        </div>
                        <div className="mt-auto">
                            <div className="text-xs text-gray-500 mb-1">담당 학생 ({job.assigned_students?.length || 0}명)</div>
                            <div className="flex flex-wrap gap-1 mb-3 min-h-[1.5rem]">
                                {job.assigned_students?.map(s => (
                                    <span key={s.userId} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{s.name}</span>
                                ))}
                                {(!job.assigned_students || job.assigned_students.length === 0) && <span className="text-gray-300 text-xs">배정된 학생 없음</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setAssignJob(job)} className="py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                                    학생 배정
                                </button>
                                <button onClick={() => setConfirmAction({ type: 'pay_one', data: job.id })} className="py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-colors">
                                    주급 지급
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {showAddModal && <AddJobModal onClose={() => setShowAddModal(false)} onComplete={fetchData} />}
            {assignJob && <AssignJobModal job={assignJob} students={students} onClose={() => setAssignJob(null)} onComplete={fetchData} />}
            <ConfirmModal isOpen={confirmAction?.type === 'pay_all'} title="월급 일괄 지급" message="배정된 모든 학생들에게 월급(기본급+인센티브)을 지급하시겠습니까?" onConfirm={handlePaySalaries} onCancel={() => setConfirmAction(null)} />
            <ConfirmModal isOpen={confirmAction?.type === 'delete'} title="직업 삭제" message="이 직업을 삭제하시겠습니까? 배정된 학생 정보가 사라집니다." onConfirm={handleDeleteJob} onCancel={() => setConfirmAction(null)} isDangerous />
            <ConfirmModal isOpen={confirmAction?.type === 'pay_one'} title="주급 지급" message="이 직업을 담당하는 모든 학생들에게 주급을 지급하시겠습니까?" onConfirm={handlePayOneSalary} onCancel={() => setConfirmAction(null)} />
            {message && <MessageModal isOpen={true} type={message.type} message={message.text} onClose={() => setMessage(null)} />}
        </div>
    );
};

const TaxView: React.FC<{ students: User[] }> = ({ students }) => {
    const { currentUser } = useContext(AuthContext);
    const unit = currentUser?.currencyUnit || '권';
    const [taxes, setTaxes] = useState<TaxItemWithRecipients[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedTaxId, setExpandedTaxId] = useState<string | null>(null);
    const [messageModal, setMessageModal] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const [confirmAction, setConfirmAction] = useState<{ type: 'delete', data: any } | null>(null);

    const fetchTaxes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getTaxes();
            setTaxes(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

    const handleDeleteConfirm = async () => {
        if (!confirmAction || confirmAction.type !== 'delete') return;
        const taxId = confirmAction.data;
        try {
            const msg = await api.deleteTax(taxId);
            setMessageModal({ isOpen: true, type: 'success', message: msg });
            fetchTaxes();
        } catch (e: any) {
            setMessageModal({ isOpen: true, type: 'error', message: e.message });
        } finally {
            setConfirmAction(null);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedTaxId(prev => prev === id ? null : id);
    };

    const getStudentName = (userId: string) => {
        const student = students.find(s => s.userId === userId);
        return student ? `${student.grade ? student.grade + '-' : ''}${student.class ? student.class + ' ' : ''}${student.number}. ${student.name}` : userId;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">세금 관리</h2>
                <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-[#2B548F] text-white rounded-lg text-sm font-bold shadow hover:bg-[#234576]">
                    + 세금 고지
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-4">
                {taxes.map(tax => {
                    const paidRecipients = tax.recipients.filter(r => r.isPaid);
                    const unpaidRecipients = tax.recipients.filter(r => !r.isPaid);
                    const paidCount = paidRecipients.length;
                    const totalCount = tax.recipients.length;
                    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
                    const isExpanded = expandedTaxId === tax.id;
                    return (
                        <div key={tax.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg">{tax.name}</h3>
                                    <p className="text-sm text-gray-500">납부 기한: {new Date(tax.dueDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-lg text-red-600">{tax.amount.toLocaleString()}{unit}</span>
                                    <button onClick={() => setConfirmAction({ type: 'delete', data: tax.id })} className="text-xs text-gray-400 hover:text-red-500 underline mt-1">삭제</button>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div 
                                    className="flex justify-between text-xs mb-1 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors select-none"
                                    onClick={() => toggleExpand(tax.id)}
                                >
                                    <span className="text-gray-600 flex items-center">
                                        납부율 
                                        {isExpanded ? <ArrowUpIcon className="w-3 h-3 ml-1"/> : <ArrowDownIcon className="w-3 h-3 ml-1"/>}
                                    </span>
                                    <span className="font-bold text-indigo-600">{Math.round(progress)}% ({paidCount}/{totalCount})</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 animate-fadeIn">
                                        <div>
                                            <h4 className="text-xs font-bold text-green-600 mb-2 flex items-center">
                                                <CheckIcon className="w-3 h-3 mr-1"/> 납부 완료 ({paidCount})
                                            </h4>
                                            <ul className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                                                {paidRecipients.map(r => (
                                                    <li key={r.id} className="truncate">• {getStudentName(r.studentUserId)}</li>
                                                ))}
                                                {paidCount === 0 && <li className="text-gray-400 italic">없음</li>}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-red-500 mb-2 flex items-center">
                                                <XIcon className="w-3 h-3 mr-1"/> 미납 ({unpaidRecipients.length})
                                            </h4>
                                            <ul className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                                                {unpaidRecipients.map(r => (
                                                    <li key={r.id} className="truncate">• {getStudentName(r.studentUserId)}</li>
                                                ))}
                                                {unpaidRecipients.length === 0 && <li className="text-gray-400 italic">없음</li>}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {showAddModal && <AddTaxModal students={students} onClose={() => setShowAddModal(false)} onComplete={fetchTaxes} />}
            <ConfirmModal isOpen={confirmAction?.type === 'delete'} title="세금 항목 삭제" message="이 세금 항목을 삭제하시겠습니까? 납부 기록도 함께 사라집니다." onConfirm={handleDeleteConfirm} onCancel={() => setConfirmAction(null)} isDangerous />
            <MessageModal isOpen={messageModal.isOpen} type={messageModal.type} message={messageModal.message} onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
};

const FundManagementView: React.FC<{ students: User[] }> = ({ students }) => {
    const { currentUser } = useContext(AuthContext);
    const unit = currentUser?.currencyUnit || '권';
    const [funds, setFunds] = useState<Fund[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFunds = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFunds();
            setFunds(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchFunds(); }, [fetchFunds]);

    const handleSettle = async (fundId: string, status: FundStatus) => {
        try {
            // Corrected settle_fund to settleFund
            await api.settleFund(fundId, status);
            fetchFunds();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">펀드 관리</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {funds.map(f => (
                    <div key={f.id} className="bg-white p-5 rounded-xl shadow-sm border">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{f.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded font-bold ${f.status === FundStatus.RECRUITING ? 'bg-blue-100 text-blue-700' : f.status === FundStatus.ONGOING ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {f.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{f.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                            <div><span className="text-gray-400">목표액:</span> <span className="font-bold">{f.targetAmount.toLocaleString()}{unit}</span></div>
                            <div><span className="text-gray-400">모금액:</span> <span className="font-bold">{f.totalInvestedAmount?.toLocaleString()}{unit}</span></div>
                        </div>
                        {f.status === FundStatus.ONGOING && (
                            <div className="flex gap-2">
                                <button onClick={() => handleSettle(f.id, FundStatus.SUCCESS)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">성공 정산</button>
                                <button onClick={() => handleSettle(f.id, FundStatus.FAIL)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">실패 정산</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const TeacherDashboard: React.FC = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const [view, setView] = useState<'dashboard' | 'students' | 'jobs' | 'tax' | 'funds'>('dashboard');
    const [students, setStudents] = useState<(User & { account: Account | null })[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const users = await api.getUsersByRole(Role.STUDENT);
            const usersWithAccounts = await Promise.all(
                users.map(async u => ({ ...u, account: await api.getStudentAccountByUserId(u.userId) }))
            );
            usersWithAccounts.sort((a,b) => (a.number || 0) - (b.number || 0));
            setStudents(usersWithAccounts);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const alias = currentUser?.teacherAlias || '교사 관리자';

    const renderContent = () => {
        switch (view) {
            case 'dashboard': return <DashboardView students={students} refresh={fetchData} />;
            case 'students': return <StudentManagementView students={students} refresh={fetchData} />;
            case 'jobs': return <JobManagementView refresh={fetchData} />;
            case 'tax': return <TaxView students={students} />;
            case 'funds': return <FundManagementView students={students} />;
            default: return <DashboardView students={students} refresh={fetchData} />;
        }
    };

    const NavButton = ({ id, label, Icon }: { id: typeof view, label: string, Icon: React.FC<any> }) => (
        <button onClick={() => setView(id)} className={`w-full flex items-center p-3 text-sm font-semibold rounded-lg transition-colors ${view === id ? 'bg-[#2B548F] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Icon className="w-5 h-5 mr-3" /> {label}
        </button>
    );

    const MobileNavButton = ({ id, label, Icon }: { id: typeof view, label: string, Icon: React.FC<any> }) => (
        <button onClick={() => setView(id)} className={`flex flex-col items-center justify-center w-full py-2 ${view === id ? 'text-[#2B548F]' : 'text-gray-400'}`}>
            <Icon className="w-6 h-6 mb-1" /> <span className="text-[10px]">{label}</span>
        </button>
    );

    return (
        <div className="flex h-full bg-gray-100">
            <aside className="hidden md:flex flex-col w-64 bg-white border-r p-4 shadow-sm z-10">
                <div className="px-2 mb-8">
                    <h1 className="text-xl font-bold text-gray-800">{alias}</h1>
                    <p className="text-sm text-gray-500">{currentUser?.name}</p>
                </div>
                <nav className="flex flex-col space-y-2 flex-grow">
                    <NavButton id="dashboard" label="대시보드" Icon={NewDashboardIcon} />
                    <NavButton id="students" label="학생 관리" Icon={NewManageAccountsIcon} />
                    <NavButton id="jobs" label="직업 관리" Icon={NewBriefcaseIcon} />
                    <NavButton id="tax" label="세금 관리" Icon={NewTaxIcon} />
                    <NavButton id="funds" label="펀드 관리" Icon={NewFundIcon} />
                </nav>
                <button onClick={logout} className="w-full flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-100 mt-auto">
                    <LogoutIcon className="w-5 h-5 mr-3" /> 로그아웃
                </button>
            </aside>
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="md:hidden bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
                    <h1 className="text-lg font-bold text-gray-800">{alias}</h1>
                    <button onClick={logout} className="p-2 text-gray-600"><LogoutIcon className="w-6 h-6" /></button>
                </header>
                <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-[#F3F4F6]">
                    {loading ? <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B548F]"></div></div> : renderContent()}
                </main>
                <nav className="md:hidden bg-white border-t grid grid-cols-5 pb-safe">
                    <MobileNavButton id="dashboard" label="대시보드" Icon={NewDashboardIcon} />
                    <MobileNavButton id="students" label="학생" Icon={NewManageAccountsIcon} />
                    <MobileNavButton id="jobs" label="직업" Icon={NewBriefcaseIcon} />
                    <MobileNavButton id="tax" label="세금" Icon={NewTaxIcon} />
                    <MobileNavButton id="funds" label="펀드" Icon={NewFundIcon} />
                </nav>
            </div>
        </div>
    );
};

export default TeacherDashboard;