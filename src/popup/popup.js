/**
 * Popup 控制面板逻辑
 */

import { MockGenerator } from '../utils/mock-data.js';
import { getLucideIcon } from '../utils/lucide-icons.js';
import { ScenarioEngine } from '../generators/index.js';

let currentScenario = 'NORMAL';

const SCENARIO_LABELS = {
  NORMAL: 'NORMAL · 正常',
  BOUNDARY: 'BOUNDARY · 边界值',
  ABNORMAL: 'ABNORMAL · 异常',
  CONCURRENCY: 'CONCURRENCY · 并发',
  COMPATIBILITY: 'COMPATIBILITY · 兼容性'
};

// 数据卡片配置清单
const DATA_CARD_CONFIGS = [
  { id: 'phone', title: '手机号码', icon: 'phone', gen: () => MockGenerator.phone() },
  { id: 'idCard', title: '身份证号码 (GB11643)', icon: 'idCard', gen: () => MockGenerator.idCard() },
  { id: 'name', title: '中文姓名', icon: 'user', gen: () => MockGenerator.name() },
  { id: 'usci', title: '统一社会信用代码', icon: 'building', gen: () => MockGenerator.usci() },
  { id: 'bankCard', title: '银行卡号 (Luhn)', icon: 'creditCard', gen: () => MockGenerator.bankCard() },
  { id: 'amount', title: '测试金额', icon: 'dollar', gen: () => MockGenerator.amount() },
  { id: 'email', title: '电子邮箱', icon: 'mail', gen: () => MockGenerator.email() },
  { id: 'companyName', title: '公司名称', icon: 'building', gen: () => MockGenerator.companyName() },
  { id: 'address', title: '中文详细地址', icon: 'mapPin', gen: () => MockGenerator.address() },
  { id: 'date', title: '当前/临近日期', icon: 'calendar', gen: () => MockGenerator.date() },
  { id: 'password', title: '随机高强密码', icon: 'key', gen: () => MockGenerator.password() },
  { id: 'uuid', title: 'UUID v4', icon: 'hash', gen: () => MockGenerator.uuid() },
  { id: 'remark', title: '测试业务摘要', icon: 'fileText', gen: () => MockGenerator.remark() }
];

// 当前卡片生成的数据状态缓存
const cardStateMap = new Map();

// 初始化图标插槽
function initIcons() {
  document.getElementById('brand-icon-slot').innerHTML = getLucideIcon('wand', 18);
  document.getElementById('icon-fill-all').innerHTML = getLucideIcon('sparkles', 16);
  document.getElementById('icon-fill-empty').innerHTML = getLucideIcon('layers', 14);
  document.getElementById('icon-clear').innerHTML = getLucideIcon('trash', 14);

  document.getElementById('icon-tab-gen').innerHTML = getLucideIcon('wand', 14);
  document.getElementById('icon-tab-batch').innerHTML = getLucideIcon('layers', 14);
  document.getElementById('icon-tab-set').innerHTML = getLucideIcon('sliders', 14);

  document.getElementById('icon-btn-batch').innerHTML = getLucideIcon('play', 14);
  document.getElementById('icon-btn-copy-batch').innerHTML = getLucideIcon('copy', 14);
  document.getElementById('icon-save-settings').innerHTML = getLucideIcon('check', 14);
  document.getElementById('toast-icon').innerHTML = getLucideIcon('checkCircle', 14);
}

// 弹出全局 Toast 提示
function showToast(message) {
  const toast = document.getElementById('global-toast');
  const msgEl = document.getElementById('toast-msg');
  msgEl.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 1600);
}

// 复制文本到系统剪贴板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板');
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

