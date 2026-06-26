# sendNotification 云函数部署说明

这个云函数负责发送微信订阅消息。代码已经对齐当前模板：

- 模板标题：身体状态记录提醒
- 温馨提示：`thing3`
- 上次记录日：`time1`

## 需要人工确认

1. 在微信公众平台确认模板仍然是这个 ID：
   `6TkLklsfN0aqs8AkyVbZtSQ0jGVNT1pHI6reULAp5TE`
2. 在微信开发者工具里开通并选择正确的云开发环境。
3. 部署云函数：
   - `saveReminderSettings`
   - `sendNotification`
4. `sendNotification/config.json` 已包含定时触发器配置。修改或确认后，需要重新上传并部署 `sendNotification`，建议选择“上传并部署：云端安装依赖”。
5. 确认云数据库存在集合：
   - `reminder_settings`
   - `training_records`
6. 确认当前云环境绑定的是这个小程序 AppID。否则调用微信开放接口会报 `invalid wx openapi access_token`。
7. 给 `sendNotification` 启用定时触发器。当前配置为每天 21:00 执行一次：`0 0 21 * * * *`。
8. 在真机里进入提醒中心，点击“申请微信订阅授权”，并确认页面显示“云端已同步”。

## 云函数控制台测试

可以在云函数控制台手动运行 `sendNotification`。返回值里重点看：

- `success`: 是否执行成功
- `checkedUsers`: 扫描到的已授权用户数
- `sent`: 成功发送条数
- `failed`: 发送失败条数
- `results[].skipped`: 没发送的原因

如果 `failed > 0`，通常优先检查：

- 返回里有没有 `version`。没有的话，说明云函数不是最新部署。
- 模板 ID 是否正确
- 模板字段是否仍是 `thing3` 和 `time1`
- 用户是否真的授权了一次性订阅
- 云函数是否有调用订阅消息接口的权限
- 当前云环境是否绑定当前小程序 AppID。`invalid wx openapi access_token` 通常优先查这一项。

## 重要限制

当前模板类型是一次性订阅。微信通常会在发送一次后消耗这次授权，后续再次发送可能需要用户重新授权。

训练记录主要保存在本地，所以前端会在保存提醒设置、授权订阅、保存训练记录后同步一个轻量提醒快照到云端。用户如果长时间不打开小程序，云端只能根据最后一次同步的快照判断提醒。
