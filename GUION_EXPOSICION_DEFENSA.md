# GUION DE EXPOSICIÓN Y DEFENSA ORAL (15 MINUTOS)
## PROYECTO 2: EL CIRCUITO RLC COMO FILTRO DE AUDIO
### INSTITUCIÓN UNIVERSITARIA COLEGIO MAYOR DEL CAUCA — INGENIERÍA INFORMÁTICA
**Asignatura:** Ecuaciones Diferenciales (Unidad 3: EDOs de Orden Superior)  
**Grupo 3:**
* **Jessica Vanesa Acosta Galindez**
* **Kevin Daniel Bermudez Zamora**
* **Alvaro Jose Lopez Quira**
* **Jorge Enrique Muñoz Dulcey**

---

## ESTRUCTURA GENERAL DE LA DEFENSA
* **Tiempo Total de Exposición:** 15 minutos exactos (3 minutos y 45 segundos por integrante).
* **Sesión de Preguntas y Sustentación:** 5 minutos adicionales ante el docente evaluador.
* **Material de Apoyo:** Diapositivas con las 4 figuras generadas (`figura1` a `figura4`) y reproducción en vivo de los audios (`audio_original.wav` y `audio_filtrado_submarino.wav`).

```
00:00 - 03:45 | JESSICA ACOSTA  | Introducción, KVL, Deducción de EDO, omega_n, R_cr y Discriminantes
03:45 - 07:30 | KEVIN BERMUDEZ  | Solución Analítica Escalón 12V, Régimen Transitorio y Analogía Mecánica
07:30 - 11:15 | ALVARO LOPEZ    | Algoritmo RK4, Espacio de Estados y Validación Numérica vs Analítica
11:15 - 15:00 | JORGE MUÑOZ     | Filtrado Multi-seno, Diagrama de Bode, Demo de Audio y Conclusión Técnica
15:00 - 20:00 | TODOS           | Sesión de Preguntas y Respuestas con el Docente Evaluador
```

---

## GUION DETALLADO PERSONA POR PERSONA

---

### INTEGRANTE 1: JESSICA VANESA ACOSTA GALINDEZ
**Rol:** Introducción teórica, formulación física y clasificación analítica de regímenes  
**Tiempo Asignado:** Minuto 0:00 a 03:45 (Duración: 3 min 45 s)

#### [00:00 - 00:45] Saludo, Contexto e Introducción al Problema
> *"Buenos días profesor y compañeros. Mi nombre es Jessica Acosta y, junto a mis compañeros Kevin, Alvaro y Jorge, conformamos el Grupo 3. Hoy presentaremos nuestro proyecto de aula: **El circuito RLC serie como filtro de audio**.  
> En la ingeniería informática y el procesamiento digital de señales, los filtros analógicos constituyen el primer eslabón para limpiar ruidos, acondicionar señales de voz o música, y evitar el fenómeno del aliasing antes de la digitalización. Nuestro objetivo es demostrar cómo una ecuación diferencial lineal de segundo orden con coeficientes constantes gobierna con total exactitud el comportamiento acústico y eléctrico de este circuito."*

#### [00:45 - 01:50] Deducción Física a partir de la Segunda Ley de Kirchhoff (KVL)
> *"Para deducir la ecuación diferencial gobernante, partimos de la Segunda Ley de Kirchhoff en una malla serie: la suma de caídas de tensión en cada elemento es igual a la fuerza electromotriz aplicada:  
> $$v_L(t) + v_R(t) + v_C(t) = E(t)$$  
> Las leyes constitutivas físicas son:  
> - En el inductor, por la ley de Faraday-Lenz, la caída es proporcional a la tasa de cambio de corriente: $v_L(t) = L \frac{dI}{dt}$.  
> - En el resistor, por la ley de Ohm, es proporcional a la corriente: $v_R(t) = R I(t)$.  
> - En el condensador, por definición electrostática de capacitancia, la caída es proporcional a la carga almacenada: $v_C(t) = \frac{Q(t)}{C}$.  
> Recordando la definición fundamental de que la corriente eléctrica es la derivada de la carga respecto al tiempo, $I(t) = \frac{dQ}{dt}$, y su derivada es $\frac{dI}{dt} = \frac{d^2Q}{dt^2}$, sustituimos y obtenemos la EDO de segundo orden en función de la carga:  
> $$L Q''(t) + R Q'(t) + \frac{1}{C} Q(t) = E(t)$$  
> Como nuestro filtro toma la señal de salida en bornes del condensador, la tensión de salida es $V_C(t) = \frac{Q(t)}{C}$."*

