-- ====================================================================
-- FixItNow Features Migration:
-- 1) Assigned services from admin
-- 2) Technician tracking & status
-- 3) Customer reviews for technicians
-- 4) Service reminders log
-- 5) Global and role-targeted notifications
-- ====================================================================

-- 1. ADD TECHNICIAN & COMPLETION COLUMNS TO SERVICE TABLES
ALTER TABLE public.inspections 
ADD COLUMN IF NOT EXISTS technician_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS parts_used TEXT;

ALTER TABLE public.repairs 
ADD COLUMN IF NOT EXISTS technician_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS parts_used TEXT;

ALTER TABLE public.amc_contracts 
ADD COLUMN IF NOT EXISTS technician_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS parts_used TEXT;

-- 2. UPDATE STATUS CHECK CONSTRAINTS TO ALLOW 'assigned', 'in_progress', 'completed', 'cancelled'
DO $$ 
BEGIN
    -- Drop existing check constraints if present
    ALTER TABLE public.inspections DROP CONSTRAINT IF EXISTS inspections_status_check;
    ALTER TABLE public.repairs DROP CONSTRAINT IF EXISTS repairs_status_check;
    ALTER TABLE public.amc_contracts DROP CONSTRAINT IF EXISTS amc_contracts_status_check;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. GLOBAL & USER NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id TEXT, -- Nullable if is_global = true
    is_global BOOLEAN DEFAULT FALSE,
    target_role VARCHAR(50) DEFAULT 'all', -- 'all', 'user', 'technician', 'admin'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'assignment', 'status_change'
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_global ON public.notifications(is_global, target_role);

-- 4. TECHNICIAN CUSTOMER REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.technician_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    technician_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'inspection', 'repair', 'amc'
    service_id TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    author_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technician_reviews_tech ON public.technician_reviews(technician_id);

-- 5. SERVICE REMINDERS LOG TABLE
CREATE TABLE IF NOT EXISTS public.service_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    customer_id TEXT,
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    service_id TEXT,
    service_type VARCHAR(50),
    reminder_type VARCHAR(100) NOT NULL,
    custom_message TEXT,
    status VARCHAR(50) DEFAULT 'Sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_reminders_tech ON public.service_reminders(technician_id);
