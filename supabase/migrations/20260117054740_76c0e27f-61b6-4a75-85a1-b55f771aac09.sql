-- Add authentication check to generate_unique_id function
-- This prevents unauthenticated users from calling the RPC function

CREATE OR REPLACE FUNCTION public.generate_unique_id(p_role user_role)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    id_length INTEGER := CASE WHEN p_role = 'trainer' THEN 6 ELSE 7 END;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    -- Require authentication to prevent abuse
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
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
$$;