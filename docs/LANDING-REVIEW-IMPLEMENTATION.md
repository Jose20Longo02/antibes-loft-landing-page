# Plan de implementación — review de la landing (8 Oct 2026)

Fuente: `antibes-landing-page-review-en.pdf` (Finlay Brewer International).

Este documento describe **cómo** se implementarían los cambios, por fases. No hay cambios en la página hasta que lo apruebes.

## Qué se conserva

- Precio visible en el hero.
- Fotografía, ficha técnica y galería.
- Un CTA del hero que llega al formulario.
- Identidad visual actual (tipografía, color, tono editorial).
- Idiomas EN / FR / DE.

## Qué no se hará

- No se promete una descarga instantánea del dossier. El CTA principal pide información real, que el equipo envía después.
- No se promete un tiempo de respuesta fijo (hoy la página de gracias dice “within 24 hours”). Se quita salvo que confirmes que el equipo lo cumple siempre.
- No se audita ni se reescribe la política de privacidad. El enlace sigue a `finlaybrewer.com/privacy-policy` hasta que indiques otra URL.
- No se cambia el targeting de Meta ni el formulario de anuncios. El brief cubre la landing.

## Decisiones que necesito de ti antes de codear

| # | Decisión | Propuesta por defecto |
|---|---|---|
| 1 | Título del hero | “Architect-designed loft for sale in Antibes” (y equivalentes FR/DE). “Villa” solo en texto descriptivo, no en el H1. |
| 2 | Foto de apertura | Sustituir el paisaje de Antibes (`_DSC1605-Edit.jpg`) por el salón de doble altura (`_DSC1556.jpg`). El paisaje baja a galería / lifestyle. |
| 3 | CTA principal / secundario | Principal: pedir el dossier. Secundario: pedir visita privada. Los dos llegan al mismo formulario, con la intención ya marcada. |
| 4 | Teléfono | Opcional si piden dossier. Obligatorio si piden visita o llamada. |
| 5 | País y plazo de compra | Se quedan, marcados como opcionales. |
| 6 | Dominio público | Los enlaces de idioma serán relativos (`/en`, `/fr`, `/de`). En Render hay que fijar `SITE_URL=https://finlay-brewer-international.com` para canonical, Open Graph y sitemap. |

Si alguna fila no te encaja, dímelo en la revisión y ajusto el plan antes de implementar.

---

## Fase 1 — Dominio e idioma (P1, developer)

**Problema:** el selector de idioma usa `SITE_URL` o, si no existe, `RENDER_EXTERNAL_URL`. Por eso EN/FR/DE saltan a `antibes-loft-landing-page.onrender.com`.

**Archivos:** `config/i18n.js` (`getLocaleSwitcher`), `config/env.js`, `docs/RENDER.md`.

### Pasos

1. Hacer que los enlaces del selector sean same-origin: `/en`, `/fr`, `/de` (y `/xx/thank-you` si están en la página de gracias). No prefijar el host de Render.
2. Revisar canonical, `hreflang`, sitemap y Open Graph para que usen el dominio de marca cuando `SITE_URL` esté definido.
3. Documentar en Render: `SITE_URL=https://finlay-brewer-international.com` (sin barra final).
4. Comprobar que el formulario, la redirección a gracias y el enlace “volver” usan rutas relativas (`/fr/thank-you`, `/fr`), no el host de Render.

### Checklist

Desplegado.

- [x] En Render → Environment, `SITE_URL=https://finlay-brewer-international.com` (sin barra final) y redeploy.
- [x] Desde `finlay-brewer-international.com/en`, EN / FR / DE mantienen ese dominio en la barra.
- [x] Lo mismo desde `/fr` y `/de`, ida y vuelta.
- [x] La página de gracias también cambia de idioma sin salir del dominio.
- [x] Un anuncio en francés debe apuntar a `/fr`, uno en inglés a `/en`, uno en alemán a `/de`. Esto se verifica en el Ads Manager; no lo cambia el código solo.

---

## Fase 2 — Oferta clara en el hero (P1, contenido + diseño)

**Problema:** el H1 dice “The Villa Above Antibes” y el subtítulo dice loft. En móvil, tipo, precio y siguiente paso no se leen juntos.

**Archivos:** `locales/en.js`, `locales/fr.js`, `locales/de.js`, `views/partials/hero.ejs`, `public/css/sections.css`, `config/media.js` (imagen de hero y preload).

### Copy propuesto (EN)

- Eyebrow: Antibes · French Riviera
- H1: Architect-designed loft for sale in Antibes
- Hechos: Approximately 206 m² · Three suites · 40 m² terrace
- Precio: €1,980,000
- Apoyo: Panoramic Mediterranean views, double-height living and a secure garage.
- CTA principal: Request the full property details → `#presentation` con intención `dossier`
- CTA secundario: Arrange a private viewing → `#presentation` con intención `viewing`

