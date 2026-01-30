
-- 1. Users 테이블 구조 확인 및 수정 (teacherAlias 컬럼명 대소문자 주의)
-- Supabase에서 대소문자가 섞인 컬럼명은 쌍따옴표(")로 감싸야 합니다.
DO $$ 
BEGIN
    -- teacher_id 컬럼 추가 (없을 경우)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.users ADD COLUMN teacher_id uuid;
    END IF;

    -- "teacherAlias" 컬럼 추가 (없을 경우)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'teacherAlias') THEN
        ALTER TABLE public.users ADD COLUMN "teacherAlias" text;
    END IF;
END $$;

-- 2. 학생 추가 RPC 함수 재정의 (에러의 핵심 원인 해결)
-- 기존에 잘못 생성된 함수를 완전히 덮어씌웁니다.
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
SECURITY DEFINER -- 권한 문제 해결을 위해 설정
AS $$
BEGIN
    -- [수정 핵심] 학생은 별칭(teacherAlias)이 필요 없으므로 해당 컬럼은 제외하고 insert 합니다.
    -- 만약 기존 함수에 'alias'라는 이름이 있었다면 이 코드가 그것을 대체합니다.
    INSERT INTO public.users (
        "userId", 
        name, 
        role, 
        grade, 
        class, 
        number, 
        teacher_id
    )
    VALUES (
        p_user_id, 
        p_name, 
        'student', 
        p_grade, 
        p_class, 
        p_number, 
        p_teacher_id
    );

    -- 계좌 생성 (선생님 ID를 연결하여 조회 성능 향상)
    INSERT INTO public.accounts (
        "userId", 
        "accountId", 
        balance, 
        teacher_id, 
        "qrToken"
    )
    VALUES (
        p_user_id, 
        '권쌤은행 ' || p_grade || '-' || p_class || ' ' || p_number, 
        0, 
        p_teacher_id, 
        encode(gen_random_bytes(16), 'hex')
    );
END;
$$;

-- 3. (선택사항) 혹시 모를 트리거 함수 점검
-- 만약 트리거가 설정되어 있다면 아래와 같이 안전하게 재정의할 수 있습니다.
-- 이 부분은 에러가 지속될 경우에만 추가로 실행하세요.
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 트리거 내부에서도 'alias'를 참조하지 않도록 주의
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
