# Bharat Electronics Limited (BEL) — Problem ID 1606
## Micro-Doppler Based Target Classification (Drone vs Bird Discrimination)

An interactive, real-time tactical air defense surveillance web application designed to demonstrate the complete radar signal processing (DSP) and machine learning classification pipeline for separating small commercial drones from biological birds.

---

### 🚀 Quick Start
You have two easy ways to run the project:

1. **Double-click `start.command`** in Finder, OR
2. **Double-click `index.html`** (or right-click and open with Chrome, Safari, or Edge).

*(No terminal installations, Python dependencies, or Node builds required — the entire DSP, audio synthesis, and tactical HUD runs client-side with 60 FPS Canvas and Web Audio API.)*

---

### 📁 Project Structure

| File | Description |
|---|---|
| [`index.html`](./index.html) | Semantic HTML5 single-page application with all 4 tactical tabs, preset buttons, canvases, and the built-in Presenter Guide modal. |
| [`styles.css`](./styles.css) | Military tactical HUD dark theme styling with glassmorphism, responsive grid layout, and official printable report `@media print` styles. |
| [`radar_dsp.js`](./radar_dsp.js) | Digital Signal Processing engine: Short-Time Fourier Transform (STFT) spectrogram simulator, Cadence-Velocity Diagram (CVD) calculation, 7 physical feature extraction, and physics-informed classification. |
| [`audio_synth.js`](./audio_synth.js) | Web Audio API acoustic Doppler synthesizer generating authentic drone high-RPM motor whine + rotor chop vs bird biological wingbeat whooshes, with live oscilloscope. |
| [`radar_screen.js`](./radar_screen.js) | Circular 360° Plan Position Indicator (PPI) tactical radar scope with fading phosphor sweep trail, range rings, crosshairs, and live target blip tracking. |
| [`sample_datasets.js`](./sample_datasets.js) | Benchmark ground-truth radar library with 6 pre-compiled test datasets and 1-click browser CSV downloader. |
| [`app.js`](./app.js) | Application orchestrator coordinating preset selection, tab navigation, 60 FPS animation loops, audio controls, file drag-and-drop, and report generation. |
| [`start.command`](./start.command) | One-click macOS executable launcher script. |

---

### 🎯 Key Demonstration Features

1. **6 Target Presets:**
   - **Quadcopter (DJI Phantom):** 5,100 RPM, 170 Hz Cadence, $\pm 1,480\text{ Hz}$ Doppler spread, Threat: CRITICAL.
   - **Hexacopter (Heavy Lift):** 4,200 RPM, 210 Hz Cadence, $\pm 1,820\text{ Hz}$ Doppler spread, Threat: CRITICAL.
   - **Micro-UAV (Black Hornet):** 8,400 RPM, 280 Hz Cadence, $\pm 920\text{ Hz}$ Doppler spread, Threat: HIGH.
   - **Pigeon / Dove:** 5.8 Hz Wingbeat, $\pm 180\text{ Hz}$ Doppler spread, Threat: SAFE.
   - **Golden Eagle / Raptor:** 3.2 Hz Wingbeat, $\pm 240\text{ Hz}$ Doppler spread, Threat: SAFE.
   - **Coastal Seagull:** 4.1 Hz Flap Rhythm, $\pm 160\text{ Hz}$ Doppler spread, Threat: SAFE.

2. **Real-Time Doppler Acoustics:**
   - Click **▶ PLAY RADAR DOPPLER AUDIO** to hear the actual acoustic difference:
     - Drone: High-frequency electric motor whine with 170 Hz blade chopping modulation.
     - Bird: Low-frequency organic whooshing wingbeats at 5.8 Hz.
   - Live glowing green oscilloscope waveform.

3. **4 Comprehensive Navigation Tabs:**
   - **Tab 1: 📡 Real-Time Micro-Doppler Surveillance:** Live STFT Spectrogram, Cadence (CVD) Diagram, Tactical PPI Scope, and AI Threat Card.
   - **Tab 2: 🎯 Target Classification & Threat Intel:** Scientific explanation of why RCS fails ($0.02\text{ m}^2$ ambiguity), 5 Golden Differences, and automated C-UAS jamming matrix.
   - **Tab 3: 📁 Data Ingestion & Benchmarking:** Drag-and-drop file ingestion, 7-feature extraction table, benchmark library with "Ingest & Test" + "Download Raw CSV", and Confusion Matrix (98.58% accuracy, 0.997 AUC).
   - **Tab 4: 📄 Defense Intelligence Report:** Formal printable BEL Air Surveillance Dossier ready for superior review (click "Print / Export PDF").

4. **Built-in Presenter Script & Q&A Teleprompter:**
   - Click the top right **🎙️ PRESENTER SCRIPT & Q&A** button at any time to open your live cheat sheet with the 30-second pitch, jargon buster, and top 5 tough questions with answers.
