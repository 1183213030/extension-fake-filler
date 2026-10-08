/**
 * 表单数据注入与现代前端框架穿透引擎
 * 支持原生、Vue2/Vue3 (v-model)、React (SyntheticEvent)、Angular 及各种 UI 库 (Element Plus/Antd 等)
 */

import { MockGenerator } from '../utils/mock-data.js';
import { detectFieldType, extractElementContext, extractFieldContext } from './form-detector.js';
import { ScenarioEngine } from '../generators/index.js';

/**
 * 现代前端框架穿透设值
 * @param {HTMLInputElement|HTMLTextAreaElement} element 
 * @param {string|number} value 
 */
export function setNativeValue(element, value) {
  const tagName = element.tagName.toLowerCase();
  let prototype = window.HTMLInputElement.prototype;
  if (tagName === 'textarea') {
    prototype = window.HTMLTextAreaElement.prototype;
  } else if (tagName === 'select') {
    prototype = window.HTMLSelectElement.prototype;
  }

  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  // 触发原生事件序列确保响应式数据同步
  element.dispatchEvent(new Event('focus', { bubbles: true }));
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * 给元素添加填充成功的细腻呼吸光效反馈
 * @param {HTMLElement} element 
 */
function applyHighlightEffect(element) {
  element.classList.add('fake-filler-pulse');
  setTimeout(() => {
    element.classList.remove('fake-filler-pulse');
  }, 1200);
}

/**
 * 为单个元素生成并填充数据
 * @param {HTMLElement} element 
 * @param {string} [specifiedType] 显式指定类型，如不提供则自动智能推断
 * @param {string} [scenario='NORMAL'] 测试场景类型 (NORMAL|BOUNDARY|ABNORMAL|CONCURRENCY|COMPATIBILITY)
 * @returns {boolean} 是否填充成功
 */
export function fillSingleElement(element, specifiedType, scenario = 'NORMAL') {
  if (!element || element.disabled || element.readOnly) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  const typeAttr = (element.getAttribute('type') || 'text').toLowerCase();

  // 忽略隐藏类型或按钮类型
  if (['hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(typeAttr)) {
    return false;
  }

  // 处理下拉框 (Select)
  if (tagName === 'select') {
    const options = Array.from(element.options).filter(opt => opt.value !== '' && !opt.disabled);
    if (options.length > 0) {
      const selected = options[Math.floor(Math.random() * options.length)];
      element.value = selected.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      applyHighlightEffect(element);
      return true;
    }
    return false;
  }

  // 处理复选框 / 单选框
  if (typeAttr === 'checkbox') {
    if (!element.checked) {
      element.click();
      applyHighlightEffect(element);
    }
    return true;
  }
  if (typeAttr === 'radio') {
    if (!element.checked) {
      element.click();
      applyHighlightEffect(element);
    }
    return true;
  }

  // 保护二级指标名称：若已有系统预设值 (如数量指标/时效指标/效益指标)，绝不覆盖破坏
  const td = element.closest('td, th, .el-table__cell');
  if (td) {
    const colClassMatch = (td.className || '').match(/el-table_\d+_column_\d+/);
    const elTable = td.closest('.el-table');
    if (colClassMatch && elTable) {
      const th = elTable.querySelector(`th.${colClassMatch[0]}`);
      const thText = th ? th.innerText.trim() : '';
      if ((thText === '名称' || thText.includes('二级指标')) && (element.value || '').includes('指标')) {
        return true;
      }
    }
  }

  // 明确跳过“项目属性”等外部弹窗字典字段，保持留空让用户手动点击弹窗选择真实数据
  const ph = (element.getAttribute('placeholder') || '').toLowerCase();
  const context = extractElementContext(element);
  if (context.includes('项目属性') || ph.includes('请选择项目属性') || (element.getAttribute('v-model') || '').includes('xmsx')) {
    return false;
  }

  // 提取输入控件结构化上下文
  const fieldContext = extractFieldContext(element);

  // 推断或使用指定的数据类型
  const fieldType = specifiedType || detectFieldType(element);
  if (fieldType === 'projectProperty') {
    return false;
  }

  let fakeValue = '';

  // 场景驱动矩阵引擎调度 (当启用 BOUNDARY / ABNORMAL / CONCURRENCY / COMPATIBILITY 时全场景接管)
  if (scenario && scenario !== 'NORMAL' && typeof ScenarioEngine !== 'undefined') {
    const result = ScenarioEngine.generate(fieldType, scenario, fieldContext);
    fakeValue = result && result.value !== undefined ? result.value : '';
  } else {
    // 正常场景 (NORMAL)
    switch (fieldType) {
      case 'name':
        fakeValue = MockGenerator.name();
        break;
      case 'phone':
        fakeValue = typeof ScenarioEngine !== 'undefined'
          ? ScenarioEngine.generate('phone', 'NORMAL', fieldContext).value
          : MockGenerator.phone();
        break;
      case 'idCard':
        fakeValue = typeof ScenarioEngine !== 'undefined'
          ? ScenarioEngine.generate('idCard', 'NORMAL', fieldContext).value
          : MockGenerator.idCard();
        break;
      case 'usci':
        fakeValue = typeof ScenarioEngine !== 'undefined'
          ? ScenarioEngine.generate('usci', 'NORMAL', fieldContext).value
          : MockGenerator.usci();
        break;
      case 'bankCard':
        fakeValue = MockGenerator.bankCard();
        break;
      case 'email':
        fakeValue = MockGenerator.email();
        break;
      case 'amount':
        fakeValue = MockGenerator.amount();
        break;
      case 'amountWan':
        fakeValue = MockGenerator.amount({ min: 10, max: 150, decimals: 2 });
        break;
      case 'procureContent':
        fakeValue = MockGenerator.procureContent();
        break;
      case 'procureRemark':
        fakeValue = MockGenerator.procureRemark();
        break;
      case 'indicatorName':
        fakeValue = MockGenerator.indicatorName();
        break;
      case 'indicatorUnit':
        fakeValue = MockGenerator.indicatorUnit();
        break;
      case 'indicatorValue':
        fakeValue = MockGenerator.indicatorValue();
        break;
      case 'weight':
        fakeValue = '15';
        break;
      case 'calcSymbol':
        fakeValue = MockGenerator.calcSymbol();
        break;
      case 'projectProperty':
        return false;
      case 'department':
        fakeValue = MockGenerator.department();
        break;
      case 'projectLeader':
        fakeValue = MockGenerator.projectLeader();
        break;
      case 'projectName':
        fakeValue = MockGenerator.projectName();
        break;
      case 'projectReason':
        fakeValue = MockGenerator.projectReason();
        break;
      case 'projectContent':
        fakeValue = MockGenerator.projectContent();
        break;
      case 'budgetReason':
        fakeValue = MockGenerator.budgetReason();
        break;
      case 'companyName':
        fakeValue = MockGenerator.companyName();
        break;
      case 'address':
        fakeValue = MockGenerator.address();
        break;
      case 'date':
        fakeValue = MockGenerator.date();
        break;
      case 'dateTime':
        fakeValue = MockGenerator.dateTime();
        break;
      case 'password':
        fakeValue = MockGenerator.password();
        break;
      case 'zipCode':
        fakeValue = MockGenerator.zipCode();
        break;
      case 'remark':
        fakeValue = MockGenerator.remark();
        break;
      default:
        fakeValue = MockGenerator.procureContent();
        break;
    }
  }

  setNativeValue(element, fakeValue);
  applyHighlightEffect(element);
  return true;
}

/**
 * 静默填充 Element UI 下拉选择框 (直接随机选取真实选项，100% 杜绝弹出任何下拉框)
 * 通过在宿主主世界执行，直接访问组件真实 options，并静默赋值与关闭浮层
 * @param {HTMLElement|Document} [container=document]
 * @param {boolean} [onlyEmpty=false]
 */
/**
 * 静默填充 Element UI 下拉选择框 (直接随机选取真实选项，100% 杜绝弹出任何下拉框)
 * 通过在宿主主世界执行，直接访问组件真实 options，并静默赋值与关闭浮层
 * @param {HTMLElement|Document} [container=document]
 * @param {boolean} [onlyEmpty=false]
 */
export function silentlyFillSelects(container = document, onlyEmpty = false) {
  try {
    const scriptContent = `
      (() => {
        try {
          const DEFAULT_SYMBOLS = ['≥', '＞', '=', '≤', '＜', '定性'];
          const selects = document.querySelectorAll('.el-select');
          selects.forEach(sel => {
            // 排除固定列镜像副本
            if (sel.closest('.el-table__fixed, .el-table__fixed-right, .el-table__fixed-left')) return;
            const vm = sel.__vue__;
            if (!vm) return;

            // 仅填空白项时跳过已有值
            if (${onlyEmpty} && vm.value !== '' && vm.value !== null && vm.value !== undefined) {
              return;
            }

            // 检查是否为计算符号相关列
            const cellEl = sel.closest('td, th');
            const inputEl = sel.querySelector('input');
            const isCalcSymbol = (cellEl && cellEl.className && cellEl.className.includes('jsfh')) ||
                                 (inputEl && (inputEl.placeholder || '').includes('选择'));

            // 如果原本被 mxzb === '' 暂时禁用，强制开启以完成填充
            if (vm.disabled && isCalcSymbol) {
              vm.disabled = false;
            }

            // 获取组件内部收集的真实有效 options
            const options = (vm.options || []).filter(o => !o.disabled && o.value !== '' && o.value !== null && o.value !== undefined);
            
            let chosenVal = '';
            let targetOpt = null;

            if (options.length > 0) {
              targetOpt = options[Math.floor(Math.random() * options.length)];
              chosenVal = targetOpt.value || targetOpt.label;
            } else if (isCalcSymbol) {
              // 兜底常用计算符号池
              chosenVal = DEFAULT_SYMBOLS[Math.floor(Math.random() * DEFAULT_SYMBOLS.length)];
            }

            if (chosenVal) {
              if (targetOpt && typeof vm.handleOptionSelect === 'function') {
                vm.handleOptionSelect(targetOpt, false);
              } else {
                vm.$emit('input', chosenVal);
                vm.$emit('change', chosenVal);
                if (typeof vm.emitChange === 'function') vm.emitChange(chosenVal);
              }
              // 同步更新显示文本
              const inputInner = sel.querySelector('input.el-input__inner');
              if (inputInner) {
                inputInner.value = targetOpt ? (targetOpt.label || targetOpt.value) : chosenVal;
              }
              vm.visible = false; // 严防任何下拉弹窗弹出
            }
          });

          // 兜底关闭可能展开的任何残留下拉浮层
          document.querySelectorAll('.el-select-dropdown').forEach(d => {
            d.style.display = 'none';
          });
        } catch (err) {}
      })();
    `;

    const script = document.createElement('script');
    script.textContent = scriptContent;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (e) {
    // 静默降级
  }
}

/**
 * 批量填充容器内的所有可用表单字段
 * 包含：权重分配算法、Element UI 下拉框值静默随机选择、场景化矩阵分发
 * @param {HTMLElement|Document} [container=document] 
 * @param {Object} [options]
 * @param {boolean} [options.onlyEmpty=false] 仅填充当前为空的输入项
 * @param {string} [options.scenario='NORMAL'] 测试场景类型 (NORMAL|BOUNDARY|ABNORMAL|CONCURRENCY|COMPATIBILITY)
 * @returns {number} 成功填充的字段数量
 */
export function fillAllFormElements(container = document, options = {}) {
  const { onlyEmpty = false, scenario = 'NORMAL' } = options;
  let filledCount = 0;
  const handledSet = new Set();

  // 1. 优先协同处理所有“权重(%)”输入框
  const allInputs = Array.from(container.querySelectorAll('input:not([disabled])'));
  const weightInputs = allInputs.filter(input => {
    if (input.readOnly) return false;
    // 排除固定列中的镜像副本，防止被重复计数两次导致合计减半
    if (input.closest('.el-table__fixed, .el-table__fixed-right, .el-table__fixed-left')) {
      return false;
    }
    if (input.offsetParent === null && input.type !== 'hidden') return false;
    return detectFieldType(input) === 'weight';
  });

  if (weightInputs.length > 0) {
    let weights = [];
    if (scenario === 'NORMAL') {
      weights = MockGenerator.generateWeights(weightInputs.length);
    } else if (scenario === 'BOUNDARY') {
      // 边界值测试：第一项占 100，其余全为 0
      weights = weightInputs.map((_, idx) => (idx === 0 ? '100' : '0'));
    } else if (scenario === 'ABNORMAL') {
      // 异常值测试：超限 150 或负数 -10
      weights = weightInputs.map((_, idx) => (idx === 0 ? '150' : '-10'));
    } else if (scenario === 'CONCURRENCY') {
      // 并发冲突测试：固定权重 50
      weights = weightInputs.map(() => '50');
    } else if (scenario === 'COMPATIBILITY') {
      // 兼容性测试：带百分号格式串
      weights = weightInputs.map(() => '100.00%');
    } else {
      weights = MockGenerator.generateWeights(weightInputs.length);
    }

    weightInputs.forEach((input, idx) => {
      if (onlyEmpty && (input.value || '').trim() !== '') {
        return;
      }
      setNativeValue(input, weights[idx]);
      applyHighlightEffect(input);
      handledSet.add(input);
      filledCount++;
    });
  }

  // 2. 填充常规 input、textarea 与原生 select (跳过已处理的权重输入框和固定列副本)
  const elements = container.querySelectorAll('input, textarea, select');
  elements.forEach(el => {
    if (handledSet.has(el)) return;
    // 严格过滤固定列镜像副本
    if (el.closest('.el-table__fixed, .el-table__fixed-right, .el-table__fixed-left')) return;
    if (el.disabled || el.readOnly || (el.offsetParent === null && el.type !== 'hidden')) {
      return;
    }

    if (onlyEmpty) {
      const val = (el.value || '').trim();
      if (val !== '') {
        return;
      }
    }

    const ok = fillSingleElement(el, null, scenario);
    if (ok) {
      handledSet.add(el);
      filledCount++;
    }
  });

  // 3. 静默随机填充 Element UI 下拉框 (双阶段保障，确保指标名称填完后计算符号 100% 选值)
  silentlyFillSelects(container, onlyEmpty);
  setTimeout(() => {
    silentlyFillSelects(container, onlyEmpty);
  }, 120);

  return filledCount;
}

/**
 * 一键清空容器内的所有表单字段
 * @param {HTMLElement|Document} [container=document] 
 * @returns {number} 清空的字段数
 */
export function clearAllFormElements(container = document) {
  const elements = container.querySelectorAll('input, textarea');
  let clearedCount = 0;

  elements.forEach(el => {
    if (el.disabled || el.readOnly) return;
    const typeAttr = (el.getAttribute('type') || 'text').toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(typeAttr)) return;

    if (typeAttr === 'checkbox' || typeAttr === 'radio') {
      if (el.checked) {
        el.checked = false;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        clearedCount++;
      }
    } else {
      if (el.value) {
        setNativeValue(el, '');
        clearedCount++;
      }
    }
  });

  return clearedCount;
}
