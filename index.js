const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startPipuu() {
    const { state, saveCreds } = await useMultiFileAuthState('pipuu_session');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    // මෙතන 947... විදිහට ඔයාගේ නම්බර් එක දාන්න
    let phoneNumber = "94774149518"; 

    if (!sock.authState.creds.registered) {
        await delay(1500);
        let code = await sock.requestPairingCode(phoneNumber);
        console.log(`\n\n--- ඔයාගේ PAIRING CODE එක: ${code} ---\n\n`);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log('PIPUU MD සම්බන්ධ වුණා!');
        if (connection === 'close') startPipuu();
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        if (text.toLowerCase() === '.alive') {
            await sock.sendMessage(msg.key.remoteJid, { text: '*PIPUU MD* වැඩ!' });
        }
    });
}
startPipuu();
