
import { supabase } from './supabaseClient';
// Added missing FundInvestment import
import { Role, User, Account, StockProduct, StockProductWithDetails, StudentStock, SavingsProduct, StudentSaving, Job, TaxItemWithRecipients, StockHistory, Fund, FundStatus, FundInvestment } from '../types';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        
        // 함수 모호성 에러 (PGRST203) 처리
        if (error.code === 'PGRST203' || (error.message && error.message.includes('best candidate function'))) {
             throw new Error(`데이터베이스 함수 타입 모호성 오류: SQL Editor에서 기존 주식 함수를 모두 DROP하고 다시 생성해야 합니다.`);
        }

        if (error.code === 'PGRST202' || (error.message && error.message.includes('Could not find the function'))) {
             throw new Error(`Supabase에 해당 함수가 없습니다. (${context})\nSQL Editor에서 함수를 업데이트해주세요.`);
        }
        
        if (error.code === '42501' || (error.message && (error.message.includes('permission denied') || error.message.includes('violates row-level security policy')))) {
             throw new Error('권한이 없습니다 (RLS Error). 함수에 SECURITY DEFINER를 설정하세요.');
        }

        if (error.code === '42883') {
             throw new Error(`데이터 타입 불일치 오류: 함수 파라미터 타입을 확인해주세요.`);
        }

        if (error.code === '22P02') {
             throw new Error(`데이터 형식 오류입니다. (${context})\n입력된 데이터가 DB 타입과 맞지 않습니다.`);
        }

        if (error.code === '42703') {
             const match = error.message.match(/column "(.+?)"/);
             const colName = match ? match[1] : '알 수 없는 컬럼';
             throw new Error(`데이터베이스 스키마 오류: '${colName}' 컬럼이 존재하지 않습니다. SQL을 다시 실행해주세요.`);
        }

        if (error.code === 'P0001') {
             throw new Error(error.message || '데이터베이스 내부 작업 중 오류가 발생했습니다.');
        }

        if (error.code === '23502') {
             const match = error.message.match(/column "(.+?)"/);
             const colName = match ? match[1] : '데이터';
             throw new Error(`데이터베이스 오류: 필수 항목(${colName})이 누락되었습니다.`);
        }

        if (error.message && (error.message.includes('Database error saving new record') || error.message.includes('error running function'))) {
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
        } catch (e) {}
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// 공통 화폐 단위 및 교사 별칭 주입 헬퍼
const injectCurrencyUnit = async (user: User | null): Promise<User | null> => {
    if (!user) return null;
    
    // 학생의 경우 teacher_id를, 선생님의 경우 자신의 userId를 기준으로 선생님 정보를 가져옴
    let teacherId = user.role === Role.TEACHER ? user.userId : user.teacher_id;
    
    // 만약 학생인데 teacher_id가 없다면, DB에서 다시 한 번 조회를 시도함 (데이터 무결성 보완)
    if (!teacherId && user.role === Role.STUDENT) {
        try {
            const { data: userData } = await supabase
                .from('users')
                .select('teacher_id')
                .eq('userId', user.userId)
                .maybeSingle();
            
            if (userData?.teacher_id) {
                teacherId = userData.teacher_id;
                user.teacher_id = userData.teacher_id;
            }
        } catch (err) {
            console.error("Failed to fetch teacher_id for student:", err);
        }
    }

    if (teacherId) {
        try {
            // [수정] 보안 강화를 위해 직접 테이블 조회 대신 RPC 보안 함수 사용
            // teacherId를 명시적으로 string으로 변환하여 p_teacher_id 인자로 전달
            const { data, error } = await supabase.rpc('get_teacher_public_info', { p_teacher_id: teacherId.toString() });
            
            if (error) {
                console.error("Teacher info lookup error (via RPC):", error);
            }
            
            if (data && data.length > 0) {
                const info = data[0];
                // 성공적으로 가져온 경우 주입 (RPC 반환 컬럼명: currency_unit, teacher_alias, class_code)
                user.currencyUnit = info.currency_unit || '권';
                user.teacherAlias = info.teacher_alias || '';
                user.classCode = info.class_code || '';
            } else {
                // 정보가 없는 경우 기본값
                if (!user.currencyUnit) user.currencyUnit = '권';
            }
        } catch (err) {
            console.error("Exception during teacher info injection:", err);
            if (!user.currencyUnit) user.currencyUnit = '권';
        }
    } else {
        // teacherId 자체가 없는 경우 (예: 독립 계정 등)
        if (!user.currencyUnit) user.currencyUnit = '권';
    }
    return user;
};

