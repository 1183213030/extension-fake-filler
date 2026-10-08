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
export function extractElementContext(element) {
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
export function detectFieldType(element) {
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
