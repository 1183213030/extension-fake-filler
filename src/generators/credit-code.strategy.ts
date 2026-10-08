/**
 * 统一社会信用代码场景策略 (GB 32100-2015)
 */

import { BaseScenarioStrategy } from './base.js';
import { FieldContext, FieldScenarioResult } from '../types/scenario.js';
import { calculateUsciCheckCode, generateUsci } from '../utils/usci.js';

export class CreditCodeStrategy extends BaseScenarioStrategy {
  public static readonly FIELD_TYPE = 'usci';
  public readonly fieldType = CreditCodeStrategy.FIELD_TYPE;
  public readonly name = '统一社会信用代码 (GB 32100-2015)';

  private static instance: CreditCodeStrategy;
  public static getInstance(): CreditCodeStrategy {
    if (!this.instance) {
      this.instance = new CreditCodeStrategy();
    }
    return this.instance;
  }

  /**
   * NORMAL: 合规 18 位代码
   */
  public generateNormal(context?: FieldContext): FieldScenarioResult {
    const value = generateUsci();
    return this.createResult(
      value,
      'NORMAL',
      `合规统一社会信用代码：18位全大写，通过国标模31加权校验`,
      { length: 18 }
    );
  }

  /**
   * BOUNDARY: 31 进制边界字符（含 Y, 0 等端点字符）
   */
  public generateBoundary(context?: FieldContext): FieldScenarioResult {
    // GB 32100-2015 字符集: '0123456789ABCDEFGHJKLMNPQRTUWXY'
    // 字符下标: '0' 对应 0 (最小端点)，'Y' 对应 30 (最大端点)
    const boundaryType = this.pickRandom(['MIN_ZERO', 'MAX_Y', 'MIX_EXTREMES']);

    let orgCode = '';
    let desc = '';

    if (boundaryType === 'MIN_ZERO') {
      orgCode = '000000000';
      desc = '边界值：主体标识全为端点字符 [0] (31进制最小值0)，测试极限零值校验';
    } else if (boundaryType === 'MAX_Y') {
      orgCode = 'YYYYYYYYY';
      desc = '边界值：主体标识全为端点字符 [Y] (31进制最大值30)，测试极限极大字符校验';
    } else {
      orgCode = '0Y0Y0Y0Y0';
      desc = '边界值：主体标识交替由极限边界字符 [0] 与 [Y] 组成，测试极值交错场景';
    }

    const dept = '91'; // 工商企业
    const district = '110108'; // 海淀区
    const base17 = `${dept}${district}${orgCode}`;
    const checkChar = calculateUsciCheckCode(base17);
    const value = `${base17}${checkChar}`;

    return this.createResult(value, 'BOUNDARY', desc, {
      boundaryType,
      base17,
      checkChar
    });
  }

  /**
   * ABNORMAL: 异常注入
   * - 第 18 位校验码错误
   * - 包含明令排除的混淆非法字符 (I, O, Z, S, V)
   */
  public generateAbnormal(context?: FieldContext): FieldScenarioResult {
    const errorType = this.pickRandom(['FORBIDDEN_CHARS', 'WRONG_CHECKSUM', 'TRUNCATED_17']);
    const standardUsci = generateUsci();
    const base17 = standardUsci.slice(0, 17);
    const correctCheck = standardUsci.slice(17);

    if (errorType === 'FORBIDDEN_CHARS') {
      // GB 32100-2015 规定不得使用的 5 个字符: I, O, Z, S, V
      const forbiddenChar = this.pickRandom(['I', 'O', 'Z', 'S', 'V']);
      // 插入到组织机构代码部分
      const corruptedBase = base17.slice(0, 10) + forbiddenChar + base17.slice(11);
      const value = `${corruptedBase}${correctCheck}`;
      return this.createResult(
        value,
        'ABNORMAL',
        `非法混淆字符异常：代码中包含国标明令禁用的混淆字符 [${forbiddenChar}] (国标禁止I/O/Z/S/V)，测试合规字符集过滤`,
        { forbiddenChar, corruptedPosition: 11 }
      );
    } else if (errorType === 'WRONG_CHECKSUM') {
      const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY';
      const wrongCandidates = chars.split('').filter(c => c !== correctCheck);
      const wrongChar = this.pickRandom(wrongCandidates);
      const value = `${base17}${wrongChar}`;
      return this.createResult(
        value,
        'ABNORMAL',
        `校验码异常：应为 [${correctCheck}]，故意填入错误校验码 [${wrongChar}]，测试模31校验拦截`,
        { correctCheck, wrongChar }
      );
    } else {
      return this.createResult(
        base17,
        'ABNORMAL',
        '长度截断：信用代码仅17位（缺失末位），测试长度校验',
        { length: 17 }
      );
    }
  }

  /**
   * CONCURRENCY: 固定的测试税号
   */
  public generateConcurrency(context?: FieldContext): FieldScenarioResult {
    const FIXED_TAX_NO = '91110108MA0000000Y';
    return this.createResult(
      FIXED_TAX_NO,
      'CONCURRENCY',
      '并发冲突样本：使用固定测试企业统一社会信用代码，用于模拟重复建档或税号唯一索引冲突',
      { isFixed: true, targetKey: FIXED_TAX_NO }
    );
  }

  /**
   * COMPATIBILITY: 兼容性验证
   * - 字母全小写或混合小写（测试系统入库前是否具备 .toUpperCase() 规范化能力）
   */
  public generateCompatibility(context?: FieldContext): FieldScenarioResult {
    const normal = generateUsci();
    const lowerValue = normal.toLowerCase();
    return this.createResult(
      lowerValue,
      'COMPATIBILITY',
      '兼容性样本：全部字母使用小写（如 91110108ma...），测试系统是否支持自动清洗转大写兼容',
      { original: normal, lowercase: lowerValue }
    );
  }
}
