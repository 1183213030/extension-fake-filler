/**
 * Content Script 核心业务逻辑
 * 集成 Shadow DOM 悬浮控制胶囊、场景驱动矩阵选择器、右键上下文目标捕获与跨进程消息响应
 */

import { fillSingleElement, fillAllFormElements, clearAllFormElements } from '../core/form-filler.js';
import { getLucideIcon } from '../utils/lucide-icons.js';

let lastRightClickedElement = null;
let currentScenario = 'NORMAL';

const SCENARIO_META = {
  NORMAL: { code: 'NORMAL', label: '正常业务场景', tag: '标', color: '#60a5fa' },
  BOUNDARY: { code: 'BOUNDARY', label: '边界值场景', tag: '界', color: '#fbbf24' },
  ABNORMAL: { code: 'ABNORMAL', label: '异常注入场景', tag: '异', color: '#f87171' },
  CONCURRENCY: { code: 'CONCURRENCY', label: '并发冲突场景', tag: '发', color: '#c084fc' },
  COMPATIBILITY: { code: 'COMPATIBILITY', label: '系统兼容场景', tag: '容', color: '#34d399' }
};

const SCENARIO_ORDER = ['NORMAL', 'BOUNDARY', 'ABNORMAL', 'CONCURRENCY', 'COMPATIBILITY'];

// 从本地存储同步当前场景
try {
  chrome.storage.local.get({ activeScenario: 'NORMAL' }, (res) => {
    if (res && res.activeScenario && SCENARIO_META[res.activeScenario]) {
      currentScenario = res.activeScenario;
      updateCapsuleBadge();
    }
  });
} catch (e) {}

// 监听右键点击事件，记录当前点击的目标元素
document.addEventListener('contextmenu', (e) => {
  const target = e.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
    lastRightClickedElement = target;
  }
}, true);

// 监听来自 Background 和 Popup 的消息指令
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  if (action === 'SET_SCENARIO') {
    const sc = (payload && payload.scenario) || 'NORMAL';
    if (SCENARIO_META[sc]) {
      currentScenario = sc;
      updateCapsuleBadge();
      showCapsuleToast(`测试场景已切换：${SCENARIO_META[sc].label}`);
    }
    sendResponse({ success: true, scenario: currentScenario });
    return true;
  }

  if (action === 'FILL_ALL') {
    const sc = (payload && payload.scenario) || currentScenario;
    const count = fillAllFormElements(document, { onlyEmpty: false, scenario: sc });
    sendResponse({ success: true, count, scenario: sc });
    return true;
  }

  if (action === 'FILL_EMPTY') {
    const sc = (payload && payload.scenario) || currentScenario;
    const count = fillAllFormElements(document, { onlyEmpty: true, scenario: sc });
    sendResponse({ success: true, count, scenario: sc });
    return true;
  }

  if (action === 'CLEAR_ALL') {
    const count = clearAllFormElements(document);
    sendResponse({ success: true, count });
    return true;
  }

  if (action === 'FILL_SPECIFIC_TYPE') {
    // 优先填充右键命中的元素，其次当前聚焦的元素
    const target = lastRightClickedElement || document.activeElement;
    const sc = (payload && payload.scenario) || currentScenario;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      const ok = fillSingleElement(target, payload.type, sc);
      sendResponse({ success: ok, scenario: sc });
    } else {
      sendResponse({ success: false, reason: '未聚焦有效输入框' });
    }
    return true;
  }

  if (action === 'TOGGLE_FLOATING_BAR') {
    const { enabled } = payload || {};
    let host = document.getElementById('fake-filler-host');
    if (enabled) {
      if (!host) {
        createFloatingWidget();
        host = document.getElementById('fake-filler-host');
      }
      if (host) host.style.display = 'block';
    } else {
      if (host) host.style.display = 'none';
    }
    sendResponse({ success: true });
    return true;
  }
});

let updateCapsuleBadge = () => {};
let showCapsuleToast = () => {};

/**
 * 创建基于 Shadow DOM 的极简悬浮小工具胶囊
 * 具有完全独立的 CSS 作用域，不与宿主页面样式产生任何冲突
 */
