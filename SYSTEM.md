# Sistema de Gestión Administrativa - Documentación del Proyecto

## 1. Descripción General
Este sistema es una aplicación **Full-Stack** diseñada para la gestión operativa y administrativa de una empresa textil (TG-Textiles). Permite centralizar la recepción de leads desde el Landing Page, la creación de presupuestos, el control de pagos y la gestión de personal/clientes. Recientemente se ha extendido para dar soporte completo al rol de **Vendedor**, robusteciendo la estructura de seguridad y permitiendo operaciones descentralizadas sin alterar la base administrativa central.

## 2. Funcionalidad Actual
*   **Gestión de Notificaciones (Leads) e Integración con Landing Page:**
    *   **Recepción en tiempo real** de formularios de contacto (Leads desde la Web).
    *   **Flujo UX Calculadora -> Contacto**: Se conectó dinámicamente el botón "Formalizar Propuesta" de la calculadora. Al hacer clic, captura el estado, formatea el texto, realiza un _smooth-scroll_ hacia el contacto, auto-rellena el mensaje con el presupuesto estructurado, y transfiere foco al input de "Nombre Completo".
    *   **Renderizado Condicional de Hero**: El botón "Planificar Orden" se acopla a un parámetro global y estricto, que se habilita/deshabilita sincronizado con la configuración base.
    *   **Inyección en Ráfaga a Google Sheets**: Se acopló el servicio `googleSheets.service.ts` para enviar los prospectos en caliente después de guardar en local de modo que los sistemas de automatización de mensajería (bot de WhatsApp) detecten inmediatamente este Lead.
*   **Presupuestos y Facturación (Estructura Base):**
    *   Generación de presupuestos detallados con cálculo de costos dinámicos e IVA.
    *   Control de estados del flujo de vida administrativo.
    *   Modales dinámicos para gestión de abonos y previsualizaciones dinámicas imprimibles.
*   **Nueva Extensión de Seguridad y Rol Vendedor (RBAC):**
    *   Aislamiento Estricto de Datos y Presupuesto Espejo (Modo de Edición Espejo Responsivo).
    *   Emisión de Cotizaciones sin Fricción orientada al cliente.
*   **Módulo de Producción con Acceso Restringido.**

## 3. Debilidades Detectadas (Acción Crítica Requerida)
*   **Google Sheets API Deshabilitada (Causa de fallos de subida):** En el entorno de prueba del servidor se detectó el error clave `Error 403: Google Sheets API has not been used in project 870797762910 before or it is disabled.`. **Solución Urgente:** El administrador de Google Cloud debe habilitar la API de Sheets.
*   **Dependencia Fuerte a Variables de Entorno al Build:** Carencia de aserciones críticas para que la app se detenga inmediatamente si falta `GOOGLE_PRIVATE_KEY`; actualmente el sistema falla silenciosamente al faltar keys sin una alerta roja en la UI.
*   **Manejo de Errores en Ráfaga (Superficial):** Si Sheets falla por límite de red temporal o bloqueo de API, la ráfaga de datos colapsa. El catch del error solo envía detalles a Logger de consola en lugar de un reagendamiento (retries).
*   **Dependencia de Sincronización Local & Caché:** La isolación de datos recae sobre la capa de aplicación y su API; adicionalmente, no hay un state global cache (como React Query) para el manejo masivo de carga del lado del gestor.

## 4. Posibilidades de Mejora a Implementar
*   **Sistemas de Recuperación/Retry a Google Sheets:** Implementar una cola persistida / _exponential backoff_ local en la ráfaga a Google Sheets para volver a intentar insertarlos cuando se alcancen _rate limits_.
*   **Validación Estricta de Editor de Drive:** Agregar un endpoint tipo "Health Check" que compruebe tanto si la API GCP está viva, como si la cuenta `mensajeria-ia@...` tiene acceso `Editor` al Spreadsheet específico del cliente.
*   **Sanitización Robusta de Áreas de Texto Múltiple:** Implementar un middleware que formatee automáticamente los saltos de líneas complejos incrustados por usuarios finales garantizando que el diseño matricial en Google Sheets mantenga su estética regular.
*   **Facturación Móvil & Notificaciones:** Añadir automatizaciones push nativas, pagos de pasarela rápida y tableros estadísticos interactivos diferenciados por vendedor (Recharts/D3.js).

## 5. Propuesta de Desarrollo (Roadmap)
1.  **Fase 1: Correción de API y Ráfagas (Urgente):** Reactivar Google Sheets desde el panel GCP y aplicar endpoints correctivos.
2.  **Fase 2: Analítica Comercial:** Estadísticas y gráficas para comisiones de representantes.
3.  **Fase 3: Refactor de Estado y Persistencia UI:** Migración a Redux Toolkit y robustecimiento de colas asíncronas para el guardado local y cloud.

---
*Este documento es dinámico y refleja el estado actual de las integraciones comerciales del sistema y módulos de Landing Page al 26 de mayo de 2026.*
