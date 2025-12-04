import { supabase } from './supabaseClient';
import { Role, User, Account, StockProduct, StockProductWithDetails, StudentStock, SavingsProduct, StudentSaving, Job, TaxItemWithRecipients, StockHistory, Fund, FundInvestment, FundStatus } from '../types';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        // Try to parse a more specific message from Supabase RPC errors
        if (error.message.includes('Database error saving new record') || error.message.includes('error running function')) {
            const match = error.message.match(/DETAIL: (.*)/) || error.message.match(/error: (.*)/);
            if (match && match[1]) {
                throw new Error(match[1]);
            }
        }
        // 권한 에러나 함수 없음 에러에 대한 친절한 메시지
        if (error.code === '42883') {
             throw new Error('기능(RPC)을 찾을 수 없습니다. Supabase SQL Editor에서 함수를 생성/업데이트해주세요.');
        }
        if (error.code === '42501' || error.message.includes('permission denied')) {
             throw new Error('권한이 없습니다. Supabase에서 "GRANT EXECUTE" 권한 설정을 확인해주세요.');
        }
        if (error.message.includes('invalid input syntax for type uuid')) {
             throw new Error('시스템 오류: 계좌 ID 형식이 잘못되었습니다. (DB 함수 변수 타입 수정 필요)');
        }
        if (error.message.includes('invalid input value for enum transaction_type')) {
             throw new Error('DB 업데이트 필요: 트랜잭션 타입(FundJoin/FundPayout)이 누락되었습니다. Supabase SQL에서 ENUM을 추가해주세요.');
        }
        
        throw new Error(error.message || `An error occurred during ${context}.`);
    }
};

// --- User & Auth ---

const login = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('userId', userId)
        .single();
    handleSupabaseError(error, 'login');
    return data;
};

const loginWithPassword = async (grade: number, classNum: number, number: number, password: string): Promise<User | null> => {
    const { data, error } = await supabase.rpc('login_with_password', {
        p_grade: grade,
        p_class: classNum,
        p_number: number,
        p_password: password
    });
    
    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.message);
    
    return data.user as User;
};

const changePassword = async (userId: string, current: string, newPw: string): Promise<string> => {
    const { data, error } = await supabase.rpc('change_password', {
        p_user_id: userId,
        p_current_password: current,
        p_new_password: newPw
    });
    if (error) throw new Error(error.message);
    return data;
};

const resetPassword = async (userId: string): Promise<void> => {
    const { error } = await supabase.rpc('reset_password', { p_user_id: userId });
    if (error) throw new Error(error.message);
};

const loginWithQrToken = async (token: string): Promise<User | null> => {
    const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('userId')
        .eq('qrToken', token)
        .single();
    handleSupabaseError(accountError, 'loginWithQrToken (account lookup)');
    if (!accountData) return null;

    return login(accountData.userId);
};

const getUsersByRole = async (role: Role): Promise<User[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role);
    handleSupabaseError(error, `getUsersByRole (${role})`);
    return data || [];
};

const addStudent = async (name: string, grade: number, classNum: number, number: number): Promise<void> => {
    const { data, error } = await supabase.rpc('add_student_and_account', {
        p_name: name,
        p_grade: grade,
        p_class: classNum,
        p_number: number
    });
    
    handleSupabaseError(error, 'addStudent');
    
    // Check if data is an object and explicitly has success: false. 
    // This prevents errors when the RPC returns a scalar (like a UUID string) or void/null on success.
    if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error(data.message || '학생 추가 실패');
    }
};

const deleteStudents = async (userIds: string[]): Promise<string> => {
    let successCount = 0;
    const errors: string[] = [];
    let lastErrorMsg = "";

    console.log("Deleting students:", userIds); // 디버깅용 로그

    for (const userId of userIds) {
        try {
            // Call the backend RPC function which has SECURITY DEFINER to bypass RLS
            const { error } = await supabase.rpc('delete_student', { p_user_id: userId });
            
            if (error) {
                console.error(`Supabase RPC Error for ${userId}:`, error);
                throw error;
            }
            successCount++;
        } catch (error: any) {
            console.error(`Failed to delete student ${userId}:`, error);
            lastErrorMsg = error.message || JSON.stringify(error);
            // 특정 에러 코드 처리 (42883: 함수 없음, 42501: 권한 없음)
            if (error.code === '42883') {
                lastErrorMsg = "백엔드에 'delete_student' 함수가 없습니다. SQL을 실행해주세요.";
            } else if (error.code === '42501') {
                lastErrorMsg = "삭제 권한이 없습니다. SQL에서 GRANT EXECUTE 명령어를 실행해주세요.";
            }
            errors.push(userId);
        }
    }

    if (successCount === 0 && errors.length > 0) {
        // Throw the specific error from the DB to help debugging
        throw new Error(`삭제 실패: ${lastErrorMsg}`);
    }

    let message = `${successCount}명의 학생을 삭제했습니다.`;
    if (errors.length > 0) {
        message += `\n삭제 실패 (ID): ${errors.join(', ')}`;
    }

    return message;
};