#### [01:50 - 02:50] Cálculo Explícito de $\omega_n$ y Resistencia Crítica $R_{cr}$
> *"Nuestros parámetros base son una inductancia $L = 0.5\text{ H}$ y una capacitancia $C = 200\,\mu\text{F} = 2 \times 10^{-4}\text{ F}$.  
> Normalizando la ecuación diferencial homogénea a la forma canónica $Q'' + 2\zeta\omega_n Q' + \omega_n^2 Q = 0$, identificamos la frecuencia natural angular no amortiguada:  
> $$\omega_n = \frac{1}{\sqrt{LC}} = \frac{1}{\sqrt{0.5 \times 2 \times 10^{-4}}} = \frac{1}{\sqrt{10^{-4}}} = 100\text{ rad/s}$$  
> Esto equivale a una frecuencia cíclica de $f_n = \frac{100}{2\pi} \approx 15.92\text{ Hz}$, que se ubica en el límite inferior del espectro audible humano (zona subgrave).  
> Por su parte, la resistencia crítica $R_{cr}$ que separa el comportamiento oscilatorio del no oscilatorio ocurre cuando el discriminante característico se hace cero:  
> $$R_{cr} = 2\sqrt{\frac{L}{C}} = 2\sqrt{\frac{0.5}{2 \times 10^{-4}}} = 2\sqrt{2500} = 2 \times 50 = 100\,\Omega$$  
> Si la resistencia del circuito es menor a $100\,\Omega$, el sistema oscilará; si es mayor, será aletargado y no oscilará."*

#### [02:50 - 03:45] Clasificación de los 4 Valores de Resistencia mediante el Discriminante $\Delta$
> *"Evaluamos el discriminante cuadrático $\Delta = R^2 - \frac{4L}{C} = R^2 - 10000\,\Omega^2$ para los cuatro valores exigidos por el proyecto:  
> 1. Para **$R = 10\,\Omega$**, $\Delta = 100 - 10000 = -9900 < 0$. Como es estrictamente negativo, obtenemos raíces complejas conjugadas con factor de amortiguamiento $\zeta = 0.10$. Régimen **subamortiguado severo**, caracterizado por oscilaciones prolongadas y gran sobreimpulso.  
> 2. Para **$R = 50\,\Omega$**, $\Delta = 2500 - 10000 = -7500 < 0$. Sigue siendo **subamortiguado** ($\zeta = 0.50$), pero las oscilaciones se disipan rápidamente.  
> 3. Para **$R = 100\,\Omega$**, $\Delta = 10000 - 10000 = 0$. Régimen **críticamente amortiguado** ($\zeta = 1.00$). Raíz doble real en $-100\text{ s}^{-1}$. Es la transición más rápida posible al equilibrio sin sobreimpulso.  
> 4. Para **$R = 200\,\Omega$**, $\Delta = 40000 - 10000 = +30000 > 0$. Régimen **sobreamortiguado** ($\zeta = 2.00$). Raíces reales distintas, dando una respuesta lenta y aletargada.  
> Ahora mi compañero Kevin explicará cómo resolvimos analíticamente la ecuación diferencial para el caso de $10\,\Omega$."*

---

### INTEGRANTE 2: KEVIN DANIEL BERMUDEZ ZAMORA
**Rol:** Solución analítica detallada del escalón de 12 V y tabla de analogía física  
**Tiempo Asignado:** Minuto 03:45 a 07:30 (Duración: 3 min 45 s)

