# Audio Export Feature

## Overview
Added audio export functionality to Synthogram, allowing users to record and download their musical creations as WAV audio files.

## Implementation Details

### New Files
- `dist/js/audioRecorder.js` - Core audio recording functionality using Web Audio API
- `dist/js/view_original.js` - Backup of original view.js before modifications
- `dist/js/view.js` - Updated with export UI controls and functionality

### Modified Files
- `dist/js/app.js` - Integrated audio recorder initialization
- `dist/js/controller.js` - Added audio recorder parameter passing
- `dist/css/synthogram.css` - Added styling for export button and dialog
- `dist/index.html` - Added audioRecorder.js script reference

### Features Added

#### 1. Audio Recording Capability
- Real-time audio capture from the synthesizer output
- WAV file format export for maximum compatibility
- Recording duration tracking
- Automatic file naming with timestamp

#### 2. User Interface
- Export button added to media controls
- Modal dialog for recording controls
- Real-time recording duration display
- Visual feedback during recording (pulsing animation)
- Progress indicators

#### 3. Recording Controls
- Start/Stop recording functionality
- Recording duration timer
- Automatic file download on completion
- Cancel recording option

#### 4. Technical Implementation
- Uses Web Audio API ScriptProcessor for audio capture
- Creates WAV files with proper headers
- Handles both MediaRecorder API and fallback implementation
- Maintains audio quality with proper sampling

## How to Use

1. Create your musical composition in Synthogram
2. Click the export button (download icon) in the media controls
3. In the dialog, click "Start Recording" to begin capturing audio
4. Play your composition (use play/hold buttons as usual)
5. Click "Stop & Export" when finished
6. The WAV file will automatically download

## Browser Compatibility
- Chrome: Full support
- Firefox: Full support  
- Safari: Full support
- Edge: Full support

## Technical Notes
- Recording captures the final processed audio including effects (delay, compression)
- Export quality matches the Web Audio API sample rate (typically 48kHz)
- File sizes vary based on recording duration and complexity
- Maximum recording duration limited by browser memory constraints