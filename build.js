/**
 * FakeCraft 扩展自包含打包脚本
 * 将核心 Mock 库、嗅探器、填充器和 Content Script 组合为单文件 content-bundle.js
 * 彻底消除动态 import() 带来的异步延迟与宿主页面 CSP 拦截问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取各模块源码并转换为单文件自闭包 IIFE
const idCardCode = fs.readFileSync(path.join(__dirname, 'src/utils/chinese-id-card.js'), 'utf-8');
const usciCode = fs.readFileSync(path.join(__dirname, 'src/utils/usci.js'), 'utf-8');
const luhnCode = fs.readFileSync(path.join(__dirname, 'src/utils/luhn.js'), 'utf-8');
const mockDataCode = fs.readFileSync(path.join(__dirname, 'src/utils/mock-data.js'), 'utf-8');
const iconsCode = fs.readFileSync(path.join(__dirname, 'src/utils/lucide-icons.js'), 'utf-8');
const detectorCode = fs.readFileSync(path.join(__dirname, 'src/core/form-detector.js'), 'utf-8');
const fillerCode = fs.readFileSync(path.join(__dirname, 'src/core/form-filler.js'), 'utf-8');
const contentMainCode = fs.readFileSync(path.join(__dirname, 'src/content/content-main.js'), 'utf-8');

// 清理所有 export 和 import 语句，使其在单一闭包内无缝组合
function stripImportsExports(code) {
  return code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^import\s+['"].*?['"];?\s*$/gm, '')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+let\s+/g, 'let ')
    .replace(/export\s+default\s+/g, '')
    .replace(/export\s+\{[^}]*\};?/g, '');
}

const bundleContent = `/**
 * FakeCraft Content Script 自包含独立运行时 (100% 免疫 CSP 与模块加载延迟)
 * 自动生成于: ${new Date().toISOString()}
 */
(() => {
  // 避免重复注入
  if (window.__FAKECRAFT_CONTENT_INITIALIZED__) {
    return;
  }
  window.__FAKECRAFT_CONTENT_INITIALIZED__ = true;

  ${stripImportsExports(idCardCode)}

  ${stripImportsExports(usciCode)}

  ${stripImportsExports(luhnCode)}

  ${stripImportsExports(mockDataCode)}

  ${stripImportsExports(iconsCode)}

  ${stripImportsExports(detectorCode)}

  ${stripImportsExports(fillerCode)}

  ${stripImportsExports(contentMainCode)}

  console.log('[FakeCraft] 核心引擎已成功就绪，监听表单指令中...');
})();
`;

fs.writeFileSync(path.join(__dirname, 'src/content/content-bundle.js'), bundleContent, 'utf-8');
console.log('Successfully generated src/content/content-bundle.js');