// --- Account & Transactions ---

const getStudentAccountByUserId = async (userId: string): Promise<Account | null> => {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('userId', userId)
        .single();
    if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error
        handleSupabaseError(error, 'getStudentAccountByUserId');
    }
    return data;
};

const getTeacherAccount = async (): Promise<Account | null> => {
    // 1. Find the first user with 'teacher' role
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('userId')
        .eq('role', 'teacher')
        .limit(1);
    
    if (userError || !users || users.length === 0) return null;
    
    // 2. Get the account for that user
    const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('userId', users[0].userId)
        .single();
        
    if (accountError) return null;
    return account;
};

const getTransactionsByAccountId = async (accountId: string): Promise<any[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('accountId', accountId)
        .order('date', { ascending: false });
    handleSupabaseError(error, 'getTransactionsByAccountId');
    return data || [];
};

const getRecipientDetailsByAccountId = async (accountId: string): Promise<{ user: User, account: Account } | null> => {
    const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('accountId', accountId)
        .single();
    
    if (accountError && accountError.code !== 'PGRST116') {
        handleSupabaseError(accountError, 'getRecipientDetailsByAccountId (account)');
    }
    if (!accountData) return null;

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('userId', accountData.userId)
        .single();
    
    handleSupabaseError(userError, 'getRecipientDetailsByAccountId (user)');
    if (!userData) return null;

    return { user: userData, account: accountData };
};

const transfer = async (senderUserId: string, recipientAccountPkId: string, amount: number, memo?: string): Promise<string> => {
    const { data, error } = await supabase.rpc('transfer_funds', {
        p_sender_user_id: senderUserId,
        p_receiver_account_pk_id: recipientAccountPkId, // Use the primary key
        p_transfer_amount: amount,
        p_memo: memo
    });
    handleSupabaseError(error, 'transfer');
    // Ensure the return value is a string to prevent UI rendering errors.
    const message = data?.message || data;
    return typeof message === 'string' ? message : '';
};

const studentWithdraw = async (userId: string, amount: number, target: 'mart' | 'teacher'): Promise<string> => {
    const { data, error } = await supabase.rpc('student_withdraw', {
        p_user_id: userId,
        p_amount: amount,
        p_target_role: target,
    });
    handleSupabaseError(error, 'studentWithdraw');
    // Ensure the return value is a string to prevent UI rendering errors.
    const message = data?.message || data;
    return typeof message === 'string' ? message : '';
};


const bankerDeposit = async (userId: string, amount: number): Promise<string> => {
    const { data, error } = await supabase.rpc('banker_transaction', {
        p_student_user_id: userId,
        p_amount: amount,
        p_type: 'Deposit'
    });
    handleSupabaseError(error, 'bankerDeposit');
    return data.message;
};

const bankerWithdraw = async (userId: string, amount: number): Promise<string> => {
    const { data, error } = await supabase.rpc('banker_transaction', {
        p_student_user_id: userId,
        p_amount: amount,
        p_type: 'Withdrawal'
    });
    handleSupabaseError(error, 'bankerWithdraw');
    return data.message;
};

const martTransfer = async (studentAccountId: string, amount: number, direction: 'TO_STUDENT' | 'FROM_STUDENT'): Promise<string> => {
    const { data, error } = await supabase.rpc('mart_transfer', {
        p_student_account_id: studentAccountId,
        p_amount: amount,
        p_direction: direction
    });
    handleSupabaseError(error, 'martTransfer');
    return data;
};

// --- Stocks ---

