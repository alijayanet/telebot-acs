const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

class GenieACSBot {
    constructor(config) {
        console.log(`[${Date.now()}] Initializing bot for ${config.name}...`);
        this.config = config;
        this.name = config.name;
        
        // Validasi konfigurasi
        if (!this.validateConfig()) {
            console.error(`[${Date.now()}] Failed to validate config for ${this.name}`);
            return;
        }

        try {
            console.log(`[${Date.now()}] Creating bot instance for ${this.name}...`);
            this.bot = new TelegramBot(config.botToken, {
                polling: true,
                onlyFirstMatch: true,
                request: {
                    timeout: 30000
                }
            });

            // Test koneksi bot
            this.bot.getMe().then((botInfo) => {
                console.log(`[${Date.now()}] Bot connected successfully as @${botInfo.username}`);
                this.setupHandlers();
            }).catch((error) => {
                console.error(`[${Date.now()}] Failed to connect bot:`, error.message);
                this.bot = null;
            });

        } catch (error) {
            console.error(`[${Date.now()}] Error in constructor:`, error.message);
            this.bot = null;
        }
    }

    validateConfig() {
        // Validasi token
        if (!this.config.botToken) {
            console.error(`[${this.name}] Error: Bot token tidak ditemukan`);
            return false;
        }

        // Validasi format token (basic check)
        if (!/^\d+:[A-Za-z0-9_-]{35,}$/.test(this.config.botToken)) {
            console.error(`[${this.name}] Error: Format bot token tidak valid`);
            return false;
        }

        // Validasi admin
        if (!Array.isArray(this.config.adminIds) || this.config.adminIds.length === 0) {
            console.error(`[${this.name}] Warning: Tidak ada admin yang terdaftar`);
        }

        // Validasi GenieACS config
        if (!this.config.genieacs?.baseUrl) {
            console.error(`[${this.name}] Error: URL GenieACS tidak ditemukan`);
            return false;
        }

        return true;
    }

    // Tambahkan method untuk mengecek status bot
    isInitialized() {
        return !!this.bot;
    }

