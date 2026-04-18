# Implementation Plan: SharedVideo 马赛克遮罩浮层
*Path: kitty-specs/001-sharedvideo-mosaic-overlay/plan.md*

**Branch**: `meeting/develop` | **Date**: 2026-04-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/kitty-specs/001-sharedvideo-mosaic-overlay/spec.md`

## Summary

在 SharedVideo 功能上实现马赛克遮罩浮层能力。管理员可为每个视频添加棋盘格遮罩，支持拖动定位和调整大小（50x50px ~ 视频尺寸），通过 XMPP 命令实时同步给所有参与者。

## Technical Context

**Language/Version**: TypeScript/JavaScript (React 18, Redux)  
**Primary Dependencies**: React, Redux, Jitsi Meet 内部模块  
**Storage**: Redux 状态管理，XMPP 消息同步  
**Testing**: 手动测试为主  
**Target Platform**: Web (Jitsi Meet)
**Project Type**: 现有项目的功能扩展  
**Performance Goals**: 同步延迟 < 200ms，遮罩渲染不影响视频播放帧率（下降 < 5%）  
**Constraints**: 仅管理员可操作遮罩，XMPP 消息体 < 1KB  
**Scale/Scope**: 单个会议室，最多 4 个视频标签

## Project Structure

### Source Code (jitsi-meet 仓库)

```
react/features/shared-video/
├── actionTypes.ts              # [MODIFY] 新增 overlay action types
├── actions.any.ts              # [MODIFY] 新增 setMosaicOverlay/removeMosaicOverlay
├── constants.ts                # [MODIFY] 新增 MOSAIC_OVERLAY 命令常量
├── functions.ts                # [MODIFY] 新增 sendMosaicOverlayCommand
├── hooks.ts                    # [MODIFY] 新增 useMosaicOverlayButton
├── middleware.web.ts           # [MODIFY] 新增 XMPP 命令监听
├── reducer.ts                  # [MODIFY] 新增 mosaicOverlays 状态
├── components/
│   └── web/
│       ├── ExtendedVideoManager.tsx  # [MODIFY] 集成 MosaicOverlay 组件
│       └── MosaicOverlay.tsx         # [NEW] 遮罩组件
└── hooks.ts                    # [MODIFY] useMosaicOverlayButton 注册

react/features/toolbox/
├── hooks.web.ts                # [MODIFY] 注册 mosaicoverlay 按钮
└── components/web/
    └── MosaicOverlayButton.tsx # [NEW] 工具栏按钮

css/
└── _shared-video.scss          # [MODIFY] 新增遮罩样式
```

## Implementation Phases

### Phase 1: Redux 状态管理

**文件**: `actionTypes.ts`
```typescript
SET_MOSAIC_OVERLAY = 'SET_MOSAIC_OVERLAY'
REMOVE_MOSAIC_OVERLAY = 'REMOVE_MOSAIC_OVERLAY'
```

**文件**: `reducer.ts`
- 新增 `mosaicOverlays: Record<number, IMosaicOverlay>` 状态
- IMosaicOverlay 接口: `{ videoIdx, x, y, width, height, visible }`

**文件**: `actions.any.ts`
- `setMosaicOverlay(videoIdx, overlay)`
- `removeMosaicOverlay(videoIdx)`

### Phase 2: 同步机制

**文件**: `constants.ts`
```typescript
export const MOSAIC_OVERLAY = 'mosaic-overlay';
```

**文件**: `functions.ts`
- 参考 `sendShareVideoCommand` 实现模式
- `sendMosaicOverlayCommand({ conference, videoIdx, action, overlay })`
- 使用 `conference.sendCommandOnce(MOSAIC_OVERLAY, { attributes: {...} })`

**文件**: `middleware.web.ts`
- 添加 `conference.addCommandListener(MOSAIC_OVERLAY, ...)` 监听
- 解析属性并 dispatch 对应 action

### Phase 3: 遮罩组件

**新建**: `components/web/MosaicOverlay.tsx`
- CSS 棋盘格图案: `background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)`
- 拖动定位: onMouseDown/onMouseMove/onMouseUp
- 8 向调整大小: 四角 + 四边中点
- 尺寸约束: min 50x50px, max = 容器尺寸
- 点击显示移除按钮

**修改**: `ExtendedVideoManager.tsx`
- 在每个 `react-player-box` 内渲染 MosaicOverlay
- 从 Redux 获取 `isModerator` 和 `editMode`
- 管理员点击视频时添加遮罩（或切换编辑模式）

### Phase 4: 工具栏按钮

**新建**: `components/web/MosaicOverlayButton.tsx`
- 使用 `useSelector(isLocalParticipantModerator)` 检查权限
- 切换 `editMode` 状态

**修改**: `hooks.ts`
- 新增 `useMosaicOverlayButton()` hook
- 仅当 `isModerator && hasSharedVideo` 时返回按钮配置

**修改**: `hooks.web.ts`
- 调用 `useMosaicOverlayButton()` 并注册到 buttons 对象

### Phase 5: 样式

**修改**: `css/_shared-video.scss`
```scss
.mosaic-overlay { position: absolute; cursor: move; }
.mosaic-overlay__checkerboard { /* 棋盘格图案 */ }
.mosaic-overlay__handle { /* 8 向调整手柄 */ }
.mosaic-overlay--editing { /* 编辑模式样式 */ }
```

## Data Model

```typescript
interface IMosaicOverlay {
    videoIdx: number;      // 视频索引 (0-3)
    x: number;             // 相对位置 X
    y: number;             // 相对位置 Y
    width: number;         // 宽度 px
    height: number;        // 高度 px
    visible: boolean;       // 是否显示
}

interface MosaicOverlayMessage {
    videoIdx: number;
    action: 'add' | 'update' | 'remove';
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}
```

## Verification

1. 启动 `npm start` 开发服务器
2. 加入有 sharedvideo 的会议室
3. 以管理员身份点击工具栏马赛克按钮
4. 点击任意视频 → 确认遮罩出现在中心
5. 拖动遮罩 → 确认位置同步到其他参与者
6. 调整大小 → 确认同步
7. 点击移除 → 确认同步
8. 以非管理员身份确认无法操作

## Reference Patterns

| 模式 | 文件 | 行号 |
|-----|------|-----|
| XMPP 命令发送 | `functions.ts` | 162-176 |
| XMPP 命令监听 | `middleware.web.ts` | 23-37 |
| 权限检查 | `EndConferenceButton.tsx` | 39 |
| 拖拽实现 | `ExtendedVideoManager.tsx` | 362-441 |
| 按钮 Hook | `hooks.ts` | 17-23 |
