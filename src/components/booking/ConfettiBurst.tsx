"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

// Hair Rich palette — confetti use only these colours so the burst feels
// brand-coherent (not a generic rainbow party).
const COLORS = [
    "#D4A574", // accent-warm
    "#E8C794", // accent-warm-light
    "#A8845A", // accent-warm-dark
    "#F5E6D3", // warm-white
    "#9E9E9E", // silver
];

interface Particle {
    id: number;
    angle: number;
    distance: number;
    size: number;
    color: string;
    rotation: number;
    delay: number;
    duration: number;
}

/**
 * One-shot confetti burst centered on its container. Renders ~64 particles
 * that fly outward with random angle/distance/rotation, fading out over
 * ~1.6s. Used in the booking-confirmed screen to mark the moment.
 *
 * Pure framer-motion, no external library. Pointer-events disabled so it
 * never blocks the UI underneath.
 */
export function ConfettiBurst({ count = 64 }: { count?: number }) {
    const particles = useMemo<Particle[]>(() => {
        const arr: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            arr.push({
                id: i,
                angle,
                distance: 140 + Math.random() * 260,
                size: 5 + Math.random() * 8,
                color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
                rotation: Math.random() * 720 - 360,
                delay: Math.random() * 0.12,
                duration: 1.2 + Math.random() * 0.6,
            });
        }
        return arr;
    }, [count]);

    return (
        <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center"
        >
            {particles.map((p) => {
                const x = Math.cos(p.angle) * p.distance;
                const y = Math.sin(p.angle) * p.distance - 80; // bias slight upward
                return (
                    <motion.span
                        key={p.id}
                        initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
                        animate={{
                            x,
                            y,
                            opacity: [1, 1, 0],
                            rotate: p.rotation,
                            scale: [0, 1, 1],
                        }}
                        transition={{
                            duration: p.duration,
                            delay: p.delay,
                            ease: [0.22, 0.61, 0.36, 1],
                            times: [0, 0.2, 1],
                        }}
                        style={{
                            width: p.size,
                            height: p.size * 1.6,
                            backgroundColor: p.color,
                            borderRadius: 2,
                            position: "absolute",
                        }}
                    />
                );
            })}
        </div>
    );
}
