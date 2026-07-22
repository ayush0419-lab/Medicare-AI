import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const InteractiveGrid = () => {
  const canvasRef = useRef(null);
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const gridSpacing = 40; // spacing between grid intersections
    let cols = Math.ceil(width / gridSpacing) + 1;
    let rows = Math.ceil(height / gridSpacing) + 1;

    let particles = [];
    let ripples = [];
    let mouse = { x: -1000, y: -1000, active: false, radius: 180 };

    // Initialize/Re-initialize particles
    const initParticles = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cols = Math.ceil(width / gridSpacing) + 1;
      rows = Math.ceil(height / gridSpacing) + 1;
      particles = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gridSpacing;
          const y = r * gridSpacing;
          particles.push({
            x,
            y,
            cx: x,
            cy: y,
            vx: 0,
            vy: 0,
            targetX: x,
            targetY: y,
            col: c,
            row: r,
            pulse: 0, // intensity of hover/ripple highlight
          });
        }
      }
    };

    initParticles();

    // Resize Handler
    const handleResize = () => {
      initParticles();
    };
    window.addEventListener('resize', handleResize);

    // Mouse Listeners (Global track)
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    const handleMouseDown = (e) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(width, height) * 1.1,
        force: 18,
        speed: 12,
        decay: 0.98,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);

    // Animation Loop
    const springTension = 0.035;
    const damping = 0.16;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Update active ripples
      ripples.forEach((ripple, idx) => {
        ripple.radius += ripple.speed;
        ripple.force *= ripple.decay;
      });
      ripples = ripples.filter((r) => r.radius < r.maxRadius && r.force > 0.1);

      // Colors based on current theme mode
      const baseLineColor = isDark ? 'rgba(99, 102, 241, 0.04)' : 'rgba(15, 23, 42, 0.03)';
      const hoverLineColor = isDark ? 'rgba(6, 182, 212, 0.25)' : 'rgba(14, 165, 233, 0.22)'; // cyan/sky
      const activeDotColor = isDark ? 'rgba(168, 85, 247, 0.85)' : 'rgba(124, 58, 237, 0.85)'; // purple
      const defaultDotColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.07)';

      // 1. Update particles and compute targets
      particles.forEach((p) => {
        p.targetX = p.x;
        p.targetY = p.y;
        p.pulse = 0;

        // Apply mouse movement pull/glow
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const factor = (mouse.radius - dist) / mouse.radius;
            // Pull slightly towards mouse (elastic warp)
            p.targetX += dx * factor * 0.18;
            p.targetY += dy * factor * 0.18;
            p.pulse = Math.max(p.pulse, factor);
          }
        }

        // Apply click ripples
        ripples.forEach((ripple) => {
          const dx = p.x - ripple.x;
          const dy = p.y - ripple.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const waveWidth = 80;
          const waveDiff = Math.abs(dist - ripple.radius);

          if (waveDiff < waveWidth) {
            const intensity = (waveWidth - waveDiff) / waveWidth;
            const push = intensity * ripple.force * (1 - ripple.radius / ripple.maxRadius);
            const angle = Math.atan2(dy, dx) || 0;

            p.targetX += Math.cos(angle) * push;
            p.targetY += Math.sin(angle) * push;
            p.pulse = Math.max(p.pulse, intensity * 1.5);
          }
        });

        // Spring physics logic
        const ax = (p.targetX - p.cx) * springTension - p.vx * damping;
        const ay = (p.targetY - p.cy) * springTension - p.vy * damping;
        p.vx += ax;
        p.vy += ay;
        p.cx += p.vx;
        p.cy += p.vy;
      });

      // 2. Draw connections (Grid wireframe lines)
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Find right neighbor
        const hasRight = p1.col < cols - 1;
        const hasBelow = p1.row < rows - 1;

        if (hasRight) {
          const p2 = particles[i + 1];
          const avgPulse = (p1.pulse + p2.pulse) / 2;
          ctx.strokeStyle = avgPulse > 0.05 
            ? lerpColor(baseLineColor, hoverLineColor, avgPulse)
            : baseLineColor;
          ctx.beginPath();
          ctx.moveTo(p1.cx, p1.cy);
          ctx.lineTo(p2.cx, p2.cy);
          ctx.stroke();
        }

        if (hasBelow) {
          const p2 = particles[i + cols];
          if (p2) {
            const avgPulse = (p1.pulse + p2.pulse) / 2;
            ctx.strokeStyle = avgPulse > 0.05 
              ? lerpColor(baseLineColor, hoverLineColor, avgPulse)
              : baseLineColor;
            ctx.beginPath();
            ctx.moveTo(p1.cx, p1.cy);
            ctx.lineTo(p2.cx, p2.cy);
            ctx.stroke();
          }
        }
      }

      // 3. Draw nodes (Dots and pluses)
      particles.forEach((p) => {
        if (p.pulse > 0.1) {
          // Draw bright pulsing node
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, 1.5 + p.pulse * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = lerpColor(defaultDotColor, activeDotColor, p.pulse);
          ctx.fill();
        } else {
          // Draw base node
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = defaultDotColor;
          ctx.fill();
        }

        // Draw occasional telemetry crosses for sci-fi clinical look
        if ((p.col % 8 === 0 && p.row % 8 === 0) || p.pulse > 0.9) {
          ctx.strokeStyle = p.pulse > 0.1 ? hoverLineColor : defaultDotColor;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          // Horizontal tick
          ctx.moveTo(p.cx - 4, p.cy);
          ctx.lineTo(p.cx + 4, p.cy);
          // Vertical tick
          ctx.moveTo(p.cx, p.cy - 4);
          ctx.lineTo(p.cx, p.cy + 4);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanups
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  // Color interpolation helper
  const lerpColor = (color1, color2, factor) => {
    // Basic parser for rgba format
    const match1 = color1.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    const match2 = color2.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    
    if (!match1 || !match2) return color1;

    const r1 = parseInt(match1[1]);
    const g1 = parseInt(match1[2]);
    const b1 = parseInt(match1[3]);
    const a1 = match1[4] !== undefined ? parseFloat(match1[4]) : 1;

    const r2 = parseInt(match2[1]);
    const g2 = parseInt(match2[2]);
    const b2 = parseInt(match2[3]);
    const a2 = match2[4] !== undefined ? parseFloat(match2[4]) : 1;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    const a = a1 + (a2 - a1) * factor;

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 block bg-transparent"
      style={{ mixBlendMode: 'normal' }}
    />
  );
};
