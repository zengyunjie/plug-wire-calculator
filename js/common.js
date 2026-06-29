// ==================== 通用工具函数 ====================

// ===== Toast 提示 =====
(function() {
  var toastContainer = null;
  
  function ensureContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }
  
  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    
    var container = ensureContainer();
    var toast = document.createElement('div');
    
    var colors = {
      success: { bg: '#10b981', icon: '✓' },
      error: { bg: '#ef4444', icon: '✕' },
      warning: { bg: '#f59e0b', icon: '⚠' },
      info: { bg: '#3b82f6', icon: 'ℹ' }
    };
    var c = colors[type] || colors.info;
    
    toast.style.cssText = 'background:' + c.bg + ';color:#fff;padding:12px 18px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:14px;font-weight:500;display:flex;align-items:center;gap:8px;transform:translateX(120%);transition:transform 0.3s ease;pointer-events:auto;max-width:320px;';
    toast.innerHTML = '<span style="font-size:16px;">' + c.icon + '</span><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    // 动画入场
    requestAnimationFrame(function() {
      toast.style.transform = 'translateX(0)';
    });
    
    // 自动消失
    setTimeout(function() {
      toast.style.transform = 'translateX(120%)';
      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
  
  window.Toast = {
    success: function(msg, dur) { showToast(msg, 'success', dur); },
    error: function(msg, dur) { showToast(msg, 'error', dur); },
    warning: function(msg, dur) { showToast(msg, 'warning', dur); },
    info: function(msg, dur) { showToast(msg, 'info', dur); }
  };
})();

// ===== 本地存储封装 =====
var Storage = {
  PREFIX: 'calc_tool_',
  
  get: function(key, defaultValue) {
    try {
      var val = localStorage.getItem(this.PREFIX + key);
      if (val === null) return defaultValue;
      return JSON.parse(val);
    } catch(e) {
      return defaultValue;
    }
  },
  
  set: function(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      return true;
    } catch(e) {
      console.error('Storage error:', e);
      return false;
    }
  },
  
  remove: function(key) {
    localStorage.removeItem(this.PREFIX + key);
  }
};

// ===== 深色模式 =====
var ThemeManager = {
  init: function() {
    var savedTheme = Storage.get('theme', 'light');
    this.applyTheme(savedTheme);
  },
  
  applyTheme: function(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    Storage.set('theme', theme);
  },
  
  toggle: function() {
    var isDark = document.body.classList.contains('dark-mode');
    this.applyTheme(isDark ? 'light' : 'dark');
    return !isDark;
  },
  
  isDark: function() {
    return document.body.classList.contains('dark-mode');
  }
};

// ===== 计算历史记录 =====
var HistoryManager = {
  MAX_ITEMS: 20,
  
  add: function(module, data) {
    var history = Storage.get('history_' + module, []);
    var item = {
      id: Date.now(),
      time: new Date().toLocaleString('zh-CN'),
      data: data
    };
    history.unshift(item);
    if (history.length > this.MAX_ITEMS) {
      history = history.slice(0, this.MAX_ITEMS);
    }
    Storage.set('history_' + module, history);
    return item;
  },
  
  get: function(module) {
    return Storage.get('history_' + module, []);
  },
  
  clear: function(module) {
    Storage.remove('history_' + module);
  },
  
  delete: function(module, id) {
    var history = Storage.get('history_' + module, []);
    history = history.filter(function(item) { return item.id !== id; });
    Storage.set('history_' + module, history);
  }
};

// ===== 方案保存 =====
var SchemeManager = {
  save: function(module, name, data) {
    var schemes = Storage.get('schemes_' + module, []);
    var scheme = {
      id: Date.now(),
      name: name,
      time: new Date().toLocaleString('zh-CN'),
      data: data
    };
    schemes.push(scheme);
    Storage.set('schemes_' + module, schemes);
    Toast.success('方案 "' + name + '" 已保存');
    return scheme;
  },
  
  get: function(module) {
    return Storage.get('schemes_' + module, []);
  },
  
  delete: function(module, id) {
    var schemes = Storage.get('schemes_' + module, []);
    schemes = schemes.filter(function(s) { return s.id !== id; });
    Storage.set('schemes_' + module, schemes);
    Toast.info('方案已删除');
  }
};

// ===== 数据导出 =====
var ExportUtil = {
  // 导出为 CSV
  toCSV: function(headers, rows, filename) {
    var csvContent = '\uFEFF'; // BOM for Excel
    csvContent += headers.join(',') + '\n';
    rows.forEach(function(row) {
      csvContent += row.map(function(cell) {
        if (typeof cell === 'string' && cell.indexOf(',') > -1) {
          return '"' + cell + '"';
        }
        return cell;
      }).join(',') + '\n';
    });
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },
  
  // 导出为 JSON
  toJSON: function(data, filename) {
    var jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  },
  
  downloadFile: function(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.success('文件已导出：' + filename);
  }
};

// ===== 输入验证 =====
var InputValidator = {
  validateNumber: function(input, min, max, warningMsg) {
    var val = parseFloat(input.value);
    if (isNaN(val)) return { valid: false, msg: '请输入有效数字' };
    if (min !== undefined && val < min) return { valid: false, msg: warningMsg || '数值不能小于 ' + min };
    if (max !== undefined && val > max) return { valid: false, msg: warningMsg || '数值不能大于 ' + max };
    return { valid: true };
  },
  
  warnIfAbnormal: function(input, normalMin, normalMax, fieldName) {
    var val = parseFloat(input.value);
    if (isNaN(val)) return;
    if (val < normalMin || val > normalMax) {
      Toast.warning(fieldName + ' 为 ' + val + '，可能偏离正常范围，请确认');
    }
  }
};

// ===== 工具函数 =====
function formatNumber(n, decimals) {
  decimals = decimals || 2;
  if (isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
}

function formatMoney(n) {
  return '¥' + formatNumber(n, 4);
}

function debounce(func, wait) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      func.apply(context, args);
    }, wait);
  };
}

// ===== 加载状态 =====
function showLoading(container, text) {
  text = text || '加载中...';
  var loading = document.createElement('div');
  loading.className = 'loading-overlay';
  loading.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">' + text + '</div>';
  if (container) {
    container.style.position = 'relative';
    container.appendChild(loading);
  } else {
    loading.style.position = 'fixed';
    loading.style.inset = '0';
    loading.style.background = 'rgba(255,255,255,0.8)';
    loading.style.zIndex = '9999';
    document.body.appendChild(loading);
  }
  return loading;
}

function hideLoading(loading) {
  if (loading && loading.parentNode) {
    loading.parentNode.removeChild(loading);
  }
}

// ===== 复制到剪贴板 =====
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    Toast.success('已复制到剪贴板');
  }).catch(function() {
    // 降级方案
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      Toast.success('已复制到剪贴板');
    } catch(e) {
      Toast.error('复制失败');
    }
    document.body.removeChild(textarea);
  });
}

// ===== 初始化页面通用功能 =====
function initCommonFeatures() {
  // 深色模式
  ThemeManager.init();
  
  // 数字输入框优化
  document.querySelectorAll('input[type="number"]').forEach(function(input) {
    input.addEventListener('blur', function() {
      // 输入为空时恢复默认值或最小值
      if (this.value === '' || isNaN(parseFloat(this.value))) {
        var min = parseFloat(this.min);
        if (!isNaN(min)) {
          this.value = min;
        }
      }
    });
  });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommonFeatures);
} else {
  initCommonFeatures();
}
