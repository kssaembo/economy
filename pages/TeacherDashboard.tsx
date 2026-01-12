/* 
  [Supabase SQL 가이드] 
  학생 삭제 기능을 위해 아래 쿼리를 Supabase SQL Editor에서 실행해주세요.
  이 함수는 학생 유저와 관련된 모든 데이터(계좌, 거래내역, 주식, 적금, 세금 등)를 안전하게 삭제합니다.

  CREATE OR REPLACE FUNCTION public.delete_student(p_user_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
  BEGIN
      -- 1. 적금 삭제
      DELETE FROM public.student_savings WHERE "userId" = p_user_id;
      
      -- 2. 주식 삭제
      DELETE FROM public.student_stocks WHERE "userId" = p_user_id;
      
      -- 3. 세금 납부 권한/내역 삭제
      DELETE FROM public.tax_recipients WHERE student_user_id = p_user_id;
      
      -- 4. 펀드 투자 내역 삭제
      DELETE FROM public.fund_investments WHERE student_user_id = p_user_id;
      
      -- 5. 직업 배정 삭제
      DELETE FROM public.job_assignments WHERE user_id = p_user_id;
      
      -- 6. 거래 내역 삭제 (계좌 ID 참조)
      DELETE FROM public.transactions 
      WHERE "accountId" IN (SELECT "accountId" FROM public.accounts WHERE "userId" = p_user_id);
      
      -- 7. 계좌 삭제
      DELETE FROM public.accounts WHERE "userId" = p_user_id;
      
      -- 8. 최종 유저(학생) 삭제
      DELETE FROM public.users WHERE "userId" = p_user_id;
  END;
  $function$;

  -- 주식 가격 업데이트 및 이력 기록 (최종 v3 버전: text id와 numeric price 사용)
  CREATE OR REPLACE FUNCTION public.v3_update_stock_price(p_stock_id text, p_new_price numeric)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
      UPDATE public.stock_products
      SET "currentPrice" = p_new_price
      WHERE id = p_stock_id;

      INSERT INTO public.stock_price_history ("stockId", price)
      VALUES (p_stock_id, p_new_price);
  END;
  $$;
*/

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

// --- Alarms Logic Helper ---
interface AlarmItem {
    id: string;
    type: 'danger' | 'warning' | 'info';
    category: string;
    message: string;
    date: Date;
}

// --- Modals ---

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

// --- Dashboard View ---
const DashboardView: React.FC<{ students: (User & { account: Account | null })[], refresh: () => void }> = ({ students }) => {
    const [teacherAccount, setTeacherAccount] = useState<Account | null>(null);
    const [teacherTransactions, setTeacherTransactions] = useState<Transaction[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [visibleTeacherTxns, setVisibleTeacherTxns] = useState(5);
    const [activeTab, setActiveTab] = useState<'assets' | 'activity_up' | 'activity_down'>('assets');
    const [visibleRankingCount, setVisibleRankingCount] = useState(3);
    const [studentActivities, setStudentActivities] = useState<Record<string, number>>({});
    const [alarms, setAlarms] = useState<AlarmItem[]>([]);
    const [isAlarmsLoading, setIsAlarmsLoading] = useState(false);

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
                                        message: `${s.name} 학생: ${Math.abs(t.amount).toLocaleString()}권 고액 거래 발생 (${t.description})`,
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
    }, [students]);

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
                <div onClick={() => setShowHistoryModal(true)} className="bg-[#2B548F] text-white p-6 rounded-xl shadow-lg cursor-pointer hover:bg-[#234576] transition-colors relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="font-medium text-blue-200 text-sm mb-1">권쌤 지갑 (국고)</h3>
                        <p className="text-3xl font-bold">{teacherAccount?.balance.toLocaleString() ?? 0}권</p>
                        <p className="text-xs text-blue-200 mt-2 flex items-center">내역 보기 <span className="ml-1">→</span></p>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm">총 통화량 (학생)</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{totalAssets.toLocaleString()}권</p>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-gray-500 font-medium text-sm">평균 자산</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{avgAssets.toLocaleString()}권</p>
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
                                    <span className="block font-mono font-bold text-indigo-600">{(s.account?.balance || 0).toLocaleString()}권</span>
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
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
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
                                        <li key={t.transactionId} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100">
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

