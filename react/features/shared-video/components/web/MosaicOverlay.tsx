/* eslint-disable no-invalid-this */
import { throttle } from 'lodash-es';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getCurrentConference } from '../../../base/conference/functions';
import { IMosaicOverlay, removeMosaicOverlay, setMosaicOverlay } from '../../actions.any';
import { sendMosaicOverlayCommand } from '../../functions';

interface IProps {
    containerRef: React.RefObject<HTMLDivElement>;
    editMode: boolean;
    isModerator: boolean;
    overlay: IMosaicOverlay;
    videoIdx: number;
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
    const [ position, setPosition ] = useState({ x: overlay.x,
        y: overlay.y });
    const [ size, setSize ] = useState({ width: overlay.width,
        height: overlay.height });

    const dragStartPos = useRef({ x: 0,
        y: 0 });
    const resizeStartSize = useRef({ width: 0,
        height: 0 });
    const resizeStartPos = useRef({ x: 0,
        y: 0 });
    const resizeStartBounds = useRef({ left: 0,
        top: 0,
        width: 0,
        height: 0,
        refDim: 0 });

    // Throttled send function
    const throttledSendUpdate = useCallback(
        throttle(
            (idx: number,
                    pos: { x: number; y: number; }, sz: { height: number; width: number; }, vis: boolean) => {
                if (conference) {
                    sendMosaicOverlayCommand({
                        conference,
                        videoIdx: idx,
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

    // Sync position and size with overlay prop changes (ratios)
    useEffect(() => {
        setPosition({ x: overlay.x,
            y: overlay.y });
        setSize({ width: overlay.width,
            height: overlay.height });
    }, [ overlay ]);

    // Get container bounds
    const getContainerBounds = useCallback(() => {
        if (containerRef.current) {
            return containerRef.current.getBoundingClientRect();
        }

        return null;
    }, [ containerRef ]);

    // Get reference dimension (smaller of width/height)
    const getRefDim = useCallback(() => {
        const bounds = getContainerBounds();

        if (!bounds) {
            return 0;
        }

        return Math.min(bounds.width, bounds.height);
    }, [ getContainerBounds ]);

    // Convert position.x ratio to pixels using container width
    const getPixelX = useCallback((ratio: number) => {
        const bounds = getContainerBounds();

        if (!bounds) {
            return 0;
        }

        return ratio * bounds.width;
    }, [ getContainerBounds ]);

    // Convert position.y ratio to pixels using container height
    const getPixelY = useCallback((ratio: number) => {
        const bounds = getContainerBounds();

        if (!bounds) {
            return 0;
        }

        return ratio * bounds.height;
    }, [ getContainerBounds ]);

    // Convert size ratio to pixels using container dimensions (for cross-device consistency)
    const getPixelSize = useCallback((ratio: number, dimension: 'width' | 'height' = 'width') => {
        const bounds = getContainerBounds();

        if (!bounds) {
            return 0;
        }
        const dim = dimension === 'width' ? bounds.width : bounds.height;

        return ratio * dim;
    }, [ getContainerBounds ]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!editMode || !isModerator) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        setIsDragging(true);
        const bounds = getContainerBounds();
        const refDim = getRefDim();

        if (bounds) {
            resizeStartBounds.current = {
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                refDim
            };
            dragStartPos.current = {
                x: e.clientX - getPixelX(position.x),
                y: e.clientY - getPixelY(position.y)
            };
        }
    }, [ editMode, isModerator, position, size, getContainerBounds, getRefDim, getPixelX, getPixelY ]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
        if (!editMode || !isModerator) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setResizeHandle(handle);
        const bounds = getContainerBounds();
        const refDim = getRefDim();

        if (bounds) {
            resizeStartBounds.current = {
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                refDim
            };
            resizeStartSize.current = { width: size.width,
                height: size.height };
            resizeStartPos.current = {
                x: e.clientX,
                y: e.clientY
            };
        }
    }, [ editMode, isModerator, size, getContainerBounds, getRefDim ]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const startBounds = resizeStartBounds.current;

        if (!startBounds.refDim) {
            return;
        }

        if (isDragging) {
            // Calculate new position in pixel space first
            const newPixelX = e.clientX - dragStartPos.current.x;
            const newPixelY = e.clientY - dragStartPos.current.y;

            // Convert to ratio (position and size now both use bounds.width/bounds.height as reference)
            const finalX = newPixelX / startBounds.width;
            const finalY = newPixelY / startBounds.height;

            // maxX = 1 - size.width since both are ratios relative to bounds.width
            const maxX = 1 - size.width;
            const maxY = 1 - size.height;
            const clampedX = Math.max(0, Math.min(finalX, maxX));
            const clampedY = Math.max(0, Math.min(finalY, maxY));

            setPosition({ x: clampedX,
                y: clampedY });
        } else if (isResizing && resizeHandle) {
            // Current size in ratio (relative to container dimensions)
            let newWidth = resizeStartSize.current.width;
            let newHeight = resizeStartSize.current.height;
            let newX = position.x;
            let newY = position.y;

            const minWidthRatio = 50 / startBounds.width;
            const minHeightRatio = 50 / startBounds.height;

            // Calculate new size/position based on handle
            if (resizeHandle === 'se') {
                // Bottom-right corner moves, top-left stays fixed
                const mousePixelX = e.clientX - startBounds.left;
                const mousePixelY = e.clientY - startBounds.top;
                const leftEdgePixel = position.x * startBounds.width;
                const topEdgePixel = position.y * startBounds.height;
                const newWidthPixel = mousePixelX - leftEdgePixel;
                const newHeightPixel = mousePixelY - topEdgePixel;


                // Convert to ratios relative to container dimensions
                newWidth = Math.max(minWidthRatio, newWidthPixel / startBounds.width);
                newHeight = Math.max(minHeightRatio, newHeightPixel / startBounds.height);
            } else if (resizeHandle === 'e') {
                // Right edge follows mouse directly
                const mousePixelX = e.clientX - startBounds.left;
                const leftEdgePixel = position.x * startBounds.width;
                const newWidthPixel = mousePixelX - leftEdgePixel;

                newWidth = Math.max(minWidthRatio, newWidthPixel / startBounds.width);
            } else if (resizeHandle === 's') {
                // Bottom edge follows mouse directly
                const mousePixelY = e.clientY - startBounds.top;
                const topEdgePixel = position.y * startBounds.height;
                const newHeightPixel = mousePixelY - topEdgePixel;

                newHeight = Math.max(minHeightRatio, newHeightPixel / startBounds.height);
            }

            // Clamp to bounds
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);

            setSize({ width: newWidth,
                height: newHeight });
            setPosition({ x: newX,
                y: newY });

            throttledSendUpdate(videoIdx, { x: newX,
                y: newY }, { width: newWidth,
                height: newHeight }, overlay.visible);
        }
    }, [ isDragging, isResizing, resizeHandle, size, position, videoIdx, overlay, throttledSendUpdate ]);

    const handleMouseUp = useCallback(() => {
        if (isDragging || isResizing) {
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

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
    }, []);

    const handleResizeMouseDownE = useCallback((e: React.MouseEvent) => {
        handleResizeMouseDown(e, 'e');
    }, [ handleResizeMouseDown ]);

    const handleResizeMouseDownSE = useCallback((e: React.MouseEvent) => {
        handleResizeMouseDown(e, 'se');
    }, [ handleResizeMouseDown ]);

    const handleResizeMouseDownS = useCallback((e: React.MouseEvent) => {
        handleResizeMouseDown(e, 's');
    }, [ handleResizeMouseDown ]);

    // Handle resize observer for container size changes
    useEffect(() => {
        let rafId: number;
        let resizeObserver: ResizeObserver | null = null;

        const handleResize = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
                setPosition(prev => {
                    return { ...prev };
                });
                setSize(prev => {
                    return { ...prev };
                });
            });
        };

        if (containerRef.current) {
            resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            if (resizeObserver && containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, [ containerRef ]);

    const overlayClassName = `mosaic-overlay${editMode ? ' mosaic-overlay--editing' : ''}${
        overlay.visible ? '' : ' mosaic-overlay--hidden'
    }`;

    return (
        <div
            className = { overlayClassName }
            onClick = { handleClick }
            onDragEnd = { handleDragEnd }
            onDragEnter = { handleDragEnter }
            onDragLeave = { handleDragLeave }
            onDragOver = { handleDragOver }
            onDragStart = { handleDragStart }
            onDrop = { handleDrop }
            onMouseDown = { handleMouseDown }
            ref = { overlayRef }
            style = {{
                left: getPixelX(position.x),
                top: getPixelY(position.y),
                width: getPixelSize(size.width, 'width'),
                height: getPixelSize(size.height, 'height')
            }}>
            {showRemoveButton && isModerator && (
                <button
                    className = 'mosaic-overlay__remove'
                    onClick = { handleRemove }>
                    ×
                </button>
            )}
            {editMode && (
                <>
                    {/* 只允许向右/向下扩展: e, s, se */}
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--e'
                        onMouseDown = { handleResizeMouseDownE } />
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--se'
                        onMouseDown = { handleResizeMouseDownSE } />
                    <div
                        className = 'mosaic-overlay__handle mosaic-overlay__handle--s'
                        onMouseDown = { handleResizeMouseDownS } />
                </>
            )}
        </div>
    );
};

export default MosaicOverlay;
