<template>
  <view class="settings-page">
    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">提醒偏好</text>
        <text class="panel-note">轻量提醒，不打扰训练</text>
      </view>

      <view class="setting-row">
        <view class="setting-copy">
          <text class="setting-title">计划逾期提醒</text>
          <text class="setting-desc">打开小程序时检查未完成计划，并引导你补记训练</text>
        </view>
        <switch :checked="settings.missedPlanReminder.enabled" color="#101820" @change="onMissedPlanReminderChange" />
      </view>

      <view v-if="settings.missedPlanReminder.enabled" class="subscribe-box">
        <text class="setting-title">微信订阅授权</text>
        <text class="setting-desc">授权后才有资格发服务通知；当前版本先在打开小程序时检查漏练。</text>
        <text class="template-id">{{ shortTemplateId }}</text>
        <button class="secondary-btn" :disabled="isSubscribing" @click="requestSubscribe">
          {{ isSubscribing ? '申请中...' : '申请微信订阅授权' }}
        </button>
        <text class="subscribe-state">{{ subscribeStateText }}</text>
      </view>

      <view class="setting-row">
        <view class="setting-copy">
          <text class="setting-title">训练时间提醒</text>
          <text class="setting-desc">保存常用训练时间；离线推送需要云函数定时发送</text>
        </view>
        <switch :checked="settings.dailyReminder.enabled" color="#101820" @change="onDailyReminderChange" />
      </view>

      <view v-if="settings.dailyReminder.enabled" class="time-row">
        <text class="setting-title">提醒时间</text>
        <picker mode="time" :value="settings.dailyReminder.time" @change="onTimeChange">
          <view class="time-picker">{{ settings.dailyReminder.time }}</view>
        </picker>
      </view>

      <view class="setting-row">
        <view class="setting-copy">
          <text class="setting-title">三天未训练提醒</text>
          <text class="setting-desc">帮助你把节奏找回来，当前先作为本地偏好保存</text>
        </view>
        <switch :checked="settings.threeDayReminder.enabled" color="#101820" @change="onThreeDayReminderChange" />
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">数据管理</text>
        <text class="panel-note">本地数据</text>
      </view>
      <view class="action-row" @click="goHistory">
        <text class="setting-title">查看训练历史</text>
        <text class="arrow">›</text>
      </view>
      <view class="action-row" @click="goBodyData">
        <text class="setting-title">查看身体数据</text>
        <text class="arrow">›</text>
      </view>
      <view class="action-row" :class="{ busy: isExporting }" @click="exportLocalData">
        <view class="setting-copy">
          <text class="setting-title">{{ isExporting ? '正在导出本地数据' : '导出本地数据' }}</text>
          <text class="setting-desc">生成备份文件，换机或清理缓存前可用于恢复</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="action-row" :class="{ busy: isImporting }" @click="importLocalData">
        <view class="setting-copy">
          <text class="setting-title">{{ isImporting ? '正在导入本地备份' : '导入本地备份' }}</text>
          <text class="setting-desc">选择 FitAI 导出的 JSON 文件，恢复本地数据</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="action-row danger" :class="{ busy: isClearing }" @click="confirmClearCache">
        <text class="setting-title">{{ isClearing ? '正在清空本地数据' : '清空本地数据' }}</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">关于</text>
        <text class="panel-note">v1.0.0</text>
      </view>
      <text class="about-text">FitAI 专注于训练记录、计划复用、进步复盘和轻量 AI 建议。当前数据存储在本机/小程序本地缓存中。</text>
    </view>

    <view class="save-bar">
      <button class="save-btn" :disabled="isSaving" @click="saveSettings">{{ isSaving ? '保存中...' : '保存偏好' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { MISSED_TRAINING_TEMPLATE_ID, reminderServiceLocal, type LocalReminderSettings } from '@/services/reminder.local'
import { normalizeBackupDataForImport } from '@/utils/backup-normalize'
import { arrayBackupKeys, backupStorageKeys, buildBackupPreview, createBackupFileName, formatBackupPreview, readBackupStorage, type BackupStorageKey } from '@/utils/backup-data'
import { useMiniProgramShare } from '@/utils/share'

useMiniProgramShare({
  title: 'FitAI 健身记录：本地数据可备份'
})

const settings = reactive<LocalReminderSettings>({
  dailyReminder: { enabled: false, time: '19:00' },
  threeDayReminder: { enabled: false },
  missedPlanReminder: { enabled: true, templateId: MISSED_TRAINING_TEMPLATE_ID, subscribed: false },
  updatedAt: new Date().toISOString()
})
const isSaving = ref(false)
const isSubscribing = ref(false)
const isExporting = ref(false)
const isImporting = ref(false)
const isClearing = ref(false)

interface WxBackupFile {
  path?: string
}

interface WxChooseMessageFileResult {
  tempFiles?: WxBackupFile[]
}

interface WxReadFileResult {
  data: string | ArrayBuffer
}

interface WxFileSystemManager {
  writeFile(options: {
    filePath: string
    data: string
    encoding: 'utf8'
    success: () => void
    fail: () => void
  }): void
  readFile(options: {
    filePath: string
    encoding: 'utf8'
    success: (result: WxReadFileResult) => void
    fail: () => void
  }): void
}

interface WxBackupApi {
  env: {
    USER_DATA_PATH: string
  }
  getFileSystemManager(): WxFileSystemManager
  chooseMessageFile(options: {
    count: number
    type: 'file'
    extension: string[]
    success: (result: WxChooseMessageFileResult) => void
    fail: () => void
  }): void
}

const wxBackupApi = wx as unknown as WxBackupApi

const subscribeStateText = computed(() => {
  return settings.missedPlanReminder.subscribed ? '已获得授权，但离线推送还需云函数发送。' : '还未申请订阅授权。'
})
const shortTemplateId = computed(() => {
  const id = settings.missedPlanReminder.templateId || MISSED_TRAINING_TEMPLATE_ID
  return `${id.slice(0, 8)}…${id.slice(-8)}`
})

const loadSettings = async () => {
  try {
    const saved = await reminderServiceLocal.getSettings()
    Object.assign(settings, saved)
    if (!settings.missedPlanReminder.templateId) settings.missedPlanReminder.templateId = MISSED_TRAINING_TEMPLATE_ID
  } catch (error) {
    console.error('加载提醒设置失败:', error)
  }
}

const onMissedPlanReminderChange = (event: any) => {
  settings.missedPlanReminder.enabled = event.detail.value
}
const onDailyReminderChange = (event: any) => {
  settings.dailyReminder.enabled = event.detail.value
}
const onTimeChange = (event: any) => {
  settings.dailyReminder.time = event.detail.value
}
const onThreeDayReminderChange = (event: any) => {
  settings.threeDayReminder.enabled = event.detail.value
}

const saveSettings = async () => {
  if (isSaving.value) return
  try {
    isSaving.value = true
    uni.showLoading({ title: '保存中' })
    await reminderServiceLocal.saveSettings(settings)
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.hideLoading()
    console.error('保存提醒设置失败:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    isSaving.value = false
  }
}

const requestSubscribe = async () => {
  if (isSubscribing.value) return
  try {
    isSubscribing.value = true
    const accepted = await reminderServiceLocal.requestMissedPlanSubscribe(settings.missedPlanReminder.templateId)
    settings.missedPlanReminder.subscribed = accepted
    await reminderServiceLocal.saveSettings(settings)
    uni.showToast({ title: accepted ? '授权已记录' : '未授权订阅', icon: 'none' })
  } catch (error: any) {
    uni.showToast({ title: error?.message || '订阅失败', icon: 'none' })
  } finally {
    isSubscribing.value = false
  }
}

const writeBackupFile = (data: Record<string, any>, prefix = 'fitai-backup') => {
  const fileName = createBackupFileName(prefix)
  const filePath = `${wxBackupApi.env.USER_DATA_PATH}/${fileName}`
  const fs = wxBackupApi.getFileSystemManager()

  return new Promise<{ fileName: string; filePath: string }>((resolve, reject) => {
    fs.writeFile({
      filePath,
      data: JSON.stringify(data, null, 2),
      encoding: 'utf8',
      success: () => resolve({ fileName, filePath }),
      fail: () => reject(new Error('write backup failed'))
    })
  })
}

const exportLocalData = () => {
  if (isExporting.value || isImporting.value || isClearing.value) return
  isExporting.value = true
  writeBackupFile(readBackupStorage((key) => uni.getStorageSync(key)))
    .then(({ fileName, filePath }) => {
      isExporting.value = false
      uni.showModal({
        title: '导出成功',
        content: `已生成备份文件：${fileName}`,
        confirmText: '打开文件',
        success: (res) => {
          if (!res.confirm) return
          uni.openDocument({ filePath, showMenu: true })
        }
      })
    })
    .catch(() => {
      isExporting.value = false
      uni.showToast({ title: '导出失败', icon: 'none' })
    })
}

const writeImportedStorage = (key: string, value: any) => {
  uni.setStorageSync(key, typeof value === 'string' ? value : JSON.stringify(value))
}

function validateBackupData(parsed: any): { ok: true; keys: BackupStorageKey[] } | { ok: false; message: string } {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, message: '备份文件格式不正确' }
  }

  if (typeof parsed.version !== 'string' || typeof parsed.exportedAt !== 'string') {
    return { ok: false, message: '这不是 FitAI 导出的备份文件' }
  }

  const matchedKeys = backupStorageKeys.filter((key) => Object.prototype.hasOwnProperty.call(parsed, key))
  if (!matchedKeys.length) return { ok: false, message: '备份文件里没有可恢复的数据' }

  const invalidArrayKey = matchedKeys.find((key) => arrayBackupKeys.has(key) && parsed[key] != null && !Array.isArray(parsed[key]))
  if (invalidArrayKey) return { ok: false, message: '备份文件数据结构异常，已停止导入' }

  return { ok: true, keys: matchedKeys }
}

const importLocalData = () => {
  if (isImporting.value || isExporting.value || isClearing.value) return
  uni.showModal({
    title: '导入备份',
    content: '导入会覆盖当前本地数据。选择文件后会先展示数据清单，并自动保存一份导入前备份。',
    confirmText: '选择文件',
    success: (modalRes) => {
      if (!modalRes.confirm) return
      isImporting.value = true
      wxBackupApi.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['json'],
        success: (chooseRes) => {
          const file = chooseRes.tempFiles?.[0]
          if (!file?.path) {
            isImporting.value = false
            uni.showToast({ title: '未选择文件', icon: 'none' })
            return
          }
          wxBackupApi.getFileSystemManager().readFile({
            filePath: file.path,
            encoding: 'utf8',
            success: (readRes) => {
              try {
                const parsed = JSON.parse(String(readRes.data || '{}'))
                const validation = validateBackupData(parsed)
                if (!validation.ok) {
                  isImporting.value = false
                  uni.showToast({ title: validation.message, icon: 'none' })
                  return
                }
                const normalized = normalizeBackupDataForImport(parsed)
                const preview = formatBackupPreview(buildBackupPreview(normalized, validation.keys))
                uni.showModal({
                  title: '确认导入内容',
                  content: `将恢复以下数据：\n${preview}\n\n继续前会自动保存当前本地数据备份。`,
                  confirmText: '确认导入',
                  success: async (confirmRes) => {
                    if (!confirmRes.confirm) {
                      isImporting.value = false
                      return
                    }
                    try {
                      await writeBackupFile(readBackupStorage((key) => uni.getStorageSync(key)), 'fitai-before-import')
                      validation.keys.forEach((key) => writeImportedStorage(key, normalized[key]))
                      loadSettings()
                      isImporting.value = false
                      uni.showToast({ title: '导入成功', icon: 'success' })
                    } catch (error) {
                      isImporting.value = false
                      uni.showToast({ title: '导入前备份失败，已停止导入', icon: 'none' })
                    }
                  }
                })
              } catch (error) {
                isImporting.value = false
                uni.showToast({ title: '备份文件解析失败', icon: 'none' })
              }
            },
            fail: () => {
              isImporting.value = false
              uni.showToast({ title: '读取文件失败', icon: 'none' })
            }
          })
        },
        fail: () => {
          isImporting.value = false
          uni.showToast({ title: '已取消导入', icon: 'none' })
        }
      })
    }
  })
}

