-- 1. 기존에 잘못 생성된 모든 버전의 함수를 삭제합니다 (매개변수 타입 중복 에러 방지)
DROP FUNCTION IF EXISTS public.get_teacher_public_info(uuid);
DROP FUNCTION IF EXISTS public.get_teacher_public_info(text);

-- 2. 실제 테이블 구조("currencyUnit", "teacherAlias")를 정확히 반영한 보안 함수 생성
CREATE OR REPLACE FUNCTION public.get_teacher_public_info(p_teacher_id text)
RETURNS TABLE (
    currency_unit text,
    teacher_alias text
)
LANGUAGE plpgsql
SECURITY DEFINER -- RLS 정책을 우회하여 학생이 선생님 정보를 조회할 수 있게 함
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        "currencyUnit"::text, 
        "teacherAlias"::text
    FROM public.teachers
    WHERE id::text = p_teacher_id; -- 입력받은 텍스트 ID를 DB의 UUID와 비교 가능하도록 변환
END;
$$;