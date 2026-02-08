/* ... existing sql comments ... */
import { api } from '../services/api';
import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
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

const AddStudentModal: React.FC<{ onClose: () => void, onComplete: () => void }> = ({ onClose, onComplete }) => {
    const { currentUser } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [classNum, setClassNum] = useState('');
    const [number, setNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !grade || !classNum || !number || !currentUser) return;
        setLoading(true);
        try {
            await api.addStudent(name, parseInt(grade), parseInt(classNum), parseInt(number), currentUser.userId);
            onComplete();
            onClose();
        } catch (e: any) {
            console.error(e);
            alert(e.message || '학생 추가 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">학생 추가</h3>
                <div className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름" className="w-full p-3 border rounded-lg" />
                    <div className="grid grid-cols-3 gap-2">
                        <input type="number" value={grade} onChange={e => setGrade(e.target.value)} placeholder="학년" className="w-full p-3 border rounded-lg" />
                        <input type="number" value={classNum} onChange={e => setClassNum(e.target.value)} placeholder="반" className="w-full p-3 border rounded-lg" />
                        <input type="number" value={number} onChange={e => setNumber(e.target.value)} placeholder="번호" className="w-full p-3 border rounded-lg" />
                    </div>
                    <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-[#2B548F] text-white font-bold rounded-lg disabled:bg-gray-300">
                        {loading ? '추가 중...' : '추가하기'}
                    </button>
                    <button onClick={onClose} className="w-full py-2 text-gray-500 font-medium">닫기</button>
                </div>
            </div>
        </div>
    );
};

const QrPrintModal: React.FC<{ students: (User & { account: Account | null })[], onClose: () => void }> = ({ students, onClose }) => {
    const baseUrl = getQrBaseUrl();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 overflow-hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-gray-800">QR 코드 출력 미리보기</h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">인쇄하기</button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300">닫기</button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-8 bg-gray-100" id="print-section">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {students.map(s => (
                            <div key={s.userId} className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center text-center break-inside-avoid shadow-sm">
                                <p className="font-black text-lg mb-2 text-gray-800">{s.grade}-{s.class} {s.number} {s.name}</p>
                                <div className="p-2 bg-white border border-gray-100 rounded-lg mb-3">
                                    <QRCodeSVG value={`${baseUrl}/?token=${s.account?.qrToken}`} size={140} level="H" />
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium">QR 코드를 스캔하면 계좌로 바로 접속됩니다.</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-400 rounded-b-2xl">
                    인쇄 시 '배경 그래픽' 옵션을 켜주시면 더 깔끔하게 출력됩니다.
                </div>
            </div>
        </div>
    );
};

const AddJobModal: React.FC<{ onClose: () => void, onComplete: () => void }> = ({ onClose, onComplete }) => {
    const { currentUser } = useContext(AuthContext); // currentUser 컨텍스트 추가
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [salary, setSalary] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !salary || !currentUser) return; // currentUser 체크 추가
        setLoading(true);
        try {
            await api.addJob(name, desc, parseInt(salary), currentUser.userId); // 4번째 인자(userId) 추가
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
    const { currentUser } = useContext(AuthContext); // currentUser 컨텍스트 추가
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(students.map(s => s.userId));
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name || !amount || !dueDate || selectedIds.length === 0 || !currentUser) return; // currentUser 체크 추가
        setLoading(true);
        try {
            await api.createTax(name, parseInt(amount), dueDate, selectedIds, currentUser.userId); // 5번째 인자(userId) 추가
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

const AddFundModal: React.FC<{ students: User[], onClose: () => void, onComplete: () => void }> = ({ students, onClose, onComplete }) => {
    const { currentUser } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [creatorId, setCreatorId] = useState('');
    const [unitPrice, setUnitPrice] = useState('10');
    const [targetAmount, setTargetAmount] = useState('1000');
    const [baseReward, setBaseReward] = useState('11'); 
    const [incentiveReward, setIncentiveReward] = useState('1'); 
    const [deadline, setDeadline] = useState('');
    const [maturity, setMaturity] = useState('');
    const [loading, setLoading] = useState(false);

    const unit = currentUser?.currencyUnit || '권';

    const handleSubmit = async () => {
        if (!name || !unitPrice || !targetAmount || !deadline || !maturity || !currentUser || !creatorId) {
            alert('모든 항목을 입력하고 신청 학생을 선택해주세요.');
            return;
        }
        setLoading(true);
        try {
            await api.createFund({
                name,
                description: desc,
                creatorId: creatorId,
                teacherId: currentUser.userId,
                unitPrice: parseInt(unitPrice),
                targetAmount: parseInt(targetAmount),
                baseReward: parseFloat(baseReward),
                incentiveReward: parseFloat(incentiveReward),
                recruitmentDeadline: deadline,
                maturityDate: maturity
            });
            onComplete();
            onClose();
        } catch (e: any) {
            console.error(e);
            alert(e.message || '펀드 등록 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md flex flex-col max-h-[90vh]">
                <h3 className="text-xl font-bold mb-4">새 펀드 상품 등록</h3>
                <div className="space-y-3 overflow-y-auto pr-1">
                    <div>
                        <label className="text-xs text-gray-500 ml-1">펀드 신청 학생 (기획자)</label>
                        <select 
                            value={creatorId} 
                            onChange={e => setCreatorId(e.target.value)} 
                            className="w-full p-2.5 border rounded-lg bg-white"
                        >
                            <option value="">학생을 선택하세요</option>
                            {students.map(s => (
                                <option key={s.userId} value={s.userId}>{s.grade}-{s.class} {s.number} {s.name}</option>
                            ))}
                        </select>
                    </div>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="펀드 명칭" className="w-full p-2.5 border rounded-lg" />
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="상품 설명" className="w-full p-2.5 border rounded-lg" rows={2} />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-500 ml-1">1좌당 가격 ({unit})</label>
                            <input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 ml-1">목표 금액 ({unit})</label>
                            <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-500 ml-1 font-bold text-blue-600">기본 배당금 ({unit})</label>
                            <input type="number" value={baseReward} onChange={e => setBaseReward(e.target.value)} placeholder="예: 11" className="w-full p-2.5 border-2 border-blue-100 rounded-lg focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 ml-1 font-bold text-indigo-600">추가 인센티브 ({unit})</label>
                            <input type="number" value={incentiveReward} onChange={e => setIncentiveReward(e.target.value)} placeholder="예: 1" className="w-full p-2.5 border-2 border-indigo-100 rounded-lg focus:border-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 ml-1">모집 마감일 (날짜만 선택)</label>
                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 ml-1">만기 정산일 (날짜만 선택)</label>
                        <input type="date" value={maturity} onChange={e => setMaturity(e.target.value)} className="w-full p-2.5 border rounded-lg" />
                    </div>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="w-full py-3 mt-6 bg-[#2B548F] text-white font-bold rounded-lg shadow-lg hover:bg-[#234576] active:scale-95 transition-all">
                    {loading ? '등록 중...' : '상품 등록하기'}
                </button>
                <button onClick={onClose} className="w-full py-2 mt-2 text-gray-500 font-medium">닫기</button>
            </div>
        </div>
    );
};

const IssueCurrencyModal: React.FC<{ onClose: () => void, onComplete: () => void }> = ({ onClose, onComplete }) => {
    const { currentUser } = useContext(AuthContext);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const unit = currentUser?.currencyUnit || '권';

    const handleSubmit = async () => {
        if (!amount || parseInt(amount) <= 0 || !currentUser) return;
        setLoading(true);
        try {
            await api.issueCurrency(currentUser.userId, parseInt(amount));
            onComplete();
            onClose();
        } catch (e: any) {
            alert(e.message || '발행 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-2">화폐 발행 (중앙은행)</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">입력한 금액만큼 무(無)에서 화폐를 생성하여<br/><span className="text-indigo-600 font-bold">국고 계좌</span>로 즉시 입금합니다.</p>
                <div className="space-y-4">
                    <div className="relative">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full p-4 pr-12 border-2 border-indigo-100 rounded-xl outline-none focus:border-indigo-500 text-2xl font-black" />
                        <span className="absolute right-4 top-5 font-bold text-gray-400">{unit}</span>
                    </div>
                    <button onClick={handleSubmit} disabled={loading || !amount} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:bg-gray-300">
                        {loading ? '발행 처리 중...' : '지금 발행하기'}
                    </button>
                    <button onClick={onClose} className="w-full py-2 text-gray-400 font-medium">취소</button>
                </div>
            </div>
        </div>
    );
};

const FundInvestorsModal: React.FC<{ fund: Fund, onClose: () => void }> = ({ fund, onClose }) => {
    const [investors, setInvestors] = useState<{ student_name: string, units: number, invested_amount: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const unit = useContext(AuthContext).currentUser?.currencyUnit || '권';

    useEffect(() => {
        api.getFundInvestors(fund.id).then(setInvestors).finally(() => setLoading(false));
    }, [fund.id]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-800">'{fund.name}' 투자자 목록</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <XIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400 text-sm">조회 중...</div>
                    ) : investors.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-2 text-left">이름</th>
                                    <th className="p-2 text-right">구좌</th>
                                    <th className="p-2 text-right">투자액</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {investors.map((inv, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-2 font-medium">{inv.student_name}</td>
                                        <td className="p-2 text-right">{inv.units}좌</td>
                                        <td className="p-2 text-right font-bold text-indigo-600">{Number(inv.invested_amount).toLocaleString()}{unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-10 text-center text-gray-400 font-medium">아직 가입한 학생이 없습니다.</div>
                    )}
                </div>
                <button onClick={onClose} className="w-full py-3 mt-4 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200">닫기</button>
            </div>
        </div>
    );
};

// --- Sub-Views ---

// Fix: Correctly destructure 'refresh' prop even if not currently used directly, to match type definition and prevent potential errors.
const DashboardView: React.FC<{ students: (User & { account: Account | null })[], refresh: () => void }> = ({ students, refresh }) => {
    const { currentUser } = useContext(AuthContext);
    const [teacherAccount, setTeacherAccount] = useState<Account | null>(null);
    const [teacherTransactions, setTeacherTransactions] = useState<Transaction[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false); // 발행 모달 상태 추가
    const [visibleTeacherTxns, setVisibleTeacherTxns] = useState(5);
    const [visibleHistoryModalTxns, setVisibleHistoryModalTxns] = useState(10);
    const [activeTab, setActiveTab] = useState<'assets' | 'activity_up' | 'activity_down'>('assets');
    const [visibleRankingCount, setVisibleRankingCount] = useState(3);
    const [studentActivities, setStudentActivities] = useState<Record<string, number>>({});
    const [alarms, setAlarms] = useState<AlarmItem[]>([]);
    const [isAlarmsLoading, setIsAlarmsLoading] = useState(false);

    const alias = currentUser?.teacherAlias || '교사';
    const unit = currentUser?.currencyUnit || '권';

    const fetchTeacherData = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchTeacherData();
    }, [fetchTeacherData]);

    useEffect(() => {
        const fetchData = async () => {
            setIsAlarmsLoading(true);
            const activityMap: Record<string, number> = {};
            const newAlarms: AlarmItem[] = [];
            const todayStr = new Date().toLocaleDateString();

            try {
                const [taxes, funds] = await Promise.all([
                    api.getTaxes(currentUser?.userId || ''), 
                    api.getFunds(currentUser?.userId || '')
                ]);
                
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
    }, [students, unit, currentUser?.userId]);

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

    const handleIssueComplete = () => {
        fetchTeacherData();
    };

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 선생님 지갑 박스: 가로 2배 (md:col-span-2) */}
                <div onClick={() => { setVisibleHistoryModalTxns(10); setShowHistoryModal(true); }} className="md:col-span-2 bg-[#2B548F] text-white p-8 rounded-xl shadow-lg cursor-pointer hover:bg-[#234576] transition-colors relative overflow-hidden group min-h-[160px] flex flex-col justify-center">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium text-blue-200 text-sm mb-1">{alias} 지갑 (국고)</h3>
                                <p className="text-5xl font-black">{teacherAccount?.balance.toLocaleString() ?? 0}{unit}</p>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowIssueModal(true); }} 
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg border border-white/30 transition-all active:scale-95 text-xs flex items-center"
                            >
                                <PlusIcon className="w-4 h-4 mr-1" /> 발행
                            </button>
                        </div>
                        <p className="text-xs text-blue-200 mt-4 flex items-center">내역 보기 <span className="ml-1">→</span></p>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                </div>

                {/* 우측 세로 배열 박스들 */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <h3 className="text-gray-500 font-bold text-sm">총 통화량</h3>
                        <p className="text-xl font-black text-indigo-600">{totalAssets.toLocaleString()}{unit}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <h3 className="text-gray-500 font-bold text-sm">평균 자산</h3>
                        <p className="text-xl font-black text-green-600">{avgAssets.toLocaleString()}{unit}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <h3 className="text-gray-500 font-bold text-sm">등록 학생</h3>
                        <p className="text-xl font-black text-gray-800">{students.length}명</p>
                    </div>
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
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-sm md:max-w-4xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
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

             {showIssueModal && <IssueCurrencyModal onClose={() => setShowIssueModal(false)} onComplete={handleIssueComplete} />}
        </div>
    );
};

// Fix: Correctly destructure 'refresh' prop from arguments to fix "Cannot find name 'refresh'" error.
const StudentManagementView: React.FC<{ students: (User & { account: Account | null })[], refresh: () => void }> = ({ students, refresh }) => {
    const { currentUser } = useContext(AuthContext);
    const unit = currentUser?.currencyUnit || '권';
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQrPrintModal, setShowQrPrintModal] = useState(false);
    const [qrStudents, setQrStudents] = useState<(User & { account: Account | null })[]>([]);
    const [resetTarget, setResetTarget] = useState<User | null>(null);
    const [showResetSuccess, setShowResetSuccess] = useState(false);

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

    const handleResetPassword = async () => {
        if (!resetTarget) return;
        try {
            await api.resetPassword(resetTarget.userId);
            setResetTarget(null);
            setShowResetSuccess(true);
        } catch (e: any) {
            alert(e.message || '비밀번호 초기화 중 오류가 발생했습니다.');
        }
    };

    const openBulkQr = () => {
        if (selectedIds.length > 0) {
            setQrStudents(students.filter(s => selectedIds.includes(s.userId)));
        } else {
            setQrStudents(students);
        }
        setShowQrPrintModal(true);
    };

    const openSingleQr = (student: (User & { account: Account | null })) => {
        setQrStudents([student]);
        setShowQrPrintModal(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">학생 관리</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-[#2B548F] text-white rounded-lg text-sm font-bold shadow hover:bg-[#234576] transition-all active:scale-95">학생 추가</button>
                    <button onClick={openBulkQr} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow hover:bg-green-700 transition-all active:scale-95">QR 일괄 출력</button>
                    <button 
                        onClick={() => setConfirmDelete(true)} 
                        className={`px-3 py-2 text-white rounded-lg text-sm font-bold shadow transition-all active:scale-95 ${selectedIds.length > 0 ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-gray-400 hover:bg-gray-500'}`}
                    >
                        학생 삭제 {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 w-12 text-center"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? students.map(s => s.userId) : [])} checked={selectedIds.length === students.length && students.length > 0} className="w-4 h-4 rounded border-gray-300" /></th>
                            <th className="p-3 text-left font-bold text-gray-500 uppercase tracking-wider">번호</th>
                            <th className="p-3 text-left font-bold text-gray-500 uppercase tracking-wider">이름</th>
                            <th className="p-3 text-right font-bold text-gray-500 uppercase tracking-wider px-6">잔액</th>
                            <th className="p-3 text-left font-bold text-gray-500 uppercase tracking-wider">계좌번호</th>
                            <th className="p-3 text-center font-bold text-gray-500 uppercase tracking-wider">QR</th>
                            <th className="p-3 text-center font-bold text-gray-500 uppercase tracking-wider">초기화</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.map(s => (
                            <tr key={s.userId} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-3 text-center"><input type="checkbox" checked={selectedIds.includes(s.userId)} onChange={() => toggleStudent(s.userId)} className="w-4 h-4 rounded border-gray-300" /></td>
                                <td className="p-3 font-medium text-gray-600">{s.number}</td>
                                <td className="p-3 font-bold text-gray-900">{s.name}</td>
                                <td className="p-3 text-right px-6">
                                    <span className="font-bold text-indigo-600">{(s.account?.balance || 0).toLocaleString()}<span className="text-[10px] ml-0.5 font-black text-black">{unit}</span></span>
                                </td>
                                <td className="p-3 font-mono text-xs text-gray-800 font-bold">
                                    {s.account ? (
                                        (s.account as any).accountId || 
                                        (s.account as any).accountid || 
                                        (s.account as any).id || 
                                        '-'
                                    ) : '-'}
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => openSingleQr(s)} className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all mx-auto" title="개별 QR 코드">
                                        <QrCodeIcon className="w-5 h-5" />
                                    </button>
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => setResetTarget(s)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold hover:bg-gray-200 transition-colors" title="비밀번호 초기화">
                                        초기화
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {students.length === 0 && (
                    <div className="p-16 text-center">
                        <ErrorIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">등록된 학생이 없습니다.</p>
                        <p className="text-gray-400 text-xs mt-1">'학생 추가' 버튼을 눌러 학생을 등록해 주세요.</p>
                    </div>
                )}
            </div>
            
            {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onComplete={refresh} />}
            {showQrPrintModal && <QrPrintModal students={qrStudents} onClose={() => setShowQrPrintModal(false)} />}
            
            <ConfirmModal 
                isOpen={confirmDelete} 
                title="학생 삭제" 
                message={selectedIds.length > 0 ? `선택한 ${selectedIds.length}명의 학생을 영구적으로 삭제하시겠습니까? 계좌 및 모든 기록이 사라지며 복구할 수 없습니다.` : "삭제할 학생을 먼저 선택해 주세요."} 
                onConfirm={selectedIds.length > 0 ? handleDelete : () => setConfirmDelete(false)} 
                onCancel={() => setConfirmDelete(false)} 
                isDangerous={selectedIds.length > 0} 
                confirmText={selectedIds.length > 0 ? "삭제하기" : "확인"} 
            />

            <ConfirmModal 
                isOpen={!!resetTarget} 
                title="비밀번호 초기화" 
                message={`'${resetTarget?.name}' 학생의 비밀번호를 초기화하시겠습니까?`} 
                onConfirm={handleResetPassword} 
                onCancel={() => setResetTarget(null)} 
                confirmText="초기화하기" 
            />

            <MessageModal 
                isOpen={showResetSuccess} 
                type="success" 
                message="초기 비밀번호 '1234'로 변경되었습니다." 
                onClose={() => setShowResetSuccess(false)} 
            />
        </div>
    );
};

// Fix: Correctly destructure 'refresh' prop from arguments to fix "Cannot find name 'refresh'" error.
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
            const [j, s] = await Promise.all([
                api.getJobs(currentUser?.userId || ''), 
                api.getUsersByRole(Role.STUDENT, currentUser?.userId || '')
            ]);
            setJobs(j);
            setStudents(s);
        } catch (e) { console.error(e); }
    }, [currentUser?.userId]);

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
            const data = await api.getTaxes(currentUser?.userId || '');
            setTaxes(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [currentUser?.userId]);

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
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedFundForInvestors, setSelectedFundForInvestors] = useState<Fund | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [fundToDelete, setFundToDelete] = useState<string | null>(null); // 삭제 확인용 상태 추가

    const fetchFunds = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFunds(currentUser?.userId || '');
            setFunds(data);
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoading(false); 
        }
    }, [currentUser?.userId]);

    useEffect(() => { fetchFunds(); }, [fetchFunds]);

    const handleSettle = async (fundId: string, status: FundStatus) => {
        try {
            await api.settleFund(fundId, status);
            setMessage({ type: 'success', text: '펀드 정산이 완료되었습니다.' });
            fetchFunds();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, fundId: string) => {
        e.stopPropagation(); // 카드 클릭 방지
        setFundToDelete(fundId); // 브라우저 confirm 대신 커스텀 모달용 상태 업데이트
    };

    const confirmDelete = async () => {
        if (!fundToDelete) return;
        try {
            await api.deleteFund(fundToDelete);
            setMessage({ type: 'success', text: '삭제되었습니다.' });
            fetchFunds();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setFundToDelete(null);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">펀드 관리</h2>
                <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-[#2B548F] text-white rounded-lg text-sm font-bold shadow hover:bg-[#234576] transition-all">
                    + 펀드 등록
                </button>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2B548F]"></div>
                </div>
            ) : funds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                    {funds.map(f => {
                        // DB에서 가져온 creatorName이 없을 경우, 현재 로드된 학생 목록(students)에서 이름을 한 번 더 찾음
                        const creator = students.find(s => s.userId === f.creatorId);
                        const applicantName = f.creatorName || creator?.name || f.creatorId?.slice(0, 8);

                        return (
                            <div key={f.id} onClick={() => setSelectedFundForInvestors(f)} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-black text-lg text-black">{f.name}</h3>
                                        <p className="text-[10px] text-indigo-700 font-black">신청자: {applicantName}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${f.status === FundStatus.RECRUITING ? 'bg-blue-100 text-blue-700' : f.status === FundStatus.ONGOING ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {f.status}
                                        </span>
                                        <button onClick={(e) => handleDeleteClick(e, f.id)} className="text-gray-400 hover:text-red-500 p-1"><XIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-900 font-bold mb-3 line-clamp-2 min-h-[2.5rem]">{f.description}</p>
                                <div className="bg-gray-50 p-3 rounded-lg text-xs mb-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-900 font-black">목표 / 모집액</span>
                                        <span className="font-black text-black">{(f.targetAmount || 0).toLocaleString()}{unit} / <span className="text-indigo-700">{(f.totalInvestedAmount || 0).toLocaleString()}{unit}</span></span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                                        <span className="text-gray-900 font-black">기본 배당금</span>
                                        <span className="font-black text-blue-700">{(f.baseReward || 0).toLocaleString()}{unit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-900 font-black">추가 인센티브</span>
                                        <span className="font-black text-indigo-700">+{(f.incentiveReward || 0).toLocaleString()}{unit}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                                        <div 
                                            className="bg-indigo-600 h-1.5 rounded-full" 
                                            style={{ width: `${Math.min(100, ((f.totalInvestedAmount || 0) / (f.targetAmount || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div className="mt-auto space-y-2" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-between text-[10px] text-gray-800 font-black mb-1 px-1">
                                        <span>투자: {f.investorCount || 0}명</span>
                                        <span>만기: {f.maturityDate ? new Date(f.maturityDate).toLocaleDateString() : '-'}</span>
                                    </div>
                                    {f.status === FundStatus.ONGOING && (
                                        <div className="grid grid-cols-3 gap-1">
                                            <button onClick={() => handleSettle(f.id, FundStatus.FAIL)} className="py-2 bg-red-500 text-white rounded-lg text-[10px] font-bold hover:bg-red-600 transition-colors">실패</button>
                                            <button onClick={() => handleSettle(f.id, FundStatus.SUCCESS)} className="py-2 bg-green-500 text-white rounded-lg text-[10px] font-bold hover:bg-green-600 transition-colors">성공</button>
                                            <button onClick={() => handleSettle(f.id, FundStatus.EXCEED)} className="py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-colors">인센티브</button>
                                        </div>
                                    )}
                                    {f.status === FundStatus.RECRUITING && (
                                        <button disabled className="w-full py-2 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold">모집 중...</button>
                                    )}
                                    {f.status !== FundStatus.RECRUITING && f.status !== FundStatus.ONGOING && (
                                        <div className="w-full py-2 bg-gray-100 text-gray-800 text-center rounded-lg text-[10px] font-black">정산됨: {f.status}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-16 rounded-xl border-2 border-dashed border-gray-100 text-center">
                    <NewFundIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-gray-400 font-medium">등록된 펀드 상품이 없습니다.</p>
                    <p className="text-gray-300 text-xs mt-1">상단의 '+ 펀드 등록' 버튼을 눌러 상품을 추가하세요.</p>
                </div>
            )}

            {showAddModal && <AddFundModal students={students} onClose={() => setShowAddModal(false)} onComplete={fetchFunds} />}
            {selectedFundForInvestors && <FundInvestorsModal fund={selectedFundForInvestors} onClose={() => setSelectedFundForInvestors(null)} />}
            {message && <MessageModal isOpen={true} type={message.type} message={message.text} onClose={() => setMessage(null)} />}
            <ConfirmModal 
                isOpen={!!fundToDelete}
                title="펀드 삭제"
                message="이 펀드를 삭제하시겠습니까? 투자 기록이 모두 사라집니다."
                onConfirm={confirmDelete}
                onCancel={() => setFundToDelete(null)}
                confirmText="삭제하기"
                isDangerous
            />
        </div>
    );
};

const TeacherDashboard: React.FC<{ onBackToMenu?: () => void }> = ({ onBackToMenu }) => {
    const { currentUser, logout } = useContext(AuthContext);
    const [view, setView] = useState<'dashboard' | 'students' | 'jobs' | 'tax' | 'funds'>('dashboard');
    const [students, setStudents] = useState<(User & { account: Account | null })[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 학생 유저 목록 가져오기
            const users = await api.getUsersByRole(Role.STUDENT, currentUser?.userId || '');
            
            // 각 유저의 계좌 정보를 순차적으로 혹은 병렬로 가져오되, 에러 발생 시 개별 학생 데이터는 유지
            const usersWithAccounts = await Promise.all(
                users.map(async u => {
                    try {
                        const account = await api.getStudentAccountByUserId(u.userId);
                        return { ...u, account };
                    } catch (err) {
                        console.warn(`학생(${u.name}) 계좌 조회 실패:`, err);
                        return { ...u, account: null }; // 계좌 조회가 실패해도 유저는 리스트에 포함
                    }
                })
            );
            
            usersWithAccounts.sort((a,b) => (a.number || 0) - (b.number || 0));
            setStudents(usersWithAccounts);
        } catch (error) { 
            console.error("데이터 로딩 중 치명적 오류:", error); 
        }
        finally { setLoading(false); }
    }, [currentUser?.userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const alias = currentUser?.teacherAlias || '교사 관리자';
    const classCode = currentUser?.classCode || '----';
    const handleLogout = onBackToMenu || logout;

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
            <Icon className="w-10 h-10 mr-3" /> {label}
        </button>
    );

    const MobileNavButton = ({ id, label, Icon }: { id: typeof view, label: string, Icon: React.FC<any> }) => (
        <button onClick={() => setView(id)} className={`flex flex-col items-center justify-center w-full py-2 ${view === id ? 'text-[#2B548F]' : 'text-gray-400'}`}>
            <Icon className="w-12 h-12 mb-1" /> <span className="text-[10px]">{label}</span>
        </button>
    );

    return (
        <div className="flex h-full bg-gray-100">
            <aside className="hidden md:flex flex-col w-64 bg-white border-r p-4 shadow-sm z-10">
                <div className="px-2 mb-8">
                    <h1 className="text-xl font-bold text-gray-800">{alias}</h1>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-50 text-[#0066FF] rounded uppercase">Class Code</span>
                        <span className="text-sm font-black text-[#0066FF] tracking-widest">{classCode}</span>
                    </div>
                </div>
                <nav className="flex flex-col space-y-2 flex-grow">
                    <NavButton id="dashboard" label="대시보드" Icon={NewDashboardIcon} />
                    <NavButton id="students" label="학생 관리" Icon={NewManageAccountsIcon} />
                    <NavButton id="jobs" label="직업 관리" Icon={NewBriefcaseIcon} />
                    <NavButton id="tax" label="세금 관리" Icon={NewTaxIcon} />
                    <NavButton id="funds" label="펀드 관리" Icon={NewFundIcon} />
                </nav>
                <button onClick={handleLogout} className="w-full flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-100 mt-auto">
                    <LogoutIcon className="w-10 h-10 mr-3" /> {onBackToMenu ? '메뉴로' : '로그아웃'}
                </button>
            </aside>
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="md:hidden bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">{alias}</h1>
                        <p className="text-[10px] font-black text-[#0066FF]">코드: {classCode}</p>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-600"><LogoutIcon className="w-12 h-12" /></button>
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