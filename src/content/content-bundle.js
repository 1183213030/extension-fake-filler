/**
 * FakeCraft Content Script 自包含独立运行时 (100% 免疫 CSP 与模块加载延迟)
 * 自动生成于: 2026-10-08T02:36:20.190Z
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
 * @returns {boolean} 是否填充成功
 */
function fillSingleElement(element, specifiedType) {
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

  // 推断或使用指定的数据类型
  const fieldType = specifiedType || detectFieldType(element);
  let fakeValue = '';

  switch (fieldType) {
    case 'name':
      fakeValue = MockGenerator.name();
      break;
    case 'phone':
      fakeValue = MockGenerator.phone();
      break;
    case 'idCard':
      fakeValue = MockGenerator.idCard();
      break;
    case 'usci':
      fakeValue = MockGenerator.usci();
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
      // 用户要求：非真实弹窗数据抓取时不乱填写死字典，保持空白留给用户手动弹窗选择
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
 * 包含：权重总和恒等于100分配算法、Element UI 下拉框值静默随机选择、业务字段精准映射
 * @param {HTMLElement|Document} [container=document] 
 * @param {Object} [options]
 * @param {boolean} [options.onlyEmpty=false] 仅填充当前为空的输入项
 * @returns {number} 成功填充的字段数量
 */
function fillAllFormElements(container = document, options = {}) {
  const { onlyEmpty = false } = options;
  let filledCount = 0;
  const handledSet = new Set();

  // 1. 优先协同处理所有“权重(%)”输入框，严格保障所有行权重合计为 100
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
    const weights = MockGenerator.generateWeights(weightInputs.length);
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

    const ok = fillSingleElement(el);
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
 * 集成 Shadow DOM 悬浮控制胶囊、右键上下文目标捕获与跨进程消息响应
 */



let lastRightClickedElement = null;

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

  if (action === 'FILL_ALL') {
    const count = fillAllFormElements(document, { onlyEmpty: false });
    sendResponse({ success: true, count });
    return true;
  }

  if (action === 'FILL_EMPTY') {
    const count = fillAllFormElements(document, { onlyEmpty: true });
    sendResponse({ success: true, count });
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
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      const ok = fillSingleElement(target, payload.type);
      sendResponse({ success: ok });
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
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      padding: 6px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.08);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .widget-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
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
      height: 18px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 4px;
    }
    .badge-toast {
      position: absolute;
      bottom: 54px;
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
      ${getLucideIcon('wand', 18)}
      <span class="tooltip">一键智能填充全部字段</span>
    </button>
    <button class="widget-btn" id="btn-fill-empty">
      ${getLucideIcon('sparkles', 16)}
      <span class="tooltip">仅填充空白字段</span>
    </button>
    <div class="divider"></div>
    <button class="widget-btn" id="btn-clear-all">
      ${getLucideIcon('trash', 16)}
      <span class="tooltip">清空表单字段</span>
    </button>
    <div class="divider"></div>
    <button class="widget-btn close-btn" id="btn-close-bar">
      ${getLucideIcon('close', 14)}
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

  function showToast(text) {
    toastText.innerText = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }

  shadow.getElementById('btn-fill-all').addEventListener('click', () => {
    const count = fillAllFormElements(document, { onlyEmpty: false });
    showToast(`已填充 ${count} 个字段`);
  });

  shadow.getElementById('btn-fill-empty').addEventListener('click', () => {
    const count = fillAllFormElements(document, { onlyEmpty: true });
    showToast(`已填充 ${count} 个空白项`);
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


  console.log('[FakeCraft] 核心引擎已成功就绪，监听表单指令中...');
})();
