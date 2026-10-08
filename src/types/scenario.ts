/**
 * 测试场景与策略调度类型定义
 * Scenario-Driven Matrix (面向专业测试工程的场景化矩阵填充引擎)
 */

/**
 * 核心测试场景类型
 * - NORMAL: 正常合规业务数据
 * - BOUNDARY: 边界值（临界长度、极值、闰年、刚满18岁等）
 * - ABNORMAL: 异常注入（校验码错误、非法字符、XSS/SQL注入、格式截断等）
 * - CONCURRENCY: 并发冲突专用（预留固定标识、模拟唯一键冲突）
 * - COMPATIBILITY: 兼容性验证（大小写、全半角、生僻字、特殊控制符、新老格式等）
 */
export type TestScenarioType = 
  | 'NORMAL' 
  | 'BOUNDARY' 
  | 'ABNORMAL' 
  | 'CONCURRENCY' 
  | 'COMPATIBILITY';

/**
 * 输入控件与字段上下文信息
 */
export interface FieldContext {
  /** 目标 HTML 标签名 (如 input, textarea, select) */
  tagName?: string;
  /** 原生 input 类型 (如 text, number, tel, password) */
  type?: string;
  /** 控件 name 属性 */
  name?: string;
  /** 控件 id 属性 */
  id?: string;
  /** 占位符提示文本 */
  placeholder?: string;
  /** 绑定的属性或字段键 (如 prop, v-model, data-field) */
  prop?: string;
  /** 最大长度限制 */
  maxLength?: number;
  /** 最小长度限制 */
  minLength?: number;
  /** 最小值 (针对数值/日期) */
  min?: number | string;
  /** 最大值 (针对数值/日期) */
  max?: number | string;
  /** 正则表达式校验规则 */
  pattern?: string | RegExp;
  /** 是否为必填项 */
  required?: boolean;
  /** 步长 (针对数值/时间) */
  step?: number | string;
  /** 关联的 Label 文本 */
  label?: string;
  /** 外部传入的附加业务规则或选项池 */
  customRules?: Record<string, any>;
}

/**
 * 单次场景化生成结果
 */
export interface FieldScenarioResult {
  /** 生成的值 */
  value: string | number;
  /** 所属测试场景 */
  scenario: TestScenarioType;
  /** 针对该值的场景详细说明（如：边界值：闰年2月29日出生） */
  description: string;
  /** 附加元数据 (如期望的错误信息、校验位详情等) */
  metadata?: Record<string, any>;
}

/**
 * 字段场景化生成策略接口
 */
export interface FieldScenarioStrategy {
  /** 字段唯一标识类型 (如 idCard, usci, phone, text, number 等) */
  readonly fieldType: string;
  /** 策略人类可读名称 */
  readonly name: string;

  /**
   * 调度总入口：根据指定场景生成对应数据
   * @param scenario 测试场景类型
   * @param context 控件上下文
   */
  generate(scenario: TestScenarioType, context?: FieldContext): FieldScenarioResult;

  /** 正常数据生成 */
  generateNormal(context?: FieldContext): FieldScenarioResult;
  /** 边界值生成 */
  generateBoundary(context?: FieldContext): FieldScenarioResult;
  /** 异常数据生成 */
  generateAbnormal(context?: FieldContext): FieldScenarioResult;
  /** 并发冲突专有数据生成 */
  generateConcurrency(context?: FieldContext): FieldScenarioResult;
  /** 兼容性数据生成 */
  generateCompatibility(context?: FieldContext): FieldScenarioResult;

  /** 获取当前策略支持的所有场景列表 */
  getSupportedScenarios(): TestScenarioType[];
}

/**
 * 场景矩阵集合 (涵盖同一字段的全部场景用例)
 */
export type ScenarioMatrix = Record<TestScenarioType, FieldScenarioResult>;