// 场景驱动选择器交互
function setupScenarioSelector() {
  const pills = document.querySelectorAll('.scenario-pill');
  const tagEl = document.getElementById('active-scenario-tag');

  function setActive(sc) {
    currentScenario = sc;
    pills.forEach(p => {
      if (p.getAttribute('data-scenario') === sc) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
    if (tagEl) {
      tagEl.innerText = SCENARIO_LABELS[sc] || sc;
    }
  }

  // 读取已保存场景
  chrome.storage.local.get({ activeScenario: 'NORMAL' }, (res) => {
    if (res && res.activeScenario) {
      setActive(res.activeScenario);
    }
  });

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const sc = pill.getAttribute('data-scenario');
      setActive(sc);
      chrome.storage.local.set({ activeScenario: sc });
      showToast(`已切换至：${SCENARIO_LABELS[sc]}`);

      // 实时向当前标签页发送场景变更通知
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'SET_SCENARIO',
            payload: { scenario: sc }
          }).catch(() => {});
        }
      });
    });
  });
}

// 渲染常用数据卡片
function renderDataCards() {
  const container = document.getElementById('data-cards-grid');
  container.innerHTML = '';

  DATA_CARD_CONFIGS.forEach(item => {
    const value = item.gen();
    cardStateMap.set(item.id, value);

    const card = document.createElement('div');
    card.className = 'data-card';
    card.id = `card-${item.id}`;

    card.innerHTML = `
      <div class="data-card-left">
        <div class="data-card-icon">${getLucideIcon(item.icon, 16)}</div>
        <div class="data-card-info">
          <div class="data-card-title">${item.title}</div>
          <div class="data-card-value" id="val-${item.id}" title="${value}">${value}</div>
        </div>
      </div>
      <div class="data-card-actions">
        <button class="icon-btn btn-refresh" data-id="${item.id}" title="重新生成">
          ${getLucideIcon('refresh', 13)}
        </button>
        <button class="icon-btn btn-copy" data-id="${item.id}" title="复制">
          ${getLucideIcon('copy', 13)}
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // 绑定卡片上的刷新与复制事件
  container.addEventListener('click', (e) => {
    const refreshBtn = e.target.closest('.btn-refresh');
    if (refreshBtn) {
      const id = refreshBtn.getAttribute('data-id');
      const cfg = DATA_CARD_CONFIGS.find(c => c.id === id);
      if (cfg) {
        const newVal = cfg.gen();
        cardStateMap.set(id, newVal);
        const valEl = document.getElementById(`val-${id}`);
        if (valEl) {
          valEl.innerText = newVal;
          valEl.title = newVal;
          valEl.classList.add('flash');
          setTimeout(() => valEl.classList.remove('flash'), 400);
        }
      }
    }

    const copyBtn = e.target.closest('.btn-copy');
    if (copyBtn) {
      const id = copyBtn.getAttribute('data-id');
      const val = cardStateMap.get(id);
      if (val) {
        copyToClipboard(val);
      }
    }
  });
}

// 确保 content script 在未刷新的旧页面中也能自动注入就绪
async function ensureContentScriptInjected(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/content-bundle.js']
    });
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['src/content/content.css']
    });
    return true;
  } catch (e) {
    console.warn('[FakeCraft] Cannot auto-inject content script:', e);
    return false;
  }
}

// 向当前激活的标签页发送指令 (携带当前选中的测试场景)
async function sendTabAction(action) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showToast('未检测到活动网页');
      return;
    }

    // 浏览器内部保留页面
    const url = tab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) {
      showToast('浏览器系统保留页面不支持填充');
      return;
    }

    let res;
    const payload = { scenario: currentScenario };
    try {
      res = await chrome.tabs.sendMessage(tab.id, { action, payload });
    } catch (msgErr) {
      // 首次通信失败，说明是扩展安装前已打开的旧页面，自动执行动态热注入
      const ok = await ensureContentScriptInjected(tab.id);
      if (ok) {
        await new Promise(resolve => setTimeout(resolve, 80));
        res = await chrome.tabs.sendMessage(tab.id, { action, payload });
      } else {
        throw msgErr;
      }
    }

    if (res && res.success) {
      const tag = SCENARIO_LABELS[res.scenario || currentScenario] || '';
      if (action === 'FILL_ALL') showToast(`[${tag}] 已填充 ${res.count} 个字段`);
      if (action === 'FILL_EMPTY') showToast(`[${tag}] 已填充 ${res.count} 个空白项`);
      if (action === 'CLEAR_ALL') showToast(`已清空 ${res.count} 个表单项`);
    } else {
      showToast('未检测到可编辑字段');
    }
  } catch (err) {
    console.error('[FakeCraft Popup] sendTabAction error:', err);
    showToast('未能注入表单，请先按 F5 刷新当前网页');
  }
}

// Tab 切换逻辑
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// 批量生成模块事件 (支持按场景生成)
function setupBatchGenerator() {
  const typeSelect = document.getElementById('batch-type-select');
  const countInput = document.getElementById('batch-count-input');
  const minusBtn = document.getElementById('batch-count-minus');
  const plusBtn = document.getElementById('batch-count-plus');
  const genBtn = document.getElementById('btn-generate-batch');
  const copyBatchBtn = document.getElementById('btn-copy-batch');
  const previewTextarea = document.getElementById('batch-preview');
  const countLabel = document.getElementById('preview-count-label');

  minusBtn.addEventListener('click', () => {
    let count = parseInt(countInput.value, 10) || 10;
    if (count > 1) countInput.value = count - 1;
  });

  plusBtn.addEventListener('click', () => {
    let count = parseInt(countInput.value, 10) || 10;
    if (count < 500) countInput.value = count + 1;
  });

  genBtn.addEventListener('click', () => {
    const type = typeSelect.value;
    const count = Math.min(Math.max(parseInt(countInput.value, 10) || 10, 1), 500);
    const cfg = DATA_CARD_CONFIGS.find(c => c.id === type);
    if (!cfg) return;

    const list = [];
    for (let i = 0; i < count; i++) {
      if (currentScenario !== 'NORMAL') {
        const item = ScenarioEngine.generate(type, currentScenario);
        list.push(item.value);
      } else {
        list.push(cfg.gen());
      }
    }

    previewTextarea.value = list.join('\n');
    countLabel.innerText = `${list.length} 项 (${currentScenario})`;
    copyBatchBtn.disabled = false;
  });

  copyBatchBtn.addEventListener('click', () => {
    const text = previewTextarea.value;
    if (text) {
      copyToClipboard(text);
    }
  });
}

// 设置与偏好持久化
function setupSettings() {
  const floatSwitch = document.getElementById('setting-floating-bar');
  const minInput = document.getElementById('setting-min-amount');
  const maxInput = document.getElementById('setting-max-amount');
  const saveBtn = document.getElementById('btn-save-settings');

  // 读取已保存设置
  chrome.storage.sync.get({
    enableFloatingBar: true,
    minAmount: 100,
    maxAmount: 50000
  }, (items) => {
    floatSwitch.checked = items.enableFloatingBar;
    minInput.value = items.minAmount;
    maxInput.value = items.maxAmount;
  });

  // 拨动开关时实时生效并同步当前网页 (即时响应，零延迟)
  floatSwitch.addEventListener('change', () => {
    const enabled = floatSwitch.checked;
    chrome.storage.sync.set({ enableFloatingBar: enabled }, () => {
      showToast(enabled ? '已开启网页悬浮胶囊' : '已禁用网页悬浮胶囊');
    });

    // 实时广播给当前网页立即显示或隐藏
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'TOGGLE_FLOATING_BAR',
          payload: { enabled }
        }).catch(() => {});
      }
    });
  });

  saveBtn.addEventListener('click', () => {
    const enableFloatingBar = floatSwitch.checked;
    const minAmount = parseInt(minInput.value, 10) || 100;
    const maxAmount = parseInt(maxInput.value, 10) || 50000;

    chrome.storage.sync.set({ enableFloatingBar, minAmount, maxAmount }, () => {
      showToast('偏好配置已保存生效');
    });
  });
}

// 初始化总入口
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupScenarioSelector();
  renderDataCards();
  setupTabs();
  setupBatchGenerator();
  setupSettings();

  // 快捷页面填充按钮
  document.getElementById('btn-page-fill-all').addEventListener('click', () => sendTabAction('FILL_ALL'));
  document.getElementById('btn-page-fill-empty').addEventListener('click', () => sendTabAction('FILL_EMPTY'));
  document.getElementById('btn-page-clear').addEventListener('click', () => sendTabAction('CLEAR_ALL'));
});
