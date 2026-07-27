# AplicoCV — Enfoque 2.0: Rediseño del recorrido de entrada (funnel conversacional)

**Fecha:** 2026-07-16
**Origen:** Feedback en video de Ravi (WhatsApp, 2026-07-16) + brief escrito "Propuesta de dirección Enfoque 2.0" (punto 11) + análisis cuadro por cuadro del recorrido de la herramienta de referencia **Global Work AI** (`globalwork.ai`).

> **Cómo se armó este plan:** se analizó el video de referencia de 7:33 min (screen-recording vertical) muestreando ~185 cuadros (6 hojas de contacto + 34 cuadros a resolución nativa del tramo de pago). El plan se basa en el **flujo visual** reconstruido pantalla por pantalla y en el brief escrito del cliente. La narración hablada del video no se transcribió automáticamente (no hay herramienta de transcripción en el entorno), pero el mensaje de WhatsApp del cliente ya resume su intención.

---

## 1. El problema, en las palabras del cliente

> "Se ve que aparece toda la info de antes, ¿dónde está la parte de la interacción con el usuario? … aparece el espacio para PEGAR CV, y una vez que te arroja el resultado te pide crear la cuenta… y después pagar. Habíamos acordado que la experiencia iba a ser similar a la otra web: llega el usuario, y la web comienza a hacerle preguntas; después de varias preguntas y conocer su situación, recién crea la cuenta y pone su CV. Luego de sentir que la web lo entiende, es más fácil pagar. Hay una experiencia previa."

**Diagnóstico:** el landing actual todavía es una página informativa + un widget "pegá tu CV → resultado → creá cuenta → pagá". Eso es exactamente el orden inverso al acordado. El punto 11 del brief ya lo decía: *"En lugar de una página que muestre todo de entrada, el usuario interactúa desde el primer momento: carga algo, ve el valor… y recién después define suscribirse."*

**Decisión:** reemplazar por completo el recorrido de entrada por un **funnel conversacional al estilo Global Work AI / Noom / Cal AI**. No se conserva la estructura vieja del landing.

---

## 2. Anatomía de la herramienta de referencia (lo que reconstruimos del video)

El recorrido de Global Work AI es un **cuestionario conversacional largo (~50 pantallas)** organizado en capítulos, con una barra de progreso arriba. El pago aparece **al final**, en el pico de inversión emocional del usuario. Estructura:

### Capítulos (etiqueta que muestra la barra de progreso)
1. **ESTADO ACTUAL** — situación laboral, enfoque de búsqueda, hace cuánto busca.
2. **LO QUE BUSCAS** — objetivo (cambio de carrera, ingresos, etc.), tipo de jornada, salario mínimo, remoto/híbrido/oficina, país.
3. **TU EXPERIENCIA** — categorías de interés, educación, nivel profesional, apertura a roles menores, estado del CV, **subida del CV**, estrategias probadas.
4. **CÓMO TE AYUDAMOS** — mayormente pantallas de agitación + educación + micro-preguntas de empatía.
5. **Tramo final / logística** — nacionalidad, autorización para trabajar en EE.UU., visa, disponibilidad, preguntas de igualdad de oportunidades (EEO, opcionales, con "SALTAR").
6. **Matching → Éxito → Email/Cuenta → Paywall.**

