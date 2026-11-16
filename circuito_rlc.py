#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
PROYECTO DE AULA: UNIDAD 3 - ECUACIONES DIFERENCIALES DE ORDEN SUPERIOR
PROYECTO 2: El circuito RLC como filtro de audio
INSTITUCIÓN: Institución Universitaria Colegio Mayor del Cauca
FACULTAD: Ingeniería - Ingeniería Informática
GRUPO 3:
    - ACOSTA GALINDEZ JESSICA VANESA
    - BERMUDEZ ZAMORA KEVIN DANIEL
    - LOPEZ QUIRA ALVARO JOSE
    - MUÑOZ DULCEY JORGE ENRIQUE
===============================================================================
Descripción:
    Este script implementa el análisis numérico, validación analítica,
    diagrama de Bode en frecuencia y filtrado de señales de audio usando el
    modelo físico de un circuito RLC serie como filtro pasa-bajo de segundo orden.

Ecuación gobernante:
    L * Q''(t) + R * Q'(t) + (1/C) * Q(t) = E(t)
    V_C(t) = Q(t) / C

Parámetros base:
    L = 0.5 H
    C = 200 µF = 200 * 10^-6 F
    R in {10, 50, 100, 200} Ohms
===============================================================================
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from scipy.io import wavfile

# Configuración global de estilo para gráficos de calidad de publicación
plt.rcParams.update({
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 13,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'figure.titlesize': 14,
    'lines.linewidth': 1.8,
    'grid.alpha': 0.6,
    'grid.linestyle': '--'
})

# =============================================================================
# 1. PARÁMETROS FÍSICOS Y CONSTANTES DEL SISTEMA
# =============================================================================
L_NOMINAL = 0.5            # Inductancia en Henrios [H]
C_NOMINAL = 200e-6         # Capacitancia en Faradios [F] (200 µF)
RESISTENCIAS = [10.0, 50.0, 100.0, 200.0]  # Resistencias en Ohmios [Ω]
E_ESCALON = 12.0           # Amplitud del escalón de voltaje en Voltios [V]

# Parámetros teóricos derivados
OMEGA_N = 1.0 / np.sqrt(L_NOMINAL * C_NOMINAL)      # 100.0 rad/s
F_N = OMEGA_N / (2.0 * np.pi)                       # ~15.9155 Hz
R_CRITICA = 2.0 * np.sqrt(L_NOMINAL / C_NOMINAL)    # 100.0 Ω

print("=" * 75)
print("PROYECTO 2: EL CIRCUITO RLC COMO FILTRO DE AUDIO - GRUPO 3")
print("=" * 75)
print(f"Inductancia base (L):         {L_NOMINAL:.4f} H")
print(f"Capacitancia base (C):        {C_NOMINAL * 1e6:.1f} µF ({C_NOMINAL} F)")
print(f"Frecuencia natural (omega_n): {OMEGA_N:.2f} rad/s")
print(f"Frecuencia natural (f_n):     {F_N:.4f} Hz")
print(f"Resistencia crítica (R_cr):   {R_CRITICA:.2f} Ω")
print("=" * 75)


# =============================================================================
# 2. IMPLEMENTACIÓN DEL MODELO DE ESTADO Y MÉTODO RUNGE-KUTTA 4 (RK4)
# =============================================================================
def sistema_rlc_derivadas(t, state, R, L, C, fuente_func):
    """
    Define el sistema de ecuaciones diferenciales de 1er orden en variables de estado.
    
    Variables de estado:
        state[0] = Q(t)  (Carga en el condensador, Coulombs)
        state[1] = I(t)  (Corriente en el circuito, Amperios = dQ/dt)
        
    Ecuaciones:
        dQ/dt = I
        dI/dt = (1/L) * [E(t) - R*I - (1/C)*Q]
    """
    Q, I = state[0], state[1]
    E_t = fuente_func(t)
    
    dQ_dt = I
    dI_dt = (E_t - R * I - (1.0 / C) * Q) / L
    return np.array([dQ_dt, dI_dt], dtype=np.float64)