const goHistory = () => uni.navigateTo({ url: '/pages/history-query/history-query' })
const goBodyData = () => uni.navigateTo({ url: '/pages/body-data/body-data' })
const confirmClearCache = () => {
  if (isClearing.value || isImporting.value || isExporting.value) return
  uni.showModal({
    title: '清空数据',
    content: '会清空本地训练记录、模板、计划、身体数据、饮食记录和提醒设置。这个操作不可恢复。',
    success: (res) => {
      if (!res.confirm) return
      isClearing.value = true
      backupStorageKeys.forEach((key) => uni.removeStorageSync(key))
      isClearing.value = false
      uni.showToast({ title: '已清空', icon: 'success' })
    }
  })
}

onMounted(loadSettings)
</script>

<style lang="scss" scoped>
.settings-page { min-height: 100vh; padding: 24rpx 24rpx 140rpx; background: #f4f6f8; box-sizing: border-box; }
.panel { margin-bottom: 20rpx; padding: 28rpx; border-radius: 12rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }
.panel-title { color: #101820; font-size: 30rpx; font-weight: 800; }
.panel-note { color: #718096; font-size: 22rpx; }
.setting-row, .action-row, .time-row { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; padding: 22rpx 0; border-top: 1rpx solid #edf2f7; }
.setting-row:first-of-type, .action-row:first-of-type { border-top: 0; }
.setting-copy { min-width: 0; flex: 1; }
.setting-title { display: block; color: #101820; font-size: 28rpx; font-weight: 700; }
.setting-desc { display: block; margin-top: 6rpx; color: #718096; font-size: 22rpx; line-height: 1.45; }
.subscribe-box { margin: 4rpx 0 16rpx; padding: 20rpx; border-radius: 12rpx; background: #f8fafc; }
.template-id { display: block; margin-top: 12rpx; color: #101820; font-size: 24rpx; font-weight: 800; }
.secondary-btn { margin-top: 16rpx; height: 72rpx; line-height: 72rpx; border-radius: 36rpx; background: #edf2f7; color: #101820; font-size: 26rpx; font-weight: 800; }
.secondary-btn[disabled], .save-btn[disabled], .action-row.busy { opacity: .65; }
.subscribe-state { display: block; margin-top: 12rpx; color: #718096; font-size: 22rpx; }
.time-picker { min-width: 150rpx; padding: 14rpx 20rpx; border-radius: 10rpx; background: #f8fafc; color: #101820; font-size: 26rpx; text-align: center; }
.arrow { color: #a0aec0; font-size: 40rpx; line-height: 1; }
.danger .setting-title { color: #dc2626; }
.about-text { display: block; color: #4a5568; font-size: 25rpx; line-height: 1.7; }
.save-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: 18rpx 24rpx 28rpx; background: rgba(255,255,255,.96); box-shadow: 0 -8rpx 24rpx rgba(16,24,32,.08); }
.save-btn { height: 88rpx; line-height: 88rpx; border-radius: 44rpx; background: #101820; color: #fff; font-size: 30rpx; font-weight: 800; }
</style>
