/**
 * ==============================================================================
 * CONTROLADOR PRINCIPAL OPTIMIZADO (60 FPS & ULTRA-FLUIDO)
 * Proyecto 2: El Circuito RLC como Filtro de Audio
 * Institución Universitaria Colegio Mayor del Cauca - Grupo 3
 * ==============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // 0. Renderizar Iconos Vectoriales (Lucide)
    if (window.lucide) {
        try {
            lucide.createIcons();
        } catch (e) {
            console.warn("Lucide notice:", e);
        }
    }

    // 1. Inicializar KaTeX con manejo seguro de errores
    try {
        if (window.renderMathInElement) {
            renderMathInElement(document.body, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                    { left: "\\[", right: "\\]", display: true },
                    { left: "\\(", right: "\\)", display: false }
                ],
                throwOnError: false
            });
        }
    } catch (e) {
        console.warn("KaTeX render notice:", e);
    }

    // 2. Control de Pestañas con gestión de ciclo de vida
    initTabNavigation();

    // 3. Inicializar Simulador RK4, Superposición y Plano s
    initSimulator();
    initBrowserFigures();

    // 4. Inicializar Temporizador de Defensa de 15 Minutos
    initDefenseTimer();

    // 5. Acordeón de Preguntas
    initQuestionsAccordion();

    // 6. Modal de Zoom de Imágenes
    initImageModal();

    // 7. Inicializar Canvas de Analogía Electromecánica
    AnalogiaCanvas.init();

    // 8. Inicializar Laboratorio de Audio (Sintetizador, Micrófono y Archivo)
    initAudioStudio();

    // 9. Modo Presentación Magistral y Atajos de Teclado
    initPresentationMode();
    initKeyboardShortcuts();
});

/**
 * ==============================================================================
 * 1. NAVEGACIÓN POR PESTAÑAS Y GESTIÓN DE CICLO DE VIDA
 * ==============================================================================
 */
function initTabNavigation() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-tab");

            tabButtons.forEach(b => b.classList.remove("active"));
            tabPanes.forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add("active");
                if (window.lucide) {
                    lucide.createIcons();
                }
            }

            if (targetId === "tab-galeria" && galleryCharts.length) {
                requestAnimationFrame(() => galleryCharts.forEach(chart => chart.resize()));
            }

            // Gestión de bucles de animación para liberar CPU/GPU
            if (targetId !== "tab-analogia" && AnalogiaCanvas.isRunning) {
                AnalogiaCanvas.pause();
            } else if (targetId === "tab-analogia") {
                AnalogiaCanvas.init();
            }

            // Si salimos de tab-audio, detener audio si está sonando
            if (targetId !== "tab-audio" && AudioLab.isPlaying) {
                AudioLab.stopAllAudio();
            }
        });
    });
}

/**
 * ==============================================================================
 * 2. SIMULADOR EN VIVO RK4, SUPERPOSICIÓN ANALÍTICA Y DIAGRAMA DE POLOS EN PLANO s
 * ==============================================================================
 */
let rk4Chart = null;
let rafPending = false;
let showAnalytical = false;
let galleryCharts = [];
let validationChart = null;
let validationErrorChart = null;
let stepResponseChart = null;
let multitoneChart = null;
let multitoneSpectrumChart = null;
let bodeMagnitudeChart = null;
let bodePhaseChart = null;

