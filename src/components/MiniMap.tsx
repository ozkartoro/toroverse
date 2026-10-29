/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Compass,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  MapPin,
  Crosshair,
  Shield,
  Eye,
  EyeOff,
  Navigation,
} from 'lucide-react';
import { EnemyType } from '../types/game';
import { sound } from '../audio/soundSystem';

export interface MinimapPOI {
  id: string;
  name: string;
  type: 'spawn' | 'citadel' | 'teleport' | 'jump' | 'beacon' | 'quest' | 'animal' | 'chest';
  x: number;
  z: number;
}

export interface MinimapEnemy {
  id: string;
  name: string;
  type: EnemyType;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  isAggro?: boolean;
}

export interface MiniMapProps {
  playerX: number;
  playerY: number;
  playerZ: number;
  playerYaw: number;
  enemies: MinimapEnemy[];
  pois: MinimapPOI[];
  islandName: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  playerX,
  playerY,
  playerZ,
  playerYaw,
  enemies,
  pois,
  islandName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Zoom range settings in meters/blocks
  // 45m = tactical close combat
  // 95m = medium exploration
  // 180m = macro island view across 1000% scale
  const ZOOM_LEVELS = [45, 95, 180];
  const [zoomIndex, setZoomIndex] = useState(1); // default 95m
  const currentRadius = ZOOM_LEVELS[zoomIndex];

  // Rotate map with player vs North-up
  const [rotateWithPlayer, setRotateWithPlayer] = useState(true);