// --- Student Management View ---

const StudentManagementView: React.FC<{ students: (User & { account: Account | null })[], refresh: () => void }> = ({ students, refresh }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStudentQr, setSelectedStudentQr] = useState<User & { account: Account | null } | null>(null);
    const [showBatchQr, setShowBatchQr] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [selectedDetailStudent, setSelectedDetailStudent] = useState<(User & { account: Account | null }) | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'reset', data: any } | null>(null);

    const handleDelete = async () => {
        if (!confirmAction || confirmAction.type !== 'delete') return;
        try {
            const msg = await api.deleteStudents(selectedIds);
            setMessage({ type: 'success', text: msg });
            setSelectedIds([]);
            refresh();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setConfirmAction(null);
        }
    };

    const handleResetPassword = async () => {
        if (!confirmAction || confirmAction.type !== 'reset') return;
        const userId = confirmAction.data;
        try {
            await api.resetPassword(userId);
            setMessage({ type: 'success', text: '비밀번호가 초기화되었습니다.' });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setConfirmAction(null);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">학생 관리 ({students.length}명)</h2>
                <div className="flex gap-2">
                    {/* 학생 삭제 버튼 - 상시 노출, 미선택 시 비활성화 */}
                    <button 
                        onClick={() => setConfirmAction({ type: 'delete', data: null })} 
                        disabled={selectedIds.length === 0}
                        className={`px-3 py-2 text-white rounded-lg text-sm font-bold shadow transition-colors flex items-center ${selectedIds.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'}`}
                    >
                        <XIcon className="w-4 h-4 mr-1"/> 삭제 {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                    </button>
                    <button onClick={setShowBatchQr.bind(null, true)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center border border-gray-200">
                        <QrCodeIcon className="w-4 h-4 mr-1"/> QR 일괄 출력
                    </button>
                    <button onClick={setShowAddModal.bind(null, true)} className="px-3 py-2 bg-[#2B548F] text-white rounded-lg text-sm font-bold shadow hover:bg-[#234576] transition-colors flex items-center">
                        <UserAddIcon className="w-4 h-4 mr-1"/> 학생 추가
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-grow overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-grow">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-4">
                                    <input type="checkbox" className="rounded text-[#2B548F] focus:ring-[#2B548F]" 
                                        onChange={(e) => setSelectedIds(e.target.checked ? students.map(s => s.userId) : [])}
                                        checked={students.length > 0 && selectedIds.length === students.length}
                                    />
                                </th>
                                <th className="p-4 min-w-[120px]">번호/이름</th>
                                <th className="p-4">계좌번호</th>
                                <th className="p-4 text-center">기능</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map(s => (
                                <tr key={s.userId} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded text-[#2B548F] focus:ring-[#2B548F]" 
                                            checked={selectedIds.includes(s.userId)} 
                                            onChange={() => toggleSelect(s.userId)}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center cursor-pointer group" onClick={() => setSelectedDetailStudent(s)}>
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3 group-hover:bg-indigo-200 transition-colors">
                                                {s.number}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:underline decoration-indigo-500 underline-offset-2">{s.name}</div>
                                                <div className="text-xs text-gray-500">{s.grade}학년 {s.class}반</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-gray-600">
                                        {s.account ? s.account.accountId : <span className="text-red-400 text-xs">계좌 없음</span>}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => setSelectedStudentQr(s)} className="px-2 py-1 bg-white border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50 font-medium">
                                                QR
                                            </button>
                                            <button onClick={() => setConfirmAction({ type: 'reset', data: s.userId })} className="px-2 py-1 bg-white border border-red-200 text-red-500 rounded text-xs hover:bg-red-50 font-medium">
                                                초기화
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">등록된 학생이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onComplete={refresh} />}
            {selectedDetailStudent && (
                <StudentDetailModal 
                    student={selectedDetailStudent} 
                    onClose={() => setSelectedDetailStudent(null)} 
                />
            )}
            {selectedStudentQr && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStudentQr(null)}>
                    <div className="bg-white p-8 rounded-xl flex flex-col items-center max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-1">{selectedStudentQr.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{selectedStudentQr.grade}학년 {selectedStudentQr.class}반 {selectedStudentQr.number}번</p>
                        {selectedStudentQr.account?.qrToken ? (
                            <div className="p-4 border-4 border-gray-100 rounded-xl bg-white mb-4">
                                <QRCodeSVG value={`${getQrBaseUrl()}?token=${selectedStudentQr.account.qrToken}`} size={180} />
                            </div>
                        ) : (
                            <p className="text-red-500 my-4">QR 토큰이 없습니다.</p>
                        )}
                        <p className="text-xs text-gray-400 mb-6 text-center break-all w-full">
                            {getQrBaseUrl()}?token={selectedStudentQr.account?.qrToken?.substring(0,10)}...
                        </p>
                        <button onClick={() => setSelectedStudentQr(null)} className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold">닫기</button>
                    </div>
                </div>
            )}
            {showBatchQr && (
                <BatchQrPrintModal students={students} onClose={() => setShowBatchQr(false)} />
            )}
            <ConfirmModal 
                isOpen={!!confirmAction}
                title={confirmAction?.type === 'delete' ? "학생 삭제" : "비밀번호 초기화"}
                message={confirmAction?.type === 'delete' ? `${selectedIds.length}명의 학생을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.` : "비밀번호를 '1234'로 초기화하시겠습니까?"}
                onConfirm={confirmAction?.type === 'delete' ? handleDelete : handleResetPassword}
                onCancel={() => setConfirmAction(null)}
                isDangerous={true}
                confirmText={confirmAction?.type === 'delete' ? "삭제" : "초기화"}
            />
            <MessageModal isOpen={!!message} type={message?.type || 'success'} message={message?.text || ''} onClose={() => setMessage(null)} />
        </div>
    );
};

const AddStudentModal: React.FC<{ onClose: () => void, onComplete: () => void }> = ({ onClose, onComplete }) => {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('6');
    const [cls, setCls] = useState('1');
    const [number, setNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleSubmit = async () => {
        if (!name || !grade || !cls || !number) {
            setError("모든 항목을 입력해주세요.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.addStudent(name, parseInt(grade), parseInt(cls), parseInt(number));
            onComplete();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-sm">
                <h3 className="text-xl font-bold mb-4">학생 추가</h3>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input type="number" value={grade} onChange={e => setGrade(e.target.value)} placeholder="학년" className="w-full p-2 border rounded text-center"/>
                        <input type="number" value={cls} onChange={e => setCls(e.target.value)} placeholder="반" className="w-full p-2 border rounded text-center"/>
                    </div>
                    <div className="flex gap-2">
                        <input type="number" value={number} onChange={e => setNumber(e.target.value)} placeholder="번호" className="w-1/3 p-2 border rounded text-center"/>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" className="w-2/3 p-2 border rounded"/>
                    </div>
                </div>
                {error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm text-center">
                        {error}
                    </div>
                )}
                <button onClick={handleSubmit} disabled={loading} className="w-full mt-6 p-3 bg-[#2B548F] text-white rounded-lg font-bold hover:bg-[#234576] disabled:bg-gray-400">
                    {loading ? '등록 중...' : '등록하기'}
                </button>
                <button onClick={onClose} disabled={loading} className="w-full mt-2 p-2 text-gray-500 hover:text-gray-800 disabled:text-gray-300">취소</button>
            </div>
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
                const trans = await api.getTransactionsByAccountId(student.account.accountId);
                setTransactions(trans);
                const stocks = await api.getStudentStocks(student.userId);
                const stockVal = stocks.reduce((sum, s) => sum + (s.quantity * (s.stock?.currentPrice || 0)), 0);
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
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
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
    const validStudents = students.filter(s => s.account && s.account.qrToken);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] flex flex-col">
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
                            <div key={s.userId} className="bg-white p-4 rounded-lg border border-gray-300 flex flex-col items-center justify-center text-center page-break-inside-avoid shadow-sm break-inside-avoid">
                                <p className="font-bold text-lg text-gray-800 mb-1">{s.number}. {s.name}</p>
                                <p className="text-xs text-gray-500 mb-2">{s.grade}학년 {s.class}반</p>
                                <div className="border p-1 mb-2">
                                    <QRCodeSVG value={`${getQrBaseUrl()}?token=${s.account!.qrToken}`} size={120} />
                                </div>
                                <p className="text-[10px] text-gray-400 break-all leading-tight">{s.account!.qrToken!.substring(0, 8)}...</p>
                            </div>
                        ))}
                    </div>
                     {validStudents.length === 0 && <p className="text-center text-gray-500">출력할 QR 코드가 없습니다.</p>}
                </div>
            </div>
             <style>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    body * { visibility: hidden; }
                    #print-section, #print-section * { visibility: visible; }
                    #print-section { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible; background: white; padding: 0; }
                    .break-inside-avoid { break-inside: avoid; }
                    ::-webkit-scrollbar { display: none; }
                }
            `}</style>
        </div>
    );
};

// --- Job Management View ---

const JobManagementView: React.FC<{ refresh: () => void }> = ({ refresh }) => {
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
                                <span className="font-bold">{job.salary.toLocaleString()}권</span>
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
                                <span>{(job.salary + (job.incentive || 0)).toLocaleString()}권</span>
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
            <ConfirmModal 
                isOpen={!!confirmAction}
                title={confirmAction?.type === 'delete' ? '직업 삭제' : confirmAction?.type === 'pay_all' ? '월급 일괄 지급' : '주급 지급'}
                message={
                    confirmAction?.type === 'delete' ? '정말로 이 직업을 삭제하시겠습니까?' : 
                    confirmAction?.type === 'pay_all' ? '모든 직업의 월급(인센티브 포함)을 일괄 지급하시겠습니까?' :
                    '해당 직업의 담당 학생들에게 주급(월급+인센티브)을 지급하시겠습니까?'
                }
                onConfirm={() => {
                    if (confirmAction?.type === 'delete') handleDeleteJob();
                    else if (confirmAction?.type === 'pay_all') handlePaySalaries();
                    else if (confirmAction?.type === 'pay_one') handlePayOneSalary();
                }}
                onCancel={() => setConfirmAction(null)}
                isDangerous={confirmAction?.type === 'delete'}
                confirmText={confirmAction?.type === 'delete' ? '삭제' : '지급'}
            />
            <MessageModal isOpen={!!message} type={message?.type || 'success'} message={message?.text || ''} onClose={() => setMessage(null)} />
        </div>
    );
};

const AddJobModal: React.FC<{ onClose: () => void, onComplete: () => void }> = ({ onClose, onComplete }) => {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [salary, setSalary] = useState('');
    const handleSubmit = async () => {
        try {
            await api.addJob(name, desc, parseInt(salary));
            onComplete();
            onClose();
        } catch (e: any) { alert(e.message); }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm">
                <h3 className="text-xl font-bold mb-4">직업 추가</h3>
                <div className="space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="직업명" className="w-full p-2 border rounded"/>
                    <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="설명" className="w-full p-2 border rounded"/>
                    <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="월급" className="w-full p-2 border rounded"/>
                </div>
                <button onClick={handleSubmit} className="w-full mt-4 p-3 bg-blue-600 text-white rounded-lg font-bold">추가</button>
                <button onClick={onClose} className="w-full mt-2 p-2 text-gray-500">취소</button>
            </div>
        </div>
    );
};

const AssignJobModal: React.FC<{ job: Job, students: User[], onClose: () => void, onComplete: () => void }> = ({ job, students, onClose, onComplete }) => {
    const [selected, setSelected] = useState<string[]>(job.assigned_students?.map(s => s.userId) || []);
    const handleSubmit = async () => {
        try {
            await api.manageJobAssignment(job.id, selected);
            onComplete();
            onClose();
        } catch (e: any) { alert(e.message); }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold mb-4">{job.jobName} 배정</h3>
                <div className="flex-grow overflow-y-auto border rounded p-2 grid grid-cols-2 gap-2">
                    {students.map(s => (
                        <label key={s.userId} className="flex items-center space-x-2 text-sm">
                            <input 
                                type="checkbox" 
                                checked={selected.includes(s.userId)} 
                                onChange={(e) => {
                                    if(e.target.checked) setSelected([...selected, s.userId]);
                                    else setSelected(selected.filter(id => id !== s.userId));
                                }} 
                            />
                            <span>{s.name}</span>
                        </label>
                    ))}
                </div>
                <button onClick={handleSubmit} className="w-full mt-4 p-3 bg-blue-600 text-white rounded-lg font-bold">저장</button>
                <button onClick={onClose} className="w-full mt-2 p-2 text-gray-500">취소</button>
            </div>
        </div>
    );
};

// --- Tax View ---
const TaxView: React.FC<{ students: User[] }> = ({ students }) => {
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
                                    <span className="block font-bold text-lg text-red-600">{tax.amount.toLocaleString()}권</span>
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
            {showAddModal && (
                <AddTaxModal students={students} onClose={() => setShowAddModal(false)} onComplete={fetchTaxes} />
            )}
            <ConfirmModal 
                isOpen={!!confirmAction}
                title="세금 항목 삭제"
                message="정말로 이 세금 항목을 삭제하시겠습니까? 학생들에게 발행된 고지서도 모두 삭제됩니다."
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmAction(null)}
                confirmText="삭제"
                isDangerous={true}
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

const AddTaxModal: React.FC<{ students: User[], onClose: () => void, onComplete: () => void }> = ({ students, onClose, onComplete }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(students.map(s => s.userId));
    const handleSubmit = async () => {
        try {
            await api.createTax(name, parseInt(amount), dueDate, selectedIds);
            onComplete();
            onClose();
        } catch (e: any) { alert(e.message); }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">새 세금 고지</h3>
                <div className="space-y-3 mb-4">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="세금 항목명" className="w-full p-2 border rounded"/>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="금액" className="w-full p-2 border rounded"/>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-2 border rounded"/>
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
    const [settleModal, setSettleModal] = useState<{ isOpen: boolean, fund: Fund | null }>({ isOpen: false, fund: null });
    const [confirmAction, setConfirmAction] = useState<{ type: 'delete_fund', data: Fund } | null>(null);

    const fetchFunds = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFunds();
            setFunds(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchFunds(); }, [fetchFunds]);

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

    const handleDeleteFund = async () => {
        if (!confirmAction || confirmAction.type !== 'delete_fund') return;
        const fund = confirmAction.data;
        try {
            const msg = await api.deleteFund(fund.id);
            setMessageModal({ isOpen: true, type: 'success', message: msg });
            fetchFunds();
        } catch (e: any) {
            setMessageModal({ isOpen: true, type: 'error', message: e.message });
        } finally {
            setConfirmAction(null);
        }
    };
    
    if (loading) return <div className="text-center p-8">펀드 정보를 불러오는 중...</div>;

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
                    <div key={fund.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border hover:border-blue-200 transition-colors relative">
                        <div className="p-4 flex justify-between items-start border-b">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{fund.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">제안: {fund.creatorName} 학생</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusBadge(fund.status)}
                                <button 
                                    onClick={() => setConfirmAction({ type: 'delete_fund', data: fund })}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    title="펀드 삭제"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
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
                        {fund.status === FundStatus.ONGOING && (
                            <div className="p-3 bg-gray-50 border-t flex gap-2">
                                <button onClick={() => setSettleModal({ isOpen: true, fund })} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm">
                                    결과 입력 및 정산
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {showAddModal && <AddFundModal students={students} onClose={() => setShowAddModal(false)} onComplete={fetchFunds} />}
            
            {settleModal.isOpen && settleModal.fund && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm">
                        <h3 className="text-xl font-bold mb-2">펀드 결과 입력</h3>
                        <p className="text-gray-600 mb-6 text-sm">결과 선택 시 자동 정산됩니다.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => handleSettle(FundStatus.SUCCESS)} className="w-full p-3 bg-blue-100 text-blue-800 font-bold rounded-lg hover:bg-blue-200 text-left px-4">🎯 달성</button>
                            <button onClick={() => handleSettle(FundStatus.EXCEED)} className="w-full p-3 bg-purple-100 text-purple-800 font-bold rounded-lg hover:bg-purple-200 text-left px-4">🚀 초과 달성</button>
                             <button onClick={() => handleSettle(FundStatus.FAIL)} className="w-full p-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 text-left px-4">😢 실패</button>
                        </div>
                        <button onClick={() => setSettleModal({ isOpen: false, fund: null })} className="mt-4 w-full p-2 text-gray-500 hover:text-gray-800">취소</button>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={!!confirmAction}
                title="펀드 삭제 확인"
                message={`정말로 '${confirmAction?.data?.name}' 펀드를 삭제하시겠습니까? 
                
모집 중이거나 운용 중인 펀드일 경우, 가입한 모든 학생들에게 투자 원금이 전액 환불 처리됩니다.`}
                onConfirm={handleDeleteFund}
                onCancel={() => setConfirmAction(null)}
                confirmText="삭제하기"
                isDangerous={true}
            />

            <MessageModal isOpen={!!messageModal.isOpen} type={messageModal.type} message={messageModal.message} onClose={() => setMessageModal({ ...messageModal, isOpen: false })} />
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
        setFormData(prev => ({ ...prev, [name]: ['unitPrice', 'targetAmount', 'baseReward', 'incentiveReward'].includes(name) ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = async () => {
        if (Object.values(formData).some(v => v === '' || (typeof v === 'number' && v < 0))) { 
            setError('모든 항목을 올바르게 입력해주세요.'); 
            return; 
        }
        setLoading(true);
        setError('');
        try { 
            await api.createFund(formData); 
            onComplete(); 
            onClose(); 
        }
        catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">새 펀드 개설</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block font-semibold mb-1">펀드명</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" placeholder="예: 학급 간식 펀드"/>
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">펀드 설명</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="펀드 목적과 운용 계획을 입력하세요."/>
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">제안 학생</label>
                        <select name="creatorId" value={formData.creatorId} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                            <option value="">학생을 선택하세요</option>
                            {students.map(s => <option key={s.userId} value={s.userId}>{s.name} ({s.number}번)</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold mb-1">1좌당 투자금액</label>
                            <div className="relative">
                                <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} className="w-full p-2 border rounded pr-6" placeholder="1000"/>
                                <span className="absolute right-2 top-2 text-gray-400">권</span>
                            </div>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">목표 모집금액</label>
                            <div className="relative">
                                <input type="number" name="targetAmount" value={formData.targetAmount} onChange={handleChange} className="w-full p-2 border rounded pr-6" placeholder="100000"/>
                                <span className="absolute right-2 top-2 text-gray-400">권</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold mb-1">기본 성공 보상 (좌당)</label>
                            <div className="relative">
                                <input type="number" name="baseReward" value={formData.baseReward} onChange={handleChange} className="w-full p-2 border rounded pr-6 text-blue-600 font-bold" placeholder="100"/>
                                <span className="absolute right-2 top-2 text-gray-400">권</span>
                            </div>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">초과 달성 보상 (좌당)</label>
                            <div className="relative">
                                <input type="number" name="incentiveReward" value={formData.incentiveReward} onChange={handleChange} className="w-full p-2 border rounded pr-6 text-purple-600 font-bold" placeholder="200"/>
                                <span className="absolute right-2 top-2 text-gray-400">권</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold mb-1">모집 마감일</label>
                            <input type="date" name="recruitmentDeadline" value={formData.recruitmentDeadline} onChange={handleChange} className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">평가(종료)일</label>
                            <input type="date" name="maturityDate" value={formData.maturityDate} onChange={handleChange} className="w-full p-2 border rounded"/>
                        </div>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mt-4 border border-red-100">{error}</div>}
                
                <button onClick={handleSubmit} disabled={loading} className="mt-6 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-gray-300">
                    {loading ? '처리 중...' : '펀드 개설하기'}
                </button>
            </div>
        </div>
    );
};

// --- Teacher Dashboard ---
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
                    <h1 className="text-xl font-bold text-gray-800">교사 관리자</h1>
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
                    <h1 className="text-lg font-bold text-gray-800">교사 관리자</h1>
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