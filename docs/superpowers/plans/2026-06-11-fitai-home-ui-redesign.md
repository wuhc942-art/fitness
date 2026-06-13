# FitAI Home UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the FitAI home page and global visual baseline into a cleaner, Apple-like product UI while preserving all existing workout logic.

**Architecture:** This is a CSS-first redesign. Global variables establish the visual baseline, `pages.json` aligns shell color, and `src/pages/index/index.vue` receives focused template/style updates without changing data services or navigation routes.

**Tech Stack:** uni-app, Vue 3, TypeScript, SCSS, WeChat mini program build target.

---

## File Structure

- Modify: `src/uni.scss`
  - Update global color, radius, and shadow variables to the new restrained product palette.
- Modify: `src/pages.json`
  - Keep page routes unchanged.
  - Align navigation bar background and app background with the refreshed palette.
- Modify: `src/pages/index/index.vue`
  - Keep existing script logic and routes.
  - Update quick action metadata only if labels or tones need to support the new visual grouping.
  - Update template structure only where needed for better hierarchy.
  - Replace noisy gradients and side-stripe cards with calmer surfaces, borders, and one accent.
- Verify:
  - Run `npm run build:mp-weixin`.
  - Copy output to `D:\dist-upload-home-ai-v1`.
  - Measure main package and `exercise-assets` package sizes.

---

### Task 1: Update Global Visual Tokens

**Files:**
- Modify: `D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker\src\uni.scss`

- [ ] **Step 1: Replace palette variables**

Use:

```scss
$primary-color: #101820;
$primary-gradient: linear-gradient(135deg, #101820 0%, #1b2a34 100%);

$success-color: #22c55e;
$success-gradient: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);

$warning-color: #d97706;
$warning-gradient: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);

$info-color: #2563eb;
$info-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);

$text-primary: #101820;
$text-regular: #334155;
$text-secondary: #64748b;
$text-placeholder: #94a3b8;

$border-color: #e2e8f0;
$background-color: #f3f6f5;
```

- [ ] **Step 2: Keep spacing variables**

Do not change spacing token names. Existing pages may rely on them.

- [ ] **Step 3: Tune radius and shadow variables**

Use:

```scss
$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 14px;
$radius-xl: 22px;

$shadow-sm: 0 2px 8px rgba(16, 24, 32, 0.04);
$shadow-md: 0 8px 24px rgba(16, 24, 32, 0.06);
$shadow-lg: 0 16px 42px rgba(16, 24, 32, 0.10);
```

---

### Task 2: Align App Shell Colors

**Files:**
- Modify: `D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker\src\pages.json`

- [ ] **Step 1: Update global shell colors**

Set:

```json
"navigationBarBackgroundColor": "#101820",
"backgroundColor": "#f3f6f5"
```

- [ ] **Step 2: Preserve all route definitions**

Do not add, remove, or rename pages or subpackages.

---

### Task 3: Redesign Home Page Presentation

**Files:**
- Modify: `D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker\src\pages\index\index.vue`

- [ ] **Step 1: Keep script behavior intact**

Keep these functions and computed values behaviorally unchanged:

```ts
loadStatistics()
loadTodayPlan()
primaryAction()
goQuick()
heroTitle
heroSubtitle
primaryButtonText
```

- [ ] **Step 2: Replace quick action tones**

Use fewer tone categories so the grid feels intentional:

```ts
const quickActions = [
  { icon: '记', tone: 'primary', label: '记录', url: '/pages/training-record/training-record' },
  { icon: '计', tone: 'default', label: '计划', url: '/pages/plans/plans' },
  { icon: '动', tone: 'default', label: '动作库', url: '/pages/exercises/exercises' },
  { icon: '模', tone: 'default', label: '模板', url: '/pages/templates/templates' },
  { icon: '史', tone: 'default', label: '历史', url: '/pages/history-query/history-query' },
  { icon: '图', tone: 'default', label: '进步', url: '/pages/charts/charts' },
  { icon: '身', tone: 'default', label: '身体', url: '/pages/body-data/body-data' },
  { icon: '食', tone: 'default', label: '饮食', url: '/pages/diet/diet' },
  { icon: 'AI', tone: 'soft', label: 'AI计划', url: '/pages/ai-plan/ai-plan' },
  { icon: '铃', tone: 'soft', label: '提醒', url: '/pages/reminders/reminders' },
  { icon: '我', tone: 'soft', label: '我的', url: '/pages/profile/profile' }
]
```

- [ ] **Step 3: Update home styles**

Replace current home styles with CSS that:

- Uses `#f3f6f5` page background.
- Keeps hero dark, but gives it more breathing room and softer shape.
- Uses one accent green for the primary button and completed states.
- Removes quick-action multi-color gradients.
- Removes advice-card `border-left` stripe treatment.
- Keeps all text readable at mobile width.

- [ ] **Step 4: Preserve empty/loading states**

Keep:

```vue
<view v-if="isLoading" class="home-loading">正在整理今日训练状态...</view>
<view v-if="insights.length === 0" class="empty">完成一次训练后，这里会开始给你训练建议。</view>
```

Style them as calm inline states, not full-page blockers.

---

### Task 4: Build And Copy Upload Output

**Files:**
- Generated: `D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker\dist\build\mp-weixin`
- Generated: `D:\dist-upload-home-ai-v1`

- [ ] **Step 1: Run WeChat build**

Run:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run build:mp-weixin
```

Expected: build completes without errors.

- [ ] **Step 2: Refresh upload directory**

Run:

```powershell
$source = Resolve-Path 'D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker\dist\build\mp-weixin'
$upload = 'D:\dist-upload-home-ai-v1'
if (Test-Path $upload) { Remove-Item -LiteralPath $upload -Recurse -Force }
New-Item -ItemType Directory -Force -Path $upload | Out-Null
Copy-Item -Path (Join-Path $source.Path '*') -Destination $upload -Recurse -Force
```

- [ ] **Step 3: Measure package sizes**

Run:

```powershell
$mainSize = (Get-ChildItem -LiteralPath $upload -Recurse -File | Where-Object { $_.FullName -notlike '*\exercise-assets\*' } | Measure-Object Length -Sum).Sum
$subPath = Join-Path $upload 'exercise-assets'
$subSize = 0
if (Test-Path $subPath) { $subSize = (Get-ChildItem -LiteralPath $subPath -Recurse -File | Measure-Object Length -Sum).Sum }
[pscustomobject]@{
  UploadDir = $upload
  MainKB = [math]::Round($mainSize / 1KB, 1)
  ExerciseAssetsKB = [math]::Round($subSize / 1KB, 1)
} | Format-List
```

Expected: main package remains far below 2 MB.

---

## Self-Review

- Spec coverage: The plan covers global variables, shell colors, home page hierarchy, state styling, build, copy, and package-size reporting.
- Placeholder scan: No `TBD`, `TODO`, or vague implementation placeholders remain.
- Type consistency: No service or type signatures are changed. The quick action object shape remains `icon`, `tone`, `label`, and `url`.
