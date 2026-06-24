# 快速上手：自定义 XMPP 命令与事件的手测指南

**阶段**：1 — Design
**Mission**：`custom-xmpp-command-and-event-01KVVVG9`
**日期**：2026-06-24

本次 mission **不**引入自动化测试框架。本文档是 `spec.md` 中端到端手测场景的 runbook，也是本次 mission 的主要验收手段。

## 前置条件

- 一个已经合入本次 mission 改动的 jitsi-meet 运行构建。
- 一个可用的 Jitsi Meet 后端（web 端可以用公网的 `meet.jit.si`；iOS / Android 验证则需要一份本机能连到后端的构建）。
- 同一浏览器的两个标签页都打开 `doc/examples/custom-xmpp-example.html`（本次 mission 新增的示例页）。

## 测试环境

本次 mission 新增一份 HTML 示例 `doc/examples/custom-xmpp-example.html`。它基本是 `doc/examples/api.html` 的克隆，加上三处扩展：

- 一个 "Send custom XMPP command" 按钮，调用 `api.executeCommand('sendCustomXmppCommand', { target, payload })`；
- 一个 "First-joiner leaves voluntarily" 处理器，监听 `customXmppEvent` 并调用 `api.executeCommand('hangup')`；
- 客户端为每次 payload 生成一个 `requestId` 并写进去，用于去重。

跑两标签页流程时：在同一浏览器的两个窗口 / 标签页中打开该示例，加入同一房间名，使用相同的 `userInfo.name`（或宿主页面用来判定重复的任意身份字段）。

## 场景 1 — 正常路径：检测重复用户并优雅退出

1. 在标签页 A 中打开示例，以 `Alice` 加入房间 `TestRoom`。
2. 在标签页 B 中打开同一示例，也以 `Alice` 加入房间 `TestRoom`（同一身份）。
3. 标签页 A 检测到重复（通过把 `participantJoined` 事件中的字段与自己的 userId 对比）。
4. 标签页 A 调用 `sendCustomXmppCommand`，目标是 A 自己的 `participantId`（即第一个先入会的那个），payload 为 `{ action: 'duplicateDetected', requestId: 'r1' }`。
5. 标签页 A 收到 `customXmppEvent`，payload 与发送时一致，随即调用 `executeCommand('hangup')`。
6. 标签页 A 退出。标签页 B 继续。

**通过标准**：
- 步骤 4 后约 1 秒内，标签页 A 针对本地用户触发 `participantLeft` 事件。
- 标签页 A 离开后，标签页 B 中只剩一个本地参与者（自己）。
- 标签页 A 的控制台在 `hangup` 被调用前先打印了 `customXmppEvent` 的 payload。

## 场景 2 — 目标不存在

1. 在标签页 A 中以 `Alice` 加入房间 `TestRoom`。
2. 在标签页 A 的 devtools 控制台执行：
   ```js
   api.executeCommand('sendCustomXmppCommand', {
       target: 'this-id-does-not-exist',
       payload: { action: 'noop' }
   });
   ```
3. 标签页 A 的 iframe 控制台中会打印一条来自 jitsi-meet 层的 `console.error`。
4. 任何地方都不会触发 `customXmppEvent`（因为既没有人监听 `noop` 动作，也没有这个 id 的参与者）。

**通过标准**：不会向宿主页面抛错；存在 `console.error`；应用一切正常。

## 场景 3 — payload 非法

在标签页 A 的 devtools 控制台依次执行：
```js
api.executeCommand('sendCustomXmppCommand', { target: tabAId, payload: null });
api.executeCommand('sendCustomXmppCommand', { target: tabAId, payload: 'a string' });
api.executeCommand('sendCustomXmppCommand', { target: tabAId, payload: [] });
api.executeCommand('sendCustomXmppCommand', {
    target: tabAId,
    payload: { action: '' /* 没有 action */ }
});
api.executeCommand('sendCustomXmppCommand', {
    target: tabAId,
    payload: { action: 'oversize', big: 'x'.repeat(20 * 1024) }
});
```

**通过标准**：每次调用都打印 `console.error`，并且**不**调用会议上的 `sendPrivateTextMessage`（debug 构建里可以从 Network / xmpp 日志验证，或者通过接收方没有任何 `customXmppEvent` 间接验证）。

## 场景 4 — 跨平台（React Native）

1. 用本 mission 的改动构建并运行 iOS 或 Android app。
2. 从宿主应用（一个把 `JitsiMeetView` 嵌入的极简 native 壳）以 `Bob` 加入房间 `TestRoom`。
3. 从另一个 native 实例以 `Bob` 加入（两台真机，或一真机一模拟器，或一 native 一 web 标签页）。
4. 在第二个实例上触发"重复用户检测"流程。
5. 验证第一个实例收到 `customXmppEvent` 回调并调用 `hangUp`。

**通过标准**：第一个实例的宿主收到 `customXmppEvent`，payload 与发送时一致；第一个实例退出会议。

## 场景 5 — 回归：现有 `doc/examples/api.html` 仍正常工作

1. 在浏览器中打开 `doc/examples/api.html`。
2. 依次点击各按钮（toggleAudio、toggleVideo、setLargeVideoParticipant、sendChatMessage 等），确认每一个都正常工作。

**通过标准**：所有现有命令和事件仍按原有行为触发。新的 `sendCustomXmppCommand` 和 `customXmppEvent` 不在示例绑定列表中（因为示例里没绑），但其他 API 表面没有任何改变。

## 场景 6 — 并发 / 重复发送

1. 在标签页 A、B、C 中分别打开示例，全部以 `Alice` 加入房间 `TestRoom`（宿主页面用 `userInfo.name` 判定身份）。
2. 标签页 A 检测到自己的重复（A 是第一个先入会的），向自己发送 `{ action: 'duplicateDetected', requestId: 'r1' }`。
3. 标签页 C 也检测到重复，向标签页 A 发送 `{ action: 'duplicateDetected', requestId: 'r2' }`。
4. 标签页 A 收到两次 `customXmppEvent`，`requestId` 互不相同。

**通过标准**：jitsi-meet 投递两个事件。宿主页面的处理器用 `requestId` 决定自己是否已经响应过；如果标签页 A 已经退出，第二个 `requestId` 由宿主页面忽略（不是 jitsi-meet 忽略——jitsi-meet 会把能投的都投了）。

## 备注

- 这些场景中的 `console.error` 都来自 jitsi-meet 的 iframe / RN 应用内部，不是宿主页面。
- 16 KiB payload 上限由 `react/features/custom-xmpp/functions.ts` 强制。场景 3 中的 20 KiB payload 会在产生任何 XMPP 流量之前被拒。
- NFR-003 中 50 ms 的时延预算**不**通过手测验证；它由实现的简单性（校验 + `JSON.stringify` + 一次 `sendPrivateTextMessage` 调用）自然保证。
