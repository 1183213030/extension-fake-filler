/**
 * 场景策略抽象基类
 * 提供公共的调度分发、随机选取与辅助工具方法
 */
export class BaseScenarioStrategy {
    /**
     * 调度总入口
     */
    generate(scenario, context) {
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
    /**
     * 默认支持全部 5 种场景
     */
    getSupportedScenarios() {
        return ['NORMAL', 'BOUNDARY', 'ABNORMAL', 'CONCURRENCY', 'COMPATIBILITY'];
    }
    /**
     * 辅助工具：从数组中随机挑选一项
     */
    pickRandom(list) {
        if (!list || list.length === 0) {
            throw new Error('PickRandom list must not be empty');
        }
        const index = Math.floor(Math.random() * list.length);
        return list[index];
    }
    /**
     * 辅助工具：随机指定位数的数字串
     */
    randomDigits(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10).toString();
        }
        return result;
    }
    /**
     * 辅助工具：构建标准返回结构
     */
    createResult(value, scenario, description, metadata) {
        return {
            value,
            scenario,
            description,
            metadata: metadata || {}
        };
    }
}
