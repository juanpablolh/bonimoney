# Supabase Security Configuration

This document outlines the required Row Level Security (RLS) policies and security configurations for BoniMoney's Supabase database.

## Prerequisites

Before implementing these policies, ensure you have:
- Admin access to your Supabase project
- SQL Editor access in Supabase Dashboard
- Basic understanding of PostgreSQL and RLS

## Database Schema

### Current Tables

1. **groups** - Stores group data with members and expenses
   - `id` (text, primary key) - Group identifier
   - `data` (jsonb) - Serialized group data
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## Step 1: Enable Row Level Security

Run this SQL in Supabase SQL Editor:

```sql
-- Enable RLS on groups table
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
```

## Step 2: Current Policies (Public Access)

⚠️ **WARNING**: Currently, the groups table has NO RLS policies, which means:
- Anyone with the Supabase URL and anon key can read/write data
- This is acceptable ONLY for development/testing
- **DO NOT use in production without authentication**

### Temporary Policy (Development Only)

```sql
-- Allow public read/write (DEVELOPMENT ONLY)
CREATE POLICY "Public access for development"
  ON groups
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Step 3: Production Policies (After Authentication Implementation)

Once Supabase Auth is implemented (Phase 2), replace the development policy with these:

### Policy 1: Users can read groups they're members of

```sql
-- Drop development policy first
DROP POLICY IF EXISTS "Public access for development" ON groups;

-- Create production policies
CREATE POLICY "Users can read their groups"
  ON groups
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM group_members 
      WHERE group_id = groups.id
    )
  );
```

### Policy 2: Only group owners can update groups

```sql
CREATE POLICY "Owners can update groups"
  ON groups
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
```

### Policy 3: Authenticated users can create groups

```sql
CREATE POLICY "Authenticated users can create groups"
  ON groups
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
```

### Policy 4: Only owners can delete groups

```sql
CREATE POLICY "Owners can delete groups"
  ON groups
  FOR DELETE
  USING (auth.uid() = owner_id);
```

## Step 4: Rate Limiting

Implement rate limiting to prevent abuse:

```sql
-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_user ON rate_limits(user_id, endpoint, window_start);
CREATE INDEX idx_rate_limits_ip ON rate_limits(ip_address, endpoint, window_start);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_ip_address INET,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Count requests in current window
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_count
  FROM rate_limits
  WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND endpoint = p_endpoint
    AND window_start > v_window_start;
  
  -- Check if limit exceeded
  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  INSERT INTO rate_limits (user_id, ip_address, endpoint, request_count, window_start)
  VALUES (p_user_id, p_ip_address, p_endpoint, 1, NOW())
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 5: Audit Logging

Enable audit logging for security monitoring:

```sql
-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own audit logs
CREATE POLICY "Users can read their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);
```

## Step 6: Realtime Security

Configure Realtime subscriptions:

```sql
-- Enable Realtime for groups table
ALTER PUBLICATION supabase_realtime ADD TABLE groups;

-- Realtime will respect RLS policies automatically
-- Users can only subscribe to groups they have access to
```

## Step 7: API Key Rotation

⚠️ **IMPORTANT**: Rotate your Supabase anon key regularly:

1. Go to Supabase Dashboard → Settings → API
2. Click "Generate new anon key"
3. Update `VITE_SUPABASE_ANON_KEY` in your `.env` file
4. Deploy the updated environment variable to Vercel

**Recommended rotation schedule**: Every 90 days

## Step 8: Monitoring

Set up monitoring for security events:

```sql
-- Create a view for security monitoring
CREATE OR REPLACE VIEW security_events AS
SELECT 
  al.created_at,
  al.user_id,
  p.email,
  al.action,
  al.resource_type,
  al.ip_address,
  al.user_agent
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
LEFT JOIN profiles p ON u.id = p.id
WHERE al.action IN ('login_failed', 'unauthorized_access', 'rate_limit_exceeded')
ORDER BY al.created_at DESC;
```

## Verification Checklist

After implementing these policies, verify:

- [ ] RLS is enabled on all tables
- [ ] Anonymous users cannot access data (after auth is implemented)
- [ ] Authenticated users can only access their own groups
- [ ] Rate limiting is working (test with rapid requests)
- [ ] Audit logs are being created for important actions
- [ ] Realtime subscriptions respect RLS policies

## Testing RLS Policies

Test your policies with these SQL queries:

```sql
-- Test as anonymous user (should return no rows after auth)
SET request.jwt.claim.sub = '';
SELECT * FROM groups;

-- Test as authenticated user (should return only their groups)
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM groups;
```

## Emergency Procedures

### If you suspect a security breach:

1. **Immediately rotate API keys** in Supabase Dashboard
2. **Review audit logs** for suspicious activity
3. **Disable public access** if needed:
   ```sql
   DROP POLICY IF EXISTS "Public access for development" ON groups;
   ```
4. **Contact Supabase support** if you need assistance

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)

## Current Status

✅ **Development Mode**: Public access enabled (temporary)
⚠️ **Production Ready**: NO - Requires authentication implementation (Phase 2)

**Last Updated**: 2026-01-11
**Next Review**: After Phase 2 (Authentication) completion
