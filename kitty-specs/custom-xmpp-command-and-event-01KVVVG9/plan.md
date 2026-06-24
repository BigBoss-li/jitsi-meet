# 实现计划：自定义 XMPP 命令与事件监听

**分支**：`meeting/develop` | **日期**：2026-06-24 | **Spec**：[`spec.md`](./spec.md)
**Mission**：`custom-xmpp-command-and-event-01KVVVG9`
**输入**：[`spec.md`](./spec.md) 中的功能规范

## 概述

为 Jitsi Meet 新增一个 external API 命令 `sendCustomXmppCommand` 和一个事件 `customXmppEvent`。底层传输使用现有的 MUC 私聊消息通道。宿主页面调用 `api.executeCommand('sendCustomXmppCommand', { target, payload })`；jitsi-meet 把 payload 编码为 JSON 字符串，通过 `conference.sendPrivateTextMessage` 投递到目标参与者的 MUC occupant JID。接收方解析消息体后，在其宿主页面上触发 `customXmppEvent`。

本次改动完全限定在 jitsi-meet 项目内：在 `react/features/custom-xmpp/` 下新增一个 feature 模块，在 `external_api.js` 的 command/event 映射中各加一条记录，在 `react/features/external-api/middleware.ts` 中加一个 case 把新的 redux action 转发到 iframe 传输层，并在 React Native bridge 中（`ios/sdk/src/ExternalAPI.*`、`ios/sdk/src/JitsiMeetView.*`、对应的 Android 文件、以及 `react/features/mobile/external-api/middleware.ts`）做对称的新增。

**不**修改 `lib-jitsi-meet`；**不**触碰 `JitsiConference` / `ChatRoom` 的私有字段；**不**引入新的 XMPP stanza、namespace、IQ 或 component address。

## 分支契约

- 计划开始时的当前分支：`meeting/develop`
- 计划 / 基准分支：`meeting/develop`
- 完成后最终 merge 目标：`meeting/develop`
- `branch_matches_target`（来自 `setup-plan --json`）：`true`

本次 mission 在当前分支上直接交付，无需切换 feature 分支——一开始就在非主分支上。

## 技术上下文

**语言/版本**：TypeScript 4.x、ECMAScript 2020。Web 目标：ES2020 SPA，由 Webpack 5 打包。React Native 目标：0.73.x（iOS 13+ / Android API 24+）。
**主要依赖**：
- `react` 18.x，`react-redux` 7.x，`redux-thunk` 2.x
- `lib-jitsi-meet`（只读 npm 依赖；本次 mission **不**修改）
- `strophe.js`（经由 lib-jitsi-meet 间接引入；**不**修改）
- 移动端：`react-native` 0.73.x，`NativeEventEmitter`（已在 `react/features/mobile/external-api/middleware.ts` 中接入）
**存储**：N/A。没有新的持久化状态。本功能就是一层传输通道。
**测试**：针对运行中的 jitsi-meet 构建进行手测，使用新增的 `doc/examples/custom-xmpp-example.html`（与现有的 `doc/examples/api.html` 同级）。两个浏览器标签页模拟"重复用户"场景。本次 mission **不**引入自动化测试框架；项目本身在 `react/features/` 树下也没有现成的单元测试基础设施。
**目标平台**：Web（当前版本的 Chrome / Firefox / Safari），React Native iOS 13+，React Native Android API 24+。**不**包含 Electron / 桌面端改动。
**项目类型**：Web SPA + React Native 应用共用同一棵 `react/features/` 树。新 feature 位于 `react/features/custom-xmpp/`，采用标准的 web/native 拆分约定（`.ts` 共享，仅在必要时引入 `.web.ts` / `.native.ts` 兄弟文件——本次 mission **不**需要，因为实现是与平台无关的 JS）。
**性能目标**：发送路径同步耗时 < 50 ms（校验 + `JSON.stringify` + 派发）。接收路径同样在该预算内（解析 + 派发）。往返时延由 XMPP 传输层主导。
**约束**：
- **不得**修改 `lib-jitsi-meet`（NFR-001）。
- 运行时**不得**读取 `JitsiConference` 或 `ChatRoom` 的私有字段（NFR-001）。
- **必须**使用 `conference.sendPrivateTextMessage(participantId, jsonString)` 发送，使用 `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED` 接收（NFR-002）。
- Payload 上限：序列化后 16 KiB，且必须是可 JSON 编码的对象（FR-005）。
- **必须**通过 `npm run lint`、`npm run tsc:web` 和 `npm run tsc:native`，且**不得**引入新告警（NFR-004）。
- `executeCommand` 是同步返回 `void` 的契约；**不**为发送结果增加回传事件（FR-004）。
**规模/范围**：一个新增 feature 模块（约 5–8 个小文件），web 端 `commands` / `events` 映射和 mobile native bridge 常量中各加一条新记录，`external-api/middleware.ts` 中加一个新的 redux action case。涉及到的文件：`modules/API/external/external_api.js`、`react/features/external-api/middleware.ts`、`react/features/custom-xmpp/*`（新增）、`react/features/mobile/external-api/middleware.ts`、`ios/sdk/src/ExternalAPI.{h,m}`、`ios/sdk/src/JitsiMeetView.{h,m}`、Android 对应文件、`doc/examples/custom-xmpp-example.html`（新增）、`doc/api.md`。

