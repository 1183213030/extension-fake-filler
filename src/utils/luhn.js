/**
 * 银行卡号生成器 (基于 Luhn 算法模10校验)
 */

// 常见银行卡 BIN 码 (6位前缀)
const CARD_BINS = [
  '622202', // 工商银行
  '621700', // 建设银行
  '622848', // 农业银行
  '621661', // 中国银行
  '622588', // 招商银行
  '622262', // 交通银行
  '622622', // 浦发银行
  '622908', // 广发银行
  '622700', // 建设银行龙卡
  '621226'  // 工商银行灵通卡
];

/**
 * 根据 Luhn 算法计算最后一位校验码
 * @param {string} baseDigits 除去最后一位的前序数字字符串
 * @returns {number} 最后一位校验数字
 */
export function calculateLuhnCheckDigit(baseDigits) {
  let sum = 0;
  const len = baseDigits.length;
  // 从右往左遍历（原算法从末尾开始，此时待补位相当于最右侧，因此从右至左奇偶交替）
  let doubleFlag = true;

  for (let i = len - 1; i >= 0; i--) {
    let digit = parseInt(baseDigits.charAt(i), 10);
    if (doubleFlag) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    doubleFlag = !doubleFlag;
  }

  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * 随机生成合规银行卡号 (16位或19位)
 * @param {number} [length=19] 卡号长度 (一般国内借记卡为19位，信用卡多为16位)
 * @returns {string} 符合 Luhn 算法的合规银行卡号
 */
export function generateBankCard(length = 19) {
  const bin = CARD_BINS[Math.floor(Math.random() * CARD_BINS.length)];
  let randomMiddle = '';
  const middleLength = length - bin.length - 1;

  for (let i = 0; i < middleLength; i++) {
    randomMiddle += Math.floor(Math.random() * 10).toString();
  }

  const baseDigits = `${bin}${randomMiddle}`;
  const checkDigit = calculateLuhnCheckDigit(baseDigits);

  return `${baseDigits}${checkDigit}`;
}
