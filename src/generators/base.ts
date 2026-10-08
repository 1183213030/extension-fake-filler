/**
 * 场景策略抽象基类
 * 提供公共的调度分发、随机选取与辅助工具方法
 */

import {
  TestScenarioType,
  FieldContext,
  FieldScenarioResult,
  FieldScenarioStrategy
} from '../types/scenario.js';

export abstract class BaseScenarioStrategy implements FieldScenarioStrategy {
  abstract readonly fieldType: string;
  abstract readonly name: string;

  /**
   * 调度总入口
   */
  public generate(scenario: TestScenarioType, context?: FieldContext): FieldScenarioResult {
    switch (scenario) {
      case 'NORMAL':
        return this.generateNormal(context);
      case 'BOUNDARY':
        return this.generateBoundary(context);
      case 'ABNORMAL':
        return this.generateAbnormal(context);
      case 'CONCURRENCY':
        return this.generateConcurrency(context);
      case 'COMPATIBILITY':
        return this.generateCompatibility(context);
      default:
        return this.generateNormal(context);
    }
  }

  abstract generateNormal(context?: FieldContext): FieldScenarioResult;
  abstract generateBoundary(context?: FieldContext): FieldScenarioResult;
  abstract generateAbnormal(context?: FieldContext): FieldScenarioResult;
  abstract generateConcurrency(context?: FieldContext): FieldScenarioResult;
  abstract generateCompatibility(context?: FieldContext): FieldScenarioResult;

  /**
   * 默认支持全部 5 种场景
   */
  public getSupportedScenarios(): TestScenarioType[] {
    return ['NORMAL', 'BOUNDARY', 'ABNORMAL', 'CONCURRENCY', 'COMPATIBILITY'];
  }

  /**
   * 辅助工具：从数组中随机挑选一项
   */
  protected pickRandom<T>(list: T[]): T {
    if (!list || list.length === 0) {
      throw new Error('PickRandom list must not be empty');
    }
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  /**
   * 辅助工具：随机指定位数的数字串
   */
  protected randomDigits(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  /**
   * 辅助工具：构建标准返回结构
   */
  protected createResult(
    value: string | number,
    scenario: TestScenarioType,
    description: string,
    metadata?: Record<string, any>
  ): FieldScenarioResult {
    return {
      value,
      scenario,
      description,
      metadata: metadata || {}
    };
  }
}