## Charter Check

*项目不存在 charter 文件（`.kittify/charter/charter.md` 缺失）。按照 plan 工作流约定，Charter Check 跳过。设计已遵循内置的若干 directive（Architectural Integrity、Decision Documentation、Specification Fidelity、Locality of Change、Test-First）：本 feature 是单一、边界清晰的事项；公开 API 契约记录在 `contracts/` 中；实现是一次小的纯增量变更；手测方案记录在 `quickstart.md` 中。*

## 项目结构

### 本 mission 文档

```
kitty-specs/custom-xmpp-command-and-event-01KVVVG9/
├── plan.md              # 本文件
├── research.md          # Phase 0 产物
├── data-model.md        # Phase 1 产物
├── quickstart.md        # Phase 1 产物
├── contracts/
│   └── custom-xmpp.md   # 命令 + 事件契约
├── checklists/
│   └── requirements.md  # 在 /spec-kitty.specify 阶段已提交
└── tasks.md             # Phase 2 产物（不由 /spec-kitty.plan 创建）
```

### 源码（仓库根目录）

```
react/features/custom-xmpp/                            # 新增 feature 模块
├── actionTypes.ts                                      # SEND_CUSTOM_XMPP_COMMAND, CUSTOM_XMPP_EVENT_RECEIVED
├── actions.ts                                          # action creators（sendCustomXmppCommand, customXmppEventReceived）
├── functions.ts                                        # validatePayload, encodePayload, tryDecodePayload
├── middleware.ts                                       # 处理 SEND_CUSTOM_XMPP_COMMAND（发送）+ 注册 PRIVATE_MESSAGE_RECEIVED 监听
├── index.ts                                            # 桶导出
└── logger.ts                                           # 局部 logger（参照 react/features/<feature>/logger.ts 的既有模式）

modules/API/external/external_api.js                   # 仅在 `commands` 与 `events` 映射中新增条目
react/features/external-api/middleware.ts              # 在 post-next switch 中新增 `case CUSTOM_XMPP_EVENT_RECEIVED`
react/features/mobile/external-api/middleware.ts       # 新增 SEND_CUSTOM_XMPP_COMMAND 的 eventEmitter.addListener + CUSTOM_XMPP_EVENT 的 eventEmitter.emit

ios/sdk/src/ExternalAPI.{h,m}                          # 注册 SEND_CUSTOM_XMPP_COMMAND action + 新增 JitsiMeetViewListener 方法
ios/sdk/src/JitsiMeetView.{h,m}                        # 新增 sendCustomXmppCommand:target:payload: 和 onCustomXmppEvent: API
android/app/src/main/.../ExternalAPIModule.*           # 注册 SEND_CUSTOM_XMPP_COMMAND + CUSTOM_XMPP_EVENT
android/sdk/src/main/.../JitsiMeetView.*               # 公开 API

doc/examples/custom-xmpp-example.html                  # 新增的手测页面（两标签页流程）
doc/api.md                                             # 文档化新增的命令和事件
```

