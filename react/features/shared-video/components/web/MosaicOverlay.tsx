/* eslint-disable no-invalid-this */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Rnd } from 'react-rnd';

import { getCurrentConference } from '../../../base/conference/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseCircle } from '../../../base/icons/svg';
import { IMosaicOverlay, removeMosaicOverlay, setMosaicOverlay } from '../../actions.any';
import { sendMosaicOverlayCommand } from '../../functions';

interface IProps {
    containerRef: React.RefObject<HTMLDivElement>;
    editMode: boolean;
    isModerator: boolean;
    overlay: IMosaicOverlay;
    videoHeight?: number;
    videoIdx: number;
    videoRef?: React.RefObject<HTMLVideoElement>;
    videoWidth?: number;
}

// Type aliases for react-rnd callbacks
type RndDelta = { height: number; width: number; };
type RndPosition = { x: number; y: number; };

/**
 * MosaicOverlay component for displaying and manipulating a mosaic overlay on video.
 * Uses react-rnd for drag and resize functionality.
 *
 * @param {IProps} props - Component props.
 * @returns {ReactElement}
 */
const MosaicOverlay: React.FC<IProps> = ({
    videoIdx,
    containerRef,
    isModerator,
    editMode,
    overlay,
    videoWidth: videoWidthProp,
    videoHeight: videoHeightProp
}) => {
    const dispatch = useDispatch();
    const conference = useSelector(getCurrentConference);

    const [ showRemoveButton, setShowRemoveButton ] = useState(false);

    // Hide remove button when edit mode is disabled
    useEffect(() => {
        if (!editMode) {
            setShowRemoveButton(false);
        }
    }, [ editMode ]);

    // Store sync values in refs for accurate final position
    const syncValuesRef = useRef({
        x: overlay.x,
        y: overlay.y,
        width: overlay.width,
        height: overlay.height
    });
    const currentSizeRef = useRef({ width: 0,
        height: 0 });

    // Calculate position and size from overlay props
    const _containerBounds = containerRef.current?.getBoundingClientRect();

    // Get video resolution from props or fallback
    const videoWidth = videoWidthProp || 1920;
    const videoHeight = videoHeightProp || 1080;

    // Get effective bounds (actual video display area, excluding black bars)
    const videoAspect = videoWidth / videoHeight;
    const containerAspect = _containerBounds ? _containerBounds.width / _containerBounds.height : 1;
    let actualVideoWidth: number;
    let actualVideoHeight: number;

    if (videoAspect < containerAspect) {
        actualVideoHeight = _containerBounds ? _containerBounds.height : 1;
        actualVideoWidth = actualVideoHeight * videoAspect;
    } else {
        actualVideoWidth = _containerBounds ? _containerBounds.width : 1;
        actualVideoHeight = actualVideoWidth / videoAspect;
    }
    const _contentLeft = _containerBounds ? (_containerBounds.width - actualVideoWidth) / 2 : 0;
    const _contentTop = _containerBounds ? (_containerBounds.height - actualVideoHeight) / 2 : 0;
    const videoCenterX = _contentLeft + (actualVideoWidth / 2);
    const videoCenterY = _contentTop + (actualVideoHeight / 2);

    // Initial values derived from overlay props (center-based ratios relative to video content)
    // position: x=0 means overlay center at video center, y=0 means overlay center at video center
    // size: width/height are ratios relative to video content dimensions
    const initialWidth = _containerBounds
        ? Math.max(50, overlay.width * actualVideoWidth)
        : 100;
    const initialHeight = _containerBounds
        ? Math.max(50, overlay.height * actualVideoHeight)
        : 100;
    const initialX = _containerBounds
        ? videoCenterX + (overlay.x * actualVideoWidth) - (initialWidth / 2)
        : 0;
    const initialY = _containerBounds
        ? videoCenterY + (overlay.y * actualVideoHeight) - (initialHeight / 2)
        : 0;

    const handleDragStop = useCallback((e: any, data: { node: HTMLElement; x: number; y: number; }) => {
        e.stopPropagation();

        const cBounds = containerRef.current?.getBoundingClientRect();

        if (!cBounds) {
            return;
        }

        // Get video resolution
        const vWidth = videoWidthProp || 1920;
        const vHeight = videoHeightProp || 1080;

        // Calculate effective video bounds (same as in render)
        const vAspect = vWidth / vHeight;
        const cAspect = cBounds.width / cBounds.height;
        let aVideoWidth: number;
        let aVideoHeight: number;

        if (vAspect < cAspect) {
            aVideoHeight = cBounds.height;
            aVideoWidth = aVideoHeight * vAspect;
        } else {
            aVideoWidth = cBounds.width;
            aVideoHeight = aVideoWidth / vAspect;
        }
        const cLeft = (cBounds.width - aVideoWidth) / 2;
        const cTop = (cBounds.height - aVideoHeight) / 2;
        const vCenterX = cLeft + (aVideoWidth / 2);
        const vCenterY = cTop + (aVideoHeight / 2);

        // Get current size from node
        const currentWidth = data.node.offsetWidth;
        const currentHeight = data.node.offsetHeight;

        // data.x/y is the left/top position of the overlay
        // Convert to center-based ratio relative to video content center
        const syncX = (data.x + (currentWidth / 2) - vCenterX) / aVideoWidth;
        const syncY = (data.y + (currentHeight / 2) - vCenterY) / aVideoHeight;

        syncValuesRef.current = {
            x: syncX,
            y: syncY,
            width: syncValuesRef.current.width,
            height: syncValuesRef.current.height
        };

        sendMosaicOverlayCommand({
            conference,
            videoIdx,
            action: 'update',
            overlay: {
                x: syncX,
                y: syncY,
                width: syncValuesRef.current.width,
                height: syncValuesRef.current.height,
                visible: overlay.visible
            }
        });

        dispatch(setMosaicOverlay(videoIdx, {
            videoIdx,
            x: syncX,
            y: syncY,
            width: syncValuesRef.current.width,
            height: syncValuesRef.current.height,
            visible: overlay.visible
        }));
    }, [ conference, videoIdx, overlay.visible, dispatch ]);

    // eslint-disable-next-line max-params
    const handleResizeStop = useCallback((e: any, dir: string, ref: HTMLElement, delta: RndDelta, pos: RndPosition) => {
        e.stopPropagation();

        const cBounds = containerRef.current?.getBoundingClientRect();

        if (!cBounds) {
            return;
        }

        // Get video resolution
        const vWidth = videoWidthProp || 1920;
        const vHeight = videoHeightProp || 1080;

        // Calculate effective video bounds (same as in render)
        const vAspect = vWidth / vHeight;
        const cAspect = cBounds.width / cBounds.height;
        let aVideoWidth: number;
        let aVideoHeight: number;

        if (vAspect < cAspect) {
            aVideoHeight = cBounds.height;
            aVideoWidth = aVideoHeight * vAspect;
        } else {
            aVideoWidth = cBounds.width;
            aVideoHeight = aVideoWidth / vAspect;
        }
        const cLeft = (cBounds.width - aVideoWidth) / 2;
        const cTop = (cBounds.height - aVideoHeight) / 2;
        const vCenterX = cLeft + (aVideoWidth / 2);
        const vCenterY = cTop + (aVideoHeight / 2);

        const newWidth = ref.offsetWidth;
        const newHeight = ref.offsetHeight;

        // Store current size for drag calculation
        currentSizeRef.current = { width: newWidth,
            height: newHeight };

        // pos.x/y is the left/top position, convert to center-based ratio relative to video content
        const syncX = (pos.x + (newWidth / 2) - vCenterX) / aVideoWidth;
        const syncY = (pos.y + (newHeight / 2) - vCenterY) / aVideoHeight;
        const syncWidth = newWidth / aVideoWidth;
        const syncHeight = newHeight / aVideoHeight;

        syncValuesRef.current = {
            x: syncX,
            y: syncY,
            width: syncWidth,
            height: syncHeight
        };

        sendMosaicOverlayCommand({
            conference,
            videoIdx,
            action: 'update',
            overlay: {
                x: syncX,
                y: syncY,
                width: syncWidth,
                height: syncHeight,
                visible: overlay.visible
            }
        });

        dispatch(setMosaicOverlay(videoIdx, {
            videoIdx,
            x: syncX,
            y: syncY,
            width: syncWidth,
            height: syncHeight,
            visible: overlay.visible
        }));
    }, [ conference, videoIdx, overlay.visible, dispatch ]);

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

    const overlayClassName = `mosaic-overlay${editMode ? ' mosaic-overlay--editing' : ''}${
        overlay.visible ? '' : ' mosaic-overlay--hidden'
    }`;

    // Rnd style
    const rndStyle: React.CSSProperties = {
        border: editMode ? '2px solid rgba(33, 150, 243, 0.6)' : 'none',
        boxSizing: 'border-box',
        position: 'absolute',
        cursor: editMode && isModerator ? 'move' : 'default'
    };

    return (
        <Rnd
            bounds = 'parent'
            className = { overlayClassName }
            disableDragging = { !editMode || !isModerator }
            enableResizing = { editMode && isModerator }
            minHeight = { 50 }
            minWidth = { 50 }
            onClick = { handleClick }
            onDragStop = { handleDragStop }
            onResizeStop = { handleResizeStop }
            position = {{ x: initialX,
                y: initialY }}
            size = {{ width: initialWidth,
                height: initialHeight }}
            style = { rndStyle }>
            {showRemoveButton && isModerator && (
                <div
                    className = 'mosaic-overlay__remove'
                    onClick = { handleRemove }>
                    <Icon src = { IconCloseCircle } />
                </div>
            )}
        </Rnd>
    );
};

export default MosaicOverlay;
