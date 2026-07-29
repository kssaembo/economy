import { Role, User, Account, StockProductWithDetails, StudentStock, SavingsProduct, StudentSaving, Job, TaxItemWithRecipients, StockHistory, Fund, FundStatus, FundInvestment, Donation, TransactionType } from '../types';

// Helper function to generate UUIDs
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

// Check if the current session is a guest session
export const isGuestSession = (): boolean => {
    try {
        return sessionStorage.getItem('class_bank_is_guest') === 'true' || localStorage.getItem('class_bank_is_guest') === 'true';
    } catch (e) {
        return false;
    }
};

// Get current guest user ID
export const getGuestUserId = (): string | null => {
    try {
        return sessionStorage.getItem('class_bank_user_id') || localStorage.getItem('class_bank_user_id');
    } catch (e) {
        return null;
    }
};

// Default Mock Database State
const createDefaultMockState = () => {
    const teacherId = 'guest_teacher';
    const classCode = '2026';
    const currencyUnit = '톨';
    const teacherAlias = '은하쌤';

    const teacherUser: User = {
        userId: teacherId,
        name: teacherAlias,
        role: Role.TEACHER,
        teacherAlias,
        currencyUnit,
        classCode
    };

    const students: User[] = [
        { userId: 'guest_student_1', name: '김민준', role: Role.STUDENT, grade: 5, class: 1, number: 1, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
        { userId: 'guest_student_2', name: '이서연', role: Role.STUDENT, grade: 5, class: 1, number: 2, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
        { userId: 'guest_student_3', name: '박지우', role: Role.STUDENT, grade: 5, class: 1, number: 3, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
        { userId: 'guest_student_4', name: '최도윤', role: Role.STUDENT, grade: 5, class: 1, number: 4, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
        { userId: 'guest_student_5', name: '정하윤', role: Role.STUDENT, grade: 5, class: 1, number: 5, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
        { userId: 'guest_student_6', name: '강준우', role: Role.STUDENT, grade: 5, class: 1, number: 6, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
        { userId: 'guest_student_7', name: '조아라', role: Role.STUDENT, grade: 5, class: 1, number: 7, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
        { userId: 'guest_student_8', name: '한지민', role: Role.STUDENT, grade: 5, class: 1, number: 8, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
        { userId: 'guest_student_9', name: '임현우', role: Role.STUDENT, grade: 5, class: 1, number: 9, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
        { userId: 'guest_student_10', name: '윤소희', role: Role.STUDENT, grade: 5, class: 1, number: 10, teacher_id: teacherId, teacherAlias, currencyUnit, classCode },
    ];

    const accounts: Account[] = [
        { id: 'guest_treasury_acc', accountId: 'guest_treasury_acc', userId: teacherId, balance: 450000, teacher_id: teacherId, account_type: 'treasury' },
        { id: 'guest_mart_acc', accountId: 'guest_mart_acc', userId: teacherId, balance: 120000, teacher_id: teacherId, account_type: 'mart' },
        ...students.map((s, index) => ({
            id: `guest_acc_${s.userId}`,
            accountId: `guest_acc_${s.userId}`,
            userId: s.userId,
            balance: 15000 + (index * 4500),
            teacher_id: teacherId,
            account_type: 'personal',
            qrToken: `token_${s.userId}`
        }))
    ];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    const transactions: any[] = [];
    
    // Add default initial transactions
    students.forEach((s, index) => {
        const accId = `guest_acc_${s.userId}`;
        transactions.push({
            transactionId: `tx_init_${s.userId}`,
            accountId: accId,
            type: TransactionType.SALARY,
            amount: 3000,
            date: dayBeforeYesterday.toISOString(),
            description: '6월 기본 급여 지급',
            teacher_id: teacherId
        });
        transactions.push({
            transactionId: `tx_mart_${s.userId}`,
            accountId: accId,
            type: TransactionType.MART,
            amount: 500,
            date: yesterday.toISOString(),
            description: '교실 마트 간식 구매',
            teacher_id: teacherId
        });
    });

    const jobs: Job[] = [
        { id: 'job_1', jobName: '은행원', salary: 3500, description: '오프라인 현금을 통장 잔고로 환전해주고 저축 상품 가입을 도웁니다.', teacher_id: teacherId, incentive: 0, assigned_students: [{ userId: 'guest_student_1', name: '김민준' }] },
        { id: 'job_2', jobName: '마트 판매원', salary: 3200, description: '교실 마트에서 물품을 판매하고 결제 서비스를 조작합니다.', teacher_id: teacherId, incentive: 0, assigned_students: [{ userId: 'guest_student_2', name: '이서연' }] },
        { id: 'job_3', jobName: '환경 미화원', salary: 2800, description: '교실 환기와 분리 수거를 담당하여 쾌적한 교실을 만듭니다.', teacher_id: teacherId, incentive: 100, assigned_students: [] },
        { id: 'job_4', jobName: '학급 반장', salary: 4000, description: '학급 자치 회의를 이끌고 선생님을 도와 학급 대소사를 관리합니다.', teacher_id: teacherId, incentive: 200, assigned_students: [{ userId: 'guest_student_5', name: '정하윤' }] },
        { id: 'job_5', jobName: '경제 기자', salary: 3000, description: '학급 뉴스를 발굴하고 정기적으로 시황 기사를 작성합니다.', teacher_id: teacherId, incentive: 0, assigned_students: [] },
    ];

    const stockProducts: any[] = [
        { id: 'stock_1', name: '애플 파이 (간식 제조사)', currentPrice: 150, volatility: 0.05, stockAccountId: 'guest_stock_acc_1', teacher_id: teacherId },
        { id: 'stock_2', name: '은하 우주선 (학급 교통)', currentPrice: 480, volatility: 0.08, stockAccountId: 'guest_stock_acc_2', teacher_id: teacherId },
        { id: 'stock_3', name: '모둠 칠판 (학급 서비스)', currentPrice: 80, volatility: 0.03, stockAccountId: 'guest_stock_acc_3', teacher_id: teacherId },
    ];

    const stockHistory: StockHistory[] = [];
    stockProducts.forEach(sp => {
        for (let i = 5; i >= 0; i--) {
            const hDate = new Date();
            hDate.setHours(hDate.getHours() - i * 4);
            const priceFactor = 1 + (Math.random() * 0.2 - 0.1);
            stockHistory.push({
                id: `sh_${sp.id}_${i}`,
                stockId: sp.id,
                price: Math.round(sp.currentPrice * priceFactor),
                createdAt: hDate.toISOString()
            });
        }
    });

    const studentStocks: StudentStock[] = [
        { userId: 'guest_student_1', stockId: 'stock_1', quantity: 20, purchasePrice: 140, teacher_id: teacherId },
        { userId: 'guest_student_1', stockId: 'stock_2', quantity: 5, purchasePrice: 450, teacher_id: teacherId },
        { userId: 'guest_student_2', stockId: 'stock_1', quantity: 15, purchasePrice: 145, teacher_id: teacherId },
        { userId: 'guest_student_3', stockId: 'stock_3', quantity: 50, purchasePrice: 75, teacher_id: teacherId },
        { userId: 'guest_student_4', stockId: 'stock_2', quantity: 10, purchasePrice: 490, teacher_id: teacherId },
    ];

    const savingsProducts: SavingsProduct[] = [
        { id: 'savings_1', name: '7일 행운 예금', maturityDays: 7, rate: 10, cancellationRate: 2, maxAmount: 50000, teacher_id: teacherId },
        { id: 'savings_2', name: '14일 보름달 적금', maturityDays: 14, rate: 25, cancellationRate: 5, maxAmount: 100000, teacher_id: teacherId },
    ];

    const studentSavings: StudentSaving[] = [
        { savingId: 'ss_1', userId: 'guest_student_1', productId: 'savings_1', amount: 5000, joinDate: yesterday.toISOString(), maturityDate: new Date(yesterday.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), teacher_id: teacherId, product: savingsProducts[0] },
        { savingId: 'ss_2', userId: 'guest_student_3', productId: 'savings_2', amount: 10000, joinDate: dayBeforeYesterday.toISOString(), maturityDate: new Date(dayBeforeYesterday.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), teacher_id: teacherId, product: savingsProducts[1] },
    ];

    const taxes: any[] = [
        { id: 'tax_1', name: '6월 종합소득세', amount: 300, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), teacher_id: teacherId },
        { id: 'tax_2', name: '급식실 위반 과태료', amount: 50, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), teacher_id: teacherId }
    ];

    // Some students already paid, some unpaid
    const taxPayments: any[] = [
        { userId: 'guest_student_1', taxId: 'tax_1', paid: true, paidDate: yesterday.toISOString() },
        { userId: 'guest_student_2', taxId: 'tax_1', paid: true, paidDate: yesterday.toISOString() },
        { userId: 'guest_student_3', taxId: 'tax_1', paid: false },
        { userId: 'guest_student_4', taxId: 'tax_1', paid: false },
        { userId: 'guest_student_5', taxId: 'tax_1', paid: true, paidDate: yesterday.toISOString() },
        { userId: 'guest_student_6', taxId: 'tax_1', paid: false },
        { userId: 'guest_student_7', taxId: 'tax_1', paid: false },
        { userId: 'guest_student_8', taxId: 'tax_1', paid: false },
        { userId: 'guest_student_9', taxId: 'tax_1', paid: false },
        { userId: 'guest_student_10', taxId: 'tax_1', paid: false },
        
        { userId: 'guest_student_1', taxId: 'tax_2', paid: false },
        { userId: 'guest_student_5', taxId: 'tax_2', paid: true, paidDate: yesterday.toISOString() },
    ];

    const funds: Fund[] = [
        { id: 'fund_1', name: '우리반 수학익힘책 다풀기 펀드', description: '우리 반 전원이 6월 수학익힘책 풀기 숙제를 인증하면 성공 보너스가 지급됩니다!', creatorId: 'guest_teacher', creatorName: '은하쌤', teacher_id: teacherId, unitPrice: 100, targetAmount: 50000, baseReward: 10, incentiveReward: 20, recruitmentDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), maturityDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: FundStatus.ONGOING, executionRate: 0, createdAt: dayBeforeYesterday.toISOString(), totalInvestedAmount: 32000, investorCount: 3 },
        { id: 'fund_2', name: '지각생 없는 일주일 만들기 펀드', description: '한 주 동안 우리 반에 지각생이 단 한 명도 안 나오면 투자금의 1.5배로 배당해드립니다!', creatorId: 'guest_teacher', creatorName: '은하쌤', teacher_id: teacherId, unitPrice: 500, targetAmount: 20000, baseReward: 50, incentiveReward: 100, recruitmentDeadline: dayBeforeYesterday.toISOString(), maturityDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: FundStatus.SUCCESS, executionRate: 100, createdAt: dayBeforeYesterday.toISOString(), totalInvestedAmount: 20000, investorCount: 2 },
    ];

    const fundInvestments: FundInvestment[] = [
        { id: 'fi_1', fundId: 'fund_1', studentUserId: 'guest_student_1', units: 50, investedAt: yesterday.toISOString(), fund: funds[0] },
        { id: 'fi_2', fundId: 'fund_1', studentUserId: 'guest_student_2', units: 80, investedAt: yesterday.toISOString(), fund: funds[0] },
        { id: 'fi_3', fundId: 'fund_1', studentUserId: 'guest_student_3', units: 120, investedAt: yesterday.toISOString(), fund: funds[0] },
        { id: 'fi_4', fundId: 'fund_2', studentUserId: 'guest_student_1', units: 20, investedAt: yesterday.toISOString(), fund: funds[1] },
        { id: 'fi_5', fundId: 'fund_2', studentUserId: 'guest_student_5', units: 20, investedAt: yesterday.toISOString(), fund: funds[1] },
    ];

    const donations: Donation[] = [
        { id: 'donation_1', title: '사랑의 연탄 나누기 모금함 🪵', url: 'https://naver.com', content: '추운 겨울 이웃들을 위해 은하쌤 학급이 따뜻함을 선물합니다. 기부된 톨은 사회복지기관을 통해 연탄으로 기증됩니다.', imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300', status: 'ongoing', current_amount: 12500, teacher_id: teacherId, created_at: dayBeforeYesterday.toISOString() },
        { id: 'donation_2', title: '우리 교실 새로운 보드게임 추가 구입 ♟️', url: 'https://naver.com', content: '점심시간에 함께 즐길 부루마블과 루미큐브 추가 기금 모금함입니다!', imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=300', status: 'ongoing', current_amount: 4500, teacher_id: teacherId, created_at: dayBeforeYesterday.toISOString() },
    ];

    const donationLogs: any[] = [
        { id: 'dl_1', donation_id: 'donation_1', user_id: 'guest_student_1', amount: 1500, user_name: '김민준', user_number: 1, created_at: yesterday.toISOString() },
        { id: 'dl_2', donation_id: 'donation_1', user_id: 'guest_student_2', amount: 3000, user_name: '이서연', user_number: 2, created_at: yesterday.toISOString() },
        { id: 'dl_3', donation_id: 'donation_1', user_id: 'guest_student_3', amount: 8000, user_name: '박지우', user_number: 3, created_at: yesterday.toISOString() },
        { id: 'dl_4', donation_id: 'donation_2', user_id: 'guest_student_5', amount: 4500, user_name: '정하윤', user_number: 5, created_at: yesterday.toISOString() },
    ];

    return {
        teacherUser,
        students,
        accounts,
        transactions,
        jobs,
        stockProducts,
        stockHistory,
        studentStocks,
        savingsProducts,
        studentSavings,
        taxes,
        taxPayments,
        funds,
        fundInvestments,
        donations,
        donationLogs
    };
};

// State Manager
class GuestDbManager {
    private state: any = null;

    constructor() {
        this.loadState();
    }

    private loadState() {
        try {
            const data = localStorage.getItem('class_bank_guest_db');
            if (data) {
                this.state = JSON.parse(data);
            } else {
                this.resetToDefault();
            }
        } catch (e) {
            console.error('Failed to load guest state, resetting', e);
            this.resetToDefault();
        }
    }

    private saveState() {
        try {
            localStorage.setItem('class_bank_guest_db', JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save guest state', e);
        }
    }

    public resetToDefault() {
        this.state = createDefaultMockState();
        this.saveState();
    }

    // AUTH METHODS
    public login(userId: string): User | null {
        this.loadState();
        if (userId === 'guest_teacher') {
            return this.state.teacherUser;
        }
        const student = this.state.students.find((s: any) => s.userId === userId);
        return student || null;
    }

    public loginWithPassword(classCode: string, grade: number, classNum: number, number: number, password?: string): User | null {
        this.loadState();
        if (classCode !== '2026') throw new Error('올바르지 않은 학급 코드입니다. (게스트 체험 코드는 "2026" 입니다)');
        const student = this.state.students.find((s: any) => s.grade === grade && s.class === classNum && s.number === number);
        if (!student) throw new Error('해당 정보로 등록된 학생을 찾을 수 없습니다.');
        return student;
    }

    // USER / STUDENT METHODS
    public getStudents(teacherId: string): User[] {
        this.loadState();
        return this.state.students;
    }

    public addStudent(name: string, grade: number, classNum: number, number: number, teacherId: string) {
        this.loadState();
        const userId = `guest_student_${uuidv4().substring(0, 8)}`;
        const teacherAlias = this.state.teacherUser.name;
        const currencyUnit = this.state.teacherUser.currencyUnit;
        const classCode = this.state.teacherUser.classCode;

        const newStudent: User = {
            userId,
            name,
            role: Role.STUDENT,
            grade,
            class: classNum,
            number,
            teacher_id: teacherId,
            teacherAlias,
            currencyUnit,
            classCode
        };

        this.state.students.push(newStudent);
        this.state.students.sort((a: any, b: any) => a.number - b.number);

        // Account
        const accId = `guest_acc_${userId}`;
        this.state.accounts.push({
            id: accId,
            accountId: accId,
            userId,
            balance: 1000, // Initial 1000 Tol balance
            teacher_id: teacherId,
            account_type: 'personal',
            qrToken: `token_${userId}`
        });

        this.saveState();
    }

    public updateStudent(userId: string, name: string, grade: number, classNum: number, number: number) {
        this.loadState();
        const student = this.state.students.find((s: any) => s.userId === userId);
        if (student) {
            student.name = name;
            student.grade = grade;
            student.class = classNum;
            student.number = number;
            this.state.students.sort((a: any, b: any) => a.number - b.number);
            this.saveState();
        }
    }

    public deleteStudents(userIds: string[]): string {
        this.loadState();
        this.state.students = this.state.students.filter((s: any) => !userIds.includes(s.userId));
        this.state.accounts = this.state.accounts.filter((a: any) => !userIds.includes(a.userId));
        this.saveState();
        return `${userIds.length}명의 학생을 삭제했습니다.`;
    }

    // ACCOUNT METHODS
    public getStudentAccountByUserId(userId: string): Account | null {
        this.loadState();
        const acc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        return acc || null;
    }

    public getTeacherAccount(): Account | null {
        this.loadState();
        const acc = this.state.accounts.find((a: any) => a.userId === 'guest_teacher' && a.account_type === 'treasury');
        return acc || null;
    }

    public getMartAccountByTeacherId(teacherId: string): Account | null {
        this.loadState();
        const acc = this.state.accounts.find((a: any) => a.userId === 'guest_teacher' && a.account_type === 'mart');
        return acc || null;
    }

    public getTransactionsByAccountId(accountId: string): any[] {
        this.loadState();
        return this.state.transactions
            .filter((t: any) => t.accountId === accountId)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    public getRecipientDetailsByAccountId(accountId: string): { user: User, account: Account } | null {
        this.loadState();
        const account = this.state.accounts.find((a: any) => a.accountId === accountId);
        if (!account) return null;
        const user = account.userId === 'guest_teacher' ? this.state.teacherUser : this.state.students.find((s: any) => s.userId === account.userId);
        if (!user) return null;
        return { user, account };
    }

    // BANK OPERATIONS
    public transfer(senderUserId: string, recipientAccountNumber: string, amount: number, memo?: string): string {
        this.loadState();
        const senderAcc = this.state.accounts.find((a: any) => a.userId === senderUserId && a.account_type === 'personal');
        const receiverAcc = this.state.accounts.find((a: any) => a.accountId === recipientAccountNumber);

        if (!senderAcc) throw new Error('보내는 사람의 계좌를 찾을 수 없습니다.');
        if (!receiverAcc) throw new Error('받는 사람의 계좌번호가 올바르지 않습니다.');
        if (senderAcc.balance < amount) throw new Error('송금할 잔액이 부족합니다.');

        senderAcc.balance -= amount;
        receiverAcc.balance += amount;

        const txDate = new Date().toISOString();
        const txId1 = `tx_${uuidv4().substring(0, 8)}`;
        const txId2 = `tx_${uuidv4().substring(0, 8)}`;

        const receiverUser = receiverAcc.userId === 'guest_teacher' ? this.state.teacherUser : this.state.students.find((s: any) => s.userId === receiverAcc.userId);
        const senderUser = senderAcc.userId === 'guest_teacher' ? this.state.teacherUser : this.state.students.find((s: any) => s.userId === senderAcc.userId);

        this.state.transactions.push({
            transactionId: txId1,
            accountId: senderAcc.accountId,
            type: TransactionType.TRANSFER,
            amount: amount,
            date: txDate,
            description: `${receiverUser?.name || '알 수 없음'}에게 송금${memo ? ` (${memo})` : ''}`,
            teacher_id: 'guest_teacher'
        });

        this.state.transactions.push({
            transactionId: txId2,
            accountId: receiverAcc.accountId,
            type: TransactionType.TRANSFER,
            amount: amount,
            date: txDate,
            description: `${senderUser?.name || '알 수 없음'}으로부터 송금${memo ? ` (${memo})` : ''}`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '송금이 완료되었습니다.';
    }

    public studentWithdraw(userId: string, amount: number, target: 'mart' | 'teacher'): { message: string } {
        this.loadState();
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        const targetAcc = target === 'mart' ? this.getMartAccountByTeacherId('guest_teacher') : this.getTeacherAccount();

        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!targetAcc) throw new Error('대상 계좌를 찾을 수 없습니다.');
        if (studentAcc.balance < amount) throw new Error('계좌 잔액이 부족합니다.');

        studentAcc.balance -= amount;
        targetAcc.balance += amount;

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.WITHDRAWAL,
            amount: amount,
            date: txDate,
            description: `${target === 'mart' ? '마트' : '은행'} 출금 요청`,
            teacher_id: 'guest_teacher'
        });

        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: targetAcc.accountId,
            type: TransactionType.DEPOSIT,
            amount: amount,
            date: txDate,
            description: `${studentAcc.userId === 'guest_teacher' ? '교사' : this.state.students.find((s: any) => s.userId === userId)?.name || '학생'} 출금 수취`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return { message: '출금 완료' };
    }

    public bankerDeposit(userId: string, amount: number): { message: string } {
        this.loadState();
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        const treasuryAcc = this.getTeacherAccount();

        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!treasuryAcc) throw new Error('국고 계좌를 찾을 수 없습니다.');
        if (treasuryAcc.balance < amount) throw new Error('국고 잔액이 부족합니다.');

        treasuryAcc.balance -= amount;
        studentAcc.balance += amount;

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.DEPOSIT,
            amount: amount,
            date: txDate,
            description: '은행원 입금 처리 (현금 입금)',
            teacher_id: 'guest_teacher'
        });

        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: treasuryAcc.accountId,
            type: TransactionType.WITHDRAWAL,
            amount: amount,
            date: txDate,
            description: `${this.state.students.find((s: any) => s.userId === userId)?.name || '학생'} 현금 입금 대행`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return { message: '현금 입금이 완료되었습니다.' };
    }

    public bankerWithdraw(userId: string, amount: number): { message: string } {
        this.loadState();
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        const treasuryAcc = this.getTeacherAccount();

        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!treasuryAcc) throw new Error('국고 계좌를 찾을 수 없습니다.');
        if (studentAcc.balance < amount) throw new Error('학생 계좌의 잔액이 부족합니다.');

        studentAcc.balance -= amount;
        treasuryAcc.balance += amount;

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.WITHDRAWAL,
            amount: amount,
            date: txDate,
            description: '은행원 출금 처리 (현금 출금)',
            teacher_id: 'guest_teacher'
        });

        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: treasuryAcc.accountId,
            type: TransactionType.DEPOSIT,
            amount: amount,
            date: txDate,
            description: `${this.state.students.find((s: any) => s.userId === userId)?.name || '학생'} 현금 출금 대행`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return { message: '현금 출금이 완료되었습니다.' };
    }

    public martTransfer(studentAccountId: string, amount: number, direction: 'TO_STUDENT' | 'FROM_STUDENT'): string {
        this.loadState();
        const studentAcc = this.state.accounts.find((a: any) => a.accountId === studentAccountId);
        const martAcc = this.getMartAccountByTeacherId('guest_teacher');

        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!martAcc) throw new Error('마트 계좌를 찾을 수 없습니다.');

        if (direction === 'FROM_STUDENT') {
            if (studentAcc.balance < amount) throw new Error('학생 계좌의 잔액이 부족합니다.');
            studentAcc.balance -= amount;
            martAcc.balance += amount;
        } else {
            if (martAcc.balance < amount) throw new Error('마트 잔액이 부족합니다.');
            martAcc.balance -= amount;
            studentAcc.balance += amount;
        }

        const txDate = new Date().toISOString();
        const studentName = this.state.students.find((s: any) => s.userId === studentAcc.userId)?.name || '학생';

        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.MART,
            amount: amount,
            date: txDate,
            description: direction === 'FROM_STUDENT' ? '교실 마트 물품 결제' : '교실 마트 환불 수취',
            teacher_id: 'guest_teacher'
        });

        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: martAcc.accountId,
            type: TransactionType.MART,
            amount: amount,
            date: txDate,
            description: direction === 'FROM_STUDENT' ? `${studentName} 물품 판매 수납` : `${studentName} 판매 환불 지급`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '거래가 성공적으로 완료되었습니다.';
    }

    // STOCKS OPERATIONS
    public getStockProducts(teacherId: string): StockProductWithDetails[] {
        this.loadState();
        return this.state.stockProducts.map((sp: any) => {
            const totalQty = this.state.studentStocks
                .filter((ss: any) => ss.stockId === sp.id)
                .reduce((sum: number, ss: any) => sum + ss.quantity, 0);
            return {
                ...sp,
                totalQuantity: totalQty,
                valuation: totalQty * sp.currentPrice
            };
        });
    }

    public getStudentStocks(userId: string): StudentStock[] {
        this.loadState();
        return this.state.studentStocks
            .filter((ss: any) => ss.userId === userId)
            .map((ss: any) => {
                const stock = this.state.stockProducts.find((p: any) => p.id === ss.stockId);
                return { ...ss, stock };
            });
    }

    public getStockHistory(stockId: string): StockHistory[] {
        this.loadState();
        return this.state.stockHistory
            .filter((sh: any) => sh.stockId === stockId)
            .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    public buyStock(userId: string, stockId: string, quantity: number): string {
        this.loadState();
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        const stock = this.state.stockProducts.find((p: any) => p.id === stockId);

        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!stock) throw new Error('해당 주식 상품이 존재하지 않습니다.');

        const cost = stock.currentPrice * quantity;
        if (studentAcc.balance < cost) throw new Error('주식을 매수하기 위한 현금이 부족합니다.');

        studentAcc.balance -= cost;

        // Add or update holding
        let holding = this.state.studentStocks.find((ss: any) => ss.userId === userId && ss.stockId === stockId);
        if (holding) {
            const currentTotalValue = holding.quantity * holding.purchasePrice;
            holding.quantity += quantity;
            holding.purchasePrice = Math.round((currentTotalValue + cost) / holding.quantity);
        } else {
            this.state.studentStocks.push({
                userId,
                stockId,
                quantity,
                purchasePrice: stock.currentPrice,
                teacher_id: 'guest_teacher'
            });
        }

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.STOCK_BUY,
            amount: cost,
            date: txDate,
            description: `주식 매수: ${stock.name} ${quantity}주`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '주식을 성공적으로 구매했습니다.';
    }

    public sellStock(userId: string, stockId: string, quantity: number): string {
        this.loadState();
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        const stock = this.state.stockProducts.find((p: any) => p.id === stockId);
        const holding = this.state.studentStocks.find((ss: any) => ss.userId === userId && ss.stockId === stockId);

        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!stock) throw new Error('해당 주식 상품이 존재하지 않습니다.');
        if (!holding || holding.quantity < quantity) throw new Error('매도하려는 주식 수량이 보유 수량보다 많습니다.');

        const revenue = stock.currentPrice * quantity;
        studentAcc.balance += revenue;
        holding.quantity -= quantity;

        if (holding.quantity === 0) {
            this.state.studentStocks = this.state.studentStocks.filter((ss: any) => !(ss.userId === userId && ss.stockId === stockId));
        }

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.STOCK_SELL,
            amount: revenue,
            date: txDate,
            description: `주식 매도: ${stock.name} ${quantity}주`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '주식을 성공적으로 판매했습니다.';
    }

    public addStockProduct(name: string, currentPrice: number, teacherId: string) {
        this.loadState();
        const id = `stock_${uuidv4().substring(0, 8)}`;
        const newProduct = {
            id,
            name,
            currentPrice,
            volatility: 0.05,
            stockAccountId: `guest_stock_acc_${id}`,
            teacher_id: teacherId
        };
        this.state.stockProducts.push(newProduct);
        this.state.stockHistory.push({
            id: `sh_init_${id}`,
            stockId: id,
            price: currentPrice,
            createdAt: new Date().toISOString()
        });
        this.saveState();
    }

    public updateStockPrice(stockId: string, price: number) {
        this.loadState();
        const stock = this.state.stockProducts.find((p: any) => p.id === stockId);
        if (stock) {
            stock.currentPrice = price;
            this.state.stockHistory.push({
                id: `sh_${uuidv4().substring(0, 8)}`,
                stockId,
                price,
                createdAt: new Date().toISOString()
            });
            this.saveState();
        }
    }

    public updateStockVolatility(stockId: string, volatility: number) {
        this.loadState();
        const stock = this.state.stockProducts.find((p: any) => p.id === stockId);
        if (stock) {
            stock.volatility = volatility;
            this.saveState();
        }
    }

    public deleteStockProducts(ids: string[]) {
        this.loadState();
        this.state.stockProducts = this.state.stockProducts.filter((p: any) => !ids.includes(p.id));
        this.state.studentStocks = this.state.studentStocks.filter((ss: any) => !ids.includes(ss.stockId));
        this.state.stockHistory = this.state.stockHistory.filter((sh: any) => !ids.includes(sh.stockId));
        this.saveState();
    }

    public getStockHolders(stockId: string): any[] {
        this.loadState();
        return this.state.studentStocks
            .filter((ss: any) => ss.stockId === stockId)
            .map((ss: any) => {
                const s = this.state.students.find((std: any) => std.userId === ss.userId);
                return {
                    userId: ss.userId,
                    studentName: s?.name || '가상학생',
                    grade: s?.grade || 5,
                    class: s?.class || 1,
                    number: s?.number || 0,
                    quantity: ss.quantity,
                    purchasePrice: ss.purchasePrice
                };
            });
    }

    // SAVINGS OPERATIONS
    public getSavingsProducts(teacherId: string): SavingsProduct[] {
        this.loadState();
        return this.state.savingsProducts;
    }

    public getStudentSavings(userId: string): StudentSaving[] {
        this.loadState();
        return this.state.studentSavings
            .filter((ss: any) => ss.userId === userId)
            .map((ss: any) => {
                const product = this.state.savingsProducts.find((p: any) => p.id === ss.productId);
                return { ...ss, product };
            });
    }

    public joinSavings(userId: string, productId: string, amount: number): string {
        this.loadState();
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        const prod = this.state.savingsProducts.find((p: any) => p.id === productId);

        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!prod) throw new Error('해당 예금 상품이 존재하지 않습니다.');
        if (studentAcc.balance < amount) throw new Error('예적금 가입 금액이 부족합니다.');

        studentAcc.balance -= amount;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + prod.durationDays * 24 * 60 * 60 * 1000);

        this.state.studentSavings.push({
            id: `ss_${uuidv4().substring(0, 8)}`,
            userId,
            productId,
            amount,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: 'active',
            teacher_id: 'guest_teacher'
        });

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.SAVINGS_JOIN,
            amount: amount,
            date: txDate,
            description: `정기 예적금 가입: ${prod.name}`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '예금 가입이 처리되었습니다.';
    }

    public cancelSavings(savingId: string): string {
        this.loadState();
        const saving = this.state.studentSavings.find((ss: any) => ss.id === savingId);
        if (!saving) throw new Error('해당 예금 계좌를 찾을 수 없습니다.');

        const studentAcc = this.state.accounts.find((a: any) => a.userId === saving.userId && a.account_type === 'personal');
        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');

        studentAcc.balance += saving.amount;
        saving.status = 'cancelled';
        this.state.studentSavings = this.state.studentSavings.filter((ss: any) => ss.id !== savingId);

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.SAVINGS_CANCEL,
            amount: saving.amount,
            date: txDate,
            description: `예적금 중도 해지 (원금 반환)`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '예금이 중도 해지되었습니다.';
    }

    public processSavingsMaturity(savingId: string): string {
        this.loadState();
        const saving = this.state.studentSavings.find((ss: any) => ss.id === savingId);
        if (!saving) throw new Error('해당 예금 계좌를 찾을 수 없습니다.');

        const prod = this.state.savingsProducts.find((p: any) => p.id === saving.productId);
        if (!prod) throw new Error('예금 상품 정보를 찾을 수 없습니다.');

        const studentAcc = this.state.accounts.find((a: any) => a.userId === saving.userId && a.account_type === 'personal');
        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');

        const interest = Math.round(saving.amount * (prod.interestRate / 100));
        const total = saving.amount + interest;

        studentAcc.balance += total;
        saving.status = 'matured';
        this.state.studentSavings = this.state.studentSavings.filter((ss: any) => ss.id !== savingId);

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.SAVINGS_MATURITY,
            amount: total,
            date: txDate,
            description: `예적금 만기 수취 (${prod.name}, 이자: +${interest} 톨)`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '예금 만기 처리가 성공적으로 완료되었습니다!';
    }

    public addSavingsProduct(name: string, durationDays: number, interestRate: number, description: string, teacherId: string) {
        this.loadState();
        this.state.savingsProducts.push({
            id: `savings_${uuidv4().substring(0, 8)}`,
            name,
            durationDays,
            interestRate,
            description,
            teacher_id: teacherId
        });
        this.saveState();
    }

    public deleteSavingsProducts(ids: string[]) {
        this.loadState();
        this.state.savingsProducts = this.state.savingsProducts.filter((p: any) => !ids.includes(p.id));
        this.state.studentSavings = this.state.studentSavings.filter((ss: any) => !ids.includes(ss.productId));
        this.saveState();
    }

    public getSavingsEnrollees(productId: string): any[] {
        this.loadState();
        return this.state.studentSavings
            .filter((ss: any) => ss.productId === productId)
            .map((ss: any) => {
                const s = this.state.students.find((std: any) => std.userId === ss.userId);
                return {
                    id: ss.id,
                    studentName: s?.name || '가상학생',
                    grade: s?.grade || 5,
                    class: s?.class || 1,
                    number: s?.number || 0,
                    amount: ss.amount,
                    startDate: ss.startDate,
                    endDate: ss.endDate,
                    status: ss.status
                };
            });
    }

    // JOB OPERATIONS
    public getJobs(teacherId: string): Job[] {
        this.loadState();
        return this.state.jobs;
    }

    public addJob(name: string, salary: number, count: number, description: string, teacherId: string) {
        this.loadState();
        this.state.jobs.push({
            id: `job_${uuidv4().substring(0, 8)}`,
            name,
            salary,
            count,
            currentCount: 0,
            description,
            teacher_id: teacherId,
            incentive: 0
        });
        this.saveState();
    }

    public updateJob(jobId: string, name: string, salary: number, count: number, description: string) {
        this.loadState();
        const job = this.state.jobs.find((j: any) => j.id === jobId);
        if (job) {
            job.name = name;
            job.salary = salary;
            job.count = count;
            job.description = description;
            this.saveState();
        }
    }

    public deleteJob(jobId: string) {
        this.loadState();
        this.state.jobs = this.state.jobs.filter((j: any) => j.id !== jobId);
        this.saveState();
    }

    public manageJobAssignment(jobId: string, userIds: string[]) {
        // Mock simple assignment
        this.loadState();
        const job = this.state.jobs.find((j: any) => j.id === jobId);
        if (job) {
            job.currentCount = userIds.length;
            this.saveState();
        }
    }

    public updateJobIncentive(jobId: string, incentive: number) {
        this.loadState();
        const job = this.state.jobs.find((j: any) => j.id === jobId);
        if (job) {
            job.incentive = incentive;
            this.saveState();
        }
    }

    public payJobSalary(jobId: string, userId: string, amount: number, memo?: string): string {
        this.loadState();
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        const treasuryAcc = this.getTeacherAccount();

        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!treasuryAcc) throw new Error('국고 계좌를 찾을 수 없습니다.');
        if (treasuryAcc.balance < amount) throw new Error('국고 잔액이 부족하여 급여를 지급할 수 없습니다.');

        treasuryAcc.balance -= amount;
        studentAcc.balance += amount;

        const txDate = new Date().toISOString();
        const job = this.state.jobs.find((j: any) => j.id === jobId);

        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.SALARY,
            amount: amount,
            date: txDate,
            description: memo || `${job?.name || '직업'} 급여 및 보너스 지급`,
            teacher_id: 'guest_teacher'
        });

        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: treasuryAcc.accountId,
            type: TransactionType.WITHDRAWAL,
            amount: amount,
            date: txDate,
            description: `${this.state.students.find((s: any) => s.userId === userId)?.name || '학생'} 급여 지급`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '급여가 성공적으로 지급되었습니다.';
    }

    public payAllSalaries(assignments: any[]): string {
        this.loadState();
        let payCount = 0;
        assignments.forEach(assign => {
            try {
                this.payJobSalary(assign.jobId, assign.userId, assign.amount, assign.memo);
                payCount++;
            } catch (e) {}
        });
        return `${payCount}명의 학생들에게 일괄 급여가 지급되었습니다.`;
    }

    // TAX OPERATIONS
    public getTaxes(teacherId: string): TaxItemWithRecipients[] {
        this.loadState();
        return this.state.taxes.map((t: any) => {
            const payments = this.state.taxPayments
                .filter((tp: any) => tp.taxId === t.id)
                .map((tp: any) => {
                    const s = this.state.students.find((std: any) => std.userId === tp.userId);
                    return {
                        userId: tp.userId,
                        studentName: s?.name || '가상학생',
                        grade: s?.grade || 5,
                        class: s?.class || 1,
                        number: s?.number || 0,
                        paid: tp.paid,
                        paidDate: tp.paidDate || null
                    };
                });
            return {
                ...t,
                recipients: payments
            };
        });
    }

    public createTax(name: string, amount: number, dueDate: string, teacherId: string) {
        this.loadState();
        const taxId = `tax_${uuidv4().substring(0, 8)}`;
        this.state.taxes.push({
            id: taxId,
            name,
            amount,
            dueDate,
            teacher_id: teacherId
        });
        this.state.students.forEach((s: any) => {
            this.state.taxPayments.push({
                userId: s.userId,
                taxId,
                paid: false
            });
        });
        this.saveState();
    }

    public deleteTax(taxId: string) {
        this.loadState();
        this.state.taxes = this.state.taxes.filter((t: any) => t.id !== taxId);
        this.state.taxPayments = this.state.taxPayments.filter((tp: any) => tp.taxId !== taxId);
        this.saveState();
    }

    public getMyUnpaidTaxes(userId: string): any[] {
        this.loadState();
        const unpaidPayments = this.state.taxPayments.filter((tp: any) => tp.userId === userId && !tp.paid);
        return unpaidPayments.map((tp: any) => {
            const tax = this.state.taxes.find((t: any) => t.id === tp.taxId);
            return {
                recipientId: `${userId}_${tp.taxId}`,
                taxId: tp.taxId,
                name: tax?.name || '세금 고지',
                amount: tax?.amount || 0,
                dueDate: tax?.dueDate || new Date().toISOString()
            };
        });
    }

    public payTax(userId: string, taxId: string): string {
        this.loadState();
        const payment = this.state.taxPayments.find((tp: any) => tp.userId === userId && tp.taxId === taxId);
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        const tax = this.state.taxes.find((t: any) => t.id === taxId);
        const treasuryAcc = this.getTeacherAccount();

        if (!payment) throw new Error('해당 세금 고지서를 찾을 수 없습니다.');
        if (payment.paid) throw new Error('이미 납부한 세금입니다.');
        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!tax) throw new Error('세금 상품 정보를 찾을 수 없습니다.');
        if (!treasuryAcc) throw new Error('국고 계좌를 찾을 수 없습니다.');

        if (studentAcc.balance < tax.amount) throw new Error('세금을 납부하기 위한 계좌 잔액이 부족합니다.');

        studentAcc.balance -= tax.amount;
        treasuryAcc.balance += tax.amount;
        payment.paid = true;
        payment.paidDate = new Date().toISOString();

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.TAX,
            amount: tax.amount,
            date: txDate,
            description: `세금 납부: ${tax.name}`,
            teacher_id: 'guest_teacher'
        });

        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: treasuryAcc.accountId,
            type: TransactionType.DEPOSIT,
            amount: tax.amount,
            date: txDate,
            description: `${this.state.students.find((s: any) => s.userId === userId)?.name || '학생'} 세금 수납 (${tax.name})`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return `${tax.name} 세금 납부가 정상적으로 완료되었습니다.`;
    }

    // FUND OPERATIONS
    public getFunds(teacherId: string): Fund[] {
        this.loadState();
        return this.state.funds;
    }

    public createFund(name: string, description: string, targetAmount: number, profitRate: number, teacherId: string) {
        this.loadState();
        this.state.funds.push({
            id: `fund_${uuidv4().substring(0, 8)}`,
            name,
            description,
            creatorId: 'guest_teacher',
            creatorName: '은하쌤',
            teacher_id: teacherId,
            unitPrice: 100,
            targetAmount,
            baseReward: 10,
            incentiveReward: profitRate,
            recruitmentDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            maturityDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            status: FundStatus.ONGOING,
            createdAt: new Date().toISOString(),
            totalInvestedAmount: 0,
            investorCount: 0
        });
        this.saveState();
    }

    public deleteFund(fundId: string) {
        this.loadState();
        this.state.funds = this.state.funds.filter((f: any) => f.id !== fundId);
        this.state.fundInvestments = this.state.fundInvestments.filter((fi: any) => fi.fundId !== fundId);
        this.saveState();
    }

    public joinFund(userId: string, fundId: string, amount: number): string {
        this.loadState();
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');
        const fund = this.state.funds.find((f: any) => f.id === fundId);

        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (!fund) throw new Error('펀드 상품 정보를 찾을 수 없습니다.');
        if (fund.status !== FundStatus.ONGOING) throw new Error('현재 모집 중인 펀드가 아닙니다.');
        if (studentAcc.balance < amount) throw new Error('펀드 투자금을 위한 계좌 잔액이 부족합니다.');

        const unitPrice = fund.unitPrice || 100;
        const units = amount / unitPrice;

        studentAcc.balance -= amount;
        fund.totalInvestedAmount = (fund.totalInvestedAmount || 0) + amount;
        fund.investorCount = (fund.investorCount || 0) + 1;

        this.state.fundInvestments.push({
            id: `fi_${uuidv4().substring(0, 8)}`,
            fundId,
            studentUserId: userId,
            units,
            investedAt: new Date().toISOString()
        });

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.FUND_JOIN,
            amount,
            date: txDate,
            description: `크라우드 펀드 가입: ${fund.name}`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '성공적으로 펀드에 투자되었습니다.';
    }

    public settleFund(fundId: string, status: 'success' | 'failure'): string {
        this.loadState();
        const fund = this.state.funds.find((f: any) => f.id === fundId);
        if (!fund) throw new Error('펀드 정보를 찾을 수 없습니다.');

        fund.status = status === 'success' ? FundStatus.SUCCESS : FundStatus.FAIL;

        const investments = this.state.fundInvestments.filter((fi: any) => fi.fundId === fundId);
        const treasuryAcc = this.getTeacherAccount();

        investments.forEach(inv => {
            const studentAcc = this.state.accounts.find((a: any) => a.userId === (inv.studentUserId || inv.userId) && a.account_type === 'personal');
            if (studentAcc) {
                let payout = 0;
                let description = '';
                const investmentAmount = inv.units ? (inv.units * (fund.unitPrice || 100)) : (inv.amount || 0);
                if (status === 'success') {
                    // Returns principle + interest from treasury
                    const profit = Math.round(investmentAmount * ((fund.incentiveReward || fund.profitRate || 20) / 100));
                    payout = investmentAmount + profit;
                    description = `크라우드 펀드 성공 배당 (${fund.name || fund.title}, 이자: +${profit} 톨)`;
                    if (treasuryAcc) treasuryAcc.balance -= profit; // Interest comes from treasury
                } else {
                    // Failure: Returns 50% principle
                    payout = Math.round(investmentAmount * 0.5);
                    description = `크라우드 펀드 미달성 정산 (원금 50% 반환: ${fund.name || fund.title})`;
                }

                studentAcc.balance += payout;

                const txDate = new Date().toISOString();
                this.state.transactions.push({
                    transactionId: `tx_${uuidv4().substring(0, 8)}`,
                    accountId: studentAcc.accountId,
                    type: TransactionType.FUND_PAYOUT,
                    amount: payout,
                    date: txDate,
                    description,
                    teacher_id: 'guest_teacher'
                });
            }
        });

        this.saveState();
        return `펀드가 ${status === 'success' ? '성공' : '실패'}로 정상 정산되었습니다.`;
    }

    public getMyFundInvestments(userId: string): FundInvestment[] {
        this.loadState();
        return this.state.fundInvestments
            .filter((fi: any) => (fi.studentUserId || fi.userId) === userId)
            .map((fi: any) => {
                const fund = this.state.funds.find((f: any) => f.id === fi.fundId);
                return {
                    id: fi.id,
                    fundId: fi.fundId,
                    studentUserId: fi.studentUserId || fi.userId || userId,
                    units: fi.units || ((fi.amount || 0) / (fund?.unitPrice || 100)),
                    investedAt: fi.investedAt || fi.created_at || new Date().toISOString(),
                    fund
                };
            });
    }

    public getFundInvestors(fundId: string): any[] {
        this.loadState();
        return this.state.fundInvestments
            .filter((fi: any) => fi.fundId === fundId)
            .map((fi: any) => {
                const s = this.state.students.find((std: any) => std.userId === (fi.studentUserId || fi.userId));
                const fund = this.state.funds.find((f: any) => f.id === fi.fundId);
                const investmentAmount = fi.units ? (fi.units * (fund?.unitPrice || 100)) : (fi.amount || 0);
                return {
                    id: fi.id,
                    studentName: s?.name || '가상학생',
                    grade: s?.grade || 5,
                    class: s?.class || 1,
                    number: s?.number || 0,
                    amount: investmentAmount
                };
            });
    }

    // DONATIONS
    public getDonations(teacherId: string): Donation[] {
        this.loadState();
        return this.state.donations;
    }

    public createDonation(title: string, url: string, content: string, imageUrl: string, targetAmount: number, teacherId: string) {
        this.loadState();
        this.state.donations.push({
            id: `donation_${uuidv4().substring(0, 8)}`,
            title,
            url,
            content,
            image_url: imageUrl,
            status: 'open',
            collected_amount: 0,
            target_amount: targetAmount,
            teacher_id: teacherId
        });
        this.saveState();
    }

    public closeDonation(donationId: string) {
        this.loadState();
        const don = this.state.donations.find((d: any) => d.id === donationId);
        if (don) {
            don.status = 'closed';
            this.saveState();
        }
    }

    public donate(userId: string, donationId: string, amount: number, units: number = 1) {
        this.loadState();
        const don = this.state.donations.find((d: any) => d.id === donationId);
        const studentAcc = this.state.accounts.find((a: any) => a.userId === userId && a.account_type === 'personal');

        if (!don) throw new Error('기부 모금함을 찾을 수 없습니다.');
        if (!studentAcc) throw new Error('학생 계좌를 찾을 수 없습니다.');
        if (studentAcc.balance < amount) throw new Error('기부하기 위한 계좌 잔액이 부족합니다.');

        studentAcc.balance -= amount;
        don.collected_amount = (don.collected_amount || 0) + amount;

        const s = this.state.students.find((std: any) => std.userId === userId);

        this.state.donationLogs.push({
            id: `dl_${uuidv4().substring(0, 8)}`,
            donation_id: donationId,
            user_id: userId,
            amount: amount,
            user_name: s?.name || '가상학생',
            user_number: s?.number || 0,
            created_at: new Date().toISOString()
        });

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: studentAcc.accountId,
            type: TransactionType.DONATION,
            amount: amount,
            date: txDate,
            description: `기부 모금함 기부: ${don.title}`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
    }

    public updateDonation(donationId: string, title: string, url: string, content: string, imageUrl: string) {
        this.loadState();
        const don = this.state.donations.find((d: any) => d.id === donationId);
        if (don) {
            don.title = title;
            don.url = url;
            don.content = content;
            don.image_url = imageUrl;
            this.saveState();
        }
    }

    public getDonationLogs(donationId: string): any[] {
        this.loadState();
        return this.state.donationLogs
            .filter((dl: any) => dl.donation_id === donationId)
            .map((dl: any) => ({
                id: dl.id,
                donationId: dl.donation_id,
                userId: dl.user_id,
                amount: dl.amount,
                createdAt: dl.created_at,
                user: {
                    name: dl.user_name,
                    number: dl.user_number
                }
            }));
    }

    public deleteDonation(donationId: string) {
        this.loadState();
        this.state.donations = this.state.donations.filter((d: any) => d.id !== donationId);
        this.state.donationLogs = this.state.donationLogs.filter((dl: any) => dl.donation_id !== donationId);
        this.saveState();
    }

    // TREASURY / ISSUING CURRENCY
    public issueCurrency(amount: number): string {
        this.loadState();
        const treasuryAcc = this.getTeacherAccount();
        if (!treasuryAcc) throw new Error('국고 계좌를 찾을 수 없습니다.');
        treasuryAcc.balance += amount;

        const txDate = new Date().toISOString();
        this.state.transactions.push({
            transactionId: `tx_${uuidv4().substring(0, 8)}`,
            accountId: treasuryAcc.accountId,
            type: TransactionType.DEPOSIT,
            amount: amount,
            date: txDate,
            description: `화폐 신규 발행 (+${amount} 톨 국고 적립)`,
            teacher_id: 'guest_teacher'
        });

        this.saveState();
        return '성공적으로 국고 화폐를 추가 발행했습니다.';
    }

    public getDailyTreasuryTotals(teacherId: string): any[] {
        this.loadState();
        // Return 7 days of stable stats for premium chart
        const totals = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            totals.push({
                date: d.toLocaleDateString(),
                balance: 450000 + i * 5000
            });
        }
        return totals;
    }
}

export const guestDb = new GuestDbManager();
