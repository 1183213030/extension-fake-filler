/**
 * 场景驱动测试矩阵 (Scenario-Driven Matrix) 自动化验证脚本
 * 验证 5 类测试场景在各大核心策略下的表现
 */

import { ScenarioEngine, StrategyRegistry } from '../dist-test/generators/index.js';

console.log('====================================================');
console.log('[TEST] 开始验证：场景化矩阵填充引擎 (Scenario-Driven Matrix)');
console.log('====================================================\n');

const registry = StrategyRegistry.getInstance();
const strategies = registry.getAllStrategies();
const scenarios = ['NORMAL', 'BOUNDARY', 'ABNORMAL', 'CONCURRENCY', 'COMPATIBILITY'];

let totalTests = 0;
let passedTests = 0;

for (const strategy of strategies) {
  console.log(`\n>> [策略测试] ${strategy.name} (类型: ${strategy.fieldType})`);
  
  // 1. 测试单项生成
  for (const sc of scenarios) {
    totalTests++;
    try {
      const result = strategy.generate(sc, { maxLength: 50, min: 0, max: 1000 });
      if (!result || result.value === undefined || result.value === null) {
        throw new Error(`策略 ${strategy.fieldType} 在场景 ${sc} 下返回值为空`);
      }
      if (result.scenario !== sc) {
        throw new Error(`策略 ${strategy.fieldType} 返回场景不匹配: 期望 ${sc}, 实际 ${result.scenario}`);
      }
      console.log(`  ✓ [${sc.padEnd(13)}] 值: ${String(result.value).padEnd(25)} | 说明: ${result.description}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✗ [${sc}] 验证失败:`, err.message);
    }
  }

  // 2. 测试场景全矩阵生成 (ScenarioMatrix)
  totalTests++;
  try {
    const matrix = ScenarioEngine.generateMatrix(strategy.fieldType, { maxLength: 100 });
    for (const sc of scenarios) {
      if (!matrix[sc] || matrix[sc].scenario !== sc) {
        throw new Error(`全矩阵输出缺失场景 ${sc}`);
      }
    }
    console.log(`  ✓ [MATRIX OK   ] 一键生成 5 类测试场景全矩阵成功`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [MATRIX FAIL ] 矩阵生成失败:`, err.message);
  }
}

// 3. 验证字段别名与兜底机制
console.log('\n>> [别名与调度中心验证]');
const testAliases = [
  { alias: 'idcard', expectedType: 'idCard' },
  { alias: 'creditcode', expectedType: 'usci' },
  { alias: 'mobile', expectedType: 'phone' },
  { alias: 'amount', expectedType: 'number' },
  { alias: 'unknownFieldXYZ', expectedType: 'text' } // 兜底
];

for (const item of testAliases) {
  totalTests++;
  const matched = registry.getStrategy(item.alias);
  if (matched.fieldType === item.expectedType) {
    console.log(`  ✓ 别名 [${item.alias}] 准确路由到 [${matched.fieldType}] 策略`);
    passedTests++;
  } else {
    console.error(`  ✗ 别名 [${item.alias}] 路由错误: 期望 ${item.expectedType}, 得到 ${matched.fieldType}`);
  }
}

console.log('\n====================================================');
console.log(`[PASS] 场景化矩阵测试全部完成: 共 ${totalTests} 项测试，通过 ${passedTests} 项！`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
