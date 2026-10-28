/**
 * BEL PROBLEM 1606 - TACTICAL PPI RADAR SCOPE
 * Circular Plan Position Indicator (PPI) with 360° Sweep & Real-Time Target Blip Tracking
 */

const TacticalPPIScope = (function() {
  'use strict';

  let canvas = null;
  let ctx = null;
  let currentProfile = null;
  let sweepAngle = 0; // radians
  let animId = null;
  let historyTrail = [];

  const MAX_RANGE_METERS = 2500;

  function init(canvasElem, initialProfile) {
    canvas = canvasElem;
    ctx = canvas.getContext('2d');
    currentProfile = initialProfile;
    historyTrail = [];

    // Pre-populate slight historical trajectory
    if (initialProfile) {
      updateTrajectory(initialProfile);
    }

    startAnimation();
  }

  function setTarget(profile) {
    currentProfile = profile;
    historyTrail = [];
    updateTrajectory(profile);
  }

  function updateTrajectory(profile) {
    // Generate subtle breadcrumb points representing past track
    const heading = (profile.bearing - 180 + 360) % 360; // coming from opposite direction
    const headingRad = (heading * Math.PI) / 180;
    
    for (let step = 4; step >= 1; step--) {
      const distOffset = step * 60; // meters
      const r = Math.max(200, profile.range - distOffset);
      const bRad = (profile.bearing * Math.PI) / 180 - step * 0.03;
      historyTrail.push({
        range: r,
        angleRad: bRad,
        alpha: 0.2 + (0.5 - step * 0.1)
      });
    }
  }

  function startAnimation() {
    if (animId) cancelAnimationFrame(animId);

    function loop() {
      render();
      sweepAngle += 0.025; // sweep speed
      if (sweepAngle >= Math.PI * 2) {
        sweepAngle = 0;
      }
      animId = requestAnimationFrame(loop);
    }
    loop();
  }

  function render() {
    if (!ctx || !canvas) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) / 2 - 12;

    // Fade past screen slightly for phosphor persistence trail
    ctx.fillStyle = 'rgba(2, 7, 14, 0.16)';
    ctx.fillRect(0, 0, W, H);

    // Radar Outer Ring
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Concentric Range Rings (500m, 1000m, 1500m, 2000m, 2500m)
    const numRings = 5;
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.14)';
    ctx.lineWidth = 1;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(0, 255, 157, 0.55)';
    ctx.textAlign = 'center';

    for (let i = 1; i <= numRings; i++) {
      const ringR = (i / numRings) * radius;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Range text on North axis
      const rangeM = (i / numRings) * MAX_RANGE_METERS;
      ctx.fillText(`${rangeM}m`, cx, cy - ringR + 10);
    }

    // Crosshairs & Radial Spokes (every 45 degrees)
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg * Math.PI) / 180;
      const xEnd = cx + Math.cos(rad) * radius;
      const yEnd = cy + Math.sin(rad) * radius;

      ctx.strokeStyle = deg % 90 === 0 ? 'rgba(0, 255, 157, 0.22)' : 'rgba(0, 255, 157, 0.08)';
      ctx.lineWidth = deg % 90 === 0 ? 1.2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(xEnd, yEnd);
      ctx.stroke();

      // Cardinal Labels
      let cardinal = '';
      if (deg === 0) cardinal = 'E (090°)';
      else if (deg === 90) cardinal = 'S (180°)';
      else if (deg === 180) cardinal = 'W (270°)';
      else if (deg === 270) cardinal = 'N (000°)';

      if (cardinal) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
        ctx.font = 'bold 9px Rajdhani, sans-serif';
        const lx = cx + Math.cos(rad) * (radius - 16);
        const ly = cy + Math.sin(rad) * (radius - 16);
        ctx.fillText(cardinal, lx, ly);
      }
    }

    // Target Blip Coordinates
    let targetX = 0, targetY = 0, targetAngleRad = 0;
    if (currentProfile) {
      // Convert bearing (0 = North/up) to canvas polar coords (0 = East/right)
      targetAngleRad = ((currentProfile.bearing - 90) * Math.PI) / 180;
      const targetDistRatio = Math.min(1.0, currentProfile.range / MAX_RANGE_METERS);
      const targetR = targetDistRatio * radius;

      targetX = cx + Math.cos(targetAngleRad) * targetR;
      targetY = cy + Math.sin(targetAngleRad) * targetR;

      // Draw Past Trail Dots
      for (const pt of historyTrail) {
        const trDist = (pt.range / MAX_RANGE_METERS) * radius;
        const tx = cx + Math.cos(pt.angleRad - Math.PI / 2) * trDist;
        const ty = cy + Math.sin(pt.angleRad - Math.PI / 2) * trDist;
        ctx.fillStyle = currentProfile.category === 'drone' ? `rgba(255, 51, 102, ${pt.alpha})` : `rgba(0, 255, 157, ${pt.alpha})`;
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Check if sweep beam is currently hitting target
      const angleDiff = Math.abs((sweepAngle % (Math.PI * 2)) - ((targetAngleRad + Math.PI * 2) % (Math.PI * 2)));
      const isHit = angleDiff < 0.15 || angleDiff > (Math.PI * 2 - 0.15);

      // Draw Target Blip
      const isDrone = currentProfile.category === 'drone';
      const blipColor = isDrone ? '#ff3366' : '#00ff9d';

      // Sonar pulse ring when sweep passes over target
      if (isHit) {
        ctx.strokeStyle = blipColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Blip Icon / Shape
      ctx.fillStyle = blipColor;
      ctx.shadowColor = blipColor;
      ctx.shadowBlur = 10;

      if (isDrone) {
        // Red Tactical Diamond for Drone
        ctx.beginPath();
        ctx.moveTo(targetX, targetY - 6);
        ctx.lineTo(targetX + 6, targetY);
        ctx.lineTo(targetX, targetY + 6);
        ctx.lineTo(targetX - 6, targetY);
        ctx.closePath();
        ctx.fill();
      } else {
        // Green Circular Dot for Bird
        ctx.beginPath();
        ctx.arc(targetX, targetY, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Target Tactical Data Tag
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillStyle = blipColor;
      ctx.textAlign = 'left';
      ctx.fillText(isDrone ? 'TRK-0492 [UAV]' : 'TRK-0814 [BIO]', targetX + 10, targetY - 4);
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`${currentProfile.range}m | ${currentProfile.bearing}°`, targetX + 10, targetY + 6);
    }

    // Rotating Sweep Beam with Fading Phosphor Trail
    const sweepX = cx + Math.cos(sweepAngle) * radius;
    const sweepY = cy + Math.sin(sweepAngle) * radius;

    // Beam Line
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff9d';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sweepX, sweepY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Sector Phosphor Glow Trail (Fading wedge behind sweep line)
    const trailSegments = 24;
    const trailArc = Math.PI / 4; // 45 degree fade trail
    for (let s = 1; s <= trailSegments; s++) {
      const frac = s / trailSegments;
      const aStart = sweepAngle - (frac * trailArc);
      const aEnd = sweepAngle - ((frac - 1 / trailSegments) * trailArc);
      const alpha = (1 - frac) * 0.16;

      ctx.fillStyle = `rgba(0, 255, 157, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, aStart, aEnd);
      ctx.closePath();
      ctx.fill();
    }

    // Center Radar Radar Antenna Hub
    ctx.fillStyle = '#00ff9d';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return {
    init,
    setTarget
  };
})();

// Export globally
window.TacticalPPIScope = TacticalPPIScope;