const getStockProducts = async (): Promise<StockProductWithDetails[]> => {
    // 1. Get complex details (valuation, total quantity) from RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_stock_products_with_details');
    if (rpcError) {
        console.error("RPC Error:", rpcError);
        throw new Error(rpcError.message);
    }

    // 2. Get fresh price and volatility directly from table to ensure latest data
    const { data: tableData, error: tableError } = await supabase
        .from('stock_products')
        .select('id, currentPrice, volatility');
    
    if (tableError) {
        console.error("Table Fetch Error:", tableError);
        throw new Error(tableError.message);
    }

    // 3. Merge data
    const mergedData = (rpcData || []).map((rpcItem: any) => {
        const freshItem = tableData.find((t: any) => t.id === rpcItem.id);
        return {
            ...rpcItem,
            currentPrice: freshItem ? freshItem.currentPrice : rpcItem.currentPrice,
            volatility: freshItem ? freshItem.volatility : (rpcItem.volatility || 0.01)
        };
    });

    return mergedData;
};

const getStudentStocks = async (userId: string): Promise<StudentStock[]> => {
    const { data, error } = await supabase
        .from('student_stocks')
        .select('*, stock_products(*)')
        .eq('userId', userId);

    handleSupabaseError(error, 'getStudentStocks');
    
    if (!data) return [];

    return data.map(ss => {
        const stock = ss.stock_products as StockProduct;
        delete (ss as any).stock_products;
        return { ...ss, stock } as StudentStock;
    });
};

const getStockHistory = async (stockId: string): Promise<StockHistory[]> => {
    const { data, error } = await supabase
        .from('stock_price_history')
        .select('*')
        .eq('stockId', stockId)
        .order('createdAt', { ascending: true })
        .limit(100); // Limit to recent 100 points
        
    let history: StockHistory[] = [];

    if (error) {
        // We don't throw error if table doesn't exist yet for backwards compatibility
        console.warn("Could not fetch stock history:", error.message);
    } else {
        // Normalize keys to handle case sensitivity (Postgres might return lowercase)
        history = (data || []).map((item: any) => ({
            id: item.id,
            stockId: item.stockId || item.stockid, 
            price: item.price,
            createdAt: item.createdAt || item.createdat 
        }));
    }

    // Fallback: If no history exists (e.g., initial state), fetch current price to show at least one point
    if (history.length === 0) {
        const { data: stock } = await supabase
            .from('stock_products')
            .select('currentPrice')
            .eq('id', stockId)
            .single();
            
        if (stock) {
            history = [{
                id: 'initial',
                stockId: stockId,
                price: stock.currentPrice,
                createdAt: new Date().toISOString()
            }];
        }
    }

    return history;
};

const buyStock = async (userId: string, stockId: string, quantity: number): Promise<string> => {
    const { error } = await supabase.rpc('buy_stock', {
        p_user_id: userId,
        p_stock_id: stockId,
        p_quantity: quantity
    });
    handleSupabaseError(error, 'buyStock');
    return '주식을 성공적으로 구매했습니다.';
};

const sellStock = async (userId: string, stockId: string, quantity: number): Promise<string> => {
     const { data, error } = await supabase.rpc('sell_stock', {
        p_user_id: userId,
        p_stock_id: stockId,
        p_quantity: quantity
    });
    handleSupabaseError(error, 'sellStock');
    // sell_stock returns a string message now
    return typeof data === 'string' ? data : '주식을 성공적으로 판매했습니다.';
};

const addStockProduct = async (name: string, price: number): Promise<string> => {
    const { data, error } = await supabase.rpc('add_stock_product', { p_name: name, p_initial_price: price });
    handleSupabaseError(error, 'addStockProduct');
    return data.message;
};

const updateStockPrice = async (stockId: string, newPrice: number): Promise<string> => {
    const { data, error } = await supabase.rpc('update_stock_price', { p_stock_id: stockId, p_new_price: newPrice });
    handleSupabaseError(error, 'updateStockPrice');
    return data.message;
};

const updateStockVolatility = async (stockId: string, volatility: number): Promise<void> => {
    // RLS가 켜져 있으므로 직접 업데이트(.update)는 실패합니다. RPC 함수를 사용해야 합니다.
    const { error } = await supabase.rpc('update_stock_volatility', {
        p_stock_id: stockId,
        p_volatility: volatility
    });
    handleSupabaseError(error, 'updateStockVolatility');
};

