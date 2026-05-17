-- Create a function to execute arbitrary SQL queries (for admin use only)
-- This is a security risk in production - use with caution
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Only allow authenticated users to execute queries
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Access denied. User must be authenticated.';
    END IF;

    -- Execute the query and return results
    EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;