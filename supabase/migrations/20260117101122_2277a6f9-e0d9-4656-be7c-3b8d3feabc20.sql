-- Fix generate_unique_id to work during signup (when auth.uid() is NULL)
-- The function is called by handle_new_user trigger during signup
-- At that point, there's no authenticated session yet

CREATE OR REPLACE FUNCTION public.generate_unique_id(p_role user_role)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_id TEXT;
    id_length INTEGER := CASE WHEN p_role = 'trainer' THEN 6 ELSE 7 END;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    -- Note: Removed auth.uid() check because this function is called by 
    -- handle_new_user trigger during signup when no session exists yet.
    -- The function is SECURITY DEFINER and only generates random IDs,
    -- so it's safe to allow trigger-based calls.
    
    LOOP
        new_id := LPAD(FLOOR(RANDOM() * POWER(10, id_length))::TEXT, id_length, '0');
        
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE unique_id = new_id) THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique ID after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$function$;