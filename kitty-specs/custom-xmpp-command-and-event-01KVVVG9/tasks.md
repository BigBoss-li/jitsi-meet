# Tasks: 自定义 XMPP 命令与事件监听

**阶段**：2 — Tasks
**Mission**：`custom-xmpp-command-and-event-01KVVVG9`
**日期**：2026-06-24

## 总览

将 [`plan.md`](./plan.md) 中 5 个 Implementation Concerns 拆分为 7 个 work packages（WP01–WP07）。每个 WP 对应一个**可独立交付**的子任务集，最终合并到 `meeting/develop` 分支。

| 维度 | 数值 |
|------|------|
| Work packages | 7 |
| Subtasks 总数 | 28 |
| 串行链路 | WP01/WP02 → WP03/WP04/WP05 → WP06 → WP07 |
| 平均 prompt 大小 | ~360 行 |
| 最大 prompt | ~500 行（WP02） |

## Subtask Index

| ID | 描述 | WP | Parallel |
|----|------|----|----------|
| T001 | 在 `external_api.js` commands map 注册 `sendCustomXmppCommand` | WP01 | [P] |
| T002 | 在 `external_api.js` events map 注册 `customXmppEvent` | WP01 | [P] |
| T003 | 在浏览器 DevTools 手动验证 `executeCommand('sendCustomXmppCommand', …)` 能被现有派发链路接收 | WP01 |  |
| T004 | 在 `external_api.js` host-side 消息 switch 添加 `'custom-xmpp-event'` case | WP01 | [P] |
| T005 | 新建 `react/features/custom-xmpp/actionTypes.ts` | WP02 | [P] |
| T006 | 新建 `react/features/custom-xmpp/logger.ts`（按 feature 命名空间） | WP02 | [P] |
| T007 | 新建 `react/features/custom-xmpp/functions.ts` 实现 `validatePayload` / `encodePayload` / `tryDecodePayload` | WP02 |  |
| T008 | 新建 `react/features/custom-xmpp/actions.ts` 提供 `sendCustomXmppCommand` 和 `customXmppEventReceived` action creator | WP02 |  |
| T009 | 新建 `react/features/custom-xmpp/middleware.ts`：处理 SEND_CUSTOM_XMPP_COMMAND（发送侧）和注册 PRIVATE_MESSAGE_RECEIVED（接收侧） | WP02 |  |
| T010 | 新建 `react/features/custom-xmpp/index.ts` barrel export | WP02 |  |
| T011 | 在 `modules/API/API.js` 扩展 `APP.API.notifyCustomXmppEvent(payload)`（iframe postMessage 通道） | WP03 | [P] |
| T012 | 在 `react/features/external-api/middleware.ts` post-next switch 中添加 `case CUSTOM_XMPP_EVENT_RECEIVED` | WP03 |  |
| T013 | 在 `ios/sdk/src/ExternalAPI.h` 添加 `SEND_CUSTOM_XMPP_COMMAND` 和 `CUSTOM_XMPP_EVENT` 字符串常量 | WP04 | [P] |
| T014 | 在 `ios/sdk/src/ExternalAPI.m` 注册 action handler（调用 `JitsiMeetView.sendCustomXmppCommand`） | WP04 |  |
| T015 | 在 `ios/sdk/src/JitsiMeetView.{h,m}` 添加 `sendCustomXmppCommand:target:payload:` 和 `onCustomXmppEvent:` listener API | WP04 |  |
| T016 | 在 `android/sdk/src/main/java/.../ExternalAPIModule.java` 添加对应常量 | WP05 | [P] |
| T017 | 在 `android/sdk/src/main/java/.../JitsiMeetView.java` 添加 send 方法 + listener 回调 | WP05 |  |
| T018 | 在 `android/app/src/main/java/.../ReactInstanceManagerHolder.*` 或类似文件（如有）补齐 native bridge 注册 | WP05 |  |
| T019 | 在 `react/features/mobile/external-api/middleware.ts` 添加 `eventEmitter.addListener(ExternalAPI.SEND_CUSTOM_XMPP_COMMAND, …)` | WP06 | [P] |
| T020 | 在 `react/features/mobile/external-api/middleware.ts` 添加 `eventEmitter.emit(ExternalAPI.CUSTOM_XMPP_EVENT, payload)` | WP06 |  |
| T021 | 跨平台常量核对：iOS / Android / JS 三端的字符串完全一致 | WP06 |  |
| T022 | 新建 `doc/examples/custom-xmpp-example.html`：两标签页 + 重复用户检测 happy path | WP07 | [P] |
| T023 | 在 `doc/api.md` 中记录新命令和新事件（含 web + RN 两种调用形态） | WP07 | [P] |
| T024 | 跑通 `npm run lint` / `npm run tsc:web` / `npm run tsc:native`，确认**无**新增告警 | WP07 |  |

