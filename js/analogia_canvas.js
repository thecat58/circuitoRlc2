/**
 * ==============================================================================
 * ANIMACIÓN EN CANVAS OPTIMIZADA: ANALOGÍA ELECTROMECÁNICA
 * Sistema Masa-Resorte-Amortiguador vs. Circuito RLC Serie (60 FPS)
 * Proyecto 2: El Circuito RLC como Filtro de Audio - Grupo 3
 * ==============================================================================
 */

const AnalogiaCanvas = {
    canvas: null,
    ctx: null,
    animId: null,
    isRunning: false,
    simTime: 0.0,
    dt: 0.003,

    // Parámetros físicos
    R: 10.0,
    L: 0.5,
    C: 200e-6,
    E0: 12.0,

    // Partículas de electrones
    electrons: [],

    init() {
        this.canvas = document.getElementById("canvasAnalogia");
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = 900 * dpr;
        this.canvas.height = 380 * dpr;
        this.canvas.style.width = "100%";
        this.canvas.style.maxWidth = "900px";
        this.canvas.style.height = "auto";
        this.canvas.style.aspectRatio = "900 / 380";
        if (this.ctx.resetTransform) {
            this.ctx.resetTransform();
        } else {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        this.ctx.scale(dpr, dpr);

        this.initElectrons(28);
        this.renderFrame(0);
    },

    initElectrons(count) {
        this.electrons = [];
        for (let i = 0; i < count; i++) {
            this.electrons.push({ dist: i / count });
        }
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
        this.updateButtons();
    },

    pause() {
        this.isRunning = false;
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        this.updateButtons();
    },

    reset() {
        this.pause();
        this.simTime = 0.0;
        this.renderFrame(0);
    },

    /**
     * Actualiza la resistencia suavemente SIN destruir el bucle de animación.
     */
    setResistance(newR) {
        this.R = newR;
        if (!this.isRunning) {
            this.renderFrame(this.simTime);
        }
    },

    animate() {
        if (!this.isRunning) return;
        this.simTime += this.dt;
        if (this.simTime > 0.45) {
            this.simTime = 0.45;
            this.pause();
            return;
        }
        this.renderFrame(this.simTime);
        this.animId = requestAnimationFrame(() => this.animate());
    },

    renderFrame(t) {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = 900;
        const h = 380;

        ctx.clearRect(0, 0, w, h);

        // Fondo oscuro
        ctx.fillStyle = "#0b111e";
        ctx.fillRect(0, 0, w, h);

        // Línea divisoria central
        ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 20);
        ctx.lineTo(w / 2, h - 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // Calcular estado analítico en el tiempo t
        const p = RLCEngine.calculateParameters(this.R, this.L, this.C);
        let Vc = 0;
        let I = 0;

        if (p.delta < -1e-7) {
            const decay = Math.exp(-p.alpha * t);
            const osc = Math.cos(p.omega_d * t) + (p.alpha / p.omega_d) * Math.sin(p.omega_d * t);
            Vc = this.E0 * (1.0 - decay * osc);
            I = (this.E0 / (p.omega_d * this.L)) * decay * Math.sin(p.omega_d * t);
        } else if (Math.abs(p.delta) <= 1e-7) {
            Vc = this.E0 * (1.0 - Math.exp(-p.alpha * t) * (1.0 + p.alpha * t));
            I = (this.E0 / this.L) * t * Math.exp(-p.alpha * t);
        } else {
            const s1 = -p.alpha + Math.sqrt(p.delta) / (2.0 * this.L);
            const s2 = -p.alpha - Math.sqrt(p.delta) / (2.0 * this.L);
            const term = (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
            Vc = this.E0 * (1.0 - term);
            I = (this.E0 / (this.L * (s1 - s2))) * (Math.exp(s1 * t) - Math.exp(s2 * t));
        }

        const x_norm = Vc / 22.0;
        const i_norm = I / 0.25;

        // Dibujar panel izquierdo y derecho
        this.drawMechanicalSystem(ctx, w * 0.25, h, x_norm, i_norm);
        this.drawElectricalCircuit(ctx, w * 0.75, h, x_norm, i_norm, Vc, I);

        // Barra inferior informativa
        ctx.fillStyle = "#94a3b8";
        ctx.font = "12px 'Fira Code', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`Tiempo: ${(t * 1000).toFixed(1)} ms | R = ${this.R.toFixed(1)} Ω | Vc = ${Vc.toFixed(2)} V | I = ${(I * 1000).toFixed(1)} mA`, w / 2, h - 14);
    },

    drawMechanicalSystem(ctx, centerX, h, x_norm, i_norm) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 13px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SISTEMA MECÁNICO (Masa-Resorte)", centerX, 28);

        const ceilingY = 55;
        const baseMassY = 175;
        const massY = baseMassY + x_norm * 80;

        // Techo fijo
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 90, ceilingY);
        ctx.lineTo(centerX + 90, ceilingY);
        ctx.stroke();

        // Resorte
        const springX = centerX - 40;
        this.drawSpring(ctx, springX, ceilingY, massY, 8, 12);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "11px 'Inter', sans-serif";
        ctx.fillText("k ↔ 1/C", springX, ceilingY + 45);

        // Amortiguador
        const damperX = centerX + 40;
        this.drawDamper(ctx, damperX, ceilingY, massY);
        ctx.fillStyle = "#f59e0b";
        ctx.fillText("c ↔ R", damperX, ceilingY + 45);

        // Masa
        const massW = 95;
        const massH = 42;
        ctx.fillStyle = "#111a2e";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(centerX - massW / 2, massY, massW, massH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillText("Masa m ↔ L", centerX, massY + 20);
        ctx.font = "10px 'Fira Code', monospace";
        ctx.fillText("x(t) ↔ Q(t)", centerX, massY + 33);
    },

    drawSpring(ctx, x, yStart, yEnd, coils, radius) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, yStart);
        const lead = 12;
        ctx.lineTo(x, yStart + lead);

        const len = yEnd - (yStart + lead * 2);
        const pitch = len / coils;

        for (let i = 0; i < coils; i++) {
            const curY = yStart + lead + (i + 0.25) * pitch;
            ctx.lineTo(x - radius, curY);
            ctx.lineTo(x + radius, curY + pitch * 0.5);
        }

        ctx.lineTo(x, yEnd - lead);
        ctx.lineTo(x, yEnd);
        ctx.stroke();
    },

    drawDamper(ctx, x, yStart, yEnd) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.8;

        const rodBottom = yStart + (yEnd - yStart) * 0.5;
        ctx.beginPath();
        ctx.moveTo(x, yStart);
        ctx.lineTo(x, rodBottom);
        ctx.stroke();

        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x - 12, rodBottom);
        ctx.lineTo(x + 12, rodBottom);
        ctx.stroke();

        ctx.lineWidth = 1.5;
        const cylTop = rodBottom - 8;
        const cylW = 16;
        ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
        ctx.fillRect(x - cylW, cylTop + 4, cylW * 2, yEnd - cylTop - 4);

        ctx.beginPath();
        ctx.moveTo(x - cylW, cylTop);
        ctx.lineTo(x - cylW, yEnd);
        ctx.lineTo(x + cylW, yEnd);
        ctx.lineTo(x + cylW, cylTop);
        ctx.stroke();
    },

    drawElectricalCircuit(ctx, centerX, h, x_norm, i_norm, Vc, I) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 13px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CIRCUITO ELÉCTRICO RLC", centerX, 28);

        const rectX = centerX - 120;
        const rectY = 60;
        const rectW = 240;
        const rectH = 210;

        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, rectY, rectW, rectH);

        // Fuente 12V
        const srcX = rectX;
        const srcY = rectY + rectH / 2;
        ctx.fillStyle = "#0b111e";
        ctx.fillRect(srcX - 16, srcY - 20, 32, 40);
        ctx.strokeStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(srcX, srcY, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 10px 'Inter', sans-serif";
        ctx.fillText("12V", srcX, srcY + 4);

        // Inductor L
        const lX = rectX + rectW * 0.35;
        const lY = rectY;
        ctx.fillStyle = "#0b111e";
        ctx.fillRect(lX - 22, lY - 10, 44, 20);
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(lX + i * 7, lY, 5, Math.PI, 0, false);
            ctx.stroke();
        }
        ctx.fillStyle = "#38bdf8";
        ctx.font = "10px 'Inter', sans-serif";
        ctx.fillText("L = 0.5H", lX, lY - 12);

        // Resistor R
        const rX = rectX + rectW * 0.75;
        const rY = rectY;
        ctx.fillStyle = "#0b111e";
        ctx.fillRect(rX - 20, rY - 10, 40, 20);
        ctx.strokeStyle = "#f59e0b";
        ctx.beginPath();
        ctx.moveTo(rX - 18, rY);
        ctx.lineTo(rX - 12, rY - 6);
        ctx.lineTo(rX - 4, rY + 6);
        ctx.lineTo(rX + 4, rY - 6);
        ctx.lineTo(rX + 12, rY + 6);
        ctx.lineTo(rX + 18, rY);
        ctx.stroke();
        ctx.fillStyle = "#f59e0b";
        ctx.fillText(`R=${this.R.toFixed(0)}Ω`, rX, rY - 12);

        // Condensador C
        const cX = rectX + rectW;
        const cY = rectY + rectH / 2;
        ctx.fillStyle = "#0b111e";
        ctx.fillRect(cX - 14, cY - 22, 28, 44);

        const plateCharge = Math.min(1.0, Vc / 12.0);
        ctx.strokeStyle = `rgb(${Math.floor(255 * plateCharge)}, 90, 90)`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(cX - 12, cY - 14);
        ctx.lineTo(cX + 12, cY - 14);
        ctx.stroke();

        ctx.strokeStyle = `rgb(90, 150, ${Math.floor(255 * plateCharge)})`;
        ctx.beginPath();
        ctx.moveTo(cX - 12, cY + 14);
        ctx.lineTo(cX + 12, cY + 14);
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 10px 'Inter', sans-serif";
        ctx.fillText(`C = 200µF`, cX + 40, cY - 4);
        ctx.fillText(`Vc = ${Vc.toFixed(1)}V`, cX + 40, cY + 10);

        // Electrones fluyendo
        if (Math.abs(I) > 0.001) {
            const speed = (I / 0.15) * 0.006;
            ctx.fillStyle = "#38bdf8";

            this.electrons.forEach(el => {
                el.dist = (el.dist + speed + 1.0) % 1.0;
                const pos = this.getPerimeterPoint(rectX, rectY, rectW, rectH, el.dist);
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    },

    getPerimeterPoint(x, y, w, h, tNorm) {
        const perimeter = 2 * (w + h);
        const dist = tNorm * perimeter;

        if (dist <= w) {
            return { x: x + dist, y: y };
        } else if (dist <= w + h) {
            return { x: x + w, y: y + (dist - w) };
        } else if (dist <= 2 * w + h) {
            return { x: x + w - (dist - (w + h)), y: y + h };
        } else {
            return { x: x, y: y + h - (dist - (2 * w + h)) };
        }
    },

    updateButtons() {
        const btnPlay = document.getElementById("btnPlayAnalogia");
        if (btnPlay) {
            btnPlay.innerHTML = this.isRunning
                ? '<i data-lucide="pause"></i> <span>Pausar Animación</span>'
                : '<i data-lucide="play"></i> <span>Iniciar Animación</span>';
            if (window.lucide) lucide.createIcons();
        }
    }
};
