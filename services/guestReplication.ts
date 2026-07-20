import { supabase } from './supabaseClient';
import { Role, User } from '../types';

const MASTER_TEACHER_USER_ID = 'd6172c07-26f3-439f-9b00-d8e60700b8c5';
const MASTER_TEACHER_ID = 'd6172c07-26f3-439f-9b00-d8e60700b8c5';

// Deletes guest data older than 2 hours to keep Supabase clean (not strictly needed now, but kept for compatibility)
export const cleanupExpiredGuests = async (): Promise<void> => {
    // Left as a no-op since we use a shared guest account now
    return;
};

export const replicateMasterData = async (role: 'teacher' | 'student'): Promise<User> => {
    // 1. Fetch master teacher data directly from Supabase
    const { data: teachers, error: teacherErr } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', MASTER_TEACHER_ID);

    if (teacherErr || !teachers || teachers.length === 0) {
        throw new Error('마스터 선생님 데이터를 데이터베이스에서 찾을 수 없습니다.');
    }
    const teacherObj = teachers[0];

    // 2. Fetch master user data (including teacher user and students)
    const { data: users, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('teacher_id', MASTER_TEACHER_ID);

    if (userErr || !users || users.length === 0) {
        throw new Error('마스터 사용자 데이터를 찾을 수 없습니다.');
    }

    if (role === 'teacher') {
        const teacherUserObj = users.find(u => u.role === 'teacher') || users[0];
        return {
            userId: teacherUserObj.userId || teacherUserObj.user_id || MASTER_TEACHER_USER_ID,
            name: teacherUserObj.name || '은하쌤 (체험)',
            role: Role.TEACHER,
            teacherAlias: teacherUserObj.teacherAlias || teacherUserObj.teacher_alias || teacherUserObj.name || '은하쌤 (체험)',
            currencyUnit: teacherObj.currencyUnit || teacherObj.currency_unit || '톨',
            classCode: teacherObj.classCode || teacherObj.class_code || '1111',
        };
    } else {
        // Log in as student "김민준"
        const studentUserObj = users.find(u => u.name === '김민준' && u.role === 'student') || users.find(u => u.role === 'student');
        if (!studentUserObj) throw new Error('마스터 학생 사용자를 찾을 수 없습니다.');
        return {
            userId: studentUserObj.userId || studentUserObj.user_id,
            name: studentUserObj.name,
            role: Role.STUDENT,
            grade: studentUserObj.grade,
            class: studentUserObj.class,
            number: studentUserObj.number,
            teacher_id: MASTER_TEACHER_ID,
            teacherAlias: studentUserObj.teacherAlias || studentUserObj.teacher_alias || '은하쌤',
            currencyUnit: teacherObj.currencyUnit || teacherObj.currency_unit || '톨',
            classCode: teacherObj.classCode || teacherObj.class_code || '1111',
        };
    }
};