### Tipos de pantalla (los "ladrillos" reutilizables)
| Tipo | Ejemplo del video |
|---|---|
| **Selección única** | "¿Cuál es tu situación laboral actual?" (Desempleado / Empleado / Freelance / Estudiante) |
| **Selección múltiple** (checkboxes) | "¿Qué estás buscando?", "¿Qué categorías te interesan?", "¿Qué beneficios son más importantes?" |
| **Slider sobre histograma** | "¿Cuál es tu salario mínimo deseado?" con toggle Por hora/Mensual/Anual y distribución |
| **Dropdown con búsqueda** | "¿En qué país te encuentras?", "¿Cuál es tu nacionalidad?" (con teclado) |
| **Afirmación Sí/No** ("¿Te identificas con…?") | "Cada trabajo que me gusta en LinkedIn ya tiene 200+ aplicaciones" → ❌ No / ✅ Sí |
| **Interstitial informativo** (ícono/gráfico/estadística + CONTINUAR) | "Acceso a 750k+ trabajos ocultos" (iceberg), "Nuestra IA aplica por ti (10X)", "20 millones de trabajos analizados" |
| **Interstitial de prueba social** | Gráfico "65% de nuestros miembros encuentra trabajo en el primer mes"; tarjeta testimonial ★★★★★ de "Michael" |
| **Pantalla de subida de CV** | "Añade tu currículum para mejorar tus coincidencias" (con "CONTINUAR SIN CURRÍCULUM") → escaneo → "Tu currículum ha sido subido ✓ Experiencia/Habilidades/Educación" |
| **Pantalla de progreso/matching** | "Emparejándote con trabajos… 76%→95%" + checklist que se completa |
| **Éxito** | "¡Éxito! Encontramos **556 trabajos** que coinciden con tu perfil" + trofeo |
| **Captura de email / cuenta** | "Ingresa tu email para recibir ofertas de nuestro grupo privado de reclutadores" → CREAR CUENTA |
| **Paywall** | "Elige tu plan" + countdown "termina en 09:55" + precios **por día** en moneda local con precio tachado y "50% DESCUENTO" |

### Palancas psicológicas (a replicar deliberadamente)
- **Compromiso y consistencia:** decenas de micro-respuestas fáciles antes de pedir nada.
- **Prueba social / autoridad:** "20M de trabajos analizados para 150.000 usuarios", curvas de éxito, testimonios.
- **Agitación del dolor:** "Temo que mi CV desaparezca en un agujero negro", "57% de los remotos reciben 300+ aplicaciones en 24 h".
- **Personalización:** su CV, su número ("556"), sus preferencias resumidas en tarjeta.
- **Escasez / urgencia:** countdown de 10 min, "50% descuento reservado".
- **Anclaje de precio:** precio **por día** (CLP 485/día suena menos que CLP 14.550/mes) + tachado del precio "original".

---

## 3. Flujo objetivo para AplicoCV (nuevo orden)

```
Landing mínimo (1 promesa + 1 CTA "Empezar")
      │
      ▼
[QUIZ CONVERSACIONAL]  ── barra de progreso por capítulos
  Estado actual → Lo que buscás → Tu experiencia
  (intercalando interstitials de valor + afirmaciones Sí/No)
      │
      ▼
[SUBIR CV]  (framed como "mejorá tus coincidencias" · opción "continuar sin CV")
      │
      ▼
[MATCHING]  animación "Emparejándote… %" + checklist + testimonial
      │
      ▼
[ÉXITO]  "Encontramos N trabajos que coinciden con tu perfil"  (N = conteo real del buscador)
      │
      ▼
[EMAIL → CREAR CUENTA]  (recién acá se registra)
      │
      ▼
[PAYWALL]  Elige tu plan · countdown · precio por día · moneda local (LATAM) / USD (US)
      │
      ▼
[DASHBOARD / COPILOTO]  las N coincidencias reales ya preparadas
```

Diferencia clave con lo actual: **cuenta y pago al final**, después del quiz + CV + matching + éxito. El "resultado" que hoy mostramos temprano se convierte en la recompensa final ("VER MIS N COINCIDENCIAS").

---

## 4. Honestidad del producto (dónde NO copiamos ciego)

La referencia usa números que pueden ser marketing. Nosotros ya tenemos infra para hacerlos **reales** — hay que aprovecharla para no caer en las mismas fabricaciones que corregimos en el REQ 1:

- **El número "N trabajos"** debe salir del buscador real (4 feeds live: Remotive/RemoteOK/Arbeitnow/Jobicy + catálogo de portales) filtrado por las respuestas del quiz, no un número inventado. Si el conteo real es bajo, se puede contar también los portales/enlaces preparados, pero sin inflar.
- **El % de matching** de la animación puede ser cosmético (progreso de cálculo) siempre que el score por oferta que se muestra después sea el real del ranking con IA.
- **El countdown / "50% descuento"** es una técnica de urgencia legítima solo si el descuento existe de verdad (precio ancla real, no un tachado ficticio permanente). Definir con el cliente si el descuento es real y por sesión, o si preferimos una urgencia más honesta (p. ej. "precio de lanzamiento").
- **Salario y estadísticas** siempre como referencia orientativa (ya acordado, punto 7 del brief).

> Recomendación: mantener la *forma* del funnel de referencia (que es lo que convierte) pero con *contenido veraz*, que es lo que nos diferencia y evita problemas de confianza/legales.

---

## 5. Arquitectura técnica

### 5.1 Frontend (React + Vite + TS + Tailwind, ya en el repo)
- **Motor de quiz declarativo.** Un archivo de configuración (`funnel.config.ts`) que describe la secuencia de pasos como datos, no como componentes sueltos. Cada paso: `{ id, chapter, type, question, options|slider|interstitial, saveTo, condition? }`.
  - `type ∈ { single, multi, slider, country, affirm, interstitial, testimonial, upload, matching, success, email, paywall }`.
  - `condition` permite ramificar (ej.: preguntas de visa EE.UU. solo si el mercado/objetivo lo amerita — ver §7).
- **Un solo componente `<FunnelStep>`** que renderiza según `type`. Reutilizable → agregar/reordenar preguntas es editar datos.
- **Estado del funnel** en un store liviano (context/zustand) + persistencia en `localStorage` para no perder progreso si recarga. Nada sensible antes de crear cuenta.
- **Barra de progreso** por capítulos (label + % del capítulo actual).
- **Transiciones** con framer-motion (ya instalado): slide/fade entre pasos, animación de la barra, contador del matching, countdown del paywall.
- **Ruta:** `/` = landing mínimo con CTA "Empezar" → `/comenzar` (funnel). El dashboard actual queda detrás de auth + suscripción.

### 5.2 Backend (FastAPI + SQLite, ya en el repo)
- **`POST /funnel/session`** — crea/actualiza una sesión anónima (id en cookie/localStorage) y va guardando respuestas parciales. Permite continuar y alimenta analítica de abandono por paso.
- **`POST /funnel/preview-matches`** — con las respuestas + (opcional) CV subido, corre el buscador real y devuelve el **conteo N** y una muestra, para las pantallas de matching/éxito **antes** de crear cuenta. Reusa `agent_service` / `llm_service.rank_jobs`.
- **Al crear cuenta (`/auth/register`)** — se "adopta" la sesión anónima: las respuestas del quiz se vuelcan a `User.preferences` (categorías, salario, remoto, país, objetivos, etc.) y el CV subido se asocia. Así el perfil queda armado sin re-preguntar.
- **Paywall** — reusa `billing.py` ya reescrito (ruteo regional LATAM→MercadoPago / US→Lemon Squeezy, planes semanal/mensual). Falta: **plan trimestral** (3 meses) y **precios "por día"/descuento** para la vista (cálculo de display, no cambia el cobro real).
- **Captura de email temprana** (antes de completar pago) → guardar lead para remarketing aunque no pague (respetando privacidad / punto 7).

### 5.3 Datos
- El quiz mapea ~20–25 campos. La mayoría ya tienen destino en el perfil actual; los nuevos (situación laboral, enfoque de búsqueda, estrategias probadas, autorización EE.UU./visa, beneficios, tamaño de empresa/equipo, horario) se guardan en `User.preferences` (JSON) — coherente con el patrón actual (prod no tiene Alembic).

### 5.4 Analítica (nuevo, importante para un funnel)
- Registrar avance/abandono por paso (`funnel_step_viewed`, `funnel_step_completed`) para poder optimizar dónde se cae la gente. Sin esto, un funnel largo es una caja negra.

---

## 6. Inventario de contenido a producir (localizado EN / ES / PT-BR)

Del video se identifican, como mínimo, estos bloques a redactar y traducir (el motor los toma como datos):