#### [03:45 - 04:50] Solución Homogénea y Particular de la EDO ($R = 10\,\Omega$)
> *"Muchas gracias Jessica. Continuando con el desarrollo analítico a mano para $R = 10\,\Omega$ ante un escalón de voltaje $E(t) = 12\text{ V}$ con condiciones de reposo inicial $Q(0) = 0\text{ C}$ e $I(0) = 0\text{ A}$, sustituimos los coeficientes en la EDO mónic:  
> $$Q''(t) + 20 Q'(t) + 10000 Q(t) = 24$$  
> Planteamos la ecuación característica $r^2 + 20r + 10000 = 0$, cuyas raíces complejas son:  
> $$r = -10 \pm j 10\sqrt{99} \approx -10 \pm j 99.50\text{ rad/s}$$  
> De aquí extraemos la tasa de atenuación exponencial $\alpha = 10\text{ s}^{-1}$ y la frecuencia amortiguada $\omega_d = 10\sqrt{99}\text{ rad/s}$. La solución homogénea o respuesta transitoria es:  
> $$Q_h(t) = e^{-10t} \left[ C_1 \cos(10\sqrt{99} t) + C_2 \sin(10\sqrt{99} t) \right]$$  
> Para la solución particular $Q_p(t)$, como la fuente es una constante de $12\text{ V}$, proponemos por coeficientes indeterminados $Q_p(t) = A$. Al sustituir sus derivadas nulas en la ecuación original, encontramos:  
> $$5000 A = 12 \implies A = \frac{12}{5000} = 2.4 \times 10^{-3}\text{ C} = 2.4\text{ mC}$$  
> Esto concuerda con la electrostática básica: en estado permanente de corriente continua, el condensador se carga a $12\text{ V}$ y $Q = C \cdot E = 200\,\mu\text{F} \times 12\text{ V} = 2.4\text{ mC}$."*

#### [04:50 - 05:55] Condiciones Iniciales y Expresión Exacta de $V_C(t)$
> *"Sumando la parte homogénea y la particular, tenemos la solución general:  
> $$Q(t) = 0.0024 + e^{-10t}\left[ C_1 \cos(\omega_d t) + C_2 \sin(\omega_d t) \right]$$  
> Aplicamos la primera condición inicial, $Q(0) = 0$:  
> $$0 = 0.0024 + C_1 \implies C_1 = -0.0024\text{ C}$$  
> Para la segunda condición, derivamos respecto al tiempo para hallar la corriente $I(t) = Q'(t)$:  
> $$Q'(t) = -10 e^{-10t}[C_1 \cos + C_2 \sin] + e^{-10t}[-C_1 \omega_d \sin + C_2 \omega_d \cos]$$  
> Evaluando en $t = 0$ con $I(0) = 0$:  
> $$-10 C_1 + \omega_d C_2 = 0 \implies C_2 = \frac{10 C_1}{\omega_d} = -\frac{0.0024}{\sqrt{99}}\text{ C} \approx -2.412 \times 10^{-4}\text{ C}$$  
> Al dividir toda la carga $Q(t)$ entre la capacitancia $C = 200 \times 10^{-6}\text{ F}$, obtenemos la expresión analítica exacta para el voltaje en el condensador:  
> $$V_C(t) = 12 \left[ 1 - e^{-10t} \left( \cos(10\sqrt{99} t) + \frac{1}{\sqrt{99}} \sin(10\sqrt{99} t) \right) \right]\text{ [V]}$$  
> Calculando el primer pico de esta función, encontramos que ocurre en $t_p = \frac{\pi}{\omega_d} \approx 31.57\text{ ms}$, alcanzando una tensión de **$20.75\text{ V}$**. ¡Esto representa un enorme sobreimpulso del **$72.9\%$** por encima de los $12\text{ V}$ de la fuente!"*

#### [05:55 - 07:30] Tabla de Analogía Física (Sistema Mecánico vs. Circuito RLC)
> *"Un aporte conceptual fundamental de las ecuaciones diferenciales de segundo orden es la profunda analogía física entre el sistema mecánico amortiguado Masa-Resorte y el circuito RLC serie. Matemáticamente ambas ecuaciones son exactamente idénticas:  
> $$m \ddot{x} + c \dot{x} + k x = F(t) \quad \longleftrightarrow \quad L \ddot{Q} + R \dot{Q} + \frac{1}{C} Q = E(t)$$  
> Término a término encontramos las siguientes equivalencias físicas:  
> - La posición de la masa $x(t)$ equivale a la carga eléctrica $Q(t)$.  
> - La velocidad de la masa $v(t) = \dot{x}(t)$ equivale a la corriente eléctrica $I(t) = \dot{Q}(t)$.  
> - La masa o inercia mecánica $m$ equivale a la inductancia $L$, pues ambas se oponen a cambios bruscos de velocidad o corriente.  
> - La fricción viscosa del amortiguador $c$ equivale a la resistencia eléctrica $R$, responsables ambas de disipar energía en calor.  
> - La rigidez del resorte $k$ equivale al inverso de la capacitancia, llamado elastancia $\frac{1}{C}$.  
> - La fuerza externa $F(t)$ equivale a la fuerza electromotriz $E(t)$.  
> - E incluso a nivel energético: la energía cinética $\frac{1}{2}mv^2$ es análoga a la energía magnética $\frac{1}{2}LI^2$, y la energía potencial del resorte $\frac{1}{2}kx^2$ es análoga a la energía electrostática $\frac{1}{2}\frac{Q^2}{C}$.  
> Esta universalidad matemática permite a los ingenieros modelar suspensiones de vehículos o sismógrafos utilizando circuitos eléctricos.  
> Doy paso a mi compañero Alvaro para explicar la solución numérica en Python."*

