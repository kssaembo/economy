import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Account, StockProduct, StockProductWithDetails, User, Role, SavingsProduct, StockHistory } from '../types';
import { LogoutIcon, StockIcon, XIcon, PlusIcon, CheckIcon, ErrorIcon, TransferIcon, NewPiggyBankIcon, ArrowDownIcon, ArrowUpIcon } from '../components/icons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type View = 'deposit_withdraw' | 'stock_exchange' | 'savings_management';

const BankerPage: React.FC = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const [view, setView] = useState<View>('deposit_withdraw');

    const renderView = () => {
        switch (view) {
            case 'deposit_withdraw':
                return <DepositWithdrawView />;
            case 'stock_exchange':
                return <StockExchangeView />;
            case 'savings_management':
                return <SavingsManagementView />;
            default:
                return <DepositWithdrawView />;
        }
    };

    return (
        <div className="flex h-full bg-gray-50">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-56 bg-white/80 backdrop-blur-sm border-r p-4">
                <div className="px-2">
                    <h1 className="text-xl font-bold text-gray-800">은행원 모드</h1>
                    <p className="text-sm text-gray-500">{currentUser?.name}</p>
                </div>
                <nav className="mt-8 flex flex-col space-y-2">
                    <DesktopNavButton label="입/출금" Icon={TransferIcon} active={view === 'deposit_withdraw'} onClick={() => setView('deposit_withdraw')} />
                    <DesktopNavButton label="주식거래소" Icon={StockIcon} active={view === 'stock_exchange'} onClick={() => setView('stock_exchange')} />
                    <DesktopNavButton label="적금 관리" Icon={NewPiggyBankIcon} active={view === 'savings_management'} onClick={() => setView('savings_management')} />
                </nav>
                <div className="mt-auto">
                    <button onClick={logout} className="w-full flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors">
                        <LogoutIcon className="w-5 h-5 mr-3" />
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full">
                {/* Header for Mobile */}
                <header className="md:hidden p-4 flex justify-between items-center bg-white border-b sticky top-0 z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">은행원 모드</h1>
                        <p className="text-sm text-gray-500">{currentUser?.name}</p>
                    </div>
                    <button onClick={logout} className="p-2 rounded-full hover:bg-gray-100">
                        <LogoutIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 bg-[#D1D3D8]">
                    {renderView()}
                </main>

                {/* Bottom Nav for Mobile */}
                <nav className="md:hidden grid grid-cols-3 bg-white p-1 border-t sticky bottom-0 z-10">
                    <NavButton label="입/출금" Icon={TransferIcon} active={view === 'deposit_withdraw'} onClick={() => setView('deposit_withdraw')} />
                    <NavButton label="주식거래소" Icon={StockIcon} active={view === 'stock_exchange'} onClick={() => setView('stock_exchange')} />
                    <NavButton label="적금 관리" Icon={NewPiggyBankIcon} active={view === 'savings_management'} onClick={() => setView('savings_management')} />
                </nav>
            </div>
        </div>
    );
};

// --- Deposit/Withdraw View ---
const DepositWithdrawView: React.FC = () => {
    const [students, setStudents] = useState<(User & { account: Account | null})[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<(User & { account: Account | null}) | null>(null);
    const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);

    const fetchStudents = useCallback(async () => {
        const users = await api.getUsersByRole(Role.STUDENT);
        const usersWithAccounts = await Promise.all(users.map(async u => ({...u, account: await api.getStudentAccountByUserId(u.userId) })));
        usersWithAccounts.sort((a,b) => (a.number || 0) - (b.number || 0));
        setStudents(usersWithAccounts);
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);
    
    const handleTxnComplete = () => {
        setSelectedStudent(null);
        setMode(null);
        fetchStudents();
    };

    return (
         <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left w-[22.5%]">번호</th>
                            <th className="p-3 text-left w-[25%]">이름</th>
                            <th className="p-3 text-left w-[16%]">계좌</th>
                            <th className="p-3 text-center w-[40%]">작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.userId} className="border-t">
                                <td className="p-2">{s.grade}-{s.class} {s.number}</td>
                                <td className="p-2 font-medium">{s.name}</td>
                                <td className="p-2 font-mono text-xs">{s.account?.accountId.replace('권쌤은행 ', '')}</td>
                                <td className="p-2 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => { setSelectedStudent(s); setMode('deposit'); }} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 text-base whitespace-nowrap">입금</button>
                                        <button onClick={() => { setSelectedStudent(s); setMode('withdraw'); }} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 text-base whitespace-nowrap">출금</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedStudent && mode && (
                <TransactionModal student={selectedStudent} mode={mode} onClose={() => { setSelectedStudent(null); setMode(null); }} onComplete={handleTxnComplete} />
            )}
        </div>
    )
};

