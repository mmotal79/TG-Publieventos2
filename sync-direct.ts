import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'mensajeria-ia@tg-publieventos-492703.iam.gserviceaccount.com';

console.log("Using email:", CLIENT_EMAIL);
// console.log("Using key:", process.env.GOOGLE_PRIVATE_KEY ? 'Present' : 'Missing');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1UBWEQgWfl8btIbKwxXj7oE4u-n6aWW1VMmLHwIq83VQ'; 

async function testSync() {
  try {
    const range = 'A:H'; 
    const valueInputOption = 'USER_ENTERED'; 
    const fechaHoraVE = new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" });

    console.log('[Google Sheets] Intentando insertar en Sheets...');

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption,
      requestBody: {
        values: [
          [
            'TEST_ID_123',
            fechaHoraVE,
            'Test Nombre',
            'Test Empresa',
            '1234567890',
            'test@test.com',
            'Prueba de mensaje desde el test',
            'Pendiente'
          ]
        ],
      },
    });

    console.log('Ráfaga exitosa. Fila insertada en Sheets:', response.data.updates?.updatedRange);
  } catch (error: any) {
    console.error('Error inyectando datos:', error?.message || error);
    if (error?.response?.data) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSync();