## 依赖与并行关系

```
WP01 ─┐
      ├─→ WP03 ─┐
WP02 ─┘         │
                ├─→ WP06 ─┐
WP02 ─→ WP04 ──┤          │
WP02 ─→ WP05 ──┤          ├─→ WP07
                └──────────┘
```

- **WP01 与 WP02** 完全独立，可并行。
- **WP03** 在 WP01 + WP02 完成后才能开始（依赖 iframe transport 派发路径 + action type 定义）。
- **WP04 与 WP05** 在 WP02 完成后即可并行。
- **WP06** 在 WP02 + WP04 + WP05 完成后开始（需要确认三端常量对齐）。
- **WP07** 是收尾的验证 + 文档：在 WP01/02/03/06 完成后开始（web 路径必须可用；iOS/Android 通过跨平台手测可后置）。

## WP01 — Web external API 注册（IC-01）

- **目标**：让 `JitsiMeetExternalAPI` 识别新命令和事件。
- **优先级**：P0（阻塞后续所有派发路径）。
- **可独立测试**：在浏览器 DevTools 中调用 `api.executeCommand('sendCustomXmppCommand', {…})`，确认能进入派发链路（即使中间层尚未处理，也应当**不**抛错）。

### Subtasks

- [x] T001 在 `modules/API/external/external_api.js` `commands` map（约 line 29）新增 `'sendCustomXmppCommand': 'send-custom-xmpp-command'`
- [x] T002 在 `modules/API/external/external_api.js` `events` map（约 line 107）新增 `'custom-xmpp-event': 'customXmppEvent'`
- [x] T003 启动 dev server，在两个浏览器标签页打开 `doc/examples/api.html`，在 console 中调用 `api.executeCommand('sendCustomXmppCommand', { target: 'fake', payload: {action:'noop'} })`，确认无 `Cannot find command` 类错误，仅在自定义层看到 `console.error`
- [x] T004 在 `external_api.js` host-side 消息 switch（处理 iframe postMessage 的函数）中添加 `'custom-xmpp-event'` case，转发到 `API.notifyCustomXmppEvent`

### 实现草图

1. 打开 `external_api.js`，定位 `commands` 常量对象与 `events` 常量对象。
2. 仿照 `sendChatMessage: 'send-chat-message'` 和 `chatUpdated: 'chatUpdated'` 的现有形态插入新条目。
3. `executeCommand` 在 line 913 附近的 dispatch 已经基于 `commands` map 的 value（kebab-case wire name）查找，无需修改。

### 风险

- 拼写错误（kebab-case 与 camelCase 互换）会让宿主页面调用后看不到响应。**必须在两边 map 各加一处**，且字符串必须与 `contracts/custom-xmpp.md` 完全一致。
- `executeCommand` 内部对未知命令的 fallback 行为是抛错（参考现有 `sendChatMessage` 路径），需要保证两个 map 都已注入。

---

## WP02 — `react/features/custom-xmpp/` 特性模块（IC-02）

- **目标**：实现 payload 校验、JSON 编码、发送 dispatch 和接收解析。
- **优先级**：P0（核心逻辑）。
- **可独立测试**：运行 `npm run tsc:web` 与 `npm run tsc:native`，类型应当全过；在 reducer / 中间件测试中能调用 `validatePayload` 验证边界条件。

### Subtasks