---

### INTEGRANTE 3: ALVARO JOSE LOPEZ QUIRA
**Rol:** Reducción computacional de la EDO, método Runge-Kutta 4 y validación analítica vs. simulación  
**Tiempo Asignado:** Minuto 07:30 a 11:15 (Duración: 3 min 45 s)

#### [07:30 - 08:35] Reducción a Sistema de Primer Orden en Espacio de Estados
> *"Gracias Kevin. Como ingenieros informáticos, nuestro reto fue implementar la computación científica del sistema en Python sin recurrir a 'cajas negras', programando nuestro propio motor de integración numérica.  
> Como las computadoras resuelven de forma estándar sistemas de primer orden, convertimos la EDO de segundo orden en un sistema de dos variables de estado:  
> - Estado 1: La carga en el condensador, $y_1(t) = Q(t)$.  
> - Estado 2: La corriente del circuito, $y_2(t) = I(t) = Q'(t)$.  
> Derivando respecto al tiempo, construimos el sistema acoplado:  
> $$\frac{d y_1}{dt} = y_2$$  
> $$\frac{d y_2}{dt} = \frac{1}{L} \left[ E(t) - R y_2 - \frac{1}{C} y_1 \right]$$  
> En nuestro script `circuito_rlc.py`, esta formulación se encapsuló en la función `sistema_rlc_derivadas`, retornando el vector instantáneo de derivadas $[\frac{dQ}{dt}, \frac{dI}{dt}]$."*

#### [08:35 - 09:40] El Algoritmo Runge-Kutta de 4to Orden (RK4) Programado
> *"Para garantizar máxima precisión y estabilidad, implementamos manualmente el algoritmo Runge-Kutta de 4to orden (RK4).  
> En cada paso temporal $h = \Delta t$, el algoritmo calcula cuatro pendientes intermedias:  
> - $k_1$ evalúa la pendiente al inicio del intervalo.  
> - $k_2$ y $k_3$ evalúan pendientes a mitad del intervalo ($t + \frac{h}{2}$) usando aproximaciones previas.  
> - $k_4$ evalúa la pendiente al final del intervalo ($t + h$).  
> Luego actualiza el estado mediante un promedio ponderado de Simpson:  
> $$\vec{y}_{n+1} = \vec{y}_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$  
> Este método tiene un error de truncamiento local de orden $\mathcal{O}(h^5)$ y global de $\mathcal{O}(h^4)$, siendo vastamente superior al método clásico de Euler."*

#### [09:40 - 11:15] Análisis de Resultados: Figura 1 (Validación) y Figura 2 (Regímenes)
> *"Por favor observen en la diapositiva la **Figura 1** de nuestro informe.  
> Contrastamos la curva analítica calculada por Kevin (línea azul continua) con las muestras simuladas por nuestro algoritmo RK4 con paso de $0.1\text{ ms}$ (puntos rojos). Como pueden observar en el panel superior, la superposición es absoluta.  
> En el panel inferior graficamos el residuo exacto $|V_{C,\text{num}} - V_{C,\text{analit}}|$. El error máximo absoluto (norma $L_\infty$) en todo el intervalo de $400\text{ ms}$ fue de tan solo:  
> $$\mathbf{3.69 \times 10^{-9}\text{ V} \quad (3.69\text{ nanovoltios})}$$  
> Esto valida y certifica que tanto la deducción analítica a mano como el algoritmo numérico en Python son perfectamente correctos y rigurosos. Se corrobora además el pico máximo de $20.75\text{ V}$ en $31.57\text{ ms}$.  
> Pasando a la **Figura 2**, comparamos el comportamiento transitorio al variar la resistencia:  
> - La curva roja ($10\,\Omega$) oscila salvajemente antes de asentarse.  
> - La curva naranja ($50\,\Omega$) amortigua el sobreimpulso a solo $13.9\text{ V}$.  
> - La curva verde ($100\,\Omega$, amortiguamiento crítico) alcanza el valor de $12\text{ V}$ sin oscilaciones en apenas $40\text{ ms}$.  
> - La curva azul ($200\,\Omega$, sobreamortiguado) tarda más de $150\text{ ms}$, evidenciando la pesadez del sistema.  
> Ahora mi compañero Jorge explicará la aplicación del circuito como filtro de audio y la demostración acústica."*

