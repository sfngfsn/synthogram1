/*exported AudioRecorder*/
/*globals window, console, Blob, URL */
'use strict';

function AudioRecorder(audioContext, destination) {
    var mediaRecorder = null;
    var audioChunks = [];
    var isRecording = false;
    var recordStartTime = 0;
    var audioBuffer = [];
    var bufferSize = 4096;
    var recordingLength = 0;
    
    // Create a gain node for recording
    var recordGain = audioContext.createGain();
    recordGain.gain.value = 1.0;
    
    // Create a script processor node for capturing audio data
    var recorderNode = audioContext.createScriptProcessor(bufferSize, 2, 2);
    
    // Connect the recording node to the destination
    destination.connect(recordGain);
    recordGain.connect(recorderNode);
    recorderNode.connect(audioContext.destination);
    
    // Store the recorder node reference so it doesn't get garbage collected
    this.recorderNode = recorderNode;
    
    // Audio processing function to capture data
    recorderNode.onaudioprocess = function(e) {
        if (!isRecording) return;
        
        var leftChannel = e.inputBuffer.getChannelData(0);
        var rightChannel = e.inputBuffer.getChannelData(1);
        
        // Store audio data for later export
        audioBuffer.push({
            left: new Float32Array(leftChannel),
            right: new Float32Array(rightChannel)
        });
        
        recordingLength += leftChannel.length;
    };
    
    var start = function() {
        if (isRecording) return;
        
        console.log('Starting audio recording...');
        isRecording = true;
        recordStartTime = Date.now();
        audioBuffer = [];
        recordingLength = 0;
        
        // Alternative approach using MediaRecorder API if available
        if (typeof MediaRecorder !== 'undefined') {
            var dest = audioContext.createMediaStreamDestination();
            destination.connect(dest);
            
            mediaRecorder = new MediaRecorder(dest.stream);
            mediaRecorder.ondataavailable = function(event) {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = function() {
                var audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                var audioUrl = URL.createObjectURL(audioBlob);
                
                if (typeof onRecordingComplete === 'function') {
                    onRecordingComplete(audioBlob, audioUrl);
                }
            };
            
            mediaRecorder.start();
        }
    };
    
    var stop = function() {
        if (!isRecording) return;
        
        console.log('Stopping audio recording...');
        isRecording = false;
        var recordDuration = (Date.now() - recordStartTime) / 1000;
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        } else {
            // Manual WAV creation from recorded buffers
            var wavBlob = createWavBlob(audioBuffer, recordingLength, audioContext.sampleRate);
            var audioUrl = URL.createObjectURL(wavBlob);
            
            if (typeof onRecordingComplete === 'function') {
                onRecordingComplete(wavBlob, audioUrl, recordDuration);
            }
        }
        
        audioChunks = [];
    };
    
    var createWavBlob = function(buffers, length, sampleRate) {
        var bufferL = new Float32Array(length);
        var bufferR = new Float32Array(length);
        var offset = 0;
        
        // Combine all recorded buffers
        for (var i = 0; i < buffers.length; i++) {
            bufferL.set(buffers[i].left, offset);
            bufferR.set(buffers[i].right, offset);
            offset += buffers[i].left.length;
        }
        
        // Interleave channels
        var interleaved = new Float32Array(length * 2);
        for (var j = 0; j < length; j++) {
            interleaved[j * 2] = bufferL[j];
            interleaved[j * 2 + 1] = bufferR[j];
        }
        
        // Convert to 16-bit PCM
        var pcm = new Int16Array(length * 2);
        for (var k = 0; k < length * 2; k++) {
            pcm[k] = Math.max(-32768, Math.min(32767, interleaved[k] * 32768));
        }
        
        // Create WAV file
        var buffer = new ArrayBuffer(44 + pcm.length * 2);
        var view = new DataView(buffer);
        
        // WAV header
        var writeString = function(offset, string) {
            for (var i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + pcm.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 2, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, pcm.length * 2, true);
        
        // Write PCM data
        var pcmLength = pcm.length;
        var index = 44;
        for (var l = 0; l < pcmLength; l++) {
            view.setInt16(index, pcm[l], true);
            index += 2;
        }
        
        return new Blob([buffer], { type: 'audio/wav' });
    };
    
    var onRecordingComplete = null;
    
    return {
        start: start,
        stop: stop,
        isRecording: function() { return isRecording; },
        setOnRecordingComplete: function(callback) { onRecordingComplete = callback; },
        getRecordingDuration: function() { 
            return isRecording ? (Date.now() - recordStartTime) / 1000 : 0; 
        }
    };
}