const login = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('userId', userId)
        .single();
    handleSupabaseError(error, 'login');
    return injectCurrencyUnit(data);
};

const signupTeacher = async (loginId: string, password: string, alias: string, unit: string): Promise<{ recoveryCode: string }> => {
    const { data, error } = await supabase.rpc('signup_teacher', {
        p_login_id: loginId,
        p_password: password,
        p_alias: alias,
        p_currency_unit: unit
    });
    handleSupabaseError(error, 'signupTeacher');
    return data;
};

const loginTeacher = async (loginId: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.rpc('login_teacher', {
        p_login_id: loginId,
        p_password: password
    });
    handleSupabaseError(error, 'loginTeacher');
    // RPC가 SETOF(배열)를 반환하므로 첫 번째 요소를 사용함
    const user = data && Array.isArray(data) ? data[0] : data;
    return injectCurrencyUnit(user);
};

const requestRecoveryCode = async (loginId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('request_recovery_code', {
        p_login_id: loginId
    });
    handleSupabaseError(error, 'requestRecoveryCode');
    return !!data;
};

const verifyRecoveryCode = async (loginId: string, code: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('verify_recovery_code', {
        p_login_id: loginId,
        p_recovery_code: code
    });
    handleSupabaseError(error, 'verifyRecoveryCode');
    return !!data;
};

const resetTeacherPassword = async (loginId: string, code: string, newPw: string): Promise<void> => {
    const { data, error } = await supabase.rpc('reset_teacher_password', {
        p_login_id: loginId,
        p_recovery_code: code,
        p_new_password: newPw
    });
    handleSupabaseError(error, 'resetTeacherPassword');
    if (!data) throw new Error("복구 코드가 올바르지 않거나 만료되었습니다.");
};

const checkTeacherExists = async (teacherId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('users')
        .select('userId')
        .eq('userId', teacherId)
        .eq('role', Role.TEACHER)
        .single();
    if (error && error.code === 'PGRST116') return false;
    handleSupabaseError(error, 'checkTeacherExists');
    return !!data;
};

const getUsersByRole = async (role: Role, teacherId: string): Promise<User[]> => {
    let users: User[] = [];
    if (role === Role.STUDENT) {
        try {
            if (teacherId) {
                const { data, error } = await supabase.rpc('get_students_by_teacher', { 
                    p_teacher_id: teacherId.toString() 
                });
                
                if (error) {
                    console.error("RPC Error in get_students_by_teacher:", error.message);
                } else if (data) {
                    users = data;
                }
            }
        } catch (e) {
            console.error("RPC Exception in getUsersByRole", e);
        }
    }

    if (users.length === 0) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', role)
            .or(`teacher_id.eq.${teacherId},teacher_id.is.null`)
            .order('number', { ascending: true });
            
        handleSupabaseError(error, `getUsersByRole (${role})`);
        users = data || [];
    }

    // 화폐 단위 및 별칭 일괄 주입 (선생님 정보 한 번만 조회)
    if (users.length > 0) {
        const tid = teacherId || users[0].teacher_id;
        if (tid) {
            try {
                // [수정] 보안 강화를 위해 직접 테이블 조회 대신 RPC 보안 함수 사용
                const { data: rpcData } = await supabase.rpc('get_teacher_public_info', { p_teacher_id: tid.toString() });
                
                if (rpcData && rpcData.length > 0) {
                    const tData = rpcData[0];
                    users = users.map(u => ({ 
                        ...u, 
                        currencyUnit: tData.currency_unit || u.currencyUnit || '권',
                        teacherAlias: tData.teacher_alias || u.teacherAlias, // 별칭 주입
                        classCode: tData.class_code || u.classCode
                    }));
                }
            } catch (err) {
                console.error("Failed to batch inject teacher info:", err);
            }
        }
    }

    return users;
};