- [x] T005 新建 `react/features/custom-xmpp/actionTypes.ts`，定义 `SEND_CUSTOM_XMPP_COMMAND` 和 `CUSTOM_XMPP_EVENT_RECEIVED`
- [x] T006 新建 `react/features/custom-xmpp/logger.ts`，按 feature 命名空间（如 `'jitsi-meet/custom-xmpp'`）
- [x] T007 新建 `react/features/custom-xmpp/functions.ts`，导出 `validatePayload`（返回 `{ ok: true } | { ok: false, reason }`）、`encodePayload`、`tryDecodePayload`（返回 `unknown | undefined`）
- [x] T008 新建 `react/features/custom-xmpp/actions.ts`，导出 `sendCustomXmppCommand(target, payload)` 和 `customXmppEventReceived(payload)` 两个 action creator
- [x] T009 新建 `react/features/custom-xmpp/middleware.ts`：注册 `CONFERENCE_JOINED` 钩子挂载 `PRIVATE_MESSAGE_RECEIVED` 监听器；处理 `SEND_CUSTOM_XMPP_COMMAND` 时调用 `conference.sendPrivateTextMessage(target, JSON.stringify(payload))`
- [x] T010 新建 `react/features/custom-xmpp/index.ts` barrel export

### 实现草图

1. **actionTypes.ts**：参考 `react/features/chat/actionTypes.ts` 的命名风格（`SEND_*` / `_*_RECEIVED`）。
2. **functions.ts**：把 [`data-model.md`](./data-model.md) 末尾给出的两个函数（`validateCustomXmppPayload` 和 `tryDecodeCustomXmppMessage`）原样落地，**并**额外补一个 `encodePayload`，把 `JSON.stringify` 包在 try/catch 里。
3. **middleware.ts**：
   - 模仿 `react/features/chat/middleware.ts:174` 的 `case SEND_MESSAGE` 与 `:208` 的 `sendPrivateTextMessage`。
   - 模仿 `:322` 的 `case PRIVATE_MESSAGE_RECEIVED` 监听器注册模式。
   - 在 `CONFERENCE_JOINED` 内挂监听器，**不在** `register` 顶层挂（避免重入时重复注册）。
4. **index.ts**：聚合 re-export。

### 风险

- `PRIVATE_MESSAGE_RECEIVED` 必须在 `CONFERENCE_JOINED` 中挂载且**只在挂一次**（监听器自身去重 `eventEmitter.off`，参考 chat feature 写法）。
- `JSON.stringify` 必须包在 try/catch（BigInt、循环引用）。
- 必须**永远不**让中间件抛错到 conference 事件循环；解析失败一律静默 + `console.error`。

---

## WP03 — Web 桥接到 `APP.API`（IC-03）

- **目标**：当 `CUSTOM_XMPP_EVENT_RECEIVED` action 触发时，把 payload 推给 iframe 外面的宿主页面。
- **优先级**：P0（web 端必须的派发链）。
- **可独立测试**：在浏览器 DevTools 监听 `message` 事件，调用 `api.executeCommand('sendCustomXmppCommand', …)` 给另一个标签页，第二个标签页的宿主页面上能收到 `customXmppEvent`。

### Subtasks

- [x] T011 在 `modules/API/API.js`（找到现有 `APP.API.notifyChatUpdated` 的位置）扩展 `notifyCustomXmppEvent(payload)`，模仿 `notifyChatUpdated` 的形态
- [x] T012 在 `react/features/external-api/middleware.ts` 的 post-next switch（约 line 94 起）新增 `case CUSTOM_XMPP_EVENT_RECEIVED`，调用 `APP.API.notifyCustomXmppEvent(action.payload)`

### 实现草图

1. **T011**：先 grep `modules/API/API.js` 找到 `notifyChatUpdated`（约 line 1225），模仿其形态新增 `notifyCustomXmppEvent`。
2. **T012**：在 `external-api/middleware.ts` 的 `for` 循环 switch 中新增 case，注意 `case` 顺序无所谓，但**不能**漏掉 `break`。

### 风险

- `APP.API` 的命名空间通常是 `APP.API.*`（点调用）。写错成 `API.notify…` 不会生效。
- iframe 与 host 的消息通道**必须**用同一字符串常量；host 端的字符串在 `api.addEventListener` 时用 `customXmppEvent`（camelCase），iframe 端发送时用 kebab-case `custom-xmpp-event`，由外部 map 翻译。