**Preguntas (single/multi/slider/country):** situación laboral · enfoque de búsqueda · antigüedad de búsqueda · objetivo · tipo de jornada · salario mínimo (hora/mes/año) · modalidad remoto/híbrido/oficina · qué gusta del remoto · país · categorías de trabajo · educación · nivel profesional · apertura a roles menores · estado del CV · estrategias probadas · tiempo diario para aplicar · qué impide aplicar más · horario · tamaño de equipo · tamaño de empresa · beneficios · nacionalidad · autorización EE.UU. · visa · empresas fuera de EE.UU. · licencia de conducir · EEO opcional (género/etnia/discapacidad/veterano).

**Afirmaciones Sí/No de empatía (~12):** "200+ aplicaciones por puesto", "agujero negro del CV", "el ATS filtra antes del reclutador", "ofertas que parecen estafa", "raramente encuentro ofertas que coincidan", "harto de llenar los mismos formularios", "LinkedIn no me muestra vacantes relevantes", etc.

**Interstitials de valor/educación (~10):** métodos viejos ya no funcionan · "20M trabajos analizados" · "57% de remotos: 300+ aplicaciones en 24h" · "escaneamos 1.000+ fuentes/día" · "80% de ofertas remotas no están activas" · iceberg "750k+ trabajos ocultos" · comparativa LinkedIn/Indeed vs nosotros · "aplicar promedio 30+ min, 90% data entry" · "nuestra IA aplica por vos (10X)" · "rellená una vez, usalo siempre".

**Cierre:** matching (checklist + testimonios) · éxito (N trabajos) · email/cuenta · paywall (planes + countdown + "lo que desbloqueás").

> Todo el contenido debe adaptarse a **nuestra** verdad (nuestras fuentes, nuestras cifras) y a nuestro tono, no copiar literal a Global Work AI.

---

## 7. Decisiones a confirmar con el cliente (bloquean parte del desarrollo)

1. **Longitud del funnel.** La referencia tiene ~50 pantallas. ¿Replicamos esa longitud (máxima conversión, más fricción) o una versión más corta (~20–25)? Recomiendo empezar en ~25 y extender con datos de analítica.
2. **Mercado y preguntas de EE.UU.** El video incluye nacionalidad / autorización EE.UU. / visa. Para un usuario LATAM esas preguntas pueden sobrar. ¿Ramificamos según país/mercado (US ve visa, LATAM no)?
3. **Precios, plan trimestral y "por día".** Hoy tenemos semanal + mensual. La referencia muestra **3 planes** (semana / mes / 3 meses) con precio **por día** y **50% de descuento con countdown**. Necesito: valores finales, si sumamos el trimestral, y **si el descuento es real** (para no mostrar urgencia falsa).
4. **Honestidad de cifras.** ¿Ok con mostrar el conteo real de coincidencias (aunque a veces sea menor a "556") en lugar de un número inflado? (Recomendado.)
5. **Captura de email antes de pagar.** ¿Guardamos el lead para remarketing? ¿Con qué texto de consentimiento?
6. **Video de la herramienta / acceso.** Si el cliente puede dar acceso navegable a Global Work AI (punto 8 del brief), afinamos micro-interacciones (timing de animaciones, validaciones) que en video no se ven al 100%.

---

## 8. Plan por fases (milestones)

- **M0 — Alineación (este documento).** Confirmar §7. *(bloqueante)*
- **M1 — Motor de quiz + landing mínimo.** `funnel.config.ts`, `<FunnelStep>`, store + persistencia, barra de progreso, ruteo `/` → `/comenzar`. Con 5–6 pasos de muestra. *(sin backend todavía; datos en localStorage)*
- **M2 — Contenido completo del quiz.** Todas las preguntas + afirmaciones + interstitials, localizados EN/ES/PT-BR. Slider de salario con histograma. Dropdown de país con búsqueda.
- **M3 — CV mid-funnel + matching real.** Subida de CV dentro del funnel; `POST /funnel/preview-matches` conectando el buscador real; pantalla de matching animada + éxito con N real.
- **M4 — Cuenta al final + adopción de sesión.** Email/registro al cierre; volcado de respuestas a `preferences`; asociar CV. El dashboard muestra las N coincidencias ya preparadas.
- **M5 — Paywall.** "Elige tu plan" con countdown, precio por día, moneda local/US (reusa ruteo regional), plan trimestral si se confirma, "lo que desbloqueás". Integrar con billing existente.
- **M6 — Analítica + optimización.** Eventos por paso, embudo de abandono, primeros ajustes A/B de longitud/orden.
- **M7 — QA + deploy.** Typecheck 3 locales, prueba de pago real chica (MercadoPago), deploy VPS + push.

