# 自定义 XMPP 命令与事件监听

**状态**: 草稿
**Mission**: `custom-xmpp-command-and-event-01KVVVG9`
**负责人**: jitsi-meet 前端
**最后更新**: 2026-06-24

## 概述

Jitsi Meet 的 `JitsiMeetExternalAPI` 暴露了一组固定的 `executeCommand` 动作和固定的事件集合。宿主页面如果想完全从会议 UI 外部驱动一个协同流程（例如：检测到同一个用户重复入会、请先入会的那个用户主动退出），目前没有干净的方式向单个参与者发送一条私聊消息，并观察对端的入站消息。

本次 mission 新增一个命令 `sendCustomXmppCommand` 和一个事件 `customXmppEvent`。底层传输是 MUC 私聊消息，目标是单个参与者的 occupant JID。payload 是一个宿主页面自己定义的 JSON 对象。"同一人"规则、退出策略、所有身份与入会顺序的判断逻辑全部由宿主页面承担；jitsi-meet 只提供通道。

## 使用场景（主要场景）

宿主页面为同一个最终用户的两个浏览器会话嵌入了 Jitsi Meet。宿主页面希望确保同一时刻只有一个会话保持连接。"是否是同一人"由宿主页面自行判定（例如读取它在入会时设置的某个自定义参与者属性）。

1. 会话 A 入会。宿主页面记录其 `participantId` 和入会顺序。
2. 会话 B 以同一身份入会。宿主页面识别出重复。
3. 宿主页面调用 `api.executeCommand('sendCustomXmppCommand', { target: <会话 A 的 participantId>, payload: { action: 'duplicateDetected', role: 'firstJoiner' } })`。
4. jitsi-meet 通过 MUC 私聊消息通道把 payload 路由到会话 A 的标签页。
5. 会话 A 的宿主页面收到 `customXmppEvent`，payload 与发送时一致，判定本地用户应该退出，于是调用 `api.executeCommand('hangup')`。
6. 会话 A 主动退出。会话 B 保持在线。

## 用户场景与测试

### 场景 1 — 正常路径：检测重复用户并优雅退出

- **参与者**：同一个用户在两个浏览器标签页中的宿主页面。
- **触发**：第二个标签页入会，宿主页面检测到重复。
- **流程**：
  1. 宿主页面调用 `executeCommand('sendCustomXmppCommand', { target, payload })`。
  2. jitsi-meet 将命令派发到 MUC 私聊消息传输层，只发给指定的那个参与者。
  3. 接收方的 jitsi-meet 实例在其宿主页面上触发 `customXmppEvent`。
  4. 接收方的宿主页面调用 `executeCommand('hangup')`。
- **成功**：只有第一个标签页的用户留在会议中，第二个标签页的用户保持其会话。
- **可验证结果**：在两标签页测试中，宿主页面驱动的流程结束后，会议中只有一个本地用户；第一个标签页针对本地用户会触发 `participantLeft` 事件。

### 场景 2 — 目标参与者已经离开

- **触发**：宿主页面为一个已经离开会议的 `target` 发送命令。
- **流程**：jitsi-meet 调用 MUC 传输层，lib-jitsi-meet 的发送路径返回失败（occupant JID 不存在）。
- **结果**：在 iframe / RN 应用内部打印一条 `console.error`；接收方不会收到事件；不会向发送方的宿主页面抛错。

### 场景 3 — 接收方没有监听器

- **触发**：目标参与者的宿主页面从未调用 `addEventListener('customXmppEvent', ...)`。
- **流程**：jitsi-meet 仍在 lib-jitsi-meet 层投递该消息，但事件没有处理器。
- **结果**：消息被静默丢弃，不打印错误，不重试。

### 场景 4 — payload 格式错误

- **触发**：payload 不是可序列化的 JSON 对象，或者超过合理大小。
- **流程**：jitsi-meet 同步拒绝该命令并打印 `console.error`，不产生任何 XMPP 流量。

### 场景 5 — 跨平台

- **触发**：发送方是 web，接收方是 React Native（或反过来）。
- **流程**：命令/事件名与 payload 结构在两端完全一致。
- **结果**：JSON payload 顺利穿越 JS / native bridge；接收方行为完全一致。

### 场景 6 — 并发 / 重复发送

- **触发**：两个不同的宿主页面各自检测到同一个重复用户，并都向同一个目标调用 `sendCustomXmppCommand`。
- **流程**：jitsi-meet 把两条消息都入队；MUC 传输按到达顺序把消息投递给目标。目标参与者的宿主页面会收到两次 `customXmppEvent`，payload 类似。
- **结果**：jitsi-meet 不做去重。目标参与者的宿主页面应使用 payload 内的 `requestId`（或 `action` 字段）使处理逻辑幂等。本次 mission 落地后，jitsi-meet 自身**不得**去重或合并。

## 功能需求

