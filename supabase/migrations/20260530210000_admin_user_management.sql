-- Admin user management: role changes and user deletion with bootstrap admin protection.

CREATE OR REPLACE FUNCTION public.is_bootstrap_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND lower(email) = 'sheethappenswithjaa@gmail.com'
  )
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_target_user_id UUID, _role public.app_role, _grant BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF public.is_bootstrap_admin(_target_user_id) THEN
    RAISE EXCEPTION 'Cannot modify the default admin account';
  END IF;

  IF _grant THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id AND role = _role;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF public.is_bootstrap_admin(_target_user_id) THEN
    RAISE EXCEPTION 'Cannot delete the default admin account';
  END IF;

  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account from the admin dashboard';
  END IF;

  DELETE FROM auth.users WHERE id = _target_user_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, public.app_role, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- Prevent admins from updating the bootstrap admin profile via direct table access.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    AND lower(email) <> 'sheethappenswithjaa@gmail.com'
  );

-- Allow admins to remove roles (bootstrap admin protected inside RPC; direct deletes still need policy).
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    AND NOT public.is_bootstrap_admin(user_id)
  );