const deleteStockProducts = async (stockIds: string[]): Promise<string> => {
    const { data, error } = await supabase.rpc('delete_stock_products', { p_stock_ids: stockIds });
    handleSupabaseError(error, 'deleteStockProducts');
    return data.message;
};

const getStockHolders = async (stockId: string): Promise<{ studentName: string, quantity: number }[]> => {
    const { data, error } = await supabase.rpc('get_stock_holders', { p_stock_id: stockId });
    handleSupabaseError(error, 'getStockHolders');
    return data || [];
};


// --- Savings ---

const getSavingsProducts = async (): Promise<SavingsProduct[]> => {
    const { data, error } = await supabase.from('savings_products').select('*');
    handleSupabaseError(error, 'getSavingsProducts');
    return data || [];
};

const getStudentSavings = async (userId: string): Promise<StudentSaving[]> => {
    const { data, error } = await supabase
        .from('student_savings')
        .select('*, savings_products(*)')
        .eq('userId', userId);
    
    handleSupabaseError(error, 'getStudentSavings');
    
    if (!data) return [];
    
    return data.map(ss => {
        const product = ss.savings_products as SavingsProduct;
        delete (ss as any).savings_products;
        return { ...ss, product } as StudentSaving;
    });
};

const joinSavings = async (userId: string, productId: string, amount: number): Promise<string> => {
    const { error } = await supabase.rpc('join_savings', {
        p_user_id: userId,
        p_product_id: productId,
        p_amount: amount
    });
    handleSupabaseError(error, 'joinSavings');
    return '적금에 성공적으로 가입했습니다.';
};

const cancelSavings = async (userId: string, savingId: string): Promise<string> => {
     const { error } = await supabase.rpc('cancel_savings', {
        p_user_id: userId,
        p_saving_id: savingId
    });
    handleSupabaseError(error, 'cancelSavings');
    return '적금을 성공적으로 해지했습니다.';
};

const addSavingsProduct = async (product: Omit<SavingsProduct, 'id'>): Promise<string> => {
    const { data, error } = await supabase.rpc('add_savings_product', {
        p_name: product.name,
        p_maturity_days: product.maturityDays,
        p_rate: product.rate,
        p_cancellation_rate: product.cancellationRate,
        p_max_amount: product.maxAmount
    });
    handleSupabaseError(error, 'addSavingsProduct');
    return data.message;
};

const deleteSavingsProducts = async (productIds: string[]): Promise<string> => {
    const { data, error } = await supabase.rpc('delete_savings_products', { p_product_ids: productIds });
    handleSupabaseError(error, 'deleteSavingsProducts');
    return data.message;
};

const getSavingsEnrollees = async (productId: string): Promise<{ studentName: string, amount: number, maturityDate: string }[]> => {
    const { data, error } = await supabase.rpc('get_savings_enrollees', { p_product_id: productId });
    handleSupabaseError(error, 'getSavingsEnrollees');
    return data || [];
};

// --- Jobs & Salary ---
const getJobs = async (): Promise<Job[]> => {
    const { data, error } = await supabase.rpc('get_jobs_with_details');
    handleSupabaseError(error, 'getJobs');
    return data || [];
};

const addJob = async (name: string, description: string, salary: number): Promise<string> => {
    const { error } = await supabase.rpc('add_job', { p_job_name: name, p_description: description, p_salary: salary });
    handleSupabaseError(error, 'addJob');
    return '새로운 직업이 추가되었습니다.';
};

const deleteJob = async (jobId: string): Promise<string> => {
    // Reuse plural function for consistency
    return deleteJobs([jobId]);
};

