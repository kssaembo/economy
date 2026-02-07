-- [필독] 이 스크립트를 Supabase SQL Editor에서 실행하세요.
-- 모든 계정의 비밀번호를 안전한 해시(bcrypt) 방식으로 변환하고 향후 가입/로그인 시 이를 적용합니다.

-- 0. pgcrypto 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 기존 평문 비밀번호 마이그레이션
-- 이미 해싱된($2a$로 시작하는 bcrypt) 비밀번호는 제외하고 현재 저장된 비밀번호를 암호화합니다.
UPDATE public.teachers 
SET password = crypt(password, gen_salt('bf')) 
WHERE password IS NOT NULL AND password NOT LIKE '$2a$%';

UPDATE public.users 
SET password = crypt(password, gen_salt('bf')) 
WHERE role = 'student' AND password IS NOT NULL AND password NOT LIKE '$2a$%';

-- 2. 선생님 회원가입 함수 수정 (비밀번호 해싱 적용)
CREATE OR REPLACE FUNCTION public.signup_teacher(
    p_login_id text,
    p_password text,
    p_alias text,
    p_currency_unit text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := gen_random_uuid();
    v_recovery_code text := upper(substring(md5(random()::text), 1, 8));
BEGIN
    -- [검증] 이메일 중복 체크
    IF EXISTS (SELECT 1 FROM public.teachers WHERE login_id = p_login_id) THEN
        RAISE EXCEPTION '이미 가입된 이메일 계정입니다.';
    END IF;

    -- [Step 1] teachers 테이블 (해싱된 비밀번호 저장)
    INSERT INTO public.teachers (
        id, 
        login_id, 
        password, 
        "teacherAlias", 
        "currencyUnit", 
        recovery_code
    )
    VALUES (
        v_user_id, 
        p_login_id, 
        crypt(p_password, gen_salt('bf')), -- 비밀번호 해싱
        p_alias, 
        p_currency_unit, 
        v_recovery_code
    );

    -- [Step 2] users 테이블
    INSERT INTO public.users (
        "userId", 
        name, 
        role, 
        teacher_id
    )
    VALUES (
        v_user_id::text, 
        p_alias, 
        'teacher', 
        v_user_id
    );

    -- [Step 3] accounts 테이블 (국고/마트 계좌)
    INSERT INTO public.accounts ("userId", "accountId", balance, teacher_id, "qrToken", account_type)
    VALUES (v_user_id::text, p_alias || ' 국고계좌', 0, v_user_id, encode(gen_random_bytes(16), 'hex'), 'treasury');

    INSERT INTO public.accounts ("userId", "accountId", balance, teacher_id, "qrToken", account_type)
    VALUES (v_user_id::text, p_alias || ' 마트계좌', 0, v_user_id, encode(gen_random_bytes(16), 'hex'), 'mart');

    RETURN json_build_object('success', true, 'recoveryCode', v_recovery_code);
END;
$$;

-- 3. 선생님 로그인 함수 수정 (해시 검증 적용)
CREATE OR REPLACE FUNCTION public.login_teacher(
    p_login_id text,
    p_password text
)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.*
    FROM public.users u
    JOIN public.teachers t ON u."userId" = t.id::text
    WHERE t.login_id = p_login_id 
    AND t.password = crypt(p_password, t.password); -- 해시 비교 검증
END;
$$;

-- 4. 학생 추가 함수 수정 (초기 비밀번호 '1234' 해싱 저장)
CREATE OR REPLACE FUNCTION public.add_student(
    p_user_id uuid,
    p_name text,
    p_grade integer,
    p_class integer,
    p_number integer,
    p_teacher_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (
        "userId", 
        name, 
        role, 
        grade, 
        class, 
        number, 
        teacher_id,
        password
    )
    VALUES (
        p_user_id, 
        p_name, 
        'student', 
        p_grade, 
        p_class, 
        p_number, 
        p_teacher_id,
        crypt('1234', gen_salt('bf')) -- 초기 비번 1234를 해시로 저장
    );

    INSERT INTO public.accounts (
        "userId", 
        "accountId", 
        balance, 
        teacher_id, 
        "qrToken"
    )
    VALUES (
        p_user_id::text, 
        '권쌤은행 ' || p_grade || '-' || p_class || ' ' || p_number, 
        0, 
        p_teacher_id, 
        encode(gen_random_bytes(16), 'hex')
    );
END;
$$;

-- 5. 학생 패스워드 로그인 함수 수정 (해시 검증)
CREATE OR REPLACE FUNCTION public.login_with_password(
    p_grade integer,
    p_class integer,
    p_number integer,
    p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user public.users;
BEGIN
    SELECT * INTO v_user FROM public.users 
    WHERE grade = p_grade AND class = p_class AND number = p_number AND role = 'student'
    AND password = crypt(p_password, password); -- 해시 비교 검증

    IF v_user IS NULL THEN
        RETURN json_build_object('success', false, 'message', '학번 또는 비밀번호가 일치하지 않습니다.');
    END IF;

    RETURN json_build_object('success', true, 'user', row_to_json(v_user));
END;
$$;

-- 6. 비밀번호 변경 함수 수정 (해싱 적용)
CREATE OR REPLACE FUNCTION public.change_password(
    p_user_id text,
    p_current_password text,
    p_new_password text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 현재 비밀번호 확인 (해시 검증)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE "userId" = p_user_id AND password = crypt(p_current_password, password)) THEN
        RAISE EXCEPTION '현재 비밀번호가 일치하지 않습니다.';
    END IF;

    -- 새 비밀번호 해싱하여 업데이트
    UPDATE public.users 
    SET password = crypt(p_new_password, gen_salt('bf'))
    WHERE "userId" = p_user_id;

    RETURN '비밀번호가 성공적으로 변경되었습니다.';
END;
$$;

-- 7. 학생 비밀번호 초기화 함수 수정 (해싱 적용)
CREATE OR REPLACE FUNCTION public.reset_password(p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users 
    SET password = crypt('1234', gen_salt('bf'))
    WHERE "userId" = p_user_id;
END;
$$;

-- 8. 선생님 비밀번호 재설정 함수 (복구 코드 인증 후 해싱 적용)
CREATE OR REPLACE FUNCTION public.reset_teacher_password(
    p_login_id text,
    p_recovery_code text,
    p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.teachers
    SET password = crypt(p_new_password, gen_salt('bf'))
    WHERE login_id = p_login_id AND recovery_code = p_recovery_code;
    
    RETURN FOUND;
END;
$$;