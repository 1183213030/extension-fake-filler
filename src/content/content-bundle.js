/**
 * FakeCraft Content Script 自包含独立运行时 (100% 免疫 CSP 与模块加载延迟)
 * 自动生成于: 2026-10-08T06:25:54.185Z
 */
(() => {
  // 避免重复注入
  if (window.__FAKECRAFT_CONTENT_INITIALIZED__) {
    return;
  }
  window.__FAKECRAFT_CONTENT_INITIALIZED__ = true;

  /**
 * 身份证号码生成器 (符合 GB 11643-1999 标准)
 * 18位身份证号码算法实现，严格保证最后一位校验码有效
 */

// 常用行政区划代码前6位 (覆盖主要省市区)
const DISTRICT_CODES = [
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
function calculateCheckCode(base17) {
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
function generateIdCard(options = {}) {
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
function calculateUsciCheckCode(base17) {
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
function generateUsci() {
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
function calculateLuhnCheckDigit(baseDigits) {
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
function generateBankCard(length = 19) {
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


  /**
 * 虚拟数据生成引擎核心
 */




// 常见百家姓
const SURNAMES = [
  '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨',
  '朱', '秦', '尤', '许', '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜',
  '戚', '谢', '邹', '喻', '柏', '水', '窦', '章', '云', '苏', '潘', '葛', '奚', '范', '彭', '郎',
  '鲁', '韦', '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', '酆', '鲍', '史', '唐',
  '费', '廉', '岑', '薛', '雷', '贺', '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常',
  '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余', '元', '卜', '顾', '孟', '平', '黄'
];

// 名字用字库
const GIVEN_NAMES_MALE = [
  '伟', '强', '勇', '军', '峰', '磊', '刚', '鹏', '杰', '涛', '超', '明', '辉', '波', '凯',
  '浩', '亮', '俊', '博', '宇', '洋', '泽', '晨', '锐', '铭', '宏', '翔', '轩', '昊', '楠'
];

const GIVEN_NAMES_FEMALE = [
  '芳', '娜', '敏', '静', '丽', '娟', '霞', '艳', '秀', '燕', '萍', '玲', '丹', '萍', '红',
  '玉', '兰', '婷', '慧', '莹', '琳', '雪', '倩', '雯', '欣', '涵', '雅', '菲', '萱', '瑶'
];

const GIVEN_NAMES_ALL = [...GIVEN_NAMES_MALE, ...GIVEN_NAMES_FEMALE];

// 常见手机号段
const PHONE_PREFIXES = [
  '130', '131', '132', '133', '135', '136', '137', '138', '139',
  '150', '151', '152', '153', '155', '156', '157', '158', '159',
  '170', '171', '173', '175', '176', '177', '178',
  '180', '181', '182', '183', '185', '186', '187', '188', '189',
  '198', '199', '166'
];

// 常用邮箱后缀
const EMAIL_DOMAINS = [
  'gmail.com', '163.com', 'qq.com', '126.com', 'outlook.com', 'foxmail.com', 'example.com'
];

// 城市列表
const CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '重庆', '西安', '苏州', '天津', '长沙', '郑州', '青岛'
];

// 区域列表
const DISTRICTS = [
  '朝阳区', '海淀区', '浦东新区', '黄浦区', '天河区', '南山区', '福田区', '西湖区', '高新区', '武侯区', '江汉区'
];

// 路名
const STREETS = [
  '创新大道', '科技南路', '和平大道', '建设路', '解放路', '中山北路', '复兴大街', '创业路', '学府街', '文化中路'
];

// 公司行业词
const INDUSTRIES = [
  '信息技术', '网络科技', '智能科技', '企业管理', '生物科技', '数据技术', '电子商务', '金融科技', '文化传媒', '供应链管理'
];

// 组织机构形式
const ORG_TYPES = [
  '有限公司', '责任有限公司', '股份有限公司', '集团有限公司'
];

// 测试备注内容库
const NOTES = [
  '系统自动化测试注入数据，用于表单流程完整性验证。',
  '本条记录为研发测试环境虚拟数据，请勿修改或用于生产操作。',
  '全量字段连通性测试，包含特殊格式与长度验证。',
  '业务场景模拟数据，已通过数据完整性与合规性校验。',
  '待审核状态流程联调专用数据，批次编号已生成。'
];

// 项目名称词库
const PROJECT_NAMES = [
  '高校智慧资产与财务一体化协同平台建设工程',
  '新一代数字校园大数据中台与多校区算力底座升级',
  '高水平交叉学科科研仪器共享及智能化管理系统',
  '面向产教融合的高校教学科研实训基地改造项目',
  '智慧校园物联网数据融合平台与能耗监控系统',
  '财务自动化对账与全流程电子凭证中台研发项目',
  '基于云计算的高校科研创新团队协同支撑平台',
  '智慧教室多媒体物联网管控及交互视讯升级项目'
];

// 立项依据词库
const PROJECT_REASONS = [
  '依据国家教育数字化转型战略与学校第十四个五年发展规划，推进业务管理系统智能化改造升级，满足多校区财务与科研业务协同管理需求。',
  '针对现有业务系统数据孤岛多、跨部门协同效率低等痛点，经校内专家论证与需求调研，亟需建设统一高效的数据共享中台。',
  '根据教育部关于加强高等学校实验室安全与科研资产数字化管理要求，进一步提升科研服务保障能力，保障高水平学科建设推进。'
];

// 项目内容词库
const PROJECT_CONTENTS = [
  '建设微服务架构业务核心底座，涵盖权限统一认证、数据自动校验、电子发票归档与多端协同审批流程，实现全流程数字化闭环管理。',
  '部署高性能计算集群节点与容器化调度平台，对接教务、科研、财务及人事核心数据流，提供实时可视化态势感知大屏与决策报表。',
  '升级多功能实验室智能化中控网关与设备监控传感节点，实现科研实验数据安全归档、仪器在线预约调配与资产折旧全周期追踪。'
];

// 预算依据词库
const BUDGET_REASONS = [
  '依据相关行业软件研发工时测算规范，结合市场三方同类产品招投标价格，经校财务处与信息化专家论证确定实施预算。',
  '参考国家政府采购标准及硬件设备官方指导价，结合实际使用并发规模与质保运维服务要求，经过严密科学测算制定。',
  '根据同类高校信息化项目建设平均投入水平，并扣减已有软硬件资产复用额度，按最小化成本原则精确编制预算分项。'
];

// 采购明细内容词库 (采购内容绝非人名)
const PROCURE_CONTENTS = [
  '高性能云计算服务器节点及存储扩容设备',
  '实验室多功能智能化中控网关与传感采集模块',
  '网络安全下一代防火墙与态势感知平台授权',
  '专业图形工作站集群与高速交换机采购',
  '数字化校园虚拟仿真教学软件系统授权',
  '教学科研实验通用耗材与仪器维保套件',
  '数据中心精密空调与不间断电源(UPS)系统'
];

// 采购明细备注词库 (备注绝非人名)
const PROCURE_NOTES = [
  '年度重点专项集中采购批次，预算已审定。',
  '原厂三年质保服务，含上门安装部署与技术支持培训。',
  '满足学科教学与科研实验高并发使用要求。',
  '经市场询价与校级专家技术论证，性价比优选。',
  '按合同约定分期验收获款，本批次首期交付。'
];

// 绩效指标名称词库 (指标名称绝非人名)
const INDICATOR_NAMES = [
  '设备采购到货与安装验收合格率',
  '系统主要功能上线运行达标率',
  '项目合同约定节点按期交付率',
  '预算资金严格合规执行控制率',
  '师生科研教学应用综合满意度',
  '仪器设备在线共享使用效益达成率',
  '节能低碳与绿色校园指标达成率',
  '信息化服务保障平稳运行率'
];

// 项目属性标准字典池 (100% 对应系统弹窗真实选项，解决弹窗点选数据合规性)
const PROJECT_PROPERTIES = [
  '[010]经常性项目',
  '[011]教育厅定额项目',
  '[012]文广旅厅二次分配项目',
  '[013]宣传部二次分配项目',
  '[014]教育厅二次分配项目',
  '[015]中央资金项目',
  '[016]年底结余项目',
  '[017]其他部门二次分配项目',
  '[035]教学单位二级经费',
  '[036]行政部门二级经费',
  '[037]专项编入日常',
  '[038]年中调整项目',
  '[039]基本户专项',
  '[040]一级经费',
  '[041]特殊指标'
];

// 归口管理部门字典池 (真实高校部门格式)
const DEPARTMENTS = [
  '[009]计划财务处',
  '[010]科学技术发展研究院',
  '[011]教务处(研究生院)',
  '[012]资产与实验室管理处',
  '[015]信息化建设办公室',
  '[013]后勤保障部'
];

// 项目负责人标准工号与姓名
const PROJECT_LEADERS = [
  '[20170011]陈秀兰',
  '[20180024]张志铭',
  '[20160035]李建华',
  '[20190048]王晓鹏',
  '[20200052]周文洁'
];

// 指标单位
const INDICATOR_UNITS = ['%', '项', '台/套', '次', '个'];

const MockGenerator = {
  /**
   * 生成合规项目属性 (从系统弹窗字典中真实选取)
   */
  projectProperty() {
    return PROJECT_PROPERTIES[Math.floor(Math.random() * PROJECT_PROPERTIES.length)];
  },

  /**
   * 生成归口管理部门
   */
  department() {
    return DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
  },

  /**
   * 生成项目负责人 (工号+姓名)
   */
  projectLeader() {
    return PROJECT_LEADERS[Math.floor(Math.random() * PROJECT_LEADERS.length)];
  },
  /**
   * 生成具体采购内容
   */
  procureContent() {
    return PROCURE_CONTENTS[Math.floor(Math.random() * PROCURE_CONTENTS.length)];
  },

  /**
   * 生成采购明细备注
   */
  procureRemark() {
    return PROCURE_NOTES[Math.floor(Math.random() * PROCURE_NOTES.length)];
  },

  /**
   * 生成绩效指标名称
   */
  indicatorName() {
    return INDICATOR_NAMES[Math.floor(Math.random() * INDICATOR_NAMES.length)];
  },

  /**
   * 生成指标单位
   */
  indicatorUnit() {
    return INDICATOR_UNITS[Math.floor(Math.random() * INDICATOR_UNITS.length)];
  },

  /**
   * 生成计算符号
   */
  calcSymbol() {
    return '≥';
  },

  /**
   * 生成指标值 (纯数字)
   */
  indicatorValue() {
    const vals = [100, 98, 95, 90, 85, 80, 50];
    return vals[Math.floor(Math.random() * vals.length)].toString();
  },

  /**
   * 生成严格合计等于 100 的权重整数数组
   * @param {number} count 权重项数量
   * @returns {number[]} 权重数组，总和严格等于 100
   */
  generateWeights(count) {
    if (count <= 0) return [];
    if (count === 1) return [100];
    if (count === 7) {
      // 常见7项绩效指标标准权重分配: 20+20+15+15+10+10+10 = 100
      return [20, 20, 15, 15, 10, 10, 10];
    }
    if (count === 5) {
      return [25, 25, 20, 15, 15];
    }
    if (count === 4) {
      return [30, 25, 25, 20];
    }

    // 通用整型均分余数分配法，确保总和严格等于 100
    const base = Math.floor(100 / count);
    const remainder = 100 % count;
    const weights = [];
    for (let i = 0; i < count; i++) {
      weights.push(i < remainder ? base + 1 : base);
    }
    return weights;
  },
  /**
   * 生成项目名称
   */
  projectName() {
    return PROJECT_NAMES[Math.floor(Math.random() * PROJECT_NAMES.length)];
  },

  /**
   * 生成立项依据
   */
  projectReason() {
    return PROJECT_REASONS[Math.floor(Math.random() * PROJECT_REASONS.length)];
  },

  /**
   * 生成项目内容
   */
  projectContent() {
    return PROJECT_CONTENTS[Math.floor(Math.random() * PROJECT_CONTENTS.length)];
  },

  /**
   * 生成预算依据
   */
  budgetReason() {
    return BUDGET_REASONS[Math.floor(Math.random() * BUDGET_REASONS.length)];
  },
  /**
   * 生成中文姓名
   * @param {'random'|'male'|'female'} [gender='random']
   * @returns {string}
   */
  name(gender = 'random') {
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    let pool = GIVEN_NAMES_ALL;
    if (gender === 'male') pool = GIVEN_NAMES_MALE;
    if (gender === 'female') pool = GIVEN_NAMES_FEMALE;

    const isDouble = Math.random() > 0.3; // 70% 概率双字名
    if (isDouble) {
      const n1 = pool[Math.floor(Math.random() * pool.length)];
      const n2 = pool[Math.floor(Math.random() * pool.length)];
      return `${surname}${n1}${n2}`;
    } else {
      const n1 = pool[Math.floor(Math.random() * pool.length)];
      return `${surname}${n1}`;
    }
  },

  /**
   * 生成合规手机号
   * @returns {string}
   */
  phone() {
    const prefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
    let suffix = '';
    for (let i = 0; i < 8; i++) {
      suffix += Math.floor(Math.random() * 10).toString();
    }
    return `${prefix}${suffix}`;
  },

  /**
   * 生成固定电话 / 座机号码 (如 010-88234567)
   */
  telephone() {
    const areaCodes = ['010', '021', '020', '0755', '0571', '028', '027', '029'];
    const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    let num = '';
    const length = area.length === 3 ? 8 : 7;
    for (let i = 0; i < length; i++) {
      num += Math.floor(Math.random() * 10).toString();
    }
    return `${area}-${num}`;
  },

  /**
   * 生成18位合规身份证号
   */
  idCard(options) {
    return generateIdCard(options);
  },

  /**
   * 生成18位合规统一社会信用代码
   */
  usci() {
    return generateUsci();
  },

  /**
   * 生成合规银行卡号
   */
  bankCard(length = 19) {
    return generateBankCard(length);
  },

  /**
   * 生成测试邮箱
   */
  email(customDomain) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let user = '';
    const len = Math.floor(Math.random() * 5) + 6; // 6-10位用户名
    for (let i = 0; i < len; i++) {
      user += chars[Math.floor(Math.random() * chars.length)];
    }
    const domain = customDomain || EMAIL_DOMAINS[Math.floor(Math.random() * EMAIL_DOMAINS.length)];
    return `${user}@${domain}`;
  },

  /**
   * 生成金额
   * @param {Object} [opts]
   * @param {number} [opts.min=100]
   * @param {number} [opts.max=50000]
   * @param {number} [opts.decimals=2]
   * @param {boolean} [opts.thousandComma=false]
   */
  amount(opts = {}) {
    const { min = 100, max = 50000, decimals = 2, thousandComma = false } = opts;
    const raw = Math.random() * (max - min) + min;
    const fixed = raw.toFixed(decimals);
    if (thousandComma) {
      const parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    return fixed;
  },

  /**
   * 生成公司名称
   */
  companyName() {
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const wordPool = ['华信', '盛世', '天成', '创享', '智联', '恒泰', '远景', '博睿', '启迪', '科诺'];
    const brand = wordPool[Math.floor(Math.random() * wordPool.length)];
    const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
    const type = ORG_TYPES[Math.floor(Math.random() * ORG_TYPES.length)];
    return `${city}${brand}${industry}${type}`;
  },

  /**
   * 生成中文完整地址
   */
  address() {
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const dist = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
    const street = STREETS[Math.floor(Math.random() * STREETS.length)];
    const room = Math.floor(Math.random() * 899) + 100;
    const building = Math.floor(Math.random() * 20) + 1;
    return `${city}市${dist}${street}${building}号楼${room}室`;
  },

  /**
   * 生成日期 (yyyy-MM-dd)
   * @param {'past'|'future'|'recent'} [range='recent']
   */
  date(range = 'recent') {
    const now = new Date();
    let targetTime = now.getTime();
    if (range === 'recent') {
      const offsetDays = Math.floor(Math.random() * 60) - 30; // -30 ~ +30天
      targetTime += offsetDays * 24 * 3600 * 1000;
    } else if (range === 'past') {
      const offsetDays = Math.floor(Math.random() * 365) + 1;
      targetTime -= offsetDays * 24 * 3600 * 1000;
    } else if (range === 'future') {
      const offsetDays = Math.floor(Math.random() * 365) + 1;
      targetTime += offsetDays * 24 * 3600 * 1000;
    }
    const d = new Date(targetTime);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /**
   * 生成日期时间 (yyyy-MM-dd HH:mm:ss)
   */
  dateTime() {
    const dStr = this.date('recent');
    const hh = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const mm = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const ss = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    return `${dStr} ${hh}:${mm}:${ss}`;
  },

  /**
   * 生成 UUID v4
   */
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * 生成 IPv4 地址
   */
  ipv4() {
    return [
      Math.floor(Math.random() * 254) + 1,
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 254) + 1
    ].join('.');
  },

  /**
   * 生成邮政编码 (6位)
   */
  zipCode() {
    const first = Math.floor(Math.random() * 8) + 1;
    let rest = '';
    for (let i = 0; i < 5; i++) {
      rest += Math.floor(Math.random() * 10).toString();
    }
    return `${first}${rest}`;
  },

  /**
   * 生成测试备注 / 文本段落
   */
  remark() {
    return NOTES[Math.floor(Math.random() * NOTES.length)];
  },

  /**
   * 生成合规强密码
   */
  password(length = 12) {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '!@#$%^&*';
    const all = uppers + lowers + numbers + specials;

    let res = [
      uppers[Math.floor(Math.random() * uppers.length)],
      lowers[Math.floor(Math.random() * lowers.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      specials[Math.floor(Math.random() * specials.length)]
    ];

    for (let i = 4; i < length; i++) {
      res.push(all[Math.floor(Math.random() * all.length)]);
    }

    return res.sort(() => Math.random() - 0.5).join('');
  }
};


  /**
 * Lucide 图标库 SVG 集合 (严禁使用任何 Emoji，统一遵循 Lucide 设计系统)
 */

const LucideIcons = {
  wand: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>`,
  
  sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
  
  copy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  
  refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  
  sliders: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></svg>`,
  
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  
  idCard: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><circle cx="7" cy="15" r="1"/></svg>`,
  
  building: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  
  creditCard: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  
  dollar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  
  mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  
  fileText: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  
  key: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-1.5 1.5L14 9l-1.5-1.5-2 2L12 11l-3 3-2-2-4 4a5 5 0 1 0 7.07 0L17 9.07l2-2 1.5 1.5 2-2Z"/></svg>`,
  
  hash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>`,

  layers: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,

  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,

  play: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,

  checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,

  close: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
};

/**
 * 获取带指定尺寸和自定义样式的 Lucide 图标 SVG
 * @param {string} name 图标名
 * @param {number} [size=16] 像素宽高
 * @param {string} [className='']
 * @returns {string} SVG HTML 字符串
 */
function getLucideIcon(name, size = 16, className = '') {
  const raw = LucideIcons[name] || LucideIcons.sparkles;
  return raw
    .replace('width="16"', `width="${size}"`)
    .replace('height="16"', `height="${size}"`)
    .replace('<svg ', `<svg class="${className}" `);
}


  /**
 * 场景策略抽象基类
 * 提供公共的调度分发、随机选取与辅助工具方法
 */
class BaseScenarioStrategy {
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


  /**
 * 中国居民身份证场景策略 (GB 11643-1999)
 */


class IdCardStrategy extends BaseScenarioStrategy {
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


  /**
 * 统一社会信用代码场景策略 (GB 32100-2015)
 */


class CreditCodeStrategy extends BaseScenarioStrategy {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "fieldType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: CreditCodeStrategy.FIELD_TYPE
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '统一社会信用代码 (GB 32100-2015)'
        });
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new CreditCodeStrategy();
        }
        return this.instance;
    }
    /**
     * NORMAL: 合规 18 位代码
     */
    generateNormal(context) {
        const value = generateUsci();
        return this.createResult(value, 'NORMAL', `合规统一社会信用代码：18位全大写，通过国标模31加权校验`, { length: 18 });
    }
    /**
     * BOUNDARY: 31 进制边界字符（含 Y, 0 等端点字符）
     */
    generateBoundary(context) {
        // GB 32100-2015 字符集: '0123456789ABCDEFGHJKLMNPQRTUWXY'
        // 字符下标: '0' 对应 0 (最小端点)，'Y' 对应 30 (最大端点)
        const boundaryType = this.pickRandom(['MIN_ZERO', 'MAX_Y', 'MIX_EXTREMES']);
        let orgCode = '';
        let desc = '';
        if (boundaryType === 'MIN_ZERO') {
            orgCode = '000000000';
            desc = '边界值：主体标识全为端点字符 [0] (31进制最小值0)，测试极限零值校验';
        }
        else if (boundaryType === 'MAX_Y') {
            orgCode = 'YYYYYYYYY';
            desc = '边界值：主体标识全为端点字符 [Y] (31进制最大值30)，测试极限极大字符校验';
        }
        else {
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
    generateAbnormal(context) {
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
            return this.createResult(value, 'ABNORMAL', `非法混淆字符异常：代码中包含国标明令禁用的混淆字符 [${forbiddenChar}] (国标禁止I/O/Z/S/V)，测试合规字符集过滤`, { forbiddenChar, corruptedPosition: 11 });
        }
        else if (errorType === 'WRONG_CHECKSUM') {
            const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY';
            const wrongCandidates = chars.split('').filter(c => c !== correctCheck);
            const wrongChar = this.pickRandom(wrongCandidates);
            const value = `${base17}${wrongChar}`;
            return this.createResult(value, 'ABNORMAL', `校验码异常：应为 [${correctCheck}]，故意填入错误校验码 [${wrongChar}]，测试模31校验拦截`, { correctCheck, wrongChar });
        }
        else {
            return this.createResult(base17, 'ABNORMAL', '长度截断：信用代码仅17位（缺失末位），测试长度校验', { length: 17 });
        }
    }
    /**
     * CONCURRENCY: 固定的测试税号
     */
    generateConcurrency(context) {
        const FIXED_TAX_NO = '91110108MA0000000Y';
        return this.createResult(FIXED_TAX_NO, 'CONCURRENCY', '并发冲突样本：使用固定测试企业统一社会信用代码，用于模拟重复建档或税号唯一索引冲突', { isFixed: true, targetKey: FIXED_TAX_NO });
    }
    /**
     * COMPATIBILITY: 兼容性验证
     * - 字母全小写或混合小写（测试系统入库前是否具备 .toUpperCase() 规范化能力）
     */
    generateCompatibility(context) {
        const normal = generateUsci();
        const lowerValue = normal.toLowerCase();
        return this.createResult(lowerValue, 'COMPATIBILITY', '兼容性样本：全部字母使用小写（如 91110108ma...），测试系统是否支持自动清洗转大写兼容', { original: normal, lowercase: lowerValue });
    }
}
Object.defineProperty(CreditCodeStrategy, "FIELD_TYPE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'usci'
});


  /**
 * 手机号码场景策略 (国内三大运营商及虚拟运营商号段)
 */

class MobileStrategy extends BaseScenarioStrategy {
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


  /**
 * 通用文本场景策略 (覆盖 XSS/SQL 注入、边界长度、全角生僻字兼容性)
 */

class TextStrategy extends BaseScenarioStrategy {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "fieldType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: TextStrategy.FIELD_TYPE
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '通用文本与字符串'
        });
        Object.defineProperty(this, "NORMAL_SAMPLES", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                '数字化校园信息化综合服务平台',
                '基于微服务架构的分布式高校财务系统升级改造工程',
                '智慧教学实验平台采购及技术支持服务',
                '高性能计算集群采购与运维保障项目',
                '大数据分析与协同决策支持中心建设项目'
            ]
        });
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new TextStrategy();
        }
        return this.instance;
    }
    /**
     * NORMAL: 合规常规文本
     */
    generateNormal(context) {
        const raw = this.pickRandom(this.NORMAL_SAMPLES);
        const maxLen = (context && context.maxLength) || 100;
        const value = raw.length > maxLen ? raw.slice(0, maxLen) : raw;
        return this.createResult(value, 'NORMAL', `标准合规业务文本（长度 ${value.length} 字）`, { length: value.length });
    }
    /**
     * BOUNDARY: 边界值
     * - 达到 maxLength 极限长度的完整字符块
     * - 最小允许长度（单字符 1位）
     */
    generateBoundary(context) {
        const maxLen = (context && context.maxLength && context.maxLength > 0) ? context.maxLength : 255;
        const boundaryType = this.pickRandom(['MAX_LENGTH_HIT', 'MIN_SINGLE_CHAR']);
        if (boundaryType === 'MAX_LENGTH_HIT') {
            const pattern = '测试文本极限长度边界用例ABC123';
            let value = '';
            while (value.length < maxLen) {
                value += pattern;
            }
            value = value.slice(0, maxLen);
            return this.createResult(value, 'BOUNDARY', `边界值：刚好达到输入框允许的最大极限长度 [${maxLen} 字符]，测试数据库字段长度上限拦截`, { targetLength: maxLen, actualLength: value.length });
        }
        else {
            const value = 'A';
            return this.createResult(value, 'BOUNDARY', '边界值：最小有效单字符输入 [A]，测试输入框最小边界', { length: 1 });
        }
    }
    /**
     * ABNORMAL: 异常与安全注入测试
     * - XSS 注入样本 (<img src=x onerror=alert(1)>)
     * - SQL 注入样本 (' OR '1'='1)
     * - 特殊对象序列化残留 ([object Object], undefined, null, NaN)
     * - 纯不可见空白字符 (\t\n  )
     */
    generateAbnormal(context) {
        const abnormalType = this.pickRandom(['XSS_INJECTION', 'SQL_INJECTION', 'OBJECT_RESIDUE', 'EMPTY_WHITESPACES']);
        if (abnormalType === 'XSS_INJECTION') {
            const xssList = [
                '<img src=x onerror=alert(1)>',
                '<script>alert("xss")</script>',
                '"><svg/onload=alert(1)>',
                'javascript:alert(1)'
            ];
            const value = this.pickRandom(xssList);
            return this.createResult(value, 'ABNORMAL', `XSS 攻击注入测试：[${value}]，验证页面富文本防注入与转义能力`, { attackCategory: 'XSS' });
        }
        else if (abnormalType === 'SQL_INJECTION') {
            const sqlList = [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "1' UNION SELECT null, version() --",
                "admin' --"
            ];
            const value = this.pickRandom(sqlList);
            return this.createResult(value, 'ABNORMAL', `SQL 注入攻击探测样本：[${value}]，验证服务端参数化查询防御能力`, { attackCategory: 'SQLi' });
        }
        else if (abnormalType === 'OBJECT_RESIDUE') {
            const residueList = ['[object Object]', 'undefined', 'null', 'NaN'];
            const value = this.pickRandom(residueList);
            return this.createResult(value, 'ABNORMAL', `前端序列化残留异常：注入 [${value}]，验证后端是否对前端弱类型字符串有严格阻断`, { attackCategory: 'TYPE_RESIDUE' });
        }
        else {
            const value = '   \t   \n  \u3000\u3000 ';
            return this.createResult(value, 'ABNORMAL', '纯空白绕过测试：混合包含全角空格、半角空格与制表符换行符，验证必填校验与 Trim 逻辑', { isOnlyWhitespace: true });
        }
    }
    /**
     * CONCURRENCY: 固定测试资源键
     */
    generateConcurrency(context) {
        const FIXED_KEY = 'TEST_CONCURRENT_LOCK_KEY_RESOURCE_01';
        return this.createResult(FIXED_KEY, 'CONCURRENCY', '并发冲突样本：使用固定唯一业务名称/标识键，用于模拟多线程/多客户端重复提交冲突', { isFixed: true, targetKey: FIXED_KEY });
    }
    /**
     * COMPATIBILITY: 字符集与排版兼容性验证
     * - 4字节生僻字 (𠮷, 𩸽, 𪚥) 测试 utf8 与 utf8mb4
     * - 全角半角混排
     * - Windows 回车换行 (\r\n) 与多语言符号
     */
    generateCompatibility(context) {
        const compatType = this.pickRandom(['SURROGATE_PAIR', 'FULL_HALF_MIX', 'CRLF_NEWLINE']);
        if (compatType === 'SURROGATE_PAIR') {
            // 4字节生僻字: 𠮷 (U+20BB7), 𩸽 (U+29E3D)
            const value = '张𠮷野𩸽（utf8mb4生僻汉字测试）';
            return this.createResult(value, 'COMPATIBILITY', '字符集兼容性：包含 4 字节代理对生僻汉字 [𠮷, 𩸽]，测试数据库 utf8mb4 编码支持', { containsUtf8mb4: true });
        }
        else if (compatType === 'FULL_HALF_MIX') {
            const value = '项目ＡＢＣ（２０２６）－第01号，【重点】';
            return this.createResult(value, 'COMPATIBILITY', '排版兼容性：全角半角字母、数字与符号极端混排，测试文本清洗与搜索匹配兼容度', { isMixedWidth: true });
        }
        else {
            const value = '第一阶段目标;\r\n第二阶段目标;\r\n第三阶段目标。';
            return this.createResult(value, 'COMPATIBILITY', '跨平台换行符兼容性：包含 Windows 标准 \\r\\n 换行符与分号混排，测试跨系统文本换行解析', { hasCRLF: true });
        }
    }
}
Object.defineProperty(TextStrategy, "FIELD_TYPE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 'text'
});


  /**
 * 通用数字与金额数值场景策略 (覆盖安全溢出、财务精度、边界极值与格式兼容)
 */

class NumberStrategy extends BaseScenarioStrategy {
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


  /**
 * 策略调度中心与场景矩阵引擎 (Scenario Engine & Strategy Registry)
 */





class StrategyRegistry {
    constructor() {
        Object.defineProperty(this, "strategies", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "aliasMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.registerDefaults();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new StrategyRegistry();
        }
        return this.instance;
    }
    /**
     * 注册默认的 5 大核心策略
     */
    registerDefaults() {
        // 1. 注册核心策略实例
        this.register(IdCardStrategy.getInstance());
        this.register(CreditCodeStrategy.getInstance());
        this.register(MobileStrategy.getInstance());
        this.register(TextStrategy.getInstance());
        this.register(NumberStrategy.getInstance());
        // 2. 映射常用别名
        this.addAlias('idcard', IdCardStrategy.FIELD_TYPE);
        this.addAlias('identitycard', IdCardStrategy.FIELD_TYPE);
        this.addAlias('certno', IdCardStrategy.FIELD_TYPE);
        this.addAlias('creditcode', CreditCodeStrategy.FIELD_TYPE);
        this.addAlias('taxno', CreditCodeStrategy.FIELD_TYPE);
        this.addAlias('tax_no', CreditCodeStrategy.FIELD_TYPE);
        this.addAlias('mobile', MobileStrategy.FIELD_TYPE);
        this.addAlias('tel', MobileStrategy.FIELD_TYPE);
        this.addAlias('telephone', MobileStrategy.FIELD_TYPE);
        this.addAlias('cellphone', MobileStrategy.FIELD_TYPE);
        this.addAlias('amount', NumberStrategy.FIELD_TYPE);
        this.addAlias('amountWan', NumberStrategy.FIELD_TYPE);
        this.addAlias('money', NumberStrategy.FIELD_TYPE);
        this.addAlias('price', NumberStrategy.FIELD_TYPE);
        this.addAlias('weight', NumberStrategy.FIELD_TYPE);
        this.addAlias('count', NumberStrategy.FIELD_TYPE);
        this.addAlias('name', TextStrategy.FIELD_TYPE);
        this.addAlias('remark', TextStrategy.FIELD_TYPE);
        this.addAlias('address', TextStrategy.FIELD_TYPE);
        this.addAlias('projectName', TextStrategy.FIELD_TYPE);
        this.addAlias('projectReason', TextStrategy.FIELD_TYPE);
        this.addAlias('projectContent', TextStrategy.FIELD_TYPE);
        this.addAlias('procureContent', TextStrategy.FIELD_TYPE);
        this.addAlias('indicatorName', TextStrategy.FIELD_TYPE);
    }
    /**
     * 注册自定义或扩展策略
     */
    register(strategy) {
        this.strategies.set(strategy.fieldType.toLowerCase(), strategy);
    }
    /**
     * 添加字段别名映射
     */
    addAlias(alias, targetFieldType) {
        this.aliasMap.set(alias.toLowerCase(), targetFieldType.toLowerCase());
    }
    /**
     * 获取匹配的策略，若无精准匹配则兜底为文本策略
     */
    getStrategy(fieldType) {
        const normalized = (fieldType || '').toLowerCase();
        const resolvedType = this.aliasMap.get(normalized) || normalized;
        const matched = this.strategies.get(resolvedType);
        if (matched) {
            return matched;
        }
        // 兜底文本策略
        return TextStrategy.getInstance();
    }
    /**
     * 获取所有已注册的策略列表
     */
    getAllStrategies() {
        return Array.from(this.strategies.values());
    }
}
/**
 * 场景矩阵统一执行引擎
 */
class ScenarioEngine {
    /**
     * 单次场景化生成
     * @param fieldType 字段类型标识
     * @param scenario 测试场景 (NORMAL | BOUNDARY | ABNORMAL | CONCURRENCY | COMPATIBILITY)
     * @param context 控件上下文
     */
    static generate(fieldType, scenario, context) {
        const strategy = StrategyRegistry.getInstance().getStrategy(fieldType);
        return strategy.generate(scenario, context);
    }
    /**
     * 针对指定字段一键生成 5 类测试场景全矩阵
     * @param fieldType 字段类型标识
     * @param context 控件上下文
     */
    static generateMatrix(fieldType, context) {
        const strategy = StrategyRegistry.getInstance().getStrategy(fieldType);
        return {
            NORMAL: strategy.generate('NORMAL', context),
            BOUNDARY: strategy.generate('BOUNDARY', context),
            ABNORMAL: strategy.generate('ABNORMAL', context),
            CONCURRENCY: strategy.generate('CONCURRENCY', context),
            COMPATIBILITY: strategy.generate('COMPATIBILITY', context)
        };
    }
}
// 导出单例与核心类供外部使用



  /**
 * 表单字段智能语义识别引擎
 * 分析 input/textarea/select 的属性、关联 label、父级表单提示文本等，精确推断字段类型
 */

const SEMANTIC_RULES = [
  {
    type: 'idCard',
    keywords: ['身份证', '证件号', '身分证', '公民身份', 'idcard', 'identitycard', 'id_card', 'idnum', 'certno', 'id_no'],
    exactRegex: /(身份证|证件号|idcard|certno)/i
  },
  {
    type: 'usci',
    keywords: ['信用代码', '社会信用', '统一信用', '纳税人识别号', '税号', '组织机构代码', 'usci', 'creditcode', 'taxpayerid', 'tax_no'],
    exactRegex: /(信用代码|税号|usci|tax_no)/i
  },
  {
    type: 'bankCard',
    keywords: ['银行卡', '卡号', '账号', '银行账号', '对公账号', 'bankcard', 'bank_card', 'bankaccount', 'accountno', 'cardno'],
    exactRegex: /(银行卡|银行账号|bankcard|bankaccount)/i
  },
  {
    type: 'phone',
    keywords: ['手机', '联系电话', '联系方式', '移动电话', '电话号码', '电话', 'mobile', 'phone', 'tel', 'cellphone', 'telephone'],
    exactRegex: /(手机|mobile|cellphone|联系电话)/i
  },
  {
    type: 'name',
    keywords: ['姓名', '名字', '联系人', '用户姓名', '真实姓名', '经办人', '负责人', '客户姓名', 'fullname', 'realname', 'truename', 'contact', 'custname'],
    exactRegex: /(姓名|联系人|fullname|realname)/i
  },
  {
    type: 'email',
    keywords: ['邮箱', '邮件', '电子邮箱', 'email', 'mail', 'e-mail'],
    exactRegex: /(邮箱|email|mail)/i
  },
  {
    type: 'amount',
    keywords: ['金额', '费用', '单价', '总价', '预算', '借方', '贷方', '报销金额', '开票金额', 'money', 'amount', 'price', 'total', 'fee', 'cost', 'budget'],
    exactRegex: /(金额|单价|总价|预算|money|amount|price)/i
  },
  {
    type: 'companyName',
    keywords: ['公司', '企业', '单位名称', '单位全称', '企业名称', '收款单位', '开票单位', '客户名称', '供应商', 'company', 'corp', 'enterprise', 'orgname'],
    exactRegex: /(公司名称|企业名称|单位名称|收款单位|开票单位|供应商)/i
  },
  {
    type: 'address',
    keywords: ['地址', '住址', '所在地', '送货地址', '收货地址', '家庭地址', '办公地址', 'address', 'addr', 'location'],
    exactRegex: /(地址|住址|address|addr)/i
  },
  {
    type: 'date',
    keywords: ['日期', '出生日期', '开工日期', '截止日期', '发生日期', '业务日期', 'date', 'birthday', 'startdate', 'enddate', 'busidate'],
    exactRegex: /(日期|date|birthday)/i
  },
  {
    type: 'dateTime',
    keywords: ['时间', '创建时间', '更新时间', '执行时间', 'datetime', 'timestamp', 'time'],
    exactRegex: /(时间|datetime|timestamp)/i
  },
  {
    type: 'password',
    keywords: ['密码', '口令', 'password', 'pwd', 'passcode'],
    exactRegex: /(密码|password|pwd)/i
  },
  {
    type: 'zipCode',
    keywords: ['邮编', '邮政编码', 'zipcode', 'postcode', 'postal'],
    exactRegex: /(邮编|zipcode|postcode)/i
  },
  {
    type: 'projectName',
    keywords: ['项目名称', '合同名称', '事项名称', '工程名称', '课题名称', '活动名称', '申报名称', 'projectname', 'itemname', 'contractname'],
    exactRegex: /(项目名称|合同名称|工程名称|课题名称)/i
  },
  {
    type: 'projectReason',
    keywords: ['立项依据', '立项理由', '申请理由', '建设背景', '业务背景', '立项背景', '政策依据', '申报依据', '项目背景'],
    exactRegex: /(立项依据|立项理由|申请理由|建设背景|立项背景)/i
  },
  {
    type: 'projectContent',
    keywords: ['项目内容', '建设内容', '实施方案', '任务内容', '工作内容', '主要内容', '研究内容'],
    exactRegex: /(项目内容|建设内容|实施方案|任务内容|主要内容)/i
  },
  {
    type: 'budgetReason',
    keywords: ['预算依据', '测算依据', '经费预算', '预算说明', '资金预算', '测算过程', '测算说明'],
    exactRegex: /(预算依据|测算依据|预算说明|经费预算)/i
  },
  {
    type: 'procureContent',
    keywords: ['采购内容', '具体采购内容', '采购标的', '采购项目', '采购物品', '设备名称', '物资名称', 'cgnr'],
    exactRegex: /(采购内容|采购标的|具体采购|cgnr)/i
  },
  {
    type: 'indicatorName',
    keywords: ['指标名称', '绩效指标名称', '明细指标', '考核指标', '指标项', 'mxzb'],
    exactRegex: /(指标名称|明细指标|mxzb)/i
  },
  {
    type: 'projectProperty',
    keywords: ['项目属性', 'xmsx', 'projectproperty', 'projectcategory'],
    exactRegex: /(项目属性|xmsx)/i
  },
  {
    type: 'department',
    keywords: ['归口管理部门', '归口部门', '管理部门', '申报部门', '所属部门', 'centralizedmanagementdepartment', 'sbbm', 'gkbm'],
    exactRegex: /(归口管理部门|归口部门|申报部门|管理部门)/i
  },
  {
    type: 'projectLeader',
    keywords: ['项目负责人', '负责人姓名', 'xmfzr'],
    exactRegex: /(项目负责人|xmfzr)/i
  },
  {
    type: 'indicatorUnit',
    keywords: ['单位', '计量单位', '指标单位', 'unit', 'jldw'],
    exactRegex: /(单位|计量单位)/i
  },
  {
    type: 'indicatorValue',
    keywords: ['指标值', '目标值', '基准值', '考核值', '标准值', 'pjbz'],
    exactRegex: /(指标值|目标值|基准值|pjbz)/i
  },
  {
    type: 'weight',
    keywords: ['权重', '权重(%)', '权重（%）', '分值', '权重占比', 'fzsd'],
    exactRegex: /(权重|fzsd)/i
  },
  {
    type: 'calcSymbol',
    keywords: ['计算符号', '运算符号', 'jsfh', 'calcsymbol'],
    exactRegex: /(计算符号|运算符号|jsfh)/i
  },
  {
    type: 'procureRemark',
    keywords: ['备注', '说明', '描述', '采购说明', '采购备注', 'bz', 'memo'],
    exactRegex: /(备注|bz|说明)/i
  },
  {
    type: 'amountWan',
    keywords: ['(万元)', '（万元）', '以万元计', '单位：万元', '万元', '申报金额', 'sbje'],
    exactRegex: /(万元|申报金额|sbje)/i
  },
  {
    type: 'remark',
    keywords: ['详情', '留言', '原因', 'remark', 'desc', 'description', 'comment', 'note', 'reason'],
    exactRegex: /(详情|留言|原因|remark|description)/i
  }
];

/**
 * 获取输入框关联的上下文文字描述 (含 Element UI 表格精准列头嗅探)
 * @param {HTMLElement} element 
 * @returns {string} 综合上下文特征词
 */
function extractElementContext(element) {
  const parts = [];

  // 1. 元素原生属性
  if (element.getAttribute('placeholder')) parts.push(element.getAttribute('placeholder'));
  if (element.getAttribute('name')) parts.push(element.getAttribute('name'));
  if (element.getAttribute('id')) parts.push(element.getAttribute('id'));
  if (element.getAttribute('aria-label')) parts.push(element.getAttribute('aria-label'));
  if (element.getAttribute('autocomplete')) parts.push(element.getAttribute('autocomplete'));
  if (element.getAttribute('title')) parts.push(element.getAttribute('title'));
  if (element.getAttribute('data-field')) parts.push(element.getAttribute('data-field'));

  // 2. 深度表格列头识别 (针对 Element UI / Ant Design / 原生表格，彻底避免多级表头错位)
  const td = element.closest('td, th, .el-table__cell');
  if (td) {
    // 2.1 检查 Element UI 的列 class 绑定 (如 el-table_1_column_3)
    const colClassMatch = (td.className || '').match(/el-table_\d+_column_\d+/);
    const elTable = td.closest('.el-table');
    if (colClassMatch && elTable) {
      // 查找对应的叶子 th 节点
      const th = elTable.querySelector(`.el-table__header-wrapper th.${colClassMatch[0]}`) || elTable.querySelector(`th.${colClassMatch[0]}`);
      if (th && th.innerText) {
        const leafText = th.innerText.trim();
        parts.push(`TABLE_HEADER:${leafText}`);
        parts.push(leafText);
      }
    }

    // 2.2 检查 vue / el-table-column 绑定的 prop 属性特征
    const columnProp = td.getAttribute('data-prop') || element.getAttribute('data-prop') || (element.getAttribute('v-model') || '');
    if (columnProp) {
      parts.push(`PROP:${columnProp}`);
    }
  }

  // 3. 关联的 <label for="...">
  if (element.id) {
    const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (label && label.innerText) {
      parts.push(label.innerText.trim());
    }
  }

  // 4. 向上查找常见 UI 框架的 Form Item Label 及表格/网格上下文
  let parent = element.parentElement;
  let depth = 0;
  while (parent && depth < 6) {
    // Element UI / Plus
    const elLabel = parent.querySelector('.el-form-item__label, .el-form-item-label');
    if (elLabel && elLabel.innerText) {
      parts.push(elLabel.innerText.trim());
      break;
    }
    // Ant Design
    const antLabel = parent.querySelector('.ant-form-item-label, .ant-form-item-label > label');
    if (antLabel && antLabel.innerText) {
      parts.push(antLabel.innerText.trim());
      break;
    }
    // 表格场景：若在 td/th 中，检查前一个 td/th
    if ((parent.tagName === 'TD' || parent.tagName === 'TH') && parent.previousElementSibling) {
      parts.push(parent.previousElementSibling.innerText.trim());
    }
    // 弹性盒/栅格场景：检查父级的前一个兄弟元素中的文本
    const prevSibling = parent.previousElementSibling;
    if (prevSibling && prevSibling.innerText && prevSibling.innerText.trim().length <= 30) {
      parts.push(prevSibling.innerText.trim());
    }
    // 表单相邻前置元素
    const prev = element.previousElementSibling;
    if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'DIV') && prev.innerText) {
      parts.push(prev.innerText.trim());
    }

    parent = parent.parentElement;
    depth++;
  }

  return parts.join(' ').toLowerCase();
}

/**
 * 智能探测元素最可能代表的数据类型
 * @param {HTMLElement} element 
 * @returns {string} 推断出的数据类型标识
 */
function detectFieldType(element) {
  const typeAttr = (element.getAttribute('type') || '').toLowerCase();
  const tagName = element.tagName.toLowerCase();

  // 根据原生 input 类型优先断定
  if (typeAttr === 'email') return 'email';
  if (typeAttr === 'tel') return 'phone';
  if (typeAttr === 'password') return 'password';
  if (typeAttr === 'date') return 'date';
  if (typeAttr === 'datetime-local') return 'dateTime';
  if (tagName === 'textarea') {
    // 文本域先检查上下文，若没有特殊语义则判定为 remark
    const context = extractElementContext(element);
    for (const rule of SEMANTIC_RULES) {
      if (rule.exactRegex.test(context)) {
        return rule.type;
      }
    }
    return 'remark';
  }

  // 提取上下文特征字符串
  const context = extractElementContext(element);

  // 逐条规则打分匹配
  let matchedType = null;
  let maxScore = 0;

  for (const rule of SEMANTIC_RULES) {
    let score = 0;
    if (rule.exactRegex.test(context)) {
      score += 10;
    }
    for (const kw of rule.keywords) {
      if (context.includes(kw.toLowerCase())) {
        score += 3;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      matchedType = rule.type;
    }
  }

  if (matchedType && maxScore >= 3) {
    return matchedType;
  }

  // 严格的人名上下文检查：只有明确包含人员相关语义词，才判定为人名
  if (/(姓名|名字|联系人|负责人|经办人|经办|申报人|申请人|fullname|realname|contact)/i.test(context)) {
    return 'name';
  }

  // 数字相关语义兜底
  if (typeAttr === 'number' || /(数|额|金额|单价|总价|预算|指标值|值|量)/i.test(context)) {
    return 'amountWan';
  }

  // 表格内部兜底
  if (element.closest('td, th, .el-table__cell')) {
    if (context.includes('内容') || context.includes('项目') || context.includes('标的')) {
      return 'procureContent';
    }
    if (context.includes('注') || context.includes('说明')) {
      return 'procureRemark';
    }
  }

  // 最终兜底：常规业务测试说明，绝非人名
  return 'procureContent';
}

/**
 * 提取输入控件结构化上下文信息 (包含属性约束与关联标签)
 * @param {HTMLElement} element 
 * @returns {Object} 结构化上下文
 */
function extractFieldContext(element) {
  if (!element) return {};
  const tagName = (element.tagName || '').toLowerCase();
  const type = (element.getAttribute('type') || (tagName === 'textarea' ? 'textarea' : 'text')).toLowerCase();
  const name = element.getAttribute('name') || '';
  const id = element.getAttribute('id') || '';
  const placeholder = element.getAttribute('placeholder') || '';
  const prop = element.getAttribute('data-prop') || element.getAttribute('v-model') || '';

  const maxLenAttr = element.getAttribute('maxlength') || element.getAttribute('max-length');
  const minLenAttr = element.getAttribute('minlength') || element.getAttribute('min-length');
  const minAttr = element.getAttribute('min');
  const maxAttr = element.getAttribute('max');
  const pattern = element.getAttribute('pattern') || '';
  const required = element.hasAttribute('required') || element.getAttribute('aria-required') === 'true';
  const step = element.getAttribute('step') || '';

  const maxLength = maxLenAttr && !isNaN(parseInt(maxLenAttr, 10)) ? parseInt(maxLenAttr, 10) : undefined;
  const minLength = minLenAttr && !isNaN(parseInt(minLenAttr, 10)) ? parseInt(minLenAttr, 10) : undefined;
  const min = minAttr !== null && minAttr !== undefined && !isNaN(Number(minAttr)) ? Number(minAttr) : undefined;
  const max = maxAttr !== null && maxAttr !== undefined && !isNaN(Number(maxAttr)) ? Number(maxAttr) : undefined;

  let labelText = '';
  if (id) {
    try {
      const lbl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (lbl && lbl.innerText) labelText = lbl.innerText.trim();
    } catch (e) {}
  }
  if (!labelText && typeof element.closest === 'function') {
    const parentFormItem = element.closest('.el-form-item, .ant-form-item');
    if (parentFormItem) {
      const lbl = parentFormItem.querySelector('.el-form-item__label, .ant-form-item-label');
      if (lbl && lbl.innerText) labelText = lbl.innerText.trim();
    }
  }

  return {
    tagName,
    type,
    name,
    id,
    placeholder,
    prop,
    maxLength,
    minLength,
    min,
    max,
    pattern,
    required,
    step,
    label: labelText
  };
}


  /**
 * 表单数据注入与现代前端框架穿透引擎
 * 支持原生、Vue2/Vue3 (v-model)、React (SyntheticEvent)、Angular 及各种 UI 库 (Element Plus/Antd 等)
 */




/**
 * 现代前端框架穿透设值
 * @param {HTMLInputElement|HTMLTextAreaElement} element 
 * @param {string|number} value 
 */
function setNativeValue(element, value) {
  const tagName = element.tagName.toLowerCase();
  let prototype = window.HTMLInputElement.prototype;
  if (tagName === 'textarea') {
    prototype = window.HTMLTextAreaElement.prototype;
  } else if (tagName === 'select') {
    prototype = window.HTMLSelectElement.prototype;
  }

  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  // 触发原生事件序列确保响应式数据同步
  element.dispatchEvent(new Event('focus', { bubbles: true }));
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * 给元素添加填充成功的细腻呼吸光效反馈
 * @param {HTMLElement} element 
 */
function applyHighlightEffect(element) {
  element.classList.add('fake-filler-pulse');
  setTimeout(() => {
    element.classList.remove('fake-filler-pulse');
  }, 1200);
}

/**
 * 为单个元素生成并填充数据
 * @param {HTMLElement} element 
 * @param {string} [specifiedType] 显式指定类型，如不提供则自动智能推断
 * @param {string} [scenario='NORMAL'] 测试场景类型 (NORMAL|BOUNDARY|ABNORMAL|CONCURRENCY|COMPATIBILITY)
 * @returns {boolean} 是否填充成功
 */
function fillSingleElement(element, specifiedType, scenario = 'NORMAL') {
  if (!element || element.disabled || element.readOnly) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  const typeAttr = (element.getAttribute('type') || 'text').toLowerCase();

  // 忽略隐藏类型或按钮类型
  if (['hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(typeAttr)) {
    return false;
  }

  // 处理下拉框 (Select)
  if (tagName === 'select') {
    const options = Array.from(element.options).filter(opt => opt.value !== '' && !opt.disabled);
    if (options.length > 0) {
      const selected = options[Math.floor(Math.random() * options.length)];
      element.value = selected.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      applyHighlightEffect(element);
      return true;
    }
    return false;
  }

  // 处理复选框 / 单选框
  if (typeAttr === 'checkbox') {
    if (!element.checked) {
      element.click();
      applyHighlightEffect(element);
    }
    return true;
  }
  if (typeAttr === 'radio') {
    if (!element.checked) {
      element.click();
      applyHighlightEffect(element);
    }
    return true;
  }

  // 保护二级指标名称：若已有系统预设值 (如数量指标/时效指标/效益指标)，绝不覆盖破坏
  const td = element.closest('td, th, .el-table__cell');
  if (td) {
    const colClassMatch = (td.className || '').match(/el-table_\d+_column_\d+/);
    const elTable = td.closest('.el-table');
    if (colClassMatch && elTable) {
      const th = elTable.querySelector(`th.${colClassMatch[0]}`);
      const thText = th ? th.innerText.trim() : '';
      if ((thText === '名称' || thText.includes('二级指标')) && (element.value || '').includes('指标')) {
        return true;
      }
    }
  }

  // 明确跳过“项目属性”等外部弹窗字典字段，保持留空让用户手动点击弹窗选择真实数据
  const ph = (element.getAttribute('placeholder') || '').toLowerCase();
  const context = extractElementContext(element);
  if (context.includes('项目属性') || ph.includes('请选择项目属性') || (element.getAttribute('v-model') || '').includes('xmsx')) {
    return false;
  }

  // 提取输入控件结构化上下文
  const fieldContext = extractFieldContext(element);

  // 推断或使用指定的数据类型
  const fieldType = specifiedType || detectFieldType(element);
  if (fieldType === 'projectProperty') {
    return false;
  }

  let fakeValue = '';

  // 场景驱动矩阵引擎调度 (当启用 BOUNDARY / ABNORMAL / CONCURRENCY / COMPATIBILITY 时全场景接管)
  if (scenario && scenario !== 'NORMAL' && typeof ScenarioEngine !== 'undefined') {
    const result = ScenarioEngine.generate(fieldType, scenario, fieldContext);
    fakeValue = result && result.value !== undefined ? result.value : '';
  } else {
    // 正常场景 (NORMAL)
    switch (fieldType) {
      case 'name':
        fakeValue = MockGenerator.name();
        break;
      case 'phone':
        fakeValue = typeof ScenarioEngine !== 'undefined'
          ? ScenarioEngine.generate('phone', 'NORMAL', fieldContext).value
          : MockGenerator.phone();
        break;
      case 'idCard':
        fakeValue = typeof ScenarioEngine !== 'undefined'
          ? ScenarioEngine.generate('idCard', 'NORMAL', fieldContext).value
          : MockGenerator.idCard();
        break;
      case 'usci':
        fakeValue = typeof ScenarioEngine !== 'undefined'
          ? ScenarioEngine.generate('usci', 'NORMAL', fieldContext).value
          : MockGenerator.usci();
        break;
      case 'bankCard':
        fakeValue = MockGenerator.bankCard();
        break;
      case 'email':
        fakeValue = MockGenerator.email();
        break;
      case 'amount':
        fakeValue = MockGenerator.amount();
        break;
      case 'amountWan':
        fakeValue = MockGenerator.amount({ min: 10, max: 150, decimals: 2 });
        break;
      case 'procureContent':
        fakeValue = MockGenerator.procureContent();
        break;
      case 'procureRemark':
        fakeValue = MockGenerator.procureRemark();
        break;
      case 'indicatorName':
        fakeValue = MockGenerator.indicatorName();
        break;
      case 'indicatorUnit':
        fakeValue = MockGenerator.indicatorUnit();
        break;
      case 'indicatorValue':
        fakeValue = MockGenerator.indicatorValue();
        break;
      case 'weight':
        fakeValue = '15';
        break;
      case 'calcSymbol':
        fakeValue = MockGenerator.calcSymbol();
        break;
      case 'projectProperty':
        return false;
      case 'department':
        fakeValue = MockGenerator.department();
        break;
      case 'projectLeader':
        fakeValue = MockGenerator.projectLeader();
        break;
      case 'projectName':
        fakeValue = MockGenerator.projectName();
        break;
      case 'projectReason':
        fakeValue = MockGenerator.projectReason();
        break;
      case 'projectContent':
        fakeValue = MockGenerator.projectContent();
        break;
      case 'budgetReason':
        fakeValue = MockGenerator.budgetReason();
        break;
      case 'companyName':
        fakeValue = MockGenerator.companyName();
        break;
      case 'address':
        fakeValue = MockGenerator.address();
        break;
      case 'date':
        fakeValue = MockGenerator.date();
        break;
      case 'dateTime':
        fakeValue = MockGenerator.dateTime();
        break;
      case 'password':
        fakeValue = MockGenerator.password();
        break;
      case 'zipCode':
        fakeValue = MockGenerator.zipCode();
        break;
      case 'remark':
        fakeValue = MockGenerator.remark();
        break;
      default:
        fakeValue = MockGenerator.procureContent();
        break;
    }
  }

  setNativeValue(element, fakeValue);
  applyHighlightEffect(element);
  return true;
}

/**
 * 静默填充 Element UI 下拉选择框 (直接随机选取真实选项，100% 杜绝弹出任何下拉框)
 * 通过在宿主主世界执行，直接访问组件真实 options，并静默赋值与关闭浮层
 * @param {HTMLElement|Document} [container=document]
 * @param {boolean} [onlyEmpty=false]
 */
/**
 * 静默填充 Element UI 下拉选择框 (直接随机选取真实选项，100% 杜绝弹出任何下拉框)
 * 通过在宿主主世界执行，直接访问组件真实 options，并静默赋值与关闭浮层
 * @param {HTMLElement|Document} [container=document]
 * @param {boolean} [onlyEmpty=false]
 */
function silentlyFillSelects(container = document, onlyEmpty = false) {
  try {
    const scriptContent = `
      (() => {
        try {
          const DEFAULT_SYMBOLS = ['≥', '＞', '=', '≤', '＜', '定性'];
          const selects = document.querySelectorAll('.el-select');
          selects.forEach(sel => {
            // 排除固定列镜像副本
            if (sel.closest('.el-table__fixed, .el-table__fixed-right, .el-table__fixed-left')) return;
            const vm = sel.__vue__;
            if (!vm) return;

            // 仅填空白项时跳过已有值
            if (${onlyEmpty} && vm.value !== '' && vm.value !== null && vm.value !== undefined) {
              return;
            }

            // 检查是否为计算符号相关列
            const cellEl = sel.closest('td, th');
            const inputEl = sel.querySelector('input');
            const isCalcSymbol = (cellEl && cellEl.className && cellEl.className.includes('jsfh')) ||
                                 (inputEl && (inputEl.placeholder || '').includes('选择'));

            // 如果原本被 mxzb === '' 暂时禁用，强制开启以完成填充
            if (vm.disabled && isCalcSymbol) {
              vm.disabled = false;
            }

            // 获取组件内部收集的真实有效 options
            const options = (vm.options || []).filter(o => !o.disabled && o.value !== '' && o.value !== null && o.value !== undefined);
            
            let chosenVal = '';
            let targetOpt = null;

            if (options.length > 0) {
              targetOpt = options[Math.floor(Math.random() * options.length)];
              chosenVal = targetOpt.value || targetOpt.label;
            } else if (isCalcSymbol) {
              // 兜底常用计算符号池
              chosenVal = DEFAULT_SYMBOLS[Math.floor(Math.random() * DEFAULT_SYMBOLS.length)];
            }

            if (chosenVal) {
              if (targetOpt && typeof vm.handleOptionSelect === 'function') {
                vm.handleOptionSelect(targetOpt, false);
              } else {
                vm.$emit('input', chosenVal);
                vm.$emit('change', chosenVal);
                if (typeof vm.emitChange === 'function') vm.emitChange(chosenVal);
              }
              // 同步更新显示文本
              const inputInner = sel.querySelector('input.el-input__inner');
              if (inputInner) {
                inputInner.value = targetOpt ? (targetOpt.label || targetOpt.value) : chosenVal;
              }
              vm.visible = false; // 严防任何下拉弹窗弹出
            }
          });

          // 兜底关闭可能展开的任何残留下拉浮层
          document.querySelectorAll('.el-select-dropdown').forEach(d => {
            d.style.display = 'none';
          });
        } catch (err) {}
      })();
    `;

    const script = document.createElement('script');
    script.textContent = scriptContent;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (e) {
    // 静默降级
  }
}

/**
 * 批量填充容器内的所有可用表单字段
 * 包含：权重分配算法、Element UI 下拉框值静默随机选择、场景化矩阵分发
 * @param {HTMLElement|Document} [container=document] 
 * @param {Object} [options]
 * @param {boolean} [options.onlyEmpty=false] 仅填充当前为空的输入项
 * @param {string} [options.scenario='NORMAL'] 测试场景类型 (NORMAL|BOUNDARY|ABNORMAL|CONCURRENCY|COMPATIBILITY)
 * @returns {number} 成功填充的字段数量
 */
function fillAllFormElements(container = document, options = {}) {
  const { onlyEmpty = false, scenario = 'NORMAL' } = options;
  let filledCount = 0;
  const handledSet = new Set();

  // 1. 优先协同处理所有“权重(%)”输入框
  const allInputs = Array.from(container.querySelectorAll('input:not([disabled])'));
  const weightInputs = allInputs.filter(input => {
    if (input.readOnly) return false;
    // 排除固定列中的镜像副本，防止被重复计数两次导致合计减半
    if (input.closest('.el-table__fixed, .el-table__fixed-right, .el-table__fixed-left')) {
      return false;
    }
    if (input.offsetParent === null && input.type !== 'hidden') return false;
    return detectFieldType(input) === 'weight';
  });

  if (weightInputs.length > 0) {
    let weights = [];
    if (scenario === 'NORMAL') {
      weights = MockGenerator.generateWeights(weightInputs.length);
    } else if (scenario === 'BOUNDARY') {
      // 边界值测试：第一项占 100，其余全为 0
      weights = weightInputs.map((_, idx) => (idx === 0 ? '100' : '0'));
    } else if (scenario === 'ABNORMAL') {
      // 异常值测试：超限 150 或负数 -10
      weights = weightInputs.map((_, idx) => (idx === 0 ? '150' : '-10'));
    } else if (scenario === 'CONCURRENCY') {
      // 并发冲突测试：固定权重 50
      weights = weightInputs.map(() => '50');
    } else if (scenario === 'COMPATIBILITY') {
      // 兼容性测试：带百分号格式串
      weights = weightInputs.map(() => '100.00%');
    } else {
      weights = MockGenerator.generateWeights(weightInputs.length);
    }

    weightInputs.forEach((input, idx) => {
      if (onlyEmpty && (input.value || '').trim() !== '') {
        return;
      }
      setNativeValue(input, weights[idx]);
      applyHighlightEffect(input);
      handledSet.add(input);
      filledCount++;
    });
  }

  // 2. 填充常规 input、textarea 与原生 select (跳过已处理的权重输入框和固定列副本)
  const elements = container.querySelectorAll('input, textarea, select');
  elements.forEach(el => {
    if (handledSet.has(el)) return;
    // 严格过滤固定列镜像副本
    if (el.closest('.el-table__fixed, .el-table__fixed-right, .el-table__fixed-left')) return;
    if (el.disabled || el.readOnly || (el.offsetParent === null && el.type !== 'hidden')) {
      return;
    }

    if (onlyEmpty) {
      const val = (el.value || '').trim();
      if (val !== '') {
        return;
      }
    }

    const ok = fillSingleElement(el, null, scenario);
    if (ok) {
      handledSet.add(el);
      filledCount++;
    }
  });

  // 3. 静默随机填充 Element UI 下拉框 (双阶段保障，确保指标名称填完后计算符号 100% 选值)
  silentlyFillSelects(container, onlyEmpty);
  setTimeout(() => {
    silentlyFillSelects(container, onlyEmpty);
  }, 120);

  return filledCount;
}

/**
 * 一键清空容器内的所有表单字段
 * @param {HTMLElement|Document} [container=document] 
 * @returns {number} 清空的字段数
 */
function clearAllFormElements(container = document) {
  const elements = container.querySelectorAll('input, textarea');
  let clearedCount = 0;

  elements.forEach(el => {
    if (el.disabled || el.readOnly) return;
    const typeAttr = (el.getAttribute('type') || 'text').toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image', 'file'].includes(typeAttr)) return;

    if (typeAttr === 'checkbox' || typeAttr === 'radio') {
      if (el.checked) {
        el.checked = false;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        clearedCount++;
      }
    } else {
      if (el.value) {
        setNativeValue(el, '');
        clearedCount++;
      }
    }
  });

  return clearedCount;
}


  /**
 * Content Script 核心业务逻辑
 * 集成 Shadow DOM 悬浮控制胶囊、场景驱动矩阵选择器、右键上下文目标捕获与跨进程消息响应
 */



let lastRightClickedElement = null;
let currentScenario = 'NORMAL';

const SCENARIO_META = {
  NORMAL: { code: 'NORMAL', label: '正常业务场景', tag: '标', color: '#60a5fa' },
  BOUNDARY: { code: 'BOUNDARY', label: '边界值场景', tag: '界', color: '#fbbf24' },
  ABNORMAL: { code: 'ABNORMAL', label: '异常注入场景', tag: '异', color: '#f87171' },
  CONCURRENCY: { code: 'CONCURRENCY', label: '并发冲突场景', tag: '发', color: '#c084fc' },
  COMPATIBILITY: { code: 'COMPATIBILITY', label: '系统兼容场景', tag: '容', color: '#34d399' }
};

const SCENARIO_ORDER = ['NORMAL', 'BOUNDARY', 'ABNORMAL', 'CONCURRENCY', 'COMPATIBILITY'];

// 从本地存储同步当前场景
try {
  chrome.storage.local.get({ activeScenario: 'NORMAL' }, (res) => {
    if (res && res.activeScenario && SCENARIO_META[res.activeScenario]) {
      currentScenario = res.activeScenario;
      updateCapsuleBadge();
    }
  });
} catch (e) {}

// 监听右键点击事件，记录当前点击的目标元素
document.addEventListener('contextmenu', (e) => {
  const target = e.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
    lastRightClickedElement = target;
  }
}, true);

// 监听来自 Background 和 Popup 的消息指令
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  if (action === 'SET_SCENARIO') {
    const sc = (payload && payload.scenario) || 'NORMAL';
    if (SCENARIO_META[sc]) {
      currentScenario = sc;
      updateCapsuleBadge();
      showCapsuleToast(`测试场景已切换：${SCENARIO_META[sc].label}`);
    }
    sendResponse({ success: true, scenario: currentScenario });
    return true;
  }

  if (action === 'FILL_ALL') {
    const sc = (payload && payload.scenario) || currentScenario;
    const count = fillAllFormElements(document, { onlyEmpty: false, scenario: sc });
    sendResponse({ success: true, count, scenario: sc });
    return true;
  }

  if (action === 'FILL_EMPTY') {
    const sc = (payload && payload.scenario) || currentScenario;
    const count = fillAllFormElements(document, { onlyEmpty: true, scenario: sc });
    sendResponse({ success: true, count, scenario: sc });
    return true;
  }

  if (action === 'CLEAR_ALL') {
    const count = clearAllFormElements(document);
    sendResponse({ success: true, count });
    return true;
  }

  if (action === 'FILL_SPECIFIC_TYPE') {
    // 优先填充右键命中的元素，其次当前聚焦的元素
    const target = lastRightClickedElement || document.activeElement;
    const sc = (payload && payload.scenario) || currentScenario;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      const ok = fillSingleElement(target, payload.type, sc);
      sendResponse({ success: ok, scenario: sc });
    } else {
      sendResponse({ success: false, reason: '未聚焦有效输入框' });
    }
    return true;
  }

  if (action === 'TOGGLE_FLOATING_BAR') {
    const { enabled } = payload || {};
    let host = document.getElementById('fake-filler-host');
    if (enabled) {
      if (!host) {
        createFloatingWidget();
        host = document.getElementById('fake-filler-host');
      }
      if (host) host.style.display = 'block';
    } else {
      if (host) host.style.display = 'none';
    }
    sendResponse({ success: true });
    return true;
  }
});

let updateCapsuleBadge = () => {};
let showCapsuleToast = () => {};

/**
 * 创建基于 Shadow DOM 的极简悬浮小工具胶囊
 * 具有完全独立的 CSS 作用域，不与宿主页面样式产生任何冲突
 */
function createFloatingWidget() {
  if (document.getElementById('fake-filler-host')) return;

  const host = document.createElement('div');
  host.id = 'fake-filler-host';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.bottom = '28px';
  host.style.right = '28px';
  host.style.pointerEvents = 'auto';

  const shadow = host.attachShadow({ mode: 'open' });

  // 胶囊组件独立样式 (Awwwards 顶级深色磨砂质感，微动效)
  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      user-select: none;
    }
    .widget-container {
      display: flex;
      align-items: center;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      padding: 5px 6px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.08);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .widget-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      position: relative;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .widget-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
    .widget-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }
    .widget-btn.primary:hover {
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
      transform: translateY(-1.5px) scale(1.04);
    }
    .widget-btn:active {
      transform: translateY(0) scale(0.96);
    }
    .scenario-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      cursor: pointer;
    }
    .scenario-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .scenario-badge {
      font-size: 11px;
      font-weight: 700;
      color: #60a5fa;
      border-radius: 4px;
      line-height: 1;
      letter-spacing: 0.5px;
      transition: color 0.2s ease;
    }
    .tooltip {
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%) translateY(4px);
      background: rgba(15, 23, 42, 0.95);
      color: #f8fafc;
      font-size: 11px;
      padding: 5px 9px;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: all 0.2s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .widget-btn:hover .tooltip {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .divider {
      width: 1px;
      height: 16px;
      background: rgba(255, 255, 255, 0.12);
      margin: 0 4px;
    }
    .badge-toast {
      position: absolute;
      bottom: 50px;
      right: 0;
      background: rgba(16, 185, 129, 0.92);
      color: #ffffff;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.25s ease;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(8px);
      white-space: nowrap;
    }
    .badge-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  const container = document.createElement('div');
  container.className = 'widget-container';

  container.innerHTML = `
    <button class="widget-btn primary" id="btn-fill-all">
      ${getLucideIcon('wand', 17)}
      <span class="tooltip" id="tip-fill-all">智能填充当前页面</span>
    </button>
    <button class="widget-btn" id="btn-fill-empty">
      ${getLucideIcon('sparkles', 15)}
      <span class="tooltip">仅填充空白字段</span>
    </button>
    <div class="divider"></div>
    <button class="widget-btn scenario-btn" id="btn-scenario-toggle">
      <span class="scenario-badge" id="scenario-badge">标</span>
      <span class="tooltip" id="scenario-tooltip">测试场景：正常业务 [点击切换]</span>
    </button>
    <div class="divider"></div>
    <button class="widget-btn" id="btn-clear-all">
      ${getLucideIcon('trash', 15)}
      <span class="tooltip">清空表单字段</span>
    </button>
    <div class="divider"></div>
    <button class="widget-btn close-btn" id="btn-close-bar">
      ${getLucideIcon('close', 13)}
      <span class="tooltip">隐藏悬浮胶囊</span>
    </button>
    <div class="badge-toast" id="toast">
      ${getLucideIcon('checkCircle', 14)}
      <span id="toast-text">已填充</span>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);
  document.body.appendChild(host);

  const toast = shadow.getElementById('toast');
  const toastText = shadow.getElementById('toast-text');
  const scenarioBadge = shadow.getElementById('scenario-badge');
  const scenarioTooltip = shadow.getElementById('scenario-tooltip');
  const tipFillAll = shadow.getElementById('tip-fill-all');

  function showToast(text) {
    toastText.innerText = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }
  showCapsuleToast = showToast;

  function updateBadge() {
    const meta = SCENARIO_META[currentScenario] || SCENARIO_META.NORMAL;
    if (scenarioBadge) {
      scenarioBadge.innerText = meta.tag;
      scenarioBadge.style.color = meta.color;
    }
    if (scenarioTooltip) {
      scenarioTooltip.innerText = `测试场景：${meta.label} [点击切换]`;
    }
    if (tipFillAll) {
      tipFillAll.innerText = `[${meta.label}] 填充当前页面`;
    }
  }
  updateCapsuleBadge = updateBadge;
  updateBadge();

  // 场景切换点击：按顺序循环切换
  shadow.getElementById('btn-scenario-toggle').addEventListener('click', () => {
    const currentIndex = SCENARIO_ORDER.indexOf(currentScenario);
    const nextIndex = (currentIndex + 1) % SCENARIO_ORDER.length;
    currentScenario = SCENARIO_ORDER[nextIndex];
    updateBadge();

    try {
      chrome.storage.local.set({ activeScenario: currentScenario });
    } catch (e) {}

    showToast(`场景已切换为：${SCENARIO_META[currentScenario].label}`);
  });

  shadow.getElementById('btn-fill-all').addEventListener('click', () => {
    const meta = SCENARIO_META[currentScenario] || SCENARIO_META.NORMAL;
    const count = fillAllFormElements(document, { onlyEmpty: false, scenario: currentScenario });
    showToast(`[${meta.tag}] 已填充 ${count} 个字段`);
  });

  shadow.getElementById('btn-fill-empty').addEventListener('click', () => {
    const meta = SCENARIO_META[currentScenario] || SCENARIO_META.NORMAL;
    const count = fillAllFormElements(document, { onlyEmpty: true, scenario: currentScenario });
    showToast(`[${meta.tag}] 已填充 ${count} 个空白项`);
  });

  shadow.getElementById('btn-clear-all').addEventListener('click', () => {
    const count = clearAllFormElements(document);
    showToast(`已清空 ${count} 个字段`);
  });

  shadow.getElementById('btn-close-bar').addEventListener('click', () => {
    host.style.display = 'none';
    try {
      chrome.storage.sync.set({ enableFloatingBar: false });
    } catch (e) {}
  });
}

// 检查配置是否启用浮动胶囊并安全渲染
try {
  chrome.storage.sync.get({ enableFloatingBar: true }, (items) => {
    const shouldEnable = (!items || chrome.runtime.lastError) ? true : items.enableFloatingBar;
    if (shouldEnable) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createFloatingWidget);
      } else {
        createFloatingWidget();
      }
    }
  });
} catch (e) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingWidget);
  } else {
    createFloatingWidget();
  }
}


  console.log('[FakeCraft] 场景化矩阵填充引擎已就绪，当前监听指令中...');
})();
