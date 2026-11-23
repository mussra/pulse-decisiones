# Pulse · Decisiones (prototipo)
Web privada para registrar y votar decisiones de diseño de Pulse. Sin build: HTML + JS (módulos) + Firebase por CDN.

## Probar en local
`python3 -m http.server 8000` y abrir http://localhost:8000 (modo local: datos en el navegador, sin Firebase).

## Plan
1. Prototipo local (hecho): lista, estado (propuesta/pendiente/aceptada/descartada/idea futura), voto Sí/No/Dudo por persona (Ant, Vane, Lucía, Pablo; los niños votan desde la sesión de Ant), texto libre por persona en todas las decisiones (campo answers{nombre:texto}), comentarios con motivo.
2. Conectar a Firebase propio de Pulse: Auth (Google) + Firestore. Pegar la config web en firebase-config.js.
3. Reglas de Firestore con lista de correos permitidos (firestore.rules), publicadas por Ant.
4. Lectura por el agente: cuenta de servicio solo-lectura entregada por enlace de bóveda, o export JSON manual.
5. Despliegue (GitHub Pages u otro) solo cuando Ant lo vea y diga OK.

## Datos
decisions/{id}: title, description, status, options[], votes{nombre:si|no|dudo}, updatedAt, updatedBy. Subcolección comments: who, text, at, by.
La semilla (seed.js) solo trae lo que está en el prompt maestro. No inventa costes ni reglas.

## Publicación
GitHub Pages desde main. El acceso lo controlan el login de Google y las reglas de Firestore (lista de correos, no incluida en este repo). La config web de Firebase es pública por diseño.
