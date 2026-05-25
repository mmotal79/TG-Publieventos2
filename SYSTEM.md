# Sistema de Gestión Administrativa - Documentación del Proyecto

## 1. Descripción General
Este sistema es una aplicación **Full-Stack** diseñada para la gestión operativa y administrativa de una empresa textil (TG-Textiles). Permite centralizar la recepción de leads desde el Landing Page, la creación de presupuestos, el control de pagos y la gestión de personal/clientes. Recientemente se ha extendido para dar soporte completo al rol de **Vendedor**, robusteciendo la estructura de seguridad y permitiendo operaciones descentralizadas sin alterar la base administrativa central.

## 2. Funcionalidad Actual
*   **Gestión de Notificaciones (Leads):**
    *   Recepción en tiempo real de formularios de contacto (Leads desde la Web).
    *   Sistema de lectura (marcado como leído con modal asociado) con decremento persistente en tiempo real de los contadores en el layout principal y cabeceras.
    *   Borrado seguro con modal pop-up de doble confirmación (con diseño accesible y contraste de botón rojo con texto blanco).
*   **Presupuestos y Facturación (Estructura Base):**
    *   Generación de presupuestos detallados con cálculo de costos dinámicos e IVA.
    *   Control de estados del flujo de vida administrativo (`pendiente`, `aceptado_con_abono`, `en_proceso`, `culminado`, `entregado_y_pagado`, `anulado`).
    *   Modales dinámicos para gestión de abonos y previsualizaciones dinámicas imprimibles.
*   **Nueva Extensión de Seguridad y Rol Vendedor (RBAC):**
    *   **Aislamiento Estricto de Datos (Multi-Tenant Local):** Los usuarios con rol de Vendedor (Sales, Rol 2) solo pueden ver y gestionar sus propios clientes creados, sus propios presupuestos y las transacciones asociadas, garantizando total privacidad. Los administradores y mánagers retienen el control global.
    *   **Presupuesto Espejo (Calculadora Dinámica / Modo de Edición Espejo):**
        *   **Interfaz Responsiva Dedicada:** Integración de un botón interactivo elegante e iconográfico (`SquarePen` de Lucide) en el listado de presupuestos, condicionado bajo reglas RBAC estrictas: solo visible para administradores, gerentes y el propio vendedor creador del presupuesto.
        *   **Bloqueo Absoluto de Estructura original:** Al editar, se activa un banner de alerta que restringe toda modificación técnica. La identidad del cliente, tipo de tela, diseño, modelo, corte, nivel de urgencia, y cantidades de prendas requeridas se inhabilitan por completo (`disabled` / `readOnly`).
        *   **Campo Único Mutable (Precio Unitario):** Único parámetro modificable interactivo, con validación persistente en tiempo real que previene registrar montos inferiores al costo base asignado por la lógica de costeo central.
        *   **Mapeo de Cálculos y Recálculo Lineal:** Una calculadora plana reactiva multiplica de forma instantánea el nuevo precio de oferta asignado (`Cantidad * Nuevo Precio Vendedor`), actualizando los subtotals y el gran total final visualizado en pantalla de manera inmediata.
    *   **Emisión de Cotizaciones sin Fricción (Diseño de Impresión/PDF):** El módulo de previsualización oculta automáticamente desgloses de costos internos, nomenclaturas técnicas o descuentos por volumen para el cliente final, y asocia dinámicamente el nombre y contacto del vendedor en lugar de los datos corporativos genéricos.
*   **Módulo de Producción con Acceso Restringido:**
    *   Registro y actualización de órdenes de confección por fases de producción.
    *   Para el rol de **Vendedor**, esta vista funciona de forma exclusivamente **lectura (Read-only)**, inhabilitando los botones de cambios de estados y modales de guardado para resguardar la consistencia del taller.

## 3. Debilidades Actuales
*   **Dependencia de Sincronización Local:** La isolación de datos recae principalmente sobre filtrado por API de `creatorEmail` y roles del perfil. Para entornos masivos se sugiere implementar índices compuestos en la base de datos a nivel de base de datos.
*   **Caché Frontend:** Al editar un rubro el refresco depende del trigger de recarga; se sugiere integrar React Query / SWR para una experiencia SPA reactiva.

## 4. Posibilidades de Mejora
*   **Módulo de Inventario:** Integración de stocks de telas y suministros vinculados directamente al costo base de los presupuestos.
*   **Pasarela de Pagos Móvil:** Registro automatizado de pagos directos mediante integraciones de pago móvil o códigos QR dinámicos en el PDF de cotización del vendedor.
*   **Reportes de Conversión para Vendedores:** Gráficas de rendimiento individuales y metas de comisiones mensuales para incentivar al equipo de ventas.

## 5. Propuesta de Desarrollo (Roadmap)
1.  **Fase 1: Analítica General (En Desarrollo):** Implementar tableros estadísticos con `D3.js` / `Recharts` que diferencien el volumen de ventas por cada representante registrado.
2.  **Fase 2: Notificaciones Comerciales:** Envío automático de presupuestos formateados y aprobados directamente al WhatsApp o Correo electrónico del cliente.
3.  **Fase 3: Refactor de Estado Global:** Migración a Redux Toolkit para simplificar la compartición de estados mutables del carrito del vendedor.

---
*Este documento es dinámico y refleja el estado actual de las implementaciones del módulo de ventas y seguridad al 25 de mayo de 2026.*
