/**
 * BEL PROBLEM 1606 - BENCHMARK RADAR I/Q DATASETS & SAMPLE GENERATOR
 * Pre-compiled ground-truth radar test files and CSV exporter
 */

const BenchmarkDatasets = (function() {
  'use strict';

  // Ground Truth Benchmark Samples
  const SAMPLES = {
    quadcopter_phantom4: {
      key: 'quadcopter_phantom4',
      filename: 'quadcopter_phantom4_xband.iq.csv',
      targetId: 'quadcopter',
      category: 'drone',
      title: 'Quadcopter (DJI Phantom 4)',
      radarBand: 'X-Band 10 GHz',
      snr: '18 dB',
      range: '1,420 m',
      cadence: 170.0,
      bandwidth: 2960,
      fMax: 1480,
      fMin: -1480,
      symmetry: 0.96,
      torsoRatio: 0.28,
      kurtosis: 6.84,
      rcs: 0.021
    },
    hexacopter_carbon: {
      key: 'hexacopter_carbon',
      filename: 'hexacopter_heavy_carbon.iq.csv',
      targetId: 'hexacopter',
      category: 'drone',
      title: 'Hexacopter Heavy UAV',
      radarBand: 'X-Band 10 GHz',
      snr: '22 dB',
      range: '1,180 m',
      cadence: 210.0,
      bandwidth: 3640,
      fMax: 1820,
      fMin: -1820,
      symmetry: 0.95,
      torsoRatio: 0.24,
      kurtosis: 7.21,
      rcs: 0.038
    },
    microuav_recon: {
      key: 'microuav_recon',
      filename: 'microuav_nano_recon.iq.csv',
      targetId: 'microuav',
      category: 'drone',
      title: 'Micro-UAV Nano Reconnaissance',
      radarBand: 'X-Band 10 GHz',
      snr: '12 dB',
      range: '640 m',
      cadence: 280.0,
      bandwidth: 1840,
      fMax: 920,
      fMin: -920,
      symmetry: 0.93,
      torsoRatio: 0.32,
      kurtosis: 5.92,
      rcs: 0.008
    },
    columba_pigeon: {
      key: 'columba_pigeon',
      filename: 'columba_livia_pigeon_test.iq.csv',
      targetId: 'pigeon',
      category: 'bird',
      title: 'Pigeon (Columba livia)',
      radarBand: 'X-Band 10 GHz',
      snr: '15 dB',
      range: '1,250 m',
      cadence: 5.8,
      bandwidth: 360,
      fMax: 180,
      fMin: -180,
      symmetry: 0.38,
      torsoRatio: 0.88,
      kurtosis: 2.15,
      rcs: 0.020
    },
    golden_eagle: {
      key: 'golden_eagle',
      filename: 'golden_eagle_gliding_dive.iq.csv',
      targetId: 'eagle',
      category: 'bird',
      title: 'Golden Eagle (Aquila chrysaetos)',
      radarBand: 'X-Band 10 GHz',
      snr: '20 dB',
      range: '2,100 m',
      cadence: 3.2,
      bandwidth: 480,
      fMax: 240,
      fMin: -240,
      symmetry: 0.42,
      torsoRatio: 0.92,
      kurtosis: 2.40,
      rcs: 0.045
    },
    seagull_clutter: {
      key: 'seagull_clutter',
      filename: 'seagull_coastal_clutter.iq.csv',
      targetId: 'seagull',
      category: 'bird',
      title: 'Coastal Seagull',
      radarBand: 'X-Band 10 GHz',
      snr: '14 dB',
      range: '890 m',
      cadence: 4.1,
      bandwidth: 320,
      fMax: 160,
      fMin: -160,
      symmetry: 0.35,
      torsoRatio: 0.85,
      kurtosis: 1.95,
      rcs: 0.022
    }
  };

  /**
   * Generate Synthetic CSV I/Q Time-Series Content
   */
  function generateCsvContent(sampleKey) {
    const s = SAMPLES[sampleKey] || SAMPLES.quadcopter_phantom4;
    const isDrone = s.category === 'drone';

    let csv = `# BHARAT ELECTRONICS LIMITED (BEL) - PROBLEM ID 1606\n`;
    csv += `# RADAR I/Q DATASET EXPORT: ${s.filename}\n`;
    csv += `# TARGET: ${s.title} | CLASS: ${s.category.toUpperCase()}\n`;
    csv += `# RADAR BAND: ${s.radarBand} | SAMPLING RATE: 10000 Hz\n`;
    csv += `timestamp_sec,I_inphase,Q_quadrature,amplitude,doppler_shift_hz\n`;

    const sampleRate = 10000; // 10 kHz PRF
    const duration = 0.05; // 500 samples
    const totalSamples = Math.floor(sampleRate * duration);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let dopplerHz = 0;
      let amp = 0;

      if (isDrone) {
        // High frequency motor chop + micro-Doppler
        const bladePhase = (t * s.cadence) % 1.0;
        const isFlash = Math.abs(bladePhase - 0.5) < 0.1;
        dopplerHz = isFlash ? (Math.random() > 0.5 ? s.fMax : s.fMin) * 0.95 : Math.sin(2 * Math.PI * s.cadence * t) * (s.fMax * 0.4);
        amp = isFlash ? 0.92 : 0.35 + 0.1 * Math.sin(t * 100);
      } else {
        // Smooth undulating wing flapping
        dopplerHz = Math.sin(2 * Math.PI * s.cadence * t) * s.fMax;
        amp = 0.85 + 0.15 * Math.sin(2 * Math.PI * s.cadence * t);
      }

      // Convert to I/Q complex envelope
      const phase = 2 * Math.PI * dopplerHz * t;
      const I = (amp * Math.cos(phase) + (Math.random() - 0.5) * 0.05).toFixed(5);
      const Q = (amp * Math.sin(phase) + (Math.random() - 0.5) * 0.05).toFixed(5);
      const instAmp = Math.sqrt(I * I + Q * Q).toFixed(5);

      csv += `${t.toFixed(6)},${I},${Q},${instAmp},${dopplerHz.toFixed(1)}\n`;
    }

    return csv;
  }

  /**
   * Browser 1-Click CSV File Download
   */
  function downloadSampleCsv(sampleKey) {
    const s = SAMPLES[sampleKey] || SAMPLES.quadcopter_phantom4;
    const csvContent = generateCsvContent(sampleKey);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', s.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    SAMPLES,
    generateCsvContent,
    downloadSampleCsv
  };
})();

// Export globally
window.BenchmarkDatasets = BenchmarkDatasets;
