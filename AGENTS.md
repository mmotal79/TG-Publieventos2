# Project Instructions and Conventions

## Google Sheets Integration
- El proyecto utiliza Google Sheets para respaldar las solicitudes de contacto recibidas desde el Landing Page.
- Estas solicitudes se inyectan en "caliente" (de forma síncrona tras guardar en BD) a través del servicio `/src/services/googleSheets.service.ts` usando la cuenta de servicio de Google `mensajeria-ia@tg-publieventos-492703.iam.gserviceaccount.com`.
- Se debe asegurar que las credenciales requeridas (`GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_PRIVATE_KEY`) se encuentren presentes en el entorno de despliegue y configuradas correctamente (escapando los saltos de línea de la private key con `.replace(/\\n/g, '\n')`).
- Al insertar en Google Sheets, se manda por defecto el estado 'Pendiente' en la última columna, lo cual sirve de disparador para sistemas de mensajería interactivos (como el bot de WhatsApp).

---

## 📊 Estado del Proyecto y Arquitectura

### ✅ Mejoras Implementadas Recientemente
1. **Flujo UX Calculadora -> Contacto**: Se conectó dinámicamente el botón "Formalizar Propuesta" de la calculadora. Al hacer clic, captura el estado (modelo, textura, etc.), formatea el texto, realiza un _smooth-scroll_ hacia la sección de contacto, auto-rellena el área de `mensaje` con el presupuesto en formato detallado, y transfiere el enfoque nativo (`focus()`) al input de "Nombre Completo" agilizando la conversión.
2. **Renderizado Condicional del Hero**: Se sincronizó el botón "Planificar Orden" de la sección Hero mediante renderizado condicional estricto (`{showCalculator && <Button>}`). Su visibilidad ahora depende absolutamente de la configuración central. 
3. **Inyección en Ráfaga a Google Sheets**: Se acopló limpiamente el servicio `googleSheets.service.ts` al ciclo de vida posterior del formulario de contacto para enviar los prospectos en caliente después de guardar en local.

### ⚠️ Debilidades Detectadas (Acción Crítica Requerida)
1. **Google Sheets API Deshabilitada (Causa del fallo de subida de datos)**: Durante el análisis del porqué no se estaban inyectando los datos a Google Drive, generamos un entorno de prueba en servidor donde capturamos el siguiente error originado por Google Cloud:
   > *`Error 403: Google Sheets API has not been used in project 870797762910 before or it is disabled.`*
   **Solución Urgente:** El administrador de Google Cloud debe habilitar la API de Sheets.  
2. **Dependencia Fuerte a Variables de Entorno en el Build**: Faltan aserciones críticas para que la app se detenga ruidosamente al inicio si las variables `GOOGLE_PRIVATE_KEY` faltan; actualmente falla silenciosamente sin alertar visiblemente en la UI del sistema.
3. **Manejo de Errores Superficial**: Si Sheets falla por límite de red, la ráfaga de datos colapsa. El catch del error actualmente sólo escribe la queja en el Log en lugar de reagendar la acción.

### 🚀 Futuras Mejoras a Implementar
1. **Sistema de Retries (Re-intentos)**: Implementar una cola persistida (o _exponential backoff_) en la ráfaga a Google Sheets, logrando que si la API rechaza la solicitud (rate-limits), se retenga en memoria y se vuelva a enviar en el siguiente intervalo.
2. **Validación de Privilegios "Editor" Sheets**: Agregar un endpoint de prueba "Health Check" que no solo detecte que la API está abierta en GCP, sino que valide también que la hoja de Google Sheets en particular (`1UBWEQgWfl8...`) tenga explícitamente compartido el acceso de **Editor** a la cuenta de servicio (`mensajeria-ia@...`).
3. **Sanitización Robusta de Inputs de Texto Múltiple**: Asegurar el formateo automático de saltos de líneas complejos incrustados por los clientes en los componentes Textarea para no desconfigurar el layout de las celdas en el Drive.
