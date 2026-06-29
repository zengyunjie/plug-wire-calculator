// ==================== 璁よ瘉鍏变韩妯″潡 ====================
// 鎵€鏈夐〉闈㈠紩鐢ㄦ鏂囦欢浠ヨ幏鍙栫粺涓€鐨勮璇佸姛鑳藉拰 Supabase 閰嶇疆

const SUPABASE_URL = "https://vmtmctgcrwzjejqtnngp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdG1jdGdjcnd6amVqcXRubmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTk0MTIsImV4cCI6MjA5NTU5NTQxMn0.UG6XLKuIi1klXNaljTQH3A2Bt_tBPrSG17077SCVJyg";
const SUPABASE_REST_URL = SUPABASE_URL + "/rest/v1/";

// 鐢ㄦ埛鍒楄〃缂撳瓨锛堢鐞嗗憳椤甸潰鐢級
var _allUsers = null;
var _userFilter = 'all';
// MODULE PERMISSION DEFINITIONS
var ALL_MODULES = [
  {id:'plug',label:'锟斤拷头锟斤拷',icon:'\u{1f50c}'},
  {id:'pkg',label:'锟斤拷锟斤拷',icon:'\u{1f4e6}'},
  {id:'alu',label:'锟斤拷锟酵诧拷',icon:'\u{1f529}'},
  {id:'plastic',label:'锟杰斤拷锟斤拷',icon:'\u{1fa79}'},
  {id:'pcb',label:'PCB',icon:'\u{1f4df}'}
];
function getUserModules(user){if(!user||user.role==='admin')return ALL_MODULES.map(function(m){return m.id});if(user.modules&&user.modules.length)return user.modules;return ALL_MODULES.map(function(m){return m.id})}
function canAccessModule(mid){return getUserModules(getCurrentUser()).indexOf(mid)>=0}


// ==================== 鐢ㄦ埛浼氳瘽绠＄悊 ====================

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

// 鍒锋柊鏈湴鐢ㄦ埛鐘舵€侊紙浠庢暟鎹簱閲嶆柊鎷夊彇锛?
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
        modules: u.modules,
        login_time: Date.now()
      }));
    }
  } catch(e) {
    console.error('refresh user error:', e);
  }
}

// ==================== 璺敱淇濇姢 ====================

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

// ==================== 鐧诲嚭 ====================

function logout() {
  localStorage.removeItem('app_user');
  window.location.href = 'login.html';
}

// ==================== 鍒濆鍖栫敤鎴?UI ====================

function initUserUI() {
  var user = getCurrentUser();
  if (!user) return;

  var area = document.getElementById('userArea');
  if (area) {
    area.style.display = 'flex';
  }

  var badge = document.getElementById('userBadge');
  if (badge) {
    var prefix = user.role === 'admin' ? '[绠＄悊鍛榏 ' : '';
    badge.textContent = prefix + (user.display_name || user.username);
    badge.style.cursor = 'pointer';
    badge.title = '鐐瑰嚮绠＄悊璐︽埛';
    badge.onclick = function(e) { e.stopPropagation(); openAccountPanel(); };
  }
}

