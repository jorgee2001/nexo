const express = require('express');
const bodyParser = require('body-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const os = require('os');

const app = express();
app.use(express.json());

// Inicializar cliente de WhatsApp con persistencia de sesión
const client = new Client({
    authStrategy: new LocalAuth() // guarda sesión en .wwebjs_auth
});

// Generar QR para vincular
client.on('qr', qr => {
    console.log('Escanea este QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Cuando está listo
client.on('ready', () => {
    console.log('✅ WhatsApp conectado y listo para enviar mensajes');
});

// Ruta para enviar mensaje desde ESP32/Arduino
app.post('/send', async (req, res) => {
    try {
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).json({ error: 'Faltan parámetros: number y message' });
        }

        // Formato internacional (ej: México 521XXXXXXXXXX)
        const chatId = `${number}@g.us`;

        await client.sendMessage(chatId, message);
        res.json({ status: 'success', message: `Mensaje enviado a ${number}` });

    } catch (err) {
        console.error('❌ Error enviando mensaje:', err);
        res.status(500).json({ error: 'Error enviando mensaje' });
    }
});

// Iniciar servidor Express
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = os.networkInterfaces();
    let ipAddress = 'desconocida';

    // Buscar una IP IPv4 de la red local
    for (const iface of Object.values(networkInterfaces)) {
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) {
                ipAddress = addr.address;
            }
        }
    }

    console.log(`🚀 Servidor escuchando en http://${ipAddress}:${PORT}`);
});
// Inicializar WhatsApp
client.initialize();