    // Tambahkan fungsi helper untuk escape karakter Markdown
    escapeMarkdown(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/[_*[\]()~`>#+=|{}.!\-]/g, '\\$&');
    }

    setupHandlers() {
        // Tambahkan logging untuk semua pesan masuk
        this.bot.on('message', (msg) => {
            console.log(`[${Date.now()}] Received message from ${msg.chat.id}:`, msg.text);
            
            // Handle typos
            if (msg.text === '/star') {
                console.log(`[${Date.now()}] Detected typo /star, handling as /start`);
                // Trigger /start handler manually
                this.bot.emit('text', msg, ['/start']);
                return;
            }
        });

        // Handler untuk mendapatkan ID Telegram
        this.bot.onText(/\/myid/, (msg) => {
            const chatId = msg.chat.id;
            this.bot.sendMessage(chatId, 
                '🆔 *ID Telegram Anda*\n\n' +
                `ID: \`${chatId}\`\n\n` +
                '❗ Berikan ID ini kepada admin untuk didaftarkan',
                { parse_mode: 'MarkdownV2' }
            );
        });

        // Update /start handler dengan logging lebih detail
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            console.log(`[${Date.now()}] Processing /start command from ${chatId}`);
            
            const isAdmin = this.config.adminIds.includes(chatId.toString());
            const customers = this.config.customers || {};
            const customer = customers[chatId.toString()];
            
            console.log(`[${Date.now()}] User status - Admin: ${isAdmin}, Customer: ${customer ? 'yes' : 'no'}`);
            
            if (!isAdmin && !customer) {
                this.bot.sendMessage(chatId, 
                    '👋 *Selamat datang di Bot GenieACS*\n\n' +
                    '⚠️ Anda belum terdaftar dalam sistem\\.\n\n' +
                    '📱 *Untuk mendaftar:*\n' +
                    '1\\. Gunakan perintah /myid\n' +
                    '2\\. Copy ID Telegram Anda\n' +
                    '3\\. Berikan ID tersebut ke admin\n\n' +
                    '❗ Admin akan mendaftarkan perangkat Anda',
                    { parse_mode: 'MarkdownV2' }
                );
                return;
            }
            
            if (isAdmin) {
                const helpMessage = 
                    `🏢 *ALIJAYA GENIEACS BOT*\n\n` +
                    `🏢 *${this.escapeMarkdown(this.name)} Admin Panel*\n\n` +
                    '📱 *Perintah Admin:*\n' +
                    '/devices \\- Lihat semua device\n' +
                    '/customers \\- Lihat daftar pelanggan\n' +
                    '/addcustomer \\{ID\\_TELEGRAM\\} \\{NAMA\\} \\{DEVICE\\_SN\\} \\- Tambah pelanggan\n' +
                    '/delcustomer \\{ID\\_TELEGRAM\\} \\- Hapus pelanggan\n' +
                    '/status \\{SN\\} \\- Cek status device\n' +
                    '/signal \\{SN\\} \\- Cek signal device\n' +
                    '/reboot \\{SN\\} \\- Reboot device\n' +
                    '/wifi \\{SN\\} \\- Cek status WiFi\n' +
                    '/setwifi \\{SN\\} \\{SSID\\} \\- Ganti nama WiFi\n' +
                    '/setpass \\{SN\\} \\{PASSWORD\\} \\- Ganti password WiFi\n' +
                    '/addwan \\{SN\\} \\{USERNAME\\} \\{PASSWORD\\} \\- Set WAN credentials\n' +
                    '/users \\{SN\\} \\- Cek user terhubung\n\n' +
                    '*Cara Menambah Pelanggan:*\n' +
                    '1\\. Minta pelanggan kirim /myid ke bot\n' +
                    '2\\. Gunakan ID tersebut di perintah /addcustomer\n' +
                    '3\\. Contoh: `/addcustomer 123456789 "John Doe" ZTEGC8F12345`\n\n' +
                    '❗ ID Telegram berbeda dengan nomor telepon\n' +
                    '❗ Gunakan /devices untuk melihat daftar perintah lengkap per device';

                this.sendLongMessage(chatId, helpMessage, { parse_mode: 'MarkdownV2' });
            } else {
                this.bot.sendMessage(chatId, 
                    `👋 *Selamat datang ${customer.name}*\n\n` +
                    '📱 *Perintah yang tersedia:*\n' +
                    '/mystatus \\- Cek status perangkat Anda\n' +
                    '/mywifi \\- Cek status WiFi\n' +
                    '/changepass \\{PASSWORD\\} \\- Ganti password WiFi\n\n' +
                    '❗ Password WiFi minimal 8 karakter\n' +
                    '❗ Gunakan kombinasi huruf dan angka',
                    { parse_mode: 'MarkdownV2' }
                );
            }
        });

        // Handler untuk pelanggan: /mystatus
        this.bot.onText(/\/mystatus/, async (msg) => {
            const chatId = msg.chat.id;
            const customer = this.config.customers?.[chatId.toString()];
            
            if (!customer) return;

            try {
                const device = await this.getDeviceInfo(customer.deviceSN);
                if (!device) {
                    this.bot.sendMessage(chatId, '❌ Perangkat tidak ditemukan');
                    return;
                }

                const isOnline = device.Events?.Registered?._value || device.VirtualParameters?.pppoeIP?._value || device.VirtualParameters?.getdeviceuptime?._value;
                const status = isOnline ? '🟢 Online' : '🔴 Offline';
                const message = 
                    `📱 *Status Perangkat Anda*\n\n` +
                    `Pelanggan: ${this.escapeMarkdown(customer.name)}\n` +
                    `Status: ${status}\n` +
                    `Signal: ${this.escapeMarkdown(device.VirtualParameters?.RXPower?._value || '-')} dBm\n` +
                    `IP: ${this.escapeMarkdown(device.VirtualParameters?.pppoeIP?._value || '-')}\n` +
                    `Uptime: ${this.escapeMarkdown(device.VirtualParameters?.getdeviceuptime?._value || '-')}\n`;

                const options = {
                    parse_mode: 'MarkdownV2',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📡 Cek WiFi', callback_data: `wifi:${customer.deviceSN}` }]
                        ]
                    }
                };
                this.bot.sendMessage(chatId, message, options);
            } catch (error) {
                this.bot.sendMessage(chatId, '❌ Gagal mengambil status perangkat');
            }
        });

        // Handler untuk pelanggan: /changepass
        this.bot.onText(/\/changepass (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const customer = this.config.customers?.[chatId.toString()];
            
            if (!customer) return;

            const newPassword = match[1];
            if (newPassword.length < 8) {
                this.bot.sendMessage(chatId, '❌ Password harus minimal 8 karakter');
                return;
            }

            try {
                await this.setWiFiPassword(customer.deviceSN, newPassword);
                this.bot.sendMessage(chatId, 
                    '✅ *Password WiFi berhasil diubah\\!*\n\n' +
                    `Password baru: \`${newPassword}\`\n\n` +
                    '❗ Perangkat yang terhubung perlu reconnect',
                    { parse_mode: 'MarkdownV2' }
                );
            } catch (error) {
                this.bot.sendMessage(chatId, '❌ Gagal mengubah password WiFi');
            }
        });

        // Update handler /setwifi untuk menggunakan regex yang ketat (SN/username tidak boleh ada spasi sebelum nama WiFi)
        this.bot.onText(/\/setwifi (\S+) (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const searchTerm = match[1];
            const newSSID = match[2];
            
            try {
                await this.setWiFiSSID(searchTerm, newSSID);
                
                    await this.bot.sendMessage(chatId, 
                        '✅ *Nama WiFi berhasil diubah\\!*\n\n' +
                        `SSID Baru: \`${this.escapeMarkdown(newSSID)}\`\n\n` +
                        '❗ Perangkat yang terhubung perlu reconnect',
                        { parse_mode: 'MarkdownV2' }
                    );
            } catch (error) {
                console.error(`[${Date.now()}] Error in /setwifi handler:`, error);
                let errorMessage = '❌ Gagal mengubah nama WiFi';
                
                if (error.response) {
                    console.error(`[${Date.now()}] Response status:`, error.response.status);
                    console.error(`[${Date.now()}] Response data:`, error.response.data);
                    
                    if (error.response.status === 404) {
                        errorMessage = '❌ Device tidak ditemukan';
                    } else if (error.response.status === 400) {
                        errorMessage = '❌ Parameter tidak valid';
                    }
                }
                
                await this.bot.sendMessage(chatId, errorMessage);
            }
        });

        // Handler untuk command /devices
        this.bot.onText(/\/devices/, async (msg) => {
            const chatId = msg.chat.id;
            console.log(`[${Date.now()}] Received /devices command from ${chatId}`);
            
            if (!this.config.adminIds.includes(chatId.toString())) {
                console.log(`[${Date.now()}] Unauthorized access from ${chatId}`);
                return;
            }

            try {
                console.log(`[${Date.now()}] Getting devices for ${chatId}...`);
                const devices = await this.getDevicesFromGenieACS();
                
                if (!devices || devices.length === 0) {
                    console.log(`[${Date.now()}] No devices found`);
                    await this.bot.sendMessage(chatId, '❌ Tidak ada device yang ditemukan');
                    return;
                }

                console.log(`[${Date.now()}] Processing ${devices.length} devices`);
                let message = '📱 *Daftar Device*\n\n';
                
                devices.forEach((device, index) => {
                    try {
                        const vParams = device.VirtualParameters || {};
                        const deviceInfo = device._deviceId || {};
                        
                        // Get device info
                        const serialNumber = vParams.getSerialNumber?._value || '-';
                        const status = device.Events?.Registered?._value ? '🟢 Online' : '🔴 Offline';
                        const deviceID = [
                            deviceInfo._OUI,
                            deviceInfo._ProductClass,
                            deviceInfo._SerialNumber
                        ].join('-');
                        
                        // Build message
                        message += `${index + 1}\\. *${this.escapeMarkdown(serialNumber)}*\n`;
                        message += `Device ID: \`${this.escapeMarkdown(deviceID || '-')}\`\n`;
                        message += `Manufacturer: \`${this.escapeMarkdown(deviceInfo._Manufacturer || '-')}\`\n`;
                        message += `OUI: \`${this.escapeMarkdown(deviceInfo._OUI || '-')}\`\n`;
                        message += `Model: \`${this.escapeMarkdown(deviceInfo._ProductClass || '-')}\`\n`;
                        message += `Mode: \`${this.escapeMarkdown(vParams.getponmode?._value || '-')}\`\n`;
                        message += `👤 Username: \`${this.escapeMarkdown(vParams.pppoeUsername?._value || '-')}\`\n`;
                        message += `📡 IP: \`${this.escapeMarkdown(vParams.pppoeIP?._value || '-')}\`\n`;
                        message += `📶 Signal: \`${this.escapeMarkdown(vParams.RXPower?._value || '-')} dBm\`\n`;
                        message += `⏱️ Device Uptime: \`${this.escapeMarkdown(vParams.getdeviceuptime?._value || '-')}\`\n`;
                        message += `⏱️ PPPoE Uptime: \`${this.escapeMarkdown(vParams.getpppuptime?._value || '-')}\`\n`;
                        message += `👥 Connected Users: \`${this.escapeMarkdown(vParams.activedevices?._value || '0')}\`\n`;
                        
                        // Quick Commands
                        message += `\n*Quick Commands:*\n`;
                        message += `\`/status ${vParams.pppoeUsername?._value || serialNumber}\` \\- Cek detail\n`;
                        message += `\`/wifi ${vParams.pppoeUsername?._value || serialNumber}\` \\- Cek WiFi\n`;
                        message += `\`/setwifi ${vParams.pppoeUsername?._value || serialNumber} WIFI\\-NAME\` \\- Ganti SSID\n`;
                        message += `\`/setpass ${vParams.pppoeUsername?._value || serialNumber} PASSWORD\` \\- Ganti Password\n`;
                        message += `\`/reboot ${vParams.pppoeUsername?._value || serialNumber}\` \\- Restart Device\n\n`;
                        message += `\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n`;
                    } catch (error) {
                        console.error(`[${Date.now()}] Error processing device ${index + 1}:`, error);
                        message += `${index + 1}\\. *Error processing device*\n`;
                    }
                });

                console.log(`[${Date.now()}] Sending message to ${chatId}`);
                await this.sendLongMessage(chatId, message, { parse_mode: 'MarkdownV2' });
            } catch (error) {
                console.error(`[${Date.now()}] Error processing /devices:`, error);
                await this.bot.sendMessage(chatId, 
                    '❌ Terjadi kesalahan saat mengambil data device\\.\n' +
                    'Silakan coba beberapa saat lagi\\.',
                    { parse_mode: 'MarkdownV2' }
                );
            }
        });

        // Tambahkan handler baru untuk mencari dan menambahkan pelanggan berdasarkan PPPoE username
        this.bot.onText(/\/finduser (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const username = match[1];
            try {
                console.log(`[${Date.now()}] Searching for user: ${username}`);
                const devices = await this.getDevicesFromGenieACS();
                
                let found = false;
                for (const device of devices) {
                    const virtualParams = device.VirtualParameters || {};
                    const igdParams = device.InternetGatewayDevice || {};
                    const pppConnection = igdParams.WANDevice?.['1']?.WANConnectionDevice?.['1']?.WANPPPConnection?.['1'];
                    
                    const pppoeUsername = virtualParams.pppoeUsername?._value || pppConnection?.Username?._value;
                    
                    if (pppoeUsername === username) {
                        found = true;
                        const deviceId = device.DeviceID || {};
                        const serialNumber = deviceId.SerialNumber?._value || deviceId.OUI?._value;
                        
                        const message = 
                            `✅ *Pengguna Ditemukan\\!*\n\n` +
                            `👤 Username: \`${username}\`\n` +
                            `📱 Serial Number: \`${serialNumber}\`\n\n` +
                            '*Quick Command untuk menambahkan:*\n' +
                            `\`/addcustomer {TELEGRAM\\_ID} {NAMA} ${serialNumber}\`\n\n` +
                            '❗ Ganti \\{TELEGRAM\\_ID\\} dengan ID dari /myid\n' +
                            '❗ Ganti \\{NAMA\\} dengan nama pelanggan';

                        await this.bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
                        break;
                    }
                }

                if (!found) {
                    await this.bot.sendMessage(chatId, 
                        '❌ Username tidak ditemukan di perangkat manapun\\.',
                        { parse_mode: 'MarkdownV2' }
                    );
                }
            } catch (error) {
                console.error(`[${Date.now()}] Error finding user:`, error);
                await this.bot.sendMessage(chatId, '❌ Gagal mencari pengguna');
            }
        });

        // Update handler /status untuk menggunakan VirtualParameters
        this.bot.onText(/\/status (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const searchTerm = match[1];
            console.log(`[${Date.now()}] Checking status for: ${searchTerm}`);

            try {
                const devices = await this.getDevicesFromGenieACS();
                let found = false;

                for (const device of devices) {
                    const vParams = device.VirtualParameters || {};
                    
                    // Cek berbagai kemungkinan match
                    const deviceMatches = 
                        vParams.getSerialNumber?._value === searchTerm ||
                        vParams.pppoeUsername?._value === searchTerm ||
                        vParams.pppoeUsername2?._value === searchTerm;

                    if (deviceMatches) {
                        found = true;
                        const status = device.Events?.Registered?._value ? '🟢 Online' : '🔴 Offline';

                        const message = 
                            `📱 *Informasi Device*\n\n` +
                            `*Device Info:*\n` +
                            `SN: \`${this.escapeMarkdown(vParams.getSerialNumber?._value || '-')}\`\n` +
                            `Mode: \`${this.escapeMarkdown(vParams.getponmode?._value || '-')}\`\n` +
                            `MAC PON: \`${this.escapeMarkdown(vParams.PonMac?._value || '-')}\`\n\n` +
                            
                            `*Status:*\n` +
                            `Status: ${status}\n` +
                            `Device Uptime: \`${this.escapeMarkdown(vParams.getdeviceuptime?._value || '-')}\`\n` +
                            `PPPoE Uptime: \`${this.escapeMarkdown(vParams.getpppuptime?._value || '-')}\`\n\n` +
                            
                            `*PPPoE:*\n` +
                            `Username: \`${this.escapeMarkdown(vParams.pppoeUsername?._value || '-')}\`\n` +
                            `IP: \`${this.escapeMarkdown(vParams.pppoeIP?._value || '-')}\`\n\n` +
                            
                            `*Signal:*\n` +
                            `RX Power: \`${this.escapeMarkdown(vParams.RXPower?._value || '-')} dBm\`\n` +
                            `Redaman: \`${this.escapeMarkdown(vParams.redaman?._value || '-')} dBm\`\n\n` +
                            
                            `*WiFi:*\n` +
                            `Connected Users: \`${this.escapeMarkdown(vParams.activedevices?._value || '0')}\`\n\n` +
                            
                            '*Quick Commands:*\n' +
                            `\`/wifi ${searchTerm}\` \\- Cek WiFi\n` +
                            `\`/setwifi ${searchTerm} WIFI\\-NAME\` \\- Ganti SSID\n` +
                            `\`/setpass ${searchTerm} PASSWORD\` \\- Ganti Password\n` +
                            `\`/reboot ${searchTerm}\` \\- Restart Device`;

                        const options = {
                            parse_mode: 'MarkdownV2',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '📡 WiFi', callback_data: `wifi:${searchTerm}` },
                                        { text: '👥 Users', callback_data: `users:${searchTerm}` }
                                    ],
                                    [
                                        { text: '📶 Signal', callback_data: `signal:${searchTerm}` },
                                        { text: '🔄 Reboot', callback_data: `reboot:${searchTerm}` }
                                    ]
                                ]
                            }
                        };
                        await this.bot.sendMessage(chatId, message, options);
                        break;
                    }
                }

                if (!found) {
                    await this.bot.sendMessage(chatId, 
                        '❌ Device tidak ditemukan\\. Gunakan:\n' +
                        '\\- Serial Number\n' +
                        '\\- PPPoE Username',
                        { parse_mode: 'MarkdownV2' }
                    );
                }
            } catch (error) {
                console.error(`[${Date.now()}] Error checking status:`, error);
                await this.bot.sendMessage(chatId, '❌ Gagal mengambil status device');
            }
        });

        // Handler untuk command /wifi
        this.bot.onText(/\/wifi (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const deviceId = match[1];
            try {
                const device = await this.getDeviceInfo(deviceId);
                if (!device) {
                    this.bot.sendMessage(chatId, '❌ Device tidak ditemukan');
                    return;
                }

                const wlan = device.InternetGatewayDevice?.LANDevice?.['1']?.WLANConfiguration?.['1'];
                const message = 
                    `📡 *WiFi Status*\n\n` +
                    `SSID: ${this.escapeMarkdown(wlan?.SSID?._value || '-')}\n` +
                    `Connected Users: ${this.escapeMarkdown(String(wlan?.TotalAssociations?._value || '0'))}\n` +
                    `Channel: ${this.escapeMarkdown(String(wlan?.Channel?._value || '-'))}\n` +
                    `Status: ${wlan?.Enable?._value ? 'Enabled' : 'Disabled'}\n`;

                this.bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
            } catch (error) {
                console.error(`[${this.name}] Error:`, error);
                this.bot.sendMessage(chatId, '❌ Gagal mengambil status WiFi');
            }
        });

        // Handler untuk command /setpass (SN/username tanpa spasi, pass di akhir)
        this.bot.onText(/\/setpass (\S+) (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const searchTerm = match[1];
            const newPassword = match[2];

            if (newPassword.length < 8) {
                this.bot.sendMessage(chatId, '❌ Password harus minimal 8 karakter');
                return;
            }
            
            try {
                await this.setWiFiPassword(searchTerm, newPassword);
                
                await this.bot.sendMessage(chatId, 
                    '✅ *Password WiFi berhasil diubah!*\n\n' +
                    `Password Baru: \`${this.escapeMarkdown(newPassword)}\`\n\n` +
                    '❗ Perangkat yang terhubung perlu reconnect',
                    { parse_mode: 'MarkdownV2' }
                );
            } catch (error) {
                console.error(`[${Date.now()}] Error in /setpass handler:`, error);
                await this.bot.sendMessage(chatId, '❌ Gagal mengubah password WiFi');
            }
        });

        // Handler untuk command /reboot
        this.bot.onText(/\/reboot (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const searchTerm = match[1];
            try {
                await this.rebootDevice(searchTerm);
                await this.bot.sendMessage(chatId, `✅ *Perintah reboot berhasil dikirim!*\n\nDevice: \`${this.escapeMarkdown(searchTerm)}\`\n\n❗ Perangkat akan segera restart`, { parse_mode: 'MarkdownV2' });
            } catch (error) {
                console.error(`[${Date.now()}] Error in /reboot handler:`, error);
                await this.bot.sendMessage(chatId, '❌ Gagal melakukan reboot device');
            }
        });

        // Handler untuk command /signal
        this.bot.onText(/\/signal (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const searchTerm = match[1];
            try {
                const device = await this.findDevice(searchTerm);
                if (!device) {
                    await this.bot.sendMessage(chatId, '❌ Device tidak ditemukan');
                    return;
                }
                
                const vParams = device.VirtualParameters || {};
                const rxPower = vParams.RXPower?._value || '-';
                const message = `📶 *Status Signal*\n\nDevice: \`${this.escapeMarkdown(searchTerm)}\`\nSignal RX: \`${this.escapeMarkdown(String(rxPower))} dBm\``;
                await this.bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
            } catch (error) {
                console.error(`[${Date.now()}] Error in /signal handler:`, error);
                await this.bot.sendMessage(chatId, '❌ Gagal mengambil status signal');
            }
        });

        // Handler untuk command /users
        this.bot.onText(/\/users (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const searchTerm = match[1];
            try {
                const device = await this.findDevice(searchTerm);
                if (!device) {
                    await this.bot.sendMessage(chatId, '❌ Device tidak ditemukan');
                    return;
                }
                
                const vParams = device.VirtualParameters || {};
                const activeDevices = vParams.activedevices?._value || '0';
                const message = `👥 *User Terhubung*\n\nDevice: \`${this.escapeMarkdown(searchTerm)}\`\nJumlah User Aktif: \`${this.escapeMarkdown(String(activeDevices))}\``;
                await this.bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
            } catch (error) {
                console.error(`[${Date.now()}] Error in /users handler:`, error);
                await this.bot.sendMessage(chatId, '❌ Gagal mengambil data user terhubung');
            }
        });

        // Tambahkan handler untuk command /addwan
        this.bot.onText(/\/addwan (\S+) (\S+) (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const [_, deviceId, username, password] = match;
            try {
                await this.setWANCredentials(deviceId, username, password);
                this.bot.sendMessage(chatId, 
                    '✅ *WAN Credentials berhasil diatur\\!*\n\n' +
                    `Device: \`${deviceId}\`\n` +
                    `Username: \`${username}\`\n` +
                    `Password: \`${password}\``,
                    { parse_mode: 'MarkdownV2' }
                );
            } catch (error) {
                console.error(`[${this.name}] Error setting WAN credentials:`, error);
                this.bot.sendMessage(chatId, '❌ Gagal mengatur WAN credentials');
            }
        });

        // Tambahkan handler baru untuk command /addcustomer
        this.bot.onText(/\/addcustomer (\S+) "(.+?)" (\S+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const [_, telegramId, customerName, deviceSN] = match;
            try {
                // Verifikasi device exists
                const device = await this.getDeviceInfo(deviceSN);
                if (!device) {
                    this.bot.sendMessage(chatId, '❌ Device tidak ditemukan');
                    return;
                }

                // Tambahkan customer baru
                if (!this.config.customers) {
                    this.config.customers = {};
                }

                this.config.customers[telegramId] = {
                    name: customerName,
                    deviceSN: deviceSN,
                    allowedCommands: ["wifi-status", "wifi-password"]
                };

                // Simpan ke file config
                await this.saveConfig();

                this.bot.sendMessage(chatId, 
                    '✅ *Pelanggan berhasil ditambahkan\\!*\n\n' +
                    `Nama: \`${customerName}\`\n` +
                    `Telegram ID: \`${telegramId}\`\n` +
                    `Device SN: \`${deviceSN}\`\n\n` +
                    '*Quick Commands untuk pelanggan ini:*\n' +
                    `\`/delcustomer ${telegramId}\` \\- Hapus pelanggan\n` +
                    `\`/status ${deviceSN}\` \\- Cek status device`,
                    { parse_mode: 'MarkdownV2' }
                );

                // Kirim pesan selamat datang ke pelanggan baru
                try {
                    await this.bot.sendMessage(telegramId, 
                        `✅ *Selamat datang di ${this.name}\\!*\n\n` +
                        `Halo ${customerName}\\, akun Anda telah didaftarkan\\.\n\n` +
                        '📱 *Perintah yang tersedia:*\n' +
                        '/mystatus \\- Cek status perangkat\n' +
                        '/mywifi \\- Cek status WiFi\n' +
                        '/changepass \\{PASSWORD\\} \\- Ganti password WiFi\n\n' +
                        '❗ Password WiFi minimal 8 karakter\n' +
                        '❗ Gunakan kombinasi huruf dan angka',
                        { parse_mode: 'MarkdownV2' }
                    );
                } catch (error) {
                    this.bot.sendMessage(chatId, 
                        '⚠️ *Peringatan\\:* Pelanggan berhasil ditambahkan tapi gagal mengirim pesan selamat datang\\. ' +
                        'Pastikan pelanggan sudah memulai chat dengan bot\\.',
                        { parse_mode: 'MarkdownV2' }
                    );
                }
            } catch (error) {
                console.error(`[${this.name}] Error adding customer:`, error);
                this.bot.sendMessage(chatId, '❌ Gagal menambahkan pelanggan');
            }
        });

        // Tambahkan handler untuk menghapus pelanggan
        this.bot.onText(/\/delcustomer (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            const telegramId = match[1];
            try {
                const customer = this.config.customers?.[telegramId];
                if (!customer) {
                    this.bot.sendMessage(chatId, '❌ Pelanggan tidak ditemukan');
                    return;
                }

                // Hapus customer
                delete this.config.customers[telegramId];
                await this.saveConfig();

                this.bot.sendMessage(chatId, 
                    '✅ *Pelanggan berhasil dihapus\\!*\n\n' +
                    `Nama: \`${customer.name}\`\n` +
                    `Telegram ID: \`${telegramId}\`\n` +
                    `Device SN: \`${customer.deviceSN}\``,
                    { parse_mode: 'MarkdownV2' }
                );

                // Kirim notifikasi ke pelanggan
                try {
                    await this.bot.sendMessage(telegramId, 
                        '⚠️ *Pemberitahuan*\n\n' +
                        'Akun Anda telah dinonaktifkan\\. ' +
                        'Silakan hubungi admin untuk informasi lebih lanjut\\.',
                        { parse_mode: 'MarkdownV2' }
                    );
                } catch (error) {
                    // Ignore error sending message to customer
                }
            } catch (error) {
                console.error(`[${this.name}] Error deleting customer:`, error);
                this.bot.sendMessage(chatId, '❌ Gagal menghapus pelanggan');
            }
        });

        // Tambahkan handler untuk melihat daftar pelanggan
        this.bot.onText(/\/customers/, async (msg) => {
            const chatId = msg.chat.id;
            if (!this.config.adminIds.includes(chatId.toString())) return;

            try {
                const customers = this.config.customers || {};
                let message = '👥 *Daftar Pelanggan*\n\n';
                
                Object.entries(customers).forEach(([telegramId, customer], index) => {
                    message += `${index + 1}\\. *${customer.name}*\n`;
                    message += `📱 Telegram ID: \`${telegramId}\`\n`;
                    message += `📶 Device SN: \`${customer.deviceSN}\`\n\n`;
                    message += '*Quick Commands:*\n';
                    message += `\`/status ${customer.deviceSN}\` \\- Cek status\n`;
                    message += `\`/delcustomer ${telegramId}\` \\- Hapus pelanggan\n`;
                    message += '\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n';
                });

                if (Object.keys(customers).length === 0) {
                    message += 'Belum ada pelanggan terdaftar\\.\n\n';
                }

                message += '*Cara Menambah Pelanggan Baru:*\n';
                message += '1\\. Minta pelanggan kirim /myid ke bot\n';
                message += '2\\. Gunakan format berikut:\n';
                message += '`/addcustomer {ID_TELEGRAM} {NAMA} {DEVICE_SN}`\n\n';
                message += '❗ Contoh: `/addcustomer 123456789 "John Doe" ZTEGC8F12345`\n';
                
                await this.sendLongMessage(chatId, message, { parse_mode: 'MarkdownV2' });
            } catch (error) {
                console.error(`[${this.name}] Error listing customers:`, error);
                this.bot.sendMessage(chatId, '❌ Gagal mengambil daftar pelanggan');
            }
        });

        // Handler untuk menangkap klik tombol Interactive Menu (Inline Keyboard)
        this.bot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const data = query.data;

            // Beri tahu Telegram bahwa klik sudah diterima
            this.bot.answerCallbackQuery(query.id).catch(() => {});

            // Cek otorisasi
            const isAdmin = this.config.adminIds.includes(chatId.toString());
            const customer = this.config.customers?.[chatId.toString()];
            if (!isAdmin && !customer) return;

            const parts = data.split(':');
            if (parts.length < 2) return;
            const action = parts[0];
            const searchTerm = parts[1];

            // Jika dia pelanggan, batasi tindakan selain device miliknya sendiri
            if (!isAdmin && customer && searchTerm !== customer.deviceSN) return;

            try {
                if (action === 'wifi') {
                    const device = await this.getDeviceInfo(searchTerm);
                    if (!device) return this.bot.sendMessage(chatId, '❌ Device tidak ditemukan');
                    const wlan = device.InternetGatewayDevice?.LANDevice?.['1']?.WLANConfiguration?.['1'];
                    const message = 
                        `📡 *WiFi Status*\n\n` +
                        `SSID: ${this.escapeMarkdown(wlan?.SSID?._value || '-')}\n` +
                        `Connected Users: ${this.escapeMarkdown(String(wlan?.TotalAssociations?._value || '0'))}\n` +
                        `Status: ${wlan?.Enable?._value ? 'Enabled' : 'Disabled'}\n`;
                    await this.bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
                } 
                else if (action === 'reboot' && isAdmin) {
                    await this.bot.sendMessage(chatId, `⏳ *Rebooting ${this.escapeMarkdown(searchTerm)}...*`, { parse_mode: 'MarkdownV2' });
                    await this.rebootDevice(searchTerm);
                    await this.bot.sendMessage(chatId, '✅ *Perintah sukses dikirim*', { parse_mode: 'MarkdownV2' });
                }
                else if (action === 'users' && isAdmin) {
                    const device = await this.findDevice(searchTerm);
                    if (!device) return this.bot.sendMessage(chatId, '❌ Device tidak ditemukan');
                    const vParams = device.VirtualParameters || {};
                    const activeDevices = vParams.activedevices?._value || '0';
                    await this.bot.sendMessage(chatId, `👥 *User*: \`${this.escapeMarkdown(String(activeDevices))}\``, { parse_mode: 'MarkdownV2' });
                }
                else if (action === 'signal' && isAdmin) {
                    const device = await this.findDevice(searchTerm);
                    if (!device) return this.bot.sendMessage(chatId, '❌ Device tidak ditemukan');
                    const rxPower = device.VirtualParameters?.RXPower?._value || '-';
                    await this.bot.sendMessage(chatId, `📶 *Signal RX*: \`${this.escapeMarkdown(String(rxPower))} dBm\``, { parse_mode: 'MarkdownV2' });
                }
            } catch (error) {
                console.error(`[${this.name}] Callback Error:`, error);
                this.bot.sendMessage(chatId, `❌ Gagal memproses ${action}`);
            }
        });

        // Error handler
        this.bot.on('polling_error', (error) => {
            console.error(`[${Date.now()}] Polling error:`, error.message);
            if (error.code === 'ETELEGRAM') {
                console.error(`[${Date.now()}] Telegram API Error:`, error.response.body);
            }
        });
    }

    async getDevicesFromGenieACS() {
        console.log(`[${Date.now()}] Getting devices from GenieACS...`);
        try {
            const url = `${this.config.genieacs.baseUrl}/devices`;
            console.log(`[${Date.now()}] Requesting URL: ${url}`);
            console.log(`[${Date.now()}] Auth: ${this.config.genieacs.username}:${this.config.genieacs.password}`);
            
            const response = await axios.get(url, {
                auth: {
                    username: this.config.genieacs.username,
                    password: this.config.genieacs.password
                }
            });

            console.log(`[${Date.now()}] Got response from GenieACS`);
            console.log(`[${Date.now()}] Status: ${response.status}`);
            console.log(`[${Date.now()}] Number of devices: ${response.data.length}`);
            
            if (response.data.length > 0) {
                console.log(`[${Date.now()}] First device:`, JSON.stringify(response.data[0], null, 2));
            }

            return response.data;
        } catch (error) {
            console.error(`[${Date.now()}] Error getting devices:`, error.message);
            if (error.response) {
                console.error(`[${Date.now()}] Response status:`, error.response.status);
                console.error(`[${Date.now()}] Response data:`, error.response.data);
            } else if (error.request) {
                console.error(`[${Date.now()}] No response received:`, error.request);
            } else {
                console.error(`[${Date.now()}] Error setting up request:`, error.message);
            }
            throw error;
        }
    }

    async findDevice(searchTerm) {
        const devices = await this.getDevicesFromGenieACS();
        for (const device of devices) {
            const vParams = device.VirtualParameters || {};
            const deviceInfo = device._deviceId || {};
            
            if (vParams.pppoeUsername?._value === searchTerm ||
                vParams.pppoeUsername2?._value === searchTerm ||
                vParams.getSerialNumber?._value === searchTerm ||
                deviceInfo._SerialNumber === searchTerm ||
                device._id === searchTerm) {
                return device;
            }
        }
        return null;
    }

    async getDeviceInfo(searchTerm) {
        try {
            const device = await this.findDevice(searchTerm);
            return device;
        } catch (error) {
            console.error(`[${this.name}] Error getting device info:`, error);
            throw error;
        }
    }

    async rebootDevice(searchTerm) {
        try {
            const device = await this.findDevice(searchTerm);
            if (!device) throw new Error('Device not found');
            
            const response = await axios.post(
                `${this.config.genieacs.baseUrl}/devices/${encodeURIComponent(device._id)}/tasks?connection_request`,
                {
                    name: 'reboot',
                    device: device._id
                },
                {
                    auth: {
                        username: this.config.genieacs.username,
                        password: this.config.genieacs.password
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error(`[${this.name}] Error rebooting device:`, error);
            throw error;
        }
    }

    async setWiFiPassword(searchTerm, password) {
        try {
            const device = await this.findDevice(searchTerm);
            if (!device) throw new Error('Device not found');
            
            const response = await axios.post(
                `${this.config.genieacs.baseUrl}/devices/${encodeURIComponent(device._id)}/tasks?connection_request`,
                {
                    name: 'setParameterValues',
                    parameterValues: [
                        ['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase', password, 'xsd:string'],
                        ['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.PreSharedKey', password, 'xsd:string']
                    ]
                },
                {
                    auth: {
                        username: this.config.genieacs.username,
                        password: this.config.genieacs.password
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error(`[${this.name}] Error setting WiFi password:`, error);
            throw error;
        }
    }

    async setWANCredentials(searchTerm, username, password) {
        try {
            const device = await this.findDevice(searchTerm);
            if (!device) throw new Error('Device not found');
            
            const response = await axios.post(
                `${this.config.genieacs.baseUrl}/devices/${encodeURIComponent(device._id)}/tasks?connection_request`,
                {
                    name: 'setParameterValues',
                    parameterValues: [
                        ['InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username', username, 'xsd:string'],
                        ['InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Password', password, 'xsd:string']
                    ]
                },
                {
                    auth: {
                        username: this.config.genieacs.username,
                        password: this.config.genieacs.password
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error(`[${this.name}] Error setting WAN credentials:`, error);
            throw error;
        }
    }

    async setWiFiSSID(searchTerm, ssid) {
        try {
            const device = await this.findDevice(searchTerm);
            if (!device) throw new Error('Device not found');
            
            const response = await axios.post(
                `${this.config.genieacs.baseUrl}/devices/${encodeURIComponent(device._id)}/tasks?connection_request`,
                {
                    name: "setParameterValues",
                    parameterValues: [
                        ["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", ssid, "xsd:string"]
                    ]
                },
                {
                    auth: {
                        username: this.config.genieacs.username,
                        password: this.config.genieacs.password
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`[${Date.now()}] Response:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`[${Date.now()}] Error setting WiFi SSID:`, error);
            if (error.response) {
                console.error(`[${Date.now()}] Full error response:`, {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers,
                    config: {
                        url: error.response.config.url,
                        method: error.response.config.method,
                        data: error.response.config.data
                    }
                });
            }
            throw error;
        }
    }


    // Tambahkan method untuk menyimpan konfigurasi
    async saveConfig() {
        try {
            const fs = require('fs').promises;
            const configPath = './config.js';
            delete require.cache[require.resolve('./config.js')];
            const currentConfig = require('./config.js');
            
            if (this.config.serverId && currentConfig.servers[this.config.serverId]) {
                currentConfig.servers[this.config.serverId] = this.config;
                const configContent = `module.exports = ${JSON.stringify(currentConfig, null, 4)};\n`;
                await fs.writeFile(configPath, configContent);
            } else {
                console.warn(`[${this.name}] Server ID tidak ditemukan saat menyimpan konfigurasi, konfigurasi diskip untuk keamanan.`);
            }
        } catch (error) {
            console.error(`[${this.name}] Error saving config:`, error);
            throw error;
        }
    }

    // Tambahkan method helper untuk memecah pesan panjang
    async sendLongMessage(chatId, message, options = {}) {
        const MAX_LENGTH = 4000; // Sedikit di bawah batas 4096 untuk jaga-jaga
        
        if (message.length <= MAX_LENGTH) {
            return await this.bot.sendMessage(chatId, message, options);
        }

        // Pecah pesan berdasarkan baris
        const parts = message.split('\n');
        let currentMessage = '';

        for (const part of parts) {
            if ((currentMessage + part + '\n').length > MAX_LENGTH) {
                // Kirim bagian pesan saat ini
                if (currentMessage) {
                    await this.bot.sendMessage(chatId, currentMessage, options);
                }
                currentMessage = part + '\n';
            } else {
                currentMessage += part + '\n';
            }
        }

        // Kirim sisa pesan terakhir
        if (currentMessage) {
            await this.bot.sendMessage(chatId, currentMessage, options);
        }
    }
}

module.exports = GenieACSBot; 