**结构决策**：使用独立的 `react/features/custom-xmpp/` 模块（依据 plan 阶段问答结果）。这样新命令 / 事件 / middleware 自成一体，diff 易于 review，并且避免与 `react/features/chat/` 出现意外耦合。`react/features/external-api/middleware.ts` 仍然是从 redux 到 `APP.API` 的唯一扇出点，我们在那里加一个 `case`，而不是另起一条并行的派发路径。

## 复杂度追踪

没有需要为 Charter Check 找借口的违规。

## 实现关注点映射（IC Map）

> 实现关注点（IC）**不是** work package。`/spec-kitty.tasks` 把每个 IC 拆成一个或多个 WP。

### IC-01 — Web external API 注册

- **目的**：让 `JitsiMeetExternalAPI` 的使用者能够发现新的命令和事件。
- **相关需求**：FR-001, FR-003, C-005
- **涉及面**：`modules/API/external/external_api.js`（`commands` 映射第 29 行，`events` 映射第 107 行）
- **顺序/依赖**：无
- **风险**：kebab-case 名称写错会导致宿主页面的命令失效；必须**同时**在命令映射（`sendCustomXmppCommand: 'send-custom-xmpp-command'`）和事件映射（`'custom-xmpp-event': 'customXmppEvent'`）中各加一条记录。映射一旦补齐，现有的 `executeCommand`（第 913 行）和 iframe 传输层会自然地完成剩余工作。

### IC-02 — `react/features/custom-xmpp/` feature 模块（逻辑）

- **目的**：校验 payload、编码为 JSON 字符串、调度会议发送、订阅并解码 `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED` 消息。
- **相关需求**：FR-001, FR-002, FR-005, FR-006, FR-008, NFR-002, NFR-003
- **涉及面**：新增的 `react/features/custom-xmpp/{actionTypes,actions,functions,middleware,index,logger}.ts`
- **顺序/依赖**：IC-01（iframe 传输需要注册条目才能下发命令，但 feature 模块的代码可以并行编写和构建）
- **风险**：
  - 校验必须拒绝非对象、含 NaN、含循环引用、序列化后超大的 payload。用 `JSON.stringify` 长度配合 `try/catch` 检测不可序列化结构。
  - 对 `PRIVATE_MESSAGE_RECEIVED` 的订阅在会议加入/重入时不得重复注册。沿用 chat feature 的模式（`react/features/chat/middleware.ts:322`）——在 `CONFERENCE_JOINED` 处理器内部挂监听。
  - 消息体解析器必须静默丢弃非 JSON 或非对象的消息体——绝不让异常抛入会议事件循环。
  - 发送路径在本地会议消失时必须打印日志并中止（FR-008），**不得**抛出异常。

### IC-03 — Web 端桥接到 `JitsiMeetExternalAPI`（iframe 侧）

- **目的**：当新的 redux action 派发时（无论是 `custom-xmpp/middleware.ts` 在发送后派发，还是在收到消息后派发），都通过 `APP.API.notifyCustomXmppEvent(payload)` 通知宿主页面。
- **相关需求**：FR-003, FR-006, C-005
- **涉及面**：`react/features/external-api/middleware.ts`（post-`next` 的 switch，第 94 行附近）
- **顺序/依赖**：IC-02（action type 必须先存在）
- **风险**：这是一次一行的改动；主要风险是忘了在 switch 中加对应的 `case`，导致事件被静默丢失。

### IC-04 — React Native bridge（mobile external API）

