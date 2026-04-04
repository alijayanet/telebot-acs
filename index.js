// Tambahkan timestamp di awal
console.log(`[${Date.now()}] Starting application...`);

const config = require('./config');
const GenieACSBot = require('./BotManager');

// Inisialisasi semua bot
const bots = {};

Object.entries(config.servers).forEach(([serverId, serverConfig]) => {
    try {
        serverConfig.serverId = serverId;
        console.log(`[${Date.now()}] Starting bot for ${serverConfig.name}...`);
        
        // Validasi konfigurasi
        if (!serverConfig.botToken) {
            console.error(`[${Date.now()}] [${serverConfig.name}] Error: Bot token tidak ditemukan`);
            return;
        }

        if (!serverConfig.adminIds || serverConfig.adminIds.length === 0) {
            console.error(`[${Date.now()}] [${serverConfig.name}] Warning: Tidak ada admin terdaftar`);
        }

        const bot = new GenieACSBot(serverConfig);
        if (bot.isInitialized()) {
            bots[serverId] = bot;
            console.log(`[${Date.now()}] [${serverConfig.name}] Bot berhasil dijalankan`);
        } else {
            console.error(`[${Date.now()}] [${serverConfig.name}] Bot gagal diinisialisasi`);
        }
    } catch (error) {
        console.error(`[${Date.now()}] Error starting bot for ${serverConfig.name}:`, error);
    }
});

const activeBots = Object.keys(bots).length;
console.log(`[${Date.now()}] ${activeBots} bot aktif dari ${Object.keys(config.servers).length} server`);

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\nShutting down bots...');
    
    // Hentikan polling untuk semua bot
    for (const [serverId, bot] of Object.entries(bots)) {
        try {
            if (bot.bot) {
                await bot.bot.stopPolling();
                console.log(`[${bot.name}] Bot stopped`);
            }
        } catch (error) {
            console.error(`Error stopping bot ${bot.name}:`, error.message);
        }
    }
    
    process.exit();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(`[${Date.now()}] Uncaught Exception:`, error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${Date.now()}] Unhandled Rejection at:`, promise, 'reason:', reason);
}); 