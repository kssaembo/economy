import { supabase } from './supabaseClient';
import { Role, User, Account, StockProduct, StockProductWithDetails, StudentStock, SavingsProduct, StudentSaving, Job, TaxItemWithRecipients, StockHistory, Fund, FundInvestment, FundStatus } from '../types';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        
        // 1. 함수가 없을 때 (404 Not Found / PGRST202)
        if (error.code === 'PGRST202' || error.message.includes('Could not find the function')) {
             throw new Error(`Supabase에 해당 함수가 없습니다. (${context})\nSQL Editor에서 함수를 업데이트해주세요.`);
        }
        
        // 2. 권한 문제 (RLS)
        if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('violates row-level security policy')) {
             throw new Error('권한이 없습니다 (RLS Error). 관리자에게 문의하거나 함수에 SECURITY DEFINER를 설정하세요.');
        }

        // 3. RPC 함수 매개변수 불일치 등
        if (error.code === '42883') {
             throw new Error(`함수 매개변수가 일치하지 않습니다. (${context})\nSupabase SQL Editor에서 함수 정의를 확인해주세요.`);
        }

        // 4. 데이터 타입 불일치 (22P02) - UUID/Text 등
        if (error.code === '22P02') {
             throw new Error(`데이터 형식 오류입니다. (${context})\n입력된 데이터가 DB 타입과 맞지 않습니다. (예: 텍스트 ID를 UUID로 처리 시도)\n개발자 도구 콘솔을 확인하세요.`);
        }

        // 5. 컬럼 없음 (42703) - SQL에서 참조하는 컬럼이 테이블에 없을 때
        if (error.code === '42703') {
             // Extract column name if possible
             const match = error.message.match(/column "(.+?)"/);
             const colName = match ? match[1] : '알 수 없는 컬럼';
             throw new Error(`데이터베이스 스키마 오류: '${colName}' 컬럼이 테이블에 존재하지 않습니다.\nSQL 함수가 해당 컬럼을 참조하고 있습니다.`);
        }

        // 6. NULL 제약 조건 위반 (23502)
        if (error.code === '23502') {
             const match = error.message.match(/column "(.+?)"/);
             const colName = match ? match[1] : '데이터';
             throw new Error(`데이터베이스 오류: 필수 항목(${colName})이 누락되었습니다.\nSQL 함수에서 해당 필드 값을 생성하거나 전달하는지 확인하세요.`);
        }

        // 7. 기타 DB 에러 상세 파싱
        if (error.message.includes('Database error saving new record') || error.message.includes('error running function')) {
            const match = error.message.match(/DETAIL: (.*)/) || error.message.match(/error: (.*)/);
            if (match && match[1]) {
                throw new Error(match[1]);
            }
        }
        
        throw new Error(error.message || `An error occurred during ${context}.`);
    }
};

const uuidv4 = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // Fallback if crypto.randomUUID fails (e.g. insecure context)
        }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

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

// 관리자 비밀번호 검증용 RPC 호출 함수 추가
const verifyAdminPassword = async (userId: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('verify_admin_password', {
        p_user_id: userId,
        p_password: password
    });
    handleSupabaseError(error, 'verifyAdminPassword');
    return !!data;
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
    const userId = uuidv4();

    const { error } = await supabase.rpc('add_student', {
        p_user_id: userId,
        p_name: name,
        p_grade: grade,
        p_class: classNum,
        p_number: number
    });

    handleSupabaseError(error, 'addStudent');
};

const deleteStudents = async (userIds: string[]): Promise<string> => {
    let successCount = 0;
    const errors: string[] = [];
    let lastErrorMsg = "";

    console.log("Deleting students:", userIds);

    for (const userId of userIds) {
        try {
            const { error } = await supabase.rpc('delete_student', { p_user_id: userId });
            
            if (error) {
                console.error(`Supabase RPC Error for ${userId}:`, error);
                throw error;
            }
            successCount++;
        } catch (error: any) {
            console.error(`Failed to delete student ${userId}:`, error);
            lastErrorMsg = error.message || JSON.stringify(error);
            
            if (error.code === '42883') {
                lastErrorMsg = "백엔드에 'delete_student' 함수가 없습니다.";
            } else if (error.code === '42501') {
                lastErrorMsg = "삭제 권한이 없습니다.";
            }
            errors.push(userId);
        }
    }

    if (successCount === 0 && errors.length > 0) {
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
    if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, 'getStudentAccountByUserId');
    }
    return data;
};

