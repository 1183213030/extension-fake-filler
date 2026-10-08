/**
 * Content Script 入口加载器
 * 动态引入 ES 模块，确保在免构建模式下直接享受完整的模块化开发体验
 */
(async () => {
  try {
    const mainModuleUrl = chrome.runtime.getURL('src/content/content-main.js');
    await import(mainModuleUrl);
  } catch (err) {
    console.error('[FakeFiller] Failed to load content module:', err);
  }
})();
