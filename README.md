# PROYECTO 2: EL CIRCUITO RLC COMO FILTRO DE AUDIO
### Institución Universitaria Colegio Mayor del Cauca
**Facultad de Ingeniería — Programa de Ingeniería Informática**  
**Asignatura:** Ecuaciones Diferenciales (Unidad 3: EDOs de Orden Superior)  
**Grupo 3:**
* ACOSTA GALINDEZ JESSICA VANESA
* BERMUDEZ ZAMORA KEVIN DANIEL
* LOPEZ QUIRA ALVARO JOSE
* MUÑOZ DULCEY JORGE ENRIQUE

---

## 📁 ESTRUCTURA Y CONTENIDO DEL REPOSITORIO

Este proyecto contiene la deducción analítica matemática completa, el código fuente en Python, la suite interactiva web, las figuras científicas en alta resolución (300 DPI), los archivos de audio sintético y procesado, el informe académico formal y el guion cronometrado para la sustentación oral de 15 minutos:

```
circuito_rlc/
│
├── index.html                                      # Plataforma Web Interactiva de Simulación y Defensa
├── css/
│   └── styles.css                                  # Estilos maestros (Glassmorphism 2.0, Paleta Institucional)
├── js/
│   ├── rlc_engine.js                               # Motor matemático de cálculo RK4, analítica y polos
│   ├── app.js                                      # Controlador principal, atajos de teclado y telemetría
│   ├── audio_lab.js                                # Laboratorio Web Audio API (Sintetizador, Mic y Archivos)
│   ├── analogia_canvas.js                          # Animación Hi-DPI masa-resorte vs cargas RLC (60 FPS)
│   └── lucide.min.js                               # Iconos vectoriales profesionales (Modo 100% Offline)
├── assets/
│   ├── logo_unimayor.png                           # Escudo oficial de la Institución Universitaria Colegio Mayor del Cauca
│   ├── logo_unimayor_transparent.png               # Versión transparente del escudo institucional
│   └── favicon.png                                 # Favicon institucional para navegador
│
├── circuito_rlc.py                                 # Pipeline científico modular en Python (RK4, FFT, Bode y WAV)
├── INFORME_PROYECTO_RLC.md                         # Informe académico formal exhaustivo (Paper de ingeniería)
├── GUION_EXPOSICION_DEFENSA.md                     # Guion de sustentación oral (15 min repartidos) + Preguntas
├── README.md                                       # Este archivo descriptivo del proyecto
│
├── figura1_validacion_rk4_vs_analitica.png         # Superposición analítica vs RK4 (Error: 3.69 nV)
├── figura2_comparativa_regimenes_amortiguamiento.png # Respuestas temporales para R = 10, 50, 100, 200 Ω
├── figura3_filtrado_senal_multitono.png            # Filtrado temporal y espectral FFT (5, 50, 500 Hz)
├── figura4_diagrama_bode_filtro_audio.png          # Respuesta en frecuencia (Bode magnitud en dB y fase)
│
├── audio_original.wav                              # Audio sintético rico en agudos (3.5 s, 44.1 kHz)
└── audio_filtrado_submarino.wav                    # Audio procesado con el filtro RLC ("efecto bajo el agua")
```

---

## 🌐 APLICACIÓN WEB INTERACTIVA (MODO EXPOSICIÓN)

Para abrir la plataforma de sustentación interactiva y el simulador en tiempo real, inicia un servidor local desde la carpeta del proyecto:
```powershell
python -m http.server 8000
```
Luego abre `http://localhost:8000` en Google Chrome, Microsoft Edge o Firefox. Usa `Ctrl+C` en la terminal para detener el servidor. Es preferible este método a abrir el HTML directamente, especialmente para las funciones de micrófono.

**Conexión:** el motor RLC, los iconos y los archivos del proyecto son locales, pero la página carga Chart.js, KaTeX y Google Fonts desde CDN; por tanto, necesita internet para mostrar correctamente gráficos y fórmulas. El micrófono requiere permiso del navegador y ejecutarse en `localhost` o HTTPS.

