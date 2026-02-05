
-- 1. 기존 함수 삭제 (반환 타입 변경을 위해 필수 실행)
-- ERROR: 42P13 (cannot change return type) 방지를 위해 먼저 DROP 합니다.
DROP FUNCTION IF EXISTS public.login_teacher(p_login_id text, p_password text);
DROP FUNCTION IF EXISTS public.signup_teacher(p_login_id text, p_password text, p_alias text, p_currency_unit text);

-- 2. 회원가입 함수 (데이터를 users, teachers, accounts 테이블에 분산 저장)
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
    -- 이메일 중복 체크 (teachers 테이블 기준)
    IF EXISTS (SELECT 1 FROM public.teachers WHERE login_id = p_login_id) THEN
        RAISE EXCEPTION '이미 가입된 이메일 계정입니다.';
    END IF;

    -- [Step 1] users 테이블: 공통 프로필 정보 (id를 텍스트로 변환하여 userId에 저장)
    INSERT INTO public.users ("userId", name, role, teacher_id)
    VALUES (v_user_id::text, p_alias, 'teacher', v_user_id);

    -- [Step 2] teachers 테이블: 로그인 및 보안 정보 (camelCase 컬럼명 주의)
    INSERT INTO public.teachers (id, login_id, password, "teacherAlias", "currencyUnit", recovery_code)
    VALUES (v_user_id, p_login_id, p_password, p_alias, p_currency_unit, v_recovery_code);

    -- [Step 3] accounts 테이블: 국고 및 마트 계좌 생성
    INSERT INTO public.accounts ("userId", "accountId", balance, teacher_id, "qrToken", account_type)
    VALUES (v_user_id::text, p_alias || ' 국고계좌', 0, v_user_id, encode(gen_random_bytes(16), 'hex'), 'treasury');

    INSERT INTO public.accounts ("userId", "accountId", balance, teacher_id, "qrToken", account_type)
    VALUES (v_user_id::text, p_alias || ' 마트계좌', 0, v_user_id, encode(gen_random_bytes(16), 'hex'), 'mart');

    RETURN json_build_object('success', true, 'recoveryCode', v_recovery_code);
END;
$$;

-- 3. 로그인 함수 (teachers에서 인증 후 users에서 프로필 반환)
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
    WHERE t.login_id = p_login_id AND t.password = p_password;
END;
$$;
