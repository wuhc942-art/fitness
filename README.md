# 健身记录小程序

一款基于 uni-app 开发的微信小程序，用于帮助用户记录每日健身训练数据、身体数据，并通过统计与可视化功能追踪健身进步。

## 技术栈

- **前端框架**：uni-app v3.x
- **运行平台**：微信小程序
- **后端服务**：微信小程序云开发（Cloud Base）
- **数据库**：微信云数据库（JSON 文档型）
- **图表库**：ECharts v5.x
- **开发语言**：TypeScript

## 功能模块

1. **首页** - 训练统计展示（连续天数、本月次数、总时长、PR 记录、训练热力图）
2. **今日训练记录** - 记录当日训练内容与身体数据
3. **历史训练查询** - 按日期/部位/动作查询历史记录
4. **身体数据记录** - 记录身高、体重、体脂等数据
5. **训练模板** - 创建和使用训练模板快速开始训练
6. **图表可视化** - 体重曲线、动作进步曲线、月训练频率、肌群占比
7. **设置** - 训练提醒设置

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 微信小程序
npm run dev:mp-weixin

# H5 (浏览器)
npm run dev:h5
```

### 构建生产版本

```bash
# 微信小程序
npm run build:mp-weixin

# H5
npm run build:h5
```

### 类型检查

```bash
npm run type-check
```

## 项目结构

```
fitness-tracker/
├── src/
│   ├── pages/           # 页面目录
│   │   ├── index/       # 首页
│   │   ├── training-record/
│   │   ├── history-query/
│   │   ├── body-data/
│   │   ├── templates/
│   │   ├── charts/
│   │   └── settings/
│   ├── components/      # 公共组件
│   │   ├── action-table/
│   │   ├── stat-card/
│   │   ├── heat-map/
│   │   └── chart-container/
│   ├── services/        # 业务服务层
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript 类型定义
│   ├── static/          # 静态资源
│   ├── App.vue
│   ├── main.ts
│   ├── pages.json
│   └── manifest.json
├── cloud/               # 云函数目录
│   ├── getStatistics/
│   ├── saveTrainingRecord/
│   ├── saveBodyDataRecord/
│   ├── queryHistory/
│   ├── saveTemplate/
│   ├── deleteTemplate/
│   └── sendNotification/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 云开发配置

1. 在微信公众平台开通云开发
2. 创建数据库集合：
   - `training_records` - 训练记录
   - `body_data_records` - 身体数据
   - `training_templates` - 训练模板
   - `reminder_settings` - 提醒设置
3. 部署云函数（见 `cloud/` 目录）
4. 配置定时触发器（用于提醒推送）

详见 `cloud/config.json`

## 开发文档

- [需求文档](../.monkeycode/specs/fitness-tracker/requirements.md)
- [技术设计](../.monkeycode/specs/fitness-tracker/design.md)
- [任务列表](../.monkeycode/specs/fitness-tracker/tasklist.md)

## 许可证

MIT
