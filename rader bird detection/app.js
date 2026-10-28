/**
 * BEL PROBLEM 1606 - AIR SURVEILLANCE & TARGET DISCRIMINATION SYSTEM
 * Main Application Orchestrator & UI Controller
 */

(function() {
  'use strict';

  // State
  let currentTargetId = 'quadcopter';
  let currentProfile = RadarDSP.TARGET_PROFILES.quadcopter;
  let isSpecPaused = false;
  let specAnimOffset = 0;
  let specColormap = 'turbo';

  // DOM Elements
  const zuluClock = document.getElementById('zuluClock');
  const presetButtons = document.querySelectorAll('.preset-card');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Canvases
  const specCanvas = document.getElementById('spectrogramCanvas');
  const cvdCanvas = document.getElementById('cvdCanvas');
  const oscCanvas = document.getElementById('oscilloscopeCanvas');
  const ppiCanvas = document.getElementById('ppiCanvas');

  // Spectrogram Controls
  const toggleSpecAnimBtn = document.getElementById('toggleSpecAnimBtn');
  const specColormapSelect = document.getElementById('specColormapSelect');
  const annBadge = document.getElementById('annBadge');
  const annDesc = document.getElementById('annDesc');

  // CVD Elements
  const cadenceVal = document.getElementById('cadenceVal');
  const cadenceInterp = document.getElementById('cadenceInterp');

  // Audio Elements
  const audioPlayBtn = document.getElementById('audioPlayBtn');
  const playIcon = document.getElementById('playIcon');
  const playText = document.getElementById('playText');
  const audioVolume = document.getElementById('audioVolume');
  const audioModeTag = document.getElementById('audioModeTag');
  const audioFreqTag = document.getElementById('audioFreqTag');

  // PPI Telemetry Overlay
  const ppiRange = document.getElementById('ppiRange');
  const ppiBearing = document.getElementById('ppiBearing');
  const ppiAlt = document.getElementById('ppiAlt');
  const ppiSpeed = document.getElementById('ppiSpeed');

  // Classification Card Elements
  const threatBanner = document.getElementById('threatBanner');
  const threatText = document.getElementById('threatText');
  const targetNameText = document.getElementById('targetNameText');
  const targetSubText = document.getElementById('targetSubText');
  const confidenceBadge = document.getElementById('confidenceBadge');
  const droneProbVal = document.getElementById('droneProbVal');
  const droneProbBar = document.getElementById('droneProbBar');
  const birdProbVal = document.getElementById('birdProbVal');
  const birdProbBar = document.getElementById('birdProbBar');
  const mRcs = document.getElementById('mRcs');
  const mCadence = document.getElementById('mCadence');
  const mSpread = document.getElementById('mSpread');
  const mSymmetry = document.getElementById('mSymmetry');
  const actionTitle = document.getElementById('actionTitle');
  const actionBody = document.getElementById('actionBody');

  // Feature Table Elements (Tab 3)
  const f_cadence = document.getElementById('f_cadence');
  const f_bw = document.getElementById('f_bw');
  const f_fmax = document.getElementById('f_fmax');
  const f_fmin = document.getElementById('f_fmin');
  const f_symm = document.getElementById('f_symm');
  const f_torso = document.getElementById('f_torso');
  const f_kurt = document.getElementById('f_kurt');

  // Printable Report Elements (Tab 4)
  const repTimestamp = document.getElementById('repTimestamp');
  const repTrackId = document.getElementById('repTrackId');
  const repRangeBearing = document.getElementById('repRangeBearing');
  const repSpeed = document.getElementById('repSpeed');
  const repRcs = document.getElementById('repRcs');
  const repCadence = document.getElementById('repCadence');
  const repCadenceInterp = document.getElementById('repCadenceInterp');
  const repBw = document.getElementById('repBw');
  const repSymm = document.getElementById('repSymm');
  const repTorso = document.getElementById('repTorso');
  const repVerdictResult = document.getElementById('repVerdictResult');
  const repVerdictConf = document.getElementById('repVerdictConf');
  const repVerdictDesc = document.getElementById('repVerdictDesc');
  const repVerdictDirective = document.getElementById('repVerdictDirective');
  const printReportBtn = document.getElementById('printReportBtn');

  // Ingestion Elements (Tab 3)
  const radarDropZone = document.getElementById('radarDropZone');
  const radarFileInput = document.getElementById('radarFileInput');
  const fileStatusBar = document.getElementById('fileStatusBar');
  const loadedFileName = document.getElementById('loadedFileName');
  const loadedFileSize = document.getElementById('loadedFileSize');

  // Guide Modal Elements
  const guideModal = document.getElementById('guideModal');
  const guideModalBtn = document.getElementById('guideModalBtn');
  const closeGuideModalBtn = document.getElementById('closeGuideModalBtn');
  const guideModalBackdrop = document.getElementById('guideModalBackdrop');

  /**
   * Initialize System
   */
  function init() {
    startZuluClock();
    setupPresets();
    setupTabs();
    setupAudioControls();
    setupSpectrogramControls();
    setupDataIngestion();
    setupBenchmarkLibrary();
    setupPrintReport();
    setupGuideModal();

    // Initialize Tactical PPI Scope
    if (ppiCanvas) {
      TacticalPPIScope.init(ppiCanvas, currentProfile);
    }

    // Initialize Oscilloscope
    if (oscCanvas) {
      AudioDopplerSynth.startOscilloscope(oscCanvas);
    }

    // Start 60 FPS Spectrogram & CVD Animation Loop
    startDspRenderLoop();

    // Initial update of all UI modules to Quadcopter
    selectTarget('quadcopter');
  }

  /**
   * Live Zulu Clock (Military UTC)
   */
  function startZuluClock() {
    function updateClock() {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      
      const timeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
      if (zuluClock) zuluClock.textContent = timeStr;
      if (repTimestamp) repTimestamp.textContent = timeStr;
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  /**
   * Preset Target Selection
   */
  function setupPresets() {
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetKey = btn.dataset.target;
        selectTarget(targetKey);
      });
    });
  }

  function selectTarget(targetKey) {
    if (!RadarDSP.TARGET_PROFILES[targetKey]) return;

    currentTargetId = targetKey;
    currentProfile = RadarDSP.TARGET_PROFILES[targetKey];

    // Update active preset button highlight
    presetButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === targetKey);
    });

    // Update Spectrogram Annotation
    if (annBadge) annBadge.textContent = currentProfile.annotationBadge;
    if (annDesc) annDesc.textContent = currentProfile.annotationDesc;

    // Update CVD Callout
    if (cadenceVal) cadenceVal.textContent = `${currentProfile.cadence.toFixed(1)} Hz`;
    if (cadenceInterp) cadenceInterp.textContent = currentProfile.cadenceInterp;

    // Update Tactical PPI Scope
    TacticalPPIScope.setTarget(currentProfile);

    // Update PPI Telemetry readout
    if (ppiRange) ppiRange.textContent = `${currentProfile.range.toLocaleString()} m`;
    if (ppiBearing) ppiBearing.textContent = `${String(currentProfile.bearing).padStart(3, '0')}°`;
    if (ppiAlt) ppiAlt.textContent = `${currentProfile.alt} m`;
    if (ppiSpeed) ppiSpeed.textContent = `${currentProfile.speed.toFixed(1)} m/s`;

    // Update AI Classification Card
    updateClassificationCard(currentProfile);

    // Update Audio Synthesis if currently playing
    if (AudioDopplerSynth.getIsPlaying()) {
      AudioDopplerSynth.start(currentProfile);
    }
    updateAudioTags(currentProfile);

    // Update Tab 3 Feature Extraction Table
    updateFeatureTable(currentProfile);

    // Update Tab 4 Defense Intelligence Report
    updateDefenseReport(currentProfile);
  }

  /**
   * Update AI Classification Card
   */
  function updateClassificationCard(profile) {
    const isDrone = profile.category === 'drone';

    // Threat Banner
    if (threatBanner) {
      threatBanner.className = `threat-banner ${isDrone ? 'critical' : 'safe'}`;
      if (threatText) {
        threatText.textContent = isDrone ? `THREAT LEVEL: ${profile.threat}` : 'THREAT LEVEL: SAFE / BIOLOGICAL';
      }
    }

    // Target Name & Confidence
    if (targetNameText) {
      targetNameText.textContent = isDrone ? `DRONE [${profile.name.split(' ')[0]}]` : `BIRD [${profile.name.split(' ')[0]}]`;
    }
    if (confidenceBadge) {
      confidenceBadge.textContent = `${profile.confidence.toFixed(1)}%`;
    }
    if (targetSubText) {
      targetSubText.textContent = profile.annotationDesc;
    }

    // Probability Bars
    const dronePct = isDrone ? profile.confidence : (100 - profile.confidence);
    const birdPct = 100 - dronePct;

    if (droneProbVal) droneProbVal.textContent = `${dronePct.toFixed(1)}%`;
    if (droneProbBar) droneProbBar.style.width = `${dronePct}%`;

    if (birdProbVal) birdProbVal.textContent = `${birdPct.toFixed(1)}%`;
    if (birdProbBar) birdProbBar.style.width = `${birdPct}%`;

    // Telemetry Grid
    if (mRcs) mRcs.textContent = `${profile.rcs.toFixed(3)} m²`;
    if (mCadence) mCadence.textContent = `${profile.cadence.toFixed(1)} Hz`;
    if (mSpread) mSpread.textContent = `±${profile.spread.toLocaleString()} Hz`;
    if (mSymmetry) mSymmetry.textContent = `${profile.symmetry.toFixed(2)} (${isDrone ? 'High' : 'Low'})`;

    // Automated Countermeasure Recommendation
    if (actionTitle) {
      actionTitle.textContent = isDrone ? 'AUTOMATED C-UAS COUNTERMEASURE AUTHORIZED' : 'AUTOMATED ALARM SUPPRESSION ACTIVE';
    }
    if (actionBody) {
      actionBody.textContent = profile.action;
    }
  }

  /**
   * Update Audio Tags
   */
  function updateAudioTags(profile) {
    if (profile.category === 'drone') {
      if (audioModeTag) audioModeTag.textContent = `ACOUSTIC SYNTHESIS: DRONE HIGH-SPEED MOTOR & ROTOR CHOP`;
      if (audioFreqTag) audioFreqTag.textContent = `CARRIER: ${(500 + (profile.rpm / 8400) * 450).toFixed(0)} Hz • CHOP: ${profile.cadence.toFixed(1)} Hz`;
    } else {
      if (audioModeTag) audioModeTag.textContent = `ACOUSTIC SYNTHESIS: BIOLOGICAL FLAPPING WINGBEAT WHOOSH`;
      if (audioFreqTag) audioFreqTag.textContent = `BANDPASS: 280 Hz • WINGBEAT RATE: ${profile.cadence.toFixed(1)} Hz`;
    }
  }

  /**
   * Update Feature Extraction Table (Tab 3)
   */
  function updateFeatureTable(profile) {
    if (f_cadence) f_cadence.textContent = `${profile.cadence.toFixed(1)} Hz`;
    if (f_bw) f_bw.textContent = `${(profile.spread * 2).toLocaleString()} Hz`;
    if (f_fmax) f_fmax.textContent = `+${profile.spread.toLocaleString()} Hz`;
    if (f_fmin) f_fmin.textContent = `-${profile.spread.toLocaleString()} Hz`;
    if (f_symm) f_symm.textContent = profile.symmetry.toFixed(2);
    if (f_torso) f_torso.textContent = profile.torsoRatio.toFixed(2);
    if (f_kurt) f_kurt.textContent = profile.kurtosis.toFixed(2);
  }

  /**
   * Update Defense Intelligence Report (Tab 4)
   */
  function updateDefenseReport(profile) {
    const isDrone = profile.category === 'drone';

    if (repTrackId) repTrackId.textContent = isDrone ? 'TRK-2026-0492' : 'TRK-2026-0814';
    if (repRangeBearing) repRangeBearing.textContent = `${profile.range.toLocaleString()} m @ ${String(profile.bearing).padStart(3, '0')}° Azimuth`;
    if (repSpeed) repSpeed.textContent = `${profile.speed.toFixed(1)} m/s (${(profile.speed * 3.6).toFixed(1)} km/h)`;
    if (repRcs) repRcs.innerHTML = `${profile.rcs.toFixed(3)} m&sup2; (-16.8 dBsm)`;
    if (repCadence) repCadence.textContent = `${profile.cadence.toFixed(1)} Hz`;
    if (repCadenceInterp) {
      repCadenceInterp.textContent = isDrone ? 'CONFIRMED ROTARY BLADE CHOPPING RATE' : 'CONFIRMED BIOLOGICAL WING FLAP RHYTHM';
      repCadenceInterp.className = isDrone ? 'text-critical' : 'text-alert';
    }
    if (repBw) repBw.innerHTML = `&plusmn;${profile.spread.toLocaleString()} Hz (${(profile.spread * 2).toLocaleString()} Hz span)`;
    if (repSymm) repSymm.textContent = `${profile.symmetry.toFixed(2)} (${isDrone ? 'High Rotor Symmetry' : 'Asymmetric Biological'})`;
    if (repTorso) repTorso.textContent = `${profile.torsoRatio.toFixed(2)} (${isDrone ? 'Rotor Dominant' : 'Torso Dominant'})`;

    if (repVerdictResult) {
      repVerdictResult.textContent = isDrone ? `TARGET CONFIRMED AS DRONE [${profile.name}]` : `TARGET CONFIRMED AS BIOLOGICAL BIRD [${profile.name}]`;
    }
    if (repVerdictConf) repVerdictConf.textContent = `CONFIDENCE: ${profile.confidence.toFixed(1)}%`;
    if (repVerdictDesc) {
      repVerdictDesc.textContent = isDrone
        ? `Kinematic micro-Doppler feature decomposition isolates high-speed rotor chop frequencies (${profile.cadence.toFixed(1)} Hz) and wide Doppler tip velocity spread (±${profile.spread.toLocaleString()} Hz), conclusively ruling out biological avian flight. Target exhibits an active tactical UAV profile.`
        : `Kinematic micro-Doppler feature decomposition reveals smooth biological flapping frequencies (${profile.cadence.toFixed(1)} Hz) and narrow Doppler bandwidth (±${profile.spread.toLocaleString()} Hz) with dominant torso radar cross-section. Conclusively verified as non-hostile avian fauna.`;
    }
    if (repVerdictDirective) {
      repVerdictDirective.textContent = isDrone
        ? 'ENGAGE COUNTER-UAS PROTOCOL 4A: AUTHORIZE DIRECTED RF ELECTRONIC JAMMING (2.4/5.8 GHz) & GNSS SPOOFING.'
        : 'ENGAGE ALARM SUPPRESSION PROTOCOL: MUTE AUDIBLE COMBAT SIRENS, LOG TRACK IN ECOLOGICAL TELEMETRY, PREVENT OPERATOR FATIGUE.';
    }
  }

  /**
   * Navigation Tabs Switching
   */
  function setupTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.dataset.tab;

        tabButtons.forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });

        tabPanes.forEach(pane => {
          pane.classList.toggle('active', pane.id === targetTabId);
        });
      });
    });
  }

  /**
   * Spectrogram & CVD 60 FPS Render Loop
   */
  function startDspRenderLoop() {
    function renderLoop() {
      if (!isSpecPaused) {
        specAnimOffset += 0.018; // smooth timeline progression
      }

      if (specCanvas && specCanvas.offsetParent !== null) {
        RadarDSP.renderSpectrogram(specCanvas, currentProfile, specAnimOffset, specColormap);
      }

      if (cvdCanvas && cvdCanvas.offsetParent !== null) {
        RadarDSP.renderCVD(cvdCanvas, currentProfile, specAnimOffset);
      }

      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
  }

  /**
   * Spectrogram Controls
   */
  function setupSpectrogramControls() {
    if (toggleSpecAnimBtn) {
      toggleSpecAnimBtn.addEventListener('click', () => {
        isSpecPaused = !isSpecPaused;
        toggleSpecAnimBtn.textContent = isSpecPaused ? '▶️ Resume' : '⏸️ Pause';
      });
    }

    if (specColormapSelect) {
      specColormapSelect.addEventListener('change', (e) => {
        specColormap = e.target.value;
      });
    }
  }

  /**
   * Doppler Audio Controls
   */
  function setupAudioControls() {
    if (audioPlayBtn) {
      audioPlayBtn.addEventListener('click', () => {
        const currentlyPlaying = AudioDopplerSynth.getIsPlaying();
        if (currentlyPlaying) {
          AudioDopplerSynth.stop();
          audioPlayBtn.classList.remove('playing');
          if (playIcon) playIcon.textContent = '▶';
          if (playText) playText.textContent = 'PLAY RADAR DOPPLER AUDIO';
        } else {
          AudioDopplerSynth.start(currentProfile);
          audioPlayBtn.classList.add('playing');
          if (playIcon) playIcon.textContent = '⏸';
          if (playText) playText.textContent = 'STOP RADAR DOPPLER AUDIO';
        }
      });
    }

    if (audioVolume) {
      audioVolume.addEventListener('input', (e) => {
        AudioDopplerSynth.setVolume(parseFloat(e.target.value));
      });
    }
  }

  /**
   * Data Ingestion Drag-and-Drop (Tab 3)
   */
  function setupDataIngestion() {
    if (!radarDropZone || !radarFileInput) return;

    radarDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      radarDropZone.classList.add('dragover');
    });

    radarDropZone.addEventListener('dragleave', () => {
      radarDropZone.classList.remove('dragover');
    });

    radarDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      radarDropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUploadedFile(e.dataTransfer.files[0]);
      }
    });

    radarFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleUploadedFile(e.target.files[0]);
      }
    });
  }

  function handleUploadedFile(file) {
    if (!file) return;

    if (fileStatusBar) fileStatusBar.style.display = 'flex';
    if (loadedFileName) loadedFileName.textContent = file.name;
    if (loadedFileSize) loadedFileSize.textContent = `(${(file.size / 1024).toFixed(1)} KB)`;

    // Check if file name hints at drone vs bird
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('bird') || lowerName.includes('pigeon') || lowerName.includes('eagle') || lowerName.includes('seagull')) {
      selectTarget('pigeon');
    } else {
      selectTarget('quadcopter');
    }
  }

  /**
   * Benchmark Library Buttons (Tab 3)
   */
  function setupBenchmarkLibrary() {
    // Ingest & Test buttons
    const testBtns = document.querySelectorAll('.btn-test-sample');
    testBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sampleKey = btn.dataset.sample;
        const sample = BenchmarkDatasets.SAMPLES[sampleKey];
        if (sample) {
          selectTarget(sample.targetId);
          if (fileStatusBar) fileStatusBar.style.display = 'flex';
          if (loadedFileName) loadedFileName.textContent = sample.filename;
          if (loadedFileSize) loadedFileSize.textContent = '(142 KB)';

          // Flash button feedback
          const originalText = btn.textContent;
          btn.textContent = '✓ Ingested!';
          setTimeout(() => { btn.textContent = originalText; }, 1500);
        }
      });
    });

    // Download buttons
    const dlBtns = document.querySelectorAll('.btn-dl-sample');
    dlBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sampleKey = btn.dataset.sample;
        BenchmarkDatasets.downloadSampleCsv(sampleKey);
      });
    });
  }

  /**
   * Print Report (Tab 4)
   */
  function setupPrintReport() {
    if (printReportBtn) {
      printReportBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  /**
   * Presenter Script Guide Modal
   */
  function setupGuideModal() {
    function openGuide() {
      if (guideModal) {
        guideModal.classList.add('open');
        guideModal.setAttribute('aria-hidden', 'false');
      }
    }

    function closeGuide() {
      if (guideModal) {
        guideModal.classList.remove('open');
        guideModal.setAttribute('aria-hidden', 'true');
      }
    }

    if (guideModalBtn) guideModalBtn.addEventListener('click', openGuide);
    if (closeGuideModalBtn) closeGuideModalBtn.addEventListener('click', closeGuide);
    if (guideModalBackdrop) guideModalBackdrop.addEventListener('click', closeGuide);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && guideModal && guideModal.classList.contains('open')) {
        closeGuide();
      }
    });
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
