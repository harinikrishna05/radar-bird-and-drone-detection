# Radar Micro-Doppler Bird and Drone Detection

An interactive browser-based demonstration of how radar micro-Doppler patterns can help distinguish small unmanned aerial vehicles (UAVs) from birds. The project was prepared for **Bharat Electronics Limited (BEL) Problem 1606**.

The app illustrates a signal-analysis workflow using preset target profiles, animated visualizations, heuristic feature scoring, and generated example signals. It is a **simulation and presentation demonstrator**, not a radar receiver or a field-validated machine-learning system.

## What the project can do

- Show six example profiles: a quadcopter, heavy-lift hexacopter, micro-UAV, pigeon/dove, eagle/raptor, and seagull.
- Visualize example micro-Doppler patterns in an animated spectrogram and cadence-velocity diagram.
- Display a simulated 360-degree plan-position-indicator (PPI) radar scope with range rings, a sweep, and a target marker.
- Compare preset values such as cadence, Doppler spread, symmetry, torso ratio, kurtosis, and radar cross section (RCS).
- Apply a transparent, rule-based score to the selected profile and show an illustrative bird/drone label and confidence value.
- Play a synthesized audio analogy for the preset and show its waveform on an oscilloscope-style display. This is generated audio, not recorded radar audio.
- Switch between four interface sections: surveillance, classification information, data ingestion and examples, and a printable report.
- Download small, generated CSV examples of simulated I/Q-like values for each preset.
- Print the report section using the browser's print dialog. Choose **Save as PDF** to create a PDF.
- Open the built-in presenter guide for a short explanation and anticipated questions.

## Important: what the results mean

The plots, target ranges, confidence values, threat labels, and generated CSVs are illustrative preset data. The CSV generator creates formula-based samples with randomized noise; it does not export measurements from a physical radar. The classifier is a set of hand-written thresholds and weighted rules, not a trained random forest or other machine-learning model.

The file-upload area accepts `.wav`, `.csv`, `.png`, `.jpg`, and `.jpeg` selections, but the current app does **not** read or process the uploaded file contents. It displays the file name and chooses a preset using a simple filename check (bird-related words select the pigeon profile; other names select the quadcopter profile). The feature table and displayed classification continue to come from the selected preset.

Any accuracy or AUC figures displayed in the interface are not backed by a documented, independently held-out real-radar evaluation in this project. Do not present them as measured model performance. This demo does not transmit radio signals, detect live targets, or operate countermeasures. Threat and response text is for demonstration only.

## Run the application

### Option 1: Open the page directly

1. Download or clone the repository.
2. Open `index.html` in a current desktop browser such as Chrome, Firefox, Safari, or Edge.
3. If audio is needed, click the audio control; browsers require a user action before starting audio.

### Option 2: Use the macOS launcher

On macOS, double-click `start.command`. It opens `index.html` in the default browser. If macOS blocks the file, right-click it in Finder and select **Open**. The launcher opens the page directly; it does not start a radar service.

### Option 3: Run the optional local web server

If you prefer to serve the page over localhost, open Terminal in the project folder and run:

```bash
ruby server.rb
```

Then open the localhost address printed in Terminal. The server uses Ruby's WEBrick library. It tries ports 5000, 5050, 8000, 8080, and 3000, and binds to `127.0.0.1` on your computer.

The browser app does not require a package installation or build step. Internet access is not required for the local demo after the files are available.

## How to use the demo

1. Open the **Surveillance** section and select a target preset.
2. Observe how the example cadence and Doppler spread appear in the spectrogram and cadence-velocity display.
3. Check the PPI scope and the preset's feature values and illustrative classification.
4. Open the **Classification** section to read the project's explanation of bird and UAV signature differences.
5. In **Data Ingestion**, try a preset example or download one of the generated CSV files. Keep in mind the upload control uses the filename only; it does not analyze file contents.
6. Open **Report** and use the print control to save the report as a PDF.
7. Open the presenter guide for the short project pitch and Q&A notes.

## Example signatures

The following values are built into the demo profiles. They are scenario settings for visualization, not guaranteed biological or engineering limits.

| Example preset | Profile cadence | Profile Doppler spread |
|---|---:|---:|
| Quadcopter | 170 Hz | ±1,480 Hz |
| Heavy-lift hexacopter | 210 Hz | ±1,820 Hz |
| Micro-UAV | 280 Hz | ±920 Hz |
| Pigeon/dove | 5.8 Hz | ±180 Hz |
| Eagle/raptor | 3.2 Hz | ±240 Hz |
| Seagull | 4.1 Hz | ±160 Hz |

Values are taken from the target profiles in `radar_dsp.js`. Actual radar returns vary with radar band, sensor configuration, target materials and geometry, range, aspect, flight behavior, clutter, and signal-to-noise ratio.

## Project files

| File | Purpose |
|---|---|
| `index.html` | Page structure, navigation, visualization areas, controls, report, and presenter guide. |
| `styles.css` | Layout, colors, responsive styles, and print styling. |
| `app.js` | Connects the interface controls to the preset data, visualizations, audio, and print dialog. |
| `radar_dsp.js` | Contains the preset profiles, animated example plots, feature values, and threshold-based classification rules. |
| `radar_screen.js` | Draws the animated PPI-style scope for the selected preset. |
| `audio_synth.js` | Generates the illustrative audio and oscilloscope waveform. |
| `sample_datasets.js` | Generates six formula-based example CSV files for download. |
| `server.rb` | Optional localhost server implemented with Ruby WEBrick. |
| `start.command` | macOS script that opens the local HTML page in the default browser. |

## How the classification demonstration works

The app starts with fixed profiles. Each profile supplies values such as cadence, spread, symmetry, torso ratio, and kurtosis. The feature display reads those profile values, and the scoring function compares them with hand-set thresholds. The result is intended to help explain why periodic rotor motion may look different from wingbeats in a simplified visualization.

This is not a trained classifier and does not calculate these features from uploaded radar data. A reliable real-world model would need recorded and labeled radar tracks, documented preprocessing, training and validation by independent flight/track, and testing across different sensors, species, UAVs, ranges, and conditions.

## Suggested future improvements

- Add real radar I/Q or Doppler recordings with documented collection settings and ground truth.
- Parse supported input file formats and validate their structure instead of relying on filenames.
- Replace fixed profile-derived features with features calculated from the input signal.
- Compare interpretable baselines with trained models using track-separated train, validation, and test sets.
- Report per-class precision, recall, F1, balanced accuracy, false alarms, and uncertainty, with a clear account of the dataset and split method.
- Test low signal-to-noise ratio, clutter, gliding birds, varying rotor speeds, multiple targets, and unfamiliar species or UAV models.
- Add an “uncertain / needs review” outcome and avoid operational threat or countermeasure advice until independently validated.

## Short project explanation

> This project is an interactive demonstration of radar micro-Doppler analysis for distinguishing birds from small drones. It visualizes preset examples of rotor and wingbeat motion, shows how signal features could support a classification, and provides a browser-based report and presentation guide. The current version uses simulated examples and a rule-based classifier; testing it with real radar data is a key next step.

## License

No license is currently specified. Add a license file if you want to define how others may use, modify, or redistribute this project.
