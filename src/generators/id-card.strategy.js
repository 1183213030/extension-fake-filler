/**
 * 中国居民身份证场景策略 (GB 11643-1999)
 */
import { BaseScenarioStrategy } from './base.js';
import { calculateCheckCode, DISTRICT_CODES } from '../utils/chinese-id-card.js';
export class IdCardStrategy extends BaseScenarioStrategy {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "fieldType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: IdCardStrategy.FIELD_TYPE
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '居民身份证号 (GB 11643-1999)'
        });
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new IdCardStrategy();
        }
        return this.instance;
    }
    /**
     * NORMAL: 合规行政区划 + 合法生日 + 正确校验码
     */
    generateNormal(context) {
        const region = this.pickRandom(DISTRICT_CODES);
        const startYear = 1970;
        const endYear = 2005;
        const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const order = this.randomDigits(3);
        const base17 = `${region}${year}${month}${day}${order}`;
        const checkDigit = calculateCheckCode(base17);
        const value = `${base17}${checkDigit}`;
        return this.createResult(value, 'NORMAL', `合规身份证号：${region}区划，${year}-${month}-${day} 出生，第18位校验码[${checkDigit}]正确`, { region, birthDate: `${year}${month}${day}`, checkDigit });
    }
    /**
     * BOUNDARY: 边界值
     * - 闰年 2月29日 生日 (如 2000-02-29, 2004-02-29)
     * - 刚满 18 周岁当天生日 (精确至今日往前推18年)
     * - 百岁老人生日 (今日往前推100年)
     * - 长度刚好 18 位边界
     */
    generateBoundary(context) {
        const region = this.pickRandom(DISTRICT_CODES);
        const order = this.randomDigits(3);
        const boundaryType = this.pickRandom(['LEAP_YEAR', 'EXACT_18_YEARS', 'CENTENARIAN']);
        const now = new Date();
        let birthStr = '';
        let desc = '';
        if (boundaryType === 'LEAP_YEAR') {
            const leapYears = [1980, 1984, 1988, 1992, 1996, 2000, 2004];
            const y = this.pickRandom(leapYears);
            birthStr = `${y}0229`;
            desc = `边界值：闰年2月29日出生 (${y}-02-29)，测试系统闰日校验逻辑`;
        }
        else if (boundaryType === 'EXACT_18_YEARS') {
            const targetYear = now.getFullYear() - 18;
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            birthStr = `${targetYear}${m}${d}`;
            desc = `边界值：刚满 18 周岁当天生日 (${targetYear}-${m}-${d})，测试成年临界准入校验`;
        }
        else {
            const targetYear = now.getFullYear() - 100;
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            birthStr = `${targetYear}${m}${d}`;
            desc = `边界值：百岁老人 (${targetYear}-${m}-${d})，测试高龄区间极值与出生年份跨世纪校验`;
        }
        const base17 = `${region}${birthStr}${order}`;
        const checkDigit = calculateCheckCode(base17);
        const value = `${base17}${checkDigit}`;
        return this.createResult(value, 'BOUNDARY', desc, {
            boundaryType,
            birthDate: birthStr,
            checkDigit
        });
    }
    /**
     * ABNORMAL: 异常注入
     * - 故意计算错误第 18 位校验码（如应为 X 填 1，或将计算出的校验位变更为错误字符）
     * - 格式截断 17 位
     * - 超长 19 位
     */
    generateAbnormal(context) {
        const region = this.pickRandom(DISTRICT_CODES);
        const birth = '19950520';
        const order = this.randomDigits(3);
        const base17 = `${region}${birth}${order}`;
        const correctCheckDigit = calculateCheckCode(base17);
        const errorType = this.pickRandom(['WRONG_CHECKSUM', 'TRUNCATED_17', 'OVERFLOW_19']);
        if (errorType === 'WRONG_CHECKSUM') {
            // 故意选择一个绝对不相等的校验字符
            const candidates = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X'].filter(c => c !== correctCheckDigit);
            const wrongCheckDigit = this.pickRandom(candidates);
            const value = `${base17}${wrongCheckDigit}`;
            return this.createResult(value, 'ABNORMAL', `校验码异常：第18位计算应为 [${correctCheckDigit}]，故意填入错误校验码 [${wrongCheckDigit}]`, { correctCheckDigit, wrongCheckDigit });
        }
        else if (errorType === 'TRUNCATED_17') {
            return this.createResult(base17, 'ABNORMAL', `格式截断：身份证号仅有 17 位（缺失末位校验码），测试前端防截断校验`, { length: 17 });
        }
        else {
            const value = `${base17}${correctCheckDigit}9`;
            return this.createResult(value, 'ABNORMAL', `格式超长：身份证号超长为 19 位（末尾多一位字符），测试最大长度限制与溢出拦截`, { length: 19 });
        }
    }
    /**
     * CONCURRENCY: 并发冲突专用（预留固定标识、模拟唯一键冲突）
     */
    generateConcurrency(context) {
        const CONFLICT_ID = '110101199003072378';
        return this.createResult(CONFLICT_ID, 'CONCURRENCY', '并发冲突样本：使用固定测试户籍身份证号，用于批量/并发请求触发数据库唯一索引冲突', { isFixed: true, targetKey: CONFLICT_ID });
    }
    /**
     * COMPATIBILITY: 兼容性验证
     * - 校验位末尾使用小写 'x'（旧系统或区分大小写正则适配测试）
     */
    generateCompatibility(context) {
        const region = this.pickRandom(DISTRICT_CODES);
        // 循环寻找一个校验码为 'X' 的前 17 位
        let base17 = '';
        let found = false;
        for (let i = 0; i < 100; i++) {
            const b = `${region}199${Math.floor(Math.random() * 10)}0${Math.floor(Math.random() * 9) + 1}15${this.randomDigits(3)}`;
            if (calculateCheckCode(b) === 'X') {
                base17 = b;
                found = true;
                break;
            }
        }
        if (!found) {
            base17 = '11010119900101235';
        }
        const value = `${base17}x`;
        return this.createResult(value, 'COMPATIBILITY', '兼容性样本：末位校验码采用小写 [x]（标准为大写X），测试系统是否具备大小写容错与自动大写转换机制', { originalCheck: 'X', compatibilityCheck: 'x' });
    }
}
Object.defineProperty(IdCardStrategy, "FIELD_TYPE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'idCard'
});
