-- ============================================
-- Phase 4 DB Alignment (Standard Validations)
-- ============================================

-- 1. WITHDRAW_REQUESTS BANK INFO
ALTER TABLE public.withdraw_requests ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.withdraw_requests ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.withdraw_requests ADD COLUMN IF NOT EXISTS bank_owner TEXT;
