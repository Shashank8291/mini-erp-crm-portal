import React, { useEffect, useRef } from 'react';

interface HexagonBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
}

interface HexPoint {
  col: number;
  row: number;
  baseX: number;
  baseY: number;
  scale: number;
  r: number;
  baseAlpha: number;
  ambientPhase: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
}

// Precomputed trigonometric vertices for regular flat-topped hexagons (60 deg increments)
const HEX_VERTICES = [
  { cos: 1, sin: 0 },
  { cos: 0.5, sin: 0.8660254 },
  { cos: -0.5, sin: 0.8660254 },
  { cos: -1, sin: 0 },
  { cos: -0.5, sin: -0.8660254 },
  { cos: 0.5, sin: -0.8660254 },
];

export const HexagonBackground: React.FC<HexagonBackgroundProps> = ({ className = '', style = {} }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number = 0;
    let isRunning = false;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Check prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;

    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
      if (reducedMotion) {
        renderFrame(0);
      }
    };
    motionQuery.addEventListener('change', onMotionChange);

    // Mouse tracking state (stored in closure/refs, zero React state re-renders)
    const mouse = {
      targetX: -2000,
      targetY: -2000,
      currentX: -2000,
      currentY: -2000,
      influence: 0,
      active: false,
    };

    let ripples: Ripple[] = [];
    let hexGrid: HexPoint[] = [];

    // Helper: Build the continuous hexagon tessellation grid with 2.5D perspective depth
    const buildGrid = (w: number, h: number) => {
      const isMobile = w < 768;
      const baseR = isMobile ? 42 : 36;
      const stepX = 1.5 * baseR;
      const stepY = 1.7320508 * baseR;

      const cols = Math.ceil(w / stepX) + 3;
      const rows = Math.ceil(h / stepY) + 3;

      const grid: HexPoint[] = [];

      for (let c = -1; c < cols; c++) {
        for (let r = -1; r < rows; r++) {
          const rawX = c * stepX;
          const rawY = r * stepY + (Math.abs(c) % 2 === 1 ? stepY * 0.5 : 0);

          // Subtle 2.5D perspective scaling & opacity gradient from top to bottom
          const normY = Math.max(0, Math.min(1, rawY / (h || 1)));
          const depthScale = 0.88 + 0.16 * normY;
          const hexR = baseR * depthScale;

          // Subtle pseudo-random variation in outline brightness
          const pseudoRandom = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
          const varFactor = 0.82 + 0.36 * (pseudoRandom - Math.floor(pseudoRandom));
          const baseAlpha = (0.08 + 0.09 * normY) * varFactor;

          grid.push({
            col: c,
            row: r,
            baseX: rawX,
            baseY: rawY,
            scale: depthScale,
            r: hexR,
            baseAlpha,
            ambientPhase: (c * 0.35 + r * 0.45) % (Math.PI * 2),
          });
        }
      }

      return grid;
    };

    // Update canvas size and scale with DPR cap of 2
    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      hexGrid = buildGrid(width, height);

      if (reducedMotion) {
        renderFrame(0);
      }
    };

    // Main animation render frame
    const renderFrame = (timestamp: number) => {
      if (!ctx || width === 0 || height === 0) return;

      // 1. Base background: Charcoal to deep navy ambient background (#0B1018 to #10151E)
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.28,
        width * 0.08,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#10151E');
      bgGrad.addColorStop(0.55, '#0D121B');
      bgGrad.addColorStop(1, '#0B1018');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Smooth mouse easing (lerp)
      if (mouse.active) {
        mouse.currentX += (mouse.targetX - mouse.currentX) * 0.08;
        mouse.currentY += (mouse.targetY - mouse.currentY) * 0.08;
        mouse.influence += (1 - mouse.influence) * 0.08;
      } else {
        mouse.influence += (0 - mouse.influence) * 0.05;
      }

      // 3. Update active ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed;
        const progress = rip.radius / rip.maxRadius;
        rip.alpha = 0.26 * Math.max(0, 1 - progress);

        if (progress >= 1) {
          ripples.splice(i, 1);
        } else {
          // Draw subtle circular wave ring
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(186, 214, 235, ${rip.alpha * 0.35})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      const timeSec = timestamp * 0.001;
      const radiusGlow = 220;
      const radiusParallax = 260;

      // 4. Render Hexagon Grid
      const gridLength = hexGrid.length;
      for (let i = 0; i < gridLength; i++) {
        const hex = hexGrid[i];

        // Extremely subtle ambient breathing oscillation (<0.7px)
        const ambientFloat = reducedMotion ? 0 : Math.sin(timeSec * 0.75 + hex.ambientPhase) * 0.65;
        let cx = hex.baseX;
        let cy = hex.baseY + ambientFloat;

        // Mouse distance
        let mouseGlow = 0;
        if (mouse.influence > 0.001) {
          const dx = cx - mouse.currentX;
          const dy = cy - mouse.currentY;
          const distSq = dx * dx + dy * dy;

          // Parallax shift: controlled 4–7px displacement for nearby hexagons
          if (distSq < radiusParallax * radiusParallax) {
            const dist = Math.sqrt(distSq);
            const factor = 1 - dist / radiusParallax;
            const displacement = factor * factor * mouse.influence * 5.2; // 0 - 5.2px shift
            const angle = Math.atan2(dy, dx);
            cx += Math.cos(angle) * displacement;
            cy += Math.sin(angle) * displacement;
          }

          // Interactive glow calculation
          if (distSq < radiusGlow * radiusGlow) {
            const dist = Math.sqrt(distSq);
            const factor = 1 - dist / radiusGlow;
            mouseGlow = factor * factor * mouse.influence;
          }
        }

        // Click ripple wave influence on hexagon
        let rippleBoost = 0;
        for (let j = 0; j < ripples.length; j++) {
          const rip = ripples[j];
          const ripDx = cx - rip.x;
          const ripDy = cy - rip.y;
          const distToRip = Math.hypot(ripDx, ripDy);
          const waveDist = Math.abs(distToRip - rip.radius);

          if (waveDist < 42) {
            const waveFactor = Math.cos((waveDist / 42) * (Math.PI * 0.5));
            rippleBoost += waveFactor * rip.alpha;
            // Slight radial wave displacement
            if (distToRip > 0.001) {
              cx += (ripDx / distToRip) * waveFactor * 1.8;
              cy += (ripDy / distToRip) * waveFactor * 1.8;
            }
          }
        }

        // Color computation: Steel blue (#475569) to Silver blue (#BACDE2 / #CBD5E1)
        const totalHighlight = Math.min(1, mouseGlow + rippleBoost);
        const rColor = Math.round(71 + (186 - 71) * totalHighlight);
        const gColor = Math.round(85 + (205 - 85) * totalHighlight);
        const bColor = Math.round(105 + (226 - 105) * totalHighlight);

        // Opacity: Restrained, non-distracting SaaS transparency
        const alpha = Math.min(0.65, hex.baseAlpha + totalHighlight * 0.36);
        const lineWidth = 0.8 + totalHighlight * 0.6;

        // Draw hexagon outline
        ctx.beginPath();
        const r = hex.r;
        ctx.moveTo(cx + r * HEX_VERTICES[0].cos, cy + r * HEX_VERTICES[0].sin);
        ctx.lineTo(cx + r * HEX_VERTICES[1].cos, cy + r * HEX_VERTICES[1].sin);
        ctx.lineTo(cx + r * HEX_VERTICES[2].cos, cy + r * HEX_VERTICES[2].sin);
        ctx.lineTo(cx + r * HEX_VERTICES[3].cos, cy + r * HEX_VERTICES[3].sin);
        ctx.lineTo(cx + r * HEX_VERTICES[4].cos, cy + r * HEX_VERTICES[4].sin);
        ctx.lineTo(cx + r * HEX_VERTICES[5].cos, cy + r * HEX_VERTICES[5].sin);
        ctx.closePath();

        // Subtle soft center illumination on direct hover
        if (totalHighlight > 0.15) {
          ctx.fillStyle = `rgba(${rColor}, ${gColor}, ${bColor}, ${totalHighlight * 0.045})`;
          ctx.fill();
        }

        ctx.strokeStyle = `rgba(${rColor}, ${gColor}, ${bColor}, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };

    // Animation loop controller
    const loop = (timestamp: number) => {
      if (!isRunning) return;
      renderFrame(timestamp);
      animId = requestAnimationFrame(loop);
    };

    const startAnimation = () => {
      if (!isRunning && !reducedMotion) {
        isRunning = true;
        animId = requestAnimationFrame(loop);
      }
    };

    const stopAnimation = () => {
      isRunning = false;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = 0;
      }
    };

    // Event Listeners on window (keeps decorative canvas pointer-events: none)
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
      if (!isRunning && !reducedMotion) {
        startAnimation();
      }
    };

    const handlePointerLeave = () => {
      mouse.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      // Add a subtle click ripple (limit to 3 simultaneous ripples)
      if (ripples.length < 3) {
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          maxRadius: Math.min(width, height) * 0.42,
          speed: 4.6,
          alpha: 0.28,
        });
        if (!isRunning && !reducedMotion) {
          startAnimation();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handleClick, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ResizeObserver for reliable container measurement
    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);

    // Initial setup
    resize();
    startAnimation();

    // Cleanup on unmount
    return () => {
      stopAnimation();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handleClick);
      document.removeEventListener('mouseleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', onMotionChange);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`hexagon-canvas-container ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 25%, #10151E 0%, #0B1018 80%)',
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default HexagonBackground;