---

### INTEGRANTE 4: JORGE ENRIQUE MUÑOZ DULCEY
**Rol:** Filtrado de audio multi-tono, Diagrama de Bode, demostración sonora y conclusión ingenieril  
**Tiempo Asignado:** Minuto 11:15 a 15:00 (Duración: 3 min 45 s)

#### [11:15 - 12:20] Filtrado de Señal Multi-tono Compuesta (Figura 3)
> *"Muchas gracias Alvaro. Habiendo validado la física y el algoritmo, entramos en la aplicación del circuito como **filtro pasa-bajo de audio**.  
> Para ponerlo a prueba, generamos computacionalmente una señal compleja compuesta por tres frecuencias:  
> $$E(t) = \sin(2\pi \cdot 5 t) + \sin(2\pi \cdot 50 t) + \sin(2\pi \cdot 500 t)$$  
> Recordando que la frecuencia de corte natural del circuito es $f_n \approx 15.9\text{ Hz}$:  
> - La componente de $5\text{ Hz}$ es sub-corte ($f < f_n$).  
> - La de $50\text{ Hz}$ está ligeramente por encima de corte.  
> - La de $500\text{ Hz}$ es una frecuencia aguda lejana.  
> Al pasar esta señal por el circuito e integrarla con RK4 (ver **Figura 3**):  
> En el tiempo, la onda rugosa de entrada se purifica en una senoidal limpia.  
> En el espectro FFT (panel derecho), para $R=50\,\Omega$, la componente de $5\text{ Hz}$ tiene una ganancia cercana a $+0.4\text{ dB}$; la de $50\text{ Hz}$ se atenúa aproximadamente **$-19.5\text{ dB}$** (queda cerca del $10.6\%$); y la de $500\text{ Hz}$, **$-59.9\text{ dB}$** (cerca del $0.1\%$). ¡El circuito elimina selectivamente las altas frecuencias!"*

#### [12:20 - 13:15] Análisis en Frecuencia: Diagrama de Bode (Figura 4)
> *"Para generalizar este comportamiento a cualquier frecuencia, obtuvimos analíticamente la función de transferencia $H(s) = \frac{V_C(s)}{E(s)} = \frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$ y trazamos el **Diagrama de Bode** en magnitud y fase (**Figura 4**).  
> Destacamos tres propiedades fundamentales:  
> 1. En bajas frecuencias ($\omega \ll 100\text{ rad/s}$), la ganancia es plana en $0\text{ dB}$ (ganancia unitaria) y la fase es $0^\circ$.  
> 2. En la resonancia ($\omega = 100\text{ rad/s}$), la fase cruza exactamente por $-90^\circ$. Para $R = 10\,\Omega$, la magnitud exhibe un pico resonante pronunciado de $+14\text{ dB}$.  
> 3. En altas frecuencias ($\omega \gg 100\text{ rad/s}$), todas las curvas colapsan a una asíntota lineal con una pendiente de **$-40\text{ dB por década}$** (o $-12\text{ dB/octava}$). Esto ocurre porque la salida es de segundo orden: el inductor bloquea las altas frecuencias en serie mientras el condensador las deriva a tierra."*