---

## WP04 — iOS 原生桥（IC-04 的 iOS 部分）

- **目标**：让 iOS native SDK 把 `sendCustomXmppCommand` 从宿主应用传到 JS，并把 `customXmppEvent` 从 JS 推回宿主。
- **优先级**：P1（移动端之一）。
- **可独立测试**：在 iOS 示例工程中调用 `JitsiMeetView.sendCustomXmppCommand(...)`，JS 端 redux 中能看到对应的 action 被 dispatch。

### Subtasks

- [x] T013 在 `ios/sdk/src/ExternalAPI.h` 添加 `extern NSString * const SEND_CUSTOM_XMPP_COMMAND;` 和 `extern NSString * const CUSTOM_XMPP_EVENT;`（与 `SEND_CHAT_MESSAGE` 同形态）
- [x] T014 在 `ios/sdk/src/ExternalAPI.m` 给两个常量赋值，并注册 action handler（仿照 `sendChatMessageAction` 的注册）
- [x] T015 在 `ios/sdk/src/JitsiMeetView.h` 添加 `- (void)sendCustomXmppCommand:(NSString *)action target:(NSString *)targetId payload:(NSDictionary *)payload;` 和 `onCustomXmppEvent:` 风格的 listener；在 `.m` 中实现（delegate 转发 + post 给 JS 引擎）

### 实现草图

1. **T013**：常量声明放在 `ExternalAPI.h` 顶部，**字符串值**与 `react/features/custom-xmpp/actionTypes.ts` 中等价常量完全一致（注意 kebab vs camel：native 端通常沿用 camel）。
2. **T014**：在 `.m` 文件中赋值，并在 action 注册处补一行 `externalAPIDelegate:` 风格的回调，与 `sendChatMessageAction` 对称。
3. **T015**：`sendCustomXmppCommand` 内部走 `ExternalAPI sendEvent:action:` 通道；`onCustomXmppEvent:` 通过 `JitsiMeetViewListener` 协议补一个 optional 方法。

### 风险

- iOS 端常量大写、带下划线；JS 端小写、带连字符。**两端字符串必须完全等价**（不管大小写格式，wire 名 `SEND_CUSTOM_XMPP_COMMAND` 与 `SEND_CUSTOM_XMPP_COMMAND` 应当字符完全相同）。
- `JitsiMeetViewListener` 是 optional 方法协议，添加新方法**不能**破坏现有实现方。

---

## WP05 — Android 原生桥（IC-04 的 Android 部分）

- **目标**：Android 端与 iOS 端等价。
- **优先级**：P1（移动端之二，与 WP04 并行）。
- **可独立测试**：在 Android 示例工程中调用 `JitsiMeetView.sendCustomXmppCommand(...)`，JS 端 redux 中能看到 action dispatch。

### Subtasks

- [x] T016 在 `android/sdk/src/main/java/org/jitsi/meet/sdk/ExternalAPIModule.java` 添加 `SEND_CUSTOM_XMPP_COMMAND` 和 `CUSTOM_XMPP_EVENT` 常量（与 iOS 字符串一致）
- [x] T017 在 `android/sdk/src/main/java/org/jitsi/meet/sdk/JitsiMeetView.java` 添加 `sendCustomXmppCommand(...)` 方法和 `onCustomXmppEvent` listener
- [x] T018 如有 native bridge 注册表（如 `ReactPackage` 实现），补齐新方法

### 实现草图

1. 定位现有 `sendChatMessage` / `onChatUpdated` 的实现，照葫芦画瓢。
2. Android 端的常量字符串定义位置常在 `ExternalAPIModule.java` 的 `static final String` 块。
3. 注意 Android 端方法命名遵循 Java 约定（camelCase，无下划线）。

### 风险

- 字符串常量两端必须一致；建议实现完成后立即跑跨平台字符串比对（可写一个简单脚本或在 WP06 一起做）。
- 如果项目中 Java/Kotlin 文件并存，按各自项目风格继续（不要混）。

---

## WP06 — React Native 端 `mobile/external-api/middleware.ts`（IC-04 的 JS 部分）

