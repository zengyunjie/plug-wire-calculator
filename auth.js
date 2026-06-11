// ==================== 认证共享模块 ====================
// 所有页面引用此文件以获取统一的认证功能和 Supabase 配置

const SUPABASE_URL = "https://vmtmctgcrwzjejqtnngp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdG1jdGdjcnd6amVqcXRubmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTk0MTIsImV4cCI6MjA5NTU5NTQxMn0.UG6XLKuIi1klXNaljTQH3A2Bt_tBPrSG17077SCVJyg";
const SUPABASE_REST_URL = SUPABASE_URL + "/rest/v1/";

// ==================== 用户会话管理 ====================

function getCurrentUser() {
  try {
    var data = localStorage.getItem('app_user');
    return data ? JSON.parse(data) : null;
  } catch(e) {
    return null;
  }
}

function isLoggedIn() {
  var user = getCurrentUser();
  return user !== null && user.is_approved !== false;
}

function isAdmin() {
  var user = getCurrentUser();
  return user && user.role === 'admin';
}

// 刷新本地用户状态（从数据库重新拉取）
async function refreshCurrentUser() {
  var user = getCurrentUser();
  if (!user || !user.id) return;
  try {
    var users = await supabaseQuery('app_users', {
      id: 'eq.' + user.id,
      select: '*'
    });
    if (users && users.length > 0) {
      var u = users[0];
      localStorage.setItem('app_user', JSON.stringify({
        id: u.id,
        username: u.username,
        role: u.role,
        display_name: u.display_name || u.username,
        is_approved: u.is_approved !== false,
        login_time: Date.now()
      }));
    }
  } catch(e) {
    console.error('refresh user error:', e);
  }
}

// ==================== 路由保护 ====================

function requireAuth() {
  if (!isLoggedIn()) {
    var currentPage = window.location.pathname.split('/').pop();
    if (currentPage && currentPage !== 'login.html') {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
    } else {
      window.location.href = 'login.html';
    }
    return false;
  }
  return true;
}

// ==================== 登出 ====================

function logout() {
  localStorage.removeItem('app_user');
  window.location.href = 'login.html';
}

// ==================== 初始化用户 UI ====================

function initUserUI() {
  var user = getCurrentUser();
  if (!user) return;

  var area = document.getElementById('userArea');
  if (area) {
    area.style.display = 'flex';
  }

  var badge = document.getElementById('userBadge');
  if (badge) {
    var prefix = user.role === 'admin' ? '[管理员] ' : '';
    badge.textContent = prefix + (user.display_name || user.username);
    badge.style.cursor = 'pointer';
    badge.title = '点击管理账户';
    badge.onclick = function(e) { e.stopPropagation(); openAccountPanel(); };
  }
}

// ==================== 账户管理面板 ====================

var _panelOpen = false;