---

## 9. Qué se conserva y qué se reemplaza

**Se reemplaza:** el landing informativo actual y el `IntakeWidget` "pegá tu CV → resultado → cuenta → pago" como puerta de entrada.

**Se conserva y se reutiliza:** todo el backend de Enfoque 2.0 ya construido — buscador real (REQ 1), adaptador de CV por oferta y por industria (REQ 2/4/7), análisis de CV (REQ 3), entrevistas con avatar (REQ 6), salario de referencia (REQ 8), seguimiento (REQ 9), extensión (REQ 10), suscripción-only + ruteo de pago regional + auto-renovación (REQ 12/13). El funnel es la **nueva capa de entrada** que alimenta y vende todo eso; no rehace el motor.

---

## 10. Riesgo principal

Un funnel de 50 pasos mal medido puede **bajar** la conversión en vez de subirla. Por eso M6 (analítica) no es opcional: sin medición de abandono por paso, estaríamos copiando la forma sin poder ajustarla. La referencia funciona porque está optimizada; nosotros llegamos ahí midiendo, no adivinando.


---

## Versión resumida (para compartir con el cliente)

**Fecha:** 2026-07-16 · Detalle completo en `ENFOQUE_2.0_ONBOARDING_FUNNEL_PLAN.md`

## La idea
Hoy el sitio muestra todo de entrada y pide pagar demasiado pronto. Lo cambiamos por una
**experiencia conversacional**: el sitio le hace preguntas al usuario, entiende su
situación, le muestra el valor, y **recién al final** le pide crear la cuenta y pagar.
Referencia: Global Work AI.

## El nuevo flujo
```
Landing simple → Preguntas (quiz) → Subir CV → "Buscando tus coincidencias…"
→ "Encontramos N trabajos para vos" → Crear cuenta → Elegir plan y pagar → Panel
```
El pago queda al final, cuando el usuario ya siente que la herramienta lo entiende.

## Qué construimos (nuevo)
1. **Quiz conversacional** — preguntas simples (una por pantalla), con barra de progreso.
2. **Pantallas de valor** intercaladas — datos y prueba social que generan confianza.
3. **Subida de CV** dentro del recorrido, como "mejorá tus coincidencias".
4. **Pantalla de resultado** — animación de matching + "Encontramos N trabajos".
5. **Cuenta + pago al final** — elegir plan con precio claro; reutiliza el cobro ya hecho.

## Qué se reutiliza (ya está listo)
El buscador de empleos, el adaptador de CV, el análisis de CV, las entrevistas, el
seguimiento, la extensión y el cobro por suscripción **ya están construidos**. Esto solo
cambia la **puerta de entrada** que los alimenta y los vende.

## Cómo lo hacemos (4 pasos)
- **Paso 1:** Motor del quiz + landing simple.
- **Paso 2:** Todas las preguntas y pantallas de valor (ES/EN/PT).
- **Paso 3:** CV + resultado con el conteo real de trabajos.
- **Paso 4:** Cuenta al final + pantalla de planes y pago.

## Para confirmar con el cliente
1. **Cuántas preguntas** (versión larga estilo referencia o una más corta).
2. **Precios y planes** (semanal/mensual, ¿sumamos 3 meses?, ¿mostramos descuento real?).
3. **Números honestos** — mostrar el conteo real de coincidencias (recomendado).

Con eso confirmado, arrancamos por el Paso 1.