function initSimulator() {
    const sliderR = document.getElementById("sliderR");
    const sliderL = document.getElementById("sliderL");
    const sliderC = document.getElementById("sliderC");
    const sliderE = document.getElementById("sliderE");

    const valR = document.getElementById("valR");
    const valL = document.getElementById("valL");
    const valC = document.getElementById("valC");
    const valE = document.getElementById("valE");

    const btnToggleAnalytical = document.getElementById("btnToggleAnalytical");
    const badgeResidualError = document.getElementById("badgeResidualError");
    const valResidualError = document.getElementById("valResidualError");

    const ctx = document.getElementById("chartRK4").getContext("2d");

    // Configuración de Chart.js optimizada para máximo rendimiento
    rk4Chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'V_C(t) Numérica (RK4) [V]',
                    data: [],
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    borderWidth: 2.2,
                    fill: true,
                    tension: 0,
                    pointRadius: 0
                },
                {
                    label: 'Corriente I(t) x10 [A]',
                    data: [],
                    borderColor: '#10b981',
                    borderWidth: 1.6,
                    borderDash: [4, 4],
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    yAxisID: 'y1'
                },
                {
                    label: 'Tensión Permanente E_0 [V]',
                    data: [],
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                    borderWidth: 1.2,
                    borderDash: [3, 3],
                    pointRadius: 0
                },
                {
                    label: 'V_C(t) Analítica Exacta [V]',
                    data: [],
                    borderColor: '#f59e0b',
                    borderWidth: 2.0,
                    borderDash: [5, 4],
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                x: {
                    title: { display: true, text: 'Tiempo t [milisegundos, ms]', color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', maxTicksLimit: 8 }
                },
                y: {
                    title: { display: true, text: 'Voltaje V_C(t) [V]', color: '#38bdf8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', maxTicksLimit: 6 },
                    suggestedMin: 0,
                    suggestedMax: 24
                },
                y1: {
                    position: 'right',
                    title: { display: true, text: 'Corriente I(t) x10 [A]', color: '#10b981' },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#10b981', maxTicksLimit: 6 }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#f1f5f9', font: { family: 'Inter', size: 11 }, boxWidth: 14 }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(8, 12, 22, 0.94)',
                    titleColor: '#38bdf8',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            }
        }
    });

    // Toggle para Superponer Solución Analítica Exacta y Error Residual
    if (btnToggleAnalytical) {
        btnToggleAnalytical.addEventListener("click", () => {
            showAnalytical = !showAnalytical;
            btnToggleAnalytical.classList.toggle("active", showAnalytical);
            rk4Chart.data.datasets[3].hidden = !showAnalytical;
            if (badgeResidualError) {
                badgeResidualError.style.display = showAnalytical ? "flex" : "none";
            }
            queueSimulationUpdate();
        });
    }

    // Función de actualización real ejecutada a 60 FPS
    const executeSimulation = () => {
        const R = parseFloat(sliderR.value);
        const L = parseFloat(sliderL.value);
        const C = parseFloat(sliderC.value) * 1e-6; // µF a F
        const E0 = parseFloat(sliderE.value);

        valR.textContent = `${R.toFixed(1)} Ω`;
        valL.textContent = `${L.toFixed(2)} H`;
        valC.textContent = `${(C * 1e6).toFixed(0)} µF`;
        valE.textContent = `${E0.toFixed(1)} V`;

        // Telemetría matemática
        const p = RLCEngine.calculateParameters(R, L, C);

        document.getElementById("telDelta").textContent = p.delta.toFixed(1);
        document.getElementById("telZeta").textContent = p.zeta.toFixed(3);
        document.getElementById("telWn").textContent = `${p.omega_n.toFixed(1)} rad/s`;
        document.getElementById("telRcr").textContent = `${p.R_cr.toFixed(1)} Ω`;

        const pill = document.getElementById("telRegime");
        pill.textContent = p.regimeName;
        pill.className = `regime-pill ${p.regimeClass}`;

        document.getElementById("telOvershoot").textContent = p.overshootPct > 0 
            ? `+${p.overshootPct.toFixed(1)}%` 
            : '0.0%';
        document.getElementById("telPeakTime").textContent = p.t_p > 0 
            ? `${(p.t_p * 1000).toFixed(1)} ms` 
            : 'N/A';

        // Solución RK4 con paso fino (dt = 0.5 ms -> 600 puntos)
        const sol = RLCEngine.solveRK4(R, L, C, E0, 0.30, 0.0005);

        // Decimación a ~120 puntos para dibujo ultra-rápido (< 1 ms de render)
        const stride = Math.max(1, Math.floor(sol.t.length / 120));
        const labels = [];
        const vcData = [];
        const iData = [];
        const refData = [];
        const analitData = [];

        // Si la comparativa analítica está activa, calcular valores analíticos
        let analitFull = null;
        if (showAnalytical) {
            const errRes = RLCEngine.calculateResidualError(sol.t, sol.Vc, R, L, C, E0);
            analitFull = errRes.Vc_analit;
            if (valResidualError) {
                const err = errRes.maxError;
                if (err < 1e-6) {
                    valResidualError.textContent = `${(err * 1e9).toFixed(2)} nV`;
                } else if (err < 1e-3) {
                    valResidualError.textContent = `${(err * 1e6).toFixed(2)} µV`;
                } else {
                    valResidualError.textContent = `${(err * 1e3).toFixed(3)} mV`;
                }
            }
        }

        for (let i = 0; i < sol.t.length; i += stride) {
            labels.push((sol.t[i] * 1000).toFixed(0));
            vcData.push(sol.Vc[i]);
            iData.push(sol.I[i] * 10.0);
            refData.push(E0);
            if (showAnalytical && analitFull) {
                analitData.push(analitFull[i]);
            }
        }

        rk4Chart.data.labels = labels;
        rk4Chart.data.datasets[0].data = vcData;
        rk4Chart.data.datasets[1].data = iData;
        rk4Chart.data.datasets[2].data = refData;
        if (showAnalytical) {
            rk4Chart.data.datasets[3].data = analitData;
        }

        rk4Chart.update('none');

        // Actualizar Diagrama de Polos en el Plano Complejo s
        renderSPlane(p);

        // Notificar al canvas de analogía para sincronización
        AnalogiaCanvas.setResistance(R);

        // Notificar al laboratorio de audio para ajustar Q y corte
        AudioLab.updateFilterParams(R, L, C);
    };

    // Throttling por requestAnimationFrame para 60 FPS fijos
    const queueSimulationUpdate = () => {
        if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
                executeSimulation();
                rafPending = false;
            });
        }
    };

    sliderR.addEventListener("input", queueSimulationUpdate);
    sliderL.addEventListener("input", queueSimulationUpdate);
    sliderC.addEventListener("input", queueSimulationUpdate);
    sliderE.addEventListener("input", queueSimulationUpdate);

    // Botones de presets obligatorios
    const presetButtons = document.querySelectorAll(".btn-preset");
    presetButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            presetButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            sliderR.value = btn.getAttribute("data-r");
            queueSimulationUpdate();
        });
    });

    // Ejecutar simulación inicial
    executeSimulation();
}