FR y DE reciben el mismo sentido, no una traducción literal rígida. “Villa” desaparece del título, meta title y página de gracias. Puede quedar en un párrafo de “The Idea” si sigue siendo útil como comparación.

### Pasos

1. Reescribir `hero` en los tres idiomas.
2. Añadir segundo botón en `hero.ejs`, visualmente distinto del principal (relleno vs contorno).
3. Cambiar la imagen de hero a `_DSC1556.jpg` (salón de doble altura, con vista por las ventanas) y su `alt`.
4. Ajustar el CSS del hero para que, a 390 px, quepan tipo, Antibes, precio y los dos CTA sin recorte ni scroll horizontal.
5. Quitar o acortar la nota “Private sale · introduction on request” / “sur introduction”.

### Checklist

Implementado.

- [x] En el primer pantallazo móvil se entiende: loft, Antibes, precio y un CTA.
- [x] No hay dos descripciones contradictorias (villa vs loft) en el H1.
- [x] El paisaje de Fort Carré sigue en la página, más abajo.
- [x] Los dos botones se distinguen y ambos llegan al formulario.

---

## Fase 3 — Dos vías de contacto: dossier y visita (P1, contenido + developer)

**Problema:** solo existe “Request private viewing”. Quien aún no quiere cita no tiene un paso más ligero, y la confirmación habla como si la visita ya estuviera concertada.

**Archivos:** `views/partials/presentation.ejs`, `public/js/presentation-form.js`, `public/css/sections.css` y `components.css`, `controllers/inquiryController.js`, `services/sheetsService.js`, `services/emailService.js`, `scripts/google-apps-script.js`, `views/pages/thank-you.ejs`, locales EN/FR/DE.

### Comportamiento

El formulario único tiene un campo obligatorio:

- Recibir el dossier (planos e información disponible)
- Concertar una visita privada

Los CTA del hero preseleccionan esa opción (`?intent=dossier` o `#presentation` + query/hash que el JS lee).

| Campo | Dossier | Visita |
|---|---|---|
| Nombre, email | Obligatorios | Obligatorios |
| Teléfono | Opcional | Obligatorio, con una línea que explica por qué |
| País, plazo | Opcionales | Opcionales |
| Mensaje | Opcional | Opcional |
| Idioma | Oculto, tomado de la página (`/en`, `/fr`, `/de`) | Igual |

La intención viaja en el POST (`inquiry_intent`), entra en el email (asunto y cuerpo) y en la hoja como columna nueva al final, para no desplazar las columnas actuales.

Asunto de ejemplo: `New lead — dossier — Antibes Loft - €1,980,000` o `New lead — viewing — …`.

Página de gracias, según intención:

- Dossier: “Hemos recibido tu solicitud de información. El equipo te enviará los detalles disponibles.” No dice que la visita está confirmada. No promete 24 horas.
- Visita: “Hemos recibido tu solicitud de visita. El equipo te contactará para proponer un horario.” No es una cita confirmada.

### Pasos

1. Añadir el selector de intención y textos de expectativa en EN/FR/DE.
2. Quitar el campo visible de idioma; dejar el hidden.
3. Validar teléfono solo cuando la intención es visita.
4. Guardar la intención en Sheets, email y respuesta JSON.
5. Actualizar Apps Script (`doPost` + columna). Tras el deploy del código hará falta **nueva versión** del webhook, igual que con el email.
6. Bifurcar la página de gracias.
7. Reescribir el bloque del formulario: título tipo “Explore this Antibes loft”, sin “Request access”, “qualified enquiries” ni “sur introduction”.

### Checklist

Implementado y en vivo. Falta el envío de prueba al inbox.

- [x] Dossier y visita llegan al formulario con la opción correcta ya marcada.
- [ ] La intención sobrevive al envío (email + fila de Sheets).
- [x] Un dossier se puede enviar sin teléfono.
- [x] Una visita sin teléfono muestra error y no se envía.
- [x] La página de gracias describe lo pedido y no confirma una cita.
- [ ] Un envío de prueba (cuando implementemos) llega al inbox real, una sola vez, con idioma e intención correctos.

### Fuera de este código

El dossier en sí (planos, cargos, documentos) lo prepara el equipo. La web solo captura la petición. No se publica un PDF automático.

---

## Fase 4 — Recorrido más corto en móvil (P2, diseño + developer)

**Problema:** hay mucho texto editorial antes de hechos, galería y contacto. En el formulario, el primer campo queda muy abajo.

**Orden actual:** hero → film → idea → experience → features → gallery → lifestyle → details → presentation.