const deleteJobs = async (jobIds: string[]): Promise<string> => {
    let successCount = 0;
    const errors: string[] = [];
    let lastErrorMsg = "";

    console.log("Deleting jobs:", jobIds);

    for (const jobId of jobIds) {
        try {
            // Call the backend RPC function which has SECURITY DEFINER
            const { error } = await supabase.rpc('delete_job', { p_job_id: jobId });
            
            if (error) {
                 console.error(`Supabase RPC Error for job ${jobId}:`, error);
                 throw error;
            }
            successCount++;
        } catch (error: any) {
            console.error(`Failed to delete job ${jobId}:`, error);
            lastErrorMsg = error.message || JSON.stringify(error);
             if (error.code === '42883') {
                lastErrorMsg = "백엔드에 'delete_job' 함수가 없습니다. SQL을 실행해주세요.";
            } else if (error.code === '42501') {
                lastErrorMsg = "삭제 권한이 없습니다. SQL에서 GRANT EXECUTE 명령어를 실행해주세요.";
            }
            errors.push(jobId);
        }
    }
    
    if (successCount === 0 && errors.length > 0) {
         throw new Error(`삭제 실패: ${lastErrorMsg}`);
    }
    
    let message = `${successCount}개의 직업을 삭제했습니다.`;
    if (errors.length > 0) {
        message += `\n삭제 실패 (ID): ${errors.join(', ')}`;
    }
    
    return message;
};

const manageJobAssignment = async (jobId: string, studentUserIds: string[]): Promise<void> => {
    const { error } = await supabase.rpc('manage_job_assignment', { p_job_id: jobId, p_student_user_ids: studentUserIds });
    handleSupabaseError(error, 'manageJobAssignment');
};

const updateJobIncentive = async (jobId: string, incentive: number): Promise<void> => {
    const { error } = await supabase.rpc('update_job_incentive', { p_job_id: jobId, p_incentive: incentive });
    handleSupabaseError(error, 'updateJobIncentive');
};

const payJobSalary = async (jobId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('pay_job_salary', { p_job_id: jobId });
    handleSupabaseError(error, 'payJobSalary');
    return data;
};

const payAllSalaries = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('pay_all_salaries');
    handleSupabaseError(error, 'payAllSalaries');
    return data;
};

// --- Tax ---
const getTaxes = async (): Promise<TaxItemWithRecipients[]> => {
    const { data: taxes, error: taxError } = await supabase
        .from('tax_items')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (taxError) throw new Error(taxError.message);

    const { data: recipients, error: rcptError } = await supabase
        .from('tax_recipients')
        .select('*');

    if (rcptError) throw new Error(rcptError.message);

    return taxes.map((tax: any) => ({
        id: tax.id,
        name: tax.name,
        amount: tax.amount,
        dueDate: tax.due_date,
        createdAt: tax.created_at,
        recipients: recipients
            .filter((r: any) => r.tax_id === tax.id)
            .map((r: any) => ({
                id: r.id,
                taxId: r.tax_id,
                studentUserId: r.student_user_id,
                isPaid: r.is_paid,
                paidAt: r.paid_at
            }))
    }));
};

const createTax = async (name: string, amount: number, dueDate: string, studentIds: string[]): Promise<string> => {
    const { data, error } = await supabase.rpc('create_tax', {
        p_name: name,
        p_amount: amount,
        p_due_date: dueDate,
        p_student_ids: studentIds
    });
    handleSupabaseError(error, 'createTax');
    return data;
};

const deleteTax = async (taxId: string): Promise<string> => {
    const { error } = await supabase.rpc('delete_tax', { p_tax_id: taxId });
    handleSupabaseError(error, 'deleteTax');
    return '세금 항목이 삭제되었습니다.';
};

const getMyUnpaidTaxes = async (userId: string): Promise<{ recipientId: string, taxId: string, name: string, amount: number, dueDate: string }[]> => {
    const { data, error } = await supabase
        .from('tax_recipients')
        .select('*, tax_items(*)')
        .eq('student_user_id', userId)
        .eq('is_paid', false);
    
    handleSupabaseError(error, 'getMyUnpaidTaxes');
    
    return data.map((r: any) => ({
        recipientId: r.id,
        taxId: r.tax_id,
        name: r.tax_items.name,
        amount: r.tax_items.amount,
        dueDate: r.tax_items.due_date
    }));
};

const payTax = async (userId: string, taxId: string): Promise<string> => {
     const { data, error } = await supabase.rpc('pay_tax', {
        p_user_id: userId,
        p_tax_id: taxId
    });
    handleSupabaseError(error, 'payTax');
    return data;
};

// --- Funds ---

