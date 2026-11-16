/**
 * ==============================================================================
 * MOTOR CIENTÍFICO RLC: SIMULACIÓN RK4 Y MODELADO ANALÍTICO
 * Proyecto 2: El Circuito RLC como Filtro de Audio
 * Institución Universitaria Colegio Mayor del Cauca - Grupo 3
 * ==============================================================================
 */

const RLCEngine = {
    /**
     * Calcula los parámetros físicos, frecuencias y régimen de amortiguamiento.
     */
    calculateParameters(R, L, C) {
        const omega_n = 1.0 / Math.sqrt(L * C);
        const f_n = omega_n / (2.0 * Math.PI);
        const R_cr = 2.0 * Math.sqrt(L / C);
        const delta = Math.pow(R, 2) - (4.0 * L) / C;
        const zeta = R / R_cr;
        const alpha = R / (2.0 * L);

        let regimeName = "";
        let regimeClass = "";
        let omega_d = 0;
        let t_p = 0;
        let overshootPct = 0;

        if (delta < -1e-7) {
            regimeName = "Subamortiguado (Oscilatorio)";
            regimeClass = "regime-sub";
            omega_d = Math.sqrt(Math.pow(omega_n, 2) - Math.pow(alpha, 2));
            t_p = Math.PI / omega_d; // Tiempo del primer pico
            overshootPct = Math.exp(-alpha * (Math.PI / omega_d)) * 100.0;
        } else if (Math.abs(delta) <= 1e-7) {
            regimeName = "Críticamente Amortiguado";
            regimeClass = "regime-crit";
            omega_d = 0;
            t_p = 0;
            overshootPct = 0;
        } else {
            regimeName = "Sobreamortiguado (Aperiódico)";
            regimeClass = "regime-over";
            omega_d = 0;
            t_p = 0;
            overshootPct = 0;
        }

        // Cálculo de polos en el plano complejo s (Raíces de la EDO)
        let poles = [];
        if (delta < -1e-7) {
            poles = [
                { real: -alpha, imag: omega_d, label: `-${alpha.toFixed(1)} + j${omega_d.toFixed(1)} rad/s` },
                { real: -alpha, imag: -omega_d, label: `-${alpha.toFixed(1)} - j${omega_d.toFixed(1)} rad/s` }
            ];
        } else if (Math.abs(delta) <= 1e-7) {
            poles = [
                { real: -alpha, imag: 0, label: `-${alpha.toFixed(1)} s⁻¹ (raíz doble)` },
                { real: -alpha, imag: 0, label: `-${alpha.toFixed(1)} s⁻¹ (raíz doble)` }
            ];
        } else {
            const sqrtDelta = Math.sqrt(delta);
            const s1 = (-R + sqrtDelta) / (2.0 * L);
            const s2 = (-R - sqrtDelta) / (2.0 * L);
            poles = [
                { real: s1, imag: 0, label: `${s1.toFixed(1)} s⁻¹` },
                { real: s2, imag: 0, label: `${s2.toFixed(1)} s⁻¹` }
            ];
        }

        return {
            R, L, C,
            omega_n,
            f_n,
            R_cr,
            delta,
            zeta,
            alpha,
            omega_d,
            t_p,
            overshootPct,
            regimeName,
            regimeClass,
            poles
        };
    },

    /**
     * Calcula la solución analítica exacta y el error residual infinito L_inf = max |V_num - V_exacta|.
     */
    calculateResidualError(tArray, Vc_num, R, L, C, E0) {
        const Vc_analit = this.solveAnalytical(R, L, C, E0, tArray);
        let maxError = 0.0;
        const N = tArray.length;
        for (let i = 0; i < N; i++) {
            const err = Math.abs(Vc_num[i] - Vc_analit[i]);
            if (err > maxError) maxError = err;
        }
        return { maxError, Vc_analit };
    },

    /**
     * Integrador numérico Runge-Kutta de 4to orden (RK4) para el circuito RLC serie.
     * EDO: L*Q'' + R*Q' + (1/C)*Q = E0 (Escalón)
     */
    solveRK4(R, L, C, E0 = 12.0, tMax = 0.35, dt = 0.0001) {
        const N = Math.floor(tMax / dt) + 1;
        const t = new Float64Array(N);
        const Vc = new Float64Array(N);
        const I = new Float64Array(N);
        const Q = new Float64Array(N);

        let q = 0.0;
        let i = 0.0;
        const invL = 1.0 / L;
        const invC = 1.0 / C;

        const f_derivatives = (curr_q, curr_i) => {
            const dq_dt = curr_i;
            const di_dt = (E0 - R * curr_i - invC * curr_q) * invL;
            return [dq_dt, di_dt];
        };

        for (let step = 0; step < N; step++) {
            const curr_t = step * dt;
            t[step] = curr_t;
            Q[step] = q;
            Vc[step] = q * invC;
            I[step] = i;

            if (step < N - 1) {
                // k1
                const [k1_q, k1_i] = f_derivatives(q, i);

                // k2
                const q_k2 = q + 0.5 * dt * k1_q;
                const i_k2 = i + 0.5 * dt * k1_i;
                const [k2_q, k2_i] = f_derivatives(q_k2, i_k2);

                // k3
                const q_k3 = q + 0.5 * dt * k2_q;
                const i_k3 = i + 0.5 * dt * k2_i;
                const [k3_q, k3_i] = f_derivatives(q_k3, i_k3);

                // k4
                const q_k4 = q + dt * k3_q;
                const i_k4 = i + dt * k3_i;
                const [k4_q, k4_i] = f_derivatives(q_k4, i_k4);

                // Actualizar estado
                q += (dt / 6.0) * (k1_q + 2.0 * k2_q + 2.0 * k3_q + k4_q);
                i += (dt / 6.0) * (k1_i + 2.0 * k2_i + 2.0 * k3_i + k4_i);
            }
        }

        return { t, Vc, I, Q };
    },

    /**
     * Solución analítica exacta ante un escalón de voltaje E0 con condiciones de reposo.
     */
    solveAnalytical(R, L, C, E0, tArray) {
        const p = this.calculateParameters(R, L, C);
        const N = tArray.length;
        const Vc = new Float64Array(N);

        if (p.delta < -1e-7) {
            // Subamortiguado
            for (let i = 0; i < N; i++) {
                const t = tArray[i];
                const decay = Math.exp(-p.alpha * t);
                const osc = Math.cos(p.omega_d * t) + (p.alpha / p.omega_d) * Math.sin(p.omega_d * t);
                Vc[i] = E0 * (1.0 - decay * osc);
            }
        } else if (Math.abs(p.delta) <= 1e-7) {
            // Críticamente amortiguado
            for (let i = 0; i < N; i++) {
                const t = tArray[i];
                Vc[i] = E0 * (1.0 - Math.exp(-p.alpha * t) * (1.0 + p.alpha * t));
            }
        } else {
            // Sobreamortiguado
            const s1 = -p.alpha + Math.sqrt(p.delta) / (2.0 * L);
            const s2 = -p.alpha - Math.sqrt(p.delta) / (2.0 * L);
            for (let i = 0; i < N; i++) {
                const t = tArray[i];
                const term = (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
                Vc[i] = E0 * (1.0 - term);
            }
        }

        return Vc;
    },

    /**
     * Calcula la respuesta en frecuencia (Magnitud en dB y Fase en grados).
     */
    calculateBode(R, L, C, numPoints = 120) {
        const omega_n = 1.0 / Math.sqrt(L * C);
        const f_n = omega_n / (2.0 * Math.PI);
        const zeta = R / (2.0 * Math.sqrt(L / C));

        const freqs = [];
        const mag_db = [];
        const phase_deg = [];

        // Frecuencias desde 1 Hz hasta 1000 Hz en escala logarítmica
        const logMin = 0;   // 10^0 = 1 Hz
        const logMax = 3;   // 10^3 = 1000 Hz
        const step = (logMax - logMin) / (numPoints - 1);

        for (let i = 0; i < numPoints; i++) {
            const f = Math.pow(10, logMin + i * step);
            const omega = 2.0 * Math.PI * f;
            const w_ratio = omega / omega_n;

            // Denominador: (1 - (w/wn)^2) + j*(2*zeta*(w/wn))
            const real = 1.0 - Math.pow(w_ratio, 2);
            const imag = 2.0 * zeta * w_ratio;
            const denomMag = Math.sqrt(Math.pow(real, 2) + Math.pow(imag, 2));

            const H_mag = 1.0 / denomMag;
            const H_db = 20.0 * Math.log10(H_mag);
            let H_phase = -Math.atan2(imag, real) * (180.0 / Math.PI);

            freqs.push(f);
            mag_db.push(H_db);
            phase_deg.push(H_phase);
        }

        return { freqs, mag_db, phase_deg, f_n };
    }
};