| ID | 状态 | 需求 |
|----|--------|------|
| FR-001 | Proposed | jitsi-meet **必须**接受一个新的 external API 命令 `sendCustomXmppCommand`，参数为 `{ target: string, payload: object }`，其中 `target` 是会议暴露的 participant id，`payload` 是宿主页面拥有的、任何可 JSON 序列化的对象。 |
| FR-002 | Proposed | 调用 `sendCustomXmppCommand` 时，jitsi-meet **必须**把 `participantId` 解析为 MUC occupant JID，并通过现有的 MUC 私聊消息传输（`conference.sendPrivateTextMessage`）把 JSON 编码后的 `payload` 投递到该 JID。 |
| FR-003 | Proposed | jitsi-meet **必须**暴露一个新的 external API 事件 `customXmppEvent`，参数为发送时的 `payload` 对象。事件**仅**在 JID 匹配 `target` 的那个参与者的宿主页面上触发。 |
| FR-004 | Proposed | 发送侧的 `executeCommand` **必须**沿用现有的 `JitsiMeetExternalAPI.executeCommand` 契约：同步执行、返回 `void`。jitsi-meet 在本次 mission 中**不得**扩展该契约。命令不合法时，jitsi-meet **必须**打印到 `console` 且**不得**以任何方式向宿主页面通知成功或失败。宿主页面只能通过观察对端是否收到 `customXmppEvent` 来间接确认一次往返。 |
| FR-005 | Proposed | 在产生任何 XMPP 流量之前，jitsi-meet **必须**对 `payload` 做同步校验：必须是非 null 的对象、可 JSON 序列化、序列化后大小不超过 16 KiB。校验失败的 payload **必须**被丢弃并打印 `console.error`。宿主页面只能通过"对端没有收到 `customXmppEvent`"这一间接现象得知失败。 |
| FR-006 | Proposed | jitsi-meet **必须**订阅 `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED`（或 native 等价事件），把消息体解析为 JSON，仅在解析成功时以解析结果作为 `customXmppEvent` 重新派发。格式错误的消息体**必须**在接收端被静默丢弃。 |
| FR-007 | Proposed | 宿主页面**必须**能够在 web 与 React Native（iOS + Android）构建的 jitsi-meet 中使用 `sendCustomXmppCommand` 和 `customXmppEvent`，语义完全一致。 |
| FR-008 | Proposed | 只要对端会议仍然处于加入状态，jitsi-meet **必须**支持在 prejoin、in-meeting 和退出流程结束前调用 `sendCustomXmppCommand`。本地会议已不存在时，命令**必须**被丢弃并打印 `console.error`。目标参与者已离开会议时，命令**必须**被传给 MUC 传输，由其返回投递错误；该错误**必须**被记录，不向宿主页面暴露。 |

## 非功能需求

| ID | 状态 | 需求 |
|----|--------|------|
| NFR-001 | Proposed | 新增的命令和事件**必须**完全在 jitsi-meet 项目内实现。**不得**修改 `lib-jitsi-meet`，运行时也**不得**访问 `JitsiConference` 或 `ChatRoom` 的私有字段。 |
| NFR-002 | Proposed | 新增代码**只**使用 `JitsiConference` 的文档化公开 API（特别是 `sendPrivateTextMessage`、对 `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED` 使用 `addListener` / `on`、以及 `getParticipantById`）。 |
| NFR-003 | Proposed | 从 `executeCommand` 被调用到接收方触发 `customXmppEvent` 的往返时延**必须**由 XMPP 传输层主导，而不是 jitsi-meet 自身的处理。jitsi-meet 自身的同步处理耗时**不得**超过 50 ms。 |
| NFR-004 | Proposed | 新增代码**必须**通过 `npm run lint`、`npm run tsc:web` 和 `npm run tsc:native`，且**不得**引入新的告警。 |
| NFR-005 | Proposed | 新增代码**必须**通过一个两标签页的端到端手测场景验证（使用 `doc/examples/api.html` 或新建的同目录示例文件），场景覆盖：(a) 正常路径往返；(b) 目标不存在；(c) payload 非法；(d) 跨平台（web + RN）等价。 |
| NFR-006 | Proposed | 新增代码**不得**让任何已存在的 `JitsiMeetExternalAPI` 命令或事件退化。现有的 `doc/examples/api.html` 手测**必须**保持不变地通过。 |

## 约束