const getFunds = async (): Promise<Fund[]> => {
    const { data, error } = await supabase.rpc('get_funds_with_stats');
    handleSupabaseError(error, 'getFunds');
    // Normalize case sensitivity issues if any
    return (data || []).map((f: any) => ({
        ...f,
        creatorId: f.creatorId || f.creator_student_id,
        creatorName: f.creatorName || f.creator_name,
        teacherId: f.teacherId || f.teacher_id,
        unitPrice: f.unitPrice || f.unit_price,
        targetAmount: f.targetAmount || f.target_amount,
        baseReward: f.baseReward || f.base_reward,
        incentiveReward: f.incentiveReward || f.incentive_reward,
        recruitmentDeadline: f.recruitmentDeadline || f.recruitment_deadline,
        maturityDate: f.maturityDate || f.maturity_date,
        totalInvestedAmount: f.totalInvestedAmount || f.total_invested_amount || 0,
        investorCount: f.investorCount || f.investor_count || 0,
        createdAt: f.createdAt || f.created_at
    }));
};

const createFund = async (fund: Omit<Fund, 'id' | 'createdAt' | 'status' | 'teacherId' | 'creatorName' | 'totalInvestedAmount' | 'investorCount'>): Promise<string> => {
    const { data, error } = await supabase.rpc('create_fund', {
        p_name: fund.name,
        p_description: fund.description,
        p_creator_id: fund.creatorId,
        p_unit_price: fund.unitPrice,
        p_target_amount: fund.targetAmount,
        p_base_reward: fund.baseReward,
        p_incentive_reward: fund.incentiveReward,
        p_recruitment_deadline: fund.recruitmentDeadline,
        p_maturity_date: fund.maturityDate
    });
    handleSupabaseError(error, 'createFund');
    return data.message;
};

const joinFund = async (userId: string, fundId: string, units: number): Promise<string> => {
    const { data, error } = await supabase.rpc('join_fund', {
        p_user_id: userId,
        p_fund_id: fundId,
        p_units: units
    });
    handleSupabaseError(error, 'joinFund');
    return data.message;
};

const settleFund = async (fundId: string, resultStatus: FundStatus): Promise<string> => {
    const { data, error } = await supabase.rpc('settle_fund', {
        p_fund_id: fundId,
        p_status: resultStatus
    });
    handleSupabaseError(error, 'settleFund');
    return data.message;
};

const getMyFundInvestments = async (userId: string): Promise<FundInvestment[]> => {
     const { data, error } = await supabase
        .from('fund_investments')
        .select('*, funds(*)')
        .eq('student_user_id', userId);
    
    handleSupabaseError(error, 'getMyFundInvestments');
    
    return (data || []).map((inv: any) => ({
        id: inv.id,
        fundId: inv.fund_id,
        studentUserId: inv.student_user_id,
        units: inv.units,
        investedAt: inv.invested_at,
        fund: inv.funds ? {
             ...inv.funds,
            creatorId: inv.funds.creator_student_id,
            teacherId: inv.funds.teacher_id,
            unitPrice: inv.funds.unit_price,
            targetAmount: inv.funds.target_amount,
            baseReward: inv.funds.base_reward,
            incentiveReward: inv.funds.incentive_reward,
            recruitmentDeadline: inv.funds.recruitment_deadline,
            maturityDate: inv.funds.maturity_date,
        } : undefined
    }));
};


export const api = {
    login,
    loginWithPassword,
    changePassword,
    resetPassword,
    loginWithQrToken,
    getUsersByRole,
    addStudent,
    deleteStudents,
    getStudentAccountByUserId,
    getTeacherAccount,
    getTransactionsByAccountId,
    getRecipientDetailsByAccountId,
    transfer,
    studentWithdraw,
    bankerDeposit,
    bankerWithdraw,
    martTransfer,
    getStockProducts,
    getStudentStocks,
    getStockHistory,
    buyStock,
    sellStock,
    addStockProduct,
    updateStockPrice,
    updateStockVolatility,
    deleteStockProducts,
    getStockHolders,
    getSavingsProducts,
    getStudentSavings,
    joinSavings,
    cancelSavings,
    addSavingsProduct,
    deleteSavingsProducts,
    getSavingsEnrollees,
    getJobs,
    addJob,
    deleteJob,
    deleteJobs,
    manageJobAssignment,
    updateJobIncentive,
    payJobSalary,
    payAllSalaries,
    getTaxes,
    createTax,
    deleteTax,
    getMyUnpaidTaxes,
    payTax,
    getFunds,
    createFund,
    joinFund,
    settleFund,
    getMyFundInvestments,
};