-- Remove the policy that allows users to view their own roles
-- This prevents authenticated users from enumerating admin user IDs
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;