| ID | 状态 | 约束 |
|----|--------|------|
| C-001 | Confirmed | 实现只在 jitsi-meet 仓库内进行。`lib-jitsi-meet` 视为外部 npm 依赖，本次 mission **不得**修改。 |
| C-002 | Confirmed | 传输通道是现有的 MUC 私聊消息。本次 mission **不得**引入新的 XMPP stanza、namespace、IQ 或 component address。 |
| C-003 | Confirmed | "同一人 / 第一个先入会" 的规则由宿主页面承担。jitsi-meet 不认证参与者、不判定"是否同一人"、不强制任何退出策略。 |
| C-004 | Confirmed | 支持的平台为 web（现有的 `index.web.js` SPA）和 React Native（通过现有的 `index.ios.js` / `index.android.js` 入口支持的 iOS + Android）。**不**包含桌面或 Electron 相关工作。 |
| C-005 | Confirmed | 触发入口是公开的 `JitsiMeetExternalAPI`（`api.executeCommand` / `api.addEventListeners`）。新增命令与事件遵循 `modules/API/external/external_api.js` 和 `react/features/external-api/` 中现有的派发模式。 |
| C-006 | Confirmed | 命令**必须**以单个 MUC occupant 为目标，定位方式是 participant id。群发 / 广播 / 全房间通知明确**不在**本次 mission 范围内。 |

## 验收标准

- 通过两标签页手测（使用 `doc/examples/api.html` 或独立的小型示例）：宿主页面从标签页 A 向标签页 B（同一用户同一会议）调用 `sendCustomXmppCommand`，标签页 B 收到 `customXmppEvent`，payload 与发送时完全一致。
- 手测：使用一个不存在的 `target` 调用 `sendCustomXmppCommand` **不会**向宿主页面抛错；iframe / RN 应用内部打印 `console.error`。
- 手测：使用非对象或超大的 `payload` 调用 `sendCustomXmppCommand` **不会**调用会议上的 `sendPrivateTextMessage`；打印 `console.error`。
- 同一命令和事件在 React Native 构建中可用（iOS 或 Android 手测验证），**不**存在 web-only 的代码路径。
- 本次 mission **不得**修改 `lib-jitsi-meet`，生产代码**不得**读取 `JitsiConference` 或 `ChatRoom` 的私有字段。

## 关键实体

- **命令**：`sendCustomXmppCommand` — 由宿主页面触发的动作。
  - 参数：`{ target: string (participantId), payload: object }`
  - 返回值：`void`（没有同步返回值；反馈通过接收方的 `customXmppEvent` 体现）
- **事件**：`customXmppEvent` — 在接收方的宿主页面上触发。
  - 参数：原始的 `payload` 对象。
- **传输**：MUC 私聊消息（`<message type="chat" to="room@conf.example/occupant">`，body 为 JSON 字符串），jitsi-meet 通过 `conference.sendPrivateTextMessage` 发送，通过 `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED` 接收。
- **参与者身份**：通过 `JitsiConference.getParticipantById` 暴露的 `participantId`，并通过现有的 `participantJoined` / `participantUpdated` / `participantLeft` 事件传递到宿主页面。宿主页面负责把该 id 映射到自己的用户模型。

## 假设

- "同一人"是宿主页面的概念。jitsi-meet 不需要稳定的用户 id；宿主页面可以给参与者挂任何它想要的标识（例如通过自定义参与者元数据字段），并自行判定相等。
- MUC 私聊消息传输是唯一需要的通道。该用例**不**需要基于 IQ 的自定义命令。
- 接收方宿主页面负责执行任何副作用（例如调用 `hangup`）。jitsi-meet 不会在收到事件后自动退出。
- 16 KiB 的 payload 上限对宿主页面驱动的流程来说是合理的上限，与 MUC 消息体大小的常见限制一致；如果某个流程需要更多容量，**不在**本次 mission 范围内，应该拆分或换用其他传输通道。
- 发送方的 `executeCommand` 是同步且返回 `void` 的。宿主页面验证成功的唯一方式是等待接收方收到 `customXmppEvent`；发送方**不会**收到正向确认事件。失败**只**能通过 iframe / RN 应用内部的 `console.error` 观察。
- 同一宿主页面的并发发送彼此独立：jitsi-meet 不做协调、不去抖、不合并。底层 MUC 传输保持按 (sender, target) 对的 FIFO 顺序，因此同一宿主页面对同一目标的连续发送会按发送顺序到达。跨对或跨宿主页面的并发超出 jitsi-meet 的控制范围：两个宿主页面可以各自向同一目标发送命令，目标参与者的宿主页面**应当**把 payload 当作幂等处理（例如在 payload 内使用 `requestId`，或以 `action` 字段作为去重 key）。

## 范围之外

- 认证两个参与者是否属于同一个最终用户。宿主页面自行负责。
- 群发 / 广播 / 全房间通知（那是另一个 mission）。
- 在 `lib-jitsi-meet` 或 jicofo 中引入新的 XMPP stanza、namespace、IQ 类型或新的 component address。
- 持久化 payload、失败重试、或保证至少一次投递。传输是尽力而为的 MUC 私聊消息。
- 收到事件后自动退出。是否调用 `hangup` 由宿主页面决定。
- 任何服务端变更（jicofo、prosody、focus、jigasi）。

## 遗留问题

- 无。本次 mission 的用例、传输选型、触发入口、平台范围、公开 API 约束均已与需求方确认。
