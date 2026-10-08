/**
 * 通用数字与金额数值场景策略 (覆盖安全溢出、财务精度、边界极值与格式兼容)
 */
import { BaseScenarioStrategy } from './base.js';
export class NumberStrategy extends BaseScenarioStrategy {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "fieldType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: NumberStrategy.FIELD_TYPE
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '通用数字与财务数值'
        });
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new NumberStrategy();
        }
        return this.instance;
    }
    /**
     * NORMAL: 合规标准数值
     */
    generateNormal(context) {
        let min = 10;
        let max = 10000;
        if (context && context.min !== undefined && !isNaN(Number(context.min))) {
            min = Number(context.min);
        }
        if (context && context.max !== undefined && !isNaN(Number(context.max))) {
            max = Number(context.max);
        }
        const val = (Math.random() * (max - min) + min).toFixed(2);
        return this.createResult(val, 'NORMAL', `标准合规数值：区间 [${min}, ${max}] 内的有效数值 ${val}`, { min, max, value: Number(val) });
    }
    /**
     * BOUNDARY: 边界值
     * - 0
     * - 极小正数 0.01
     * - 极小负数 -0.01
     * - JS 最大安全整数 Number.MAX_SAFE_INTEGER (9007199254740991)
     * - 边界上下文：刚好等于 context.min 或 context.max
     */
    generateBoundary(context) {
        const boundaryOptions = ['ZERO', 'MIN_POSITIVE', 'MIN_NEGATIVE', 'MAX_SAFE_INT'];
        if (context && (context.min !== undefined || context.max !== undefined)) {
            boundaryOptions.push('CONTEXT_EDGE');
        }
        const chosen = this.pickRandom(boundaryOptions);
        if (chosen === 'ZERO') {
            return this.createResult('0', 'BOUNDARY', '边界值：零值 [0]，测试业务系统对零值的除零保护与非空/正数校验', { value: 0 });
        }
        else if (chosen === 'MIN_POSITIVE') {
            return this.createResult('0.01', 'BOUNDARY', '边界值：最小正小数 [0.01] (分)，测试货币最小计数单位', { value: 0.01 });
        }
        else if (chosen === 'MIN_NEGATIVE') {
            return this.createResult('-0.01', 'BOUNDARY', '边界值：极小负数 [-0.01]，测试临界负数拦截', { value: -0.01 });
        }
        else if (chosen === 'MAX_SAFE_INT') {
            const maxSafe = String(Number.MAX_SAFE_INTEGER);
            return this.createResult(maxSafe, 'BOUNDARY', `边界值：JS 最大安全整数 [${maxSafe}]，测试数据库 BigInt/Decimal 溢出精度`, { value: Number.MAX_SAFE_INTEGER });
        }
        else {
            const edge = context && context.max !== undefined ? String(context.max) : String(context && context.min);
            return this.createResult(edge, 'BOUNDARY', `边界值：控件限定临界值 [${edge}]，测试设定的最大/最小值边界匹配`, { edge });
        }
    }
    /**
     * ABNORMAL: 异常注入
     * - 非数字字符注入: abc, 12.34.56
     * - 负数异常（在需要正数的场景）
     * - 浮点精度爆炸（超长小数）
     * - 巨大溢出数值 (1e308)
     */
    generateAbnormal(context) {
        const abnormalType = this.pickRandom(['NOT_A_NUMBER', 'MULTIPLE_DOTS', 'ILLEGAL_NEGATIVE', 'PRECISION_OVERFLOW', 'INFINITY_EXPONENT']);
        if (abnormalType === 'NOT_A_NUMBER') {
            return this.createResult('999abc', 'ABNORMAL', '非纯数字异常：在数字输入框注入字母混合串 [999abc]，测试强类型转换', { input: '999abc' });
        }
        else if (abnormalType === 'MULTIPLE_DOTS') {
            return this.createResult('12.34.56', 'ABNORMAL', '格式异常：包含多个小数点的非法数值 [12.34.56]，测试浮点解析防御', { input: '12.34.56' });
        }
        else if (abnormalType === 'ILLEGAL_NEGATIVE') {
            return this.createResult('-99999.00', 'ABNORMAL', '非法负值：违规注入负数金额 [-99999.00]，测试正向数值防御', { value: -99999 });
        }
        else if (abnormalType === 'PRECISION_OVERFLOW') {
            const longDecimals = '0.1234567890123456789';
            return this.createResult(longDecimals, 'ABNORMAL', `精度溢出：超过 18 位小数的高精度长浮点 [${longDecimals}]，测试截断与四舍五入防爆`, { decimalPlaces: 19 });
        }
        else {
            return this.createResult('1e308', 'ABNORMAL', '巨大浮点溢出：IEEE 754 极大值 [1e308]，测试服务端内存与序列化溢出防护', { exponent: 308 });
        }
    }
    /**
     * CONCURRENCY: 固定测试数值
     */
    generateConcurrency(context) {
        const FIXED_NUM = '888888';
        return this.createResult(FIXED_NUM, 'CONCURRENCY', '并发冲突样本：固定特定金额数值，用于批量对账或并发库存扣减测试', { isFixed: true, value: 888888 });
    }
    /**
     * COMPATIBILITY: 格式兼容性验证
     * - 财务千分位逗号 (1,234,567.89)
     * - 科学计数法 (1.25e4)
     * - 带前导零 (00123)
     */
    generateCompatibility(context) {
        const compatType = this.pickRandom(['THOUSANDS_SEPARATOR', 'SCIENTIFIC_NOTATION', 'LEADING_ZEROS']);
        if (compatType === 'THOUSANDS_SEPARATOR') {
            const value = '1,234,567.89';
            return this.createResult(value, 'COMPATIBILITY', '财务千分位兼容性：包含格式化逗号 [1,234,567.89]，测试前端格式化反解析能力', { format: 'currency_thousands' });
        }
        else if (compatType === 'SCIENTIFIC_NOTATION') {
            const value = '1.25e4';
            return this.createResult(value, 'COMPATIBILITY', '科学计数法兼容性：标准科学计数法表示 [1.25e4] (即 12500)，测试解析转换', { format: 'scientific' });
        }
        else {
            const value = '007520';
            return this.createResult(value, 'COMPATIBILITY', '前导零兼容性：数字包含前导零 [007520]，测试系统是否会被误判为八进制或遭自动抹除', { format: 'leading_zeros' });
        }
    }
}
Object.defineProperty(NumberStrategy, "FIELD_TYPE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'number'
});