const TransactionModal: React.FC<{ student: User & { account: Account | null }, mode: 'deposit' | 'withdraw', onClose: () => void, onComplete: () => void }> = ({ student, mode, onClose, onComplete }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async () => {
        if (!amount || parseInt(amount) <= 0) {
            setResult({ type: 'error', text: '올바른 금액을 입력해주세요.' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const message = mode === 'deposit'
                ? await api.bankerDeposit(student.userId, parseInt(amount))
                : await api.bankerWithdraw(student.userId, parseInt(amount));
            setResult({ type: 'success', text: message });
            setTimeout(() => onComplete(), 1500);
        } catch (err: any) {
            setResult({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{student.name} 학생 {mode === 'deposit' ? '입금' : '출금'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-600" /></button>
                </div>
                 <p className="mb-4">현재 잔액: <span className="font-bold">{student.account?.balance.toLocaleString() ?? 0}권</span></p>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="금액" className="w-full p-3 border rounded-lg"/>
                <button onClick={handleSubmit} disabled={loading} className="mt-6 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg disabled:bg-gray-400">
                    {loading ? '처리 중...' : '실행'}
                </button>
                 {result && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${result.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <ErrorIcon className="w-5 h-5 mr-2" />}
                        <p className="text-sm">{result.text}</p>
                    </div>
                )}
            </div>
        </div>
    )
};

// --- Stock Exchange View ---
const StockExchangeView: React.FC = () => {
    const [stocks, setStocks] = useState<StockProductWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState<'add' | 'price' | 'delete' | 'holders' | 'volatility' | null>(null);
    const [selectedStock, setSelectedStock] = useState<StockProductWithDetails | null>(null);
    const [deleteMode, setDeleteMode] = useState(false);
    const [stocksToDelete, setStocksToDelete] = useState<string[]>([]);
    
    // Chart states
    const [expandedStockId, setExpandedStockId] = useState<string | null>(null);
    const [chartData, setChartData] = useState<StockHistory[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    const fetchStocks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getStockProducts();
            setStocks(data);
        } catch (error) {
            console.error("Failed to fetch stocks", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStocks();
    }, [fetchStocks]);

    const handleSelectForDelete = (stockId: string) => {
        setStocksToDelete(prev => 
            prev.includes(stockId) ? prev.filter(id => id !== stockId) : [...prev, stockId]
        );
    };

    const handleOpenHoldersModal = (stock: StockProductWithDetails) => {
        setSelectedStock(stock);
        setShowModal('holders');
    };
    
    const handleToggleExpand = async (stockId: string) => {
        if (expandedStockId === stockId) {
            setExpandedStockId(null);
            setChartData([]);
        } else {
            setExpandedStockId(stockId);
            setChartLoading(true);
            try {
                const history = await api.getStockHistory(stockId);
                setChartData(history);
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setChartLoading(false);
            }
        }
    };

    if (loading) return <div className="text-center p-8">주식 정보를 불러오는 중...</div>;

    return (
        <div>
            <div className="flex justify-end items-center mb-4 gap-2">
                <button onClick={() => setShowModal('volatility')} className="px-3 py-2 bg-blue-500 text-white text-xs font-semibold rounded-lg shadow hover:bg-blue-600">민감도 조정</button>
                <button onClick={() => setShowModal('add')} className="px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-green-700">종목 추가</button>
                <button onClick={() => {
                    if (deleteMode && stocksToDelete.length > 0) {
                        setShowModal('delete');
                    } else {
                        setDeleteMode(!deleteMode);
                        setStocksToDelete([]);
                    }
                }} className="px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-red-700">
                    {deleteMode ? `선택 항목 삭제 (${stocksToDelete.length})` : '종목 삭제'}
                </button>
                 {deleteMode && <button onClick={() => { setDeleteMode(false); setStocksToDelete([]); }} className="text-xs text-gray-600">취소</button>}
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                 <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {deleteMode && <th className="p-3 w-12"></th>}
                            <th className="p-3 text-left">종목</th>
                            <th className="p-3 text-right">현재가</th>
                            <th className="p-3 text-right">전체 수량</th>
                            <th className="p-3 text-right">평가 금액</th>
                            <th className="p-3 text-center leading-tight">가격<br/>입력</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.map(s => (
                            <React.Fragment key={s.id}>
                                <tr className={`border-t ${expandedStockId === s.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                                    {deleteMode && <td className="p-3 text-center"><input type="checkbox" checked={stocksToDelete.includes(s.id)} onChange={() => handleSelectForDelete(s.id)} /></td>}
                                    <td className="p-3 font-medium cursor-pointer flex items-center" onClick={() => handleToggleExpand(s.id)}>
                                        {s.name}
                                        {expandedStockId === s.id ? <ArrowUpIcon className="w-3 h-3 ml-1 text-gray-400"/> : <ArrowDownIcon className="w-3 h-3 ml-1 text-gray-400"/>}
                                    </td>
                                    <td className="p-3 text-right font-mono">{s.currentPrice.toLocaleString()}권</td>
                                    <td className="p-3 text-right font-mono">
                                         <button onClick={() => handleOpenHoldersModal(s)} className="hover:underline" disabled={s.totalQuantity === 0}>
                                            {s.totalQuantity.toLocaleString()}주
                                        </button>
                                    </td>
                                    <td className="p-3 text-right font-mono">{s.valuation.toLocaleString()}권</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => { setSelectedStock(s); setShowModal('price'); }} className="px-3 py-1 bg-gray-200 text-gray-800 text-[8px] font-semibold rounded-md hover:bg-gray-300 whitespace-nowrap">입력</button>
                                    </td>
                                </tr>
                                {expandedStockId === s.id && (
                                    <tr>
                                        <td colSpan={deleteMode ? 6 : 5} className="p-4 bg-gray-50 border-t border-b">
                                            <div className="h-64 w-full">
                                                {chartLoading ? (
                                                    <div className="flex items-center justify-center h-full text-gray-500">차트 로딩 중...</div>
                                                ) : chartData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={chartData}>
                                                            <XAxis dataKey="createdAt" tickFormatter={(time) => new Date(time).toLocaleDateString()} hide />
                                                            <YAxis domain={['auto', 'auto']} />
                                                            <Tooltip 
                                                                labelFormatter={(label) => new Date(label).toLocaleString()}
                                                                formatter={(value: number) => [`${value.toLocaleString()}권`, '가격']}
                                                            />
                                                            <Line type="monotone" dataKey="price" stroke="#4F46E5" strokeWidth={2} dot={false} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">가격 변동 기록이 없습니다.</div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal === 'add' && <AddStockModal onClose={() => setShowModal(null)} onComplete={fetchStocks} />}
            {showModal === 'price' && selectedStock && <UpdatePriceModal stock={selectedStock} onClose={() => setShowModal(null)} onComplete={fetchStocks} />}
            {showModal === 'delete' && <DeleteStockModal stockIds={stocksToDelete} onClose={() => setShowModal(null)} onComplete={() => { fetchStocks(); setDeleteMode(false); setStocksToDelete([]); }}/>}
            {showModal === 'holders' && selectedStock && <StockHoldersModal stock={selectedStock} onClose={() => setShowModal(null)} />}
            {showModal === 'volatility' && <VolatilityModal stocks={stocks} onClose={() => setShowModal(null)} onComplete={fetchStocks} />}
        </div>
    );
};

const AddStockModal: React.FC<{onClose: ()=>void, onComplete: ()=>void}> = ({onClose, onComplete}) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{type: 'success'|'error', text: string} | null>(null);

    const handleSubmit = async () => {
        if(!name || !price) { setResult({type: 'error', text: '모든 항목을 입력하세요'}); return; }
        setLoading(true);
        try {
            const message = await api.addStockProduct(name, parseInt(price));
            setResult({type: 'success', text: message});
            setTimeout(() => { onComplete(); onClose(); }, 1500);
        } catch(err: any) { setResult({type: 'error', text: err.message}); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm">
                <h3 className="text-xl font-bold mb-4">새 주식 종목 추가</h3>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="종목명" className="w-full p-3 border rounded-lg mb-2"/>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="초기 가격" className="w-full p-3 border rounded-lg"/>
                <button onClick={handleSubmit} disabled={loading} className="mt-4 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg">추가하기</button>
                {result && <p className={`mt-2 text-sm text-center ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{result.text}</p>}
                <button onClick={onClose} className="mt-2 w-full p-2 text-gray-600">닫기</button>
            </div>
        </div>
    )
};

const UpdatePriceModal: React.FC<{stock: StockProduct, onClose: ()=>void, onComplete: ()=>void}> = ({stock, onClose, onComplete}) => {
    const [price, setPrice] = useState(stock.currentPrice.toString());
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{type: 'success'|'error', text: string} | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const message = await api.updateStockPrice(stock.id, parseInt(price));
            setResult({type: 'success', text: message});
            setTimeout(() => { onComplete(); onClose(); }, 1500);
        } catch(err: any) { setResult({type: 'error', text: err.message}); }
        finally { setLoading(false); }
    };
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm">
                <h3 className="text-xl font-bold mb-4">{stock.name} 가격 변경</h3>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="새로운 가격" className="w-full p-3 border rounded-lg"/>
                <button onClick={handleSubmit} disabled={loading} className="mt-4 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg">변경하기</button>
                 {result && <p className={`mt-2 text-sm text-center ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{result.text}</p>}
                <button onClick={onClose} className="mt-2 w-full p-2 text-gray-600">닫기</button>
            </div>
        </div>
    )
};

const DeleteStockModal: React.FC<{stockIds: string[], onClose: ()=>void, onComplete: ()=>void}> = ({stockIds, onClose, onComplete}) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{type: 'success'|'error', text: string} | null>(null);
    
    const handleDelete = async () => {
        setLoading(true);
        try {
            const message = await api.deleteStockProducts(stockIds);
            setResult({type: 'success', text: message});
            setTimeout(() => { onComplete(); onClose(); }, 1500);
        } catch (err: any) { setResult({type: 'error', text: err.message}); }
        finally { setLoading(false); }
    }

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm text-center">
                <h3 className="text-xl font-bold mb-4">정말로 삭제하시겠습니까?</h3>
                <p className="text-sm text-gray-600 mb-4">{stockIds.length}개의 주식 종목이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
                {result && <p className={`mb-2 text-sm ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{result.text}</p>}
                <div className="flex gap-4">
                    <button onClick={onClose} disabled={loading} className="flex-1 p-3 bg-gray-200 font-bold rounded-lg">취소</button>
                    <button onClick={handleDelete} disabled={loading} className="flex-1 p-3 text-white bg-red-600 font-bold rounded-lg">삭제</button>
                </div>
            </div>
        </div>
    )
};

const StockHoldersModal: React.FC<{ stock: StockProductWithDetails, onClose: () => void }> = ({ stock, onClose }) => {
    const [holders, setHolders] = useState<{ studentName: string; quantity: number }[]>([]);

    useEffect(() => {
        api.getStockHolders(stock.id).then(setHolders);
    }, [stock.id]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">{stock.name} 주주 명부</h3>
                <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="p-2 text-left">학생명</th><th className="p-2 text-right">보유 주식</th><th className="p-2 text-right">보유 비율</th></tr></thead>
                        <tbody>
                            {holders.map(h => (
                                <tr key={h.studentName} className="border-b">
                                    <td className="p-2">{h.studentName}</td>
                                    <td className="p-2 text-right font-mono">{h.quantity.toLocaleString()}주</td>
                                    <td className="p-2 text-right font-mono">{stock.totalQuantity > 0 ? ((h.quantity / stock.totalQuantity) * 100).toFixed(2) : 0}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button onClick={onClose} className="mt-4 w-full p-2 bg-gray-200 font-bold rounded-lg">닫기</button>
            </div>
        </div>
    );
};

const VolatilityModal: React.FC<{ stocks: StockProduct[], onClose: () => void, onComplete: () => void }> = ({ stocks, onClose, onComplete }) => {
    // Map stockId -> volatility value
    const [volatilities, setVolatilities] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const initial = stocks.reduce((acc, stock) => {
            acc[stock.id] = stock.volatility || 0.01;
            return acc;
        }, {} as Record<string, number>);
        setVolatilities(initial);
    }, [stocks]);

    const handleSave = async (stockId: string) => {
        const val = volatilities[stockId];
        if (val < 0.01 || val > 1) {
            alert('민감도는 0.01에서 1 사이여야 합니다.');
            return;
        }
        setLoading(true);
        try {
            await api.updateStockVolatility(stockId, val);
            setSuccessMsg('저장됨');
            setTimeout(() => setSuccessMsg(''), 1000);
            onComplete(); // refresh parent
        } catch (err: any) {
            alert('오류: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2">가격 변동 민감도 설정</h3>
                <p className="text-xs text-gray-500 mb-4">
                    민감도에 따라 학생들의 매도 수수료가 자동으로 설정됩니다.<br/>
                    (예: 0.01 → 수수료 0.9%)
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {stocks.map(stock => {
                        const k = volatilities[stock.id] || 0.01;
                        const feeRate = (10 * k) / (1 + 10 * k); // F = 10k / (1+10k)
                        return (
                            <div key={stock.id} className="flex flex-col bg-gray-50 p-2 rounded">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium w-1/3 truncate">{stock.name}</span>
                                    <div className="flex gap-2 w-2/3 justify-end">
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            min="0.01" 
                                            max="1" 
                                            value={volatilities[stock.id]} 
                                            onChange={(e) => setVolatilities({...volatilities, [stock.id]: parseFloat(e.target.value)})}
                                            className="w-20 p-1 border rounded text-right text-sm"
                                        />
                                        <button onClick={() => handleSave(stock.id)} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">저장</button>
                                    </div>
                                </div>
                                <div className="text-right text-[10px] text-gray-500">
                                    학생 수수료: 약 {(feeRate * 100).toFixed(1)}%
                                </div>
                            </div>
                        )
                    })}
                </div>
                {successMsg && <p className="text-center text-green-600 text-xs mt-2">{successMsg}</p>}
                <button onClick={onClose} className="mt-4 w-full p-2 bg-gray-200 font-bold rounded-lg">닫기</button>
            </div>
        </div>
    );
};

// --- Savings Management View ---
const SavingsManagementView: React.FC = () => {
    const [products, setProducts] = useState<SavingsProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState<'add' | 'delete' | 'enrollees' | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<SavingsProduct | null>(null);
    const [deleteMode, setDeleteMode] = useState(false);
    const [productsToDelete, setProductsToDelete] = useState<string[]>([]);
    
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getSavingsProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch savings products", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSelectForDelete = (productId: string) => {
        setProductsToDelete(prev => 
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };
    
    const handleOpenEnrolleesModal = (product: SavingsProduct) => {
        setSelectedProduct(product);
        setShowModal('enrollees');
    }

    if (loading) return <div className="text-center p-8">적금 상품 정보를 불러오는 중...</div>;

    return (
        <div>
            <div className="flex justify-end items-center mb-4 gap-2">
                <button onClick={() => setShowModal('add')} className="px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-green-700">적금 추가</button>
                <button onClick={() => {
                    if (deleteMode && productsToDelete.length > 0) {
                        setShowModal('delete');
                    } else {
                        setDeleteMode(!deleteMode);
                        setProductsToDelete([]);
                    }
                }} className="px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-red-700">
                    {deleteMode ? `선택 항목 삭제 (${productsToDelete.length})` : '적금 삭제'}
                </button>
                 {deleteMode && <button onClick={() => { setDeleteMode(false); setProductsToDelete([]); }} className="text-xs text-gray-600">취소</button>}
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {deleteMode && <th className="p-3 w-12"></th>}
                            <th className="p-3 text-left">적금명</th>
                            <th className="p-3 text-right">만기(일)</th>
                            <th className="p-3 text-right">이자율(%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} onClick={() => !deleteMode && handleOpenEnrolleesModal(p)} className={`border-t ${!deleteMode && 'cursor-pointer hover:bg-gray-50'}`}>
                                {deleteMode && <td className="p-3 text-center"><input type="checkbox" checked={productsToDelete.includes(p.id)} onChange={() => handleSelectForDelete(p.id)} /></td>}
                                <td className="p-3 font-medium">{p.name}</td>
                                <td className="p-3 text-right font-mono">{p.maturityDays}</td>
                                <td className="p-3 text-right font-mono text-blue-600">{(p.rate * 100).toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal === 'add' && <AddSavingModal onClose={() => setShowModal(null)} onComplete={fetchProducts} />}
            {showModal === 'delete' && <DeleteSavingModal productIds={productsToDelete} onClose={() => setShowModal(null)} onComplete={() => { fetchProducts(); setDeleteMode(false); setProductsToDelete([]); }}/>}
            {showModal === 'enrollees' && selectedProduct && <SavingEnrolleesModal product={selectedProduct} onClose={() => setShowModal(null)} />}
        </div>
    );
};

const AddSavingModal: React.FC<{onClose: ()=>void, onComplete: ()=>void}> = ({onClose, onComplete}) => {
    const [product, setProduct] = useState({ name: '', maturityDays: 30, rate: 5, cancellationRate: 1, maxAmount: 10000 });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{type: 'success'|'error', text: string} | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: name.includes('Rate') ? parseFloat(value) : parseInt(value) || value }));
    }

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...product,
                rate: product.rate / 100,
                cancellationRate: product.cancellationRate / 100,
            };
            const message = await api.addSavingsProduct(payload);
            setResult({type: 'success', text: message});
            setTimeout(() => { onComplete(); onClose(); }, 1500);
        } catch(err: any) { setResult({type: 'error', text: err.message}); }
        finally { setLoading(false); }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md">
                <h3 className="text-xl font-bold mb-4">새 적금 상품 추가</h3>
                <div className="space-y-2 text-sm">
                    <label className="block font-medium text-gray-700">적금명
                      <input type="text" name="name" value={product.name} onChange={handleChange} placeholder="예: 티끌모아 태산" className="w-full p-2 border rounded mt-1"/>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <label className="block font-medium text-gray-700">만기(일)
                          <input type="number" name="maturityDays" value={product.maturityDays} onChange={handleChange} placeholder="30" className="w-full p-2 border rounded mt-1"/>
                        </label>
                         <label className="block font-medium text-gray-700">최대 가입금액
                          <input type="number" name="maxAmount" value={product.maxAmount} onChange={handleChange} placeholder="10000" className="w-full p-2 border rounded mt-1"/>
                        </label>
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <label className="block font-medium text-gray-700">이자율(%)
                          <input type="number" name="rate" value={product.rate} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
                        </label>
                        <label className="block font-medium text-gray-700">해지이율(%)
                          <input type="number" name="cancellationRate" value={product.cancellationRate} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
                        </label>
                    </div>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="mt-4 w-full p-3 bg-indigo-600 text-white font-bold rounded-lg">추가하기</button>
                {result && <p className={`mt-2 text-sm text-center ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{result.text}</p>}
                <button onClick={onClose} className="mt-2 w-full p-2 text-gray-500">닫기</button>
            </div>
        </div>
    )
};

const DeleteSavingModal: React.FC<{productIds: string[], onClose: ()=>void, onComplete: ()=>void}> = ({productIds, onClose, onComplete}) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{type: 'success'|'error', text: string} | null>(null);
    
    const handleDelete = async () => {
        setLoading(true);
        try {
            const message = await api.deleteSavingsProducts(productIds);
            setResult({type: 'success', text: message});
            setTimeout(() => { onComplete(); onClose(); }, 1500);
        } catch (err: any) { setResult({type: 'error', text: err.message}); }
        finally { setLoading(false); }
    }

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm text-center">
                <h3 className="text-xl font-bold mb-4">정말로 삭제하시겠습니까?</h3>
                <p className="text-sm text-gray-600 mb-4">{productIds.length}개의 적금 상품이 영구적으로 삭제됩니다.</p>
                {result && <p className={`mb-2 text-sm ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{result.text}</p>}
                <div className="flex gap-4">
                    <button onClick={onClose} disabled={loading} className="flex-1 p-3 bg-gray-200 font-bold rounded-lg">취소</button>
                    <button onClick={handleDelete} disabled={loading} className="flex-1 p-3 text-white bg-red-600 font-bold rounded-lg">삭제</button>
                </div>
            </div>
        </div>
    )
};

const SavingEnrolleesModal: React.FC<{ product: SavingsProduct, onClose: () => void }> = ({ product, onClose }) => {
    const [enrollees, setEnrollees] = useState<{ studentName: string; amount: number; maturityDate: string }[]>([]);

    useEffect(() => {
        api.getSavingsEnrollees(product.id).then(setEnrollees);
    }, [product.id]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">{product.name} 가입자 명단</h3>
                <div className="max-h-60 overflow-y-auto">
                    {enrollees.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-left">학생명</th>
                                    <th className="p-2 text-right">가입 금액</th>
                                    <th className="p-2 text-right">해지 가능일</th>
                                    <th className="p-2 text-right">만기 날짜</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollees.map(e => {
                                    const maturityTime = new Date(e.maturityDate).getTime();
                                    // joinTime = maturityTime - duration
                                    const possibleTime = maturityTime - (product.maturityDays * 24 * 60 * 60 * 1000 / 3);
                                    
                                    return (
                                        <tr key={e.studentName} className="border-b">
                                            <td className="p-2">{e.studentName}</td>
                                            <td className="p-2 text-right font-mono">{e.amount.toLocaleString()}권</td>
                                            <td className="p-2 text-right font-mono text-red-500 text-xs">{new Date(possibleTime).toLocaleDateString()}</td>
                                            <td className="p-2 text-right font-mono">{new Date(e.maturityDate).toLocaleDateString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 py-4">아직 가입한 학생이 없습니다.</p>
                    )}
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-[10px] text-gray-500">
                    * 해지 가능일: 가입 기간의 2/3가 경과한 시점으로, 학생 페이지에서 직접 해지가 가능해지는 날짜입니다.
                </div>
                <button onClick={onClose} className="mt-4 w-full p-2 bg-gray-200 font-bold rounded-lg">닫기</button>
            </div>
        </div>
    );
};

// --- Common Components ---
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


export default BankerPage;