// ==================== 璐︽埛绠＄悊闈㈡澘 ====================

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

  // 鏍囬
  var header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;';
  header.innerHTML = '<h3 style="font-size:18px;font-weight:700;color:#1E293B;margin:0;">璐︽埛绠＄悊</h3>' +
    '<button onclick="closeAccountPanel()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#94A3B8;padding:0;line-height:1;">&times;</button>';
  panel.appendChild(header);

  // 褰撳墠鐢ㄦ埛淇★拷锟斤拷
  var info = document.createElement('div');
  info.style.cssText = 'background:#F8FAFC;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#475569;';
  info.innerHTML = '<div style="margin-bottom:4px;"><strong>鐢ㄦ埛鍚嶏細</strong>' + user.username + '</div>' +
    '<div style="margin-bottom:4px;"><strong>瑙掕壊锛?/strong>' + (user.role === 'admin' ? '绠＄悊鍛? : '鏅€氱敤鎴?) + '</div>' +
    '<div><strong>鐘舵€侊細</strong>' + (user.is_approved ? '<span style="color:#10B981;">宸叉縺娲?/span>' : '<span style="color:#F59E0B;">绛夊緟瀹℃壒</span>') + '</div>';
  panel.appendChild(info);

  // 涓汉璁剧疆鍖哄煙
  var section1 = document.createElement('div');
  section1.style.cssText = 'margin-bottom:16px;';
  section1.innerHTML = '<h4 style="font-size:14px;font-weight:600;color:#334155;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;">涓汉璁剧疆</h4>';
  panel.appendChild(section1);

  // 淇敼鏄剧ず鍚?
  var dnGroup = document.createElement('div');
  dnGroup.style.cssText = 'margin-bottom:12px;';
  dnGroup.innerHTML = '<label style="font-size:12px;color:#64748B;font-weight:600;display:block;margin-bottom:4px;">鏄剧ず鍚嶇О</label>' +
    '<div style="display:flex;gap:8px;">' +
    '<input id="acctDisplayName" value="' + (user.display_name || user.username) + '" style="flex:1;height:38px;padding:0 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;" placeholder="鏄剧ず鍚嶇О">' +
    '<button onclick="saveDisplayName()" style="background:#3B82F6;color:#fff;border:none;border-radius:8px;padding:0 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">淇濆瓨</button>' +
    '</div>';
  panel.appendChild(dnGroup);

  // 淇敼瀵嗙爜
  var pwGroup = document.createElement('div');
  pwGroup.style.cssText = 'margin-bottom:8px;';
  pwGroup.innerHTML = '<label style="font-size:12px;color:#64748B;font-weight:600;display:block;margin-bottom:4px;">淇敼瀵嗙爜</label>' +
    '<input id="acctNewPassword" type="password" placeholder="鏂板瘑鐮侊紙鑷冲皯6浣嶏級" style="width:100%;height:38px;padding:0 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;margin-bottom:8px;">' +
    '<div id="acctPwMsg" style="font-size:11px;color:#F43F5E;min-height:16px;margin-bottom:6px;"></div>' +
    '<button onclick="changePassword()" style="background:#3B82F6;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;">鏇存柊瀵嗙爜</button>';
  panel.appendChild(pwGroup);

  // 绠＄悊鍛樺尯鍩?
  if (isAdmin()) {
    var section2 = document.createElement('div');
    section2.style.cssText = 'margin-top:20px;';
    section2.innerHTML = '<h4 style="font-size:14px;font-weight:600;color:#334155;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;">馃懃 鐢ㄦ埛绠＄悊 <span style="background:#EFF6FF;color:#3B82F6;font-size:10px;padding:1px 7px;border-radius:10px;font-weight:600;margin-left:6px;">绠＄悊鍛?/span></h4>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px;align-items:center;">' +
      '<button class="preset-btn active" onclick="filterUsers(\'all\')" id="filterAll" style="padding:4px 10px;font-size:11px;">鍏ㄩ儴</button>' +
      '<button class="preset-btn" onclick="filterUsers(\'pending\')" id="filterPending" style="padding:4px 10px;font-size:11px;">寰呭鎵?/button>' +
      '<button class="preset-btn" onclick="filterUsers(\'active\')" id="filterActive" style="padding:4px 10px;font-size:11px;">宸叉縺娲?/button>' +
      '<button onclick="loadAdminUserList()" style="background:none;border:1px solid #c3daff;color:#1a6fc4;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;margin-left:auto;">馃攧 鍒锋柊</button>' +
      '<button onclick="saveAllModules()" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;margin-left:4px;">馃捑 淇濆瓨妯″潡鏉冮檺</button>' +
      '</div>' +
      '<div id="adminUserList" style="font-size:12px;color:#94A3B8;text-align:center;padding:12px;">鍔犺浇涓?..</div>' +
      '<div style="margin-top:10px;padding-top:8px;border-top:1px solid #F1F5F9;font-size:11px;line-height:1.8;color:#94A3B8;">' +
      '<div><strong style="color:#22c55e;">閫氳繃</strong> 鈥?瀹℃壒寰呭鏍哥敤鎴?/div>' +
      '<div><strong style="color:#f97316;">绂佺敤</strong> 鈥?鏆傚仠宸叉縺娲荤敤鎴?/div>' +
      '<div><strong style="color:#3B82F6;">閲嶇疆瀵嗙爜</strong> 鈥?閲嶇疆涓?<code>123456</code></div>' +
      '<div><strong style="color:#8b5cf6;">瑙掕壊</strong> 鈥?鍒囨崲绠＄悊鍛?鏅€氱敤鎴?/div>' +
      '<div><strong style="color:#ef4444;">鍒犻櫎</strong> 鈥?姘镐箙鍒犻櫎锛屼笉鍙挙閿€</div>' +
      '</div>';
    panel.appendChild(section2);

    // 寮傛鍔犺浇鐢ㄦ埛鍒楄〃
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

// 淇濆瓨鏄剧ず鍚?
async function saveDisplayName() {
  var user = getCurrentUser();
  var newName = document.getElementById('acctDisplayName').value.trim();
  if (!newName) { alert('鏄剧ず鍚嶇О涓嶈兘涓虹┖'); return; }
  try {
    await supabaseUpdate('app_users', { id: user.id }, { display_name: newName });
    user.display_name = newName;
    localStorage.setItem('app_user', JSON.stringify(user));
    initUserUI();
    closeAccountPanel();
    openAccountPanel();
  } catch(e) {
    alert('淇濆瓨澶辫触: ' + e.message);
  }
}

// 淇敼瀵嗙爜
async function changePassword() {
  var user = getCurrentUser();
  var newPw = document.getElementById('acctNewPassword').value;
  var msgEl = document.getElementById('acctPwMsg');
  if (!newPw || newPw.length < 6) { msgEl.textContent = '瀵嗙爜鑷冲皯6浣?; return; }

  try {
    var bcrypt = ensureBcrypt();
    var hash = bcrypt.hashSync(newPw, bcrypt.genSaltSync(10));
    await supabaseUpdate('app_users', { id: user.id }, { password_hash: hash });
    msgEl.style.color = '#10B981';
    msgEl.textContent = '瀵嗙爜宸叉洿鏂?;
  } catch(e) {
    msgEl.textContent = '鏇存柊澶辫触: ' + e.message;
  }
}

// 绠＄悊鍛橈細鍔犺浇鐢ㄦ埛鍒楄〃锛堝脊绐楀唴锛?
async function loadAdminUserList() {
  var container = document.getElementById('adminUserList');
  if (!container) return;
  try {
    _allUsers = await supabaseQuery('app_users', { select: '*', order: 'created_at.desc' });
    renderAdminUserList();
  } catch(e) {
    container.innerHTML = '<div style="color:#F43F5E;">鍔犺浇澶辫触: ' + e.message + '</div>';
  }
}

// 寮圭獥鍐呮覆鏌撶敤鎴峰垪琛?
var _modPending = {};function markModuleChange(uid,mid,chk){if(!_modPending[uid])_modPending[uid]={};_modPending[uid][mid]=chk}function saveAllModules(){var uids=Object.keys(_modPending);if(uids.length===0){alert("娌℃湁寰呬繚瀛樼殑鏇存敼");return}var ps=uids.map(function(uid){var ms=[];ALL_MODULES.forEach(function(m){if(_modPending[uid][m.id])ms.push(m.id)});return supabaseUpdate("app_users",{id:uid},{modules:ms})});Promise.all(ps).then(function(){_modPending={};alert("妯″潡鏉冮檺宸蹭繚瀛?);loadAdminUserList()}).catch(function(e){alert("淇濆瓨澶辫触锛?+e.message)});}function renderAdminUserList() {
  var container = document.getElementById('adminUserList');
  if (!container || !_allUsers) return;

  var currentUser = getCurrentUser();
  var users = _allUsers;

  // 鎸?// ==================== MODULE PERMISSION TOGGLE ====================
function buildModuleCheckboxes(u){var mods=u.modules||[];var h="";ALL_MODULES.forEach(function(md){var checked=(mods.length===0||mods.indexOf(md.id)>=0)?"checked":"";h+="<label style=\'display:inline-block;margin:0 2px;cursor:pointer;font-size:11px\' title=\""+md.label+"\"><input type=\"checkbox\" "+checked+" onchange=\"markModuleChange(\'"+u.id+"\',\'"+md.id+"\',this.checked)\">"+md.icon+"</label>";});return h+"<br><span style=\'color:#94A3B8;font-size:9px\'>鐐瑰嚮鍕鹃€変繚瀛?/span>";}

if (_userFilter === 'pending') {
    users = users.filter(function(u) { return u.is_approved === false; });
  } else if (_userFilter === 'active') {
    users = users.filter(function(u) { return u.is_approved !== false; });
  }

  if (users.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#94A3B8;">鏆傛棤' +
      (_userFilter === 'pending' ? '寰呭鎵? : _userFilter === 'active' ? '宸叉縺娲? : '') + '鐢ㄦ埛</div>';
    return;
  }

  // 缁熻
  var pendingCount = _allUsers.filter(function(u) { return u.is_approved === false; }).length;
  var activeCount = _allUsers.filter(function(u) { return u.is_approved !== false; }).length;
  var statsHtml = '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
    '<div style="background:#f0fdf4;border-radius:6px;padding:4px 10px;font-size:11px;">宸叉縺娲?<strong style="color:#22c55e;">' + activeCount + '</strong></div>' +
    '<div style="background:#fff7ed;border-radius:6px;padding:4px 10px;font-size:11px;">寰呭鎵?<strong style="color:#f97316;">' + pendingCount + '</strong></div>' +
    '<div style="background:#f3f4f6;border-radius:6px;padding:4px 10px;font-size:11px;">鎬昏 <strong>' + _allUsers.length + '</strong></div>' +
    '</div>';

  var html = statsHtml + '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
    '<thead><tr style="border-bottom:2px solid #E2E8F0;text-align:left;color:#64748B;">' +
    '<th style="padding:6px 4px;">鐢ㄦ埛鍚?/th>' +
    '<th style="padding:6px 4px;">瑙掕壊</th>' +
    '<th style="padding:6px 4px;">鐘舵€?/th><th style="padding:6px 4px;">妯″潡</th>' +
    '<th style="padding:6px 4px;text-align:right;">鎿嶄綔</th>' +
    '</tr></thead><tbody>';

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    var isMe = u.id === currentUser.id;
    var statusHtml = u.is_approved !== false ?
      '<span style="color:#22c55e;font-weight:600;font-size:11px;">鉁?宸叉縺娲?/span>' :
      '<span style="color:#f97316;font-weight:600;font-size:11px;">鈴?寰呭鎵?/span>';
    var roleHtml = u.role === 'admin' ?
      '<span style="background:#EFF6FF;color:#3B82F6;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;">绠＄悊鍛?/span>' :
      '<span style="background:#F1F5F9;color:#64748B;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;">鐢ㄦ埛</span>';
    var actionsHtml = '';

    if (!isMe) {
      // 瀹℃壒/绂佺敤
      if (u.is_approved !== false) {
        actionsHtml += '<button onclick="adminToggleUser(\'' + u.id + '\',false)" style="background:none;border:1px solid #f97316;color:#f97316;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600;cursor:pointer;margin-right:2px;">绂佺敤</button>';
      } else {
        actionsHtml += '<button onclick="adminToggleUser(\'' + u.id + '\',true)" style="background:none;border:1px solid #22c55e;color:#22c55e;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600;cursor:pointer;margin-right:2px;">閫氳繃</button>';
      }
      // 瑙掕壊鍒囨崲
      if (u.role === 'admin') {
        actionsHtml += '<button onclick="adminChangeRole(\'' + u.id + '\',\'user\')" style="background:none;border:1px solid #8b5cf6;color:#8b5cf6;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600;cursor:pointer;margin-right:2px;">闄嶄负鐢ㄦ埛</button>';
      } else {
        actionsHtml += '<button onclick="adminChangeRole(\'' + u.id + '\',\'admin\')" style="background:none;border:1px solid #8b5cf6;color:#8b5cf6;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600;cursor:pointer;margin-right:2px;">鍗囦负绠＄悊鍛?/button>';
      }
      // 閲嶇疆瀵嗙爜
      actionsHtml += '<button onclick="adminResetPassword(\'' + u.id + '\',\'' + u.username + '\')" style="background:none;border:1px solid #3B82F6;color:#3B82F6;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600;cursor:pointer;margin-right:2px;">閲嶇疆瀵嗙爜</button>';
      // 鍒犻櫎
      actionsHtml += '<button onclick="adminDeleteUser(\'' + u.id + '\',\'' + u.username + '\')" style="background:none;border:1px solid #ef4444;color:#ef4444;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600;cursor:pointer;">鍒犻櫎</button>';
    } else {
      actionsHtml = '<span style="color:#94A3B8;font-size:10px;">褰撳墠鐢ㄦ埛</span>';
    }

    html += '<tr style="border-bottom:1px solid #F1F5F9;' + (isMe ? 'background:#EFF6FF;' : '') + '">' +
      '<td style="padding:6px 4px;font-weight:600;color:#1E293B;">' + u.username + '</td>' +
      '<td style="padding:6px 4px;">' + roleHtml + '</td>' +
      '<td style="padding:6px 4px;">' + statusHtml + '</td><td style="padding:6px 4px;font-size:10px;max-width:120px;white-space:normal;line-height:1.4">'+buildModuleCheckboxes(u)+'</td>' +
      '<td style="padding:6px 4px;text-align:right;white-space:nowrap;">' + actionsHtml + '</td>' +
      '</tr>';
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

// 绠＄悊鍛橈細瀹℃壒/绂佺敤鐢ㄦ埛
async function adminToggleUser(userId, approve) {
  if (!confirm(approve ? '纭閫氳繃璇ョ敤鎴风殑瀹℃壒锛? : '纭绂佺敤璇ョ敤鎴凤紵')) return;
  try {
    await supabaseUpdate('app_users', { id: userId }, { is_approved: approve });
    loadAdminUserList();
  } catch(e) {
    alert('鎿嶄綔澶辫触: ' + e.message);
  }
}

// 绠＄悊鍛橈細閲嶇疆瀵嗙爜锛堣涓?123456锛?
async function adminResetPassword(userId, username) {
  if (!confirm('纭灏嗙敤鎴?' + username + ' 鐨勫瘑鐮侀噸缃负 123456锛?)) return;
  try {
    var bcrypt = ensureBcrypt();
    var hash = bcrypt.hashSync('123456', bcrypt.genSaltSync(10));
    await supabaseUpdate('app_users', { id: userId }, { password_hash: hash });
    alert('瀵嗙爜宸查噸缃负 123456');
  } catch(e) {
    alert('閲嶇疆澶辫触: ' + e.message);
  }
}

// 绠＄悊鍛橈細鍒犻櫎鐢ㄦ埛
async function adminDeleteUser(userId, username) {
  if (!confirm('纭鍒犻櫎鐢ㄦ埛 ' + username + '锛熸鎿嶄綔涓嶅彲鎾ら攢锛?)) return;
  try {
    await supabaseDelete('app_users', { id: userId });
    loadAdminUserList();
  } catch(e) {
    alert('鍒犻櫎澶辫触: ' + e.message);
  }
}

// ==================== bcrypt 宸ュ叿 ====================

function getBcrypt() {
  if (typeof dcodeIO !== 'undefined' && dcodeIO.bcrypt) return dcodeIO.bcrypt;
  if (typeof window !== 'undefined' && window.dcodeIO && window.dcodeIO.bcrypt) return window.dcodeIO.bcrypt;
  if (typeof window !== 'undefined' && window.bcrypt) return window.bcrypt;
  return null;
}

// 纭繚 bcrypt 鍙敤锛堜粠 login.html 鐨?script 鏍囩鍔犺浇锛?
function ensureBcrypt() {
  var bcrypt = getBcrypt();
  if (!bcrypt) throw new Error('bcrypt搴撴湭鍔犺浇锛岃浠庣櫥褰曢〉鍒锋柊鍚庨噸璇?);
  return bcrypt;
}

// ==================== Supabase REST API 灏佽 ====================

async function supabaseQuery(table, params) {
  var url = SUPABASE_REST_URL + table;
  if (params) {
    var parts = [];
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        // 鐩存帴鎷兼帴锛岄伩鍏?URLSearchParams 瀵瑰凡缂栫爜鐨勫€艰繘琛屼簩娆＄紪鐮?
        parts.push(encodeURIComponent(key) + '=' + params[key]);
      }
    }
    url += '?' + parts.join('&');
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

// ==================== 绠＄悊鍛樺脊绐楀唴绛涢€?====================

// 绛涢€夌敤鎴?
function filterUsers(type) {
  _userFilter = type;
  // 鏇存柊绛涢€夋寜閽牱寮?
  var btnIds = ['filterAll', 'filterPending', 'filterActive'];
  for (var i = 0; i < btnIds.length; i++) {
    var btn = document.getElementById(btnIds[i]);
    if (btn) {
      var isActive = btnIds[i] === 'filter' + type.charAt(0).toUpperCase() + type.slice(1);
      btn.classList.toggle('active', isActive);
    }
  }
  renderAdminUserList();
}

// ==================== 绠＄悊鍛樻潈闄愭鏌?====================

function requireAdmin() {
  if (!isLoggedIn()) {
    var page = window.location.pathname.split('/').pop();
    window.location.href = 'login.html?redirect=' + encodeURIComponent(page);
    return false;
  }
  if (!isAdmin()) {
    alert('鏉冮檺涓嶈冻锛氫粎绠＄悊鍛樺彲璁块棶姝ら〉闈€?);
    document.body.innerHTML = '<div style="padding:40px;text-align:center;font-size:16px;color:#e74c3c"><h2>鎷掔粷璁块棶</h2><p>浠呯鐞嗗憳鍙煡鐪嬫椤甸潰銆?/p><p><a href="login.html" style="color:#3664fb">杩斿洖鐧诲綍</a></p></div>';
    return false;
  }
  return true;
}
