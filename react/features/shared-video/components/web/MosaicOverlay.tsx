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
    videoRef?: React.RefObject<HTMLVideoElement>;
    videoWidth?: number;
    videoHeight?: number;
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
    videoRef,
    isModerator,
    editMode,
    overlay,
    videoWidth: videoWidthProp,
    videoHeight: videoHeightProp
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

    // Get video bounds - try to find actual video element inside container
    const getVideoBounds = useCallback(() => {
        // If videoRef is provided, use it directly
        if (videoRef?.current) {
            return videoRef.current.getBoundingClientRect();
        }

        // Fallback: find video element inside container
        if (containerRef?.current) {
            const videoEl = containerRef.current.querySelector('video');
            if (videoEl) {
                return videoEl.getBoundingClientRect();
            }
            // If no video found, use container bounds
            return containerRef.current.getBoundingClientRect();
        }

        return null;
    }, [ videoRef, containerRef ]);

    // Get bounds based on actual video display size
    // Always use container width as reference, calculate height based on video aspect ratio
    const getEffectiveBounds = useCallback(() => {
        const bounds = getVideoBounds();

        if (!bounds) {
            return null;
        }

        // Get video resolution from props (passed from ExtendedVideoManager)
        // Fallback to 1920x1080 if not provided
        const videoWidth = videoWidthProp || 1920;
        const videoHeight = videoHeightProp || 1080;

        console.log('[MosaicOverlay] getEffectiveBounds - videoProp:', videoWidth, 'x', videoHeight, 'container bounds:', bounds.width, 'x', bounds.height);

        // Determine actual video size based on aspect ratio comparison
        // If video aspect < container aspect: video fills height (左右黑边)
        // If video aspect > container aspect: video fills width (上下黑边)
        const videoAspect = videoWidth / videoHeight;
        const containerAspect = bounds.width / bounds.height;
        let actualVideoWidth: number;
        let actualVideoHeight: number;

        if (videoAspect < containerAspect) {
            // Video is taller relative to container - fills height (左右黑边)
            actualVideoHeight = bounds.height;
            actualVideoWidth = bounds.height * videoAspect;
        } else {
            // Video is wider relative to container - fills width (上下黑边)
            actualVideoWidth = bounds.width;
            actualVideoHeight = bounds.width / videoAspect;
        }

        const contentLeft = bounds.left + (bounds.width - actualVideoWidth) / 2;
        const contentTop = bounds.top + (bounds.height - actualVideoHeight) / 2;

        return {
            left: contentLeft,
            top: contentTop,
            width: actualVideoWidth,
            height: actualVideoHeight,
            centerX: contentLeft + actualVideoWidth / 2,
            centerY: contentTop + actualVideoHeight / 2
        };
    }, [ getVideoBounds, videoWidthProp, videoHeightProp ]);

    // Get container center
    const getContainerCenter = useCallback(() => {
        const bounds16x9 = getEffectiveBounds();

        if (!bounds16x9) {
            return { centerX: 0, centerY: 0 };
        }

        return {
            centerX: bounds16x9.centerX,
            centerY: bounds16x9.centerY
        };
    }, [ getEffectiveBounds ]);

    // Get reference dimension (smaller of width/height)
    const getRefDim = useCallback(() => {
        const bounds = getEffectiveBounds();

        if (!bounds) {
            return 0;
        }

        return Math.min(bounds.width, bounds.height);
    }, [ getEffectiveBounds ]);

    // Convert center-based ratio to absolute pixel X position
    // x ratio is relative to video center, so: pixelX = centerX + x * width
    const getPixelX = useCallback((ratio: number) => {
        const bounds = getEffectiveBounds();
        if (!bounds) {
            return 0;
        }

        return bounds.centerX + ratio * bounds.width / 2;
    }, [ getEffectiveBounds ]);

    // Convert center-based ratio to absolute pixel Y position
    // y ratio is relative to video center, so: pixelY = centerY + y * height
    const getPixelY = useCallback((ratio: number) => {
        const bounds = getEffectiveBounds();
        if (!bounds) {
            return 0;
        }

        return bounds.centerY + ratio * bounds.height / 2;
    }, [ getEffectiveBounds ]);

    // Convert size ratio to absolute pixels (using effective bounds)
    // Size is stored as ratio relative to video dimensions
    const getPixelSize = useCallback((ratio: number, dimension: 'width' | 'height' = 'width') => {
        const bounds = getEffectiveBounds();

        if (!bounds) {
            return 0;
        }
        const dim = dimension === 'width' ? bounds.width : bounds.height;

        return ratio * dim;
    }, [ getEffectiveBounds ]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!editMode || !isModerator) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        setIsDragging(true);
        const bounds = getEffectiveBounds();

        if (bounds && overlayRef.current) {
            resizeStartBounds.current = {
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                refDim: Math.min(bounds.width, bounds.height)
            };
            // Get actual overlay center from DOM
            const overlayRect = overlayRef.current.getBoundingClientRect();
            const overlayCenterX = overlayRect.left + overlayRect.width / 2;
            const overlayCenterY = overlayRect.top + overlayRect.height / 2;
            dragStartPos.current = {
                x: e.clientX - overlayCenterX,
                y: e.clientY - overlayCenterY
            };
            console.log('[MosaicOverlay] handleMouseDown - mouse:', e.clientX, e.clientY, 'overlayCenter:', overlayCenterX, overlayCenterY, 'bounds:', bounds.left, bounds.top, bounds.width, bounds.height);
        }
    }, [ editMode, isModerator, getEffectiveBounds ]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
        if (!editMode || !isModerator) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setResizeHandle(handle);
        const bounds = getEffectiveBounds();
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
    }, [ editMode, isModerator, size, getEffectiveBounds, getRefDim ]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const startBounds = resizeStartBounds.current;

        if (!startBounds.refDim) {
            return;
        }

        if (isDragging) {
            // Calculate new center position in pixel space
            const newPixelCenterX = e.clientX - dragStartPos.current.x;
            const newPixelCenterY = e.clientY - dragStartPos.current.y;

            // Convert to ratio relative to video bounds center
            // x ratio = (pixelCenterX - videoCenterX) / (videoWidth / 2)
            const videoCenterX = startBounds.left + startBounds.width / 2;
            const videoCenterY = startBounds.top + startBounds.height / 2;
            const finalX = (newPixelCenterX - videoCenterX) / (startBounds.width / 2);
            const finalY = (newPixelCenterY - videoCenterY) / (startBounds.height / 2);

            console.log('[MosaicOverlay] handleMouseMove - mouse:', e.clientX, e.clientY, 'newCenter:', newPixelCenterX, newPixelCenterY, 'videoCenter:', videoCenterX, videoCenterY, 'final:', finalX, finalY);

            // Clamp to reasonable bounds (-1 to 1, keeping overlay within container)
            const maxOffsetX = 1 - size.width / 2;
            const maxOffsetY = 1 - size.height / 2;
            const clampedX = Math.max(-maxOffsetX, Math.min(finalX, maxOffsetX));
            const clampedY = Math.max(-maxOffsetY, Math.min(finalY, maxOffsetY));

            setPosition({ x: clampedX,
                y: clampedY });
        } else if (isResizing && resizeHandle) {
            // Current size in ratio (relative to container dimensions)
            let newWidth = resizeStartSize.current.width;
            let newHeight = resizeStartSize.current.height;

            const minWidthRatio = 50 / startBounds.width;
            const minHeightRatio = 50 / startBounds.height;

            // Calculate new size based on handle (only SE, E, S allowed)
            if (resizeHandle === 'se') {
                // Bottom-right corner moves
                const mousePixelX = e.clientX - startBounds.left;
                const mousePixelY = e.clientY - startBounds.top;
                const newWidthPixel = mousePixelX - (startBounds.width / 2 + position.x * startBounds.width / 2) + size.width * startBounds.width / 2;
                const newHeightPixel = mousePixelY - (startBounds.height / 2 + position.y * startBounds.height / 2) + size.height * startBounds.height / 2;

                newWidth = Math.max(minWidthRatio, newWidthPixel / startBounds.width);
                newHeight = Math.max(minHeightRatio, newHeightPixel / startBounds.height);
            } else if (resizeHandle === 'e') {
                const mousePixelX = e.clientX - startBounds.left;
                const newWidthPixel = mousePixelX - (startBounds.width / 2 + position.x * startBounds.width / 2) + size.width * startBounds.width / 2;

                newWidth = Math.max(minWidthRatio, newWidthPixel / startBounds.width);
            } else if (resizeHandle === 's') {
                const mousePixelY = e.clientY - startBounds.top;
                const newHeightPixel = mousePixelY - (startBounds.height / 2 + position.y * startBounds.height / 2) + size.height * startBounds.height / 2;

                newHeight = Math.max(minHeightRatio, newHeightPixel / startBounds.height);
            }

            // Clamp size to container bounds
            newWidth = Math.min(newWidth, 1);
            newHeight = Math.min(newHeight, 1);

            setSize({ width: newWidth,
                height: newHeight });

            throttledSendUpdate(videoIdx, { x: position.x,
                y: position.y }, { width: newWidth,
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
                // Position is center-based, so convert to top-left for CSS
                left: getPixelX(position.x) - getPixelSize(size.width, 'width') / 2,
                top: getPixelY(position.y) - getPixelSize(size.height, 'height') / 2,
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
