
-- 1. Create Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    login_id text UNIQUE NOT NULL,
    password text NOT NULL,
    alias text NOT NULL,
    currency_unit text NOT NULL DEFAULT '권',
    recovery_code text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2. Add teacher_id to core tables
-- Repeat for all tables: users, accounts, transactions, stock_products, savings_products, job_assignments, tax_items, funds

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.users ADD COLUMN teacher_id uuid REFERENCES public.teachers(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.accounts ADD COLUMN teacher_id uuid REFERENCES public.teachers(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.transactions ADD COLUMN teacher_id uuid REFERENCES public.teachers(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_products' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.stock_products ADD COLUMN teacher_id uuid REFERENCES public.teachers(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_products' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.savings_products ADD COLUMN teacher_id uuid REFERENCES public.teachers(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tax_items' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.tax_items ADD COLUMN teacher_id uuid REFERENCES public.teachers(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funds' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.funds ADD COLUMN teacher_id uuid REFERENCES public.teachers(id);
    END IF;
END $$;

-- 3. Update add_student RPC to support teacher_id
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
    INSERT INTO public.users ("userId", name, role, grade, class, number, teacher_id)
    VALUES (p_user_id, p_name, 'student', p_grade, p_class, p_number, p_teacher_id);

    INSERT INTO public.accounts ("userId", "accountId", balance, teacher_id)
    VALUES (p_user_id, '권쌤은행 ' || p_grade || '-' || p_class || ' ' || p_number, 0, p_teacher_id);
END;
$$;