function initBrowserFigures() {
    initValidationFigure();
    initStepFigure();
    initMultitoneFigure();
    initBodeFigure();
}

function createFigureChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const chart = new Chart(canvas.getContext("2d"), config);
    galleryCharts.push(chart);
    return chart;
}

function makeFigureLineOptions(xTitle, yTitle, xType = "linear") {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        parsing: false,
        interaction: { mode: "nearest", intersect: false },
        scales: {
            x: {
                type: xType,
                title: { display: true, text: xTitle, color: "#94a3b8" },
                grid: { color: "rgba(255, 255, 255, 0.06)" },
                ticks: { color: "#94a3b8", maxTicksLimit: 9 }
            },
            y: {
                title: { display: true, text: yTitle, color: "#94a3b8" },
                grid: { color: "rgba(255, 255, 255, 0.06)" },
                ticks: { color: "#94a3b8" }
            }
        },
        plugins: {
            legend: { labels: { color: "#f1f5f9" } },
            tooltip: {
                callbacks: {
                    label: context =>
                        `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`
                }
            }
        }
    };
}

function initValidationFigure() {
    const dtSelect = document.getElementById("validationDt");
    const responseOptions = makeFigureLineOptions("Tiempo [ms]", "V_C(t) [V]");
    responseOptions.scales.x.min = 0;
    responseOptions.scales.x.max = 400;
    responseOptions.scales.y.suggestedMin = 0;
    responseOptions.scales.y.suggestedMax = 23;

    validationChart = createFigureChart("chartValidation", {
        type: "line",
        data: {
            datasets: [
                { label: "Solución analítica", data: [], borderColor: "#cbd5e1", borderDash: [5, 4], borderWidth: 1.8, pointRadius: 0 },
                { label: "RK4", data: [], borderColor: "#38bdf8", borderWidth: 1.8, pointRadius: 0 }
            ]
        },
        options: responseOptions
    });

    const errorOptions = makeFigureLineOptions("Tiempo [ms]", "Error absoluto [nV]");
    errorOptions.scales.x.min = 0;
    errorOptions.scales.x.max = 400;
    errorOptions.scales.y.min = 0;
    validationErrorChart = createFigureChart("chartValidationError", {
        type: "line",
        data: { datasets: [{ label: "Error absoluto", data: [], borderColor: "#f59e0b", borderWidth: 1.5, pointRadius: 0 }] },
        options: errorOptions
    });

    if (!dtSelect || !validationChart || !validationErrorChart) return;

    const updateValidation = () => {
        const dt = Number(dtSelect.value);
        const solution = RLCEngine.solveRK4(10, 0.5, 200e-6, 12, 0.4, dt);
        const exact = RLCEngine.solveAnalytical(10, 0.5, 200e-6, 12, solution.t);
        const numericalData = [];
        const exactData = [];
        const errorData = [];
        let maxError = 0;
        const stride = Math.max(1, Math.ceil(solution.t.length / 3000));

        for (let i = 0; i < solution.t.length; i++) {
            const timeMs = solution.t[i] * 1000;
            const error = Math.abs(solution.Vc[i] - exact[i]);
            maxError = Math.max(maxError, error);

            if (i % stride === 0 || i === solution.t.length - 1) {
                numericalData.push({ x: timeMs, y: solution.Vc[i] });
                exactData.push({ x: timeMs, y: exact[i] });
                errorData.push({ x: timeMs, y: error * 1e9 });
            }
        }

        validationChart.data.datasets[0].data = exactData;
        validationChart.data.datasets[1].data = numericalData;
        validationChart.update("none");

        validationErrorChart.data.datasets[0].data = errorData;
        validationErrorChart.options.scales.y.max = Math.max(1, maxError * 1e9 * 1.1);
        validationErrorChart.update("none");

        document.getElementById("validationStatus").textContent =
            `R = 10 Ω • E₀ = 12 V • dt = ${(dt * 1000).toFixed(2)} ms • ` +
            `error máximo = ${(maxError * 1e9).toFixed(3)} nV`;
    };

    dtSelect.addEventListener("change", updateValidation);
    updateValidation();
}

