CREATE OR REPLACE FUNCTION public.admin_list_ledger(
    p_user_id uuid DEFAULT NULL, 
    p_search text DEFAULT NULL, 
    p_limit integer DEFAULT 200
)
RETURNS jsonb 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
    PERFORM public._assert_admin();
    RETURN COALESCE((
        SELECT jsonb_agg(r ORDER BY r.id DESC) 
        FROM (
            SELECT 
                l.id, 
                l.user_id, 
                u.email, 
                p.company_name, 
                l.delta, 
                l.reason, 
                l.balance, 
                l.created_at
            FROM public.silicon_ledger l
            JOIN auth.users u ON u.id = l.user_id
            LEFT JOIN public.profiles p ON p.id = l.user_id
            WHERE (p_user_id IS NULL OR l.user_id = p_user_id)
              AND (p_search IS NULL OR p_search = '' OR l.reason ILIKE '%' || p_search || '%' OR u.email ILIKE '%' || p_search || '%' OR p.company_name ILIKE '%' || p_search || '%')
            ORDER BY l.id DESC 
            LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 500)
        ) r
    ), '[]'::jsonb);
END $$;

-- Berikan izin akses ke admin (pemain biasa tidak bisa mengakses ini)
GRANT EXECUTE ON FUNCTION public.admin_list_ledger(uuid, text, integer) TO authenticated;