const getTeacherAccount = async (): Promise<Account | null> => {
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('userId')
        .eq('role', 'teacher')
        .limit(1);
    
    if (userError || !users || users.length === 0) return null;
    
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

const transfer = async (senderUserId: string, recipientAccountNumber: string, amount: number, memo?: string): Promise<string> => {
    if (!senderUserId) throw new Error("보내는 사람 정보가 없습니다.");
    if (!recipientAccountNumber) throw new Error("받는 사람 계좌번호가 없습니다.");
    if (amount <= 0) throw new Error("송금 금액이 올바르지 않습니다.");

    const { data, error } = await supabase.rpc('transfer_funds', {
        p_sender_user_id: senderUserId,
        p_receiver_account_number: recipientAccountNumber,
        p_transfer_amount: amount,
        p_memo: memo
    });
    handleSupabaseError(error, 'transfer');
    
    if (typeof data === 'object' && data !== null && 'message' in data) {
        return data.message;
    }
    return typeof data === 'string' ? data : '송금이 완료되었습니다.';
};

const studentWithdraw = async (userId: string, amount: number, target: 'mart' | 'teacher'): Promise<string> => {
    const { data, error } = await supabase.rpc('student_withdraw', {
        p_user_id: userId,
        p_amount: amount,
        p_target_role: target,
    });
    handleSupabaseError(error, 'studentWithdraw');
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
    const { data: tableData, error: tableError } = await supabase
        .from('stock_products')
        .select('id, name, currentPrice, volatility');
    
    if (tableError) {
        console.error("Table Fetch Error:", tableError);
        throw new Error(tableError.message);
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_stock_products_with_details');
    if (rpcError) {
        console.warn("RPC Error (non-critical):", rpcError);
    }

    const mergedData = (tableData || []).map((tableItem: any) => {
        const rpcItem = (rpcData || []).find((r: any) => r.id === tableItem.id);
        return {
            id: tableItem.id,
            name: tableItem.name,
            currentPrice: tableItem.currentPrice,
            volatility: tableItem.volatility || 0.01,
            stockAccountId: rpcItem?.stockAccountId || '',
            totalQuantity: rpcItem?.totalQuantity || 0,
            valuation: rpcItem?.valuation || 0
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
        .limit(100);
        
    let history: StockHistory[] = [];

    if (error) {
        console.warn("Could not fetch stock history:", error.message);
    } else {
        history = (data || []).map((item: any) => ({
            id: item.id,
            stockId: item.stockId || item.stockid, 
            price: item.price,
            createdAt: item.createdAt || item.createdat 
        }));
    }

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
    // SQL 함수가 p_user_id text, p_stock_id text로 정의되어 있으므로 문자열 그대로 전달
    const { error } = await supabase.rpc('buy_stock', {
        p_user_id: userId,
        p_stock_id: stockId,
        p_quantity: quantity
    });
    handleSupabaseError(error, 'buyStock');
    return '주식을 성공적으로 구매했습니다.';
};

const sellStock = async (userId: string, stockId: string, quantity: number): Promise<string> => {
    // SQL 함수가 p_user_id text, p_stock_id text로 정의되어 있으므로 문자열 그대로 전달
    const { data, error } = await supabase.rpc('sell_stock', {
        p_user_id: userId,
        p_stock_id: stockId,
        p_quantity: quantity
    });
    handleSupabaseError(error, 'sellStock');
    return typeof data === 'string' ? data : '주식을 성공적으로 판매했습니다.';
};

const addStockProduct = async (name: string, price: number): Promise<string> => {
    const { data, error } = await supabase.rpc('add_stock_product', {
        p_name: name,
        p_initial_price: price
    });
    handleSupabaseError(error, 'addStockProduct');
    return typeof data === 'string' ? data : '새로운 주식 종목이 추가되었습니다.';
};

const updateStockPrice = async (stockId: string, newPrice: number): Promise<string> => {
    // 1. stock_products 테이블의 id가 TEXT 타입이므로, TEXT 타입 매개변수를 받는 RPC 호출
    // 2. currentPrice가 NUMERIC 타입이므로, NUMERIC(float)으로 전달
    // 3. 충돌 방지를 위해 최종 명명된 v3_update_stock_price 함수 사용
    const { error } = await supabase.rpc('v3_update_stock_price', {
        p_stock_id: stockId, // string (text)
        p_new_price: newPrice // number (numeric)
    });
    
    handleSupabaseError(error, 'updateStockPrice');

    return '가격이 변경되었습니다.';
};

const updateStockVolatility = async (stockId: string, volatility: number): Promise<void> => {
    const { error } = await supabase.rpc('update_stock_volatility', {
        p_stock_id: stockId,
        p_volatility: volatility
    });
    handleSupabaseError(error, 'updateStockVolatility');
};

const deleteStockProducts = async (stockIds: string[]): Promise<string> => {
    const { error } = await supabase
        .from('stock_products')
        .delete()
        .in('id', stockIds);
        
    handleSupabaseError(error, 'deleteStockProducts (Table)');
    return '선택한 종목이 삭제되었습니다.';
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
    // FIX: Explicitly specifying the foreign key to resolve ambiguity (PGRST201 error)
    // Alias the joined data as 'product' for consistency with our types
    const { data, error } = await supabase
        .from('student_savings')
        .select('*, product:savings_products!student_savings_productId_fkey(*)')
        .eq('userId', userId);
    
    handleSupabaseError(error, 'getStudentSavings');
    
    if (!data) return [];
    
    return data.map(ss => {
        // Map the aliased 'product' correctly
        const product = ss.product as SavingsProduct;
        delete (ss as any).product;
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
    // FIXED: Use unambiguous function name 'cancel_student_savings' to match the database and error logs
    const { data, error } = await supabase.rpc('cancel_student_savings', {
        p_user_id: userId,
        p_saving_id: savingId
    });
    handleSupabaseError(error, 'cancelSavings');
    return typeof data === 'string' ? data : '적금을 성공적으로 해지했습니다.';
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

const updateJob = async (id: string, name: string, description: string, salary: number): Promise<void> => {
    const { error } = await supabase
        .from('jobs')
        .update({ jobName: name, description: description, salary: salary })
        .eq('id', id);
    handleSupabaseError(error, 'updateJob');
};

const deleteJob = async (jobId: string): Promise<string> => {
    return deleteJobs([jobId]);
};

const deleteJobs = async (jobIds: string[]): Promise<string> => {
    let successCount = 0;
    const errors: string[] = [];
    console.log("Deleting jobs:", jobIds);
    for (const jobId of jobIds) {
        try {
            const { error } = await supabase.rpc('delete_job', { p_job_id: jobId });
            if (error) throw error;
            successCount++;
        } catch (error: any) {
            errors.push(jobId);
        }
    }
    if (successCount === 0 && errors.length > 0) throw new Error("삭제 실패");
    return `${successCount}개의 직업을 삭제했습니다.`;
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
    const { data: recipients, error: rcptError } = await supabase.from('tax_recipients').select('*');
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
    // FIX: Using correctly named parameter 'amount' instead of 'p_amount' which was missing in current scope
    const { data, error } = await supabase.rpc('create_tax', { p_name: name, p_amount: amount, p_due_date: dueDate, p_student_ids: studentIds });
    handleSupabaseError(error, 'createTax');
    return data;
};

const deleteTax = async (taxId: string): Promise<string> => {
    // FIX: Correct parameter name from p_tax_id to taxId
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
     const { data, error } = await supabase.rpc('pay_tax', { p_user_id: userId, p_tax_id: taxId });
    handleSupabaseError(error, 'payTax');
    return data;
};

// --- Funds ---
const getFunds = async (): Promise<Fund[]> => {
    const { data, error } = await supabase.rpc('get_funds_with_stats');
    handleSupabaseError(error, 'getFunds');
    
    const now = new Date();

    return (data || []).map((f: any) => {
        // Normalize fields from DB (snake_case vs camelCase)
        const recruitmentDeadline = f.recruitmentDeadline || f.recruitment_deadline;
        const maturityDate = f.maturityDate || f.maturity_date;
        let status = (f.status || FundStatus.RECRUITING) as FundStatus;

        // Auto-transition RECRUITING -> ONGOING if deadline passed
        // This ensures the teacher can settle the fund and students see it as ongoing
        if (status === FundStatus.RECRUITING && recruitmentDeadline) {
            const deadlineDate = new Date(recruitmentDeadline);
            if (now > deadlineDate) {
                status = FundStatus.ONGOING;
            }
        }

        return {
            ...f,
            creatorId: f.creatorId || f.creator_student_id,
            creatorName: f.creatorName || f.creator_name,
            teacherId: f.teacherId || f.teacher_id,
            unitPrice: f.unitPrice || f.unit_price,
            targetAmount: f.targetAmount || f.target_amount,
            baseReward: f.baseReward || f.base_reward,
            incentiveReward: f.incentiveReward || f.incentive_reward,
            recruitmentDeadline: recruitmentDeadline,
            maturityDate: maturityDate,
            status: status, // Computed status
            totalInvestedAmount: f.totalInvestedAmount || f.total_invested_amount || 0,
            investorCount: f.investorCount || f.investor_count || 0,
            createdAt: f.createdAt || f.created_at
        };
    });
};

// Fix property name from fund.incentive_reward to fund.incentiveReward to match the Omit<Fund, ...> type.
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

const deleteFund = async (fundId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('delete_fund', { p_fund_id: fundId });
    handleSupabaseError(error, 'deleteFund');
    return data.message;
};

const joinFund = async (userId: string, fundId: string, units: number): Promise<string> => {
    const { data, error } = await supabase.rpc('join_fund', { p_user_id: userId, p_fund_id: fundId, p_units: units });
    handleSupabaseError(error, 'joinFund');
    return data.message;
};

const settleFund = async (fundId: string, resultStatus: FundStatus): Promise<string> => {
    const { data, error } = await supabase.rpc('settle_fund', { p_fund_id: fundId, p_status: resultStatus });
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
    verifyAdminPassword, // 추가된 부분
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
    updateJob,
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
    deleteFund,
    joinFund,
    settleFund,
    getMyFundInvestments,
};