const loginWithPassword = async (classCode: string, grade: number, classNum: number, number: number, password: string): Promise<User | null> => {
    const { data, error } = await supabase.rpc('login_with_password', {
        p_class_code: classCode,
        p_grade: grade,
        p_class: classNum,
        p_number: number,
        p_password: password
    });
    
    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.message);
    
    // 주입된 사용자 객체에 화폐 단위 강제 확인 및 주입
    const user = data.user as User;
    return injectCurrencyUnit(user);
};

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

const addStudent = async (name: string, grade: number, classNum: number, number: number, teacherId: string): Promise<void> => {
    const userId = uuidv4();
    const { error } = await supabase.rpc('add_student', {
        p_user_id: userId,
        p_name: name,
        p_grade: grade,
        p_class: classNum,
        p_number: number,
        p_teacher_id: teacherId
    });
    handleSupabaseError(error, 'addStudent');
};

const deleteStudents = async (userIds: string[]): Promise<string> => {
    let successCount = 0;
    const errors: string[] = [];
    let lastErrorMsg = "";

    for (const userId of userIds) {
        try {
            const { error } = await supabase.rpc('delete_student', { p_user_id: userId });
            if (error) throw error;
            successCount++;
        } catch (error: any) {
            lastErrorMsg = error.message || JSON.stringify(error);
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

const getStudentAccountByUserId = async (userId: string): Promise<Account | null> => {
    if (!userId) return null;
    
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('userId', userId);
    
    if (error) {
        handleSupabaseError(error, 'getStudentAccountByUserId');
    }
    
    if (!data || data.length === 0) return null;

    let accountData = data.find(acc => acc.account_type === 'mart');
    if (!accountData) {
        accountData = data.find(acc => acc.account_type === 'personal');
    }
    if (!accountData) {
        accountData = data[0];
    }
    
    return {
        ...accountData,
        accountId: accountData.accountId || accountData.accountid || accountData.id
    } as Account;
};

const getTeacherAccount = async (): Promise<Account | null> => {
    const storedUserId = localStorage.getItem('class_bank_user_id');
    if (!storedUserId) return null;

    const { data: user } = await supabase
        .from('users')
        .select('userId, role, teacher_id')
        .eq('userId', storedUserId)
        .single();
    
    if (!user) return null;

    const teacherId = user.role === Role.TEACHER ? user.userId : user.teacher_id;
    if (!teacherId) return null;

    const { data, error = null } = await supabase
        .from('accounts')
        .select('*')
        .eq('userId', teacherId);
        
    if (error || !data || data.length === 0) return null;
    
    const treasuryAcc = data.find(acc => acc.account_type === 'treasury') || data[0];

    return {
        ...treasuryAcc,
        accountId: treasuryAcc.accountId || treasuryAcc.accountid || treasuryAcc.id
    } as Account;
};

const getMartAccountByTeacherId = async (teacherId: string): Promise<Account | null> => {
    if (!teacherId) return null;
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('account_type', 'mart')
        .single();
    
    if (error && error.code !== 'PGRST116') handleSupabaseError(error, 'getMartAccountByTeacherId');
    if (!data) return null;

    return {
        ...data,
        accountId: data.accountId || data.accountid || data.id
    } as Account;
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
        p_sender_user_id: senderUserId.toString(),
        p_receiver_account_number: recipientAccountNumber.toString(),
        p_transfer_amount: amount,
        p_memo: memo
    });
    handleSupabaseError(error, 'transfer');
    return typeof data === 'string' ? data : '송금이 완료되었습니다.';
};

const studentWithdraw = async (userId: string, amount: number, target: 'mart' | 'teacher'): Promise<string> => {
    const { data, error } = await supabase.rpc('student_withdraw', {
        p_user_id: userId.toString(),
        p_amount: amount,
        p_target_role: target,
    });
    handleSupabaseError(error, 'studentWithdraw');
    const message = data?.message || data;
    return typeof message === 'string' ? message : '';
};

const bankerDeposit = async (userId: string, amount: number): Promise<string> => {
    const { data, error } = await supabase.rpc('banker_transaction', {
        p_student_user_id: userId.toString(),
        p_amount: amount,
        p_type: 'Deposit'
    });
    handleSupabaseError(error, 'bankerDeposit');
    return data.message;
};

const bankerWithdraw = async (userId: string, amount: number): Promise<string> => {
    const { data, error } = await supabase.rpc('banker_transaction', {
        p_student_user_id: userId.toString(),
        p_amount: amount,
        p_type: 'Withdrawal'
    });
    handleSupabaseError(error, 'bankerWithdraw');
    return data.message;
};

const martTransfer = async (studentAccountId: string, amount: number, direction: 'TO_STUDENT' | 'FROM_STUDENT'): Promise<string> => {
    const { data, error } = await supabase.rpc('mart_transfer', {
        p_student_account_id: studentAccountId.toString(),
        p_amount: amount,
        p_direction: direction
    });
    handleSupabaseError(error, 'martTransfer');
    return data;
};

const getStockProducts = async (teacherId: string): Promise<StockProductWithDetails[]> => {
    const { data, error } = await supabase.rpc('get_stock_products_with_details', { p_teacher_id: teacherId.toString() });
    if (error) handleSupabaseError(error, 'getStockProducts (RPC)');
    
    return (data || []).map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        currentPrice: item.currentPrice || item.currentprice || 0,
        volatility: item.volatility || 0.01,
        stockAccountId: item.stockAccountId || item.stockaccountid || '',
        totalQuantity: item.totalQuantity || item.totalquantity || 0,
        valuation: item.valuation || 0
    }));
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
        .order('createdAt', { ascending: false })
        .limit(100);
    let history: StockHistory[] = [];
    if (!error) {
        history = (data || []).map((item: any) => ({
            id: item.id.toString(),
            stockId: (item.stockId || item.stockid).toString(), 
            price: item.price,
            createdAt: item.createdAt || item.createdat 
        })).reverse();
    }
    if (history.length === 0) {
        const { data: stock } = await supabase
            .from('stock_products')
            .select('currentPrice')
            .eq('id', stockId)
            .single();
        if (stock) {
            history = [{ id: 'initial', stockId: stockId, price: stock.currentPrice, createdAt: new Date().toISOString() }];
        }
    }
    return history;
};

