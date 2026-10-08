/**
 * 策略调度中心与场景矩阵引擎 (Scenario Engine & Strategy Registry)
 */

import {
  TestScenarioType,
  FieldContext,
  FieldScenarioResult,
  FieldScenarioStrategy,
  ScenarioMatrix
} from '../types/scenario.js';

import { IdCardStrategy } from './id-card.strategy.js';
import { CreditCodeStrategy } from './credit-code.strategy.js';
import { MobileStrategy } from './mobile.strategy.js';
import { TextStrategy } from './text.strategy.js';
import { NumberStrategy } from './number.strategy.js';

export class StrategyRegistry {
  private static instance: StrategyRegistry;
  private readonly strategies = new Map<string, FieldScenarioStrategy>();
  private readonly aliasMap = new Map<string, string>();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): StrategyRegistry {
    if (!this.instance) {
      this.instance = new StrategyRegistry();
    }
    return this.instance;
  }

  /**
   * 注册默认的 5 大核心策略
   */
  private registerDefaults(): void {
    // 1. 注册核心策略实例
    this.register(IdCardStrategy.getInstance());
    this.register(CreditCodeStrategy.getInstance());
    this.register(MobileStrategy.getInstance());
    this.register(TextStrategy.getInstance());
    this.register(NumberStrategy.getInstance());

    // 2. 映射常用别名
    this.addAlias('idcard', IdCardStrategy.FIELD_TYPE);
    this.addAlias('identitycard', IdCardStrategy.FIELD_TYPE);
    this.addAlias('certno', IdCardStrategy.FIELD_TYPE);

    this.addAlias('creditcode', CreditCodeStrategy.FIELD_TYPE);
    this.addAlias('taxno', CreditCodeStrategy.FIELD_TYPE);
    this.addAlias('tax_no', CreditCodeStrategy.FIELD_TYPE);

    this.addAlias('mobile', MobileStrategy.FIELD_TYPE);
    this.addAlias('tel', MobileStrategy.FIELD_TYPE);
    this.addAlias('telephone', MobileStrategy.FIELD_TYPE);
    this.addAlias('cellphone', MobileStrategy.FIELD_TYPE);

    this.addAlias('amount', NumberStrategy.FIELD_TYPE);
    this.addAlias('amountWan', NumberStrategy.FIELD_TYPE);
    this.addAlias('money', NumberStrategy.FIELD_TYPE);
    this.addAlias('price', NumberStrategy.FIELD_TYPE);
    this.addAlias('weight', NumberStrategy.FIELD_TYPE);
    this.addAlias('count', NumberStrategy.FIELD_TYPE);

    this.addAlias('name', TextStrategy.FIELD_TYPE);
    this.addAlias('remark', TextStrategy.FIELD_TYPE);
    this.addAlias('address', TextStrategy.FIELD_TYPE);
    this.addAlias('projectName', TextStrategy.FIELD_TYPE);
    this.addAlias('projectReason', TextStrategy.FIELD_TYPE);
    this.addAlias('projectContent', TextStrategy.FIELD_TYPE);
    this.addAlias('procureContent', TextStrategy.FIELD_TYPE);
    this.addAlias('indicatorName', TextStrategy.FIELD_TYPE);
  }

  /**
   * 注册自定义或扩展策略
   */
  public register(strategy: FieldScenarioStrategy): void {
    this.strategies.set(strategy.fieldType.toLowerCase(), strategy);
  }

  /**
   * 添加字段别名映射
   */
  public addAlias(alias: string, targetFieldType: string): void {
    this.aliasMap.set(alias.toLowerCase(), targetFieldType.toLowerCase());
  }

  /**
   * 获取匹配的策略，若无精准匹配则兜底为文本策略
   */
  public getStrategy(fieldType: string): FieldScenarioStrategy {
    const normalized = (fieldType || '').toLowerCase();
    const resolvedType = this.aliasMap.get(normalized) || normalized;

    const matched = this.strategies.get(resolvedType);
    if (matched) {
      return matched;
    }

    // 兜底文本策略
    return TextStrategy.getInstance();
  }

  /**
   * 获取所有已注册的策略列表
   */
  public getAllStrategies(): FieldScenarioStrategy[] {
    return Array.from(this.strategies.values());
  }
}

/**
 * 场景矩阵统一执行引擎
 */
export class ScenarioEngine {
  /**
   * 单次场景化生成
   * @param fieldType 字段类型标识
   * @param scenario 测试场景 (NORMAL | BOUNDARY | ABNORMAL | CONCURRENCY | COMPATIBILITY)
   * @param context 控件上下文
   */
  public static generate(
    fieldType: string,
    scenario: TestScenarioType,
    context?: FieldContext
  ): FieldScenarioResult {
    const strategy = StrategyRegistry.getInstance().getStrategy(fieldType);
    return strategy.generate(scenario, context);
  }

  /**
   * 针对指定字段一键生成 5 类测试场景全矩阵
   * @param fieldType 字段类型标识
   * @param context 控件上下文
   */
  public static generateMatrix(
    fieldType: string,
    context?: FieldContext
  ): ScenarioMatrix {
    const strategy = StrategyRegistry.getInstance().getStrategy(fieldType);
    return {
      NORMAL: strategy.generate('NORMAL', context),
      BOUNDARY: strategy.generate('BOUNDARY', context),
      ABNORMAL: strategy.generate('ABNORMAL', context),
      CONCURRENCY: strategy.generate('CONCURRENCY', context),
      COMPATIBILITY: strategy.generate('COMPATIBILITY', context)
    };
  }
}

// 导出单例与核心类供外部使用
export {
  IdCardStrategy,
  CreditCodeStrategy,
  MobileStrategy,
  TextStrategy,
  NumberStrategy
};
