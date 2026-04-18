/* eslint-disable no-invalid-this */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { throttle } from 'lodash-es';

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

    // Throttled send function for drag/resize sync (max once per 50ms)
    const throttledSendUpdate = useCallback(throttle((videoIdx: number, pos: {x: number, y: number}, sz: {width: number, height: number}, vis: boolean) => {
        if (conference) {
            sendMosaicOverlayCommand({
                conference,
                videoIdx,
                action: 'update',
                overlay: {
                    x: pos.x,
                    y: pos.y,
                    width: sz.width,
                    height: sz.height,
                    visible: vis
                }
            });
        }
    }, 50), [ conference ]);

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

            // Handle diagonal resizers (adjust both dimensions)
            if (resizeHandle === 'se') {
                newWidth = Math.max(50, resizeStartSize.current.width + deltaX);
                newHeight = Math.max(50, resizeStartSize.current.height + deltaY);
            } else if (resizeHandle === 'sw') {
                newWidth = Math.max(50, resizeStartSize.current.width - deltaX);
                newHeight = Math.max(50, resizeStartSize.current.height + deltaY);
                newX = position.x + (resizeStartSize.current.width - newWidth);
            } else if (resizeHandle === 'ne') {
                newWidth = Math.max(50, resizeStartSize.current.width + deltaX);
                newHeight = Math.max(50, resizeStartSize.current.height - deltaY);
                newY = position.y + (resizeStartSize.current.height - newHeight);
            } else if (resizeHandle === 'nw') {
                newWidth = Math.max(50, resizeStartSize.current.width - deltaX);
                newHeight = Math.max(50, resizeStartSize.current.height - deltaY);
                newX = position.x + (resizeStartSize.current.width - newWidth);
                newY = position.y + (resizeStartSize.current.height - newHeight);
            } else {
                // Handle edge resizers (adjust single dimension)
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
            }

            // Ensure doesn't exceed container bounds
            newWidth = Math.min(newWidth, bounds.width - newX);
            newHeight = Math.min(newHeight, bounds.height - newY);

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });

            // Send throttled update during drag/resize
            throttledSendUpdate(videoIdx, { x: newX, y: newY }, { width: newWidth, height: newHeight }, overlay.visible);
        }
    }, [ isDragging, isResizing, resizeHandle, size, position, getContainerBounds, videoIdx, overlay, throttledSendUpdate ]);

    const handleMouseUp = useCallback(() => {
        if (isDragging || isResizing) {
            // Final send (in case throttled send didn't fire)
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
            {showRemoveButton && isModerator && (
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
