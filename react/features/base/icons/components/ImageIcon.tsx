import React from 'react';

interface IProps {
    className?: string;
    fill?: string;
    height?: number | string;
    id?: string;
    src: string;
    style?: React.CSSProperties;
    width?: number | string;
}

/**
 * Image icon component for rendering base64 or URL images as icons.
 *
 * @param {IProps} props - Component props.
 * @returns {ReactElement}
 */
export default function ImageIcon({
    className,
    height,
    id,
    src,
    style,
    width
}: IProps) {
    return (
        <img
            className = { className }
            id = { id }
            src = { src }
            style = {{
                height,
                width,
                ...style
            }} />
    );
}
