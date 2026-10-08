/**
 * 通用文本场景策略 (覆盖 XSS/SQL 注入、边界长度、全角生僻字兼容性)
 */

import { BaseScenarioStrategy } from './base.js';
import { FieldContext, FieldScenarioResult } from '../types/scenario.js';

export class TextStrategy extends BaseScenarioStrategy {
  public static readonly FIELD_TYPE = 'text';
  public readonly fieldType = TextStrategy.FIELD_TYPE;
  public readonly name = '通用文本与字符串';

  private static instance: TextStrategy;
  public static getInstance(): TextStrategy {
    if (!this.instance) {
      this.instance = new TextStrategy();
    }
    return this.instance;
  }

  private readonly NORMAL_SAMPLES = [
    '数字化校园信息化综合服务平台',
    '基于微服务架构的分布式高校财务系统升级改造工程',
    '智慧教学实验平台采购及技术支持服务',
    '高性能计算集群采购与运维保障项目',
    '大数据分析与协同决策支持中心建设项目'
  ];

  /**
   * NORMAL: 合规常规文本
   */
  public generateNormal(context?: FieldContext): FieldScenarioResult {
    const raw = this.pickRandom(this.NORMAL_SAMPLES);
    const maxLen = (context && context.maxLength) || 100;
    const value = raw.length > maxLen ? raw.slice(0, maxLen) : raw;

    return this.createResult(
      value,
      'NORMAL',
      `标准合规业务文本（长度 ${value.length} 字）`,
      { length: value.length }
    );
  }

  /**
   * BOUNDARY: 边界值
   * - 达到 maxLength 极限长度的完整字符块
   * - 最小允许长度（单字符 1位）
   */
  public generateBoundary(context?: FieldContext): FieldScenarioResult {
    const maxLen = (context && context.maxLength && context.maxLength > 0) ? context.maxLength : 255;
    const boundaryType = this.pickRandom(['MAX_LENGTH_HIT', 'MIN_SINGLE_CHAR']);

    if (boundaryType === 'MAX_LENGTH_HIT') {
      const pattern = '测试文本极限长度边界用例ABC123';
      let value = '';
      while (value.length < maxLen) {
        value += pattern;
      }
      value = value.slice(0, maxLen);
      return this.createResult(
        value,
        'BOUNDARY',
        `边界值：刚好达到输入框允许的最大极限长度 [${maxLen} 字符]，测试数据库字段长度上限拦截`,
        { targetLength: maxLen, actualLength: value.length }
      );
    } else {
      const value = 'A';
      return this.createResult(
        value,
        'BOUNDARY',
        '边界值：最小有效单字符输入 [A]，测试输入框最小边界',
        { length: 1 }
      );
    }
  }

  /**
   * ABNORMAL: 异常与安全注入测试
   * - XSS 注入样本 (<img src=x onerror=alert(1)>)
   * - SQL 注入样本 (' OR '1'='1)
   * - 特殊对象序列化残留 ([object Object], undefined, null, NaN)
   * - 纯不可见空白字符 (\t\n  )
   */
  public generateAbnormal(context?: FieldContext): FieldScenarioResult {
    const abnormalType = this.pickRandom(['XSS_INJECTION', 'SQL_INJECTION', 'OBJECT_RESIDUE', 'EMPTY_WHITESPACES']);

    if (abnormalType === 'XSS_INJECTION') {
      const xssList = [
        '<img src=x onerror=alert(1)>',
        '<script>alert("xss")</script>',
        '"><svg/onload=alert(1)>',
        'javascript:alert(1)'
      ];
      const value = this.pickRandom(xssList);
      return this.createResult(
        value,
        'ABNORMAL',
        `XSS 攻击注入测试：[${value}]，验证页面富文本防注入与转义能力`,
        { attackCategory: 'XSS' }
      );
    } else if (abnormalType === 'SQL_INJECTION') {
      const sqlList = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT null, version() --",
        "admin' --"
      ];
      const value = this.pickRandom(sqlList);
      return this.createResult(
        value,
        'ABNORMAL',
        `SQL 注入攻击探测样本：[${value}]，验证服务端参数化查询防御能力`,
        { attackCategory: 'SQLi' }
      );
    } else if (abnormalType === 'OBJECT_RESIDUE') {
      const residueList = ['[object Object]', 'undefined', 'null', 'NaN'];
      const value = this.pickRandom(residueList);
      return this.createResult(
        value,
        'ABNORMAL',
        `前端序列化残留异常：注入 [${value}]，验证后端是否对前端弱类型字符串有严格阻断`,
        { attackCategory: 'TYPE_RESIDUE' }
      );
    } else {
      const value = '   \t   \n  \u3000\u3000 ';
      return this.createResult(
        value,
        'ABNORMAL',
        '纯空白绕过测试：混合包含全角空格、半角空格与制表符换行符，验证必填校验与 Trim 逻辑',
        { isOnlyWhitespace: true }
      );
    }
  }

  /**
   * CONCURRENCY: 固定测试资源键
   */
  public generateConcurrency(context?: FieldContext): FieldScenarioResult {
    const FIXED_KEY = 'TEST_CONCURRENT_LOCK_KEY_RESOURCE_01';
    return this.createResult(
      FIXED_KEY,
      'CONCURRENCY',
      '并发冲突样本：使用固定唯一业务名称/标识键，用于模拟多线程/多客户端重复提交冲突',
      { isFixed: true, targetKey: FIXED_KEY }
    );
  }

  /**
   * COMPATIBILITY: 字符集与排版兼容性验证
   * - 4字节生僻字 (𠮷, 𩸽, 𪚥) 测试 utf8 与 utf8mb4
   * - 全角半角混排
   * - Windows 回车换行 (\r\n) 与多语言符号
   */
  public generateCompatibility(context?: FieldContext): FieldScenarioResult {
    const compatType = this.pickRandom(['SURROGATE_PAIR', 'FULL_HALF_MIX', 'CRLF_NEWLINE']);

    if (compatType === 'SURROGATE_PAIR') {
      // 4字节生僻字: 𠮷 (U+20BB7), 𩸽 (U+29E3D)
      const value = '张𠮷野𩸽（utf8mb4生僻汉字测试）';
      return this.createResult(
        value,
        'COMPATIBILITY',
        '字符集兼容性：包含 4 字节代理对生僻汉字 [𠮷, 𩸽]，测试数据库 utf8mb4 编码支持',
        { containsUtf8mb4: true }
      );
    } else if (compatType === 'FULL_HALF_MIX') {
      const value = '项目ＡＢＣ（２０２６）－第01号，【重点】';
      return this.createResult(
        value,
        'COMPATIBILITY',
        '排版兼容性：全角半角字母、数字与符号极端混排，测试文本清洗与搜索匹配兼容度',
        { isMixedWidth: true }
      );
    } else {
      const value = '第一阶段目标;\r\n第二阶段目标;\r\n第三阶段目标。';
      return this.createResult(
        value,
        'COMPATIBILITY',
        '跨平台换行符兼容性：包含 Windows 标准 \\r\\n 换行符与分号混排，测试跨系统文本换行解析',
        { hasCRLF: true }
      );
    }
  }
}
