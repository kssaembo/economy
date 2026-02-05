
-- 1. 기존 함수 삭제 (매개변수 불일치 에러 방지)
DROP FUNCTION IF EXISTS public.create_fund(text, text, uuid, uuid, integer, integer, numeric, numeric, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_funds_with_stats(uuid);

-- 2. Funds 테이블 구조 강제 보정 (혹시 모를 누락 컬럼 대비)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funds' AND column_name = 'creator_id') THEN
        ALTER TABLE public.funds ADD COLUMN creator_id uuid REFERENCES public.users("userId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funds' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.funds ADD COLUMN teacher_id uuid;
    END IF;
END $$;

-- 3. 펀드 생성 RPC (인자 10개 필수)
CREATE OR REPLACE FUNCTION public.create_fund(
    p_name text,
    p_description text,
    p_creator_id uuid,
    p_teacher_id uuid,
    p_unit_price integer,
    p_target_amount integer,
    p_base_reward numeric,
    p_incentive_reward numeric,
    p_recruitment_deadline timestamp with time zone,
    p_maturity_date timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.funds (
        name, description, creator_id, teacher_id, unit_price, 
        target_amount, base_reward, incentive_reward, 
        recruitment_deadline, maturity_date, status
    )
    VALUES (
        p_name, p_description, p_creator_id, p_teacher_id, p_unit_price, 
        p_target_amount, p_base_reward, p_incentive_reward, 
        p_recruitment_deadline, p_maturity_date, 'RECRUITING'
    );
    
    RETURN json_build_object('success', true, 'message', '펀드 상품이 등록되었습니다.');
END;
$$;

-- 4. 펀드 목록 조회 RPC (JOIN 시 대소문자 구분 및 확실한 텍스트 변환 추가)
CREATE OR REPLACE FUNCTION public.get_funds_with_stats(p_teacher_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    creator_id uuid,
    creator_name text,
    teacher_id uuid,
    unit_price integer,
    target_amount integer,
    base_reward numeric,
    incentive_reward numeric,
    recruitment_deadline timestamp with time zone,
    maturity_date timestamp with time zone,
    status text,
    created_at timestamp with time zone,
    total_invested_amount numeric,
    investor_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id, f.name, f.description, f.creator_id, u.name::text as creator_name, f.teacher_id,
        f.unit_price, f.target_amount, f.base_reward, f.incentive_reward,
        f.recruitment_deadline, f.maturity_date, f.status, f.created_at,
        COALESCE((SELECT SUM(fi.units * f.unit_price) FROM public.fund_investments fi WHERE fi.fund_id = f.id), 0)::numeric as total_invested_amount,
        COALESCE((SELECT COUNT(DISTINCT fi.student_user_id) FROM public.fund_investments fi WHERE fi.fund_id = f.id), 0)::bigint as investor_count
    FROM public.funds f
    LEFT JOIN public.users u ON f.creator_id = u."userId"
    WHERE f.teacher_id = p_teacher_id
    ORDER BY f.created_at DESC;
END;
$$;