function initStepFigure() {
    const durationSelect = document.getElementById("stepDuration");
    const resistances = [10, 50, 100, 200];
    const colors = ["#ef4444", "#f59e0b", "#22c55e", "#38bdf8"];
    const options = makeFigureLineOptions("Tiempo [ms]", "V_C(t) [V]");
    options.scales.x.min = 0;
    options.scales.y.min = 0;
    options.scales.y.suggestedMax = 23;

    stepResponseChart = createFigureChart("chartStepResponses", {
        type: "line",
        data: {
            datasets: [
                ...resistances.map((R, index) => ({
                    label: `R = ${R} Ω`,
                    data: [],
                    borderColor: colors[index],
                    borderWidth: 2,
                    pointRadius: 0
                })),
                {
                    label: "Estado permanente: 12 V",
                    data: [],
                    borderColor: "rgba(255, 255, 255, 0.65)",
                    borderDash: [4, 4],
                    borderWidth: 1.2,
                    pointRadius: 0
                }
            ]
        },
        options
    });
    if (!durationSelect || !stepResponseChart) return;

    const updateStepResponses = () => {
        const tMax = Number(durationSelect.value);
        const dt = 0.0001;
        let tableRows = "";
        let highestVoltage = 12;

        resistances.forEach((R, index) => {
            const solution = RLCEngine.solveRK4(R, 0.5, 200e-6, 12, tMax, dt);
            const data = [];
            let peak = -Infinity;
            let peakIndex = 0;
            let lastOutsideBand = -1;

            for (let i = 0; i < solution.t.length; i++) {
                const voltage = solution.Vc[i];
                data.push({ x: solution.t[i] * 1000, y: voltage });
                if (voltage > peak) {
                    peak = voltage;
                    peakIndex = i;
                }
                if (Math.abs(voltage - 12) > 0.24) lastOutsideBand = i;
            }

            stepResponseChart.data.datasets[index].data = data;
            highestVoltage = Math.max(highestVoltage, peak);

            const overshoot = Math.max(0, (peak - 12) / 12 * 100);
            const peakTime = overshoot > 0.01
                ? `${(solution.t[peakIndex] * 1000).toFixed(1)}`
                : "—";
            const settlingTime = lastOutsideBand === solution.t.length - 1
                ? `> ${(tMax * 1000).toFixed(0)}`
                : `${(solution.t[Math.max(0, lastOutsideBand + 1)] * 1000).toFixed(1)}`;

            tableRows += `<tr><td>${R}</td><td>${peak.toFixed(2)}</td><td>${overshoot.toFixed(1)}</td><td>${peakTime}</td><td>${settlingTime}</td></tr>`;
        });

        stepResponseChart.options.scales.x.max = tMax * 1000;
        stepResponseChart.options.scales.y.max = Math.max(22, highestVoltage * 1.05);
        stepResponseChart.data.datasets[4].data = [
            { x: 0, y: 12 },
            { x: tMax * 1000, y: 12 }
        ];
        stepResponseChart.update("none");
        document.getElementById("stepMetrics").innerHTML = tableRows;
    };

    durationSelect.addEventListener("change", updateStepResponses);
    updateStepResponses();
}