def rk4_integrador(f, y0, t_array, R, L, C, fuente_func):
    """
    Integrador numérico manual Runge-Kutta de 4to orden (RK4).
    
    Parámetros:
        f           : Función que calcula las derivadas del sistema [dQ/dt, dI/dt]
        y0          : Vector de condiciones iniciales [Q(0), I(0)]
        t_array     : Vector temporal equidistante con paso h = t[1] - t[0]
        R, L, C     : Parámetros del circuito
        fuente_func : Función de excitación de voltaje E(t)
        
    Retorna:
        solucion : Matriz de tamaño (N, 2) con [Q(t), I(t)] en cada instante.
    """
    N = len(t_array)
    dt = t_array[1] - t_array[0]
    solucion = np.zeros((N, 2), dtype=np.float64)
    solucion[0] = y0
    
    y = np.array(y0, dtype=np.float64)
    for i in range(N - 1):
        t_curr = t_array[i]
        
        k1 = f(t_curr, y, R, L, C, fuente_func)
        k2 = f(t_curr + 0.5 * dt, y + 0.5 * dt * k1, R, L, C, fuente_func)
        k3 = f(t_curr + 0.5 * dt, y + 0.5 * dt * k2, R, L, C, fuente_func)
        k4 = f(t_curr + dt, y + dt * k3, R, L, C, fuente_func)
        
        y = y + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)
        solucion[i + 1] = y
        
    return solucion


# =============================================================================
# 3. SOLUCIÓN ANALÍTICA EXACTA (Para R = 10 Ω, E(t) = 12 V, reposo inicial)
# =============================================================================
def solucion_analitica_vc(t_array, R=10.0, L=0.5, C=200e-6, E0=12.0):
    """
    Calcula la solución analítica exacta de V_C(t) para el caso subamortiguado
    ante un escalón de voltaje E0 con condiciones de reposo inicial Q(0)=0, I(0)=0.
    
    Ecuación característica:
        L*r^2 + R*r + (1/C) = 0
        r = -alpha ± j*omega_d
        alpha = R / (2L) = 10 / (2 * 0.5) = 10 s^-1
        omega_d = sqrt(omega_n^2 - alpha^2) = sqrt(10000 - 100) = sqrt(9900) = 10*sqrt(99) rad/s
        
    Voltaje en el condensador:
        V_C(t) = E0 * [1 - exp(-alpha*t) * (cos(omega_d*t) + (alpha/omega_d)*sin(omega_d*t))]
    """
    alpha = R / (2.0 * L)
    omega_n_sq = 1.0 / (L * C)
    omega_d = np.sqrt(omega_n_sq - alpha**2)
    
    decay = np.exp(-alpha * t_array)
    oscilacion = np.cos(omega_d * t_array) + (alpha / omega_d) * np.sin(omega_d * t_array)
    vc = E0 * (1.0 - decay * oscilacion)
    
    # Carga Q(t) = C * V_C(t)
    # Corriente I(t) = dQ/dt = (E0 / (omega_d * L)) * exp(-alpha*t) * sin(omega_d*t)
    corriente = (E0 / (omega_d * L)) * decay * np.sin(omega_d * t_array)
    
    return vc, corriente, alpha, omega_d


