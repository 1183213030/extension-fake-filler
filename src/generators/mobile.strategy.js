/**
 * 手机号码场景策略 (国内三大运营商及虚拟运营商号段)
 */
import { BaseScenarioStrategy } from './base.js';
export class MobileStrategy extends BaseScenarioStrategy {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "fieldType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: MobileStrategy.FIELD_TYPE
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '中国手机号码 (三大运营商与虚商)'
        });
        // 主流传统三大运营商号段
        Object.defineProperty(this, "STANDARD_PREFIXES", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                '134', '135', '136', '137', '138', '139', '150', '151', '152', '157', '158', '159', '182', '183', '187', '188', // 移动
                '130', '131', '132', '155', '156', '185', '186', // 联通
                '133', '153', '180', '181', '189' // 电信
            ]
        });
        // 虚拟运营商及新兴号段
        Object.defineProperty(this, "VIRTUAL_PREFIXES", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                '162', '165', '167', // 虚商移动/电信/联通
                '170', '171', // 经典虚商号段
                '192', // 中国广电 5G
                '198', // 移动新号段
                '199', // 电信新号段
                '195', '196'
            ]
        });
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new MobileStrategy();
        }
        return this.instance;
    }
    /**
     * NORMAL: 常见三大运营商合法 11 位手机号
     */
    generateNormal(context) {
        const prefix = this.pickRandom(this.STANDARD_PREFIXES);
        const suffix = this.randomDigits(8);
        const value = `${prefix}${suffix}`;
        return this.createResult(value, 'NORMAL', `合规主流手机号：${prefix} 号段 (11位标准手机号)`, { prefix, length: 11 });
    }
    /**
     * BOUNDARY: 边界值
     * - 新兴虚拟运营商及广电号段 (16x/19x/170/192)
     * - 边界长度：10 位（少一位）与 12 位（多一位）
     */
    generateBoundary(context) {
        const boundaryType = this.pickRandom(['VIRTUAL_PREFIX', 'SHORT_10', 'LONG_12']);
        if (boundaryType === 'VIRTUAL_PREFIX') {
            const prefix = this.pickRandom(this.VIRTUAL_PREFIXES);
            const suffix = this.randomDigits(8);
            const value = `${prefix}${suffix}`;
            return this.createResult(value, 'BOUNDARY', `边界值号段：新兴/虚拟运营商/广电号段 [${prefix}]，测试系统手机号白名单正则是否过于陈旧`, { prefix, isVirtualOrNew: true });
        }
        else if (boundaryType === 'SHORT_10') {
            const prefix = this.pickRandom(this.STANDARD_PREFIXES);
            const suffix = this.randomDigits(7); // 3 + 7 = 10 位
            const value = `${prefix}${suffix}`;
            return this.createResult(value, 'BOUNDARY', `边界长度：刚好 10 位手机号（缺失末位），测试下限长度与正则边界拦截`, { length: 10 });
        }
        else {
            const prefix = this.pickRandom(this.STANDARD_PREFIXES);
            const suffix = this.randomDigits(9); // 3 + 9 = 12 位
            const value = `${prefix}${suffix}`;
            return this.createResult(value, 'BOUNDARY', `边界长度：刚好 12 位手机号（多出一码），测试上限长度截断与正则边界拦截`, { length: 12 });
        }
    }
    /**
     * ABNORMAL: 异常注入
     * - 包含字母: 1380013800a
     * - 包含空格分隔符: 138 0000 0000
     * - 包含短横线: 138-0000-0000
     * - 全角数字: １３８００１３８０００
     */
    generateAbnormal(context) {
        const errorType = this.pickRandom(['CONTAINS_ALPHA', 'CONTAINS_SPACES', 'CONTAINS_HYPHEN', 'FULL_WIDTH_DIGITS']);
        if (errorType === 'CONTAINS_ALPHA') {
            const value = '1380013800a';
            return this.createResult(value, 'ABNORMAL', '非法字符异常：手机号末尾包含英文字母 [a]，测试纯数字强校验与防注入', { invalidChar: 'a' });
        }
        else if (errorType === 'CONTAINS_SPACES') {
            const value = '138 0000 0000';
            return this.createResult(value, 'ABNORMAL', '格式异常：手机号包含空格分隔符 (138 0000 0000)，测试是否阻断未格式化提交', { hasSpace: true });
        }
        else if (errorType === 'CONTAINS_HYPHEN') {
            const value = '138-0000-0000';
            return this.createResult(value, 'ABNORMAL', '格式异常：手机号包含短横杠分隔符 (138-0000-0000)，测试掩码未清洗异常', { hasHyphen: true });
        }
        else {
            // 全角数字 １３８００１３８０００
            const value = '１３８００１３８０００';
            return this.createResult(value, 'ABNORMAL', '全角字符异常：全角数字 [１３８００１３８０００]，测试输入过滤与标准化处理', { isFullWidth: true });
        }
    }
    /**
     * CONCURRENCY: 固定保留测试手机号
     */
    generateConcurrency(context) {
        const FIXED_MOBILE = '13800000000';
        return this.createResult(FIXED_MOBILE, 'CONCURRENCY', '并发冲突样本：使用固定测试手机号，用于高并发下注册/绑卡唯一性冲突验证', { isFixed: true, targetKey: FIXED_MOBILE });
    }
    /**
     * COMPATIBILITY: 兼容性验证 (国际化标准格式)
     */
    generateCompatibility(context) {
        const formatType = this.pickRandom(['PLUS_86', 'DOUBLE_ZERO_86']);
        const num = `138${this.randomDigits(8)}`;
        if (formatType === 'PLUS_86') {
            const value = `+86 ${num}`;
            return this.createResult(value, 'COMPATIBILITY', '兼容性样本：包含国际区号前缀 [+86 ]，测试系统是否支持国际化或自动去除前缀', { prefix: '+86' });
        }
        else {
            const value = `0086-${num}`;
            return this.createResult(value, 'COMPATIBILITY', '兼容性样本：包含电信国际前缀 [0086-]，测试旧通信系统号码清洗规范', { prefix: '0086-' });
        }
    }
}
Object.defineProperty(MobileStrategy, "FIELD_TYPE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'phone'
});
