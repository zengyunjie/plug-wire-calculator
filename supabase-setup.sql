-- ============================================
-- PCB Calculator Supabase 数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor → New query 中执行
-- ============================================

-- 创建计算历史记录表
CREATE TABLE IF NOT EXISTS pcb_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_type TEXT NOT NULL,
    length DECIMAL(10,2) NOT NULL,
    width DECIMAL(10,2) NOT NULL,
    panel_count INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    pcs_price DECIMAL(10,6) NOT NULL,
    panel_area DECIMAL(10,6),
    formula_used TEXT,
    thickness DECIMAL(5,2),
    copper_weight DECIMAL(5,2),
    process TEXT,
    solder_mask TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用行级安全策略（RLS）
ALTER TABLE pcb_calculations ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略（可根据需要调整）
CREATE POLICY "Allow all operations" ON pcb_calculations
    FOR ALL USING (true) WITH CHECK (true);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_pcb_calculations_created_at 
    ON pcb_calculations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pcb_calculations_board_type 
    ON pcb_calculations(board_type);

-- 添加表注释
COMMENT ON TABLE pcb_calculations IS 'PCB板成本计算历史记录';

-- ============================================
-- 插入示例数据（可选）
-- ============================================
/*
INSERT INTO pcb_calculations (board_type, length, width, panel_count, unit_price, pcs_price, panel_area, formula_used, thickness, copper_weight, process, solder_mask)
VALUES 
    ('FR4双面板', 126.80, 108.66, 60, 330, 0.075834, 0.826552, '((126.8 × 108.66 + 10) / 1,000,000) × 330 / 60', 1.0, 1, 'OSP抗氧化', '绿色'),
    ('铝基板', 103.70, 62.40, 1, 125, 0.808860, 0.006471, '(103.7 × 62.4 / 1,000,000) × 125', 1.0, 1, 'OSP', '白色'),
    ('FR4单面板', 98.50, 76.20, 48, 280, 0.043790, 0.362808, '((98.5 × 76.2 + 10) / 1,000,000) × 280 / 48', 1.2, 1, 'OSP抗氧化', '绿色');
*/

-- ============================================
-- 验证表已创建
-- ============================================
SELECT * FROM pcb_calculations LIMIT 5;
