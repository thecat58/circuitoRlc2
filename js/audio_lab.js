/**
 * ==============================================================================
 * LABORATORIO DE AUDIO OPTIMIZADO (WEB AUDIO API & FFT CANVAS)
 * Proyecto 2: El Circuito RLC como Filtro de Audio - Grupo 3
 * Soporte para Sintetizador, Micrófono en Vivo y Archivos Personalizados
 * ==============================================================================
 */

const AudioLab = {
    audioCtx: null,
    isPlaying: false,
    filterEnabled: true,
    currentSource: null, // 'synth' | 'mic' | 'file' | null
    oscillators: [],
    micStream: null,
    micSourceNode: null,
    fileBufferNode: null,
    filterNode: null,
    analyserNode: null,
    gainNode: null,
    animFrameId: null,

    // Elementos en caché
    canvas: null,
    canvasCtx: null,
    dataArray: null,

    initAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();

            this.analyserNode = this.audioCtx.createAnalyser();
            this.analyserNode.fftSize = 512;
            this.analyserNode.smoothingTimeConstant = 0.8;

            this.gainNode = this.audioCtx.createGain();
            this.gainNode.gain.value = 0.35;

            this.filterNode = this.audioCtx.createBiquadFilter();
            this.filterNode.type = "lowpass";
            this.filterNode.frequency.value = 25.0; // Frecuencia de corte baja RLC
            this.filterNode.Q.value = 1.0;

            this.gainNode.connect(this.audioCtx.destination);

            this.canvas = document.getElementById("canvasSpectrum");
            if (this.canvas) {
                const dpr = window.devicePixelRatio || 1;
                this.canvas.width = 800 * dpr;
                this.canvas.height = 120 * dpr;
                this.canvas.style.width = "100%";
                this.canvas.style.maxWidth = "800px";
                this.canvas.style.height = "120px";
                this.canvasCtx = this.canvas.getContext("2d");
                this.canvasCtx.scale(dpr, dpr);
                this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
            }
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },

    stopAllAudio() {
        // 1. Detener sintetizador
        if (this.oscillators.length > 0) {
            this.oscillators.forEach(osc => {
                try { osc.stop(); osc.disconnect(); } catch (e) {}
            });
            this.oscillators = [];
        }

        // 2. Detener micrófono
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
        if (this.micSourceNode) {
            try { this.micSourceNode.disconnect(); } catch (e) {}
            this.micSourceNode = null;
        }
        const btnMic = document.getElementById("btnLiveMic");
        if (btnMic) {
            btnMic.classList.remove("active");
            btnMic.innerHTML = '<i data-lucide="mic"></i> <span>Hablar por Micrófono</span>';
        }

        // 3. Detener archivo de audio
        if (this.fileBufferNode) {
            try { this.fileBufferNode.stop(); this.fileBufferNode.disconnect(); } catch (e) {}
            this.fileBufferNode = null;
        }

        this.isPlaying = false;
        this.currentSource = null;

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        this.updateUIState(false);
        this.clearCanvas();
        this.updateSourceIndicator("Ninguna fuente activa");
        if (window.lucide) lucide.createIcons();
    },

    startLiveSynth() {
        this.initAudioContext();
        if (this.isPlaying && this.currentSource === 'synth') {
            this.stopAllAudio();
            return;
        }
        this.stopAllAudio();

        const freqs = [110, 164.8, 220, 440, 880, 1760, 3520];
        const gains = [0.25, 0.2, 0.18, 0.14, 0.1, 0.07, 0.04];

        this.oscillators = [];
        const mixBus = this.audioCtx.createGain();
        mixBus.gain.value = 0.5;

        freqs.forEach((f, idx) => {
            const osc = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            osc.type = idx % 2 === 0 ? "sawtooth" : "square";
            osc.frequency.setValueAtTime(f, this.audioCtx.currentTime);
            g.gain.setValueAtTime(gains[idx], this.audioCtx.currentTime);
            osc.connect(g);
            g.connect(mixBus);
            osc.start();
            this.oscillators.push(osc);
        });

        this.routeAudio(mixBus);
        this.isPlaying = true;
        this.currentSource = 'synth';
        this.startSpectrumVisualizer();
        this.updateUIState(true);
        this.updateSourceIndicator("Fuente activa: Sintetizador Polifónico Multitono");
    },

    stopLiveSynth() {
        this.stopAllAudio();
    },

    async startLiveMic() {
        this.initAudioContext();
        const btnMic = document.getElementById("btnLiveMic");

        if (this.isPlaying && this.currentSource === 'mic') {
            this.stopAllAudio();
            return;
        }
        this.stopAllAudio();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.micStream = stream;
            this.micSourceNode = this.audioCtx.createMediaStreamSource(stream);

            // Ajustar volumen controlado para prevenir acople
            this.gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);

            this.routeAudio(this.micSourceNode);
            this.isPlaying = true;
            this.currentSource = 'mic';
            this.startSpectrumVisualizer();

            if (btnMic) {
                btnMic.classList.add("active");
                btnMic.innerHTML = '<i data-lucide="volume-x"></i> <span>Detener Micrófono</span>';
                if (window.lucide) lucide.createIcons();
            }

            this.updateSourceIndicator("Fuente activa: Micrófono en Vivo (Voz Filtrada)");
        } catch (err) {
            console.error("Error al acceder al micrófono:", err);
            alert("No se pudo conectar el micrófono. Verifica los permisos de audio en tu navegador.");
        }
    },

    loadCustomFile(file) {
        if (!file) return;
        this.initAudioContext();
        this.stopAllAudio();

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

                this.fileBufferNode = this.audioCtx.createBufferSource();
                this.fileBufferNode.buffer = audioBuffer;
                this.fileBufferNode.loop = true;

                this.routeAudio(this.fileBufferNode);
                this.fileBufferNode.start();

                this.isPlaying = true;
                this.currentSource = 'file';
                this.startSpectrumVisualizer();

                const lbl = document.getElementById("lblAudioFile");
                if (lbl) {
                    lbl.textContent = file.name.length > 20 ? file.name.substring(0, 18) + "..." : file.name;
                }

                this.updateSourceIndicator(`Fuente activa: Archivo (${file.name})`);
            } catch (err) {
                console.error("Error al decodificar audio:", err);
                alert("Formato de audio no compatible o archivo dañado.");
            }
        };
        reader.readAsArrayBuffer(file);
    },

    updateSourceIndicator(text) {
        const el = document.getElementById("audioSourceText");
        if (el) el.textContent = text;
    },

    toggleFilter() {
        this.filterEnabled = !this.filterEnabled;
        const btn = document.getElementById("btnToggleFilter");
        if (btn) {
            if (this.filterEnabled) {
                btn.innerHTML = '<i data-lucide="filter"></i> <span>Filtro RLC: <strong>ACTIVADO (Bajo el Agua)</strong></span>';
                btn.style.borderColor = "var(--accent-cyan)";
                btn.classList.add("btn-filter-active");
            } else {
                btn.innerHTML = '<i data-lucide="volume-2"></i> <span>Filtro RLC: <strong>DESACTIVADO (Audio Original)</strong></span>';
                btn.style.borderColor = "var(--border-glass)";
                btn.classList.remove("btn-filter-active");
            }
            if (window.lucide) lucide.createIcons();
        }
        if (this.filterNode && this.audioCtx) {
            const targetFreq = this.filterEnabled ? 35.0 : 18000.0;
            this.filterNode.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.06);
        }
    },

    routeAudio(sourceNode) {
        try { sourceNode.disconnect(); } catch (e) {}
        sourceNode.connect(this.filterNode);
        this.filterNode.connect(this.analyserNode);
        this.analyserNode.connect(this.gainNode);

        const targetFreq = this.filterEnabled ? 35.0 : 18000.0;
        this.filterNode.frequency.setValueAtTime(targetFreq, this.audioCtx.currentTime);
    },

    updateFilterParams(R, L, C) {
        if (!this.filterNode || !this.audioCtx) return;
        const omega_n = 1.0 / Math.sqrt(L * C);
        const f_n = omega_n / (2.0 * Math.PI);
        const zeta = R / (2.0 * Math.sqrt(L / C));
        const Q = 1.0 / (2.0 * zeta);

        if (this.filterEnabled) {
            this.filterNode.frequency.setTargetAtTime(Math.max(12, f_n * 2.0), this.audioCtx.currentTime, 0.05);
            this.filterNode.Q.setTargetAtTime(Math.min(8, Math.max(0.1, Q)), this.audioCtx.currentTime, 0.05);
        }
    },

    startSpectrumVisualizer() {
        if (!this.canvasCtx || !this.canvas) return;
        const ctx = this.canvasCtx;
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = this.dataArray;
        const w = 800;
        const h = 120;

        const draw = () => {
            if (!this.isPlaying) return;
            this.animFrameId = requestAnimationFrame(draw);
            this.analyserNode.getByteFrequencyData(dataArray);

            ctx.fillStyle = "#0b111e";
            ctx.fillRect(0, 0, w, h);

            // Líneas de referencia de cuadrícula discretas (dB/frecuencia)
            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h * 0.25); ctx.lineTo(w, h * 0.25);
            ctx.moveTo(0, h * 0.50); ctx.lineTo(w, h * 0.50);
            ctx.moveTo(0, h * 0.75); ctx.lineTo(w, h * 0.75);
            ctx.stroke();

            const numBars = 64;
            const barWidth = w / numBars;

            for (let i = 0; i < numBars; i++) {
                const index = Math.floor(Math.pow(i / numBars, 1.8) * (bufferLength / 2));
                const barHeight = Math.max(2, (dataArray[index] / 255) * (h - 10));

                // Gradiente vertical científico de alta precisión (Cobalt -> Sky -> Pure Ice)
                const barGrad = ctx.createLinearGradient(0, h, 0, h - barHeight);
                barGrad.addColorStop(0, "rgba(2, 132, 199, 0.85)");
                barGrad.addColorStop(0.6, "rgba(56, 189, 248, 0.95)");
                barGrad.addColorStop(1, "rgba(125, 211, 252, 1.0)");

                ctx.fillStyle = barGrad;
                ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1.5, barHeight);

                // Cap de pico superior sutil
                ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
                ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1.5, 1.5);
            }
        };
        draw();
    },

    clearCanvas() {
        if (!this.canvasCtx || !this.canvas) return;
        this.canvasCtx.fillStyle = "#0b111e";
        this.canvasCtx.fillRect(0, 0, 800, 120);
    },

    updateUIState(isPlaying) {
        const btnPlay = document.getElementById("btnPlaySynth");
        if (btnPlay) {
            if (isPlaying && this.currentSource === 'synth') {
                btnPlay.classList.add("stop");
                btnPlay.innerHTML = '<i data-lucide="square"></i> <span>Detener Síntesis</span>';
            } else {
                btnPlay.classList.remove("stop");
                btnPlay.innerHTML = '<i data-lucide="play"></i> <span>Iniciar Sintetizador</span>';
            }
            if (window.lucide) lucide.createIcons();
        }
    }
};
