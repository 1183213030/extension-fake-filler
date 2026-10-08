# FakeCraft - 智能测试数据生成与填充器 (浏览器扩展)

一款专为前端开发人员、测试工程师与业务联调人员量身打造的 Chromium 浏览器扩展（全面支持 **Google Chrome** 与 **Microsoft Edge**）。遵循 **Chrome Extension Manifest V3 (MV3)** 官方标准规范开发。

---

## 一、 核心功能特性

### 1. 智能语义识别与框架穿透
- **语义自动嗅探**：深度分析目标输入框的 `name`、`id`、`placeholder`、`autocomplete`、关联 `<label>` 以及父级表单控件描述（兼容 Element Plus、Ant Design、Naive UI 等常见企业级 UI 框架）。
- **现代前端响应式穿透**：通过原生原型链 Setter 劫持并分发完整的 `focus`、`input`、`change`、`blur` 事件序列，完美解决 Vue 2/3 `v-model`、React 受控组件（SyntheticEvent）修改 `value` 无法同步到底层 State 的痛点。

### 2. 真实本土化 Mock 算法库
- **公民身份证号**：严格遵循 **GB 11643-1999** 国家标准，第 18 位校验码根据 ISO 7064:1983.MOD 11-2 模 11 算法精准计算，通过各类表单强校验。
- **统一社会信用代码**：严格遵循 **GB 32100-2015** 国家标准，支持工商企业、机关、事业单位代码与第 18 位模 31 校验字符计算。
- **银行卡号**：支持国内主流银行卡 BIN 码段，结合 **Luhn 算法 (模 10)** 生成合规卡号。
- **其他常用数据**：合规号段手机号码、中文姓名、详细地址、测试金额、电子邮箱、日期时间、强密码、UUID v4、测试业务摘要等。

### 3. 多模态交互形态
- **网页悬浮胶囊工具条**：基于独立 **Shadow DOM** 隔离沙箱渲染，零样式污染；提供一键智能全填、仅填空白项、一键重置清空等快捷操作。
- **右键上下文菜单**：在任意可输入文本框右键，即可精准选择填充指定类型的虚拟数据。
- **Popup 控制面板**：Awwwards 级现代高奢暗黑微质感界面，支持单项即时刷新/一键复制，以及大批量数据导出与偏好配置。
- **全局快捷键**：
  - `Alt + Shift + F`：一键智能填充当前页面所有表单
  - `Alt + Shift + C`：一键清空重置当前页面表单

---

## 二、 在 Google Chrome 与 Microsoft Edge 中的安装步骤

由于两款浏览器均采用 Chromium 内核，安装流程完全一致：

### 1. Google Chrome 浏览器安装：
1. 打开 Chrome，在地址栏输入 `chrome://extensions/` 并回车；
2. 在右上角开启 **“开发者模式” (Developer mode)** 开关；
3. 点击左上角的 **“加载已解压的扩展程序” (Load unpacked)** 按钮；
4. 选择本项目根目录（即克隆或下载后的扩展目录文件夹）；
5. 加载完成后，建议在浏览器右上角扩展拼图图标中将 **FakeCraft** 固定到工具栏。

### 2. Microsoft Edge 浏览器安装：
1. 打开 Edge，在地址栏输入 `edge://extensions/` 并回车；
2. 在左下角开启 **“开发人员模式”** 开关；
3. 点击顶部的 **“加载解压缩的扩展”** 按钮；
4. 选择本项目根目录（即克隆或下载后的扩展目录文件夹）即可。

---

## 三、 本地快速联调与体验

本项目内置了一个端到端复杂表单联调页面：
1. 在浏览器中直接打开本项目的测试页面：
   - 文件路径：直接在浏览器中打开项目根目录下的 `test-demo.html`（或双击该文件）
2. 点击页面右下角的悬浮胶囊按钮，或打开工具栏的 FakeCraft 插件弹窗点击“一键智能填充当前页面”；
3. 观察页面字段的高亮流动光效，以及下方 `FRAMEWORK REACTIVE STATE` 是否实时捕获并同步了表单数据！

---

## 四、 目录结构说明

```
extension-fake-filler/
├── manifest.json            # 扩展配置文件 (Manifest V3 规范)
├── test-demo.html           # 本地功能验证与响应式监听测试页面
├── icons/                   # 扩展高清图标 (16x16, 48x48, 128x128)
└── src/
    ├── utils/
    │   ├── chinese-id-card.js # GB 11643-1999 身份证算法
    │   ├── usci.js            # GB 32100-2015 统一社会信用代码算法
    │   ├── luhn.js            # 银行卡 Luhn 模10算法
    │   ├── mock-data.js       # 综合 Mock 数据生成引擎
    │   └── lucide-icons.js    # Lucide 图标库 SVG 驱动
    ├── core/
    │   ├── form-detector.js   # 智能表单语义识别打分器
    │   └── form-filler.js     # 前端框架响应式穿透填充引擎
    ├── content/
    │   ├── content.js         # Content Script 模块动态加载器
    │   ├── content-main.js    # 页面悬浮胶囊 Shadow DOM 逻辑
    │   └── content.css        # 宿主页面动画高亮样式
    ├── background/
    │   └── background.js      # Service Worker 后台线程与右键菜单
    └── popup/
        ├── popup.html         # 控制面板页面
        ├── popup.css          # 暗黑高奢微拟物设计样式
        └── popup.js           # 剪贴板、批量生成与偏好配置交互
```