# =============================================================================
# 4. GENERACIÓN DE FIGURA 1: VALIDACIÓN ANALÍTICA VS. NUMÉRICA (R = 10 Ω)
# =============================================================================
def generar_figura1_validacion():
    print("[1/4] Generando Figura 1: Validación Analítica vs. Numérica (RK4)...")
    t_span = np.linspace(0.0, 0.4, 4001)  # dt = 0.0001 s = 0.1 ms
    
    # Simulación numérica RK4
    y0 = [0.0, 0.0]  # Q(0) = 0, I(0) = 0
    fuente_escalon = lambda t: E_ESCALON
    sol_rk4 = rk4_integrador(
        sistema_rlc_derivadas, y0, t_span,
        R=10.0, L=L_NOMINAL, C=C_NOMINAL, fuente_func=fuente_escalon
    )
    vc_num = sol_rk4[:, 0] / C_NOMINAL
    
    # Solución analítica exacta
    vc_analit, _, alpha, omega_d = solucion_analitica_vc(
        t_span, R=10.0, L=L_NOMINAL, C=C_NOMINAL, E0=E_ESCALON
    )
    
    # Residuos y métricas de error
    error_absoluto = np.abs(vc_num - vc_analit)
    error_max = np.max(error_absoluto)
    error_rms = np.sqrt(np.mean(error_absoluto**2))
    
    print(f"      -> Error Máximo Absoluto (L_inf): {error_max:.6e} V")
    print(f"      -> Error RMS (L_2):              {error_rms:.6e} V")
    
    # Creación de figura con dos subplots (Solución y Residuo)
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 7.5), sharex=True, 
                                   gridspec_kw={'height_ratios': [2.8, 1.2]})
    
    # Panel superior: Curvas
    ax1.plot(t_span * 1000, vc_analit, 'b-', label=r'Solución Analítica Exacta $V_C(t)$', linewidth=2.5)
    ax1.plot(t_span[::40] * 1000, vc_num[::40], 'ro', markersize=4.5, 
             label=r'Simulación Numérica RK4 ($h = 0.1$ ms)', alpha=0.85)
    ax1.axhline(E_ESCALON, color='k', linestyle=':', label=r'Tensión en Permanente $E_0 = 12$ V')
    
    # Anotación del pico de sobreimpulso
    idx_max = np.argmax(vc_analit)
    t_peak_ms = t_span[idx_max] * 1000
    vc_peak = vc_analit[idx_max]
    overshoot_pct = ((vc_peak - E_ESCALON) / E_ESCALON) * 100.0
    ax1.plot(t_peak_ms, vc_peak, 'ks', markersize=7)
    ax1.annotate(
        f"Pico Máximo:\n$t_p = {t_peak_ms:.2f}$ ms\n$V_{{C,\\max}} = {vc_peak:.2f}$ V\nSobreimpulso: {overshoot_pct:.1f}%",
        xy=(t_peak_ms, vc_peak), xytext=(t_peak_ms + 25, vc_peak - 1.5),
        arrowprops=dict(arrowstyle="->", color="black", lw=1.2),
        bbox=dict(boxstyle="round,pad=0.4", fc="lightyellow", ec="orange", lw=1)
    )
    
    ax1.set_title(r"Validación del Modelo RLC Serie ante Escalón de Voltaje de 12 V ($R = 10\ \Omega$)", fontweight='bold')
    ax1.set_ylabel(r"Voltaje en el Condensador $V_C(t)$ [V]")
    ax1.legend(loc='lower right', framealpha=0.9)
    ax1.grid(True)
    ax1.set_ylim(-1, 23)
    
    # Panel inferior: Error / Residuo numérico
    ax2.plot(t_span * 1000, error_absoluto, 'r-', linewidth=1.5, label=r'Error Absoluto $|V_{C,\mathrm{num}} - V_{C,\mathrm{analit}}|$')
    ax2.set_xlabel(r"Tiempo $t$ [milisegundos, ms]")
    ax2.set_ylabel(r"Error [V]")
    ax2.grid(True)
    ax2.legend(loc='upper right')
    ax2.ticklabel_format(axis='y', style='sci', scilimits=(0, 0))
    ax2.set_xlim(0, 400)
    
    plt.tight_layout()
    output_path = "figura1_validacion_rk4_vs_analitica.png"
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"      -> Guardado exitoso: {output_path}")


