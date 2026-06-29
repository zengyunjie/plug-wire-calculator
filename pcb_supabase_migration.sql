CREATE TABLE IF NOT EXISTS pcb_price_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  supplier_meta JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pcb_price_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_access" ON pcb_price_config FOR ALL USING (true) WITH CHECK (true);
INSERT INTO pcb_price_config (id, supplier_meta, price_data) VALUES (1,
  '[
    {"id":"zc","name":"正创","subs":[{"id":"zc_osp","label":"OSP"},{"id":"zc_exp","label":"曝光+15"},{"id":"zc_spray","label":"喷锡+15"}]},
    {"id":"hl","name":"恒丽","subs":[{"id":"hl_osp","label":"OSP"},{"id":"hl_exp","label":"曝光+15"},{"id":"hl_spray","label":"喷锡+10"}]},
    {"id":"xy","name":"鑫阳","subs":[{"id":"xy_osp","label":"OSP"},{"id":"xy_exp","label":"曝光+15"},{"id":"xy_spray","label":"喷锡+20"},{"id":"xy_half","label":"半孔+30"}]},
    {"id":"jd","name":"健达","subs":[{"id":"jd_osp","label":"OSP"},{"id":"jd_exp","label":"曝光"},{"id":"jd_spray","label":"喷锡+15"},{"id":"jd_half","label":"半孔+50"}]},
    {"id":"hpy","name":"豪鹏赢","subs":[{"id":"hpy_osp","label":"OSP"}]}
  ]'::jsonb,
  '[
    {"m":"铝基板","l":"单面板","p":"OSP抗氧化","i":"白油黑字","md":"丝印","v":">3750V","t":"1.0mm","c":"25μm","zc_osp":125,"zc_exp":140,"zc_spray":155,"hl_osp":175,"hl_exp":190,"hl_spray":200},
    {"m":"铝基板","l":"单面板","p":"OSP抗氧化","i":"白油黑字","md":"丝印","v":">1500V","t":"1.0mm","c":"25μm","zc_osp":125,"zc_exp":140,"zc_spray":155,"hl_osp":110,"hl_exp":125,"hl_spray":135},
    {"m":"CEM-1玻纤板","l":"单面板","p":"OSP抗氧化","i":"绿油白字","md":"丝印","v":"无要求","t":"1.0mm","c":"25μm","zc_osp":null,"zc_exp":null,"zc_spray":null,"hl_osp":150,"hl_exp":165,"hl_spray":175},
    {"m":"HB纸板","l":"单面板","p":"OSP抗氧化","i":"白油黑字","md":"丝印","v":"无要求","t":"1.0mm","c":"15μm","zc_osp":null,"zc_exp":null,"zc_spray":null,"hl_osp":90,"hl_exp":105,"hl_spray":115,"hpy_osp":108},
    {"m":"FR-4玻纤板","l":"单面板","p":"OSP抗氧化","i":"白油黑字","md":"丝印","v":"无要求","t":"1.0mm","c":"25μm","zc_osp":null,"zc_exp":null,"zc_spray":null,"hl_osp":150,"hl_exp":165,"hl_spray":175},
    {"m":"FR-4玻纤板","l":"双面板","p":"OSP抗氧化","i":"白油黑字","md":"丝印","v":"无要求","t":"1.0mm","c":"25μm","zc_osp":null,"zc_exp":null,"zc_spray":null,"hl_osp":260,"hl_exp":275,"hl_spray":285}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;


-- 2026-06-29: ����ģ��Ȩ����
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS modules jsonb DEFAULT NULL;
COMMENT ON COLUMN public.app_users.modules IS '�û��ɼ�ģ���б����� ["plug","pkg","alu","plastic","pcb"]��null��ʾȫ���ɼ�';