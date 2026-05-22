# Sistema de Gestión Administrativa - Documentación del Proyecto

## 1. Descripción General
Este sistema es una aplicación **Full-Stack** diseñada para la gestión operativa y administrativa de una empresa textil (TG-Textiles). Permite centralizar la recepción de leads desde el Landing Page, la creación de presupuestos, el control de pagos y la gestión de personal/clientes.

## 2. Funcionalidad Actual
*   **Gestión de Notificaciones (Leads):**
    *   Recepción en tiempo real de formularios de contacto.
    *   Sistema de lectura (marcado como leído) con contadores persistentes en el layout.
    *   Borrado seguro con doble confirmación.
*   **Presupuestos y Facturación:**
    *   Generación de presupuestos detallados.
    *   Control de estados (Pendiente, Pagado, etc.).
    *   Modales dinámicos para gestión de pagos y previsualizaciones.
*   **Catálogos y Maestros:**
    *   Gestión de clientes y trabajadores.
    *   Administración de unidades de producción.
*   **Panel Administrativo:**
    *   Control de acceso basado en roles (RBAC) para proteger rutas sensibles.
    *   Gestión de configuración del Landing Page (Footer, Imágenes).

## 3. Debilidades Actuales
*   **Dependencia de APIs Externas:** Algunas funcionalidades dependen de la estabilidad de la conexión para el refresco de notificaciones.
*   **Validaciones del Lado del Cliente:** Aunque existen validaciones con Zod en el backend, el frontend requiere una retroalimentación más rica para errores complejos.
*   **Persistencia Visual:** El estado de los filtros en tablas no se mantiene al navegar entre páginas.

## 4. Posibilidades de Mejora
*   **Módulo de Inventario:** Integración de stocks de telas y suministros vinculados directamente a la creación de presupuestos.
*   **Reportes Avanzados:** Generación de gráficos (D3.js / Recharts) sobre el rendimiento de ventas y leads convertidos.
*   **Optimización Offline:** Implementación de Service Workers para permitir consultas básicas sin conexión.

## 5. Propuesta de Desarrollo (Roadmap)
1.  **Fase 1: Analítica:** Implementar un dashboard visual que resuma los presupuestos aprobados vs. pendientes por mes.
2.  **Fase 2: Automatización:** Envío automático de notificaciones por correo o WhatsApp al cliente cuando se aprueba un presupuesto.
3.  **Fase 3: Escalabilidad:** Mejorar la arquitectura de micro-servicios para separar la lógica del Landing Page de la lógica administrativa interna.
4.  **Fase 4: Experiencia de Usuario (UX):** Unificar todos los modales bajo un sistema de diseño más coherente y transiciones fluidas con `motion`.

---
*Este documento es dinámico y refleja el estado actual del desarrollo al 22 de mayo de 2026.*
