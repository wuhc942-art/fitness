<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { reminderServiceLocal } from "@/services/reminder.local";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
  reminderServiceLocal.checkAndShowMissedPlanReminder().catch((error) => {
    console.error("检查训练提醒失败:", error);
  });
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
page {
  background:
    radial-gradient(circle at 88% 0%, rgba(79, 140, 255, .12), transparent 30%),
    linear-gradient(180deg, #f9fcff 0%, #f4f8fb 50%, #f7fafc 100%) !important;
  color: #18212f !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.home-page,
.record-page,
.exercise-page,
.plans-page,
.templates-page,
.history-page,
.body-page,
.diet-page,
.progress-page,
.settings-page,
.reminder-page,
.profile-page,
.ai-plan-page,
.create-page,
.edit-plan-page,
.plan-detail-page {
  min-height: 100vh !important;
  background:
    radial-gradient(circle at 88% 0%, rgba(79, 140, 255, .12), transparent 30%),
    linear-gradient(180deg, #f9fcff 0%, #f4f8fb 50%, #f7fafc 100%) !important;
  color: #18212f !important;
}

.hero,
.summary,
.top,
.header,
.profile-header,
.page-header,
.plan-summary,
.template-header,
.ai-header,
.diet-header {
  border: 1rpx solid rgba(255, 255, 255, .95) !important;
  border-radius: 34rpx !important;
  background:
    radial-gradient(circle at 90% 12%, rgba(83, 215, 182, .16), transparent 32%),
    linear-gradient(145deg, #ffffff 0%, #edf7ff 100%) !important;
  color: #18212f !important;
  box-shadow: 0 16rpx 42rpx rgba(71, 98, 128, .12) !important;
}

.card,
.panel,
.section,
.week-card,
.metric,
.quick-item,
.action-card,
.template-card,
.history-card,
.record-card,
.data-card,
.chart-card,
.profile-card,
.setting-card,
.reminder-card,
.diet-card,
.plan-card,
.calendar-card,
.create-plan-card,
.empty-state,
.exercise-card,
.detail,
.modal,
.menu-content,
.action-library,
.library-card,
.food-card,
.body-card,
.stat-card,
.form-card,
.day-card,
.week-section,
.schedule-card {
  border: 1rpx solid rgba(223, 232, 239, .9) !important;
  border-radius: 24rpx !important;
  background: rgba(255, 255, 255, .92) !important;
  box-shadow: 0 8rpx 24rpx rgba(71, 98, 128, .07) !important;
}

.title,
.hero-title,
.summary-title,
.card-title,
.panel-title,
.section-title,
.template-name,
.plan-name,
.action-name,
.exercise-name,
.detail-name,
.record-title,
.empty-title,
.profile-name,
.setting-title,
.modal-title,
.calendar-title,
.block-title,
.metric-value,
.volume-value,
.progress-value,
.stats-value,
.data-value {
  color: #18212f !important;
  font-weight: 900 !important;
  letter-spacing: 0 !important;
}

.subtitle,
.hero-subtitle,
.summary-subtitle,
.card-subtitle,
.card-note,
.metric-label,
.label,
.tip,
.hint,
.empty-tip,
.empty,
.record-meta,
.action-meta,
.exercise-meta,
.detail-meta,
.template-meta,
.plan-period,
.period-text,
.progress-text,
.stats-text,
.session-label,
.history-meta,
.profile-meta,
.setting-desc,
.reminder-desc,
.library-tip,
.library-count,
.library-empty,
.line,
.muted {
  color: #768398 !important;
}

button,
.button,
.btn,
.primary,
.primary-btn,
.save-btn,
.create-btn,
.confirm,
.action-btn.primary,
.hero-button,
.refresh,
.add-btn,
.small-btn {
  border: 0 !important;
  border-radius: 999rpx !important;
  background: linear-gradient(135deg, #4f8cff 0%, #5fb7ff 100%) !important;
  color: #fff !important;
  box-shadow: 0 12rpx 28rpx rgba(79, 140, 255, .22) !important;
  font-weight: 900 !important;
}

button[disabled],
.btn[disabled],
.save-btn[disabled],
.primary[disabled] {
  background: #b8c7d8 !important;
  color: #fff !important;
  box-shadow: none !important;
  opacity: .75 !important;
}

.secondary,
.cancel,
.mini-btn,
.mini-action,
.action-menu,
.action-tools button,
.load-more,
.menu-item,
.nav-btn,
.icon-button {
  border: 0 !important;
  background: #eef4f8 !important;
  color: #344154 !important;
  box-shadow: none !important;
}

input,
textarea,
.input,
.textarea,
.picker,
.search-box,
.search,
.library-search,
.form-input,
.form-textarea {
  border: 1rpx solid #dfe8ef !important;
  border-radius: 18rpx !important;
  background: #ffffff !important;
  color: #344154 !important;
  box-shadow: 0 8rpx 20rpx rgba(71, 98, 128, .05) !important;
}

.tabs,
.tabs-header,
.library-tabs,
.tab-bar,
.segment {
  border: 0 !important;
  border-radius: 999rpx !important;
  background: #e7eef4 !important;
}

.tab,
.tab-item,
.library-tab,
.segment-item {
  border-radius: 999rpx !important;
  color: #768398 !important;
}

.tab.active,
.tab-item.active,
.library-tab.active,
.segment-item.active {
  background: #ffffff !important;
  color: #4f8cff !important;
  box-shadow: 0 6rpx 16rpx rgba(71, 98, 128, .09) !important;
}

.tab-item.active::after {
  display: none !important;
}

.chip,
.tag,
.level,
.badge,
.status,
.plan-status,
.set-pill,
.last-set,
.library-filter,
.quick-name {
  border: 0 !important;
  border-radius: 999rpx !important;
  background: #eef4f8 !important;
  color: #344154 !important;
}

.chip.active,
.tag.active,
.tag.strong,
.level,
.status-active,
.plan-status.status-active,
.library-filter.active,
.quick-name.active,
.date-cell.trained,
.day-completed,
.next-session,
.last-performance {
  background: #e9fbf6 !important;
  color: #16856c !important;
  border-color: #d4f4eb !important;
}

.date-cell.today,
.day-today,
.calendar-day.day-today {
  background: #4f8cff !important;
  color: #ffffff !important;
  border-color: #4f8cff !important;
  outline: 0 !important;
}

.progress-bar {
  background: #e8eef3 !important;
}

.progress-fill,
.indicator-dot,
.legend-dot--scheduled {
  background: linear-gradient(90deg, #4f8cff, #78c7ff) !important;
}

.indicator-dot.completed,
.legend-dot--completed {
  background: #53d7b6 !important;
}

.advice-card,
.library-status,
.online-status,
.tip-card,
.notice,
.info-card {
  border: 1rpx solid #dcecff !important;
  border-radius: 20rpx !important;
  background: linear-gradient(145deg, #f7fbff, #eef7ff) !important;
  color: #344154 !important;
  box-shadow: none !important;
}

.warn,
.warning,
.plan-warning,
.line.warning {
  border-color: #f7dfad !important;
  background: #fff6e6 !important;
  color: #805421 !important;
}

.modal-mask,
.menu-overlay {
  background: rgba(24, 33, 47, .38) !important;
}

.modal,
.menu-content {
  border-radius: 34rpx 34rpx 0 0 !important;
  background: #f7fafc !important;
}

.modal-head,
.modal-foot {
  border-color: #dfe8ef !important;
  background: #ffffff !important;
}

.quick-icon-wrap,
.create-icon,
.thumb {
  background: #e8f1ff !important;
  color: #4f8cff !important;
  box-shadow: none !important;
}

.delete,
.danger,
.menu-item.delete {
  color: #f36d8d !important;
}

/* Stitch blue-white dashboard visual layer */
page {
  background: #f5f8fc !important;
  color: #111827 !important;
}

.home-page,
.record-page,
.exercise-page,
.plans-page,
.templates-page,
.history-page,
.body-page,
.diet-page,
.progress-page,
.settings-page,
.reminder-page,
.profile-page,
.ai-plan-page,
.create-page,
.edit-plan-page,
.plan-detail-page {
  background: #f5f8fc !important;
  color: #111827 !important;
}

.hero,
.summary,
.top,
.header,
.profile-header,
.page-header,
.plan-summary,
.template-header,
.ai-header,
.diet-header {
  border: 1rpx solid #e3ebf5 !important;
  border-radius: 24rpx !important;
  background: #ffffff !important;
  color: #111827 !important;
  box-shadow: 0 10rpx 28rpx rgba(34, 76, 124, .08) !important;
}

.card,
.panel,
.section,
.week-card,
.metric,
.quick-item,
.action-card,
.template-card,
.history-card,
.record-card,
.data-card,
.chart-card,
.profile-card,
.setting-card,
.reminder-card,
.diet-card,
.plan-card,
.calendar-card,
.create-plan-card,
.empty-state,
.exercise-card,
.detail,
.modal,
.menu-content,
.action-library,
.library-card,
.food-card,
.body-card,
.stat-card,
.form-card,
.day-card,
.week-section,
.schedule-card {
  border: 1rpx solid #e3ebf5 !important;
  border-radius: 22rpx !important;
  background: #ffffff !important;
  box-shadow: 0 8rpx 22rpx rgba(34, 76, 124, .07) !important;
}

.title,
.hero-title,
.summary-title,
.card-title,
.panel-title,
.section-title,
.template-name,
.plan-name,
.action-name,
.exercise-name,
.detail-name,
.record-title,
.empty-title,
.profile-name,
.setting-title,
.modal-title,
.calendar-title,
.block-title,
.metric-value,
.volume-value,
.progress-value,
.stats-value,
.data-value {
  color: #111827 !important;
  font-weight: 900 !important;
}

.subtitle,
.hero-subtitle,
.summary-subtitle,
.card-subtitle,
.card-note,
.metric-label,
.label,
.tip,
.hint,
.empty-tip,
.empty,
.record-meta,
.action-meta,
.exercise-meta,
.detail-meta,
.template-meta,
.plan-period,
.period-text,
.progress-text,
.stats-text,
.session-label,
.history-meta,
.profile-meta,
.setting-desc,
.reminder-desc,
.library-tip,
.library-count,
.library-empty,
.line,
.muted {
  color: #5f6f83 !important;
  font-weight: 600 !important;
}

button,
.button,
.btn,
.primary,
.primary-btn,
.save-btn,
.create-btn,
.confirm,
.action-btn.primary,
.hero-button,
.refresh,
.add-btn,
.small-btn {
  border: 0 !important;
  border-radius: 18rpx !important;
  background: #2f80ed !important;
  color: #ffffff !important;
  box-shadow: 0 10rpx 22rpx rgba(47, 128, 237, .22) !important;
  font-weight: 900 !important;
}

.hero-button,
.save-btn,
.primary-btn,
.action-btn.primary {
  border-radius: 999rpx !important;
}

button[disabled],
.btn[disabled],
.save-btn[disabled],
.primary[disabled] {
  background: #a9bed6 !important;
  color: #ffffff !important;
  box-shadow: none !important;
  opacity: .9 !important;
}

.secondary,
.cancel,
.mini-btn,
.mini-action,
.action-menu,
.action-tools button,
.load-more,
.menu-item,
.nav-btn,
.icon-button {
  background: #edf3fa !important;
  color: #243244 !important;
  box-shadow: none !important;
}

input,
textarea,
.input,
.textarea,
.picker,
.search-box,
.search,
.library-search,
.form-input,
.form-textarea {
  border: 1rpx solid #e3ebf5 !important;
  border-radius: 16rpx !important;
  background: #f9fbfd !important;
  color: #111827 !important;
  box-shadow: none !important;
  font-weight: 700 !important;
}

.tabs,
.tabs-header,
.library-tabs,
.tab-bar,
.segment {
  border-radius: 999rpx !important;
  background: #edf3fa !important;
}

.tab,
.tab-item,
.library-tab,
.segment-item {
  color: #5f6f83 !important;
  font-weight: 800 !important;
}

.tab.active,
.tab-item.active,
.library-tab.active,
.segment-item.active {
  background: #ffffff !important;
  color: #2f80ed !important;
  box-shadow: 0 6rpx 14rpx rgba(34, 76, 124, .08) !important;
}

.chip,
.tag,
.level,
.badge,
.status,
.plan-status,
.set-pill,
.last-set,
.library-filter,
.quick-name {
  border-radius: 999rpx !important;
  background: #edf3fa !important;
  color: #243244 !important;
  font-weight: 800 !important;
}

.chip.active,
.tag.active,
.library-filter.active,
.quick-name.active,
.date-cell.today,
.day-today,
.calendar-day.day-today {
  background: #2f80ed !important;
  color: #ffffff !important;
  border-color: #2f80ed !important;
}

.tag.strong,
.level,
.status-active,
.plan-status.status-active,
.date-cell.trained,
.day-completed,
.next-session,
.last-performance {
  background: #e8f6ef !important;
  color: #15803d !important;
  border-color: #caead9 !important;
}

.progress-bar {
  height: 12rpx !important;
  background: #e4edf7 !important;
}

.progress-fill,
.indicator-dot,
.legend-dot--scheduled {
  background: #2f80ed !important;
}

.indicator-dot.completed,
.legend-dot--completed {
  background: #22c55e !important;
}

.advice-card,
.library-status,
.online-status,
.tip-card,
.notice,
.info-card {
  border: 1rpx solid #d6e6fb !important;
  border-radius: 20rpx !important;
  background: #eef6ff !important;
  color: #243244 !important;
}

.ai-plan-card,
.plan-card.highlight,
.template-card.highlight {
  background: linear-gradient(135deg, #2f80ed 0%, #69b2ff 100%) !important;
  color: #ffffff !important;
}

.ai-plan-card text,
.ai-plan-card .create-text,
.ai-plan-card .create-icon {
  color: #ffffff !important;
}

.quick-icon-wrap,
.create-icon,
.thumb {
  background: #edf3fa !important;
  color: #2f80ed !important;
}
</style>
