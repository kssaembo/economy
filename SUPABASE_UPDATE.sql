
-- 1. 기존 함수 삭제 (재생성 전 정리)
DROP FUNCTION IF EXISTS public.buy_stock(text, uuid, integer);
DROP FUNCTION IF EXISTS public.sell_stock(text, uuid, integer);
DROP FUNCTION IF EXISTS public.v3_update_stock_price(uuid, integer);

-- 2. 주가 업데이트 및 히스토리 기록 함수
CREATE OR REPLACE FUNCTION public.v3_update_stock_price(p_stock_id uuid, p_new_price integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- stock_products.id는 text 타입이므로 캐스팅 비교
    UPDATE public.stock_products 
    SET "currentPrice" = p_new_price 
    WHERE id = p_stock_id::text;

    -- stock_price_history.stockId로 text 타입을 저장
    INSERT INTO public.stock_price_history (id, "stockId", price, "createdAt")
    VALUES (gen_random_uuid(), p_stock_id::text, p_new_price, now());
END;
$$;

-- 3. 주식 매수 함수 (buy_stock)
CREATE OR REPLACE FUNCTION public.buy_stock(
    p_user_id text,
    p_stock_id uuid,
    p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_price integer;
    v_total_cost numeric;
    v_account_id text;
    v_balance numeric;
    v_teacher_id uuid;
    v_volatility numeric;
    v_new_price numeric;
BEGIN
    -- 1. 종목 정보 조회 (id는 text 타입)
    SELECT "currentPrice", teacher_id, volatility INTO v_stock_price, v_teacher_id, v_volatility
    FROM public.stock_products
    WHERE id = p_stock_id::text;

    IF NOT FOUND THEN
        RAISE EXCEPTION '해당 주식 종목을 찾을 수 없습니다.';
    END IF;

    -- 2. 학생 계좌 및 잔액 확인 (userId는 text 타입)
    SELECT "accountId", balance INTO v_account_id, v_balance
    FROM public.accounts
    WHERE "userId" = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_account_id IS NULL THEN
        RAISE EXCEPTION '학생 계좌를 찾을 수 없습니다.';
    END IF;

    -- 3. 비용 계산
    v_new_price := v_stock_price * exp(COALESCE(v_volatility, 0.01) * p_quantity);
    v_total_cost := CEIL(((v_stock_price + v_new_price) / 2.0) * p_quantity);

    IF v_balance < v_total_cost THEN
        RAISE EXCEPTION '잔액이 부족합니다. (필요: %, 잔액: %)', v_total_cost, v_balance;
    END IF;

    -- 4. 자금 인출
    UPDATE public.accounts
    SET balance = balance - v_total_cost
    WHERE "accountId" = v_account_id;

    -- 5. 보유 주식 업데이트 (stockId는 text로 저장)
    INSERT INTO public.student_stocks ("userId", "stockId", quantity, "purchasePrice", teacher_id)
    VALUES (p_user_id, p_stock_id::text, p_quantity, v_stock_price, v_teacher_id)
    ON CONFLICT ("userId", "stockId")
    DO UPDATE SET 
        "purchasePrice" = (public.student_stocks.quantity * public.student_stocks."purchasePrice" + v_total_cost) / (public.student_stocks.quantity + p_quantity),
        quantity = public.student_stocks.quantity + p_quantity;

    -- 6. 거래 내역 기록 (transactionId는 uuid 타입)
    INSERT INTO public.transactions ("transactionId", "accountId", type, amount, description, teacher_id, date)
    VALUES (gen_random_uuid(), v_account_id, 'StockBuy', -v_total_cost, (SELECT name FROM public.stock_products WHERE id = p_stock_id::text) || ' 주식 ' || p_quantity || '주 매수', v_teacher_id, now());

    -- 7. 주가 변동 반영
    PERFORM public.v3_update_stock_price(p_stock_id, v_new_price::integer);
END;
$$;

-- 4. 주식 매도 함수 (sell_stock)
CREATE OR REPLACE FUNCTION public.sell_stock(
    p_user_id text,
    p_stock_id uuid,
    p_quantity integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_price integer;
    v_owned_quantity integer;
    v_account_id text;
    v_teacher_id uuid;
    v_volatility numeric;
    v_new_price numeric;
    v_payout numeric;
    v_impact_pct numeric;
    v_fee_rate numeric;
    v_fee_amount numeric;
BEGIN
    -- 1. 보유 수량 확인 (stockId는 text)
    SELECT quantity INTO v_owned_quantity
    FROM public.student_stocks
    WHERE "userId" = p_user_id AND "stockId" = p_stock_id::text;

    IF v_owned_quantity IS NULL OR v_owned_quantity < p_quantity THEN
        RAISE EXCEPTION '보유 수량이 부족하여 판매할 수 없습니다.';
    END IF;

    -- 2. 종목 정보 조회
    SELECT "currentPrice", teacher_id, volatility INTO v_stock_price, v_teacher_id, v_volatility
    FROM public.stock_products
    WHERE id = p_stock_id::text;

    -- 3. 매도 정산 로직
    v_new_price := GREATEST(1, v_stock_price * exp(-COALESCE(v_volatility, 0.01) * p_quantity));
    v_impact_pct := ((v_stock_price - v_new_price) / v_stock_price) * 100;
    v_fee_rate := GREATEST(2.0, LEAST(33.5, (v_impact_pct * 1.05) + 2.0));
    v_payout := ((v_stock_price + v_new_price) / 2.0) * p_quantity;
    v_fee_amount := CEIL(v_payout * (v_fee_rate / 100.0));
    v_payout := FLOOR(v_payout - v_fee_amount);

    -- 4. 학생 계좌 확인
    SELECT "accountId" INTO v_account_id
    FROM public.accounts
    WHERE "userId" = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- 5. 자금 입금 및 수량 차감
    UPDATE public.accounts SET balance = balance + v_payout WHERE "accountId" = v_account_id;
    
    UPDATE public.student_stocks 
    SET quantity = quantity - p_quantity 
    WHERE "userId" = p_user_id AND "stockId" = p_stock_id::text;
    
    DELETE FROM public.student_stocks WHERE "userId" = p_user_id AND "stockId" = p_stock_id::text AND quantity <= 0;

    -- 6. 거래 내역 기록 (transactionId는 uuid)
    INSERT INTO public.transactions ("transactionId", "accountId", type, amount, description, teacher_id, date)
    VALUES (gen_random_uuid(), v_account_id, 'StockSell', v_payout, (SELECT name FROM public.stock_products WHERE id = p_stock_id::text) || ' 주식 ' || p_quantity || '주 매도', v_teacher_id, now());

    -- 7. 주가 변동 반영
    PERFORM public.v3_update_stock_price(p_stock_id, v_new_price::integer);

    RETURN '주식을 성공적으로 판매했습니다. 정산 금액: ' || v_payout;
END;
$$;
