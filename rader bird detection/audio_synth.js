/**
 * BEL PROBLEM 1606 - ACOUSTIC DOPPLER SONIFICATION & LIVE OSCILLOSCOPE
 * Web Audio API Synthesis: Drone High-Speed Motor Whine vs Bird Wingbeat Whoosh
 */

const AudioDopplerSynth = (function() {
  'use strict';

  let audioCtx = null;
  let masterGain = null;
  let analyserNode = null;
  let isPlaying = false;
  let currentTargetId = 'quadcopter';

  // Sound generator nodes
  let droneOsc1 = null;
  let droneOsc2 = null;
  let droneModOsc = null;
  let droneModGain = null;

  let birdNoiseNode = null;
  let birdFilterNode = null;
  let birdGainMod = null;
  let birdLfo = null;
  let birdLfoGain = null;

  let animFrameId = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 512;

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.75, audioCtx.currentTime);

      masterGain.connect(analyserNode);
      analyserNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  /**
   * Start Acoustic Doppler Synthesis
   */
  function start(targetProfile) {
    initAudioContext();
    stop(); // stop any currently active nodes

    currentTargetId = targetProfile.id;
    const now = audioCtx.currentTime;

    if (targetProfile.category === 'drone') {
      // --- DRONE ACOUSTIC GENERATOR ---
      // Primary carrier motor whine (750 - 950 Hz depending on RPM)
      const carrierFreq = 500 + (targetProfile.rpm / 8400) * 450;
      
      droneOsc1 = audioCtx.createOscillator();
      droneOsc1.type = 'sawtooth';
      droneOsc1.frequency.setValueAtTime(carrierFreq, now);

      droneOsc2 = audioCtx.createOscillator();
      droneOsc2.type = 'sine';
      droneOsc2.frequency.setValueAtTime(carrierFreq * 1.5, now);

      // Blade chopping frequency modulator (e.g. 170 Hz)
      droneModOsc = audioCtx.createOscillator();
      droneModOsc.type = 'square';
      droneModOsc.frequency.setValueAtTime(targetProfile.cadence, now);

      droneModGain = audioCtx.createGain();
      droneModGain.gain.setValueAtTime(carrierFreq * 0.35, now);

      droneModOsc.connect(droneModGain);
      droneModGain.connect(droneOsc1.frequency);

      // Low pass filter to simulate radar receiver heterodyne audio band
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);

      const droneLevel = audioCtx.createGain();
      droneLevel.gain.setValueAtTime(0.001, now);
      droneLevel.gain.exponentialRampToValueAtTime(0.28, now + 0.1);

      droneOsc1.connect(filter);
      droneOsc2.connect(filter);
      filter.connect(droneLevel);
      droneLevel.connect(masterGain);

      droneModOsc.start(now);
      droneOsc1.start(now);
      droneOsc2.start(now);

      isPlaying = true;

    } else {
      // --- BIRD ACOUSTIC GENERATOR (WING WHOOSH) ---
      // 1. Generate Organic Pink/White Noise Buffer
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      birdNoiseNode = audioCtx.createBufferSource();
      birdNoiseNode.buffer = noiseBuffer;
      birdNoiseNode.loop = true;

      // Bandpass filter centered at biological whoosh frequency
      birdFilterNode = audioCtx.createBiquadFilter();
      birdFilterNode.type = 'bandpass';
      birdFilterNode.frequency.setValueAtTime(280, now);
      birdFilterNode.Q.setValueAtTime(2.2, now);

      // Low Frequency Oscillator for biological wingbeat rhythm (e.g. 5.8 Hz)
      birdLfo = audioCtx.createOscillator();
      birdLfo.type = 'sine';
      birdLfo.frequency.setValueAtTime(targetProfile.cadence, now);

      birdLfoGain = audioCtx.createGain();
      birdLfoGain.gain.setValueAtTime(0.45, now);

      birdGainMod = audioCtx.createGain();
      birdGainMod.gain.setValueAtTime(0.45, now);

      birdLfo.connect(birdLfoGain);
      birdLfoGain.connect(birdGainMod.gain);

      const birdLevel = audioCtx.createGain();
      birdLevel.gain.setValueAtTime(0.001, now);
      birdLevel.gain.exponentialRampToValueAtTime(0.65, now + 0.1);

      birdNoiseNode.connect(birdFilterNode);
      birdFilterNode.connect(birdGainMod);
      birdGainMod.connect(birdLevel);
      birdLevel.connect(masterGain);

      birdNoiseNode.start(now);
      birdLfo.start(now);

      isPlaying = true;
    }
  }

  /**
   * Stop Acoustic Doppler Synthesis
   */
  function stop() {
    if (audioCtx) {
      try {
        if (droneOsc1) { droneOsc1.stop(); droneOsc1.disconnect(); droneOsc1 = null; }
        if (droneOsc2) { droneOsc2.stop(); droneOsc2.disconnect(); droneOsc2 = null; }
        if (droneModOsc) { droneModOsc.stop(); droneModOsc.disconnect(); droneModOsc = null; }

        if (birdNoiseNode) { birdNoiseNode.stop(); birdNoiseNode.disconnect(); birdNoiseNode = null; }
        if (birdLfo) { birdLfo.stop(); birdLfo.disconnect(); birdLfo = null; }
      } catch (e) {
        // Ignore stop on already stopped node
      }
    }
    isPlaying = false;
  }

  function setVolume(val) {
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), audioCtx.currentTime);
    }
  }

  function getIsPlaying() {
    return isPlaying;
  }

  /**
   * Render Live Oscilloscope on Canvas
   */
  function startOscilloscope(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 256;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animFrameId = requestAnimationFrame(draw);

      const W = canvas.width;
      const H = canvas.height;
      const midY = H / 2;

      ctx.fillStyle = '#02060b';
      ctx.fillRect(0, 0, W, H);

      // Oscilloscope grid lines
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(W, midY);
      ctx.stroke();

      for (let x = 0; x <= W; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      if (isPlaying && analyserNode) {
        analyserNode.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00ff9d';
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = W / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * (H / 2);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(W, midY);
        ctx.stroke();
        ctx.shadowBlur = 0;

      } else {
        // Idle baseline with gentle tactical ambient trace
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 255, 157, 0.45)';
        ctx.beginPath();
        const time = Date.now() * 0.003;
        for (let x = 0; x < W; x += 3) {
          const y = midY + Math.sin(x * 0.03 + time) * 1.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    draw();
  }

  return {
    start,
    stop,
    setVolume,
    getIsPlaying,
    startOscilloscope
  };
})();

// Export globally
window.AudioDopplerSynth = AudioDopplerSynth;
