/* eslint-disable no-invalid-this */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import { getCurrentConference } from '../../../base/conference/functions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { sendMosaicOverlayCommand } from '../../functions';
import { IMosaicOverlay, removeMosaicOverlay, setMosaicOverlay } from '../../actions.any';

interface IProps {
    videoIdx: number;
    containerRef: React.RefObject<HTMLDivElement>;
    isModerator: boolean;
    editMode: boolean;
    overlay: IMosaicOverlay;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;

/**
 * MosaicOverlay component for displaying and manipulating a mosaic overlay on video.
 *
 * @param {IProps} props - Component props.
 * @returns {ReactElement}
 */
const MosaicOverlay: React.FC<IProps> = ({
    videoIdx,
    containerRef,
    isModerator,
    editMode,
    overlay
}) => {
    const dispatch = useDispatch();
    const conference = useSelector(getCurrentConference);
    const overlayRef = useRef<HTMLDivElement>(null);

    const [ isDragging, setIsDragging ] = useState(false);
    const [ isResizing, setIsResizing ] = useState(false);
    const [ resizeHandle, setResizeHandle ] = useState<ResizeHandle>(null);
    const [ showRemoveButton, setShowRemoveButton ] = useState(false);
    const [ position, setPosition ] = useState({ x: overlay.x, y: overlay.y });
    const [ size, setSize ] = useState({ width: overlay.width, height: overlay.height });

    const dragStartPos = useRef({ x: 0, y: 0 });
    const resizeStartSize = useRef({ width: 0, height: 0 });
    const resizeStartPos = useRef({ x: 0, y: 0 });

    // Inject styles on mount
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .mosaic-overlay {
                position: absolute;
                cursor: move;
                background: repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 20px 20px;
                border: 2px solid rgba(0, 0, 0, 0.3);
                box-sizing: border-box;
                z-index: 100;
                user-select: none;
            }
            .mosaic-overlay--editing {
                border-color: rgba(33, 150, 243, 0.6);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            .mosaic-overlay__handle {
                position: absolute;
                width: 12px;
                height: 12px;
                background: white;
                border: 1px solid #333;
                border-radius: 2px;
                z-index: 10;
            }
            .mosaic-overlay__handle--nw { top: -6px; left: -6px; cursor: nw-resize; }
            .mosaic-overlay__handle--n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
            .mosaic-overlay__handle--ne { top: -6px; right: -6px; cursor: ne-resize; }
            .mosaic-overlay__handle--e { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
            .mosaic-overlay__handle--se { bottom: -6px; right: -6px; cursor: se-resize; }
            .mosaic-overlay__handle--s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
            .mosaic-overlay__handle--sw { bottom: -6px; left: -6px; cursor: sw-resize; }
            .mosaic-overlay__handle--w { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
            .mosaic-overlay__remove {
                position: absolute;
                top: -32px;
                right: 0;
                padding: 4px 10px;
                background: #d32f2f;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
            }
            .mosaic-overlay__remove:hover {
                background: #b71c1c;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Sync position and size with overlay prop changes
    useEffect(() => {
        setPosition({ x: overlay.x, y: overlay.y });
        setSize({ width: overlay.width, height: overlay.height });
    }, [ overlay ]);

    const getContainerBounds = useCallback(() => {
        if (containerRef.current) {
            return containerRef.current.getBoundingClientRect();
        }
        return null;
    }, [ containerRef ]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!editMode || !isModerator) {
            return;
        }
        e.stopPropagation();
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }, [ editMode, isModerator, position ]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
        if (!editMode || !isModerator) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setResizeHandle(handle);
        resizeStartSize.current = { width: size.width, height: size.height };
        resizeStartPos.current = { x: e.clientX, y: e.clientY };
    }, [ editMode, isModerator, size ]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            const bounds = getContainerBounds();
            if (!bounds) {
                return;
            }
            const newX = Math.max(0, Math.min(e.clientX - dragStartPos.current.x, bounds.width - size.width));
            const newY = Math.max(0, Math.min(e.clientY - dragStartPos.current.y, bounds.height - size.height));
            setPosition({ x: newX, y: newY });
        } else if (isResizing && resizeHandle) {
            const bounds = getContainerBounds();
            if (!bounds) {
                return;
            }
            const deltaX = e.clientX - resizeStartPos.current.x;
            const deltaY = e.clientY - resizeStartPos.current.y;
            let newWidth = resizeStartSize.current.width;
            let newHeight = resizeStartSize.current.height;
            let newX = position.x;
            let newY = position.y;

            if (resizeHandle.includes('e')) {
                newWidth = Math.max(50, resizeStartSize.current.width + deltaX);
            }
            if (resizeHandle.includes('w')) {
                newWidth = Math.max(50, resizeStartSize.current.width - deltaX);
                newX = position.x + (resizeStartSize.current.width - newWidth);
            }
            if (resizeHandle.includes('s')) {
                newHeight = Math.max(50, resizeStartSize.current.height + deltaY);
            }
            if (resizeHandle.includes('n')) {
                newHeight = Math.max(50, resizeStartSize.current.height - deltaY);
                newY = position.y + (resizeStartSize.current.height - newHeight);
            }

            // Ensure doesn't exceed container bounds
            newWidth = Math.min(newWidth, bounds.width - newX);
            newHeight = Math.min(newHeight, bounds.height - newY);

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });
        }
    }, [ isDragging, isResizing, resizeHandle, size, position, getContainerBounds ]);

    const handleMouseUp = useCallback(() => {
        if (isDragging || isResizing) {
            // Send XMPP command to sync
            sendMosaicOverlayCommand({
                conference,
                videoIdx,
                action: 'update',
                overlay: {
                    x: position.x,
                    y: position.y,
                    width: size.width,
                    height: size.height,
                    visible: overlay.visible
                }
            });

            // Dispatch Redux action
            dispatch(setMosaicOverlay(videoIdx, {
                videoIdx,
                x: position.x,
                y: position.y,
                width: size.width,
                height: size.height,
                visible: overlay.visible
            }));
        }
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
    }, [ isDragging, isResizing, conference, videoIdx, position, size, overlay, dispatch ]);

    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [ isDragging, isResizing, handleMouseMove, handleMouseUp ]);

    const handleRemove = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        sendMosaicOverlayCommand({
            conference,
            videoIdx,
            action: 'remove'
        });
        dispatch(removeMosaicOverlay(videoIdx));
    }, [ conference, videoIdx, dispatch ]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (editMode && isModerator) {
            setShowRemoveButton(prev => !prev);
        }
    }, [ editMode, isModerator ]);

    if (!editMode || !isModerator) {
        return null;
    }

    return (
        <div
            className = { `mosaic-overlay${editMode ? ' mosaic-overlay--editing' : ''}` }
            ref = { overlayRef }
            onClick = { handleClick }
            onMouseDown = { handleMouseDown }
            style = {{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                display: overlay.visible ? 'block' : 'none'
            }}>
            {showRemoveButton && (
                <button
                    className = 'mosaic-overlay__remove'
                    onClick = { handleRemove }>
                    Remove
                </button>
            )}
            {editMode && (
                <>
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--nw'
                        onMouseDown = { e => handleResizeMouseDown(e, 'nw') }
                    />
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--n'
                        onMouseDown = { e => handleResizeMouseDown(e, 'n') }
                    />
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--ne'
                        onMouseDown = { e => handleResizeMouseDown(e, 'ne') }
                    />
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--e'
                        onMouseDown = { e => handleResizeMouseDown(e, 'e') }
                    />
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--se'
                        onMouseDown = { e => handleResizeMouseDown(e, 'se') }
                    />
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--s'
                        onMouseDown = { e => handleResizeMouseDown(e, 's') }
                    />
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--sw'
                        onMouseDown = { e => handleResizeMouseDown(e, 'sw') }
                    />
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--w'
                        onMouseDown = { e => handleResizeMouseDown(e, 'w') }
                    />
                </>
            )}
        </div>
    );
};

export default MosaicOverlay;