#### [13:15 - 14:15] Demostración de Audio Real: El Efecto "Bajo el Agua"
> *"Para llevar la teoría a una experiencia tangible, generamos un archivo de audio musical `.wav` de 44.1 kHz (`audio_original.wav`) que contiene acordes polifónicos con armónicos brillantes de cuerda hasta 4 kHz y chasquidos percusivos a 5 kHz.  
> Luego, procesamos muestra a muestra las 154,350 muestras de audio integrando la EDO con RK4, produciendo `audio_filtrado_submarino.wav`.  
> *(En este punto, Jorge reproduce 5 segundos de audio_original.wav y luego 5 segundos de audio_filtrado_submarino.wav)*  
> Como acaban de escuchar, todos los agudos y la presencia brillante desaparecen, dejando únicamente un zumbido grave y apagado. Este es exactamente el **efecto de sonido subacuático** (*underwater filter*) que los productores de música utilizan para simular que la música proviene de una habitación contigua o debajo del agua."*

#### [14:15 - 15:00] Conclusión Ingenieril y Cierre de la Exposición
> *"Finalmente, respondiendo a la pregunta de diseño ingenieril: ¿Qué valor de $R$ elegiríamos para un ecualizador o control de tono de audio?  
> - **Descartamos rotundamente $R = 10\,\Omega$:** Provoca un sobreimpulso del $72.9\%$ y resonancia de $+14\text{ dB}$, lo que distorsionaría el audio con un efecto parásito conocido como *ringing* y podría quemar los altavoces.  
> - **Descartamos $R = 200\,\Omega$:** Provoca una atenuación lenta y opaca.  
> - **Para una respuesta de amplitud Butterworth, elegiríamos $\zeta = \frac{1}{\sqrt{2}} \approx 0.707$ ($R \approx 70.7\,\Omega$)**: es máximamente plana en la banda de paso y no tiene pico resonante. **$R = 100\,\Omega$** es la alternativa crítica si priorizamos una respuesta temporal sin sobreimpulso. Butterworth no significa retardo de grupo constante ni fase sin distorsión.  
> Con esto concluimos nuestra presentación. Agradecemos su atención y quedamos a disposición de sus preguntas. ¡Muchas gracias!"*

---

## 5. BATERÍA DE PREGUNTAS DIFÍCILES DEL DOCENTE EVALUADOR (PREPARACIÓN PARA DEFENSA)

A continuación se presentan 3 preguntas complejas y conceptuales que el docente evaluador podría plantear durante los 5 minutos de preguntas, con las respuestas exactas formuladas para que cualquier integrante del grupo responda con maestría:

---

### PREGUNTA DIFÍCIL 1 (Fundamento de Circuitos y EDOs):
> **Docente:** *"Ustedes demostraron que al tomar la salida en el condensador $V_C(t)$, el circuito opera como un filtro pasa-bajo con caída de $-40\text{ dB/década}$. Si decidiéramos tomar la salida en la resistencia $v_R(t)$ o en el inductor $v_L(t)$, ¿qué tipo de filtros obtendríamos y cuál sería la justificación a partir de la impedancia y de la EDO?"*

**Respuesta Correcta del Grupo (Recomendado: Jessica o Kevin):**
> *"Profesor, la topología serie distribuye la misma corriente en los tres componentes, pero la impedancia compleja de cada uno determina la función de transferencia:  
> 1. **En el condensador ($v_C$):** Su reactancia es $Z_C = \frac{1}{j\omega C}$. A baja frecuencia tiende a circuito abierto ($\infty$), quedándose con toda la tensión de la fuente ($0\text{ dB}$); a alta frecuencia tiende a cortocircuito ($0$), por lo que es un **filtro pasa-bajo**.  
> 2. **En el inductor ($v_L$):** Su reactancia es $Z_L = j\omega L$. A baja frecuencia es un cortocircuito ($0\text{ V}$) y a alta frecuencia es circuito abierto ($\infty$). Por tanto, la salida en el inductor $v_L(t)$ es un **filtro pasa-alto de 2do orden**, con atenuación de $+40\text{ dB/década}$ en bajas frecuencias y ganancia unitaria en altas frecuencias.  
> 3. **En la resistencia ($v_R$):** Su función de transferencia es $H_R(s) = \frac{R s / L}{s^2 + (R/L)s + 1/LC}$. En $\omega \to 0$ y en $\omega \to \infty$ la ganancia cae a cero, pero en la frecuencia de resonancia $\omega = \omega_n = \frac{1}{\sqrt{LC}}$, las reactancias del inductor y condensador se cancelan mutuamente ($j\omega L + \frac{1}{j\omega C} = 0$), de modo que toda la tensión de entrada cae en la resistencia ($|H_R| = 1$). Por consiguiente, tomar la salida en la resistencia constituye un **filtro pasa-banda de 2do orden**."*

