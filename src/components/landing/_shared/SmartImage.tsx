"use client";

import { useState } from "react";

interface Props {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    aspect?: string;
    sizes?: string;
    eager?: boolean;
}

/**
 * Image with shimmer placeholder, lazy loading by default, no layout shift.
 * Use `aspect` (e.g. "aspect-[3/4]") to reserve space before load.
 */
export function SmartImage({
    src,
    alt,
    width,
    height,
    className = "",
    aspect = "",
    sizes,
    eager = false,
}: Props) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className={`relative overflow-hidden bg-carbon-2 ${aspect} ${className}`}>
            {!loaded && (
                <div
                    className="absolute inset-0 animate-pulse bg-gradient-to-br from-carbon to-carbon-2"
                    aria-hidden="true"
                />
            )}
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                sizes={sizes}
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                onLoad={() => setLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
        </div>
    );
}
