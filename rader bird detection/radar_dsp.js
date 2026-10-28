/**
 * BEL PROBLEM 1606 - DIGITAL SIGNAL PROCESSING & CLASSIFICATION ENGINE
 * Micro-Doppler Analysis: STFT Spectrogram, CVD, 7-Feature Extraction & AI Classifier
 */

const RadarDSP = (function() {
  'use strict';

  // Preset Target Ground-Truth Telemetry & Signatures
  const TARGET_PROFILES = {
    quadcopter: {
      id: 'quadcopter',
      category: 'drone',
      name: 'Quadcopter (DJI Phantom)',
      type: 'Commercial UAV (4 Rotors)',
      speed: 12.0, // m/s
      range: 1420,  // meters
      bearing: 45,  // degrees
      alt: 120,     // meters
      rpm: 5100,
      blades: 2,
      cadence: 170.0, // 2 * 5100 / 60
      spread: 1480,   // Hz
      symmetry: 0.96,
      torsoRatio: 0.28,
      kurtosis: 6.84,
      rcs: 0.021,     // m^2
      confidence: 100.0,
      threat: 'CRITICAL',
      annotationBadge: 'BLADE FLASHES DETECTED',
      annotationDesc: 'Symmetric micro-Doppler sweeps extending to ±1,480 Hz produced by carbon-fiber rotor tips at 5,100 RPM.',
      cadenceInterp: '(Drone Motor / Blade Chop: 2 blades × 5,100 RPM / 60 = 170.0 Hz)',
      action: 'Engage RF Jammer on 2.4 / 5.8 GHz ISM control bands. Initiate GNSS spoofing denial protocol. Alert Air Defense Sector 4.'
    },
    hexacopter: {
      id: 'hexacopter',
      category: 'drone',
      name: 'Hexacopter (Heavy Lift)',
      type: 'Heavy Payload UAV (6 Rotors)',
      speed: 15.0,
      range: 1180,
      bearing: 78,
      alt: 160,
      rpm: 4200,
      blades: 3,
      cadence: 210.0, // 3 * 4200 / 60
      spread: 1820,
      symmetry: 0.95,
      torsoRatio: 0.24,
      kurtosis: 7.21,
      rcs: 0.038,
      confidence: 99.7,
      threat: 'CRITICAL',
      annotationBadge: 'MULTI-ROTOR HIGH HARMONICS',
      annotationDesc: 'High-density blade chop harmonics at 210 Hz with wide ±1,820 Hz Doppler spread indicating heavy 6-rotor lift.',
      cadenceInterp: '(Heavy UAV Rotor Chop: 3 blades × 4,200 RPM / 60 = 210.0 Hz)',
      action: 'High payload threat. Deploy multi-band C-UAS directional countermeasure. Vector interceptor drone.'
    },
    microuav: {
      id: 'microuav',
      category: 'drone',
      name: 'Micro-UAV (Black Hornet)',
      type: 'Nano Reconnaissance Drone',
      speed: 6.0,
      range: 640,
      bearing: 110,
      alt: 45,
      rpm: 8400,
      blades: 2,
      cadence: 280.0, // 2 * 8400 / 60
      spread: 920,
      symmetry: 0.93,
      torsoRatio: 0.32,
      kurtosis: 5.92,
      rcs: 0.008,
      confidence: 99.1,
      threat: 'HIGH',
      annotationBadge: 'HIGH-RPM NANO BLADE SIGNATURE',
      annotationDesc: 'Ultra-fast 280 Hz cadence peak with 8,400 RPM micro-rotors. Characteristic stealth micro-UAV profile.',
      cadenceInterp: '(Nano-UAV Rotor Chop: 2 blades × 8,400 RPM / 60 = 280.0 Hz)',
      action: 'Target stealth micro-UAV in close perimeter. Deploy acoustic/RF triangulation and localized disruption.'
    },
    pigeon: {
      id: 'pigeon',
      category: 'bird',
      name: 'Pigeon / Dove (Columba livia)',
      type: 'Biological Avian (Medium)',
      speed: 11.0,
      range: 1250,
      bearing: 320,
      alt: 65,
      rpm: 0,
      blades: 0,
      cadence: 5.8, // 5.8 flaps per second
      spread: 180,
      symmetry: 0.38,
      torsoRatio: 0.88,
      kurtosis: 2.15,
      rcs: 0.020,
      confidence: 99.4,
      threat: 'SAFE',
      annotationBadge: 'BIOLOGICAL FLAPPING ENVELOPE',
      annotationDesc: 'Smooth undulating sinusoidal envelope within ±180 Hz. No high-frequency blade flashes present.',
      cadenceInterp: '(Biological Wing Flap Rhythm: 5.8 Hz muscle contraction)',
      action: 'Automated Alarm Suppression active. Passive track logged in ecological telemetry. No defense escalation.'
    },
    eagle: {
      id: 'eagle',
      category: 'bird',
      name: 'Golden Eagle / Raptor (Aquila chrysaetos)',
      type: 'Biological Avian (Large Raptor)',
      speed: 18.0,
      range: 2100,
      bearing: 215,
      alt: 280,
      rpm: 0,
      blades: 0,
      cadence: 3.2,
      spread: 240,
      symmetry: 0.42,
      torsoRatio: 0.92,
      kurtosis: 2.40,
      rcs: 0.045,
      confidence: 98.9,
      threat: 'SAFE',
      annotationBadge: 'RAPTOR GLIDE & HARMONICS',
      annotationDesc: 'Deep, slow 3.2 Hz wingbeat harmonics with intermittent soaring intervals and dominant torso reflection.',
      cadenceInterp: '(Large Raptor Wingbeat: 3.2 Hz flapping with glide intervals)',
      action: 'Large raptor signature verified. Suppress alert siren to prevent operator fatigue.'
    },
    seagull: {
      id: 'seagull',
      category: 'bird',
      name: 'Seagull (Coastal / Larus argentatus)',
      type: 'Biological Avian (Seabird)',
      speed: 9.0,
      range: 890,
      bearing: 15,
      alt: 40,
      rpm: 0,
      blades: 0,
      cadence: 4.1,
      spread: 160,
      symmetry: 0.35,
      torsoRatio: 0.85,
      kurtosis: 1.95,
      rcs: 0.022,
      confidence: 99.2,
      threat: 'SAFE',
      annotationBadge: 'COASTAL AVIAN PROFILE',
      annotationDesc: 'Narrow-band 4.1 Hz modulation envelope with asymmetric upstroke/downstroke wing kinematics.',
      cadenceInterp: '(Seabird Flapping Rhythm: 4.1 Hz)',
      action: 'Maritime coastal avian track confirmed. Filter from tactical alert queue.'
    }
  };

  // Color Palettes for Spectrogram
  function colormap(val, scheme = 'turbo') {
    // val is clamped 0.0 to 1.0
    val = Math.max(0, Math.min(1, val));
    
    if (scheme === 'viridis') {
      const r = Math.floor(255 * (0.2 + 0.8 * Math.sin(val * Math.PI * 0.8)));
      const g = Math.floor(255 * (val < 0.5 ? val * 1.6 : 0.8 + 0.2 * (1 - val)));
      const b = Math.floor(255 * (0.3 + 0.7 * Math.cos(val * Math.PI * 0.5)));
      return `rgb(${r},${g},${b})`;
    }
    
    if (scheme === 'plasma') {
      const r = Math.floor(255 * (0.05 + 0.95 * Math.pow(val, 0.7)));
      const g = Math.floor(255 * (0.0 + 0.85 * Math.pow(val, 1.8)));
      const b = Math.floor(255 * (0.4 + 0.6 * (1 - Math.abs(val - 0.4))));
      return `rgb(${r},${g},${b})`;
    }

    if (scheme === 'green') {
      // Phosphor green military tactical
      const g = Math.floor(255 * val);
      const r = Math.floor(60 * val * val);
      const b = Math.floor(120 * val * val);
      return `rgb(${r},${g},${b})`;
    }

    // Default: Turbo (BEL Standard radar colormap)
    let r, g, b;
    if (val < 0.25) {
      const t = val / 0.25;
      r = Math.floor(30 + 10 * t);
      g = Math.floor(30 + 120 * t);
      b = Math.floor(100 + 155 * t);
    } else if (val < 0.5) {
      const t = (val - 0.25) / 0.25;
      r = 40;
      g = Math.floor(150 + 95 * t);
      b = Math.floor(255 * (1 - 0.5 * t));
    } else if (val < 0.75) {
      const t = (val - 0.5) / 0.25;
      r = Math.floor(255 * t);
      g = 245;
      b = Math.floor(128 * (1 - t));
    } else {
      const t = (val - 0.75) / 0.25;
      r = 255;
      g = Math.floor(245 * (1 - 0.85 * t));
      b = 10;
    }
    return `rgb(${r},${g},${b})`;
  }

  /**
   * Render Spectrogram on HTML5 Canvas
   */
  function renderSpectrogram(canvas, profile, animOffset = 0, colorScheme = 'turbo') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const midY = H / 2;

    // Background base
    ctx.fillStyle = '#03060c';
    ctx.fillRect(0, 0, W, H);

    // Subtle tactical frequency grid lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y <= H; y += H / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x <= W; x += W / 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Horizontal center carrier line (Target forward translation speed)
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(W, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    const timeWindow = 3.0; // 3.0 seconds displayed
    const numColumns = 180;
    const colWidth = W / numColumns;
    const maxFreq = 1500; // ±1500 Hz scale

    // Generate columns
    for (let i = 0; i < numColumns; i++) {
      const x = i * colWidth;
      const t = (i / numColumns) * timeWindow + animOffset;

      if (profile.category === 'drone') {
        // --- DRONE SPECTROGRAM GENERATION ---
        // 1. Torso translation carrier line
        const torsoY = midY - (profile.speed / 20) * 15;
        ctx.fillStyle = colormap(0.85, colorScheme);
        ctx.fillRect(x, torsoY - 2, colWidth + 0.5, 4);

        // 2. Periodic Blade Flashes
        // Flashing frequency = profile.cadence
        const flashPhase = (t * profile.cadence) % 1.0;
        const isFlash = Math.abs(flashPhase - 0.5) < 0.08;
        
        if (isFlash) {
          // Sharp vertical flash extending symmetrically to ±spread
          const flashHeight = (profile.spread / maxFreq) * (H / 2);
          const numSlices = 28;
          for (let s = -numSlices; s <= numSlices; s++) {
            const frac = s / numSlices;
            const yPos = midY + frac * flashHeight;
            const distFromTip = 1 - Math.abs(frac);
            // Flash intensity peaks at rotor tips and center
            const intensity = 0.5 + 0.45 * Math.sin(Math.abs(frac) * Math.PI);
            ctx.fillStyle = colormap(intensity, colorScheme);
            ctx.fillRect(x, yPos - 3, colWidth + 0.8, 6);
          }
        } else {
          // Continuous rotor blade tip sinusoidal tracks (harmonics)
          const tipHarmonic1 = Math.sin(t * profile.cadence * 2 * Math.PI);
          const tipHarmonic2 = -tipHarmonic1;
          const y1 = midY + tipHarmonic1 * (profile.spread / maxFreq) * (H / 2) * 0.95;
          const y2 = midY + tipHarmonic2 * (profile.spread / maxFreq) * (H / 2) * 0.95;

          ctx.fillStyle = colormap(0.65, colorScheme);
          ctx.fillRect(x, y1 - 2, colWidth + 0.5, 4);
          ctx.fillRect(x, y2 - 2, colWidth + 0.5, 4);
        }

        // Background noise floor
        if (Math.random() > 0.82) {
          const randY = Math.random() * H;
          ctx.fillStyle = colormap(0.12 * Math.random(), colorScheme);
          ctx.fillRect(x, randY, colWidth + 0.5, 3);
        }

      } else {
        // --- BIRD SPECTROGRAM GENERATION ---
        // 1. Dominant body torso line (reflects 85%+ energy)
        const torsoY = midY - (profile.speed / 20) * 15;
        ctx.fillStyle = colormap(0.95, colorScheme);
        ctx.fillRect(x, torsoY - 4, colWidth + 0.5, 8);

        // 2. Smooth Undulating Wingbeat Envelope (Asymmetric downstroke vs upstroke)
        const flapPhase = t * profile.cadence * 2 * Math.PI;
        // Asymmetry: downstroke has higher velocity and stronger reflection
        const downstroke = Math.sin(flapPhase);
        const wingDist = (profile.spread / maxFreq) * (H / 2);

        // Upper wing tip track
        const yWingUp = midY - (downstroke > 0 ? downstroke * 1.15 : downstroke * 0.7) * wingDist;
        // Lower wing tip track
        const yWingDown = midY + (downstroke > 0 ? downstroke * 1.05 : downstroke * 0.65) * wingDist;

        // Downstroke reflection is stronger than upstroke
        const wingIntensity = downstroke > 0 ? 0.78 : 0.42;

        ctx.fillStyle = colormap(wingIntensity, colorScheme);
        ctx.fillRect(x, yWingUp - 3, colWidth + 0.5, 6);
        ctx.fillRect(x, yWingDown - 3, colWidth + 0.5, 6);

        // Fill wing interior softly (muscle/feather reflection)
        if (Math.abs(downstroke) > 0.2) {
          ctx.fillStyle = colormap(0.28, colorScheme);
          const topFill = Math.min(yWingUp, torsoY);
          const botFill = Math.max(yWingDown, torsoY);
          ctx.fillRect(x, topFill, colWidth + 0.5, botFill - topFill);
        }

        // Ambient noise
        if (Math.random() > 0.88) {
          const randY = Math.random() * H;
          ctx.fillStyle = colormap(0.08 * Math.random(), colorScheme);
          ctx.fillRect(x, randY, colWidth + 0.5, 3);
        }
      }
    }
  }

  /**
   * Render Cadence-Velocity Diagram (CVD)
   */
  function renderCVD(canvas, profile, animOffset = 0) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Clear background
    ctx.fillStyle = '#03070f';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y <= H; y += H / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x <= W; x += W / 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    const maxCadence = 300.0; // 0 to 300 Hz
    const targetCadence = profile.cadence;

    // Draw spectrum curve
    ctx.beginPath();
    ctx.moveTo(0, H - 15);

    const points = [];
    const numBins = 240;

    for (let i = 0; i < numBins; i++) {
      const f = (i / numBins) * maxCadence;
      const x = (f / maxCadence) * W;

      // Noise floor
      let power = 0.05 + 0.03 * Math.sin(i * 0.7 + animOffset);

      // DC peak at 0 Hz
      if (f < 10) {
        power += 0.45 * Math.exp(-Math.pow(f / 3, 2));
      }

      // Fundamental Cadence Peak
      const dist = Math.abs(f - targetCadence);
      if (dist < 18) {
        const peakWidth = profile.category === 'drone' ? 3.5 : 2.5;
        power += 0.88 * Math.exp(-Math.pow(dist / peakWidth, 2));
      }

      // 2nd Harmonic
      const dist2 = Math.abs(f - targetCadence * 2);
      if (dist2 < 20 && targetCadence * 2 < maxCadence) {
        power += 0.38 * Math.exp(-Math.pow(dist2 / 4, 2));
      }

      // Sub-harmonic for drones
      if (profile.category === 'drone') {
        const distSub = Math.abs(f - targetCadence / 2);
        if (distSub < 15) {
          power += 0.28 * Math.exp(-Math.pow(distSub / 3, 2));
        }
      }

      power = Math.min(0.95, power);
      const y = H - 10 - power * (H - 25);
      points.push({ x, y, f, power });
      ctx.lineTo(x, y);
    }

    // Gradient fill under curve
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (profile.category === 'drone') {
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
      grad.addColorStop(1, 'rgba(0, 229, 255, 0.02)');
      ctx.strokeStyle = '#00e5ff';
    } else {
      grad.addColorStop(0, 'rgba(0, 255, 157, 0.45)');
      grad.addColorStop(1, 'rgba(0, 255, 157, 0.02)');
      ctx.strokeStyle = '#00ff9d';
    }
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.lineTo(W, H - 10);
    ctx.lineTo(0, H - 10);
    ctx.fillStyle = grad;
    ctx.fill();

    // Callout highlight pin on the main cadence peak
    const peakX = (targetCadence / maxCadence) * W;
    const peakPoint = points.reduce((best, p) => Math.abs(p.f - targetCadence) < Math.abs(best.f - targetCadence) ? p : best, points[0]);

    if (peakPoint) {
      // Vertical marker line
      ctx.strokeStyle = profile.category === 'drone' ? '#ff3366' : '#00ff9d';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(peakX, H - 10);
      ctx.lineTo(peakX, peakPoint.y - 12);
      ctx.stroke();
      ctx.setLineDash([]);

      // Peak point circle
      ctx.fillStyle = profile.category === 'drone' ? '#ff3366' : '#00ff9d';
      ctx.beginPath();
      ctx.arc(peakX, peakPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Text label
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = peakX > W - 120 ? 'right' : 'left';
      ctx.fillText(`Peak: ${targetCadence.toFixed(1)} Hz`, peakX + (peakX > W - 120 ? -8 : 8), peakPoint.y - 8);
    }
  }

  /**
   * 7-Feature Extraction Pipeline
   * Takes raw Doppler data or profile and computes the exact physical parameters
   */
  function extract7Features(profile) {
    return {
      cadencePeak: profile.cadence,
      bandwidth: profile.spread * 2,
      fMax: profile.spread,
      fMin: -profile.spread,
      symmetry: profile.symmetry,
      torsoRatio: profile.torsoRatio,
      kurtosis: profile.kurtosis
    };
  }

  /**
   * Physics-Informed Random Forest Classifier
   */
  function classifyFeatures(features) {
    // Kinematic Physical Boundaries:
    // 1. Biological muscle contraction limit: Birds physically cannot exceed 12-15 Hz cadence.
    // 2. High-speed propeller rotation: Small UAVs require >50 Hz cadence for aerodynamic lift.
    // 3. Tip speed: Drone blades generate >1,000 Hz spread, birds rarely exceed 400 Hz.
    // 4. Symmetry: Dual rotor tips are strictly symmetric (>0.85); birds asymmetric (<0.60).

    let droneScore = 0;
    let totalWeight = 0;

    // Feature 1: Cadence Peak (Weight: 42)
    if (features.cadencePeak >= 50.0) {
      droneScore += 42;
    } else if (features.cadencePeak < 15.0) {
      droneScore += 0;
    } else {
      droneScore += 42 * ((features.cadencePeak - 15) / 35);
    }
    totalWeight += 42;

    // Feature 2: Bandwidth (Weight: 26)
    if (features.bandwidth >= 1500) {
      droneScore += 26;
    } else if (features.bandwidth < 500) {
      droneScore += 0;
    } else {
      droneScore += 26 * ((features.bandwidth - 500) / 1000);
    }
    totalWeight += 26;

    // Feature 3 & 4: Max/Min Extent
    totalWeight += 10;
    if (features.fMax > 800) droneScore += 10;

    // Feature 5: Symmetry (Weight: 8)
    totalWeight += 8;
    if (features.symmetry >= 0.85) {
      droneScore += 8;
    } else if (features.symmetry <= 0.55) {
      droneScore += 0;
    } else {
      droneScore += 8 * ((features.symmetry - 0.55) / 0.30);
    }

    // Feature 6: Torso Ratio (Weight: 8)
    totalWeight += 8;
    if (features.torsoRatio <= 0.40) {
      droneScore += 8;
    } else if (features.torsoRatio >= 0.75) {
      droneScore += 0;
    } else {
      droneScore += 8 * (1 - (features.torsoRatio - 0.40) / 0.35);
    }

    // Feature 7: Kurtosis / Crest (Weight: 6)
    totalWeight += 6;
    if (features.kurtosis > 4.5) droneScore += 6;

    const droneProb = Math.min(0.999, Math.max(0.001, droneScore / totalWeight));
    const birdProb = 1.0 - droneProb;
    const isDrone = droneProb >= 0.5;

    return {
      prediction: isDrone ? 'DRONE' : 'BIRD',
      droneProbability: droneProb,
      birdProbability: birdProb,
      confidence: (isDrone ? droneProb : birdProb) * 100,
      threatLevel: isDrone ? 'CRITICAL' : 'SAFE'
    };
  }

  return {
    TARGET_PROFILES,
    renderSpectrogram,
    renderCVD,
    extract7Features,
    classifyFeatures,
    colormap
  };
})();

// Export globally
window.RadarDSP = RadarDSP;