const buyStock = async (userId: string, stockId: string, quantity: number): Promise<string> => {
    const { data, error } = await supabase.rpc('buy_stock', { 
        p_user_id: userId.toString(), 
        p_stock_id: stockId.toString(), 
        p_quantity: quantity 
    });
    handleSupabaseError(error, 'buyStock');
    return typeof data === 'string' ? data : '주식을 성공적으로 구매했습니다.';
};

const sellStock = async (userId: string, stockId: string, quantity: number): Promise<string> => {
    const { data, error } = await supabase.rpc('sell_stock', { 
        p_user_id: userId.toString(), 
        p_stock_id: stockId.toString(), 
        p_quantity: quantity 
    });
    handleSupabaseError(error, 'sellStock');
    return typeof data === 'string' ? data : '주식을 성공적으로 판매했습니다.';
};

const addStockProduct = async (name: string, price: number, teacherId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('add_stock_product', { 
        p_name: name, 
        p_initial_price: price,
        p_teacher_id: teacherId.toString()
    });
    handleSupabaseError(error, 'addStockProduct');
    return typeof data === 'string' ? data : '새로운 주식 종목이 추가되었습니다.';
};

const updateStockPrice = async (stockId: string, newPrice: number): Promise<string> => {
    const { error } = await supabase.rpc('v3_update_stock_price', { p_stock_id: stockId.toString(), p_new_price: newPrice });
    handleSupabaseError(error, 'updateStockPrice');
    return '가격이 변경되었습니다.';
};

const updateStockVolatility = async (stockId: string, volatility: number): Promise<void> => {
    const { error } = await supabase.rpc('update_stock_volatility', { p_stock_id: stockId.toString(), p_volatility: volatility });
    handleSupabaseError(error, 'updateStockVolatility');
};

const deleteStockProducts = async (stockIds: string[]): Promise<string> => {
    const { error } = await supabase.from('stock_products').delete().in('id', stockIds);
    handleSupabaseError(error, 'deleteStockProducts');
    return '선택한 종목이 삭제되었습니다.';
};

const getStockHolders = async (stockId: string): Promise<{ studentName: string, quantity: number }[]> => {
    const { data, error } = await supabase.rpc('get_stock_holders', { p_stock_id: stockId.toString() });
    handleSupabaseError(error, 'getStockHolders');
    return data || [];
};