# =============================================================================
# 5. GENERACIÓN DE FIGURA 2: COMPARATIVA DE REGÍMENES DE AMORTIGUAMIENTO
# =============================================================================
def generar_figura2_regimenes():
    print("[2/4] Generando Figura 2: Comparativa de Regímenes de Amortiguamiento...")
    t_span = np.linspace(0.0, 0.25, 2501)  # 250 ms
    y0 = [0.0, 0.0]
    fuente_escalon = lambda t: E_ESCALON
    
    colores = {10.0: '#d62728', 50.0: '#ff7f0e', 100.0: '#2ca02c', 200.0: '#1f77b4'}
    estilos = {10.0: '-', 50.0: '--', 100.0: '-.', 200.0: ':'}
    
    fig, ax = plt.subplots(figsize=(11, 6.5))
    
    for R in RESISTENCIAS:
        sol = rk4_integrador(
            sistema_rlc_derivadas, y0, t_span,
            R=R, L=L_NOMINAL, C=C_NOMINAL, fuente_func=fuente_escalon
        )
        vc = sol[:, 0] / C_NOMINAL
        
        # Calcular factor de amortiguamiento zeta y discriminante
        delta = R**2 - 4.0 * L_NOMINAL / C_NOMINAL
        zeta = R / (2.0 * np.sqrt(L_NOMINAL / C_NOMINAL))
        
        if delta < 0:
            regimen = f"Subamortiguado ($\\zeta = {zeta:.2f}$)"
        elif delta == 0:
            regimen = f"Críticamente Amortiguado ($\\zeta = {zeta:.2f}$)"
        else:
            regimen = f"Sobreamortiguado ($\\zeta = {zeta:.2f}$)"
            
        label = f"$R = {int(R)}\\ \\Omega$ | $\\Delta = {int(delta)}$ | {regimen}"
        ax.plot(t_span * 1000, vc, label=label, color=colores[R], 
                linestyle=estilos[R], linewidth=2.2)
        
    # Línea de referencia del escalón permanente
    ax.axhline(E_ESCALON, color='black', linestyle='--', linewidth=1.5, 
               alpha=0.7, label=r'Estado Permanente $E(t) = 12$ V')
    
    # Banda de tolerancia del ±2% para tiempo de establecimiento
    ax.axhspan(E_ESCALON * 0.98, E_ESCALON * 1.02, color='gray', alpha=0.15, 
               label=r'Banda de tolerancia $\pm 2\%$ ($11.76$ V - $12.24$ V)')
    
    ax.set_title(r"Respuesta al Escalón de Voltaje $V_C(t)$ para Distintos Valores de Resistencia $R$", fontweight='bold')
    ax.set_xlabel(r"Tiempo $t$ [milisegundos, ms]")
    ax.set_ylabel(r"Voltaje en el Condensador $V_C(t)$ [V]")
    ax.set_xlim(0, 250)
    ax.set_ylim(-0.5, 22.5)
    ax.grid(True)
    ax.legend(loc='upper right', framealpha=0.92, edgecolor='gray')
    
    plt.tight_layout()
    output_path = "figura2_comparativa_regimenes_amortiguamiento.png"
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"      -> Guardado exitoso: {output_path}")


