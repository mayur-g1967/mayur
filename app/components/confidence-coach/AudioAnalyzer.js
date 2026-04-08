export class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.stream = null;
        this.animationId = null;

        // Tracked Metrics
        this.volumes = [];
        this.pitches = [];
        this.energies = [];
        this.isRecording = false;

        // For Live updates
        this.currentPitch = 0;
        this.currentEnergy = 0;
    }

    async start(externalStream = null) {
        if (this.isRecording) return;

        try {
            this.isExternalStream = !!externalStream;
            this.stream = externalStream || await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();

            this.analyser.fftSize = 2048; // Higher for better pitch resolution
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.source.connect(this.analyser);

            this.isRecording = true;
            this.volumes = [];
            this.pitches = [];
            this.energies = [];

            this.processAudio();
        } catch (err) {
            console.error("Failed to start audio analyzer:", err);
            throw err;
        }
    }

    processAudio() {
        if (!this.isRecording) return;

        const bufferLength = this.analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(dataArray);

        // 1. Calculate Energy (RMS)
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sumSquares += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        // Scale RMS: 0.01 is a whisper, 0.1 is normal speech, 0.3 is loud.
        // We'll normalize 0.12 to 100% for the UI (increased sensitivity)
        this.currentEnergy = Math.min(100, (rms / 0.12) * 100);
        this.energies.push(this.currentEnergy);

        // 2. Calculate Pitch (Auto-correlation)
        const pitch = this.autoCorrelate(dataArray, this.audioContext.sampleRate);
        if (pitch !== -1 && pitch < 1000) { // Filter out unrealistic highs
            this.currentPitch = pitch;
            this.pitches.push(pitch);
        }

        // 3. Average Volume
        const avgVol = dataArray.reduce((a, b) => a + Math.abs(b), 0) / dataArray.length;
        this.volumes.push(avgVol * 100);

        this.animationId = requestAnimationFrame(() => this.processAudio());
    }

    autoCorrelate(buf, sampleRate) {
        let SIZE = buf.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            let val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.005) return -1; // Lower sensitivity threshold

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }

        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buf[j] * buf[j + i];
            }
        }

        let d = 0;
        while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;

        return sampleRate / T0;
    }

    stop() {
        this.isRecording = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        if (this.stream) {
            if (!this.isExternalStream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            this.stream = null;
        }

        return this.getFinalStats();
    }

    getFinalStats() {
        const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const stdDev = (arr) => {
            if (!arr.length) return 0;
            const mean = avg(arr);
            return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / arr.length);
        };

        const avgVol = avg(this.volumes);
        const volStd = stdDev(this.volumes);
        const avgPitch = avg(this.pitches);
        const pitchStd = stdDev(this.pitches);
        const avgEnergy = avg(this.energies);
        const energyStd = stdDev(this.energies);

        // Pitch Stability (%) - Improved calculation
        // Human voice variation is normal. Let's say +/- 20% is very stable.
        const pitchStability = Math.max(0, 100 - (pitchStd / (avgPitch || 1) * 300));

        const energyTrend = energyStd < (avgEnergy * 0.4) ? "Stable" : "Erratic";

        return {
            avgVolume: Math.round(avgVol),
            volumeVariance: Math.round(volStd * 100),
            avgPitch: Math.round(avgPitch),
            avgEnergy: Math.round(avgEnergy),
            pitchStability: Math.round(pitchStability),
            energyTrend: energyTrend,
            samples: this.volumes.length,
            pitches: this.pitches,
            energies: this.energies,
            volumes: this.volumes
        };
    }

    getMetrics() {
        // Return raw pitch and normalized energy
        return {
            volume: this.volumes.length ? this.volumes[this.volumes.length - 1] : 0,
            currentPitch: this.currentPitch,
            currentEnergy: this.currentEnergy
        };
    }
}