**Orden propuesto:**

1. Hero (oferta + dos CTA)
2. Hechos clave (la ficha que hoy está en `details`, subida y más compacta)
3. Galería y vídeo (interiores, terraza, dormitorios, vistas)
4. Qué incluye el dossier (bloque corto: planos si existen, especificaciones, información del edificio). Sin prometer documentos que no tengáis.
5. Antibes, versión corta (lifestyle recortado)
6. Formulario

`idea`, `experience` y `features` no se borran de golpe: se comprimen. El texto largo de “sin compromiso” pasa a uno o dos párrafos, o se retira si repite el hero.

### Pasos

1. Reordenar los `include` en `views/pages/index.ejs`.
2. Reducir padding del bloque de presentación en móvil para que el primer campo aparezca antes.
3. Añadir un botón fijo en móvil (“Request details”) que no tape campos ni el botón de envío. Se oculta cuando el formulario ya está en pantalla.
4. Revisar 390 px y un ancho intermedio (~768 px): sin scroll horizontal, sin solapes, hechos y CTA legibles.
5. No dejar datos esenciales solo dentro del vídeo o de un carrusel.

### Checklist

Implementado.

- [x] Precio, m², suites, terraza y garaje se ven antes de la galería.
- [x] Galería y vídeo van antes del texto de estilo de vida.
- [x] En 390 px no hay recorte ni scroll horizontal.
- [x] El botón fijo no cubre el formulario.
- [x] Labels y botones siguen legibles.

---

## Fase 5 — Lenguaje de exclusividad (P2, contenido)

Sustituir, en EN / FR / DE:

| Quitar | Sustituir por |
|---|---|
| Request access | Explore this Antibes loft / equivalente |
| Qualified enquiries | Una frase del siguiente paso (dossier o visita) |
| Introduction on request / sur introduction | Quitar del hero |
| Not widely marketed / sans large commercialisation | Quitar mientras haya anuncios de pago, salvo que confirmes que sigue siendo cierto |

Revisar también el pie, la ficha (`details.note`) y la página de gracias.

### Checklist

Implementado.

- [x] Ningún CTA pide “acceso” o “introducción”.
- [x] No se dice “no comercializado ampliamente” si los anuncios siguen activos.
- [x] El enlace de privacidad sigue abriendo la URL aprobada.

---

## Fase 6 — Comprobación antes de volver a enviar tráfico

No se da por cerrada la implementación hasta pasar esto en el dominio de marca, no en `onrender.com`.

| Check | Condición |
|---|---|
| Idioma y dominio | Abrir `/en`, `/fr`, `/de` y cambiar entre ellos. El idioma es el correcto y la barra sigue en `finlay-brewer-international.com`. |
| Móvil | 390 px y otro ancho común: sin recorte, solape ni scroll horizontal. Hechos y CTA legibles. |
| Dos rutas | Dossier y visita marcan la intención correcta y esa intención llega al email. |
| Prueba autorizada | Un solo envío de prueba al inbox real, con idioma e intención. El texto de gracias no implica cita confirmada. |
| Medición | El evento de conversión (Lead) se dispara tras el envío correcto, no al hacer clic. Si hay pixel y CAPI, el `event_id` sigue siendo el mismo. |
| Enlaces | Privacidad, contacto y promesa del dossier coinciden con lo que el equipo puede enviar. |

### Cómo lo verificaré en el navegador

1. Desktop y 390 px en `/en`, `/fr` y `/de`.
2. Clic en cada CTA del hero y comprobar la opción marcada.
3. Envío de dossier sin teléfono y de visita sin teléfono (esta debe fallar).
4. Un envío de prueba completo y revisión del email (intención + idioma).
5. Cambio de idioma en home y en gracias, comprobando el host.

---

## Orden de trabajo cuando des el visto bueno

1. Fase 1 (dominio) — cambio pequeño y evita perder visitas al cambiar de idioma.
2. Fase 2 (hero) — lo primero que ve el anuncio.
3. Fase 3 (formulario e intención) — sin esto, el CTA nuevo no tiene destino real.
4. Fase 5 (copy de exclusividad) — se hace junto con los textos de la fase 2 y 3.
5. Fase 4 (reordenar y móvil) — cuando la oferta y el formulario ya están definidos.
6. Fase 6 (QA).

Fases 2, 3 y 5 comparten los archivos de idioma; se editan en la misma pasada para no reescribir EN/FR/DE tres veces.

## Fuera de alcance de este plan

- Pixel, CAPI, atribución y por qué la campaña no registró leads (el brief lo marca como no verificado).
- Preparar el PDF o los planos del dossier.
- Cambiar preguntas del formulario de Meta Ads (ciudad, SMS, cita). Eso ya se trató aparte.