  // Collapsed state (Defaults to collapsed on mobile / compact screens so it doesn't cover the 3D view)
  const [isMobileView, setIsMobileView] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      (window.innerWidth < 1024 || window.innerHeight < 640 || 'ontouchstart' in window)
    );
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      (window.innerWidth < 1024 || window.innerHeight < 640 || 'ontouchstart' in window)
    );
  });

  useEffect(() => {
    const onResize = () => {
      const mobile =
        window.innerWidth < 1024 || window.innerHeight < 640 || 'ontouchstart' in window;
      setIsMobileView(mobile);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Hovered blip tooltip
  const [hoveredBlip, setHoveredBlip] = useState<{
    name: string;
    distance: number;
    type: string;
  } | null>(null);

  // Radar sweep angle
  const sweepAngleRef = useRef(0);

  // Filter nearby enemies count, chests count, and POI count
  const stats = useMemo(() => {
    let enemiesInRange = 0;
    let poisInRange = 0;
    let chestsInRange = 0;
    enemies.forEach((en) => {
      if (Math.hypot(en.x - playerX, en.z - playerZ) <= currentRadius) {
        enemiesInRange++;
      }
    });
    pois.forEach((poi) => {
      if (Math.hypot(poi.x - playerX, poi.z - playerZ) <= currentRadius) {
        if (poi.type === 'chest') {
          chestsInRange++;
        } else {
          poisInRange++;
        }
      }
    });
    return { enemiesInRange, poisInRange, chestsInRange };
  }, [enemies, pois, playerX, playerZ, currentRadius]);

  // Canvas Radar Render
  useEffect(() => {
    if (isCollapsed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radarRadius = cx - 12;

      ctx.clearRect(0, 0, width, height);

      // 1. Radar Background with subtle radial gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radarRadius);
      bgGrad.addColorStop(0, 'rgba(6, 18, 38, 0.92)');
      bgGrad.addColorStop(0.7, 'rgba(3, 10, 24, 0.95)');
      bgGrad.addColorStop(1, 'rgba(2, 6, 18, 0.98)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Subtle Grid & Range Rings
      const ringSteps = [0.33, 0.66, 1.0];
      ringSteps.forEach((step, idx) => {
        const r = radarRadius * step;
        ctx.strokeStyle = idx === 2 ? 'rgba(0, 245, 212, 0.35)' : 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = idx === 2 ? 1.5 : 1;
        ctx.setLineDash(idx === 2 ? [] : [3, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Distance label on the ring
        if (!isCollapsed && step < 1.0) {
          ctx.setLineDash([]);
          ctx.font = '9px monospace';
          ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(currentRadius * step)}m`, cx, cy - r + 10);
        }
      });
      ctx.setLineDash([]);

      // Crosshair Axes
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radarRadius, cy);
      ctx.lineTo(cx + radarRadius, cy);
      ctx.moveTo(cx, cy - radarRadius);
      ctx.lineTo(cx, cy + radarRadius);
      ctx.stroke();

      // 3. Rotating Radar Sweep Beam
      sweepAngleRef.current = (sweepAngleRef.current + 0.035) % (Math.PI * 2);
      const sweep = sweepAngleRef.current;
      const sweepGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radarRadius);
      sweepGrad.addColorStop(0, 'rgba(0, 245, 212, 0.25)');
      sweepGrad.addColorStop(1, 'rgba(0, 245, 212, 0.0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radarRadius, sweep - 0.45, sweep);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Helper function to project world (wx, wz) to canvas (px, py)
      const project = (wx: number, wz: number): { x: number; y: number; inBounds: boolean; dist: number } => {
        let dx = wx - playerX;
        let dz = wz - playerZ;
        const dist = Math.hypot(dx, dz);

        // If rotating with player: rotate relative vector by playerYaw
        if (rotateWithPlayer) {
          // Camera yaw rotation
          const cos = Math.cos(playerYaw);
          const sin = Math.sin(playerYaw);
          const rx = dx * cos - dz * sin;
          const rz = dx * sin + dz * cos;
          dx = rx;
          dz = rz;
        }

        const scale = radarRadius / currentRadius;
        let px = cx + dx * scale;
        let py = cy + dz * scale;

        const pDist = Math.hypot(px - cx, py - cy);
        let inBounds = true;
        if (pDist > radarRadius - 5) {
          inBounds = false;
          // Clamp to radar rim for off-screen tracking
          const angle = Math.atan2(py - cy, px - cx);
          px = cx + Math.cos(angle) * (radarRadius - 7);
          py = cy + Math.sin(angle) * (radarRadius - 7);
        }

        return { x: px, y: py, inBounds, dist };
      };

      // 4. Render Points of Interest (POIs)
      pois.forEach((poi) => {
        const { x, y, inBounds, dist } = project(poi.x, poi.z);
        if (dist > currentRadius * 1.6) return; // Don't render far-off POIs

        ctx.save();
        if (!inBounds) ctx.globalAlpha = 0.55;

        if (poi.type === 'spawn') {
          // Green flag marker
          ctx.fillStyle = '#10b981';
          ctx.strokeStyle = '#022c22';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('S', x, y + 2.5);
        } else if (poi.type === 'citadel') {
          // Golden central citadel diamond
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y - 5);
          ctx.lineTo(x + 5, y);
          ctx.lineTo(x, y + 5);
          ctx.lineTo(x - 5, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (poi.type === 'teleport') {
          // Purple vortex
          ctx.fillStyle = '#a855f7';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (poi.type === 'jump') {
          // Cyan jump pad triangle
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.moveTo(x, y - 4);
          ctx.lineTo(x + 4, y + 3);
          ctx.lineTo(x - 4, y + 3);
          ctx.closePath();
          ctx.fill();
        } else if (poi.type === 'beacon') {
          // Beacon star
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (poi.type === 'animal') {
          // Friendly animal green blip
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(x, y, 2.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (poi.type === 'chest') {
          // Gleaming Golden Treasure Chest square marker
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#ffffff';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 6;
          ctx.lineWidth = 1.2;
          ctx.fillRect(x - 3.5, y - 3, 7, 6);
          ctx.strokeRect(x - 3.5, y - 3, 7, 6);
        }
        ctx.restore();
      });

      // 5. Render Detected Hostile Enemies
      enemies.forEach((enemy) => {
        const { x, y, inBounds, dist } = project(enemy.x, enemy.z);
        if (dist > currentRadius * 1.5) return;

        ctx.save();
        const isAggro = enemy.isAggro || dist < 16;

        if (enemy.type === 'void_golem') {
          // Colossal Boss: Large pulsating diamond
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(x, y - 6.5);
          ctx.lineTo(x + 6.5, y);
          ctx.lineTo(x, y + 6.5);
          ctx.lineTo(x - 6.5, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Health mini-bar
          const hpPct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(x - 8, y - 10, 16, 3);
          ctx.fillStyle = hpPct > 0.4 ? '#22c55e' : '#ef4444';
          ctx.fillRect(x - 8, y - 10, 16 * hpPct, 3);
        } else {
          // Standard enemy red diamond
          ctx.fillStyle = isAggro ? '#f43f5e' : '#e11d48';
          ctx.strokeStyle = isAggro ? '#ffffff' : '#4c0519';
          ctx.lineWidth = 1;
          if (isAggro) {
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 8;
          }
          ctx.beginPath();
          ctx.moveTo(x, y - 4.5);
          ctx.lineTo(x + 4.5, y);
          ctx.lineTo(x, y + 4.5);
          ctx.lineTo(x - 4.5, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          if (isAggro && inBounds) {
            // Aggro warning ping ring
            const pulse = (Date.now() % 1000) / 1000;
            ctx.strokeStyle = `rgba(244, 63, 94, ${1 - pulse})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 4.5 + pulse * 7, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();
      });

      // 6. Render Player Marker at Center
      ctx.save();
      // Player cyan glow aura
      ctx.fillStyle = 'rgba(0, 245, 212, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();

      // Heading arrow: if rotateWithPlayer is true, arrow points straight UP (0 rad),
      // otherwise it points in playerYaw direction
      const arrowAngle = rotateWithPlayer ? -Math.PI / 2 : playerYaw - Math.PI / 2;

      ctx.translate(cx, cy);
      ctx.rotate(arrowAngle);

      // Cyan Chevron Arrow
      ctx.fillStyle = '#00f5d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(7, 0); // Tip
      ctx.lineTo(-5, -5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 7. Outer Compass Ring & Cardinal Directions (N, E, S, W)
      ctx.save();
      const compassAngle = rotateWithPlayer ? -playerYaw : 0;
      const compassRadius = radarRadius + 2;

      const cardinals = [
        { label: 'N', angle: -Math.PI / 2, color: '#00f5d4', bold: true },
        { label: 'E', angle: 0, color: '#94a3b8', bold: false },
        { label: 'S', angle: Math.PI / 2, color: '#94a3b8', bold: false },
        { label: 'W', angle: Math.PI, color: '#94a3b8', bold: false },
      ];

      cardinals.forEach(({ label, angle, color, bold }) => {
        const finalAngle = angle + compassAngle;
        const lx = cx + Math.cos(finalAngle) * (compassRadius + 6);
        const ly = cy + Math.sin(finalAngle) * (compassRadius + 6);

        ctx.font = bold ? 'bold 10px sans-serif' : '9px sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx, ly);
      });
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isCollapsed,
    playerX,
    playerY,
    playerZ,
    playerYaw,
    enemies,
    pois,
    currentRadius,
    rotateWithPlayer,
  ]);

  const handleCycleZoom = () => {
    sound.playClick();
    setZoomIndex((prev) => (prev + 1) % ZOOM_LEVELS.length);
  };

  const handleToggleRotate = () => {
    sound.playClick();
    setRotateWithPlayer((prev) => !prev);
  };

  const radarSize = isMobileView ? 82 : 156;

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1 select-none">
      {/* Compact Pill when Collapsed */}
      {isCollapsed ? (
        <button
          onClick={() => {
            sound.playClick();
            setIsCollapsed(false);
          }}
          title="Expandir Mini-Mapa Radar"
          className="flex items-center gap-1.5 rounded-full bg-slate-950/90 border border-cyan-500/50 px-2.5 py-1 shadow-lg backdrop-blur-md hover:border-cyan-400 active:scale-95 transition cursor-pointer"
        >
          <Crosshair className="h-3 w-3 text-cyan-400 animate-spin-slow flex-shrink-0" />
          <span className="text-[10px] font-mono font-bold text-white">
            Radar {Math.round(playerX)},{Math.round(playerZ)}
          </span>
          {stats.chestsInRange > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-mono text-amber-300 font-bold">
              🎁{stats.chestsInRange}
            </span>
          )}
          {stats.enemiesInRange > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-mono text-rose-400 font-bold">
              ⚔️{stats.enemiesInRange}
            </span>
          )}
          <Maximize2 className="h-3 w-3 text-cyan-300 ml-0.5" />
        </button>
      ) : (
        /* Expanded Mini-map Container */
        <div className="relative rounded-2xl bg-slate-950/90 border border-cyan-500/40 p-1 sm:p-2 shadow-2xl backdrop-blur-md flex flex-col items-center max-w-[200px]">
          {/* Top Header: Island name & collapse/expand controls */}
          <div className="w-full flex items-center justify-between gap-1 border-b border-slate-800/80 pb-0.5 mb-1 px-1">
            <div className="flex items-center gap-1 overflow-hidden">
              <Crosshair className="h-3 w-3 text-cyan-400 animate-spin-slow flex-shrink-0" />
              <span className="text-[9px] sm:text-[11px] font-bold text-white truncate max-w-[65px] sm:max-w-[110px]">
                {islandName.split(':')[0]}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Zoom toggle button */}
              <button
                onClick={handleCycleZoom}
                title={`Rango de radar: ${currentRadius}m (Clic para cambiar)`}
                className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[8px] sm:text-[9px] font-mono text-cyan-300 hover:text-white hover:bg-slate-800 transition"
              >
                {currentRadius}m
              </button>

              {/* Compass lock / rotate toggle */}
              <button
                onClick={handleToggleRotate}
                title={rotateWithPlayer ? 'Modo: Orientación de Jugador' : 'Modo: Norte Fijo'}
                className={`p-1 rounded border transition ${
                  rotateWithPlayer
                    ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <Navigation className={`h-2.5 w-2.5 ${rotateWithPlayer ? 'rotate-45' : ''}`} />
              </button>

              {/* Collapse toggle */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsCollapsed(true);
                }}
                title="Minimizar radar"
                className="p-1 rounded bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:text-white transition flex items-center justify-center"
              >
                <Minimize2 className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          {/* Radar Canvas Body */}
          <div className="relative flex items-center justify-center p-0.5">
            <canvas
              ref={canvasRef}
              width={radarSize}
              height={radarSize}
              className="rounded-full shadow-inner"
            />

            {/* Subtle corner tech decoration */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-cyan-400/50 pointer-events-none" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400/50 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-400/50 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-cyan-400/50 pointer-events-none" />
          </div>

          {/* Bottom Coordinates & Threat Readout */}
          <div className="w-full flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80 px-1 text-[8px] sm:text-[9px] font-mono">
            <div className="text-slate-400">
              X:<span className="text-cyan-300 font-bold ml-0.5">{Math.round(playerX)}</span> Z:
              <span className="text-cyan-300 font-bold ml-0.5">{Math.round(playerZ)}</span>
            </div>

            <div className="flex items-center gap-1">
              {stats.chestsInRange > 0 && (
                <span className="flex items-center gap-0.5 text-amber-300 font-bold" title="Cofres cercanos">
                  <span>🎁</span>
                  <span>{stats.chestsInRange}</span>
                </span>
              )}
              {stats.enemiesInRange > 0 && (
                <span className="flex items-center gap-0.5 text-rose-400 font-bold animate-pulse">
                  <span>⚔️</span>
                  <span>{stats.enemiesInRange}</span>
                </span>
              )}
              <span className="flex items-center gap-0.5 text-amber-400">
                <span>📍</span>
                <span>{stats.poisInRange}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
