const makeWASocket = require('@whiskeysockets/baileys').default
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const askAI = require("./ai/engine");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_session')

  // Ambil versi WA terbaru
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`Menggunakan WA versi: ${version.join('.')}, terbaru: ${isLatest}`)

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
    retryRequestDelayMs: 2000,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n======================================')
      console.log('  Scan QR ini di WhatsApp kamu:')
      console.log('  WA > Perangkat Tertaut > Tautkan')
      console.log('======================================\n')
      qrcode.generate(qr, { small: true })
      console.log('\n(Tunggu dan scan QR di atas, jangan tutup CMD)\n')
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      console.log('Koneksi terputus, kode:', statusCode)

      if (shouldReconnect) {
        console.log('Mencoba reconnect...')
        startBot()
      } else {
        console.log('Logged out. Hapus folder auth_session lalu jalankan ulang.')
      }

    } else if (connection === 'connecting') {
      console.log('Menghubungkan ke WhatsApp...')

    } else if (connection === 'open') {
      console.log('Berhasil connect ke WhatsApp!')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]

    if (!msg.key.fromMe && msg.message) {
      const sender = msg.key.remoteJid
      const teks =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text || ''

      if (!teks.trim()) return

      console.log(`Pesan dari ${sender}: ${teks}`)

      if (teks.startsWith(".ai")) {
          const prompt = teks.replace(".ai", "").trim();
          if (!prompt) {
              return await sock.sendMessage(sender, {
                  text: "Contoh:\n.ai buat CRUD produk PHP"
              });
          }
          await sock.sendMessage(sender, {
              text: "Sedang berpikir..."
          });
          const reply = await askAI(prompt);
          await sock.sendMessage(sender, {
              text: reply
          });
      }
    }
  })
}

startBot().catch(err => {
  console.error('Error saat start bot:', err)
  process.exit(1)
})