# =============================================================================
# 6. GENERACIÓN DE FIGURA 3: FILTRADO DE SEÑAL MULTI-TONO COMPUESTA
# =============================================================================
def generar_figura3_filtrado_multitono():
    print("[3/4] Generando Figura 3: Filtrado de Señal Multi-tono...")
    
    # Señal compuesta: E(t) = sen(2*pi*5*t) + sen(2*pi*50*t) + sen(2*pi*500*t)
    f1, f2, f3 = 5.0, 50.0, 500.0  # Hz
    fuente_multitono = lambda t: np.sin(2.0 * np.pi * f1 * t) + \
                                 np.sin(2.0 * np.pi * f2 * t) + \
                                 np.sin(2.0 * np.pi * f3 * t)
                                 
    # Simulación temporal: 1.0 segundo con paso muy fino para capturar 500 Hz
    fs = 20000.0  # Frecuencia de muestreo numérico (20 kHz)
    t_span = np.linspace(0.0, 1.0, int(fs) + 1)
    
    # Evaluamos para R = 50 Ω (amortiguamiento balanceado zeta = 0.5)
    R_audio = 50.0
    y0 = [0.0, 0.0]
    sol = rk4_integrador(
        sistema_rlc_derivadas, y0, t_span,
        R=R_audio, L=L_NOMINAL, C=C_NOMINAL, fuente_func=fuente_multitono
    )
    vc = sol[:, 0] / C_NOMINAL
    entrada = fuente_multitono(t_span)
    
    # Visualización: Panel Izquierdo (Tiempo), Panel Derecho (Espectro FFT)
    fig, (ax_t, ax_f) = plt.subplots(1, 2, figsize=(14, 5.8))
    
    # Ventana en el dominio del tiempo (0.2 s a 0.6 s para régimen estacionario)
    mask_t = (t_span >= 0.2) & (t_span <= 0.6)
    t_plot_ms = (t_span[mask_t] - 0.2) * 1000
    
    ax_t.plot(t_plot_ms, entrada[mask_t], 'k--', alpha=0.5, label='Entrada $E(t)$ (5 + 50 + 500 Hz)')
    ax_t.plot(t_plot_ms, vc[mask_t], 'b-', linewidth=2.2, label=f'Salida $V_C(t)$ (Filtrada, $R = {int(R_audio)}\\ \\Omega$)')
    ax_t.plot(t_plot_ms, np.sin(2.0 * np.pi * f1 * t_span[mask_t]), 'r:', linewidth=1.8, 
              label=r'Componente pura de $5$ Hz (Referencia)')
    
    ax_t.set_title(r"Dominio del Tiempo: Entrada vs. Salida Filtrada", fontweight='bold')
    ax_t.set_xlabel(r"Tiempo relativo [ms]")
    ax_t.set_ylabel(r"Amplitud de Tensión [V]")
    ax_t.grid(True)
    ax_t.legend(loc='upper right', framealpha=0.9)
    
    # Análisis Espectral por Transformada Rápida de Fourier (FFT) en estado estacionario
    # Usamos la segunda mitad de la señal (0.5 s a 1.0 s)
    mask_fft = t_span >= 0.5
    N_fft = np.sum(mask_fft)
    freqs = np.fft.rfftfreq(N_fft, d=(t_span[1] - t_span[0]))
    fft_in = np.abs(np.fft.rfft(entrada[mask_fft])) * (2.0 / N_fft)
    fft_out = np.abs(np.fft.rfft(vc[mask_fft])) * (2.0 / N_fft)
    
    # Graficar espectro hasta 600 Hz
    mask_plot_f = freqs <= 600.0
    ax_f.plot(freqs[mask_plot_f], fft_in[mask_plot_f], 'k--o', markersize=3, alpha=0.6, label='Espectro Entrada $E(f)$')
    ax_f.plot(freqs[mask_plot_f], fft_out[mask_plot_f], 'b-s', markersize=4, label='Espectro Salida $V_C(f)$')
    
    # Anotaciones de atenuación en las tres frecuencias clave
    for f_target in [f1, f2, f3]:
        idx = np.argmin(np.abs(freqs - f_target))
        mag_in = fft_in[idx]
        mag_out = fft_out[idx]
        atenuacion_db = 20.0 * np.log10(mag_out / mag_in) if mag_out > 1e-6 else -80.0
        ax_f.annotate(
            f"{int(f_target)} Hz\n{atenuacion_db:+.1f} dB",
            xy=(f_target, mag_out), xytext=(f_target + 15, mag_out + 0.15),
            arrowprops=dict(arrowstyle="->", color="darkred", lw=1),
            bbox=dict(boxstyle="square,pad=0.2", fc="white", ec="darkred", lw=0.8),
            fontsize=9
        )
        
    ax_f.set_title(r"Dominio de la Frecuencia: Supresión Espectral (FFT)", fontweight='bold')
    ax_f.set_xlabel(r"Frecuencia [Hz]")
    ax_f.set_ylabel(r"Amplitud Espectral [V]")
    ax_f.set_xlim(0, 550)
    ax_f.set_ylim(-0.05, 1.4)
    ax_f.grid(True)
    ax_f.legend(loc='upper right', framealpha=0.9)
    
    plt.tight_layout()
    output_path = "figura3_filtrado_senal_multitono.png"
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"      -> Guardado exitoso: {output_path}")


