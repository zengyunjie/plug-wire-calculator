// ==================== 认证共享模块 ====================
// 所有页面引用此文件以获取统一的认证功能和 Supabase 配置

const SUPABASE_URL = "https://vmtmctgcrwzjejqtnngp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdG1jdGdjcnd6amVqcXRubmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTk0MTIsImV4cCI6MjA5NTU5NTQxMn0.UG6XLKuIi1klXNaljTQH3A2Bt_tBPrSG17077SCVJyg";
const SUPABASE_REST_URL = SUPABASE_URL + "/rest/v1/";

// ==================== 用户会话管理 ====================

// 获取当前登录用户（从 localStorage 读取）
function getCurrentUser() {
  try {
    var data = localStorage.getItem('app_user');
    return data ? JSON.parse(data) : null;
  } catch(e) {
    return null;
  }
}

// 检查是否已登录且已批准
function isLoggedIn() {
  var user = getCurrentUser();
  return user !== null && user.is_approved !== false;
}

// 检查是否为管理员
function isAdmin() {
  var user = getCurrentUser();
  return user && user.role === 'admin';
}

// ==================== 路由保护 ====================

// 未登录则跳转到 login.html，登录后返回当前页面
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

// 清除登录状态并跳转到登录页
function logout() {
  localStorage.removeItem('app_user');
  window.location.href = 'login.html';
}

// ==================== 初始化用户 UI ====================

// 在各页面的顶部导航栏显示当前用户信息和退出按钮
function initUserUI() {
  var user = getCurrentUser();
  if (!user) return;

  // 显示用户区域
  var area = document.getElementById('userArea');
  if (area) {
    area.style.display = 'flex';
  }

  // 显示用户标签
  var badge = document.getElementById('userBadge');
  if (badge) {
    var prefix = user.role === 'admin' ? '[管理员] ' : '';
    badge.textContent = prefix + (user.display_name || user.username);
  }
}

// ==================== Supabase REST API 封装 ====================

// 查询数据（GET 请求，使用 anon key）
async function supabaseQuery(table, params) {
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

// 插入数据（POST 请求，使用 anon key）
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
