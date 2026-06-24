# 调研：自定义 XMPP 命令与事件监听

**阶段**：0 — Research
**Mission**：`custom-xmpp-command-and-event-01KVVVG9`
**日期**：2026-06-24

## 决策 1 — 传输：MUC 私聊消息，不引入新的 IQ stanza

**决策**：使用现有的 MUC 私聊消息传输（`<message type="chat" to="room@conf.example/occupant"><body>...</body></message>`），通过 `conference.sendPrivateTextMessage(participantId, jsonString)` 调用。

**理由**：
- 本次 mission **不得**修改 `lib-jitsi-meet`（NFR-001）。如果新增 IQ stanza，需要：
  - 在 `lib-jitsi-meet` 中新增 `XEP` / namespace 常量；
  - 在 `XMPP._initStrophePlugins` 或 `ChatRoom` 中注册新的 `addHandler`；
  - 在 `JitsiConferenceEventManager` 中新增对应事件；
  - 在 `JitsiConference` 上新增公开方法；
  - 新增 `JitsiConferenceEvents.*` 常量。
  上述任何一项都超出"完全在 jitsi-meet 内"的本次 mission 范围。
- MUC 私聊消息传输是**唯一**能够通过公开 API 把 payload 投递给单个 MUC occupant 的通道。它也是 1:1 聊天和 av-moderation 定向通知用的同一条通道。
- 消息体本身是自由格式的字符串。把 JSON payload 编码为字符串 body 形态吻合、实现完全本地化。

**候选方案**：
- **自定义 IQ** — 拒绝：需要改 lib-jitsi-meet，违反 NFR-001。
- **WebRTC data channel** — 拒绝：data channel 是按参与方两两配对的，不是 MUC 范围的抽象；在任意两个参与者之间建立 data channel 成本不低，而且绕开了 MUC 的生命周期。
- **聊天（全房间）消息** — 拒绝：会发给所有参与者，不是单一目标。

## 决策 2 — 发送/接收使用的公开 API

**决策**：
- 发送：`conference.sendPrivateTextMessage(participantId, jsonString)`。
- 接收：`conference.on(JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED, handler)`。
- 把 `participantId` 解析为 MUC occupant JID：由 `conference` 内部完成，调用方只传 `participantId`（参考 `react/features/chat/middleware.ts:208`）。

**理由**：
- 两个方法都在 `JitsiConference` 的文档化公开 API 范围内。
- chat feature 已经在用同一对方法（发送：`react/features/chat/middleware.ts:208`；接收：`react/features/chat/middleware.ts:322`），是现成的可参照范式。
- 接收处理器的签名是 `(participantId, message, timestamp, messageId)`。我们忽略 `timestamp` 和 `messageId`（宿主页面不需要），把 `message` 当成要解析的 JSON 字符串。

**候选方案**：
- `conference.sendMessage(message, to)`（更老的"第三参数为私聊接收方"形态）— 也能用，但属于更低层的 API；`sendPrivateTextMessage` 是更干净的公开 API。
- 改订 `JitsiConferenceEvents.MESSAGE_RECEIVED` 而非 `PRIVATE_MESSAGE_RECEIVED` — 拒绝：前者对每条全房间聊天都会触发，不是我们要的私聊通道。

## 决策 3 — 新代码放在哪

**决策**：新增 feature 模块 `react/features/custom-xmpp/`，并在现有的 `external_api.js` 两个映射中各加一条、在 `react/features/external-api/middleware.ts` 中加一个 case。

**理由**：
- 新建 feature 模块让 diff 集中、可 review、可回滚。
- 新模块导出 action type 以及面向 redux 的发送/接收 middleware；自身不依赖 web 或 RN 平台特性。
- `external-api/middleware.ts` 是 redux → `APP.API` 的**唯一**扇出点。在那里新增一个 `case`，派发路径与项目现有的 50+ 事件保持对称。

**候选方案**：
- 把逻辑放进 `react/features/chat/` — 拒绝：语义上不是聊天，会混淆关注点。
- 把逻辑放进 `react/features/base/conference/` — 拒绝：那个目录负责会议生命周期，不承载应用级 feature；这样会让本 feature 与所有其他 feature 共享的 base 代码耦合。
- 新建 `react/features/base/custom-xmpp/` — 拒绝：base feature 是基础设施，本 feature 是应用级 feature。

## 决策 4 — `sendCustomXmppCommand` 的返回值

**决策**：没有返回值。`executeCommand` 契约保持同步且返回 `void`。宿主页面通过观察接收方是否收到 `customXmppEvent` 间接判断成功。

**理由**：
- `JitsiMeetExternalAPI.executeCommand` 是同步返回 `void` 的，被上百个已有集成使用；改动契约会破坏它们。
- 增加一个平行的"结果事件"需要约定 `requestId` 做往返，对一个本质是尽力而为传输的 feature 来说得不偿失。
- 在"重复用户"流程中，接收方宿主页面才是事实来源：用户仍在会议里，说明命令成功；用户不在了，说明命令失败。发送方通过现有的 `participantLeft` 事件就能观察到，不需要单独的 ack。

**候选方案**：
- 新增 `customXmppCommandResult` 事件 — 拒绝：需要约定 `requestId`，会把这个一次性 feature 的 API 复杂化。
- 把 `executeCommand` 改成返回 Promise — 拒绝：会改 `external_api.js:913`，破坏所有现有调用点。

## 决策 5 — React Native bridge 对等

**决策**：在 `ios/sdk/src/ExternalAPI.{h,m}`、`ios/sdk/src/JitsiMeetView.{h,m}`、Android 的 `ExternalAPIModule.*` + `JitsiMeetView.*` 文件，以及 `react/features/mobile/external-api/middleware.ts` 的 listener / emit 调用处，添加 native bridge 常量和事件管道。

**理由**：
- 现有的 `sendChatMessage` / `chatUpdated` 配对就是模板，形态完全一致：命令从宿主经 `NativeEventEmitter` 流向 JS，事件从 JS 经 `JitsiMeetViewListener` 风格的回调流回宿主。
- bridge 的 JS 端已经在 `react/features/mobile/external-api/middleware.ts:452` 接入好，只需多加一个 `eventEmitter.addListener` 和一个 `eventEmitter.emit`。

**候选方案**：
- 跳过 native bridge、只交付 web 端 — 拒绝：spec FR-007 要求 RN 端对等，而且 RN 端的改动足够小，可以在同一次 mission 内落地。
- 改用泛型 `eventEmitter.sendEvent(name, data)` 而不是类型化常量 — 拒绝：现有模式就是类型化常量，保持一致更稳妥。

## 决策 6 — 测试方案

**决策**：使用新增的 `doc/examples/custom-xmpp-example.html` 做两标签页的端到端手测；再加上对现有 `doc/examples/api.html` 的手测，确保无回归。

**理由**：
- 仓库在 `react/features/` 下没有单元测试框架（已确认：没有 `*.spec.ts` / `*.test.ts` 文件，没有 `cypress/` 目录）。只为了一个 feature 引入 Jest 是相当大的范围扩张。
- 两标签页流程手测起来很直接，也是**唯一**能完整覆盖 XMPP 往返的测试方式——对 JSON 校验器做单元测试抓不到 `external_api.js` 里 wire 名拼写错。
- 对现有示例的手测是最便宜的回归检查。

**候选方案**：
- 为新 feature 引入 Jest + 少量单元测试 — 拒绝：属于范围扩张，且没有可参照的测试基础设施。
- 引入 Cypress / Playwright — 拒绝：同上的原因，且项目目前根本没有浏览器自动化层。
