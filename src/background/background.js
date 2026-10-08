/**
 * Background Service Worker (Manifest V3)
 * 管理右键快捷菜单、全局快捷指令与跨标签页消息中继
 */

const MENU_ITEMS = [
  { id: 'phone', title: '手机号码' },
  { id: 'idCard', title: '合规身份证号 (GB11643)' },
  { id: 'name', title: '中文姓名' },
  { id: 'usci', title: '统一社会信用代码' },
  { id: 'bankCard', title: '银行卡号 (Luhn)' },
  { id: 'amount', title: '金额数值' },
  { id: 'email', title: '电子邮箱' },
  { id: 'companyName', title: '公司名称' },
  { id: 'address', title: '中文详细地址' },
  { id: 'date', title: '业务日期 (yyyy-MM-dd)' },
  { id: 'password', title: '强随机密码' },
  { id: 'remark', title: '测试说明/备注' }
];

// 初始化创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  // 清理可能存在的旧菜单
  chrome.contextMenus.removeAll(() => {
    // 根菜单
    chrome.contextMenus.create({
      id: 'fake-filler-root',
      title: '填充测试数据',
      contexts: ['editable']
    });

    // 逐项创建子菜单
    MENU_ITEMS.forEach(item => {
      chrome.contextMenus.create({
        id: item.id,
        parentId: 'fake-filler-root',
        title: item.title,
        contexts: ['editable']
      });
    });
  });
});

// 处理右键菜单项点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'FILL_SPECIFIC_TYPE',
      payload: { type: info.menuItemId }
    }).catch(err => {
      // 捕获目标页面未注入 content script 的情况 (如 chrome:// 页面)
      console.warn('[FakeFiller Background] Cannot send message to active tab:', err);
    });
  }
});

// 监听快捷键触发 (可在 manifest.json 中配置 commands)
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0 && tabs[0].id) {
      if (command === 'fill-all') {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'FILL_ALL' }).catch(() => {});
      } else if (command === 'clear-all') {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'CLEAR_ALL' }).catch(() => {});
      }
    }
  });
});
