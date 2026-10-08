/**
 * FakeCraft 扩展自包含打包脚本
 * 将核心 Mock 库、场景矩阵策略集、嗅探器、填充器和 Content Script 组合为单文件 content-bundle.js
 * 彻底消除动态 import() 带来的异步延迟与宿主页面 CSP 拦截问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 读取基础工具库源码
const idCardCode = fs.readFileSync(path.join(__dirname, 'src/utils/chinese-id-card.js'), 'utf-8');
const usciCode = fs.readFileSync(path.join(__dirname, 'src/utils/usci.js'), 'utf-8');
const luhnCode = fs.readFileSync(path.join(__dirname, 'src/utils/luhn.js'), 'utf-8');
const mockDataCode = fs.readFileSync(path.join(__dirname, 'src/utils/mock-data.js'), 'utf-8');
const iconsCode = fs.readFileSync(path.join(__dirname, 'src/utils/lucide-icons.js'), 'utf-8');

// 2. 读取场景矩阵调度引擎与核心策略源码
const baseStrategyCode = fs.readFileSync(path.join(__dirname, 'src/generators/base.js'), 'utf-8');
const idCardStrategyCode = fs.readFileSync(path.join(__dirname, 'src/generators/id-card.strategy.js'), 'utf-8');
const creditCodeStrategyCode = fs.readFileSync(path.join(__dirname, 'src/generators/credit-code.strategy.js'), 'utf-8');
const mobileStrategyCode = fs.readFileSync(path.join(__dirname, 'src/generators/mobile.strategy.js'), 'utf-8');
const textStrategyCode = fs.readFileSync(path.join(__dirname, 'src/generators/text.strategy.js'), 'utf-8');
const numberStrategyCode = fs.readFileSync(path.join(__dirname, 'src/generators/number.strategy.js'), 'utf-8');
const strategyIndexCode = fs.readFileSync(path.join(__dirname, 'src/generators/index.js'), 'utf-8');

// 3. 读取嗅探器、填充器与交互入口
const detectorCode = fs.readFileSync(path.join(__dirname, 'src/core/form-detector.js'), 'utf-8');
const fillerCode = fs.readFileSync(path.join(__dirname, 'src/core/form-filler.js'), 'utf-8');
const contentMainCode = fs.readFileSync(path.join(__dirname, 'src/content/content-main.js'), 'utf-8');

// 清理所有 export 和 import 语句，使其在单一闭包内无缝组合
function stripImportsExports(code) {
  return code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^import\s+['"].*?['"];?\s*$/gm, '')
    .replace(/export\s+class\s+/g, 'class ')
    .replace(/export\s+abstract\s+class\s+/g, 'class ')
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

  ${stripImportsExports(baseStrategyCode)}

  ${stripImportsExports(idCardStrategyCode)}

  ${stripImportsExports(creditCodeStrategyCode)}

  ${stripImportsExports(mobileStrategyCode)}

  ${stripImportsExports(textStrategyCode)}

  ${stripImportsExports(numberStrategyCode)}

  ${stripImportsExports(strategyIndexCode)}

  ${stripImportsExports(detectorCode)}

  ${stripImportsExports(fillerCode)}

  ${stripImportsExports(contentMainCode)}

  console.log('[FakeCraft] 场景化矩阵填充引擎已就绪，当前监听指令中...');
})();
`;

fs.writeFileSync(path.join(__dirname, 'src/content/content-bundle.js'), bundleContent, 'utf-8');
console.log('Successfully generated src/content/content-bundle.js with ScenarioEngine Matrix');