# =============================================================================
# 7. GENERACIÓN DE FIGURA 4: DIAGRAMA DE BODE (RESPUESTA EN FRECUENCIA)
# =============================================================================
def generar_figura4_diagrama_bode():
    print("[4/4] Generando Figura 4: Diagrama de Bode...")
    
    # Frecuencia angular de 1 rad/s a 10000 rad/s (escala logarítmica)
    omega = np.logspace(0, 4, 2000)  # rad/s
    f_hz = omega / (2.0 * np.pi)     # Hz
    
    fig, (ax_mag, ax_phase) = plt.subplots(2, 1, figsize=(10, 8), sharex=True)
    
    colores = {10.0: '#d62728', 50.0: '#ff7f0e', 100.0: '#2ca02c', 200.0: '#1f77b4'}
    
    for R in RESISTENCIAS:
        # Función de transferencia H(s) = (1/LC) / (s^2 + (R/L)*s + (1/LC))
        # Para s = j*omega:
        num = 1.0 / (L_NOMINAL * C_NOMINAL)  # omega_n^2
        den = (num - omega**2) + 1j * (R / L_NOMINAL) * omega
        H = num / den
        
        mag_db = 20.0 * np.log10(np.abs(H))
        fase_deg = np.angle(H, deg=True)
        
        zeta = R / (2.0 * np.sqrt(L_NOMINAL / C_NOMINAL))
        label = f"$R = {int(R)}\\ \\Omega$ ($\\zeta = {zeta:.2f}$)"
        
        ax_mag.semilogx(f_hz, mag_db, label=label, color=colores[R], linewidth=2.0)
        ax_phase.semilogx(f_hz, fase_deg, label=label, color=colores[R], linewidth=2.0)
        
    # Línea de frecuencia natural de corte f_n
    ax_mag.axvline(F_N, color='k', linestyle=':', linewidth=1.5, 
                   label=f'$f_n = {F_N:.1f}$ Hz ($\\omega_n = 100$ rad/s)')
    ax_phase.axvline(F_N, color='k', linestyle=':', linewidth=1.5)
    
    # Asíntota de atenuación de altas frecuencias: -40 dB/década
    f_asintota = np.array([F_N, 500.0])
    asintota_db = -40.0 * np.log10(f_asintota / F_N)
    ax_mag.plot(f_asintota, asintota_db, 'k--', linewidth=1.8, label=r'Pendiente asintótica $-40\ \mathrm{dB/d\acute{e}cada}$')
    
    # Línea de referencia 0 dB y -3 dB
    ax_mag.axhline(0, color='gray', linestyle='-', linewidth=0.8)
    ax_mag.axhline(-3, color='gray', linestyle='--', linewidth=0.8, label=r'Nivel $-3\ \mathrm{dB}$')
    
    ax_mag.set_title(r"Diagrama de Bode: Función de Transferencia $H(j\omega) = V_C(j\omega) / E(j\omega)$", fontweight='bold')
    ax_mag.set_ylabel(r"Magnitud $|H(j\omega)|$ [dB]")
    ax_mag.set_ylim(-65, 18)
    ax_mag.grid(True, which="both")
    ax_mag.legend(loc='lower left', framealpha=0.9)
    
    # Fase
    ax_phase.set_ylabel(r"Fase [grados, $^\circ$]")
    ax_phase.set_xlabel(r"Frecuencia $f$ [Hertz, Hz]")
    ax_phase.set_yticks([0, -45, -90, -135, -180])
    ax_phase.set_ylim(-190, 10)
    ax_phase.grid(True, which="both")
    
    plt.tight_layout()
    output_path = "figura4_diagrama_bode_filtro_audio.png"
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"      -> Guardado exitoso: {output_path}")


