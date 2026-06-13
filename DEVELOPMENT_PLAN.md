# 健身记录小程序 - 开发计划

## 第一阶段：训练计划模块（高优先级）

### 1. 数据类型定义
文件：`src/types/training-plan.ts`

```typescript
// 训练计划
interface TrainingPlan {
  _id?: string
  name: string                      // 计划名称
  startDate: string                 // 开始日期
  endDate: string                   // 结束日期
  weekDuration: number              // 总周数
  weeklyFrequency: number           // 每周训练频率
  weeklyTemplates: WeeklyTemplate[] // 每周模板安排
  progress: PlanProgress            // 进度追踪
  status: 'active' | 'paused' | 'completed'
  createdAt: string
  updatedAt: string
}

// 每周模板
interface WeeklyTemplate {
  weekNumber: number                // 第几周
  weekStart: string                 // 周开始日期
  weekEnd: string                   // 周结束日期
  dailySchedules: DailySchedule[]   // 每日安排
  completedSessions: number         // 已完成训练次数
  totalSessions: number             // 总训练次数
}

// 每日安排
interface DailySchedule {
  dayOfWeek: number                 // 星期几 (1-7)
  date: string                      // 具体日期
  templateId: string                // 关联的训练模板 ID
  templateName: string              // 模板名称
  completed: boolean                // 是否完成
  recordId?: string                 // 实际训练记录 ID
  notes?: string                    // 备注
}

// 计划进度
interface PlanProgress {
  currentWeek: number               // 当前第几周
  completedSessions: number         // 已完成次数
  totalSessions: number             // 总次数
  completionRate: number            // 完成率
  nextSession: {                    // 下次训练
    date: string
    templateName: string
  }
}
```

### 2. 服务层实现
文件：`src/services/training-plan.local.ts`

功能：
- 创建计划（分步向导）
- 获取计划列表
- 获取计划详情（含日历视图数据）
- 更新计划进度
- 删除/暂停计划
- 复制计划

### 3. 页面实现

#### 3.1 训练计划主页
文件：`src/pages/plans/plans.vue`

布局：
- 顶部 Tab 切换：我的计划 / 计划日历
- 我的计划列表（默认）
  - 计划卡片（名称、周期、进度条、下次训练、快速开始按钮）
- 计划日历视图
  - 月历组件
  - 训练日标记（颜色区分）
  - 点击显示当天训练详情

#### 3.2 新建/编辑计划
文件：`src/pages/plans/create-plan.vue`

分步向导：
1. 基本信息（名称、日期、频率）
2. 选择模板（从模板库选择）
3. 排程确认（可视化周网格）
4. 进阶规则（可选：递增重量、Deload 周）

#### 3.3 计划详情页
文件：`src/pages/plans/plan-detail.vue`

内容：
- 计划概览（进度仪表、完成率）
- 周选择器
- 当前周训练安排
- 历史完成情况
- 编辑/暂停/删除操作

### 4. 与现有功能集成

#### 今日训练页
- 顶部显示："今日来自计划：{计划名}（第{N}周）"
- 直接加载计划中的训练模板
- 完成后自动更新计划进度

#### 首页统计
- "月训练次数"点击跳转至计划日历
- 显示当前活跃计划数量

---

## 第二阶段：社区动态模块（中优先级）

### 1. 数据类型定义
文件：`src/types/community.ts`

```typescript
// 动态
interface CommunityPost {
  _id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  type: 'pr' | 'workout' | 'transformation' | 'plan'  // 动态类型
  trainingData?: TrainingData         // 关联训练数据
  images: string[]                    // 图片（最多 3 张）
  video?: string                      // 视频
  tags: string[]                      // 标签
  likes: number
  comments: number
  shares: number
  isLiked: boolean                    // 当前用户是否点赞
  isFollowing: boolean                // 是否关注作者
  visibility: 'public' | 'friends'
  createdAt: string
}

// 评论
interface Comment {
  _id: string
  postId: string
  userId: string
  userName: string
  content: string
  likes: number
  createdAt: string
}
```

### 2. 页面实现

#### 2.1 社区首页（Feed 流）
文件：`src/pages/community/community.vue`

- Tab 切换：关注 / 推荐
- 每周热练榜单（折叠区域）
- 动态卡片列表
  - 用户信息、内容类型标签
  - 核心训练数据
  - 图片滑动
  - 互动栏（点赞、评论、分享、收藏）
  - 训练详情链接

#### 2.2 发布动态
文件：`src/pages/community/publish.vue`

- 选择关联数据（最近训练/PR/计划）
- 编辑文案（预设快捷短语）
- 上传图片/视频
- 可见性设置

#### 2.3 动态详情
文件：`src/pages/community/post-detail.vue`

- 完整动态内容
- 评论区
- @功能、私信入口

---

## 第三阶段：设置板块优化（低优先级）

### 当前问题
设置页面功能完整，但以下功能需要后端支持：

1. **订阅消息通知**
   - 需要在微信公众平台申请模板消息 ID
   - 配置服务器接收消息推送

2. **每日提醒**
   - 小程序限制：需要用户触发才能发送模板消息
   - 解决方案：使用本地通知（uni.createNotification）

### 优化方案

#### 本地通知实现
文件：`src/services/notification.local.ts`

```typescript
export const notificationServiceLocal = {
  // 设置每日提醒
  async setDailyReminder(time: string) {
    // 使用本地存储记录提醒时间
    // 在小程序启动时检查是否需要提醒
  },
  
  // 检查并显示提醒
  async checkAndNotify() {
    // 每次打开小程序时检查
    // 如果超过设定时间未训练，显示提示
  }
}
```

---

## 开发顺序建议

1. **先完成训练计划模块**
   - 这是核心功能的自然延伸
   - 能显著提升用户粘性
   - 与现有功能集成度高

2. **再实现社区动态（简化版）**
   - 先做本地版本（数据存储在本地）
   - 后续再考虑云端同步

3. **最后优化设置**
   - 添加"清除本地数据"功能
   - 添加"数据导出"功能
   - 优化 UI 适配

---

## 技术要点

### 小程序限制

1. **不能后台运行**
   - 无法实现真正的定时提醒
   - 解决方案：每次启动时检查

2. **本地存储限制**
   - 单个文件最大 1MB
   - 总存储限制 10MB
   - 解决方案：定期清理旧数据

3. **社区功能限制**
   - 需要云开发才能实现真正的社交功能
   - 简化方案：先做纯本地版本

### 性能优化

1. **虚拟滚动**
   - 动态列表超过 50 条时启用

2. **分页加载**
   - 计划日历按月加载
   - 社区 Feed 流分页

3. **数据缓存**
   - 使用 localStorage 缓存静态数据

---

## 下一步行动

### 立刻执行
1. 创建训练计划数据类型
2. 实现训练计划服务层
3. 开发训练计划列表页

### 需要用户确认
- 社区功能是否需要云端同步？（还是先做纯本地版）
- 设置页面需要添加哪些具体功能？
- 优先级排序确认

---

最后更新：2026-05-28