function createFloatingWidget() {
  if (document.getElementById('fake-filler-host')) return;

  const host = document.createElement('div');
  host.id = 'fake-filler-host';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.bottom = '28px';
  host.style.right = '28px';
  host.style.pointerEvents = 'auto';

  const shadow = host.attachShadow({ mode: 'open' });

  // 胶囊组件独立样式 (Awwwards 顶级深色磨砂质感，微动效)
  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      user-select: none;
    }
    .widget-container {
      display: flex;
      align-items: center;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      padding: 5px 6px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.08);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .widget-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      position: relative;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .widget-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
    .widget-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }
    .widget-btn.primary:hover {
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
      transform: translateY(-1.5px) scale(1.04);
    }
    .widget-btn:active {
      transform: translateY(0) scale(0.96);
    }
    .scenario-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      cursor: pointer;
    }
    .scenario-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .scenario-badge {
      font-size: 11px;
      font-weight: 700;
      color: #60a5fa;
      border-radius: 4px;
      line-height: 1;
      letter-spacing: 0.5px;
      transition: color 0.2s ease;
    }
    .tooltip {
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%) translateY(4px);
      background: rgba(15, 23, 42, 0.95);
      color: #f8fafc;
      font-size: 11px;
      padding: 5px 9px;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: all 0.2s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .widget-btn:hover .tooltip {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .divider {
      width: 1px;
      height: 16px;
      background: rgba(255, 255, 255, 0.12);
      margin: 0 4px;
    }
    .badge-toast {
      position: absolute;
      bottom: 50px;
      right: 0;
      background: rgba(16, 185, 129, 0.92);
      color: #ffffff;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.25s ease;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(8px);
      white-space: nowrap;
    }
    .badge-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  const container = document.createElement('div');
  container.className = 'widget-container';

  container.innerHTML = `
    <button class="widget-btn primary" id="btn-fill-all">
      ${getLucideIcon('wand', 17)}
      <span class="tooltip" id="tip-fill-all">智能填充当前页面</span>
    </button>
    <button class="widget-btn" id="btn-fill-empty">
      ${getLucideIcon('sparkles', 15)}
      <span class="tooltip">仅填充空白字段</span>
    </button>
    <div class="divider"></div>
    <button class="widget-btn scenario-btn" id="btn-scenario-toggle">
      <span class="scenario-badge" id="scenario-badge">标</span>
      <span class="tooltip" id="scenario-tooltip">测试场景：正常业务 [点击切换]</span>
    </button>
    <div class="divider"></div>
    <button class="widget-btn" id="btn-clear-all">
      ${getLucideIcon('trash', 15)}
      <span class="tooltip">清空表单字段</span>
    </button>
    <div class="divider"></div>
    <button class="widget-btn close-btn" id="btn-close-bar">
      ${getLucideIcon('close', 13)}
      <span class="tooltip">隐藏悬浮胶囊</span>
    </button>
    <div class="badge-toast" id="toast">
      ${getLucideIcon('checkCircle', 14)}
      <span id="toast-text">已填充</span>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);
  document.body.appendChild(host);

  const toast = shadow.getElementById('toast');
  const toastText = shadow.getElementById('toast-text');
  const scenarioBadge = shadow.getElementById('scenario-badge');
  const scenarioTooltip = shadow.getElementById('scenario-tooltip');
  const tipFillAll = shadow.getElementById('tip-fill-all');

  function showToast(text) {
    toastText.innerText = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }
  showCapsuleToast = showToast;

  function updateBadge() {
    const meta = SCENARIO_META[currentScenario] || SCENARIO_META.NORMAL;
    if (scenarioBadge) {
      scenarioBadge.innerText = meta.tag;
      scenarioBadge.style.color = meta.color;
    }
    if (scenarioTooltip) {
      scenarioTooltip.innerText = `测试场景：${meta.label} [点击切换]`;
    }
    if (tipFillAll) {
      tipFillAll.innerText = `[${meta.label}] 填充当前页面`;
    }
  }
  updateCapsuleBadge = updateBadge;
  updateBadge();

  // 场景切换点击：按顺序循环切换
  shadow.getElementById('btn-scenario-toggle').addEventListener('click', () => {
    const currentIndex = SCENARIO_ORDER.indexOf(currentScenario);
    const nextIndex = (currentIndex + 1) % SCENARIO_ORDER.length;
    currentScenario = SCENARIO_ORDER[nextIndex];
    updateBadge();

    try {
      chrome.storage.local.set({ activeScenario: currentScenario });
    } catch (e) {}

    showToast(`场景已切换为：${SCENARIO_META[currentScenario].label}`);
  });

  shadow.getElementById('btn-fill-all').addEventListener('click', () => {
    const meta = SCENARIO_META[currentScenario] || SCENARIO_META.NORMAL;
    const count = fillAllFormElements(document, { onlyEmpty: false, scenario: currentScenario });
    showToast(`[${meta.tag}] 已填充 ${count} 个字段`);
  });

  shadow.getElementById('btn-fill-empty').addEventListener('click', () => {
    const meta = SCENARIO_META[currentScenario] || SCENARIO_META.NORMAL;
    const count = fillAllFormElements(document, { onlyEmpty: true, scenario: currentScenario });
    showToast(`[${meta.tag}] 已填充 ${count} 个空白项`);
  });

  shadow.getElementById('btn-clear-all').addEventListener('click', () => {
    const count = clearAllFormElements(document);
    showToast(`已清空 ${count} 个字段`);
  });

  shadow.getElementById('btn-close-bar').addEventListener('click', () => {
    host.style.display = 'none';
    try {
      chrome.storage.sync.set({ enableFloatingBar: false });
    } catch (e) {}
  });
}

// 检查配置是否启用浮动胶囊并安全渲染
try {
  chrome.storage.sync.get({ enableFloatingBar: true }, (items) => {
    const shouldEnable = (!items || chrome.runtime.lastError) ? true : items.enableFloatingBar;
    if (shouldEnable) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createFloatingWidget);
      } else {
        createFloatingWidget();
      }
    }
  });
} catch (e) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingWidget);
  } else {
    createFloatingWidget();
  }
}
