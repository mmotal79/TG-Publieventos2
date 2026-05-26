import { google } from 'googleapis';

const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'mensajeria-ia@tg-publieventos-492703.iam.gserviceaccount.com';

// Configuración de las credenciales de la cuenta de servicio
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Formatea la clave privada de los saltos de línea literales
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1UBWEQgWfl8btIbKwxXj7oE4u-n6aWW1VMmLHwIq83VQ'; 

export interface INotificacion {
  idSolicitud: string;
  nombreCliente: string;
  empresa: string;
  telefono: string;
  email: string;
  mensajePeticion: string;
}

export const enviarRafagaAGoogleSheets = async (datos: INotificacion) => {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      console.warn("GOOGLE_PRIVATE_KEY no configurado en entorno, ignorando inserción de Sheets.");
      return;
    }

    const range = 'A:H'; 
    const valueInputOption = 'USER_ENTERED'; 

    // Limpia el teléfono para WhatsApp (ej: quita espacios, letras o el '+')
    const telefonoLimpio = datos.telefono.replace(/\D/g, '');

    // Obtener la fecha y hora exacta en zona horaria de Venezuela
    const fechaHoraVE = new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" });

    console.log('[Google Sheets] Intentando insertar en Sheets...', { spreadsheetId: SPREADSHEET_ID, range });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption,
      requestBody: {
        values: [
          [
            datos.idSolicitud,
            fechaHoraVE,
            datos.nombreCliente,
            datos.empresa,
            telefonoLimpio,
            datos.email,
            datos.mensajePeticion,
            'Pendiente' // El disparador para IA de mensajería (ej. WhatsApp)
          ]
        ],
      },
    });

    console.log('[Google Sheets] Ráfaga exitosa. Fila insertada en Sheets:', response.data.updates?.updatedRange);
    return response.data;
  } catch (error: any) {
    console.error('[Google Sheets] Error inyectando datos en caliente en Google Sheets:', error?.message || error);
    if (error?.response?.data) {
      console.error('[Google Sheets] Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }
};
