/**
 * 身份证号码生成器 (符合 GB 11643-1999 标准)
 * 18位身份证号码算法实现，严格保证最后一位校验码有效
 */

// 常用行政区划代码前6位 (覆盖主要省市区)
export const DISTRICT_CODES = [
  '110101', '110105', '110108', // 北京东城、朝阳、海淀
  '120101', '120104',           // 天平和平、南开
  '310101', '310104', '310115', // 上海黄浦、徐汇、浦东
  '320102', '320508',           // 江苏南京玄武、苏州姑苏
  '330106', '330203',           // 浙江杭州西湖、宁波海曙
  '440106', '440304', '440305', // 广东广州天河、深圳福田、南山
  '420106', '420111',           // 湖北武汉武昌、洪山
  '510104', '510107',           // 四川成都锦江、武侯
  '500103', '500108',           // 重庆渝中、南岸
  '610103', '610113',           // 陕西西安碑林、雁塔
  '370102', '370202',           // 山东济南历下、青岛市南
  '210102', '210202',           // 辽宁沈阳和平、大连中山
  '350102', '350203',           // 福建福州鼓楼、厦门思明
  '430102', '430104'            // 湖南长沙芙蓉、岳麓
];

// 前17位加权因子
const ID_CARD_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

// 校验码对应表 (模11对应字符)
const ID_CARD_CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

/**
 * 计算身份证最后一位校验码
 * @param {string} base17 身份证前17位
 * @returns {string} 校验字符
 */
export function calculateCheckCode(base17) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(base17.charAt(i), 10) * ID_CARD_WEIGHTS[i];
  }
  const mod = sum % 11;
  return ID_CARD_CHECK_CODES[mod];
}

/**
 * 随机生成合规的18位二代身份证号码
 * @param {Object} options 
 * @param {number} [options.minAge=18] 最小年龄
 * @param {number} [options.maxAge=60] 最大年龄
 * @param {string} [options.gender='random'] 性别 'male' | 'female' | 'random'
 * @returns {string} 18位合规身份证号码
 */
export function generateIdCard(options = {}) {
  const { minAge = 18, maxAge = 60, gender = 'random' } = options;

  // 1. 行政区划码
  const district = DISTRICT_CODES[Math.floor(Math.random() * DISTRICT_CODES.length)];

  // 2. 出生日期 (18~60岁之间)
  const now = new Date();
  const currentYear = now.getFullYear();
  const birthYear = currentYear - Math.floor(Math.random() * (maxAge - minAge + 1)) - minAge;
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  
  // 简单计算当月最大天数
  const maxDay = new Date(birthYear, parseInt(birthMonth, 10), 0).getDate();
  const birthDay = String(Math.floor(Math.random() * maxDay) + 1).padStart(2, '0');
  const dateStr = `${birthYear}${birthMonth}${birthDay}`;

  // 3. 顺序码 (前两位随机，第三位代表性别: 奇数男、偶数女)
  const seq1 = Math.floor(Math.random() * 10);
  const seq2 = Math.floor(Math.random() * 10);
  let seq3;
  if (gender === 'male') {
    const odds = [1, 3, 5, 7, 9];
    seq3 = odds[Math.floor(Math.random() * odds.length)];
  } else if (gender === 'female') {
    const evens = [0, 2, 4, 6, 8];
    seq3 = evens[Math.floor(Math.random() * evens.length)];
  } else {
    seq3 = Math.floor(Math.random() * 10);
  }
  const seqStr = `${seq1}${seq2}${seq3}`;

  // 4. 前17位并计算第18位校验码
  const base17 = `${district}${dateStr}${seqStr}`;
  const checkCode = calculateCheckCode(base17);

  return `${base17}${checkCode}`;
}