- **目标**：把原生 ↔ JS 的 `sendCustomXmppCommand` / `customXmppEvent` 通过 `NativeEventEmitter` 接到 redux。
- **优先级**：P0（RN 端必须的派发链）。
- **可独立测试**：在 RN app 中调用原生 API 后，redux 中能看到 `SEND_CUSTOM_XMPP_COMMAND`；JS 端 dispatch 一个 mock `CUSTOM_XMPP_EVENT_RECEIVED`，native 监听器应被触发。

### Subtasks

- [x] T019 在 `react/features/mobile/external-api/middleware.ts` 添加 `eventEmitter.addListener(ExternalAPI.SEND_CUSTOM_XMPP_COMMAND, …)`（参考 line 452 附近的 SEND_CHAT_MESSAGE 处理）
- [x] T020 在同一个文件中添加 `eventEmitter.emit(ExternalAPI.CUSTOM_XMPP_EVENT, payload)` 派发（参考现有 `CHAT_UPDATED` 或类似 event emit 位置）
- [x] T021 三端字符串核对：iOS / Android / JS 三处常量完全一致；运行简单的 grep 自检

### 实现草图

1. 定位 `external-api/middleware.ts:452` 附近的 `addListener(SEND_CHAT_MESSAGE, …)` 模式，复制后替换常量和 action type。
2. emit 路径通常在该文件后段的 listener 注册块中。
3. T021 在 commit 前用 `grep -r "SEND_CUSTOM_XMPP_COMMAND"` 全仓库验证三处出现且一致。

### 风险

- `NativeEventEmitter.emit` 是同步的，**不要**在 emit 前 await。
- native 端字符串常量如果改了，JS 端 `ExternalAPI.SEND_CUSTOM_XMPP_COMMAND` 必须同步更新；强烈建议把字符串定义抽到一处常量文件（但**不**为这点小事做重构，WP06 内对齐即可）。

---

## WP07 — 手工测试样例 + 文档

- **目标**：提供可双标签页手测的示例页，并在 `doc/api.md` 公开记录新命令 / 新事件。
- **优先级**：P0（验收必须的入口）。
- **可独立测试**：浏览器打开 `doc/examples/custom-xmpp-example.html`，两个标签页入会一房间，按 quickstart 场景跑通。

### Subtasks

- [x] T022 新建 `doc/examples/custom-xmpp-example.html`，基于 `doc/examples/api.html` 克隆；增加 "Send custom XMPP command" 按钮 + `customXmppEvent` 监听器
- [x] T023 编辑 `doc/api.md`，在合适小节记录新命令（参数、返回 void、错误行为）和新事件（参数、触发条件、不触发条件）
- [x] T024 跑 `npm run lint`、`npm run tsc:web`、`npm run tsc:native`，确认**无**新增告警；如有告警需在本 WP 内修复

### 实现草图

1. **T022**：从 `api.html` 复制，保留原样所有按钮；在底部新增"Custom XMPP"小节：发送按钮（取自 `participantId`，payload 内包含 `action` 和 `requestId`）+ 事件日志 DOM 节点 + `api.addEventListener('customXmppEvent', …)`。
2. **T023**：定位 `doc/api.md` 中 `sendChatMessage` / `chatUpdated` 一节，在其后插入平行小节。host 端示例和 RN 端示例各给一段（参考 `contracts/custom-xmpp.md`）。
3. **T024**：跑命令，如有新增告警就修；不允许把现有 warning 视而不见。

### 风险

- 示例页是 iframe 形态，**不要**用 SDK 形态（否则与浏览器开盒即用不兼容）。
- `doc/api.md` 是公开文档，**不允许**用 lorem ipsum 之类的占位文本；写完后人工通读一遍。

---

## 验收总览

- 完成 WP01–WP06 后，web 端与 RN 端应都能完整调用 `sendCustomXmppCommand` 与监听 `customXmppEvent`。
- 完成 WP07 后，**全部**用户场景（spec 中的场景 1–6）都应可通过 quickstart 中的步骤复现。
- 所有 WP 完成且 lint/tsc 通过后，告知需求方进行人工验收。