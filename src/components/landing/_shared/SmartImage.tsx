"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
    src: string;
    alt: string;
    srcSet?: string;
    width?: number;
    height?: number;
    className?: string;
    aspect?: string;
    sizes?: string;
    eager?: boolean;
    /**
     * When true, the image renders at its natural aspect ratio (no crop,
     * h-auto). Use for editorial gallery shots where preserving the
     * subject's composition matters more than a uniform grid. When false
     * (default), the image is cropped to fill the parent box with
     * object-cover — use for thumbnails / grid tiles / decorative bg.
     */
    natural?: boolean;
}

/**
 * Image with shimmer placeholder, lazy loading by default, no layout shift.
 * Use `aspect` (e.g. "aspect-[3/4]") to reserve space before load.
 */
export function SmartImage({
    src,
    alt,
    srcSet,
    width,
    height,
    className = "",
    aspect = "",
    sizes,
    eager = false,
    natural = false,
}: Props) {
    const [loaded, setLoaded] = useState(false);
    const ref = useRef<HTMLImageElement>(null);

    // Cached images: when the browser already has the asset, the <img> may
    // finish loading before React attaches the onLoad listener — the event
    // never fires and the element is stuck at opacity-0 forever. Detect
    // that case on mount via `complete` + `naturalWidth`.
    useEffect(() => {
        const el = ref.current;
        if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
    }, [src]);

    if (natural) {
        // Natural aspect ratio: image renders at its intrinsic ratio with
        // w-full h-auto. Container has no fixed aspect so masonry layouts
        // can flow rows freely. The placeholder is sized via the implicit
        // image dimensions once loaded — show a subtle pulse until then.
        return (
            <div className={`relative bg-carbon-2 ${className}`}>
                {!loaded && (
                    <div
                        className="absolute inset-0 animate-pulse bg-gradient-to-br from-carbon to-carbon-2"
                        aria-hidden="true"
                    />
                )}
                <img
                    ref={ref}
                    src={src}
                    srcSet={srcSet}
                    alt={alt}
                    width={width}
                    height={height}
                    sizes={sizes}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={eager ? "high" : "auto"}
                    onLoad={() => setLoaded(true)}
                    onError={() => setLoaded(true)}
                    className={`block w-full h-auto transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
                />
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden bg-carbon-2 ${aspect} ${className}`}>
            {!loaded && (
                <div
                    className="absolute inset-0 animate-pulse bg-gradient-to-br from-carbon to-carbon-2"
                    aria-hidden="true"
                />
            )}
            <img
                ref={ref}
                src={src}
                srcSet={srcSet}
                alt={alt}
                width={width}
                height={height}
                sizes={sizes}
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={eager ? "high" : "auto"}
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
        </div>
    );
}
