const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

async function startPipuu() {
    const { state, saveCreds } = await useMultiFileAuthState('pipuu_session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startPipuu();
        } else if (connection === 'open') {
            console.log('--- PIPUU MD සාර්ථකව සම්බන්ධ වුණා! ---');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const from = msg.key.remoteJid;

        if (text.toLowerCase() === '.alive') {
            await sock.sendMessage(from, { 
                text: '*PIPUU MD වැඩ කරනවා!* 🐺\n\nමෙය ඔබගේ පුද්ගලික WhatsApp සහායකයා වේ.' 
            }, { quoted: msg });
        }
        
        if (text.toLowerCase() === '.menu') {
            await sock.sendMessage(from, { 
                text: '👋 *හලෝ, මම PIPUU MD!*\n\nමෙන්න මගේ දැනට තියෙන Commands:\n1. .alive\n2. .menu\n\nවැඩිදුර විශේෂාංග ළඟදීම...' 
            }, { quoted: msg });
        }
    });
}

startPipuu();
