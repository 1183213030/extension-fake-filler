import { MockGenerator } from '../src/utils/mock-data.js';
import { calculateCheckCode } from '../src/utils/chinese-id-card.js';
import { calculateUsciCheckCode } from '../src/utils/usci.js';
import { calculateLuhnCheckDigit } from '../src/utils/luhn.js';

console.log('--- 正在验证核心算法与数据生成器 ---');

// 1. 验证身份证
for (let i = 0; i < 5; i++) {
  const idCard = MockGenerator.idCard();
  const base17 = idCard.slice(0, 17);
  const checkChar = idCard.slice(17);
  const expected = calculateCheckCode(base17);
  if (checkChar !== expected) {
    throw new Error(`身份证校验失败: ${idCard}`);
  }
}
console.log('[PASS] 身份证号码 (GB 11643-1999) 校验码算法测试通过');

// 2. 验证统一社会信用代码
for (let i = 0; i < 5; i++) {
  const usci = MockGenerator.usci();
  const base17 = usci.slice(0, 17);
  const checkChar = usci.slice(17);
  const expected = calculateUsciCheckCode(base17);
  if (checkChar !== expected) {
    throw new Error(`统一社会信用代码校验失败: ${usci}`);
  }
}
console.log('[PASS] 统一社会信用代码 (GB 32100-2015) 校验码算法测试通过');

// 3. 验证银行卡
for (let i = 0; i < 5; i++) {
  const card = MockGenerator.bankCard();
  const base = card.slice(0, -1);
  const checkDigit = parseInt(card.slice(-1), 10);
  const expected = calculateLuhnCheckDigit(base);
  if (checkDigit !== expected) {
    throw new Error(`银行卡 Luhn 校验失败: ${card}`);
  }
}
console.log('[PASS] 银行卡号 (Luhn 模10) 算法测试通过');

// 4. 验证常用数据字段生成
console.log('[SAMPLE] 中文姓名:', MockGenerator.name());
console.log('[SAMPLE] 手机号:', MockGenerator.phone());
console.log('[SAMPLE] 邮箱:', MockGenerator.email());
console.log('[SAMPLE] 金额:', MockGenerator.amount());
console.log('[SAMPLE] 公司全称:', MockGenerator.companyName());
console.log('[SAMPLE] 详细地址:', MockGenerator.address());
console.log('[SAMPLE] UUID:', MockGenerator.uuid());

console.log('--- 所有核心模块验证全部通过 ---');