function initMultitoneFigure() {
    const resistanceSelect = document.getElementById("multitoneResistance");
    const dt = 1.0 / 20000.0;
    const tMax = 0.6;
    const displayStart = 0.2;
    const frequencies = [5, 50, 500];
    const multitoneInput = t =>
        Math.sin(2.0 * Math.PI * 5.0 * t) +
        Math.sin(2.0 * Math.PI * 50.0 * t) +
        Math.sin(2.0 * Math.PI * 500.0 * t);

    const timeOptions = makeFigureLineOptions("Tiempo relativo [ms]", "Voltaje [V]");
    timeOptions.scales.x.min = 0;
    timeOptions.scales.x.max = (tMax - displayStart) * 1000;
    timeOptions.scales.y.suggestedMin = -3.2;
    timeOptions.scales.y.suggestedMax = 3.2;
    multitoneChart = createFigureChart("chartMultitone", {
        type: "line",
        data: {
            datasets: [
                { label: "Entrada E(t) [V]", data: [], borderColor: "#cbd5e1", borderDash: [5, 4], borderWidth: 1.4, pointRadius: 0 },
                { label: "Salida V_C(t) [V]", data: [], borderColor: "#38bdf8", borderWidth: 2, pointRadius: 0 }
            ]
        },
        options: timeOptions
    });

    multitoneSpectrumChart = createFigureChart("chartMultitoneSpectrum", {
        type: "bar",
        data: {
            labels: frequencies.map(f => `${f} Hz`),
            datasets: [
                { label: "Entrada [V]", data: [], backgroundColor: "rgba(203, 213, 225, 0.75)" },
                { label: "Salida [V]", data: [], backgroundColor: "rgba(56, 189, 248, 0.85)" }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    title: { display: true, text: "Frecuencia [Hz]", color: "#94a3b8" },
                    ticks: { color: "#94a3b8" },
                    grid: { display: false }
                },
                y: {
                    type: "logarithmic",
                    min: 0.0001,
                    max: 1.5,
                    title: { display: true, text: "Amplitud [V], escala logarítmica", color: "#94a3b8" },
                    ticks: { color: "#94a3b8" },
                    grid: { color: "rgba(255, 255, 255, 0.06)" }
                }
            },
            plugins: {
                legend: { labels: { color: "#f1f5f9" } },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: ${context.parsed.y.toFixed(4)} V`
                    }
                }
            }
        }
    });
    if (!resistanceSelect || !multitoneChart || !multitoneSpectrumChart) return;

    const updateChart = () => {
        const R = Number(resistanceSelect.value);
        const solution = RLCEngine.solveRK4Signal(
            R, 0.5, 200e-6, multitoneInput, tMax, dt
        );
        const inputData = [];
        const outputData = [];
        const inputAmplitudes = [];
        const outputAmplitudes = [];
        const gainsDb = [];

        for (let i = 0; i < solution.t.length; i++) {
            const time = solution.t[i];
            if (time < displayStart || time > tMax) continue;

            const x = (time - displayStart) * 1000;
            inputData.push({ x, y: multitoneInput(time) });
            outputData.push({ x, y: solution.Vc[i] });
        }

        frequencies.forEach(frequency => {
            let inputSin = 0;
            let inputCos = 0;
            let outputSin = 0;
            let outputCos = 0;
            let sampleCount = 0;

            for (let i = 0; i < solution.t.length; i++) {
                const time = solution.t[i];
                if (time < displayStart || time >= tMax) continue;

                const phase = 2.0 * Math.PI * frequency * time;
                const sine = Math.sin(phase);
                const cosine = Math.cos(phase);
                inputSin += multitoneInput(time) * sine;
                inputCos += multitoneInput(time) * cosine;
                outputSin += solution.Vc[i] * sine;
                outputCos += solution.Vc[i] * cosine;
                sampleCount++;
            }

            const inputAmplitude = 2.0 * Math.hypot(inputSin, inputCos) / sampleCount;
            const outputAmplitude = 2.0 * Math.hypot(outputSin, outputCos) / sampleCount;
            inputAmplitudes.push(inputAmplitude);
            outputAmplitudes.push(outputAmplitude);
            gainsDb.push(20.0 * Math.log10(outputAmplitude / inputAmplitude));
        });

        multitoneChart.data.datasets[0].data = inputData;
        multitoneChart.data.datasets[1].data = outputData;
        multitoneChart.data.datasets[1].label = `Salida V_C(t), R = ${R} Ω`;
        multitoneChart.update("none");

        multitoneSpectrumChart.data.datasets[0].data = inputAmplitudes;
        multitoneSpectrumChart.data.datasets[1].data = outputAmplitudes;
        multitoneSpectrumChart.data.datasets[1].label = `Salida, R = ${R} Ω`;
        multitoneSpectrumChart.update("none");

        document.getElementById("multitoneStatus").textContent =
            `RK4 • dt = ${(dt * 1e6).toFixed(0)} µs • R = ${R} Ω • ` +
            `Ganancia: ${frequencies.map((f, i) => `${f} Hz ${gainsDb[i] >= 0 ? "+" : ""}${gainsDb[i].toFixed(1)} dB`).join(" | ")}`;
    };

    resistanceSelect.addEventListener("change", updateChart);
    updateChart();
}

function initBodeFigure() {
    const resistanceSelect = document.getElementById("bodeResistance");
    const resistances = [10, 50, 100, 200];
    const colors = ["#ef4444", "#f59e0b", "#22c55e", "#38bdf8"];
    const frequenciesOfInterest = [5, 50, 500];
    const magnitudeOptions = makeFigureLineOptions("Frecuencia f [Hz], escala logarítmica", "Ganancia |H| [dB]", "logarithmic");
    const phaseOptions = makeFigureLineOptions("Frecuencia f [Hz], escala logarítmica", "Fase [grados]", "logarithmic");
    magnitudeOptions.scales.x.min = 1;
    magnitudeOptions.scales.x.max = 1000;
    magnitudeOptions.scales.y.min = -65;
    magnitudeOptions.scales.y.max = 16;
    phaseOptions.scales.x.min = 1;
    phaseOptions.scales.x.max = 1000;
    phaseOptions.scales.y.min = -190;
    phaseOptions.scales.y.max = 10;

    bodeMagnitudeChart = createFigureChart("chartBodeMagnitude", {
        type: "line",
        data: { datasets: [] },
        options: magnitudeOptions
    });
    bodePhaseChart = createFigureChart("chartBodePhase", {
        type: "line",
        data: { datasets: [] },
        options: phaseOptions
    });
    if (!resistanceSelect || !bodeMagnitudeChart || !bodePhaseChart) return;

    const bodeResults = resistances.map((R, index) => {
        const result = RLCEngine.calculateBode(R, 0.5, 200e-6, 181);
        return {
            R,
            color: colors[index],
            data: result.freqs.map((frequency, i) => ({ x: frequency, y: result.mag_db[i] })),
            phase: result.freqs.map((frequency, i) => ({ x: frequency, y: result.phase_deg[i] }))
        };
    });

    bodeMagnitudeChart.data.datasets = bodeResults.map(result => ({
        label: `R = ${result.R} Ω`,
        data: result.data,
        borderColor: result.color,
        borderWidth: 2,
        pointRadius: 0
    }));
    const naturalFrequency = RLCEngine.calculateParameters(50, 0.5, 200e-6).f_n;
    bodeMagnitudeChart.data.datasets.push({
        label: `f_n = ${naturalFrequency.toFixed(2)} Hz`,
        data: [{ x: naturalFrequency, y: -65 }, { x: naturalFrequency, y: 16 }],
        borderColor: "rgba(255, 255, 255, 0.7)",
        borderDash: [3, 4],
        borderWidth: 1.2,
        pointRadius: 0
    });
    bodePhaseChart.data.datasets = bodeResults.map(result => ({
        label: `R = ${result.R} Ω`,
        data: result.phase,
        borderColor: result.color,
        borderWidth: 2,
        pointRadius: 0
    }));
    bodePhaseChart.data.datasets.push({
        label: `f_n = ${naturalFrequency.toFixed(2)} Hz`,
        data: [{ x: naturalFrequency, y: -190 }, { x: naturalFrequency, y: 10 }],
        borderColor: "rgba(255, 255, 255, 0.7)",
        borderDash: [3, 4],
        borderWidth: 1.2,
        pointRadius: 0
    });

    const updateBodeSelection = () => {
        const selected = resistanceSelect.value;
        const visibleResistances = selected === "all" ? resistances : [Number(selected)];

        bodeMagnitudeChart.data.datasets.slice(0, resistances.length).forEach(dataset => {
            dataset.hidden = selected !== "all" && dataset.label !== `R = ${selected} Ω`;
        });
        bodePhaseChart.data.datasets.slice(0, resistances.length).forEach(dataset => {
            dataset.hidden = selected !== "all" && dataset.label !== `R = ${selected} Ω`;
        });
        bodeMagnitudeChart.update("none");
        bodePhaseChart.update("none");

        document.getElementById("bodeMetrics").innerHTML = visibleResistances.map(R => {
            const gains = frequenciesOfInterest.map(frequency =>
                RLCEngine.calculateFrequencyResponse(R, 0.5, 200e-6, frequency).gainDb
            );
            return `<tr><td>${R}</td>${gains.map(gain => `<td>${gain.toFixed(2)}</td>`).join("")}</tr>`;
        }).join("");

        document.getElementById("bodeStatus").textContent =
            `Frecuencia natural: ${naturalFrequency.toFixed(2)} Hz • Pendiente asintótica en altas frecuencias: −40 dB/década`;
    };

    resistanceSelect.addEventListener("change", updateBodeSelection);
    updateBodeSelection();
}

/**
 * ==============================================================================
 * DIBUJO DEL PLANO COMPLEJO s (LUGAR DE LAS RAÍCES Y ESTABILIDAD)
 * ==============================================================================
 */
function renderSPlane(p) {
    const canvas = document.getElementById("canvasSPlane");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const baseW = 580;
    const baseH = 280;

    if (canvas.width !== baseW * dpr) {
        canvas.width = baseW * dpr;
        canvas.height = baseH * dpr;
        canvas.style.width = "100%";
        canvas.style.maxWidth = `${baseW}px`;
        canvas.style.height = `${baseH}px`;
    }

    if (ctx.resetTransform) {
        ctx.resetTransform();
    } else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.scale(dpr, dpr);

    // Limpiar canvas con tono recogido obsidian
    ctx.fillStyle = "#0b111e";
    ctx.fillRect(0, 0, baseW, baseH);

    // Origen coordenado en el canvas (lado derecho para enfatizar LHP Re(s) < 0)
    const originX = 430;
    const originY = 140;
    const scale = 1.45; // 1 unidad = 1.45 px

    // 1. Sombrear el Semiplano Izquierdo Estable (LHP: Re(s) < 0)
    ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
    ctx.fillRect(0, 0, originX, baseH);

    // 2. Líneas de cuadrícula sutiles
    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;
    for (let r = -250; r <= 50; r += 50) {
        const x = originX + r * scale;
        if (x >= 0 && x <= baseW) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, baseH);
            ctx.stroke();
        }
    }
    for (let im = -100; im <= 100; im += 50) {
        const y = originY - im * scale;
        if (y >= 0 && y <= baseH) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(baseW, y);
            ctx.stroke();
        }
    }

    // 3. Eje Real (\sigma) y Eje Imaginario (j\omega)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1.5;

    // Eje Real (horizontal)
    ctx.beginPath();
    ctx.moveTo(10, originY);
    ctx.lineTo(baseW - 10, originY);
    ctx.stroke();

    // Eje Imaginario (vertical)
    ctx.beginPath();
    ctx.moveTo(originX, 10);
    ctx.lineTo(originX, baseH - 10);
    ctx.stroke();

    // Flechas y etiquetas de ejes
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 11px 'Fira Code', monospace";
    ctx.fillText("σ [s⁻¹]", baseW - 55, originY - 8);
    ctx.fillText("+jω [rad/s]", originX + 8, 22);
    ctx.fillText("-jω", originX + 8, baseH - 15);
    ctx.fillText("0", originX + 6, originY + 14);

    // 4. Círculo de Frecuencia Natural \omega_n = 100 rad/s
    const rWn = p.omega_n * scale;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(originX, originY, rWn, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Etiqueta del círculo \omega_n
    ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
    ctx.fillText(`|ωₙ| = ${p.omega_n.toFixed(0)}`, originX - rWn - 10, originY - 10);

    // 5. Graficar los Polos (Raíces de la ecuación característica)
    if (p.poles && p.poles.length >= 2) {
        p.poles.forEach((pole, idx) => {
            const px = originX + pole.real * scale;
            const py = originY - pole.imag * scale;

            // Halo suave
            ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
            ctx.beginPath();
            ctx.arc(px, py, 10, 0, 2 * Math.PI);
            ctx.fill();

            // Dibujar cruz 'X'
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(px - 6, py - 6);
            ctx.lineTo(px + 6, py + 6);
            ctx.moveTo(px + 6, py - 6);
            ctx.lineTo(px - 6, py + 6);
            ctx.stroke();

            // Texto de coordenada del polo
            ctx.fillStyle = "#ffffff";
            ctx.font = "700 10px 'Fira Code', monospace";
            const textOffset = idx === 0 ? -14 : 18;
            ctx.fillText(`s${idx + 1}`, px + 8, py + textOffset);
        });

        // Actualizar detalles textuales
        const elP1 = document.getElementById("poleVal1");
        const elP2 = document.getElementById("poleVal2");
        const elAlpha = document.getElementById("poleAlpha");
        const elWd = document.getElementById("poleWd");
        const elBadge = document.getElementById("splaneRegimeBadge");

        if (elP1) elP1.textContent = p.poles[0].label;
        if (elP2) elP2.textContent = p.poles[1].label;
        if (elAlpha) elAlpha.textContent = `${p.alpha.toFixed(1)} s⁻¹`;
        if (elWd) {
            elWd.textContent = p.omega_d > 0 
                ? `${p.omega_d.toFixed(2)} rad/s (${(p.omega_d / (2 * Math.PI)).toFixed(2)} Hz)` 
                : '0 rad/s (Aperiódico)';
        }
        if (elBadge) {
            elBadge.textContent = p.regimeName;
            elBadge.className = `regime-pill ${p.regimeClass}`;
        }
    }
}

/**
 * ==============================================================================
 * 3. TEMPORIZADOR DE DEFENSA DE 15 MINUTOS CON BARRA DE PROGRESO
 * ==============================================================================
 */
let timerInterval = null;
let secondsRemaining = 15 * 60; // 900 s
let isTimerRunning = false;

function initDefenseTimer() {
    const display = document.getElementById("timerDisplay");
    const btnToggle = document.getElementById("btnTimerToggle");
    const btnReset = document.getElementById("btnTimerReset");
    const progressBar = document.getElementById("defenseProgressBar");
    const speakerCards = document.querySelectorAll(".speaker-card");

    const updateDisplay = () => {
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        // Barra de progreso y cálculo de intervalos
        const elapsed = 900 - secondsRemaining;
        if (progressBar) {
            const pct = Math.min(100, Math.max(0, (elapsed / 900) * 100));
            progressBar.style.width = `${pct}%`;
        }

        // 4 intervalos de 225 segundos (3m 45s c/u)
        const activeIndex = Math.min(3, Math.floor(elapsed / 225));

        speakerCards.forEach((card, idx) => {
            if (idx === activeIndex) {
                card.classList.add("active-speaker");
            } else {
                card.classList.remove("active-speaker");
            }
        });
    };

    btnToggle.addEventListener("click", () => {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            btnToggle.innerHTML = '<i data-lucide="play"></i> <span>Continuar</span>';
            if (window.lucide) lucide.createIcons();
        } else {
            isTimerRunning = true;
            btnToggle.innerHTML = '<i data-lucide="pause"></i> <span>Pausar</span>';
            if (window.lucide) lucide.createIcons();
            timerInterval = setInterval(() => {
                if (secondsRemaining > 0) {
                    secondsRemaining--;
                    updateDisplay();
                } else {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    btnToggle.innerHTML = '<i data-lucide="check-circle-2"></i> <span>Tiempo Cumplido</span>';
                    if (window.lucide) lucide.createIcons();
                }
            }, 1000);
        }
    });

    btnReset.addEventListener("click", () => {
        clearInterval(timerInterval);
        isTimerRunning = false;
        secondsRemaining = 15 * 60;
        btnToggle.innerHTML = '<i data-lucide="play"></i> <span>Iniciar Defensa</span>';
        if (window.lucide) lucide.createIcons();
        updateDisplay();
    });

    updateDisplay();
}

/**
 * ==============================================================================
 * 4. ACORDEÓN DE PREGUNTAS DEL JURADO
 * ==============================================================================
 */
function initQuestionsAccordion() {
    const headers = document.querySelectorAll(".question-header");
    headers.forEach(header => {
        header.addEventListener("click", () => {
            const item = header.parentElement;
            const wasOpen = item.classList.contains("open");
            document.querySelectorAll(".question-item").forEach(i => i.classList.remove("open"));
            if (!wasOpen) {
                item.classList.add("open");
            }
        });
    });
}

/**
 * ==============================================================================
 * 5. MODAL DE ZOOM DE FIGURAS
 * ==============================================================================
 */
function initImageModal() {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const modalClose = document.getElementById("modalClose");
    const figureImgs = document.querySelectorAll(".figure-img-wrap");

    figureImgs.forEach(wrap => {
        wrap.addEventListener("click", () => {
            const img = wrap.querySelector(".figure-img");
            if (img && modal && modalImg) {
                modalImg.src = img.src;
                modal.classList.add("active");
            }
        });
    });

    if (modalClose) {
        modalClose.addEventListener("click", () => {
            modal.classList.remove("active");
        });
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
            }
        });
    }

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal && modal.classList.contains("active")) {
            modal.classList.remove("active");
        }
    });
}

/**
 * ==============================================================================
 * 6. LABORATORIO DE AUDIO & ENTRADAS EN VIVO (MICRÓFONO Y ARCHIVO)
 * ==============================================================================
 */
function initAudioStudio() {
    const btnPlaySynth = document.getElementById("btnPlaySynth");
    const btnToggleFilter = document.getElementById("btnToggleFilter");
    const btnLiveMic = document.getElementById("btnLiveMic");
    const audioFileInput = document.getElementById("audioFileInput");

    if (btnPlaySynth) {
        btnPlaySynth.addEventListener("click", () => {
            if (AudioLab.isPlaying && AudioLab.currentSource === 'synth') {
                AudioLab.stopAllAudio();
            } else {
                AudioLab.startLiveSynth();
            }
        });
    }

    if (btnToggleFilter) {
        btnToggleFilter.addEventListener("click", () => {
            AudioLab.toggleFilter();
        });
    }

    if (btnLiveMic) {
        btnLiveMic.addEventListener("click", () => {
            AudioLab.startLiveMic();
        });
    }

    if (audioFileInput) {
        audioFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                AudioLab.loadCustomFile(e.target.files[0]);
            }
        });
    }

    // Controles de la analogía masa-resorte
    const btnPlayAnalogia = document.getElementById("btnPlayAnalogia");
    const btnResetAnalogia = document.getElementById("btnResetAnalogia");

    if (btnPlayAnalogia) {
        btnPlayAnalogia.addEventListener("click", () => {
            if (AnalogiaCanvas.isRunning) {
                AnalogiaCanvas.pause();
            } else {
                AnalogiaCanvas.start();
            }
        });
    }

    if (btnResetAnalogia) {
        btnResetAnalogia.addEventListener("click", () => {
            AnalogiaCanvas.reset();
        });
    }
}

/**
 * ==============================================================================
 * 7. MODO PRESENTACIÓN MAGISTRAL & ATAJOS DE TECLADO
 * ==============================================================================
 */
function initPresentationMode() {
    const btnPres = document.getElementById("btnPresentationMode");
    if (!btnPres) return;

    btnPres.addEventListener("click", () => {
        const isPres = document.body.classList.toggle("presentation-mode");
        btnPres.classList.toggle("active", isPres);

        if (isPres) {
            if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } else {
            if (document.exitFullscreen && document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        }
    });
}

function initKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
        // Evitar interceptar teclas si el foco está en un slider o campo
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
        const currentIndex = tabButtons.findIndex(btn => btn.classList.contains("active"));

        if (e.key === "ArrowRight") {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % tabButtons.length;
            tabButtons[nextIndex].click();
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
            tabButtons[prevIndex].click();
        } else if (e.code === "Space") {
            e.preventDefault();
            const btnToggle = document.getElementById("btnTimerToggle");
            if (btnToggle) btnToggle.click();
        } else if (e.key === "p" || e.key === "P") {
            e.preventDefault();
            const btnPres = document.getElementById("btnPresentationMode");
            if (btnPres) btnPres.click();
        } else if (e.key === "r" || e.key === "R") {
            e.preventDefault();
            const btnReset = document.getElementById("btnTimerReset");
            if (btnReset) btnReset.click();
        }
    });
}
