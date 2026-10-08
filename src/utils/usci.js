/**
 * 统一社会信用代码生成器 (符合 GB 32100-2015 标准)
 * 18位代码由：登记管理部门代码(1位) + 机构类别代码(1位) + 登记管理机关行政区划码(6位) + 主体标识码(组织机构代码9位) + 校验码(1位) 组成
 */

// 代码字符集：0-9 及大写字母 (不包含 I, O, S, V, Z 容易混淆的字符)
const USCI_CHARS = '0123456789ABCDEFGHJKLMNPQRTUWXY';

// 加权因子 W_i (1~17位)
const USCI_WEIGHTS = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];

// 常见登记管理部门代码与机构类别代码
const USCI_DEPT_TYPES = [
  '91', // 工商 - 企业
  '92', // 工商 - 个体工商户
  '93', // 工商 - 农民专业合作社
  '11', // 机构编制 - 机关
  '12', // 机构编制 - 事业单位
  '51', // 民政 - 社会团体
  '52', // 民政 - 民办非企业单位
  '53'  // 民政 - 基金会
];

// 行政区划代码前6位
const USCI_DISTRICTS = [
  '110108', '310115', '440305', '330106', '320102',
  '420111', '510104', '610113', '370202', '440106'
];

/**
 * 计算统一社会信用代码第18位校验码
 * @param {string} base17 前17位字符
 * @returns {string} 第18位校验字符
 */
export function calculateUsciCheckCode(base17) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = base17.charAt(i);
    const index = USCI_CHARS.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid character in USCI: ${char}`);
    }
    sum += index * USCI_WEIGHTS[i];
  }
  const mod = sum % 31;
  const checkIndex = (31 - mod) % 31;
  return USCI_CHARS.charAt(checkIndex);
}

/**
 * 随机生成合规的18位统一社会信用代码
 * @returns {string} 18位合规统一社会信用代码
 */
export function generateUsci() {
  // 1. 部门与机构类别 (2位)
  const deptType = USCI_DEPT_TYPES[Math.floor(Math.random() * USCI_DEPT_TYPES.length)];
  
  // 2. 行政区划码 (6位)
  const district = USCI_DISTRICTS[Math.floor(Math.random() * USCI_DISTRICTS.length)];
  
  // 3. 组织机构代码主体标识码 (9位随机字符，来自合法字符集)
  let orgCode = '';
  for (let i = 0; i < 9; i++) {
    const randomIndex = Math.floor(Math.random() * USCI_CHARS.length);
    orgCode += USCI_CHARS.charAt(randomIndex);
  }
  
  // 4. 计算校验位
  const base17 = `${deptType}${district}${orgCode}`;
  const checkCode = calculateUsciCheckCode(base17);
  
  return `${base17}${checkCode}`;
}
