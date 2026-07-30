try {
    require('dotenv').config();
} catch (e) {}

module.exports = {
    // Konfigurasi untuk setiap server
    servers: {
        // Server 1
        server1: {
            name: process.env.SERVER1_NAME || "ALIJAYA-NET",
            botToken: process.env.SERVER1_BOT_TOKEN || "1938127147:AAFMcxxxxxxxx",
            adminIds: process.env.SERVER1_ADMIN_IDS ? process.env.SERVER1_ADMIN_IDS.split(',').map(id => id.trim()) : ["56785xxxxxx"],
            customers: {},
            genieacs: {
                baseUrl: process.env.SERVER1_GENIEACS_URL || "http://192.168.8.xx:7557",
                username: process.env.SERVER1_GENIEACS_USER || "admin",
                password: process.env.SERVER1_GENIEACS_PASS || "admin"
            }
        },
        // Tambahkan server lain sesuai kebutuhan jika diperlukan
    }
};
