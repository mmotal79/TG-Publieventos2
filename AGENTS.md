# Project Instructions and Conventions

## Google Sheets Integration
- El proyecto utiliza Google Sheets para respaldar las solicitudes de contacto recibidas desde el Landing Page.
- Estas solicitudes se inyectan en "caliente" (background) a través del servicio `/src/services/googleSheets.service.ts` usando la cuenta de servicio de Google `mensajeria-ia@tg-publieventos-492703.iam.gserviceaccount.com`.
- Se debe asegurar que las credenciales requeridas (`GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_PRIVATE_KEY`) se encuentren presentes en el entorno de despliegue y configuradas correctamente (escapando los saltos de línea de la private key con `.replace(/\\n/g, '\n')`).
- Al insertar en Google Sheets, se manda por defecto el estado 'Pendiente' en la última columna, lo cual sirve de disparador para sistemas de mensajería (como bots de WhatsApp).