const getSavingsProducts = async (teacherId: string): Promise<SavingsProduct[]> => {
    const { data, error } = await supabase
        .from('savings_products')
        .select('*')
        .eq('teacher_id', teacherId);
    handleSupabaseError(error, 'getSavingsProducts');
    return data || [];
};

const getStudentSavings = async (userId: string): Promise<StudentSaving[]> => {
    const { data, error } = await supabase
        .from('student_savings')
        .select('*, product:savings_products!student_savings_productId_fkey(*)')
        .eq('userId', userId);
    handleSupabaseError(error, 'getStudentSavings');
    if (!data) return [];
    return data.map(ss => {
        const product = ss.product as SavingsProduct;
        delete (ss as any).product;
        return { ...ss, product } as StudentSaving;
    });
};

const joinSavings = async (userId: string, productId: string, amount: number): Promise<string> => {
    const { error } = await supabase.rpc('join_savings', { p_user_id: userId.toString(), p_product_id: productId.toString(), p_amount: amount });
    handleSupabaseError(error, 'joinSavings');
    return '적금에 성공적으로 가입했습니다.';
};

const cancelSavings = async (userId: string, savingId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('cancel_student_savings', { p_user_id: userId.toString(), p_saving_id: savingId.toString() });
    handleSupabaseError(error, 'cancelSavings');
    return typeof data === 'string' ? data : '적금을 성공적으로 해지했습니다.';
};

const addSavingsProduct = async (product: Omit<SavingsProduct, 'id'>): Promise<string> => {
    const { data, error } = await supabase.rpc('add_savings_product', {
        p_name: product.name,
        p_maturity_days: product.maturityDays,
        p_rate: product.rate,
        p_cancellation_rate: product.cancellationRate,
        p_max_amount: product.maxAmount,
        p_teacher_id: (product as any).teacher_id.toString()
    });
    handleSupabaseError(error, 'addSavingsProduct');
    
    if (data && data.success === false) {
        throw new Error(data.message || '적금 상품 추가에 실패했습니다.');
    }
    
    return (data && data.message) ? data.message : '적금 상품이 성공적으로 추가되었습니다.';
};

const deleteSavingsProducts = async (productIds: string[]): Promise<string> => {
    const { data, error } = await supabase.rpc('delete_savings_products', { p_product_ids: productIds });
    handleSupabaseError(error, 'deleteSavingsProducts');
    return data.message;
};

const getSavingsEnrollees = async (productId: string): Promise<{ studentName: string, amount: number, maturityDate: string }[]> => {
    const { data, error } = await supabase.rpc('get_savings_enrollees', { p_product_id: productId.toString() });
    handleSupabaseError(error, 'getSavingsEnrollees');
    return data || [];
};

const getJobs = async (teacherId: string): Promise<Job[]> => {
    const { data, error = null } = await supabase.rpc('get_jobs_with_details', { p_teacher_id: teacherId.toString() });
    handleSupabaseError(error, 'getJobs');
    return data || [];
};

const addJob = async (name: string, description: string, salary: number, teacherId: string): Promise<string> => {
    const { error } = await supabase.rpc('add_job', { 
        p_job_name: name, 
        p_description: description, 
        p_salary: salary,
        p_teacher_id: teacherId.toString() 
    });
    handleSupabaseError(error, 'addJob');
    return '새로운 직업이 추가되었습니다.';
};

const updateJob = async (id: string, name: string, description: string, salary: number): Promise<void> => {
    const { error } = await supabase.from('jobs').update({ jobName: name, description: description, salary: salary }).eq('id', id);
    handleSupabaseError(error, 'updateJob');
};

const deleteJob = async (jobId: string): Promise<string> => {
    const { error } = await supabase.rpc('delete_job', { p_job_id: jobId.toString() });
    handleSupabaseError(error, 'deleteJob');
    return '직업을 삭제했습니다.';
};

const manageJobAssignment = async (jobId: string, studentUserIds: string[]): Promise<void> => {
    const { error = null } = await supabase.rpc('manage_job_assignment', { p_job_id: jobId.toString(), p_student_user_ids: studentUserIds });
    handleSupabaseError(error, 'manageJobAssignment');
};