---

### PREGUNTA DIFÍCIL 2 (Paradoja Energética y Principios de Conservación):
> **Docente:** *"En la respuesta analítica para $R = 10\,\Omega$, ustedes calcularon que el voltaje en el condensador alcanza un pico de $20.75\text{ V}$, aun cuando la fuente solo suministra $12\text{ V}$. ¿Viola este sobreimpulso del $73\%$ la Primera Ley de la Termodinámica o el Principio de Conservación de la Energía?"*

**Respuesta Correcta del Grupo (Recomendado: Kevin o Alvaro):**
> *"De ninguna manera, profesor. No existe violación del principio de conservación de la energía; se trata de una transferencia y concentración temporal de energía entre campos.  
> Durante la primera mitad del semiciclo transitorio ($0 < t < 31.57\text{ ms}$), circula una corriente $I(t)$ no despreciable. La fuente $E(t)$ suministra energía tanto al circuito disipativo como a los elementos reactivos. En particular, el inductor almacena energía en su campo magnético dada por $E_L = \frac{1}{2} L I(t)^2$.  
> Cuando la tensión en el condensador alcanza los $12\text{ V}$, la corriente no se detiene instantáneamente debido a la inercia inductiva ($L$). Para mantener el flujo de corriente, el campo magnético del inductor colapsa e induce una fem autoinvertida ($v_L = -L \frac{dI}{dt}$) que actúa en serie con la fuente, inyectando la energía magnética almacenada hacia el condensador en forma de energía electrostática adicional $E_C = \frac{1}{2} C V_C^2$.  
> Por tanto, el pico de $20.75\text{ V}$ representa la suma de la energía entregada por la fuente más la energía magnética transferida desde el inductor. Si integramos la potencia total $\int_0^t E(\tau) I(\tau) d\tau$, esta es en todo instante mayor o igual a la energía neta almacenada más la disipada en la resistencia, cumpliéndose rigurosamente el balance energético."*

---

### PREGUNTA DIFÍCIL 3 (Computación Científica y Estabilidad Numérica):
> **Docente:** *"En el procesamiento del archivo de audio real utilizaron una frecuencia de muestreo de $44.1\text{ kHz}$ con el método RK4. ¿Por qué el algoritmo se mantuvo perfectamente estable sin divergencia numérica, y qué criterio de tamaño de paso $h$ garantiza que el método RK4 no entre en resonancia numérica espuria?"*

**Respuesta Correcta del Grupo (Recomendado: Alvaro o Jorge):**
> *"Profesor, la estabilidad numérica de un integrador explícito como RK4 aplicado a un sistema lineal $\dot{\vec{y}} = \mathbf{A} \vec{y}$ depende de que los valores propios $\lambda_i$ de la matriz del sistema, multiplicados por el paso $h$, caigan dentro de la región de estabilidad absoluta de RK4 en el plano complejo.  
> Para RK4, la región de estabilidad en el eje imaginario cubre el intervalo $[-2.78 j, +2.78 j]$, y en el eje real negativo hasta aproximadamente $-2.78$.  
> En nuestro circuito, el polo de mayor magnitud (frecuencia natural) es $\omega_n = 100\text{ rad/s}$.  
> Con $f_s = 44100\text{ Hz}$, el paso temporal es:  
> $$h = \frac{1}{44100} \approx 2.268 \times 10^{-5}\text{ s}$$  
> Al evaluar el producto adimensional:  
> $$|h \cdot \lambda| \approx h \cdot \omega_n = (2.268 \times 10^{-5}\text{ s}) \times (100\text{ rad/s}) \approx 0.002268 \ll 2.78$$  
> Como $0.00227$ es más de mil veces menor que el límite de estabilidad de RK4, el sistema opera en una zona de hiper-estabilidad y máxima fidelidad asintótica. Esto explica por qué el error numérico fue del orden de los nanovoltios ($10^{-9}\text{ V}$) y no existió ningún artefacto de aliasing o inestabilidad numérica."*
