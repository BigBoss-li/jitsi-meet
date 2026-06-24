# 数据模型：自定义 XMPP 命令与事件监听

**阶段**：1 — Design
**Mission**：`custom-xmpp-command-and-event-01KVVVG9`
**日期**：2026-06-24

## 实体

### `CustomXmppCommand`（宿主页面 → jitsi-meet）

由宿主页面发出的命令。来源是 `JitsiMeetExternalAPI.executeCommand`。

```ts
type CustomXmppCommand = {
    target: string;            // MUC participant id（即会议中 participant.id 的值）
    payload: CustomXmppPayload; // 见下文
};
```

- `target`：必填。一个非空字符串，必须与会议中某个当前参与者的 `id` 一致。会议是 occupant JID 的事实来源；宿主页面永远看不到 JID。
- `payload`：必填。参见 `CustomXmppPayload`。

### `CustomXmppPayload`（wire body）

随 MUC 私聊消息体一同传输的、由宿主页面自有的 JSON 对象。

```ts
type CustomXmppPayload = {
    action: string;            // 例如 "duplicateDetected"
    [key: string]: unknown;    // 宿主页面自定义的扩展字段，例如 requestId、role 等
};
```

- **校验规则**（FR-005）：
  - `payload` **必须**是非 null、非数组的纯对象。
  - `payload.action` **必须**是非空字符串（仅是约定，jitsi-meet 不会强制，但"重复用户退出"用例依赖它）。
  - 序列化结果 `JSON.stringify(payload)` **必须**不超过 16 384 字节。
  - `JSON.stringify` **不得**抛出异常（不能有循环引用、不能有 `BigInt`、不能有函数）。用 `try/catch` 配合长度检查来兜底。
- **开放形态**：允许任何其他 key，原样转发。契约由宿主页面负责。

### `CustomXmppCommandMessage`（jitsi-meet 内部 — wire body）

MUC 私聊消息体。始终是 `CustomXmppPayload` 的 JSON 字符串编码形式。传输层不再做包装；body 就是一段 JSON 文本。

```
<message type="chat" to="room@conf.example/occupant-id">
  <body>{"action":"duplicateDetected","requestId":"…"}</body>
</message>
```

- `body` 是 `CustomXmppPayload` 的 JSON 序列化结果。
- 接收方用 `JSON.parse` 解析 `body`，并用 `try/catch` 包住。失败时静默丢弃（FR-006）。
- 接收方**不**解释 `action`，只是把解析结果原样作为 `customXmppEvent` 派发。

### `CustomXmppEvent`（jitsi-meet → 宿主页面）

```ts
type CustomXmppEvent = CustomXmppPayload;
```

- 事件参数**就是**原始的 `payload`（FR-003）。往返等价：忽略 key 顺序，`JSON.parse(JSON.stringify(payload))` 与 `payload` 等价；如果宿主页面只用 `payload.action` 和 `payload.requestId` 做判断，key 顺序不会影响 `===`。

## 生命周期

```
[host page A]
    │
    │  api.executeCommand('sendCustomXmppCommand', { target, payload })
    ▼
[iframe / RN app — jitsi-meet]
    │
    │  SEND_CUSTOM_XMPP_COMMAND action
    ▼
[react/features/custom-xmpp/middleware.ts]
    │
    │  1. validate payload
    │  2. JSON.stringify payload
    │  3. conference.sendPrivateTextMessage(target, jsonString)
    ▼
[XMPP MUC transport — lib-jitsi-meet]
    │
    │  <message> over MUC to target's occupant JID
    ▼
[接收端 XMPP MUC transport]
    │
    │  fires JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED
    ▼
[react/features/custom-xmpp/middleware.ts — 接收侧]
    │
    │  1. JSON.parse(message) inside try/catch
    │  2. dispatch CUSTOM_XMPP_EVENT_RECEIVED with parsed payload
    ▼
[react/features/external-api/middleware.ts]
    │
    │  APP.API.notifyCustomXmppEvent(payload)
    ▼
[iframe transport / RN bridge]
    │
    │  emits 'custom-xmpp-event' to host page B
    ▼
[host page B]
    api.addEventListener('customXmppEvent', (payload) => { ... })
```

in-flight 状态有且只有一种：消息正在 XMPP 层传输。jitsi-meet 自身不维护任何跟踪状态。

## 不变量

- **INV-1**：一次成功的 `sendCustomXmppCommand` 在接收方**必须**产生零次或一次 `customXmppEvent`。零次的情况：接收方没有监听器，或 body 解析失败。
- **INV-2**：`customXmppEvent` 的 payload 忽略 key 顺序后**等于**原始 `payload`；接收方**不得**依赖 key 顺序。
- **INV-3**：`sendCustomXmppCommand` 是尽力而为的。MUC 传输层在负载较高或接收方短暂断连时可能丢消息。调用方**必须**容忍丢失。
- **INV-4**：两个宿主页面分别向同一目标发送相同的 payload，接收方会收到**两次** `customXmppEvent`。jitsi-meet 不会去重（依 spec）。

## 校验函数（参考实现）

```ts
// react/features/custom-xmpp/functions.ts
const MAX_PAYLOAD_BYTES = 16 * 1024;

export function validateCustomXmppPayload(payload: unknown): { ok: true } | { ok: false, reason: string } {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        return { ok: false, reason: 'invalidPayload' };
    }
    if (typeof (payload as { action?: unknown }).action !== 'string'
        || (payload as { action: string }).action.length === 0) {
        return { ok: false, reason: 'invalidPayload' };
    }
    let serialised: string;
    try {
        serialised = JSON.stringify(payload);
    } catch {
        return { ok: false, reason: 'invalidPayload' };
    }
    if (serialised.length > MAX_PAYLOAD_BYTES) {
        return { ok: false, reason: 'invalidPayload' };
    }
    return { ok: true };
}

export function tryDecodeCustomXmppMessage(body: string): unknown | undefined {
    try {
        const parsed = JSON.parse(body);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return undefined;
        }
        return parsed;
    } catch {
        return undefined;
    }
}
```
