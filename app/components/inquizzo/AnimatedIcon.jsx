'use client';

import React from 'react';

/**
 * AnimatedIcon — GIF/Lucide icon component.
 *
 * MODES:
 *   isActive={true}     → GIF always plays (loop). Used for mic/timer during recording.
 *   hoverParent={true}  → GIF plays when card ancestor is hovered (DOM detection).
 *   selfHover={true}    → GIF plays when icon itself is hovered.
 *   All false (default) → Always shows static first frame.
 *
 * GIF icons are rendered with filter:invert(1) so white bg → black, icon body → white.
 * This matches the dark theme without any blend-mode hacks.
 */

const StaticFrame = ({ src, className, style }) => {
    const [frameSrc, setFrameSrc] = React.useState(null);

    React.useEffect(() => {
        if (!src) return;
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = src;
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                setFrameSrc(canvas.toDataURL('image/png'));
            } catch {
                setFrameSrc(src);
            }
        };
    }, [src]);

    if (!frameSrc) return <div className={className} />;
    return <img src={frameSrc} alt="" className={className} style={style} draggable={false} />;
};

export const AnimatedIcon = ({
    Icon,
    src,
    className = '',
    animation = 'pulse',
    hoverParent = false,
    selfHover = false,
    isActive: isActiveProp = false,
    bgColor = null,           // custom bg color for GIF container (overrides default)
    removeWhite = false,      // backwards-compat, ignored
    ...props
}) => {
    const ref = React.useRef(null);
    const [isParentHovered, setIsParentHovered] = React.useState(false);
    const [isSelfHovered, setIsSelfHovered] = React.useState(false);

    // ── DOM-based parent hover detection ──────────────
    React.useEffect(() => {
        if (!hoverParent || !ref.current) return;
        const card = ref.current.closest('[data-cursor="card"]');
        if (!card) return;

        const onEnter = () => setIsParentHovered(true);
        const onLeave = () => setIsParentHovered(false);

        card.addEventListener('mouseenter', onEnter);
        card.addEventListener('mouseleave', onLeave);
        return () => {
            card.removeEventListener('mouseenter', onEnter);
            card.removeEventListener('mouseleave', onLeave);
        };
    }, [hoverParent]);

    const showAnimated =
        isActiveProp ||
        (hoverParent && isParentHovered) ||
        (selfHover && isSelfHovered);

    const hoverHandlers = selfHover
        ? {
            onMouseEnter: () => setIsSelfHovered(true),
            onMouseLeave: () => setIsSelfHovered(false),
        }
        : {};

    // Invert GIF colors: white bg → black, icon body → white
    // Then screen blend makes the black areas show the container's dark purple bg
    const imgStyle = src
        ? { filter: 'invert(1)', mixBlendMode: 'screen' }
        : {};

    const gifContainerStyle = src
        ? {
            background: bgColor || 'lab(1.97 8.59 -21.87 / 1)',
            isolation: 'isolate',
            borderRadius: 'inherit',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }
        : {};

    return (
        <div
            ref={ref}
            className={`inline-flex items-center justify-center relative ${className}`}
            {...hoverHandlers}
            {...props}
        >
            {src ? (
                <div style={gifContainerStyle}>
                    {showAnimated ? (
                        <img
                            src={src}
                            alt=""
                            className="w-full h-full object-contain"
                            style={imgStyle}
                            draggable={false}
                        />
                    ) : (
                        <StaticFrame
                            src={src}
                            className="w-full h-full object-contain"
                            style={imgStyle}
                        />
                    )}
                </div>
            ) : Icon ? (
                <Icon className="w-full h-full" />
            ) : null}
        </div>
    );
};

export default AnimatedIcon;