# =============================================================================
# 8. DEMOSTRACIÓN DE AUDIO REAL: SÍNTESIS Y FILTRADO ACÚSTICO "BAJO EL AGUA"
# =============================================================================
def procesar_audio_real():
    print("[AUDIO] Iniciando generación y procesamiento de señal de audio...")
    
    fs = 44100          # Frecuencia de muestreo estándar de CD de audio (44.1 kHz)
    duracion = 3.5      # Segundos
    N = int(fs * duracion)
    t = np.linspace(0.0, duracion, N, endpoint=False)
    
    # 1. Sintetizar un acorde musical brillante con múltiples armónicos agudos y ruido
    # Notas: Acorde de La menor brillante (A2 = 110 Hz, E3 = 164.81 Hz, A3 = 220 Hz, C4 = 261.63 Hz, E4 = 329.63 Hz)
    # y armónicos brillantes que emulan sintetizador o cuerda de guitarra:
    audio_in = np.zeros(N, dtype=np.float64)
    
    # Fundamentales
    audio_in += 0.8 * np.sin(2.0 * np.pi * 110.0 * t)
    audio_in += 0.6 * np.sin(2.0 * np.pi * 164.81 * t)
    audio_in += 0.5 * np.sin(2.0 * np.pi * 220.0 * t)
    
    # Sobretonos agudos ricos (hasta 4 kHz) que definen el "brillo" y presencia
    audio_in += 0.4 * np.sin(2.0 * np.pi * 440.0 * t)
    audio_in += 0.35 * np.sin(2.0 * np.pi * 880.0 * t)
    audio_in += 0.30 * np.sin(2.0 * np.pi * 1760.0 * t)
    audio_in += 0.25 * np.sin(2.0 * np.pi * 3520.0 * t)
    
    # Agregar un golpe percusivo rítmico (hi-hat / chasquido agudo cada 0.5 s)
    for t_hit in np.arange(0.2, duracion, 0.5):
        mask_hit = (t >= t_hit) & (t < t_hit + 0.08)
        t_rel = t[mask_hit] - t_hit
        env = np.exp(-t_rel / 0.015)
        # Ruido y chispa aguda a 5000 Hz
        click = env * (np.sin(2.0 * np.pi * 5000.0 * t_rel) + 0.5 * np.random.uniform(-1, 1, len(t_rel)))
        audio_in[mask_hit] += 0.7 * click
        
    # Normalizar entrada a rango [-1.0, 1.0]
    audio_in = audio_in / np.max(np.abs(audio_in))
    
    # Guardar audio original en formato WAV de 16 bits
    audio_in_int16 = np.int16(audio_in * 32767.0)
    wav_original_path = "audio_original.wav"
    wavfile.write(wav_original_path, fs, audio_in_int16)
    print(f"      -> Archivo original guardado: {wav_original_path} ({duracion} s, {fs} Hz)")
    
    # 2. Filtrado numérico mediante el circuito RLC serie (RK4)
    # Para audio musical, seleccionamos R = 70 Ω (damping ~ 0.707, Butterworth óptimo) o R = 50 Ω
    # Con omega_n = 100 rad/s (f_n ~ 16 Hz), todas las frecuencias por encima de 40 Hz sufrirán
    # la caída de -40 dB/década, produciendo el característico sonido subacuático / amortiguado.
    R_audio = 60.0
    dt = 1.0 / fs
    
    print(f"      -> Integrando {N} muestras con paso dt = {dt*1e6:.2f} µs mediante RK4...")
    
    # Vector de estado inicial
    y = np.array([0.0, 0.0], dtype=np.float64)  # [Q, I]
    audio_out = np.zeros(N, dtype=np.float64)
    
    # Integración rápida paso a paso RK4 directamente sobre las muestras de audio
    # Definimos las operaciones escalares optimizadas para máxima velocidad:
    inv_L = 1.0 / L_NOMINAL
    inv_C = 1.0 / C_NOMINAL
    
    for i in range(N - 1):
        E1 = audio_in[i]
        E_mid = 0.5 * (audio_in[i] + audio_in[i + 1])
        E2 = audio_in[i + 1]
        
        Q, I = y[0], y[1]
        
        # k1
        k1_Q = I
        k1_I = inv_L * (E1 - R_audio * I - inv_C * Q)
        
        # k2
        Q_k2 = Q + 0.5 * dt * k1_Q
        I_k2 = I + 0.5 * dt * k1_I
        k2_Q = I_k2
        k2_I = inv_L * (E_mid - R_audio * I_k2 - inv_C * Q_k2)
        
        # k3
        Q_k3 = Q + 0.5 * dt * k2_Q
        I_k3 = I + 0.5 * dt * k2_I
        k3_Q = I_k3
        k3_I = inv_L * (E_mid - R_audio * I_k3 - inv_C * Q_k3)
        
        # k4
        Q_k4 = Q + dt * k3_Q
        I_k4 = I + dt * k3_I
        k4_Q = I_k4
        k4_I = inv_L * (E2 - R_audio * I_k4 - inv_C * Q_k4)
        
        # Actualización de estado
        y[0] += (dt / 6.0) * (k1_Q + 2.0 * k2_Q + 2.0 * k3_Q + k4_Q)
        y[1] += (dt / 6.0) * (k1_I + 2.0 * k2_I + 2.0 * k3_I + k4_I)
        
        # El voltaje de salida es V_C = Q / C
        audio_out[i + 1] = y[0] * inv_C
        
    # Normalizar salida a nivel audible adecuado [-1.0, 1.0]
    # (Dado que el filtro atenúa fuertemente los agudos, la señal restante es puro sub-grave)
    max_val = np.max(np.abs(audio_out))
    if max_val > 1e-12:
        audio_out = audio_out / max_val
        
    audio_out_int16 = np.int16(audio_out * 32767.0)
    wav_filtrado_path = "audio_filtrado_submarino.wav"
    wavfile.write(wav_filtrado_path, fs, audio_out_int16)
    print(f"      -> Archivo filtrado guardado: {wav_filtrado_path} (Efecto subacuático aplicado)")


# =============================================================================
# 9. EJECUCIÓN PRINCIPAL
# =============================================================================
if __name__ == "__main__":
    print("\nIniciando pipeline de simulación científica y generación de entregables...\n")
    generar_figura1_validacion()
    generar_figura2_regimenes()
    generar_figura3_filtrado_multitono()
    generar_figura4_diagrama_bode()
    procesar_audio_real()
    print("\n" + "=" * 75)
    print("¡PROCESO COMPLETADO EXITOSAMENTE!")
    print("Todos los archivos de simulación, gráficas y audio han sido generados.")
    print("=" * 75)