const updateJobIncentive = async (jobId: string, incentive: number): Promise<void> => {
    const { error = null } = await supabase.rpc('update_job_incentive', { p_job_id: jobId.toString(), p_incentive: incentive });
    handleSupabaseError(error, 'updateJobIncentive');
};

const payJobSalary = async (jobId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('pay_job_salary', { p_job_id: jobId.toString() });
    handleSupabaseError(error, 'payJobSalary');
    return data;
};

const payAllSalaries = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('pay_all_salaries');
    handleSupabaseError(error, 'payAllSalaries');
    return data;
};

const getTaxes = async (teacherId: string): Promise<TaxItemWithRecipients[]> => {
    const { data: taxes, error: taxError } = await supabase
        .from('tax_items')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
    if (taxError) throw new Error(taxError.message);
    const { data: recipients, error: rcptError } = await supabase
        .from('tax_recipients')
        .select('*')
        .eq('teacher_id', teacherId);
    if (rcptError) throw new Error(rcptError.message);
    return taxes.map((tax: any) => ({
        id: tax.id,
        name: tax.name,
        amount: tax.amount,
        dueDate: tax.due_date,
        createdAt: tax.created_at,
        recipients: recipients.filter((r: any) => r.tax_id === tax.id).map((r: any) => ({
            id: r.id,
            taxId: r.tax_id,
            studentUserId: r.student_user_id,
            isPaid: r.is_paid,
            paidAt: r.paid_at
        }))
    }));
};

const createTax = async (name: string, amount: number, dueDate: string, studentIds: string[], teacherId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('create_tax', { 
        p_name: name, 
        p_amount: amount, 
        p_due_date: dueDate, 
        p_student_ids: studentIds,
        p_teacher_id: teacherId.toString()
    });
    handleSupabaseError(error, 'createTax');
    return data;
};

const deleteTax = async (taxId: string): Promise<string> => {
    const { error = null } = await supabase.rpc('delete_tax', { p_tax_id: taxId.toString() });
    handleSupabaseError(error, 'deleteTax');
    return '세금 항목이 삭제되었습니다.';
};

const getMyUnpaidTaxes = async (userId: string): Promise<{ recipientId: string, taxId: string, name: string, amount: number, dueDate: string }[]> => {
    const { data, error } = await supabase.from('tax_recipients').select('*, tax_items(*)').eq('student_user_id', userId).eq('is_paid', false);
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
    const { data, error } = await supabase.rpc('pay_tax', { p_user_id: userId.toString(), p_tax_id: taxId.toString() });
    handleSupabaseError(error, 'payTax');
    return data;
};

const getFunds = async (teacherId: string): Promise<Fund[]> => {
    const { data, error } = await supabase.rpc('get_funds_with_stats', { p_teacher_id: teacherId.toString() });
    handleSupabaseError(error, 'getFunds');
    const now = new Date();
    return (data || []).map((f: any) => {
        const recruitmentDeadline = f.recruitmentDeadline || f.recruitment_deadline;
        const maturityDate = f.maturityDate || f.maturity_date;
        let status = (f.status || FundStatus.RECRUITING) as FundStatus;
        if (status === FundStatus.RECRUITING && recruitmentDeadline) {
            if (now > new Date(recruitmentDeadline)) status = FundStatus.ONGOING;
        }
        return {
            ...f,
            id: f.id.toString(),
            name: f.name,
            description: f.description,
            creatorId: f.creator_id,
            creatorName: f.creator_name, // RPC에서 가져온 신청자 이름 매핑
            unitPrice: f.unit_price || f.unitPrice || 0,
            targetAmount: f.target_amount || f.targetAmount || 0,
            baseReward: f.base_reward || f.baseReward || 0,
            incentiveReward: f.incentive_reward || f.incentiveReward || 0,
            recruitmentDeadline: recruitmentDeadline,
            maturityDate: maturityDate,
            status: status,
            totalInvestedAmount: f.total_invested_amount || f.totalInvestedAmount || 0,
            investorCount: f.investor_count || f.investorCount || 0
        };
    });
};

