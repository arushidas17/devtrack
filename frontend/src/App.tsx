import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Github,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Code2,
  Activity,
  Layers,
  BarChart3,
  User,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Award,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthLoadingScreen } from './components/auth/AuthLoadingScreen';
import { AuthErrorScreen } from './components/auth/AuthErrorScreen';
import { MinimalDashboard } from './components/dashboard/MinimalDashboard';

/* ==========================================================================
   HOOKS
   ========================================================================== */

function useCountUp(endValue: number, duration: number = 1600, startNow: boolean = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startNow) return;
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(easedProgress * endValue));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [endValue, duration, startNow]);

  return count;
}

function useInView(options: IntersectionObserverInit = { threshold: 0.15 }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(entry.target);
      }
    }, options);

    observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [options]);

  return [ref, inView] as const;
}

/* ==========================================================================
   3D TILT & INTERACTION HOOK / COMPONENT
   ========================================================================== */
interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
  glareColor?: string;
  elevateLayers?: boolean;
}

const TiltCard3D: React.FC<TiltCard3DProps> = ({
  children,
  className = '',
  style = {},
  maxTilt = 8,
  glareColor = 'rgba(192, 132, 252, 0.15)'
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -maxTilt;
    const rotY = ((x - centerX) / centerX) * maxTilt;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(4px)`,
      transition: 'transform 0.08s ease-out'
    });

    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      transition: 'transform 0.35s ease-out'
    });
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card-3d ${className}`}
      style={{ ...style, ...tiltStyle }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="tilt-card-glare"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor} 0%, transparent 65%)`,
          opacity: glarePos.opacity
        }}
        aria-hidden="true"
      />
      <div className="tilt-card-inner-3d">
        {children}
      </div>
    </div>
  );
};

/* ==========================================================================
   INTERACTIVE 3D PLEXUS & MATHEMATICAL GEODESIC WIREFRAME CANVAS
   ========================================================================== */
interface PlexusNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseAlpha: number;
}

interface Node3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  radius: number;
  color: string;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

/* ==========================================================================
   INTERACTIVE 3D MULTI-CORNER GEOMETRIES & PLEXUS CANVAS
   ========================================================================== */
interface PlexusNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseAlpha: number;
}

interface Node3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  radius: number;
  color: string;
  group: 'topRightSphere' | 'topLeftPoly' | 'bottomLeftRing' | 'bottomRightLattice';
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

const InteractivePlexusBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<PlexusNode[]>([]);
  const nodes3DRef = useRef<Node3D[]>([]);
  const burstsRef = useRef<BurstParticle[]>([]);
  const ripplesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; strength: number; alpha: number }[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const rotRef = useRef<{ rotX: number; rotY: number; targetRotX: number; targetRotY: number; spinSpeed: number; cornerSpin: number }>({
    rotX: 0,
    rotY: 0,
    targetRotX: 0,
    targetRotY: 0,
    spinSpeed: 0.006,
    cornerSpin: 0
  });

  const initNodes = useCallback((width: number, height: number) => {
    // 2D background nodes across whole canvas
    const count = Math.min(Math.floor((width * height) / 22000), 55);
    const nodes: PlexusNode[] = [];
    const colors = ['#c084fc', '#a855f7', '#9333ea', '#818cf8', '#d946ef', '#e879f9'];

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.35 + 0.45
      });
    }
    nodesRef.current = nodes;

    const all3DNodes: Node3D[] = [];

    // 1. TOP-RIGHT CORNER: 3D Geodesic Telemetry Sphere & Dual Gyroscopic Rings
    const sphereRadius = Math.min(width * 0.17, 195);
    const rings = 8;
    const segmentsPerRing = 12;

    for (let i = 0; i < rings; i++) {
      const phi = (Math.PI * (i + 1)) / (rings + 1);
      const ringR = sphereRadius * Math.sin(phi);
      const y = sphereRadius * Math.cos(phi);

      for (let j = 0; j < segmentsPerRing; j++) {
        const theta = (2 * Math.PI * j) / segmentsPerRing;
        const x = ringR * Math.cos(theta);
        const z = ringR * Math.sin(theta);

        all3DNodes.push({
          x,
          y,
          z,
          baseX: x,
          baseY: y,
          baseZ: z,
          radius: Math.random() * 2.2 + 2.0,
          color: colors[Math.floor(Math.random() * colors.length)],
          group: 'topRightSphere'
        });
      }
    }

    // Top-Right Outer Gyroscopic Orbital Ring 1
    const orbitR1 = sphereRadius * 1.38;
    for (let j = 0; j < 20; j++) {
      const theta = (2 * Math.PI * j) / 20;
      all3DNodes.push({
        x: orbitR1 * Math.cos(theta),
        y: (orbitR1 * 0.45) * Math.sin(theta),
        z: orbitR1 * Math.sin(theta),
        baseX: orbitR1 * Math.cos(theta),
        baseY: (orbitR1 * 0.45) * Math.sin(theta),
        baseZ: orbitR1 * Math.sin(theta),
        radius: 2.8,
        color: '#3FE0D0',
        group: 'topRightSphere'
      });
    }

    // Top-Right Outer Gyroscopic Orbital Ring 2 (Cross tilt)
    const orbitR2 = sphereRadius * 1.52;
    for (let j = 0; j < 18; j++) {
      const theta = (2 * Math.PI * j) / 18;
      all3DNodes.push({
        x: (orbitR2 * 0.4) * Math.sin(theta),
        y: orbitR2 * Math.cos(theta),
        z: orbitR2 * Math.sin(theta),
        baseX: (orbitR2 * 0.4) * Math.sin(theta),
        baseY: orbitR2 * Math.cos(theta),
        baseZ: orbitR2 * Math.sin(theta),
        radius: 2.4,
        color: '#F0559C',
        group: 'topRightSphere'
      });
    }

    // 2. TOP-LEFT CORNER: 3D Dual-Layer Stellated Polyhedron / Octahedron
    const polyR = Math.min(width * 0.12, 130);
    const octahedronVertices = [
      { x: polyR, y: 0, z: 0 },
      { x: -polyR, y: 0, z: 0 },
      { x: 0, y: polyR, z: 0 },
      { x: 0, y: -polyR, z: 0 },
      { x: 0, y: 0, z: polyR },
      { x: 0, y: 0, z: -polyR },
      { x: polyR * 0.65, y: polyR * 0.65, z: polyR * 0.65 },
      { x: -polyR * 0.65, y: -polyR * 0.65, z: -polyR * 0.65 },
      { x: polyR * 0.65, y: -polyR * 0.65, z: -polyR * 0.65 },
      { x: -polyR * 0.65, y: polyR * 0.65, z: -polyR * 0.65 },
      // Inner glowing core
      { x: polyR * 0.35, y: 0, z: 0 },
      { x: -polyR * 0.35, y: 0, z: 0 },
      { x: 0, y: polyR * 0.35, z: 0 },
      { x: 0, y: -polyR * 0.35, z: 0 }
    ];

    octahedronVertices.forEach(v => {
      all3DNodes.push({
        x: v.x,
        y: v.y,
        z: v.z,
        baseX: v.x,
        baseY: v.y,
        baseZ: v.z,
        radius: 3.0,
        color: '#8B7CF6',
        group: 'topLeftPoly'
      });
    });

    // 3. BOTTOM-LEFT CORNER: 3D Dual-Coil Gyroscopic Torus Ring
    const torusR = Math.min(width * 0.14, 150);
    for (let j = 0; j < 22; j++) {
      const theta = (2 * Math.PI * j) / 22;
      all3DNodes.push({
        x: torusR * Math.cos(theta),
        y: torusR * Math.sin(theta),
        z: (torusR * 0.5) * Math.sin(theta * 2),
        baseX: torusR * Math.cos(theta),
        baseY: torusR * Math.sin(theta),
        baseZ: (torusR * 0.5) * Math.sin(theta * 2),
        radius: 2.6,
        color: j % 2 === 0 ? '#F0559C' : '#3FE0D0',
        group: 'bottomLeftRing'
      });
    }

    // 4. BOTTOM-RIGHT CORNER: 3D Double-Helix Telemetry Lattice
    const latticeR = Math.min(width * 0.13, 135);
    for (let j = 0; j < 18; j++) {
      const angle = (2 * Math.PI * j) / 18;
      const r = latticeR * (0.65 + 0.35 * Math.sin(j * 1.5));
      all3DNodes.push({
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
        z: (Math.sin(j * 3) * latticeR * 0.8),
        baseX: r * Math.cos(angle),
        baseY: r * Math.sin(angle),
        baseZ: (Math.sin(j * 3) * latticeR * 0.8),
        radius: 2.8,
        color: '#5B8DEF',
        group: 'bottomRightLattice'
      });
    }

    nodes3DRef.current = all3DNodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    initNodes(width, height);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes(width, height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;

      // Calculate smooth, subtle 3D tilt target based on mouse position
      const normX = (e.clientX / width - 0.5) * 2;
      const normY = (e.clientY / height - 0.5) * 2;
      rotRef.current.targetRotY = normX * 0.32;
      rotRef.current.targetRotX = -normY * 0.32;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      rotRef.current.targetRotX = 0;
      rotRef.current.targetRotY = 0;
    };

    // On Click: trigger subtle, elegant expanding ripple
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;

      ripplesRef.current.push({
        x: clientX,
        y: clientY,
        radius: 0,
        maxRadius: 280,
        strength: 8,
        alpha: 0.55
      });

      // Subtle, gentle 3D rotation impulse on click
      rotRef.current.spinSpeed = 0.012;

      // Spawn minimal, refined ambient micro-sparks
      const burstColors = ['#e879f9', '#c084fc', '#a855f7', '#818cf8', '#38bdf8', '#3FE0D0'];
      for (let b = 0; b < 6; b++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.0 + 1.5;
        burstsRef.current.push({
          x: clientX,
          y: clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 2.0 + 1.0,
          color: burstColors[Math.floor(Math.random() * burstColors.length)],
          alpha: 0.8,
          life: 0.8
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('pointerdown', handlePointerDown);

    const maxConnectDist = 175;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const nodes = nodesRef.current;
      const nodes3D = nodes3DRef.current;
      const ripples = ripplesRef.current;
      const bursts = burstsRef.current;
      const mouse = mouseRef.current;
      const rot = rotRef.current;

      // Update 3D rotation with natural, smooth inertia & 60fps fluidity
      rot.rotY += rot.spinSpeed;
      rot.cornerSpin += 0.0045;
      rot.rotX += (rot.targetRotX - rot.rotX) * 0.05;
      rot.rotY += (rot.targetRotY - (rot.rotY % (Math.PI * 2))) * 0.02;
      rot.spinSpeed += (0.0035 - rot.spinSpeed) * 0.03;

      const fov = 400;

      // Define 4 corner anchors with ambient glowing auras
      const cornerCenters = {
        topRightSphere: { x: width * 0.88, y: Math.max(height * 0.18, 140), glow: 'rgba(168, 85, 247, 0.22)', radius: 210 },
        topLeftPoly: { x: width * 0.10, y: Math.max(height * 0.22, 160), glow: 'rgba(139, 124, 246, 0.20)', radius: 160 },
        bottomLeftRing: { x: width * 0.11, y: height * 0.82, glow: 'rgba(240, 85, 156, 0.20)', radius: 170 },
        bottomRightLattice: { x: width * 0.89, y: height * 0.82, glow: 'rgba(63, 224, 208, 0.20)', radius: 160 }
      };

      // Draw ambient 3D glowing auras behind the 4 corners
      Object.values(cornerCenters).forEach(c => {
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius * 1.4);
        grad.addColorStop(0, c.glow);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius * 1.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Project & render each 3D node based on its corner group
      const projected3D: { px: number; py: number; scale: number; alpha: number; node: Node3D }[] = [];

      for (let i = 0; i < nodes3D.length; i++) {
        const n = nodes3D[i];
        const center = cornerCenters[n.group];

        // Differentiate rotation for dynamic corner orbital movement
        let angleY = rot.rotY;
        let angleX = rot.rotX;

        if (n.group === 'topLeftPoly') {
          angleY = -rot.cornerSpin * 1.4 + rot.rotY * 0.6;
          angleX = rot.cornerSpin * 0.9;
        } else if (n.group === 'bottomLeftRing') {
          angleY = rot.cornerSpin * 1.1;
          angleX = 0.55 + rot.rotX * 0.45;
        } else if (n.group === 'bottomRightLattice') {
          angleY = -rot.cornerSpin * 0.85;
          angleX = -rot.cornerSpin * 0.6;
        }

        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);

        // 3D rotation around Y axis
        const x1 = n.baseX * cosY - n.baseZ * sinY;
        const z1 = n.baseX * sinY + n.baseZ * cosY;

        // 3D rotation around X axis
        const y2 = n.baseY * cosX - z1 * sinX;
        const z2 = n.baseY * sinX + z1 * cosX;

        // Perspective 3D projection to its corner center
        const scale = fov / (fov + z2 + 100);
        const px = x1 * scale + center.x;
        const py = y2 * scale + center.y;
        const alpha = Math.max(0.25, Math.min(0.95, (z2 + 250) / 380));

        projected3D.push({ px, py, scale, alpha, node: n });
      }

      // Draw 3D wireframe connecting edges per corner group cleanly without GPU stalls
      for (let i = 0; i < projected3D.length; i++) {
        const p1 = projected3D[i];
        for (let j = i + 1; j < projected3D.length; j++) {
          const p2 = projected3D[j];
          if (p1.node.group !== p2.node.group) continue;

          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.hypot(dx, dy);

          const maxEdge = p1.node.group === 'topLeftPoly' ? 140 : p1.node.group === 'topRightSphere' ? 72 : 90;

          if (dist < maxEdge) {
            const edgeAlpha = (1 - dist / maxEdge) * ((p1.alpha + p2.alpha) / 2) * 0.65;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.strokeStyle = p1.node.group === 'topRightSphere'
              ? `rgba(192, 132, 252, ${edgeAlpha})`
              : p1.node.group === 'topLeftPoly'
              ? `rgba(168, 85, 247, ${edgeAlpha})`
              : p1.node.group === 'bottomLeftRing'
              ? `rgba(240, 85, 156, ${edgeAlpha})`
              : `rgba(63, 224, 208, ${edgeAlpha})`;

            ctx.lineWidth = Math.max(1.0, 1.4 * p1.scale);
            ctx.stroke();

            // Render translucent facet triangles for the top-left 3D polyhedron
            if (p1.node.group === 'topLeftPoly' && dist < 85) {
              for (let k = j + 1; k < projected3D.length; k++) {
                const p3 = projected3D[k];
                if (p3.node.group === 'topLeftPoly') {
                  const d13 = Math.hypot(p1.px - p3.px, p1.py - p3.py);
                  const d23 = Math.hypot(p2.px - p3.px, p2.py - p3.py);
                  if (d13 < 85 && d23 < 85) {
                    ctx.beginPath();
                    ctx.moveTo(p1.px, p1.py);
                    ctx.lineTo(p2.px, p2.py);
                    ctx.lineTo(p3.px, p3.py);
                    ctx.closePath();
                    ctx.fillStyle = `rgba(139, 124, 246, ${edgeAlpha * 0.18})`;
                    ctx.fill();
                    break;
                  }
                }
              }
            }
          }
        }

        // Draw 3D vertex node cleanly with dual arc fill
        ctx.beginPath();
        ctx.arc(p1.px, p1.py, p1.node.radius * p1.scale * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 132, 252, ${p1.alpha * 0.28})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p1.px, p1.py, p1.node.radius * p1.scale, 0, Math.PI * 2);
        ctx.fillStyle = p1.node.color;
        ctx.fill();
      }

      // Update & Draw Click Ripples with smooth minimal dissipation
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.radius += 5.5;
        rip.alpha *= 0.95;

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(192, 132, 252, ${rip.alpha * 0.55})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Push 2D nodes near ripple wavefront with gentle momentum
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const dx = n.x - rip.x;
          const dy = n.y - rip.y;
          const dist = Math.hypot(dx, dy);
          const diff = Math.abs(dist - rip.radius);

          if (diff < 35 && dist > 1) {
            const force = (1 - diff / 35) * rip.strength * (rip.alpha / 0.6);
            n.vx += (dx / dist) * force * 0.2;
            n.vy += (dy / dist) * force * 0.2;
          }
        }

        if (rip.radius >= rip.maxRadius || rip.alpha <= 0.02) {
          ripples.splice(r, 1);
        }
      }

      // Update & Draw Click Burst Sparks
      for (let b = bursts.length - 1; b >= 0; b--) {
        const spark = bursts[b];
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vx *= 0.96;
        spark.vy *= 0.96;
        spark.alpha *= 0.94;
        spark.life -= 0.025;

        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
        ctx.fillStyle = spark.color;
        ctx.fill();

        if (spark.life <= 0 || spark.alpha <= 0.02) {
          bursts.splice(b, 1);
        }
      }

      // Update 2D Nodes Physics with Serene, Silky Drift
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        n.vx *= 0.992;
        n.vy *= 0.992;

        const speed = Math.hypot(n.vx, n.vy);
        if (speed < 0.15) {
          n.vx += (Math.random() - 0.5) * 0.015;
          n.vy += (Math.random() - 0.5) * 0.015;
        }

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;
      }

      // Draw 2D Plexus Connections with minimal, clean lines
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxConnectDist) {
            const alpha = (1 - dist / maxConnectDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();

            if (dist < 65) {
              for (let k = j + 1; k < nodes.length; k++) {
                const n3 = nodes[k];
                const d13 = Math.hypot(n1.x - n3.x, n1.y - n3.y);
                const d23 = Math.hypot(n2.x - n3.x, n2.y - n3.y);
                if (d13 < 65 && d23 < 65) {
                  ctx.beginPath();
                  ctx.moveTo(n1.x, n1.y);
                  ctx.lineTo(n2.x, n2.y);
                  ctx.lineTo(n3.x, n3.y);
                  ctx.closePath();
                  ctx.fillStyle = `rgba(147, 51, 234, ${alpha * 0.08})`;
                  ctx.fill();
                  break;
                }
              }
            }
          }
        }

        if (mouse.active) {
          const mDist = Math.hypot(n1.x - mouse.x, n1.y - mouse.y);
          if (mDist < 120) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(192, 132, 252, ${(1 - mDist / 120) * 0.22})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
        ctx.fillStyle = n1.color;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [initNodes]);

  return (
    <div className="interactive-plexus-container" aria-hidden="true">
      <canvas ref={canvasRef} className="plexus-canvas" />
    </div>
  );
};

/* ==========================================================================
   LANDING PAGE COMPONENT
   ========================================================================== */
const DevTrackLanding: React.FC<{ onNavigateToDashboard?: () => void }> = ({ onNavigateToDashboard }) => {
  const { user, isAuthenticated, loginWithGithub } = useAuth();

  const handleConnectGithubClick = () => {
    if (isAuthenticated) {
      if (onNavigateToDashboard) {
        onNavigateToDashboard();
      } else {
        window.history.pushState({}, '', '/dashboard');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } else {
      loginWithGithub();
    }
  };

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Section in-view observers
  const [heroRef, heroInView] = useInView({ threshold: 0.1 });
  const [dashMockRef, dashMockInView] = useInView({ threshold: 0.1 });
  const [howRef, howInView] = useInView({ threshold: 0.1 });
  const [featRef, featInView] = useInView({ threshold: 0.1 });
  const [showcaseRef, showcaseInView] = useInView({ threshold: 0.1 });
  const [analyticsRef, analyticsInView] = useInView({ threshold: 0.1 });
  const [insightsRef, insightsInView] = useInView({ threshold: 0.1 });
  const [pipelineRef, pipelineInView] = useInView({ threshold: 0.1 });
  const [profileRef, profileInView] = useInView({ threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ threshold: 0.1 });

  // Count ups
  const heroRepos = useCountUp(42, 1400, heroInView);
  const heroCommits = useCountUp(1842, 1800, heroInView);
  const heroPRs = useCountUp(86, 1500, heroInView);

  const dashRepos = useCountUp(42, 1400, dashMockInView);
  const dashCommits = useCountUp(1842, 1800, dashMockInView);
  const dashPRs = useCountUp(86, 1500, dashMockInView);
  const dashIssues = useCountUp(14, 1200, dashMockInView);

  const showcaseTabs = [
    {
      title: 'Repository Analytics',
      desc: 'Multi-repo tracking across personal and organization workspaces.',
      icon: <FolderGit2 size={17} />
    },
    {
      title: 'Commit History',
      desc: 'Deep chronological breakdown of velocity, additions, and deletions.',
      icon: <GitCommit size={17} />
    },
    {
      title: 'Contribution Activity',
      desc: 'Interactive 52-week heatmap highlighting circadian flow streaks.',
      icon: <Activity size={17} />
    },
    {
      title: 'Language Distribution',
      desc: 'Byte-accurate polyglot stack trajectory and technology evolution.',
      icon: <Code2 size={17} />
    },
    {
      title: 'Developer Persona',
      desc: 'Synthesized overview of velocity and architectural strengths.',
      icon: <Layers size={17} />
    }
  ];

  const [activePipelineStage, setActivePipelineStage] = useState<number>(0);
  const [isSimulatingPipeline, setIsSimulatingPipeline] = useState<boolean>(false);
  const [pipelineSimProgress, setPipelineSimProgress] = useState<number>(0);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [simUsername, setSimUsername] = useState<string>('alex-dev');
  const [connectModalStage, setConnectModalStage] = useState<'idle' | 'auth' | 'indexing' | 'synthesis' | 'ready'>('idle');
  const [simProgress, setSimProgress] = useState<number>(0);

  const pipelineStages = [
    {
      id: 0,
      title: 'GitHub OAuth 2.0 Auth',
      desc: 'Read-only token authorization with 0% source code exposure.',
      icon: <Github size={18} />,
      tag: 'AUTH_OK',
      color: '#8B7CF6',
      endpoint: 'https://api.github.com/user',
      query: `query VerifyIdentity {\n  viewer {\n    login: "${simUsername}"\n    publicRepos: 42\n    createdAt: "2021-03-14T08:00:00Z"\n  }\n}`,
      payload: `{ "status": 200, "authenticated": true, "scopes": ["read:user", "read:org"], "privacy_guarantee": "ZERO_CODE_READ" }`
    },
    {
      id: 1,
      title: 'GraphQL API Ingestion',
      desc: 'High-frequency telemetry stream fetching commit SHAs & review timestamps.',
      icon: <Zap size={18} />,
      tag: 'API_v4',
      color: '#3FE0D0',
      endpoint: 'https://api.github.com/graphql',
      query: `query FetchActivity {\n  viewer {\n    contributionsCollection {\n      totalCommitContributions: 1842\n      restrictedContributionsCount: 348\n    }\n  }\n}`,
      payload: `{ "ingested_events": 2840, "batch_latency": "14ms", "rate_limit_remaining": 4982 }`
    },
    {
      id: 2,
      title: 'DevTrack Synthesis Engine',
      desc: 'Deterministic pattern mapping & circadian focus curve computation.',
      icon: <Layers size={18} />,
      tag: 'ENGINE',
      color: '#F0559C',
      endpoint: 'internal://devtrack.engine/synthesize',
      query: `SYNTHESIZE {\n  window: "52_WEEKS",\n  deep_work_interval: "10:00-14:00 UTC",\n  code_review_turnaround: "1.8h"\n}`,
      payload: `{ "circadian_score": 98.4, "velocity_index": "TOP_5_PERCENT", "focus_streak": 12 }`
    },
    {
      id: 3,
      title: 'Multi-Repo Event Stream',
      desc: 'Consolidated commit activity indexed across active projects.',
      icon: <FolderGit2 size={18} />,
      tag: 'STREAM',
      color: '#5B8DEF',
      endpoint: 'internal://devtrack.stream/repos',
      query: `GET /repos/active_breakdown?user=${simUsername}`,
      payload: `[\n  { "repo": "backend-api", "commits": 348, "health": "100%" },\n  { "repo": "devtrack-web", "commits": 284, "health": "100%" },\n  { "repo": "infra-k8s", "commits": 122, "health": "100%" }\n]`
    },
    {
      id: 4,
      title: 'Developer Cockpit & Passport',
      desc: 'Live telemetry cards, review velocity benchmarks, and skill matrix.',
      icon: <Sparkles size={18} />,
      tag: 'DASHBOARD',
      color: '#FFB454',
      endpoint: 'https://devtrack.app/dashboard/@' + simUsername,
      query: `RENDER_DASHBOARD {\n  persona: "Staff Frontend Architect",\n  languages: ["TypeScript 54%", "Python 25%", "Rust 14%"]\n}`,
      payload: `{ "telemetry_ready": true, "profile_url": "devtrack.app/@${simUsername}", "sync_cadence": "REALTIME" }`
    }
  ];

  const runPipelineSimulation = () => {
    if (isSimulatingPipeline) return;
    setIsSimulatingPipeline(true);
    setPipelineSimProgress(0);
    setActivePipelineStage(0);

    const stages = [0, 1, 2, 3, 4];
    stages.forEach((stage, idx) => {
      setTimeout(() => {
        setActivePipelineStage(stage);
        setPipelineSimProgress(((idx + 1) / stages.length) * 100);
        if (idx === stages.length - 1) {
          setTimeout(() => {
            setIsSimulatingPipeline(false);
          }, 800);
        }
      }, idx * 1100);
    });
  };

  const handleSimulateConnect = (usernameToUse?: string) => {
    const uname = usernameToUse || simUsername || 'alex-dev';
    setSimUsername(uname);
    setConnectModalStage('auth');
    setSimProgress(20);

    setTimeout(() => {
      setConnectModalStage('indexing');
      setSimProgress(55);
    }, 900);

    setTimeout(() => {
      setConnectModalStage('synthesis');
      setSimProgress(85);
    }, 2000);

    setTimeout(() => {
      setConnectModalStage('ready');
      setSimProgress(100);
    }, 3100);
  };

  return (
    <div className="devtrack-root">
      {/* Background Interactive Plexus Layer */}
      <InteractivePlexusBackground />

      <style>{`
        /* ==========================================================================
           DESIGN TOKENS & ELEVATED TYPOGRAPHY (Outfit / Space Grotesk / Plus Jakarta)
           ========================================================================== */
        :root {
          --bg: #070A12;
          --bg-secondary: #0B0F19;
          --card: #101524;
          --card-hover: #161D31;
          --border: #1E2638;
          --border-subtle: rgba(255, 255, 255, 0.06);

          --violet: #8B7CF6;
          --violet-light: #A78BFA;
          --blue: #5B8DEF;
          --pink: #F0559C;
          --cyan: #3FE0D0;
          --amber: #FFB454;

          --text: #EDEEF3;
          --text-secondary: #B4BCCF;
          --muted: #7E889E;

          --font-heading: 'Outfit', 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-body: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-mono: 'JetBrains Mono', monospace;

          --max-width: 1280px;
          --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Reset & Base */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
          background-color: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
        }

        body {
          background-color: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          font-weight: 350;
          line-height: 1.65;
          letter-spacing: -0.008em;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          overflow-x: hidden;
        }

        /* Refined Typography (Space Grotesk & Outfit headings, strictly max font-weight 500) */
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-heading);
          font-weight: 400;
          color: #ffffff;
          letter-spacing: -0.028em;
          line-height: 1.2;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        p {
          font-family: var(--font-body);
          font-weight: 350;
          color: var(--text-secondary);
          max-width: 76ch;
          line-height: 1.68;
        }

        .mono {
          font-family: var(--font-mono);
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        /* ==========================================================================
           3D PERSPECTIVE & INTERACTION SYSTEM
           ========================================================================== */
        .tilt-card-3d {
          position: relative;
          transform-style: preserve-3d;
          perspective: 1100px;
          will-change: transform;
        }

        .tilt-card-inner-3d {
          transform-style: preserve-3d;
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
        }

        .tilt-card-glare {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 4;
          mix-blend-mode: screen;
          transition: opacity 0.3s ease;
        }

        /* 3D Parallax Depth Layers */
        .layer-3d-deep {
          transform: translateZ(52px);
          transform-style: preserve-3d;
        }

        .layer-3d-float {
          transform: translateZ(36px);
          transform-style: preserve-3d;
        }

        .layer-3d-badge {
          transform: translateZ(44px);
          transform-style: preserve-3d;
        }

        .layer-3d-text {
          transform: translateZ(20px);
          transform-style: preserve-3d;
        }

        /* 3D Interactive Heatmap Cells */
        .mini-cell:hover,
        .cal-cell:hover,
        .heatmap-matrix-cell:hover {
          transform: scale(1.35) translateZ(12px) !important;
          box-shadow: 0 0 12px #8B7CF6, 0 0 20px rgba(139, 124, 246, 0.65) !important;
          z-index: 10;
          cursor: pointer;
        }

        .mini-cell,
        .cal-cell,
        .heatmap-matrix-cell {
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease, background-color 0.15s ease;
          position: relative;
        }

        /* Gradient text shimmer */
        .shimmer-text {
          background: linear-gradient(90deg, #8B7CF6 0%, #3FE0D0 50%, #F0559C 100%, #8B7CF6 150%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textShimmer 5s linear infinite;
        }

        @keyframes textShimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        /* Buttons */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #8B7CF6 0%, #7C3AED 100%);
          color: #ffffff;
          font-family: var(--font-heading);
          font-weight: 500;
          font-size: 0.94rem;
          padding: 11px 22px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.25s var(--ease-out);
          box-shadow: 0 4px 16px rgba(139, 124, 246, 0.35);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 26px rgba(139, 124, 246, 0.55), 0 0 16px rgba(240, 85, 156, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text);
          font-family: var(--font-heading);
          font-weight: 400;
          font-size: 0.94rem;
          padding: 11px 22px;
          border-radius: 8px;
          border: 1px solid var(--border);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--violet);
          color: #ffffff;
        }

        /* Layout Container */
        .container {
          width: 100%;
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 28px;
          position: relative;
          z-index: 2;
        }

        .section-wrap {
          padding: 100px 0;
          position: relative;
        }

        @media (max-width: 768px) {
          .section-wrap {
            padding: 64px 0;
          }
        }

        .section-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .section-header h2 {
          font-size: 2.4rem;
          margin-bottom: 14px;
        }

        .section-header p {
          font-size: 1.05rem;
          margin: 0 auto;
        }

        /* Interactive Plexus Layer */
        .interactive-plexus-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.72;
          overflow: hidden;
        }

        .plexus-canvas {
          width: 100vw;
          height: 100vh;
        }

        /* Screen-blended photo assets */
        .screen-blend-asset {
          mix-blend-mode: screen;
          pointer-events: none;
          user-select: none;
        }

        /* ==========================================================================
           1. FIXED NAVBAR (Clean, Symmetrical, No Text Wrapping)
           ========================================================================== */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 88px;
          z-index: 100;
          transition: all 0.3s ease;
        }

        .navbar.scrolled {
          background: rgba(7, 10, 18, 0.95);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-bottom: 1px solid var(--border);
          height: 76px;
        }

        .navbar .nav-inner {
          width: 100%;
          max-width: 1560px;
          padding: 0 48px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          gap: 32px;
        }

        @media (max-width: 768px) {
          .navbar .nav-inner {
            padding: 0 20px;
          }
        }

        .brand-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text);
          cursor: pointer;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .devtrack-logo-img {
          height: 38px;
          width: auto;
          max-width: 180px;
          object-fit: contain;
          filter: drop-shadow(0 0 16px rgba(168, 85, 247, 0.4));
          transition: transform 0.25s ease, filter 0.25s ease;
          display: block;
        }

        .brand-link:hover .devtrack-logo-img {
          transform: scale(1.05);
          filter: drop-shadow(0 0 24px rgba(168, 85, 247, 0.7));
        }

        .nav-links-center {
          display: flex;
          align-items: center;
          gap: 32px;
          flex-shrink: 0;
        }

        .nav-links-center a {
          color: var(--muted);
          text-decoration: none;
          font-size: 0.98rem;
          font-family: var(--font-body);
          font-weight: 400;
          transition: color 0.2s ease, transform 0.2s ease;
          position: relative;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
        }

        .nav-links-center a:hover {
          color: #ffffff;
          transform: translateY(-1px);
        }

        .nav-links-center a:hover::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #8B7CF6;
          border-radius: 2px;
          box-shadow: 0 0 8px #8B7CF6;
        }

        .nav-right-btn {
          flex-shrink: 0;
        }

        .nav-right-btn .btn-primary {
          padding: 11px 22px;
          font-size: 0.94rem;
          white-space: nowrap;
        }

        .mobile-hamburger-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
        }

        .mobile-menu-drawer {
          position: fixed;
          top: 88px;
          left: 0;
          width: 100%;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          z-index: 99;
        }

        @media (max-width: 900px) {
          .nav-links-center { display: none; }
          .nav-right-btn { display: none; }
          .mobile-hamburger-btn { display: block; }
        }

        /* ==========================================================================
           2. HERO SECTION & 3D INTERACTIVE ELEMENTS
           ========================================================================== */
        .hero-section {
          min-height: 92vh;
          padding-top: 145px;
          padding-bottom: 75px;
          display: flex;
          align-items: center;
          position: relative;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 52px;
          align-items: center;
        }

        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
        }

        .hero-left {
          position: relative;
          z-index: 2;
        }

        .hero-headline {
          font-size: 3.9rem;
          line-height: 1.12;
          margin-bottom: 22px;
          letter-spacing: -0.03em;
        }

        @media (max-width: 640px) {
          .hero-headline { font-size: 2.5rem; }
        }

        .hero-desc {
          font-size: 1.12rem;
          color: var(--text-secondary);
          margin-bottom: 32px;
          line-height: 1.65;
        }

        .hero-cta-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 960px) {
          .hero-cta-row {
            justify-content: center;
          }
        }

        @media (max-width: 500px) {
          .hero-cta-row {
            flex-direction: column;
            width: 100%;
          }
          .hero-cta-row .btn-primary,
          .hero-cta-row .btn-secondary {
            width: 100%;
          }
        }

        .hero-reassurance {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: var(--muted);
        }

        @media (max-width: 960px) {
          .hero-reassurance {
            justify-content: center;
          }
        }

        /* Hero Right: Floating Preview Card */
        .hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 440px;
          z-index: 2;
        }

        @keyframes floatSlow {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-18px) rotate(1.5deg); }
        }

        /* Floating Miniature Dashboard Card */
        .mini-dash-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 420px;
          background: rgba(16, 21, 36, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 124, 246, 0.28);
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 124, 246, 0.12);
          transition: transform 0.2s ease;
        }

        .mini-dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .mini-dash-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mini-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1.5px solid var(--violet);
        }

        .mini-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .mini-stat-tile {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }

        .mini-stat-num {
          font-size: 1.25rem;
          color: var(--violet-light);
          margin-bottom: 2px;
        }

        .mini-stat-lbl {
          font-size: 0.7rem;
          color: var(--muted);
          text-transform: uppercase;
        }

        .mini-heatmap {
          margin-bottom: 14px;
        }

        .mini-heatmap-label {
          font-size: 0.72rem;
          color: var(--muted);
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
        }

        .mini-heatmap-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 3px;
        }

        .mini-cell {
          height: 12px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.04);
        }

        .mini-lang-bar {
          display: flex;
          height: 4px;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .mini-lang-legend {
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          color: var(--muted);
        }

        /* Hero Floating Chips */
        .floating-chip {
          position: absolute;
          z-index: 5;
          background: rgba(16, 21, 36, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(139, 124, 246, 0.3);
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 0.78rem;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(139, 124, 246, 0.2);
          pointer-events: none;
        }

        .chip-top-left {
          top: -16px;
          left: -20px;
          animation: floatSlow 4s infinite alternate ease-in-out;
        }

        .chip-bottom-right {
          bottom: -18px;
          right: -14px;
          animation: floatSlow 5s infinite alternate-reverse ease-in-out;
        }

        .chip-mid-left {
          bottom: 24px;
          left: -40px;
          animation: floatSlow 4.5s 1s infinite alternate ease-in-out;
        }

        .chip-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        /* ==========================================================================
           9. INTERACTIVE GITHUB PIPELINE STUDIO
           ========================================================================== */
        .pipeline-studio-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .pipeline-studio-grid {
            grid-template-columns: 1fr;
          }
        }

        .pipeline-nodes-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }

        .pipeline-node-interactive {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .pipeline-node-interactive:hover {
          border-color: rgba(139, 124, 246, 0.45);
          background: rgba(139, 124, 246, 0.06);
          transform: translateX(4px);
        }

        .pipeline-node-interactive.active {
          background: rgba(139, 124, 246, 0.14);
          border-color: #8B7CF6;
          box-shadow: 0 0 24px rgba(139, 124, 246, 0.25);
        }

        .pipeline-left-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pipeline-node-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
        }

        .pipeline-connector-line {
          width: 2px;
          height: 14px;
          margin: 0 auto;
          background: linear-gradient(180deg, var(--violet) 0%, rgba(139, 124, 246, 0.2) 100%);
        }

        .payload-terminal-box {
          background: rgba(9, 13, 24, 0.92);
          border: 1px solid rgba(139, 124, 246, 0.35);
          border-radius: 14px;
          padding: 24px;
          font-family: var(--font-mono);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
          position: relative;
        }

        .payload-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .payload-code-pre {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 8px;
          padding: 14px;
          font-size: 0.8rem;
          color: #3FE0D0;
          line-height: 1.6;
          overflow-x: auto;
          margin-bottom: 18px;
        }

        /* ==========================================================================
           INTERACTIVE CONNECT GITHUB MODAL
           ========================================================================== */
        .connect-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(3, 5, 12, 0.82);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.3s ease;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .connect-modal-card {
          width: 100%;
          max-width: 540px;
          background: rgba(16, 21, 38, 0.95);
          border: 1px solid rgba(139, 124, 246, 0.4);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(139, 124, 246, 0.2);
          position: relative;
        }

        .modal-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border);
          color: var(--muted);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
        }

        .username-pill-btn {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          padding: 5px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 16px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .username-pill-btn:hover,
        .username-pill-btn.active {
          background: rgba(139, 124, 246, 0.18);
          border-color: var(--violet);
          color: #ffffff;
        }

        /* ==========================================================================
           2. HERO SECTION
           ========================================================================== */
        .hero-section {
          min-height: 90vh;
          padding-top: 145px;
          padding-bottom: 70px;
          display: flex;
          align-items: center;
          position: relative;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }

        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
        }

        .hero-left {
          position: relative;
          z-index: 2;
        }

        .hero-headline {
          font-size: 3.8rem;
          line-height: 1.14;
          margin-bottom: 22px;
          letter-spacing: -0.03em;
        }

        @media (max-width: 640px) {
          .hero-headline { font-size: 2.5rem; }
        }

        .hero-desc {
          font-size: 1.12rem;
          color: var(--text-secondary);
          margin-bottom: 32px;
          line-height: 1.65;
        }

        .hero-cta-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 960px) {
          .hero-cta-row {
            justify-content: center;
          }
        }

        @media (max-width: 500px) {
          .hero-cta-row {
            flex-direction: column;
            width: 100%;
          }
          .hero-cta-row .btn-primary,
          .hero-cta-row .btn-secondary {
            width: 100%;
          }
        }

        .hero-reassurance {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: var(--muted);
        }

        @media (max-width: 960px) {
          .hero-reassurance {
            justify-content: center;
          }
        }

        /* Hero Right: Floating Preview Card */
        .hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 440px;
          z-index: 2;
        }

        @keyframes floatSlow {
          0% { transform: translateY(0); }
          100% { transform: translateY(-12px); }
        }

        /* Floating Miniature Dashboard Card */
        .mini-dash-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 420px;
          background: rgba(14, 18, 32, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 124, 246, 0.28);
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 124, 246, 0.12);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .mini-dash-card:hover {
          border-color: rgba(63, 224, 208, 0.45);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(63, 224, 208, 0.15);
        }

        .mini-dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .mini-dash-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mini-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1.5px solid var(--violet);
          box-shadow: 0 0 8px rgba(139, 124, 246, 0.3);
        }

        .mini-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .mini-stat-tile {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 8px;
          text-align: center;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }

        .mini-stat-tile:hover {
          transform: translateY(-2px);
          border-color: rgba(168, 85, 247, 0.35);
        }

        .mini-stat-num {
          font-size: 1.28rem;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .mini-stat-lbl {
          font-size: 0.68rem;
          color: var(--muted);
          text-transform: uppercase;
        }

        /* Mini Contribution Grid */
        .mini-heatmap {
          margin-bottom: 16px;
        }

        .mini-heatmap-label {
          font-size: 0.72rem;
          color: var(--muted);
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
        }

        .mini-heatmap-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 3px;
        }

        .mini-cell {
          height: 12px;
          border-radius: 2px;
        }

        /* Mini Language Bar */
        .mini-lang-bar {
          display: flex;
          height: 5px;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .mini-lang-legend {
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          color: var(--muted);
        }

        /* Floating Chips */
        .floating-chip {
          position: absolute;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(14, 18, 34, 0.92);
          border: 1px solid rgba(139, 124, 246, 0.25);
          padding: 7px 13px;
          border-radius: 20px;
          font-size: 0.76rem;
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 5;
          pointer-events: none;
        }

        .chip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .chip-top-left {
          top: -16px;
          left: -20px;
          animation: floatSlow 4s infinite alternate ease-in-out;
        }

        .chip-bottom-right {
          bottom: -18px;
          right: -16px;
          animation: floatSlow 4.8s infinite alternate-reverse ease-in-out;
        }

        .chip-mid-left {
          bottom: 26px;
          left: -36px;
          animation: floatSlow 4.4s 0.8s infinite alternate ease-in-out;
        }

        @media (max-width: 640px) {
          .floating-chip { display: none; }
        }

        .scroll-cue {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--muted);
          text-decoration: none;
          margin-top: 40px;
          animation: bobDown 2.5s infinite ease-in-out;
        }

        @keyframes bobDown {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(6px); opacity: 1; }
        }

        /* ==========================================================================
           3. DASHBOARD MOCKUP SECTION
           ========================================================================== */
        .dashboard-showcase-frame {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(139, 124, 246, 0.08);
        }

        .dash-window-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: #090D18;
          border-bottom: 1px solid var(--border);
        }

        .window-dots {
          display: flex;
          gap: 6px;
        }

        .window-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .dash-body-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          min-height: 480px;
        }

        @media (max-width: 860px) {
          .dash-body-layout {
            grid-template-columns: 1fr;
          }
          .dash-sidebar {
            display: none;
          }
        }

        .dash-sidebar {
          background: rgba(9, 13, 24, 0.7);
          border-right: 1px solid var(--border);
          padding: 18px 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .dash-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          font-size: 0.84rem;
          color: var(--muted);
          border-radius: 6px;
          margin-bottom: 4px;
        }

        .dash-nav-item.active {
          background: rgba(139, 124, 246, 0.12);
          color: var(--violet-light);
          border: 1px solid rgba(139, 124, 246, 0.25);
        }

        .dash-content-area {
          padding: 24px;
        }

        .dash-welcome-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .dash-stat-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .dash-stat-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .dash-stat-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px;
        }

        .dash-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.78rem;
          color: var(--muted);
          margin-bottom: 6px;
        }

        .dash-stat-figure {
          font-size: 1.6rem;
          color: #ffffff;
        }

        .dash-heatmap-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 24px;
        }

        .heatmap-matrix-scroll {
          overflow-x: auto;
          padding: 8px 0;
        }

        .heatmap-matrix {
          display: flex;
          gap: 4px;
        }

        .heatmap-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .heatmap-matrix-cell {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .dash-split-panels {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .dash-split-panels {
            grid-template-columns: 1fr;
          }
        }

        .dash-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px;
        }

        .dash-panel-title {
          font-size: 0.95rem;
          margin-bottom: 14px;
          color: #ffffff;
        }

        .repo-rank-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          font-size: 0.84rem;
        }

        .repo-rank-item:last-child {
          border-bottom: none;
        }

        /* ==========================================================================
           4. HOW IT WORKS
           ========================================================================== */
        .how-it-works-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          position: relative;
        }

        @media (max-width: 860px) {
          .how-it-works-grid {
            grid-template-columns: 1fr;
          }
        }

        .step-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px 24px;
          position: relative;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }

        .step-card:hover {
          transform: translateY(-2px);
          border-color: rgba(139, 124, 246, 0.4);
        }

        .step-num-tag {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--violet);
          margin-bottom: 12px;
        }

        .step-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(139, 124, 246, 0.1);
          border: 1px solid rgba(139, 124, 246, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--violet-light);
          margin-bottom: 16px;
        }

        .step-title {
          font-size: 1.25rem;
          margin-bottom: 8px;
          color: #ffffff;
        }

        .step-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        /* ==========================================================================
           5. FEATURES (6 CARDS WITH ROTATING ACCENTS)
           ========================================================================== */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        @media (max-width: 960px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }

        .feature-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 26px;
          display: flex;
          flex-direction: column;
          transition: all 0.25s var(--ease-out);
        }

        .feature-card:hover {
          transform: translateY(-3px);
          border-color: rgba(139, 124, 246, 0.4);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 124, 246, 0.12);
        }

        .feature-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          transition: transform 0.2s ease;
        }

        .feature-card:hover .feature-icon-box {
          transform: scale(1.08) rotate(3deg);
        }

        .feature-title {
          font-size: 1.15rem;
          margin-bottom: 8px;
          color: #ffffff;
        }

        .feature-desc {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* ==========================================================================
           6. INTERACTIVE SHOWCASE
           ========================================================================== */
        .showcase-layout {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 28px;
          align-items: stretch;
        }

        @media (max-width: 860px) {
          .showcase-layout {
            grid-template-columns: 1fr;
          }
        }

        .showcase-nav-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .showcase-tab-btn {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 18px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }

        .showcase-tab-btn.active {
          background: rgba(139, 124, 246, 0.12);
          border-color: rgba(139, 124, 246, 0.5);
          box-shadow: 0 0 20px rgba(139, 124, 246, 0.15);
        }

        .showcase-tab-btn:hover:not(.active) {
          background: var(--card-hover);
        }

        .showcase-preview-panel {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* ==========================================================================
           7. ANALYTICS SHOWCASE
           ========================================================================== */
        .analytics-3col-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        @media (max-width: 900px) {
          .analytics-3col-grid {
            grid-template-columns: 1fr;
          }
        }

        .analytics-panel-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px;
        }

        .analytics-card-title {
          font-size: 1.05rem;
          color: #ffffff;
          margin-bottom: 16px;
        }

        /* ==========================================================================
           8. DEVELOPER INSIGHTS
           ========================================================================== */
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        @media (max-width: 860px) {
          .insights-grid {
            grid-template-columns: 1fr;
          }
        }

        .insight-card {
          background: linear-gradient(180deg, rgba(139, 124, 246, 0.08) 0%, rgba(17, 22, 37, 0.95) 100%);
          border: 1px solid rgba(139, 124, 246, 0.22);
          border-radius: 14px;
          padding: 26px;
        }

        .insight-icon {
          color: var(--violet-light);
          margin-bottom: 14px;
        }

        .insight-title {
          font-size: 1.15rem;
          margin-bottom: 8px;
          color: #ffffff;
        }

        /* ==========================================================================
           9. INTERACTIVE GITHUB PIPELINE & TELEMETRY STUDIO
           ========================================================================== */
        .pipeline-studio-wrap {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 28px;
          align-items: stretch;
          margin-top: 10px;
        }

        @media (max-width: 960px) {
          .pipeline-studio-wrap {
            grid-template-columns: 1fr;
          }
        }

        .pipeline-stage-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pipeline-stage-card {
          background: rgba(14, 18, 32, 0.75);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.22s var(--ease-out);
          display: flex;
          align-items: flex-start;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }

        .pipeline-stage-card:hover {
          border-color: rgba(139, 124, 246, 0.45);
          background: rgba(22, 28, 48, 0.85);
          transform: translateX(4px);
        }

        .pipeline-stage-card.active {
          border-color: var(--violet);
          background: rgba(139, 124, 246, 0.12);
          box-shadow: 0 0 24px rgba(139, 124, 246, 0.18), inset 0 0 12px rgba(139, 124, 246, 0.08);
        }

        .pipeline-stage-card.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3.5px;
          background: linear-gradient(180deg, #8B7CF6 0%, #3FE0D0 100%);
        }

        .pipeline-stage-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .pipeline-stage-card:hover .pipeline-stage-icon-wrap {
          transform: scale(1.08);
        }

        .pipeline-stage-tag {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pipeline-terminal-window {
          background: #080B14;
          border: 1px solid rgba(139, 124, 246, 0.3);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(139, 124, 246, 0.1);
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 440px;
        }

        .pipeline-terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: #0D1220;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .pipeline-terminal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }

        .pipeline-code-block {
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 14px;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: #3FE0D0;
          line-height: 1.55;
          overflow-x: auto;
          white-space: pre-wrap;
        }

        .pipeline-sim-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .pipeline-sim-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8B7CF6, #3FE0D0, #F0559C);
          transition: width 0.3s ease;
        }

        /* ==========================================================================
           INTERACTIVE CONNECT GITHUB MODAL
           ========================================================================== */
        .connect-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(4, 7, 14, 0.82);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.25s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        .connect-modal-dialog {
          background: #0B0F1C;
          border: 1px solid rgba(139, 124, 246, 0.4);
          border-radius: 18px;
          width: 100%;
          max-width: 520px;
          padding: 28px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(139, 124, 246, 0.2);
          position: relative;
        }

        .connect-modal-close {
          position: absolute;
          top: 18px;
          right: 18px;
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .connect-modal-close:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        /* ==========================================================================
           10. DEVELOPER PROFILE PREVIEW
           ========================================================================== */
        .profile-preview-card {
          max-width: 580px;
          margin: 0 auto;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }

        .profile-avatar-row {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 22px;
        }

        .profile-avatar-ring {
          padding: 3px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F0559C 0%, #8B7CF6 100%);
          display: inline-flex;
        }

        .profile-avatar-img {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid var(--bg);
        }

        .profile-stats-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          margin-bottom: 20px;
        }

        /* ==========================================================================
           11. FINAL CTA SECTION
           ========================================================================== */
        .final-cta-card {
          position: relative;
          background: radial-gradient(circle at 50% 0%, rgba(139, 124, 246, 0.12) 0%, rgba(16, 21, 36, 0.95) 60%, rgba(11, 15, 25, 0.98) 100%);
          border: 1px solid rgba(139, 124, 246, 0.35);
          border-radius: 20px;
          padding: 70px 32px;
          text-align: center;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(139, 124, 246, 0.15), 0 0 40px rgba(139, 124, 246, 0.1);
        }

        .cta-inner-content {
          position: relative;
          z-index: 2;
          max-width: 650px;
          margin: 0 auto;
        }

        .cta-inner-content h2 {
          font-size: 2.6rem;
          margin-bottom: 16px;
        }

        @media (max-width: 640px) {
          .cta-inner-content h2 { font-size: 1.9rem; }
        }

        .cta-inner-content p {
          font-size: 1.1rem;
          margin-bottom: 32px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ==========================================================================
           12. FOOTER
           ========================================================================== */
        .footer {
          background: #04060C;
          border-top: 1px solid var(--border);
          padding: 70px 0 36px 0;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 48px;
        }

        @media (max-width: 860px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
          .footer-brand-col {
            grid-column: span 2;
          }
        }

        @media (max-width: 500px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .footer-brand-col {
            grid-column: span 1;
          }
        }

        .footer-col-title {
          font-family: var(--font-heading);
          font-size: 0.92rem;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-links a {
          color: var(--muted);
          text-decoration: none;
          font-size: 0.86rem;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: var(--violet-light);
        }

        .footer-bottom-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.8rem;
          color: var(--muted);
        }

        /* ==========================================================================
           ANIMATION & TRANSITION UTILITIES
           ========================================================================== */
        .fade-slide-up {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out);
        }

        .fade-slide-up.in-view {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* ====================================================================
          1. FIXED NAVBAR (Enlarged & Prominent with DevTrack Focus)
          ==================================================================== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="brand-link" aria-label="DevTrack Home">
            <img src="/devtrack-logo.png" alt="DevTrack" className="devtrack-logo-img" />
          </a>

          <div className="nav-links-center" style={{ gap: '36px', fontSize: '0.98rem' }}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#analytics">Analytics</a>
            <a href="#pipeline-studio">Pipeline</a>
            <a href="#insights">Insights</a>
          </div>

          <div className="nav-right-btn">
            {isAuthenticated ? (
              <button
                onClick={handleConnectGithubClick}
                className="btn-primary"
                style={{ padding: '9px 18px', fontSize: '0.9rem', gap: '8px' }}
              >
                {user?.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid var(--violet)' }}
                  />
                )}
                <span>Dashboard →</span>
              </button>
            ) : (
              <button
                onClick={handleConnectGithubClick}
                className="btn-primary"
                style={{ padding: '11px 22px', fontSize: '0.94rem' }}
              >
                <Github size={17} />
                <span>Connect GitHub →</span>
              </button>
            )}
          </div>

          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu-drawer">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#analytics" onClick={() => setMobileMenuOpen(false)}>Analytics</a>
            <a href="#pipeline-studio" onClick={() => setMobileMenuOpen(false)}>Pipeline</a>
            <a href="#insights" onClick={() => setMobileMenuOpen(false)}>Insights</a>
            <button
              className="btn-primary"
              onClick={() => { setMobileMenuOpen(false); handleConnectGithubClick(); }}
              style={{ marginTop: '8px', width: '100%' }}
            >
              <Github size={16} />
              <span>{isAuthenticated ? 'Go to Dashboard →' : 'Connect GitHub →'}</span>
            </button>
          </div>
        )}
      </nav>

      {/* ====================================================================
          2. HERO SECTION
          ==================================================================== */}
      <section className="hero-section" ref={heroRef}>
        <div className="container">
          <div className="hero-grid">
            {/* Left Column: Copy & CTAs */}
            <div className={`hero-left fade-slide-up ${heroInView ? 'in-view' : ''}`}>
              <h1 className="hero-headline">
                Track. Analyze. <br />
                <span className="shimmer-text">Grow.</span>
              </h1>

              <p className="hero-desc">
                DevTrack connects seamlessly to your GitHub account to transform raw commit events, pull requests, and repository velocity into clear, actionable engineering insights.
              </p>

              <div className="hero-cta-row">
                <button
                  onClick={handleConnectGithubClick}
                  className="btn-primary"
                  style={{ padding: '13px 26px', fontSize: '0.98rem' }}
                >
                  <Github size={18} />
                  <span>{isAuthenticated ? 'Go to Dashboard →' : 'Connect GitHub →'}</span>
                </button>
                <a href="#pipeline-studio" className="btn-secondary" style={{ padding: '13px 24px', fontSize: '0.98rem' }}>
                  <span>Interactive Pipeline Demo</span>
                </a>
              </div>

              <div className="hero-reassurance">
                <Shield size={14} style={{ color: '#3FE0D0' }} />
                <span>Secure GitHub authentication · No manual data entry</span>
              </div>
            </div>

            {/* Right Column: Floating Miniature Dashboard Card */}
            <div className={`hero-right fade-slide-up ${heroInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.15s' }}>
              {/* Floating Stat Chips */}
              <div className="floating-chip chip-top-left">
                <span className="chip-dot" style={{ background: '#3FE0D0' }} />
                <span className="mono">+34 commits this week</span>
              </div>

              <div className="floating-chip chip-bottom-right">
                <span className="chip-dot" style={{ background: '#FFB454' }} />
                <span className="mono">12 day streak 🔥</span>
              </div>

              <div className="floating-chip chip-mid-left">
                <span className="chip-dot" style={{ background: '#8B7CF6' }} />
                <span className="mono">18 repositories synced</span>
              </div>

              {/* Floating Miniature Dashboard Card with 3D Tilt */}
              <TiltCard3D maxTilt={16} className="mini-dash-3d-wrap" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="mini-dash-card">
                  <div className="mini-dash-header layer-3d-text">
                    <div className="mini-dash-user">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt="Alex Vance"
                        className="mini-avatar"
                      />
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#ffffff' }}>Alex Vance</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }} className="mono">@alex-dev · Staff</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', background: 'rgba(63, 224, 208, 0.12)', color: '#3FE0D0', border: '1px solid rgba(63, 224, 208, 0.3)', borderRadius: '12px' }} className="mono layer-3d-badge">
                      LIVE
                    </span>
                  </div>

                  {/* 3 Stat Tiles with 3D Extrusion */}
                  <div className="mini-stats-grid layer-3d-deep">
                    <div className="mini-stat-tile">
                      <div className="mini-stat-num mono">{heroRepos}</div>
                      <div className="mini-stat-lbl">Repos</div>
                    </div>
                    <div className="mini-stat-tile">
                      <div className="mini-stat-num mono" style={{ color: '#5B8DEF' }}>{heroCommits}</div>
                      <div className="mini-stat-lbl">Commits</div>
                    </div>
                    <div className="mini-stat-tile">
                      <div className="mini-stat-num mono" style={{ color: '#F0559C' }}>{heroPRs}</div>
                      <div className="mini-stat-lbl">PRs</div>
                    </div>
                  </div>

                  {/* Mini Heatmap with 3D hover cells */}
                  <div className="mini-heatmap layer-3d-float">
                    <div className="mini-heatmap-label mono">
                      <span>Activity Heatmap</span>
                      <span style={{ color: '#8B7CF6' }}>98% flow</span>
                    </div>
                    <div className="mini-heatmap-grid">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const op = (Math.sin(i * 0.8) + 1) / 2;
                        return (
                          <div
                            key={i}
                            className="mini-cell"
                            style={{
                              background: op > 0.7 ? '#8B7CF6' : op > 0.4 ? 'rgba(139, 124, 246, 0.5)' : op > 0.15 ? 'rgba(139, 124, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Mini Language Breakdown */}
                  <div className="layer-3d-text">
                    <div className="mini-lang-bar">
                      <div style={{ width: '56%', background: '#8B7CF6' }} />
                      <div style={{ width: '28%', background: '#3FE0D0' }} />
                      <div style={{ width: '16%', background: '#F0559C' }} />
                    </div>
                    <div className="mini-lang-legend mono">
                      <span>TypeScript 56%</span>
                      <span>Python 28%</span>
                      <span>Rust 16%</span>
                    </div>
                  </div>
                </div>
              </TiltCard3D>
            </div>
          </div>

          {/* Bottom Scroll Cue */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <a href="#dashboard-intro" className="scroll-cue">
              <span>Explore DevTrack</span>
              <ChevronDown size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. DASHBOARD INTRODUCTION MOCKUP
          ==================================================================== */}
      <section id="dashboard-intro" className="section-wrap" ref={dashMockRef}>
        <div className="container">
          <div className={`section-header fade-slide-up ${dashMockInView ? 'in-view' : ''}`}>
            <h2>A Comprehensive View of Your Engineering Velocity</h2>
            <p>
              DevTrack aggregates multi-repository events into an intuitive developer control cockpit.
            </p>
          </div>

          <TiltCard3D maxTilt={6} glareColor="rgba(139, 124, 246, 0.15)">
            <div className={`dashboard-showcase-frame fade-slide-up ${dashMockInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.15s' }}>
              {/* Window bar */}
              <div className="dash-window-bar">
                <div className="window-dots">
                  <span className="window-dot" style={{ background: '#EF4444' }} />
                  <span className="window-dot" style={{ background: '#F59E0B' }} />
                  <span className="window-dot" style={{ background: '#10B981' }} />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }} className="mono">
                  devtrack.app/dashboard/@alex-dev
                </div>
                <div style={{ width: '40px' }} />
              </div>

              {/* Dashboard Inner Body */}
              <div className="dash-body-layout">
                {/* Sidebar */}
                <div className="dash-sidebar">
                  <div>
                    <div className="dash-nav-item active">
                      <BarChart3 size={15} />
                      <span>Dashboard</span>
                    </div>
                    <div className="dash-nav-item">
                      <FolderGit2 size={15} />
                      <span>Repositories</span>
                    </div>
                    <div className="dash-nav-item">
                      <Activity size={15} />
                      <span>Activity</span>
                    </div>
                    <div className="dash-nav-item">
                      <TrendingUp size={15} />
                      <span>Analytics</span>
                    </div>
                    <div className="dash-nav-item">
                      <User size={15} />
                      <span>Profile</span>
                    </div>
                  </div>

                  <div className="dash-nav-item" style={{ color: 'var(--muted)', marginTop: 'auto' }}>
                    <span>Logout</span>
                  </div>
                </div>

                {/* Main Panel */}
                <div className="dash-content-area">
                  <div className="dash-welcome-row">
                    <div>
                      <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Welcome back, Alex Vance</h3>
                      <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }} className="mono">Synced 24 seconds ago with GitHub API</span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: '#3FE0D0', background: 'rgba(63, 224, 208, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(63, 224, 208, 0.25)' }} className="mono">
                      ● All Repositories Healthy
                    </span>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="dash-stat-cards">
                    <div className="dash-stat-card layer-3d-badge">
                      <div className="dash-stat-top">
                        <span>Repositories</span>
                        <FolderGit2 size={14} style={{ color: '#8B7CF6' }} />
                      </div>
                      <div className="dash-stat-figure mono" style={{ color: '#8B7CF6' }}>{dashRepos}</div>
                    </div>

                    <div className="dash-stat-card layer-3d-badge">
                      <div className="dash-stat-top">
                        <span>Commits</span>
                        <GitCommit size={14} style={{ color: '#5B8DEF' }} />
                      </div>
                      <div className="dash-stat-figure mono" style={{ color: '#5B8DEF' }}>{dashCommits}</div>
                    </div>

                    <div className="dash-stat-card layer-3d-badge">
                      <div className="dash-stat-top">
                        <span>Pull Requests</span>
                        <GitPullRequest size={14} style={{ color: '#F0559C' }} />
                      </div>
                      <div className="dash-stat-figure mono" style={{ color: '#F0559C' }}>{dashPRs}</div>
                    </div>

                    <div className="dash-stat-card layer-3d-badge">
                      <div className="dash-stat-top">
                        <span>Issues</span>
                        <AlertCircle size={14} style={{ color: '#3FE0D0' }} />
                      </div>
                      <div className="dash-stat-figure mono" style={{ color: '#3FE0D0' }}>{dashIssues}</div>
                    </div>
                  </div>

                  {/* Contribution Heatmap Grid */}
                  <div className="dash-heatmap-card layer-3d-text">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.86rem' }}>
                      <span style={{ color: '#ffffff' }}>Contribution Activity (Past 32 Weeks)</span>
                      <span className="mono" style={{ color: 'var(--muted)', fontSize: '0.76rem' }}>1,842 contributions in 2026</span>
                    </div>

                    <div className="heatmap-matrix-scroll">
                      <div className="heatmap-matrix">
                        {Array.from({ length: 32 }).map((_, w) => (
                          <div key={w} className="heatmap-col">
                            {Array.from({ length: 7 }).map((_, d) => {
                              const val = (Math.sin(w * 0.45 + d * 0.85) + 1) / 2;
                              const bg = val > 0.8 ? '#8B7CF6' : val > 0.55 ? 'rgba(139, 124, 246, 0.65)' : val > 0.3 ? 'rgba(139, 124, 246, 0.35)' : val > 0.12 ? 'rgba(139, 124, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)';
                              return <div key={d} className="heatmap-matrix-cell" style={{ background: bg }} title={`Week ${w+1}, Day ${d+1}: ${Math.floor(val * 14)} events`} />;
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Split: Languages & Top Repos */}
                  <div className="dash-split-panels">
                    {/* Top Languages */}
                    <div className="dash-panel layer-3d-text">
                      <div className="dash-panel-title">Top Languages</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                            <span>TypeScript</span>
                            <span className="mono">54.2%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ width: '54.2%', height: '100%', background: '#8B7CF6', borderRadius: '2px' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                            <span>Python</span>
                            <span className="mono">24.6%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ width: '24.6%', height: '100%', background: '#3FE0D0', borderRadius: '2px' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                            <span>Rust</span>
                            <span className="mono">14.1%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ width: '14.1%', height: '100%', background: '#F0559C', borderRadius: '2px' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                            <span>Go</span>
                            <span className="mono">7.1%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ width: '7.1%', height: '100%', background: '#FFB454', borderRadius: '2px' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Most Active Repositories */}
                    <div className="dash-panel layer-3d-text">
                      <div className="dash-panel-title">Most Active Repositories</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="repo-rank-item">
                          <div>
                            <div style={{ color: '#ffffff' }} className="mono">backend-telemetry-engine</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>348 commits · 14 contributors</div>
                          </div>
                          <span style={{ color: '#8B7CF6', fontSize: '0.78rem' }} className="mono">#1 Active</span>
                        </div>

                        <div className="repo-rank-item">
                          <div>
                            <div style={{ color: '#ffffff' }} className="mono">devtrack-web-client</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>284 commits · 8 contributors</div>
                          </div>
                          <span style={{ color: '#5B8DEF', fontSize: '0.78rem' }} className="mono">#2 Active</span>
                        </div>

                        <div className="repo-rank-item">
                          <div>
                            <div style={{ color: '#ffffff' }} className="mono">infra-kubernetes-charts</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>122 commits · 4 contributors</div>
                          </div>
                          <span style={{ color: '#3FE0D0', fontSize: '0.78rem' }} className="mono">#3 Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard3D>
        </div>
      </section>

      {/* ====================================================================
          4. HOW IT WORKS (3 NUMBERED STEPS)
          ==================================================================== */}
      <section id="how-it-works" className="section-wrap" ref={howRef} style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className={`section-header fade-slide-up ${howInView ? 'in-view' : ''}`}>
            <h2>How It Works</h2>
            <p>From GitHub authorization to deep developer telemetry in three frictionless steps.</p>
          </div>

          <div className="how-it-works-grid">
            <TiltCard3D maxTilt={10} style={{ height: '100%' }}>
              <div className={`step-card fade-slide-up ${howInView ? 'in-view' : ''}`}>
                <div className="step-num-tag layer-3d-badge">01 / AUTHENTICATE</div>
                <div className="step-icon-wrap layer-3d-float">
                  <Github size={20} />
                </div>
                <h3 className="step-title layer-3d-text">Connect GitHub</h3>
                <p className="step-desc">
                  One-click OAuth authorization via GitHub. Read-only metadata permissions with zero source code exposure.
                </p>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={10} style={{ height: '100%' }}>
              <div className={`step-card fade-slide-up ${howInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.12s' }}>
                <div className="step-num-tag layer-3d-badge" style={{ color: '#3FE0D0' }}>02 / AGGREGATE</div>
                <div className="step-icon-wrap layer-3d-float" style={{ borderColor: 'rgba(63, 224, 208, 0.3)', background: 'rgba(63, 224, 208, 0.1)', color: '#3FE0D0' }}>
                  <Layers size={20} />
                </div>
                <h3 className="step-title layer-3d-text">Automated Sync</h3>
                <p className="step-desc">
                  DevTrack syncs your commit cadences, pull request cycles, and multi-repo events in real time.
                </p>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={10} style={{ height: '100%' }}>
              <div className={`step-card fade-slide-up ${howInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.24s' }}>
                <div className="step-num-tag layer-3d-badge" style={{ color: '#F0559C' }}>03 / ELEVATE</div>
                <div className="step-icon-wrap layer-3d-float" style={{ borderColor: 'rgba(240, 85, 156, 0.3)', background: 'rgba(240, 85, 156, 0.1)', color: '#F0559C' }}>
                  <TrendingUp size={20} />
                </div>
                <h3 className="step-title layer-3d-text">Explore Insights</h3>
                <p className="step-desc">
                  Uncover your productivity patterns, visualize velocity metrics, and benchmark code review turnaround speeds.
                </p>
              </div>
            </TiltCard3D>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. FEATURES (6 CARDS WITH ROTATING ACCENTS)
          ==================================================================== */}
      <section id="features" className="section-wrap" ref={featRef}>
        <div className="container">
          <div className={`section-header fade-slide-up ${featInView ? 'in-view' : ''}`}>
            <h2>Engineered for Developer Clarity</h2>
            <p>Every commit, pull request, and review transformed into intelligent engineering telemetry.</p>
          </div>

          <div className="features-grid">
            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`feature-card fade-slide-up ${featInView ? 'in-view' : ''}`}>
                <div className="feature-icon-box layer-3d-float" style={{ background: 'rgba(139, 124, 246, 0.12)', color: '#8B7CF6', border: '1px solid rgba(139, 124, 246, 0.3)' }}>
                  <FolderGit2 size={20} />
                </div>
                <h3 className="feature-title layer-3d-text">Multi-Repo Analytics</h3>
                <p className="feature-desc">
                  Consolidate commit histories, PR reviews, and issue flow across all public and private repositories.
                </p>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`feature-card fade-slide-up ${featInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.08s' }}>
                <div className="feature-icon-box layer-3d-float" style={{ background: 'rgba(63, 224, 208, 0.12)', color: '#3FE0D0', border: '1px solid rgba(63, 224, 208, 0.3)' }}>
                  <GitCommit size={20} />
                </div>
                <h3 className="feature-title layer-3d-text">Commit Cadence Tracking</h3>
                <p className="feature-desc">
                  Identify your peak productivity hours, day-of-week velocity, and maintain sustainable coding streaks.
                </p>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`feature-card fade-slide-up ${featInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.16s' }}>
                <div className="feature-icon-box layer-3d-float" style={{ background: 'rgba(240, 85, 156, 0.12)', color: '#F0559C', border: '1px solid rgba(240, 85, 156, 0.3)' }}>
                  <GitPullRequest size={20} />
                </div>
                <h3 className="feature-title layer-3d-text">Pull Request Insights</h3>
                <p className="feature-desc">
                  Measure review turnaround cycle times, review responsiveness, and unblock PR bottlenecks before deadlines.
                </p>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`feature-card fade-slide-up ${featInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.24s' }}>
                <div className="feature-icon-box layer-3d-float" style={{ background: 'rgba(255, 180, 84, 0.12)', color: '#FFB454', border: '1px solid rgba(255, 180, 84, 0.3)' }}>
                  <AlertCircle size={20} />
                </div>
                <h3 className="feature-title layer-3d-text">Issue Tracking</h3>
                <p className="feature-desc">
                  Analyze resolution timeframes, issue closure rates, and bug distribution across your active repos.
                </p>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`feature-card fade-slide-up ${featInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.32s' }}>
                <div className="feature-icon-box layer-3d-float" style={{ background: 'rgba(91, 141, 239, 0.12)', color: '#5B8DEF', border: '1px solid rgba(91, 141, 239, 0.3)' }}>
                  <Code2 size={20} />
                </div>
                <h3 className="feature-title layer-3d-text">Language Statistics</h3>
                <p className="feature-desc">
                  Visualize your multi-year technology stack shifts from JavaScript to TypeScript, Python to Rust with byte precision.
                </p>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`feature-card fade-slide-up ${featInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.4s' }}>
                <div className="feature-icon-box layer-3d-float" style={{ background: 'rgba(167, 139, 250, 0.12)', color: '#A78BFA', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                  <Activity size={20} />
                </div>
                <h3 className="feature-title layer-3d-text">Contribution Activity</h3>
                <p className="feature-desc">
                  Interactive 52-week activity matrices, flow streak calculations, and weekly contribution velocity summaries.
                </p>
              </div>
            </TiltCard3D>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. INTERACTIVE SHOWCASE
          ==================================================================== */}
      <section className="section-wrap" ref={showcaseRef} style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className={`section-header fade-slide-up ${showcaseInView ? 'in-view' : ''}`}>
            <h2>Interactive Telemetry Explorer</h2>
            <p>Select any activity dimension to preview the telemetry views generated by DevTrack.</p>
          </div>

          <div className={`showcase-layout fade-slide-up ${showcaseInView ? 'in-view' : ''}`}>
            {/* Left Tab List */}
            <div className="showcase-nav-list">
              {showcaseTabs.map((tab, idx) => (
                <div
                  key={idx}
                  className={`showcase-tab-btn ${activeShowcaseTab === idx ? 'active' : ''}`}
                  onClick={() => setActiveShowcaseTab(idx)}
                >
                  <div style={{ color: activeShowcaseTab === idx ? 'var(--violet-light)' : 'var(--muted)', marginTop: '2px' }}>
                    {tab.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.98rem', color: '#ffffff', marginBottom: '2px' }}>{tab.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{tab.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Dynamic Preview Area */}
            <TiltCard3D maxTilt={10} style={{ height: '100%' }}>
              <div className="showcase-preview-panel">
                {activeShowcaseTab === 0 && (
                  <div className="layer-3d-text">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#ffffff' }}>Repository Velocity Matrix</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="mono" style={{ color: '#ffffff' }}>backend-api</span>
                          <span className="mono" style={{ color: '#3FE0D0' }}>98% Velocity</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>142 commits this month · 3 open pull requests · Zero build failures</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="mono" style={{ color: '#ffffff' }}>web-client</span>
                          <span className="mono" style={{ color: '#8B7CF6' }}>94% Velocity</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>96 commits this month · 2 open pull requests · 1.8h avg review time</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeShowcaseTab === 1 && (
                  <div className="layer-3d-text">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#ffffff' }}>Commit Velocity Cadence</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', paddingTop: '20px' }}>
                      {[45, 68, 92, 110, 85, 140, 95].map((h, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%' }}>
                          <div
                            style={{
                              width: '100%',
                              height: `${(h / 140) * 130}px`,
                              background: i === 5 ? 'linear-gradient(180deg, #3FE0D0, #5B8DEF)' : 'linear-gradient(180deg, #8B7CF6, #7C3AED)',
                              borderRadius: '4px',
                              marginTop: 'auto',
                              boxShadow: i === 5 ? '0 0 16px rgba(63,224,208,0.4)' : 'none',
                              transition: 'transform 0.2s ease'
                            }}
                            className="mini-cell"
                          />
                          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeShowcaseTab === 2 && (
                  <div className="layer-3d-text">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#ffffff' }}>Circadian Focus Heatmap</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px', marginBottom: '14px' }}>
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div
                          key={i}
                          className="mini-cell"
                          style={{
                            height: '24px',
                            borderRadius: '4px',
                            background: i === 18 || i === 19 || i === 20 ? '#8B7CF6' : i % 3 === 0 ? 'rgba(139,124,246,0.4)' : 'rgba(255,255,255,0.04)',
                            boxShadow: (i === 18 || i === 19 || i === 20) ? '0 0 10px rgba(139,124,246,0.5)' : 'none'
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>Peak deep-work window: 10:00 - 14:00 UTC (46% of high-impact commits authored)</p>
                  </div>
                )}

                {activeShowcaseTab === 3 && (
                  <div className="layer-3d-text">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#ffffff' }}>Multi-Year Stack Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
                          <span>TypeScript / React</span>
                          <span className="mono">58.4% (+14% YOY)</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                          <div style={{ width: '58.4%', height: '100%', background: '#8B7CF6', borderRadius: '3px', boxShadow: '0 0 10px rgba(139,124,246,0.5)' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
                          <span>Python / FastApi</span>
                          <span className="mono">28.2%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                          <div style={{ width: '28.2%', height: '100%', background: '#3FE0D0', borderRadius: '3px', boxShadow: '0 0 10px rgba(63,224,208,0.5)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeShowcaseTab === 4 && (
                  <div className="layer-3d-text">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#ffffff' }}>Synthesized Developer Persona</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt="Alex"
                        style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--violet)', boxShadow: '0 0 14px rgba(139,124,246,0.5)' }}
                      />
                      <div>
                        <div style={{ color: '#ffffff' }}>Alex Vance</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }} className="mono">@alex-dev · Staff Architect</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      High-velocity full-stack maintainer with 1,842 commits, top 5% code review turnaround speed, and primary expertise in distributed systems and TypeScript architecture.
                    </p>
                  </div>
                )}
              </div>
            </TiltCard3D>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. ANALYTICS SHOWCASE ("See how you code")
          ==================================================================== */}
      <section id="analytics" className="section-wrap" ref={analyticsRef}>
        <div className="container">
          <div className={`section-header fade-slide-up ${analyticsInView ? 'in-view' : ''}`}>
            <h2>See How You Code</h2>
            <p>High-resolution telemetry panels that map your daily workflow into actionable engineering metrics.</p>
          </div>

          <div className="analytics-3col-grid">
            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`analytics-panel-card fade-slide-up ${analyticsInView ? 'in-view' : ''}`}>
                <div className="analytics-card-title layer-3d-text">Contribution Heatmap</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '16px' }}>
                  {Array.from({ length: 42 }).map((_, i) => {
                    const op = (Math.cos(i * 0.9) + 1) / 2;
                    return (
                      <div
                        key={i}
                        className="mini-cell"
                        style={{
                          height: '18px',
                          borderRadius: '3px',
                          background: op > 0.75 ? '#8B7CF6' : op > 0.45 ? 'rgba(139,124,246,0.6)' : op > 0.2 ? 'rgba(139,124,246,0.25)' : 'rgba(255,255,255,0.03)'
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--muted)' }} className="mono layer-3d-badge">
                  <span>Less</span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <span style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px' }} />
                    <span style={{ width: '8px', height: '8px', background: 'rgba(139,124,246,0.3)', borderRadius: '1px' }} />
                    <span style={{ width: '8px', height: '8px', background: '#8B7CF6', borderRadius: '1px' }} />
                  </div>
                  <span>More</span>
                </div>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`analytics-panel-card fade-slide-up ${analyticsInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.1s' }}>
                <div className="analytics-card-title layer-3d-text">Language Distribution</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="layer-3d-text">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span>TypeScript</span>
                      <span className="mono">54.2%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                      <div style={{ width: '54.2%', height: '100%', background: '#8B7CF6', borderRadius: '2px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span>Python</span>
                      <span className="mono">24.6%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                      <div style={{ width: '24.6%', height: '100%', background: '#3FE0D0', borderRadius: '2px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span>Rust</span>
                      <span className="mono">14.1%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                      <div style={{ width: '14.1%', height: '100%', background: '#F0559C', borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`analytics-panel-card fade-slide-up ${analyticsInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.2s' }}>
                <div className="analytics-card-title layer-3d-text">Most Active Repositories</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="layer-3d-text">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '0.84rem', color: '#ffffff' }}>backend-api</span>
                    <span className="mono" style={{ fontSize: '0.78rem', color: '#8B7CF6' }}>348 commits</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '0.84rem', color: '#ffffff' }}>frontend-web</span>
                    <span className="mono" style={{ fontSize: '0.78rem', color: '#5B8DEF' }}>284 commits</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '0.84rem', color: '#ffffff' }}>infra-core</span>
                    <span className="mono" style={{ fontSize: '0.78rem', color: '#3FE0D0' }}>122 commits</span>
                  </div>
                </div>
              </div>
            </TiltCard3D>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. DEVELOPER INSIGHTS
          ==================================================================== */}
      <section id="insights" className="section-wrap" ref={insightsRef} style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className={`section-header fade-slide-up ${insightsInView ? 'in-view' : ''}`}>
            <h2>Developer Insights</h2>
            <p>Elevate your engineering self-awareness and turn everyday GitHub activity into personal mastery.</p>
          </div>

          <div className="insights-grid">
            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`insight-card fade-slide-up ${insightsInView ? 'in-view' : ''}`}>
                <Compass className="insight-icon layer-3d-float" size={24} />
                <h3 className="insight-title layer-3d-text">Know Your Habits</h3>
                <p style={{ fontSize: '0.9rem' }}>
                  Understand when your focus peaks, discover your true circadian coding hours, and structure deep work when productivity is highest.
                </p>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`insight-card fade-slide-up ${insightsInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.1s' }}>
                <TrendingUp className="insight-icon layer-3d-float" size={24} style={{ color: '#3FE0D0' }} />
                <h3 className="insight-title layer-3d-text">Track Your Progress</h3>
                <p style={{ fontSize: '0.9rem' }}>
                  Monitor multi-month velocity trends, watch review turnaround times compress, and benchmark consistency across long-term milestones.
                </p>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={12} style={{ height: '100%' }}>
              <div className={`insight-card fade-slide-up ${insightsInView ? 'in-view' : ''}`} style={{ transitionDelay: '0.2s' }}>
                <Award className="insight-icon layer-3d-float" size={24} style={{ color: '#F0559C' }} />
                <h3 className="insight-title layer-3d-text">Showcase Your Skills</h3>
                <p style={{ fontSize: '0.9rem' }}>
                  Generate verified, beautiful engineering summaries to share with engineering managers during 1-on-1s, reviews, and portfolio presentations.
                </p>
              </div>
            </TiltCard3D>
          </div>
        </div>
      </section>

      {/* ====================================================================
          9. INTERACTIVE GITHUB INTEGRATION PIPELINE & TELEMETRY STUDIO
          ==================================================================== */}
      <section id="pipeline-studio" className="section-wrap" ref={pipelineRef}>
        <div className="container">
          <div className={`section-header fade-slide-up ${pipelineInView ? 'in-view' : ''}`}>
            <h2>Interactive GitHub Telemetry Pipeline</h2>
            <p>A deterministic, read-only telemetry architecture. Click any stage or run the live simulation below.</p>
          </div>

          <div className={`fade-slide-up ${pipelineInView ? 'in-view' : ''}`}>
            {/* Simulation Control Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={runPipelineSimulation}
                  disabled={isSimulatingPipeline}
                  className="btn-primary"
                  style={{
                    padding: '9px 18px',
                    fontSize: '0.88rem',
                    background: isSimulatingPipeline ? 'rgba(139, 124, 246, 0.4)' : undefined,
                    cursor: isSimulatingPipeline ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Sparkles size={15} />
                  <span>{isSimulatingPipeline ? 'Simulation Running...' : '▶ Run Live Pipeline Simulation'}</span>
                </button>
                <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  Active node: <span style={{ color: pipelineStages[activePipelineStage]?.color || '#8B7CF6' }}>{pipelineStages[activePipelineStage]?.tag}</span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3FE0D0', boxShadow: '0 0 10px #3FE0D0' }} />
                <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>API v4 / GraphQL Ready</span>
              </div>
            </div>

            {/* Simulation Progress Bar */}
            {isSimulatingPipeline && (
              <div className="pipeline-sim-bar">
                <div className="pipeline-sim-bar-fill" style={{ width: `${pipelineSimProgress}%` }} />
              </div>
            )}

            {/* Interactive Studio Split Layout */}
            <div className="pipeline-studio-wrap">
              {/* Left Column: Interactive Pipeline Stages */}
              <div className="pipeline-stage-list">
                {pipelineStages.map((stage, idx) => {
                  const isActive = activePipelineStage === idx;
                  return (
                    <div
                      key={stage.id}
                      className={`pipeline-stage-card ${isActive ? 'active' : ''}`}
                      onClick={() => setActivePipelineStage(idx)}
                    >
                      <div
                        className="pipeline-stage-icon-wrap"
                        style={{
                          background: `${stage.color}18`,
                          border: `1px solid ${stage.color}40`,
                          color: stage.color
                        }}
                      >
                        {stage.icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.96rem', color: '#ffffff', fontWeight: isActive ? 500 : 400 }}>{stage.title}</span>
                          <span className="pipeline-stage-tag" style={{ color: stage.color, borderColor: `${stage.color}40` }}>
                            {stage.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {stage.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Live Terminal Inspector */}
              <TiltCard3D maxTilt={8} style={{ height: '100%' }}>
                <div className="pipeline-terminal-window layer-3d-text">
                  <div className="pipeline-terminal-header">
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                    </div>
                    <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                      {pipelineStages[activePipelineStage]?.endpoint}
                    </div>
                    <span className="mono" style={{ fontSize: '0.72rem', color: '#3FE0D0', background: 'rgba(63,224,208,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      200 OK
                    </span>
                  </div>

                  <div className="pipeline-terminal-body">
                    <div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '6px' }} className="mono">
                        // QUERY / TELEMETRY INTENT
                      </div>
                      <div className="pipeline-code-block" style={{ color: '#8B7CF6' }}>
                        {pipelineStages[activePipelineStage]?.query}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '6px' }} className="mono">
                        // ENGINE RESPONSE PAYLOAD
                      </div>
                      <div className="pipeline-code-block" style={{ color: '#3FE0D0' }}>
                        {pipelineStages[activePipelineStage]?.payload}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                        Telemetry Payload: 1.2 KB · Latency: 14ms
                      </span>
                      <button
                        onClick={() => { setIsConnectModalOpen(true); handleSimulateConnect(simUsername); }}
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      >
                        <Zap size={13} style={{ color: '#3FE0D0' }} />
                        <span>Hydrate Real Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              </TiltCard3D>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. DEVELOPER PROFILE PREVIEW
          ==================================================================== */}
      <section className="section-wrap" ref={profileRef} style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className={`section-header fade-slide-up ${profileInView ? 'in-view' : ''}`}>
            <h2>Developer Profile Preview</h2>
            <p>Your engineering footprint, synthesized into an elegant developer identity.</p>
          </div>

          <TiltCard3D maxTilt={14} style={{ maxWidth: '580px', margin: '0 auto' }}>
            <div className={`profile-preview-card fade-slide-up ${profileInView ? 'in-view' : ''}`}>
              <div className="profile-avatar-row layer-3d-text">
                <div className="profile-avatar-ring layer-3d-float">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                    alt="Alex Vance"
                    className="profile-avatar-img"
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '2px' }}>Alex Vance</h3>
                  <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--violet-light)' }}>@alex-dev</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '2px' }}>Staff Frontend Architect · San Francisco, CA</div>
                </div>
              </div>

              <div className="profile-stats-bar mono layer-3d-badge">
                <div>
                  <div style={{ fontSize: '1.25rem', color: '#ffffff' }}>42</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Repositories</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', color: '#ffffff' }}>1.2k</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Followers</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', color: '#ffffff' }}>380</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Following</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} className="layer-3d-badge">
                <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(139, 124, 246, 0.12)', color: '#8B7CF6', border: '1px solid rgba(139, 124, 246, 0.3)', borderRadius: '6px' }} className="mono">
                  TypeScript · 54%
                </span>
                <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(63, 224, 208, 0.12)', color: '#3FE0D0', border: '1px solid rgba(63, 224, 208, 0.3)', borderRadius: '6px' }} className="mono">
                  Python · 25%
                </span>
                <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(240, 85, 156, 0.12)', color: '#F0559C', border: '1px solid rgba(240, 85, 156, 0.3)', borderRadius: '6px' }} className="mono">
                  Rust · 14%
                </span>
              </div>
            </div>
          </TiltCard3D>
        </div>
      </section>

      {/* ====================================================================
          11. FINAL CTA SECTION
          ==================================================================== */}
      <section id="connect" className="section-wrap" ref={ctaRef}>
        <div className="container">
          <TiltCard3D maxTilt={8} style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div className={`final-cta-card fade-slide-up ${ctaInView ? 'in-view' : ''}`}>
              <div className="cta-inner-content layer-3d-text">
                <h2>Ready to understand your GitHub activity?</h2>
                <p>
                  Connect your account in seconds. Transform everyday commits into actionable engineering mastery with DevTrack.
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={handleConnectGithubClick}
                    className="btn-primary"
                    style={{ padding: '14px 32px', fontSize: '1.02rem' }}
                  >
                    <Github size={18} />
                    <span>{isAuthenticated ? 'Go to Dashboard →' : 'Connect GitHub →'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--muted)' }}>
                  <CheckCircle2 size={14} style={{ color: '#3FE0D0' }} />
                  <span>Secure · Simple · Developer-focused · Read-only API</span>
                </div>
              </div>
            </div>
          </TiltCard3D>
        </div>
      </section>

      {/* ====================================================================
          12. FOOTER
          ==================================================================== */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <a href="#" className="brand-link" style={{ marginBottom: '14px' }} aria-label="DevTrack Home">
                <img src="/devtrack-logo.png" alt="DevTrack" className="devtrack-logo-img" style={{ height: '32px' }} />
              </a>
              <p style={{ fontSize: '0.86rem', color: 'var(--muted)', maxWidth: '320px' }}>
                GitHub developer productivity and analytics dashboard SaaS. Built for engineering precision and workflow flow.
              </p>
            </div>

            <div>
              <div className="footer-col-title">Product</div>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#analytics">Analytics</a></li>
                <li><a href="#pipeline-studio">Pipeline Studio</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Resources</div>
              <ul className="footer-links">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">API Reference</a></li>
                <li><a href="#">Changelog</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Connect</div>
              <ul className="footer-links">
                <li><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a></li>
                <li><a href="https://discord.com" target="_blank" rel="noreferrer">Discord</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <div>© 2026 DevTrack. All rights reserved.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3FE0D0' }} />
              <span className="mono" style={{ fontSize: '0.76rem' }}>Telemetry Engine Operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ====================================================================
          13. INTERACTIVE CONNECT GITHUB MODAL
          ==================================================================== */}
      {isConnectModalOpen && (
        <div className="connect-modal-backdrop" onClick={() => setIsConnectModalOpen(false)}>
          <div className="connect-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              className="connect-modal-close"
              onClick={() => setIsConnectModalOpen(false)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139, 124, 246, 0.15)', border: '1px solid rgba(139, 124, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet-light)' }}>
                <Github size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '2px' }}>Connect Your GitHub</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Zero-permission read-only developer telemetry engine</p>
              </div>
            </div>

            {/* Real GitHub OAuth Call to Action */}
            <div
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(139, 124, 246, 0.1)',
                border: '1px solid rgba(139, 124, 246, 0.35)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>Real GitHub Authorization</span>
                <span className="mono" style={{ fontSize: '0.7rem', color: '#3FE0D0', background: 'rgba(63, 224, 208, 0.12)', padding: '2px 8px', borderRadius: '100px' }}>OAUTH 2.0</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                Authorize securely with your official GitHub account to establish an authenticated DevTrack session.
              </p>
              <button
                onClick={() => { setIsConnectModalOpen(false); handleConnectGithubClick(); }}
                className="btn-primary"
                style={{ width: '100%', padding: '11px 18px', fontSize: '0.92rem', justifyContent: 'center' }}
              >
                <Github size={17} />
                <span>{isAuthenticated ? 'Go to Dashboard →' : 'Authorize with GitHub →'}</span>
              </button>
            </div>

            {/* Visual Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
              <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>OR PREVIEW PIPELINE DEMO</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
            </div>

            {/* Simulated Username Input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '6px' }} className="mono">
                ENTER GITHUB USERNAME (OR TRY SAMPLES)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={simUsername}
                  onChange={(e) => setSimUsername(e.target.value)}
                  placeholder="e.g. alex-dev, torvalds, gaearon"
                  className="mono"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSimulateConnect(simUsername)}
                  className="btn-primary"
                  style={{ padding: '10px 16px', fontSize: '0.88rem' }}
                >
                  Sync
                </button>
              </div>

              {/* Sample User Quick Badges */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['alex-dev', 'torvalds', 'gaearon', 'sindresorhus'].map((u) => (
                  <button
                    key={u}
                    onClick={() => { setSimUsername(u); handleSimulateConnect(u); }}
                    className="mono"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      color: 'var(--violet-light)',
                      cursor: 'pointer'
                    }}
                  >
                    @{u}
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Ingestion Progress */}
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="mono" style={{ fontSize: '0.78rem', color: '#ffffff' }}>
                  {connectModalStage === 'idle' && 'Ready to index'}
                  {connectModalStage === 'auth' && '1/3 Authenticating OAuth Token...'}
                  {connectModalStage === 'indexing' && '2/3 Ingesting GraphQL Commit Stream...'}
                  {connectModalStage === 'synthesis' && '3/3 Synthesizing Circadian Flow Matrix...'}
                  {connectModalStage === 'ready' && '✓ DevTrack Passport Generated!'}
                </span>
                <span className="mono" style={{ fontSize: '0.76rem', color: '#3FE0D0' }}>{simProgress}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${simProgress}%`, height: '100%', background: 'linear-gradient(90deg, #8B7CF6, #3FE0D0)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Resulting Simulated DevTrack Passport */}
            {connectModalStage === 'ready' && (
              <div style={{ background: 'rgba(139, 124, 246, 0.08)', border: '1px solid rgba(139, 124, 246, 0.35)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                    alt={simUsername}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid var(--violet)' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.92rem', color: '#ffffff' }}>@{simUsername}</div>
                    <div className="mono" style={{ fontSize: '0.72rem', color: '#3FE0D0' }}>Top 3% Code Review Velocity</div>
                  </div>
                </div>
                <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ color: '#ffffff' }}>1,842</div>
                    <div>Commits</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ color: '#ffffff' }}>42</div>
                    <div>Repos</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ color: '#ffffff' }}>98%</div>
                    <div>Flow Score</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.86rem' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsConnectModalOpen(false);
                  const el = document.getElementById('dashboard-intro');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.86rem' }}
              >
                View Full Cockpit →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   APP ROUTER & AUTHENTICATION GUARD
   ========================================================================== */
const MainRouter: React.FC = () => {
  const { loading, isAuthenticated, error, loginWithGithub, clearError } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const handlePop = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, []);

  // Detect if browser is returning from GitHub OAuth callback
  const hasAuthParams = window.location.search.includes('auth=') || window.location.search.includes('token=');

  if (loading && (currentPath === '/dashboard' || hasAuthParams)) {
    return <AuthLoadingScreen message="Connecting with GitHub..." />;
  }

  // Handle OAuth authentication error state
  if (error) {
    return (
      <AuthErrorScreen
        error={error}
        onRetry={loginWithGithub}
        onBackHome={() => {
          clearError();
          navigateTo('/');
        }}
      />
    );
  }

  // Protected Route: /dashboard
  if (currentPath === '/dashboard') {
    if (!isAuthenticated && !loading) {
      // Auth Guard: unauthenticated users redirected to landing
      window.history.replaceState({}, '', '/');
      return <DevTrackLanding onNavigateToDashboard={() => navigateTo('/dashboard')} />;
    }
    return <MinimalDashboard />;
  }

  // Public Route: Landing Page
  return <DevTrackLanding onNavigateToDashboard={() => navigateTo('/dashboard')} />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
};

export default App;
