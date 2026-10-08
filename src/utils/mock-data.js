/**
 * 虚拟数据生成引擎核心
 */

import { generateIdCard } from './chinese-id-card.js';
import { generateUsci } from './usci.js';
import { generateBankCard } from './luhn.js';

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

export const MockGenerator = {
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