const createFund = async (fund: any): Promise<string> => {
    const { data, error } = await supabase.rpc('create_fund', {
        p_name: fund.name,
        p_description: fund.description,
        p_creator_id: fund.creatorId.toString(),
        p_teacher_id: fund.teacherId.toString(),
        p_unit_price: fund.unitPrice,
        p_target_amount: fund.targetAmount,
        p_base_reward: fund.base_reward || fund.baseReward,
        p_incentive_reward: fund.incentive_reward || fund.incentiveReward,
        p_recruitment_deadline: fund.recruitmentDeadline,
        p_maturity_date: fund.maturityDate
    });
    handleSupabaseError(error, 'createFund');
    return data.message;
};

const deleteFund = async (fundId: string): Promise<string> => {
    const { error = null } = await supabase.rpc('delete_fund', { p_fund_id: fundId.toString() });
    handleSupabaseError(error, 'deleteFund');
    return '삭제되었습니다.';
};

const joinFund = async (userId: string, fundId: string, units: number): Promise<string> => {
    const { data, error } = await supabase.rpc('join_fund', { 
        p_user_id: userId.toString(), 
        p_fund_id: fundId.toString(), 
        p_units: units 
    });
    handleSupabaseError(error, 'joinFund');
    // SQL에서 json_build_object로 성공 여부를 반환하는 경우 처리
    if (data && data.success === false) {
        throw new Error(data.message);
    }
    return typeof data === 'string' ? data : (data.message || '투자가 완료되었습니다.');
};

const settleFund = async (fundId: string, resultStatus: FundStatus): Promise<string> => {
    const { data, error = null } = await supabase.rpc('settle_fund', { p_fund_id: fundId.toString(), p_status: resultStatus });
    handleSupabaseError(error, 'settleFund');
    return data.message;
};

const getMyFundInvestments = async (userId: string): Promise<FundInvestment[]> => {
    const { data, error } = await supabase.from('fund_investments').select('*, funds(*)').eq('student_user_id', userId);
    handleSupabaseError(error, 'getMyFundInvestments');
    return (data || []).map((inv: any) => ({
        id: inv.id.toString(), fundId: inv.fund_id.toString(), studentUserId: inv.student_user_id.toString(), units: inv.units, investedAt: inv.invested_at,
        fund: inv.funds ? { 
            ...inv.funds,
            id: inv.funds.id.toString(),
            unitPrice: inv.funds.unit_price // unit_price를 unitPrice로 매핑 (필수)
        } : undefined
    }));
};

const getFundInvestors = async (fundId: string): Promise<{ student_name: string, units: number, invested_amount: number }[]> => {
    const { data, error } = await supabase.rpc('get_fund_investors', { p_fund_id: fundId.toString() });
    handleSupabaseError(error, 'getFundInvestors');
    return data || [];
};

const issueCurrency = async (teacherId: string, amount: number): Promise<string> => {
    const { data, error } = await supabase.rpc('issue_currency', {
        p_teacher_id: teacherId,
        p_amount: amount
    });
    handleSupabaseError(error, 'issueCurrency');
    return data;
};

export const api = {
    login, signupTeacher, loginTeacher, requestRecoveryCode, verifyRecoveryCode, resetTeacherPassword, checkTeacherExists,
    loginWithPassword, verifyAdminPassword, changePassword, resetPassword, loginWithQrToken, getUsersByRole,
    addStudent, deleteStudents, getStudentAccountByUserId, getTeacherAccount, getMartAccountByTeacherId, getTransactionsByAccountId,
    getRecipientDetailsByAccountId, transfer, studentWithdraw, bankerDeposit, bankerWithdraw, martTransfer,
    getStockProducts, getStudentStocks, getStockHistory, buyStock, sellStock, addStockProduct, updateStockPrice,
    updateStockVolatility, deleteStockProducts, getStockHolders, getSavingsProducts, getStudentSavings,
    joinSavings, cancelSavings, addSavingsProduct, deleteSavingsProducts, getSavingsEnrollees,
    getJobs, addJob, updateJob, deleteJob, manageJobAssignment, updateJobIncentive, payJobSalary, payAllSalaries,
    getTaxes, createTax, deleteTax, getMyUnpaidTaxes, payTax, getFunds, createFund, deleteFund, joinFund, settleFund, getMyFundInvestments,
    getFundInvestors, issueCurrency
};