function openAccountPanel() {
  if (_panelOpen) return;
  _panelOpen = true;

  var user = getCurrentUser();
  if (!user) return;

  var overlay = document.createElement('div');
  overlay.id = 'acctOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:9998;display:flex;align-items:center;justify-content:center;';
  overlay.onclick = closeAccountPanel;

  var panel = document.createElement('div');
  panel.id = 'acctPanel';
  panel.style.cssText = 'background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);width:100%;max-width:500px;max-height:85vh;overflow-y:auto;padding:24px;position:relative;font-family:inherit;';
  panel.onclick = function(e) { e.stopPropagation(); };

  // 标题
  var header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;';
  header.innerHTML = '<h3 style="font-size:18px;font-weight:700;color:#1E293B;margin:0;">账户管理</h3>' +
    '<button onclick="closeAccountPanel()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#94A3B8;padding:0;line-height:1;">&times;</button>';
  panel.appendChild(header);

  // 当前用户信息
  var info = document.createElement('div');
  info.style.cssText = 'background:#F8FAFC;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#475569;';
  info.innerHTML = '<div style="margin-bottom:4px;"><strong>用户名：</strong>' + user.username + '</div>' +
    '<div style="margin-bottom:4px;"><strong>角色：</strong>' + (user.role === 'admin' ? '管理员' : '普通用户') + '</div>' +
    '<div><strong>状态：</strong>' + (user.is_approved ? '<span style="color:#10B981;">已激活</span>' : '<span style="color:#F59E0B;">等待审批</span>') + '</div>';
  panel.appendChild(info);

  // 个人设置区域
  var section1 = document.createElement('div');
  section1.style.cssText = 'margin-bottom:16px;';
  section1.innerHTML = '<h4 style="font-size:14px;font-weight:600;color:#334155;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;">个人设置</h4>';
  panel.appendChild(section1);

  // 修改显示名
  var dnGroup = document.createElement('div');
  dnGroup.style.cssText = 'margin-bottom:12px;';
  dnGroup.innerHTML = '<label style="font-size:12px;color:#64748B;font-weight:600;display:block;margin-bottom:4px;">显示名称</label>' +
    '<div style="display:flex;gap:8px;">' +
    '<input id="acctDisplayName" value="' + (user.display_name || user.username) + '" style="flex:1;height:38px;padding:0 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;" placeholder="显示名称">' +
    '<button onclick="saveDisplayName()" style="background:#3B82F6;color:#fff;border:none;border-radius:8px;padding:0 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">保存</button>' +
    '</div>';
  panel.appendChild(dnGroup);

  // 修改密码
  var pwGroup = document.createElement('div');
  pwGroup.style.cssText = 'margin-bottom:8px;';
  pwGroup.innerHTML = '<label style="font-size:12px;color:#64748B;font-weight:600;display:block;margin-bottom:4px;">修改密码</label>' +
    '<input id="acctNewPassword" type="password" placeholder="新密码（至少6位）" style="width:100%;height:38px;padding:0 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;margin-bottom:8px;">' +
    '<div id="acctPwMsg" style="font-size:11px;color:#F43F5E;min-height:16px;margin-bottom:6px;"></div>' +
    '<button onclick="changePassword()" style="background:#3B82F6;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;">更新密码</button>';
  panel.appendChild(pwGroup);

  // 管理员区域
  if (isAdmin()) {
    var section2 = document.createElement('div');
    section2.style.cssText = 'margin-top:20px;';
    section2.innerHTML = '<h4 style="font-size:14px;font-weight:600;color:#334155;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;">用户管理（管理员）</h4>' +
      '<div id="adminUserList" style="font-size:12px;color:#94A3B8;text-align:center;padding:12px;">加载中...</div>';
    panel.appendChild(section2);

    // 异步加载用户列表
    setTimeout(loadAdminUserList, 100);
  }

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

function closeAccountPanel() {
  _panelOpen = false;
  var overlay = document.getElementById('acctOverlay');
  if (overlay) overlay.remove();
}

// 保存显示名
async function saveDisplayName() {
  var user = getCurrentUser();
  var newName = document.getElementById('acctDisplayName').value.trim();
  if (!newName) { alert('显示名称不能为空'); return; }
  try {
    await supabaseUpdate('app_users', { id: user.id }, { display_name: newName });
    user.display_name = newName;
    localStorage.setItem('app_user', JSON.stringify(user));
    initUserUI();
    closeAccountPanel();
    openAccountPanel();
  } catch(e) {
    alert('保存失败: ' + e.message);
  }
}

// 修改密码
async function changePassword() {
  var user = getCurrentUser();
  var newPw = document.getElementById('acctNewPassword').value;
  var msgEl = document.getElementById('acctPwMsg');
  if (!newPw || newPw.length < 6) { msgEl.textContent = '密码至少6位'; return; }

  try {
    var bcrypt = ensureBcrypt();
    var hash = bcrypt.hashSync(newPw, bcrypt.genSaltSync(10));
    await supabaseUpdate('app_users', { id: user.id }, { password_hash: hash });
    msgEl.style.color = '#10B981';
    msgEl.textContent = '密码已更新';
  } catch(e) {
    msgEl.textContent = '更新失败: ' + e.message;
  }
}

// 管理员：加载用户列表
async function loadAdminUserList() {
  var container = document.getElementById('adminUserList');
  if (!container) return;
  try {
    var users = await supabaseQuery('app_users', { select: '*', order: 'created_at.desc' });
    var currentUser = getCurrentUser();
    if (!users || users.length === 0) {
      container.innerHTML = '<div style="color:#94A3B8;">暂无用户</div>';
      return;
    }
    var html = '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
      '<thead><tr style="border-bottom:2px solid #E2E8F0;text-align:left;color:#64748B;">' +
      '<th style="padding:6px 4px;">用户名</th>' +
      '<th style="padding:6px 4px;">角色</th>' +
      '<th style="padding:6px 4px;">状态</th>' +
      '<th style="padding:6px 4px;text-align:right;">操作</th>' +
      '</tr></thead><tbody>';

    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      var isMe = u.id === currentUser.id;
      var statusText = u.is_approved !== false ? '<span style="color:#10B981;">已激活</span>' : '<span style="color:#F59E0B;">待审批</span>';
      var roleText = u.role === 'admin' ? '管理员' : '用户';
      var actions = '';

      if (!isMe) {
        // 审批/禁用切换
        if (u.is_approved !== false) {
          actions += '<button onclick="adminToggleUser(\'' + u.id + '\',false)" style="background:none;border:1px solid #F59E0B;color:#F59E0B;border-radius:4px;padding:2px 6px;font-size:11px;cursor:pointer;margin-right:2px;">禁用</button>';
        } else {
          actions += '<button onclick="adminToggleUser(\'' + u.id + '\',true)" style="background:none;border:1px solid #10B981;color:#10B981;border-radius:4px;padding:2px 6px;font-size:11px;cursor:pointer;margin-right:2px;">通过</button>';
        }
        // 重置密码
        actions += '<button onclick="adminResetPassword(\'' + u.id + '\',\'' + u.username + '\')" style="background:none;border:1px solid #3B82F6;color:#3B82F6;border-radius:4px;padding:2px 6px;font-size:11px;cursor:pointer;margin-right:2px;">重置密码</button>';
        // 删除
        actions += '<button onclick="adminDeleteUser(\'' + u.id + '\',\'' + u.username + '\')" style="background:none;border:1px solid #F43F5E;color:#F43F5E;border-radius:4px;padding:2px 6px;font-size:11px;cursor:pointer;">删除</button>';
      } else {
        actions = '<span style="color:#94A3B8;">当前用户</span>';
      }

      html += '<tr style="border-bottom:1px solid #F1F5F9;">' +
        '<td style="padding:6px 4px;">' + u.username + '</td>' +
        '<td style="padding:6px 4px;">' + roleText + '</td>' +
        '<td style="padding:6px 4px;">' + statusText + '</td>' +
        '<td style="padding:6px 4px;text-align:right;">' + actions + '</td>' +
        '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = '<div style="color:#F43F5E;">加载失败: ' + e.message + '</div>';
  }
}

// 管理员：审批/禁用用户
async function adminToggleUser(userId, approve) {
  if (!confirm(approve ? '确认通过该用户的审批？' : '确认禁用该用户？')) return;
  try {
    await supabaseUpdate('app_users', { id: userId }, { is_approved: approve });
    loadAdminUserList();
  } catch(e) {
    alert('操作失败: ' + e.message);
  }
}

// 管理员：重置密码（设为 123456）
async function adminResetPassword(userId, username) {
  if (!confirm('确认将用户 ' + username + ' 的密码重置为 123456？')) return;
  try {
    var bcrypt = ensureBcrypt();
    var hash = bcrypt.hashSync('123456', bcrypt.genSaltSync(10));
    await supabaseUpdate('app_users', { id: userId }, { password_hash: hash });
    alert('密码已重置为 123456');
  } catch(e) {
    alert('重置失败: ' + e.message);
  }
}

// 管理员：删除用户
async function adminDeleteUser(userId, username) {
  if (!confirm('确认删除用户 ' + username + '？此操作不可撤销！')) return;
  try {
    await supabaseDelete('app_users', { id: userId });
    loadAdminUserList();
  } catch(e) {
    alert('删除失败: ' + e.message);
  }
}

// ==================== bcrypt 工具 ====================

function getBcrypt() {
  if (typeof dcodeIO !== 'undefined' && dcodeIO.bcrypt) return dcodeIO.bcrypt;
  if (typeof window !== 'undefined' && window.dcodeIO && window.dcodeIO.bcrypt) return window.dcodeIO.bcrypt;
  if (typeof window !== 'undefined' && window.bcrypt) return window.bcrypt;
  return null;
}

// 确保 bcrypt 可用（从 login.html 的 script 标签加载）
function ensureBcrypt() {
  var bcrypt = getBcrypt();
  if (!bcrypt) throw new Error('bcrypt库未加载，请从登录页刷新后重试');
  return bcrypt;
}
  var url = SUPABASE_REST_URL + table;
  if (params) {
    var searchParams = new URLSearchParams();
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        searchParams.append(key, params[key]);
      }
    }
    url += '?' + searchParams.toString();
  }
  var response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    var errText = '';
    try { errText = await response.text(); } catch(e) {}
    throw new Error('Query failed (' + response.status + '): ' + errText);
  }
  return response.json();
}

async function supabaseInsert(table, data) {
  var response = await fetch(SUPABASE_REST_URL + table, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    var errText = '';
    try { errText = await response.text(); } catch(e) {}
    throw new Error('Insert failed (' + response.status + '): ' + errText);
  }
  return response.json();
}

async function supabaseUpdate(table, match, data) {
  var url = SUPABASE_REST_URL + table + '?';
  var parts = [];
  for (var key in match) {
    if (match.hasOwnProperty(key)) {
      parts.push(key + '=eq.' + encodeURIComponent(match[key]));
    }
  }
  url += parts.join('&');

  var response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    var errText = '';
    try { errText = await response.text(); } catch(e) {}
    throw new Error('Update failed (' + response.status + '): ' + errText);
  }
  return response.json();
}

async function supabaseDelete(table, match) {
  var url = SUPABASE_REST_URL + table + '?';
  var parts = [];
  for (var key in match) {
    if (match.hasOwnProperty(key)) {
      parts.push(key + '=eq.' + encodeURIComponent(match[key]));
    }
  }
  url += parts.join('&');

  var response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    var errText = '';
    try { errText = await response.text(); } catch(e) {}
    throw new Error('Delete failed (' + response.status + '): ' + errText);
  }
}
