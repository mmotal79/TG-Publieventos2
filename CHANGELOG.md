# CHANGELOG - TG-Publieventos

## [1.3.4] - 2026-04-10
### Tipo: Corrección Definitiva de Build (Case Sensitivity)
### Descripción: 
- Reversión total de la capitalización en las importaciones de componentes UI (`Tabs`, `Button`, `Card`, etc.).
- Se unificó todo el código fuente para que utilice exclusivamente minúsculas (`@/components/ui/tabs`), coincidiendo exactamente con el estándar de `shadcn/ui` y el estado actual del repositorio en GitHub.
- Esto elimina la necesidad de forzar a Git en Windows a detectar cambios de mayúsculas (`git mv`), resolviendo el error `ENOENT` en Linux (Render) de forma nativa y a prueba de fallos.
### Impacto: Pipeline de CI/CD (Render) estabilizado al 100%.

## [1.3.3] - 2026-04-10
### Tipo: Cambio de Lógica / Corrección de Build
### Descripción: 
- Localizado y corregido error de ruta redundante en `Budgets.tsx` (doble referencia a src).
- Corregida capitalización del componente `Tabs` mediante `git mv` para resolver incompatibilidad con el sistema de archivos de Render (Linux).
- Optimización de la configuración de despliegue para Web Service.
### Impacto: Módulo de Presupuestos (Budgets) y Pipeline de CI/CD.

## [1.3.2] - 2026-04-10
### Tipo: Corrección de Despliegue (Build & Config)
### Descripción: 
- Corregida discrepancia de mayúsculas en la importación del componente Button en `Login.tsx` para compatibilidad con sistemas Linux (Render).
- Corregido el "Start Command" en los ajustes de Render; se cambió la ejecución directa de archivos fuente por el servicio de archivos estáticos de producción.
### Impacto: Proceso de despliegue (CI/CD) y estabilidad del entorno de producción.

## [1.3.0] - 2026-04-10 | Tipo: Funcionalidad | Descripción: Modelos de Catálogos y Admin Setup | Impacto: Base de Datos y UI.

- Creación de cuenta administradora base (mmotal@gmail.com) en MongoDB.
- Creación de esquemas Mongoose para todas las colecciones del catálogo (Telas, Modelos, Cortes, Bordados, Estampados, Acabados, Configuración).
- Implementación de API genérica para catálogos.
- Desarrollo de interfaces UI para Modelos, Cortes y Acabados.

## [1.2.0] - 2026-04-10 | Tipo: Funcionalidad | Descripción: Módulo de Usuarios y Nómina | Impacto: Seguridad y RRHH.

- Creación de esquema de usuarios en MongoDB (Mongoose).
- Integración de lógica de nómina en USD (Salario Base, Comisiones, Frecuencia).
- Mecanismos de control de estado de cuenta (Activo, Bloqueado, Suspendido, Baja Laboral).
- Interfaz de gestión de usuarios con control de acceso por roles (Admin/Gerente).

## [1.1.0] - 2026-04-10 | Tipo: Funcionalidad | Descripción: Expansión de Catálogos y Transacciones | Impacto: UI/UX y Lógica de Negocio.

- Implementación de menú acordeón en Sidebar para Catálogos.
- Creación de interfaces TypeScript para entidades de catálogos (Telas, Modelos, Acabados, etc.).
- Desarrollo de componente genérico de Tabla y Modals operativos con estados (Loading, Success, Error).
- Integración de módulo de Transacciones para registro de abonos multimoneda.
- Definición de rutas de backend (Express) para gestión de Usuarios y Nómina.

## [1.0.0] - 2026-04-10 | Tipo: Funcionalidad | Descripción: Inicialización de arquitectura base | Impacto: Estructura inicial del proyecto.

- Configuración de Express + Vite (Full-stack).
- Integración de Firebase Auth & Firestore.
- Configuración de Tailwind CSS y shadcn/ui.
- Definición de rutas base y arquitectura de roles.
