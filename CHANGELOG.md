# Changelog

Todas las modificaciones notables en el proyecto VenePOS Platform serán documentadas en este archivo.

## [v0.1.0 ] - 2025-12-05

### Added 🚀

- **Campañas de Difusión**: Nueva opción en el wizard de creación de campañas para segmentar audiencias de tipo "Difusión".
- **Soporte de Concurrencia**: Capacidad para ejecutar múltiples campañas simultáneamente. Ahora es posible tener una campaña enviándose mientras otras están pausadas o en borrador sin interferencias.

### Changed ⚡

- **Motor de Campañas (`worker.ts`)**: Refactorización crítica para filtrar el procesamiento de mensajes por `campaignId`. Anteriormente, el worker tomaba mensajes de cualquier campaña pendiente globalmente.
- **Lógica de Importación (`import.ts`)**:
  - Se agregó detección de cargas de tipo "Difusión" (Rango TX).
  - Se implementó protección de estado: Importar un archivo con rango "Difusión" ya no resetea el estatus de terminales "Recuperadas" a "Inactivas". Se actualiza el rango pero se preserva el estado de salud del cliente.
- **UI de Campañas**: El componente `CampaignRunner` ahora opera con aislamiento por ID de campaña.

### Fixed 🐛

- Solucionado bug crítico donde al iniciar una nueva campaña, se completaban automáticamente campañas que estaban en estado `paused`.
- Corregido comportamiento donde cargas de listas de difusión alteraban métricas de recuperación al marcar falsamente clientes como inactivos.

---

## Historial Previo

### 2025-12-04

- Implementación inicial de herramientas Coach AI.
- Integración de análisis de brechas de ventas.

### 2025-12-03

- Mejoras en la visualización de rutas y mapas.
