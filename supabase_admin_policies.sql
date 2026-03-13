-- 1. Allow Users and Admins to delete profiles
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles
FOR DELETE USING (auth.uid() = id OR public.is_admin());

-- 2. Allow Admins to delete books
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;
CREATE POLICY "Admins can delete books" ON public.books
FOR DELETE USING (public.is_admin());

-- 3. Allow Admins to delete reading sessions
DROP POLICY IF EXISTS "Admins can delete reading sessions" ON public.reading_sessions;
CREATE POLICY "Admins can delete reading sessions" ON public.reading_sessions
FOR DELETE USING (public.is_admin());

-- 4. Allow Admins to delete comments
DROP POLICY IF EXISTS "Admins can delete comments" ON public.comments;
CREATE POLICY "Admins can delete comments" ON public.comments
FOR DELETE USING (public.is_admin());

-- 5. Allow Admins to delete reactions
DROP POLICY IF EXISTS "Admins can delete reactions" ON public.reactions;
CREATE POLICY "Admins can delete reactions" ON public.reactions
FOR DELETE USING (public.is_admin());
