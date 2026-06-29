-- ============================================
-- 成本测算工具 - 用户认证系统数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor → New query 中执行
-- ============================================

-- 1. 创建用户表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    display_name TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 2. 如果表已存在但缺少字段，进行补充
DO $$
BEGIN
    -- 补充 display_name 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_users' AND column_name='display_name') THEN
        ALTER TABLE app_users ADD COLUMN display_name TEXT;
    END IF;
    
    -- 补充 is_approved 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_users' AND column_name='is_approved') THEN
        ALTER TABLE app_users ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- 补充 last_login 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_users' AND column_name='last_login') THEN
        ALTER TABLE app_users ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
    
    -- 修改 role 字段约束（如果缺少 CHECK 约束）
    BEGIN
        ALTER TABLE app_users ADD CONSTRAINT app_users_role_check CHECK (role IN ('admin', 'user'));
    EXCEPTION WHEN duplicate_object THEN
        -- 约束已存在，忽略
    END;
END $$;

-- 3. 启用行级安全策略（RLS）
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 4. 创建允许匿名访问的 RLS 策略
DO $$
BEGIN
    -- SELECT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow anonymous select' AND tablename='app_users') THEN
        CREATE POLICY "Allow anonymous select" ON app_users FOR SELECT USING (true);
    END IF;
    
    -- INSERT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow anonymous insert' AND tablename='app_users') THEN
        CREATE POLICY "Allow anonymous insert" ON app_users FOR INSERT WITH CHECK (true);
    END IF;
    
    -- UPDATE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow anonymous update' AND tablename='app_users') THEN
        CREATE POLICY "Allow anonymous update" ON app_users FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
    
    -- DELETE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow anonymous delete' AND tablename='app_users') THEN
        CREATE POLICY "Allow anonymous delete" ON app_users FOR DELETE USING (true);
    END IF;
END $$;

-- 5. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_created_at ON app_users(created_at DESC);

-- 6. 添加表注释
COMMENT ON TABLE app_users IS '成本测算工具用户认证表';
COMMENT ON COLUMN app_users.role IS '用户角色: admin=管理员, user=普通用户';
COMMENT ON COLUMN app_users.password_hash IS '密码哈希（支持 bcrypt $2b$ 和 SHA-256 Base64 格式）';
COMMENT ON COLUMN app_users.is_approved IS '是否已批准访问';

-- ============================================
-- 验证表结构
-- ============================================
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'app_users' 
ORDER BY ordinal_position;