- **目的**：让把 Jitsi Meet 作为 React Native 视图嵌入的宿主应用也能使用新命令和新事件。
- **相关需求**：FR-007, C-004, C-005
- **涉及面**：
  - `react/features/mobile/external-api/middleware.ts` —— `eventEmitter.addListener(ExternalAPI.SEND_CUSTOM_XMPP_COMMAND, ...)` 与 `eventEmitter.emit(ExternalAPI.CUSTOM_XMPP_EVENT, ...)`。
  - `ios/sdk/src/ExternalAPI.{h,m}` —— 注册 `SEND_CUSTOM_XMPP_COMMAND` 和 `CUSTOM_XMPP_EVENT` 字符串，声明 action handler。
  - `ios/sdk/src/JitsiMeetView.{h,m}` —— 新增 `sendCustomXmppCommand:target:payload:` 和 `onCustomXmppEvent:` 监听 API。
  - Android `ExternalAPIModule.*` 与 `JitsiMeetView.*` —— 与 iOS 端对称。
- **顺序/依赖**：IC-02（mobile middleware 派发 action 前，action type 必须从新 feature 模块导出）
- **风险**：
  - mobile bridge 常量必须与 iOS / Android 的字符串 key 完全一致。建议在新 feature 模块中建立单一事实源，或在两侧写明常量说明。
  - Android 端是 Java/Kotlin；需要做一次小规模、机械的 iOS→Android 移植。
  - `eventEmitter.emit(...)` 调用必须运行在 JS 线程上（`react-native` 的 `NativeEventEmitter.emit` 在 JS 侧确实是同步的，这一点天然满足）。

### IC-05 — 手测示例 + 文档

- **目的**：提供一个可运行的两标签页手测示例，覆盖正常路径和三种失败场景，并在 `doc/api.md` 中记录新命令/事件。
- **相关需求**：NFR-005, NFR-006
- **涉及面**：`doc/examples/custom-xmpp-example.html`（新增）、`doc/api.md`（修改）
- **顺序/依赖**：示例要跑通需要 IC-01 / IC-02 / IC-03 到位；IC-04 在 iOS / Android 上单独验证。
- **风险**：示例需要使用 `JitsiMeetExternalAPI` 的 **iframe** 形式（而不是 SDK 形式），这样同一份文件在任何浏览器里都能直接用。风格上对齐 `doc/examples/api.html`。

### 跨切面说明

IC-02 中的 action type 会被 IC-03（web）与 IC-04（mobile）import。为避免循环引用，新 feature 模块对外暴露的是纯字符串 action type，web 和 mobile 端直接 import。新 feature 模块自身**不**引入任何 `react-native` 或 `react-dom` 的 import，保持与平台无关——这样同一份代码在 web 和 RN 上完全一致。

## 阶段

### Phase 0 — Research

`research.md` 与本 plan 同步生成，文档化：
- XMPP 传输选型（MUC 私聊消息）以及为何拒绝 IQ 形态的自定义命令；
- 本次会用到的 `JitsiConference` 与 `JitsiConferenceEvents` 公开 API；
- `JitsiMeetExternalAPI` 的注册模式（`modules/API/external/external_api.js`）；
- React Native bridge 约定（`react/features/mobile/external-api/middleware.ts` + iOS / Android native 模块）；
- 选型约束（留在 jitsi-meet 内、不动 lib-jitsi-meet）以及由此带来的 trade-off（只能走 MUC 私聊消息传输，而不是真正的自定义 IQ 命令）。

### Phase 1 — Design & Contracts

- `data-model.md` —— 描述 `CustomXmppCommandPayload` 类型（开放的 `Record<string, unknown>`）和一条自定义 XMPP 消息的生命周期（created → sent → in-flight → received → dispatched）。
- `contracts/custom-xmpp.md` —— 锁定 wire 层命令名（`send-custom-xmpp-command`）、事件名（`custom-xmpp-event`）、参数形态、payload 大小上限、以及宿主页面 ↔ jitsi-meet 的交互契约。
- `quickstart.md` —— 两标签页手测 recipe，覆盖 `spec.md` 中的全部 6 个场景，外加对现有 `doc/examples/api.html` 的回归手测。

## 停止点

按 `/spec-kitty.plan` 工作流约定，本命令在此结束。下一步是 `/spec-kitty.tasks`，它会把上述 5 个 IC 拆成可执行的 work package。在用户主动要求之前不要执行 `tasks`。