### Funcionalidades de la Plataforma Web:
1. **Simulador RK4 con Superposición Analítica en Vivo:**
   - Sliders de $R, L, C$ y $E_0$ a 60 FPS fijos.
   - Botón *"Superponer Analítica"* que calcula el error residual de convergencia en nanovoltios ($L_\infty \approx 3.69\text{ nV}$).
2. **Diagrama de Polos en el Plano Complejo $s$ (Lugar de las Raíces):**
   - Muestra las raíces $s_{1,2} = -\alpha \pm \sqrt{\alpha^2 - \omega_n^2}$ moviéndose dinámicamente y el semiplano izquierdo de estabilidad de Lyapunov.
3. **Laboratorio de Audio Sensorial:**
   - Sintetizador polifónico en vivo con corte acústico instantáneo.
   - **Micrófono en Vivo:** Permite hablar y escuchar la voz en tiempo real filtrada "bajo el agua".
   - **Carga de Archivo Propio:** Permite subir canciones MP3/WAV para escucharlas a través del filtro pasa-bajo de Web Audio.
4. **Teleprónter Oficial de 15 Minutos:**
   - Cronómetro regresivo con barra de progreso y cambio automático del expositor en turno.
5. **Control por Teclado:**
   - `←` / `→` Cambiar pestañas • `Espacio` Pausar/Iniciar cronómetro • `P` Modo Presentación Pantalla Completa • `R` Reiniciar 15:00.

---

## 🚀 REQUISITOS Y EJECUCIÓN (PYTHON)

### Requisitos de Python:
El proyecto requiere Python 3.9 o superior y las siguientes bibliotecas de computación científica:
```bash
pip install numpy matplotlib scipy
```

### Ejecución de la Simulación Completa:
Para regenerar todas las figuras numéricas, recalcular los errores de verificación y procesar las pistas de audio WAV:
```powershell
python circuito_rlc.py
```

---

## 📊 RESUMEN DE RESULTADOS CLAVE

1. **Parámetros Característicos:**
   - Frecuencia angular natural: $\omega_n = \frac{1}{\sqrt{LC}} = 100.0\text{ rad/s}$ ($f_n \approx 15.92\text{ Hz}$)
   - Resistencia crítica: $R_{cr} = 2\sqrt{\frac{L}{C}} = 100.0\,\Omega$
2. **Validación Numérica vs. Analítica ($R = 10\,\Omega$, Escalón de $12\text{ V}$):**
   - Error máximo absoluto (norma $L_\infty$): **$3.69 \times 10^{-9}\text{ V}$**
   - Sobreimpulso analítico máximo: $V_{C,\max} = 20.75\text{ V}$ en $t_p = 31.57\text{ ms}$ (Sobreimpulso del $72.9\%$)
3. **Comportamiento en Frecuencia (Filtro Pasa-Bajo):**
   - Atenuación asintótica de altas frecuencias: **$-40\text{ dB/década}$** ($-12\text{ dB/octava}$)
   - Para $R=50\,\Omega$: $5\text{ Hz}$ tiene ganancia aproximada **$+0.4\text{ dB}$**; $50\text{ Hz}$, **$-19.5\text{ dB}$**; y $500\text{ Hz}$, **$-59.9\text{ dB}$**.
4. **Elección de Ingeniería:**
   - La resistencia óptima recomendada para ecualización de audio es **$R \approx 70.7\,\Omega$** (alineación Butterworth, $\zeta = 0.707$) o **$R = 100\,\Omega$** (amortiguamiento crítico sin sobreimpulso ni ringing).

---

## DECLARACIÓN DE USO DE INTELIGENCIA ARTIFICIAL

En esta revisión se utilizó GitHub Copilot como apoyo para contrastar el proyecto con los requisitos del PDF y verificar que la aplicación web cargara localmente. El grupo debe declarar también cualquier otra herramienta de IA que haya utilizado durante la elaboración, revisar los resultados y poder explicar y defender el trabajo.
