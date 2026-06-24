# 契约：自定义 XMPP 命令与事件

**阶段**：1 — Design
**Mission**：`custom-xmpp-command-and-event-01KVVVG9`
**日期**：2026-06-24

这是宿主页面与 jitsi-meet iframe / React Native 视图之间的公开契约。它与 `modules/API/external/external_api.js`（web 端）以及 `ExternalAPI` native 模块（移动端）的内部接线一一对应。

## 命令：`sendCustomXmppCommand`

**Wire 名（kebab-case）**：`send-custom-xmpp-command`
**公开方法**：`JitsiMeetExternalAPI.executeCommand('sendCustomXmppCommand', { target, payload })`
**返回类型**：`void`（同步）

### 参数

| 名称 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `target` | `string` | 是 | 接收参与者的 `participantId`。宿主页面通过现有的 `participantJoined` 事件获得这个 id。 |
| `payload` | `object` | 是 | 宿主页面自有的、可以 JSON 编码的对象。按约定必须带一个非空字符串的 `action` 字段。序列化后大小不超过 16 KiB。 |

### 行为

| 前置条件 | 结果 |
|----------|------|
| `target` 已经不在会议里 | jitsi-meet 调用 `conference.sendPrivateTextMessage`，传输层返回错误；jitsi-meet 打印 `console.error`。**不**通知宿主页面。 |
| `payload` 校验失败（非对象、没有 `action`、过大、不可序列化） | jitsi-meet 打印 `console.error`，**不**调用 `sendPrivateTextMessage`。 |
| 本地会议尚未加入 | jitsi-meet 打印 `console.error`，**不**调用 `sendPrivateTextMessage`。 |
| 所有前置条件通过 | jitsi-meet 调用 `conference.sendPrivateTextMessage(target, JSON.stringify(payload))`。 |

### 并发

- 同一宿主页面在短时间内连续两次 `executeCommand` 调用会被 MUC 传输层独立入队。FIFO 顺序在 (sender, target) 对上保持。
- 两个宿主页面可以各自向同一目标调用 `sendCustomXmppCommand`。两次调用都会落地；接收方会看到两次 `customXmppEvent` 事件。jitsi-meet **不**去重。宿主页面**应当**在 payload 中用 `requestId` 字段让处理逻辑幂等。

## 事件：`customXmppEvent`

**Wire 名（camelCase）**：`customXmppEvent`
**公开方法**：`JitsiMeetExternalAPI.addEventListener('customXmppEvent', (payload) => { ... })`

### 参数

| 名称 | 类型 | 说明 |
|------|------|------|
| （单一参数） | `object` | 发送方传入的 `payload` 对象。始终是非 null 的对象。 |

### 触发时机

- 接收方的 jitsi-meet 实例收到了一条发往自己的 MUC 私聊消息。
- body 解析为 JSON，且解析结果是非 null、非数组的对象。
- 宿主页面已为 `customXmppEvent` 注册了监听器。

如果宿主页面没有注册监听器，消息会被静默丢弃——不打印 `console.error`，不重试。

### 不会触发的场景

- body 解析 JSON 失败。
- body 解析为 `null`、数组或非对象。
- 发送方与接收方是同一个参与者（jitsi-meet 默认不会把 MUC 私聊消息投递给自己）。
- 目标参与者当前未加入会议。

## 示例

### 宿主页面 — 发送

```js
// tab A
api.addEventListener('videoConferenceJoined', () => {
    api.executeCommand('sendCustomXmppCommand', {
        target: firstJoinerId,                  // tab A 自己的 participantId
        payload: {
            action: 'duplicateDetected',
            requestId: 'req-123',
            role: 'firstJoiner'
        }
    });
});
```

### 宿主页面 — 接收

```js
// tab A（第一个先入会的）
api.addEventListener('customXmppEvent', (payload) => {
    if (payload.action === 'duplicateDetected' && payload.role === 'firstJoiner') {
        // 我是第一个先入会的——主动退出
        api.executeCommand('hangup');
    }
});
```

### React Native（宿主）— 发送

```ts
import { NativeModules } from 'react-native';
const { JitsiMeetView } = NativeModules;

JitsiMeetView.sendCustomXmppCommand(target, payload);
```

### React Native（宿主）— 接收

```ts
import { NativeEventEmitter, NativeModules } from 'react-native';
const emitter = new NativeEventEmitter(NativeModules.JitsiMeetView);

emitter.addListener('customXmppEvent', payload => {
    if (payload.action === 'duplicateDetected' && payload.role === 'firstJoiner') {
        JitsiMeetView.hangUp();
    }
});
```

## 错误处理矩阵

| 失败 | 检测方 | 宿主页面看到什么 |
|------|--------|------------------|
| `target` 不存在 | `conference.sendPrivateTextMessage` 返回传输错误 | 无。iframe / RN 应用内部打印 `console.error`。 |
| `payload` 非法 | jitsi-meet（同步） | 无。iframe / RN 应用内部打印 `console.error`。 |
| 本地会议未加入 | jitsi-meet（同步） | 无。iframe / RN 应用内部打印 `console.error`。 |
| 接收方 body 解析失败 | jitsi-meet（同步） | 无。iframe / RN 应用内部打印 `console.error`。 |
| 接收方没有监听器 | jitsi-meet | 无。不打印 `console.error`。 |
| 接收方已离开会议 | MUC 传输层 | 无。发送方的 iframe / RN 应用内部打印 `console.error`。 |
