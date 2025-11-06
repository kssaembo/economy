import { supabase } from './supabaseClient';
import { Role, User, Account, StockProduct, StudentStock, SavingsProduct, StudentSaving, Job } from '../types';

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
    
    if(error) handleSupabaseError(error, 'addStudent');
    if (data && !data.success) throw new Error(data.message);
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
     const { data: account, error } = await supabase
        .from('accounts')
        .select('*, users(*)')
        .eq('accountId', accountId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, 'getRecipientDetailsByAccountId');
    }

    if (!account || !account.users) return null;

    const user = account.users as User;
    delete (account as any).users;

    return { user, account };
};

const transfer = async (senderUserId: string, recipientAccountId: string, amount: number, memo?: string): Promise<string> => {
    const { data, error } = await supabase.rpc('transfer_funds', {
        sender_user_id: senderUserId,
        receiver_account_id: recipientAccountId,
        transfer_amount: amount,
        p_memo: memo
    });
    if (error) throw new Error(error.message);
    return data;
};

const studentWithdraw = async (userId: string, amount: number, target: 'mart' | 'teacher'): Promise<string> => {
    const { data, error } = await supabase.rpc('student_withdraw', {
        p_user_id: userId,
        p_amount: amount,
        p_target_role: target,
    });
    if (error) throw new Error(error.message);
    return data;
};


const bankerDeposit = async (userId: string, amount: number): Promise<string> => {
    const { data, error } = await supabase.rpc('banker_transaction', {
        p_student_user_id: userId,
        p_amount: amount,
        p_type: 'Deposit'
    });
    if (error) throw new Error(error.message);
    return data.message;
};

const bankerWithdraw = async (userId: string, amount: number): Promise<string> => {
    const { data, error } = await supabase.rpc('banker_transaction', {
        p_student_user_id: userId,
        p_amount: amount,
        p_type: 'Withdrawal'
    });
    if (error) throw new Error(error.message);
    return data.message;
};

const martTransfer = async (studentAccountId: string, amount: number, direction: 'TO_STUDENT' | 'FROM_STUDENT'): Promise<string> => {
    const { data, error } = await supabase.rpc('mart_transfer', {
        p_student_account_id: studentAccountId,
        p_amount: amount,
        p_direction: direction
    });
    if (error) throw new Error(error.message);
    return data;
};

// --- Stocks ---

const getStockProducts = async (): Promise<any[]> => {
    const { data, error } = await supabase.rpc('get_stock_products_with_details');
    handleSupabaseError(error, 'getStockProducts');
    return data || [];
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

const buyStock = async (userId: string, stockId: string, quantity: number): Promise<string> => {
    const { error } = await supabase.rpc('buy_stock', {
        p_user_id: userId,
        p_stock_id: stockId,
        p_quantity: quantity
    });
    if (error) throw new Error(error.message);
    return '주식을 성공적으로 구매했습니다.';
};

const sellStock = async (userId: string, stockId: string, quantity: number): Promise<string> => {
     const { error } = await supabase.rpc('sell_stock', {
        p_user_id: userId,
        p_stock_id: stockId,
        p_quantity: quantity
    });
    if (error) throw new Error(error.message);
    return '주식을 성공적으로 판매했습니다.';
};

const addStockProduct = async (name: string, price: number): Promise<string> => {
    const { data, error } = await supabase.rpc('add_stock_product', { p_name: name, p_initial_price: price });
    if (error) throw new Error(error.message);
    return data.message;
};

const updateStockPrice = async (stockId: string, newPrice: number): Promise<string> => {
    const { data, error } = await supabase.rpc('update_stock_price', { p_stock_id: stockId, p_new_price: newPrice });
    if (error) throw new Error(error.message);
    return data.message;
};

const deleteStockProducts = async (stockIds: string[]): Promise<string> => {
    const { data, error } = await supabase.rpc('delete_stock_products', { p_stock_ids: stockIds });
    if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);
    return '적금에 성공적으로 가입했습니다.';
};

const cancelSavings = async (userId: string, savingId: string): Promise<string> => {
     const { error } = await supabase.rpc('cancel_savings', {
        p_user_id: userId,
        p_saving_id: savingId
    });
    if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);
    return data.message;
};

const deleteSavingsProducts = async (productIds: string[]): Promise<string> => {
    const { data, error } = await supabase.rpc('delete_savings_products', { p_product_ids: productIds });
    if (error) throw new Error(error.message);
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
    const { error } = await supabase.rpc('delete_job', { p_job_id: jobId });
    handleSupabaseError(error, 'deleteJob');
    return '직업이 삭제되었습니다.';
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

export const api = {
    login,
    loginWithQrToken,
    getUsersByRole,
    addStudent,
    getStudentAccountByUserId,
    getTransactionsByAccountId,
    getRecipientDetailsByAccountId,
    transfer,
    studentWithdraw,
    bankerDeposit,
    bankerWithdraw,
    martTransfer,
    getStockProducts,
    getStudentStocks,
    buyStock,
    sellStock,
    addStockProduct,
    updateStockPrice,
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
    manageJobAssignment,
    updateJobIncentive,
    payJobSalary,
    payAllSalaries,
};