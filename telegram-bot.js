const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const config = require('./config');

// Mengambil konfigurasi dari config.js
const token = config.BOT_TOKEN;
const ADMIN_IDS = config.ADMIN_IDS;
const GENIEACS_CONFIG = config.GENIEACS;

const bot = new TelegramBot(token, {polling: true});

// Handler untuk command /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!ADMIN_IDS.includes(chatId.toString())) {
        bot.sendMessage(chatId, '⛔ Maaf, Anda tidak memiliki akses ke bot ini');
        return;
    }
    
    bot.sendMessage(chatId, 
        '🏢 *ALIJAYA\\-NET Monitoring Bot*\n\n' +
        'Perintah yang tersedia:\n' +
        '/devices \\- Lihat daftar device\n' +
        '/status \\{SN\\} \\- Cek status device\n' +
        '/signal \\{SN\\} \\- Cek signal device\n' +
        '/reboot \\{SN\\} \\- Reboot device\n' +
        '/wifi \\{SN\\} \\- Cek status WiFi\n' +
        '/users \\{SN\\} \\- Cek user terhubung\n',
        { parse_mode: 'MarkdownV2' }
    );
});

// Handler untuk command /devices
bot.onText(/\/devices/, async (msg) => {
    const chatId = msg.chat.id;
    if (!ADMIN_IDS.includes(chatId.toString())) return;

    try {
        const devices = await getDevicesFromGenieACS();
        let message = '📱 *Daftar Device*\n\n';
        
        devices.forEach((device, index) => {
            message += `${index + 1}\\. *${device.DeviceID?.SerialNumber || device._id}*\n`;
            message += `📍 Lokasi: ${device.InternetGatewayDevice?.DeviceInfo?.ProvisioningCode?._value || '-'}\n`;
            message += `👤 Pelanggan: ${device.InternetGatewayDevice?.DeviceInfo?.Description?._value || '-'}\n`;
            message += `📶 Signal: ${device.InternetGatewayDevice?.WANDevice?.['1']?.WANConnectionDevice?.['1']?.WANIPConnection?.['1']?.Stats?.SignalStrength?._value || '-'} dBm\n\n`;
        });

        bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, '❌ Gagal mengambil data device');
    }
});

// Handler untuk command /status
bot.onText(/\/status (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!ADMIN_IDS.includes(chatId.toString())) return;

    const deviceId = match[1];
    try {
        const device = await getDeviceInfo(deviceId);
        if (!device) {
            bot.sendMessage(chatId, '❌ Device tidak ditemukan');
            return;
        }

        const isOnline =
            (device.Events?.Registered?._value) ||
            (device.VirtualParameters?.pppoeIP?._value && device.VirtualParameters.pppoeIP._value !== '-') ||
            (device.VirtualParameters?.getdeviceuptime?._value && device.VirtualParameters.getdeviceuptime._value !== '0');
        const status = isOnline ? '🟢 Online' : '🔴 Offline';

        const message = 
            `📱 *Status Device*\n\n` +
            `Status: ${status}\n` +
            `ID: ${device._id}\n` +
            `Model: ${device.DeviceID?.ProductClass || '-'}\n` +
            `Signal: ${device.VirtualParameters?.RXPower?._value || '-'} dBm\n` +
            `Temperature: ${device.VirtualParameters?.gettemp?._value || '-'}°C\n` +
            `Uptime: ${device.VirtualParameters?.getdeviceuptime?._value || '-'}\n` +
            `Connected Users: ${device.VirtualParameters?.userconnected?._value || '0'}\n`;

        bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
    } catch (error) {
        bot.sendMessage(chatId, '❌ Gagal mengambil status device');
    }
});

// Fungsi untuk mengambil data dari GenieACS API
async function getDevicesFromGenieACS() {
    try {
        const response = await axios.get(`${GENIEACS_CONFIG.baseUrl}/devices`, {
            auth: {
                username: GENIEACS_CONFIG.username,
                password: GENIEACS_CONFIG.password
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting devices:', error);
        throw error;
    }
}

// Fungsi untuk mengambil info device spesifik
async function getDeviceInfo(deviceId) {
    try {
        const response = await axios.get(`${GENIEACS_CONFIG.baseUrl}/devices/${deviceId}`, {
            auth: {
                username: GENIEACS_CONFIG.username,
                password: GENIEACS_CONFIG.password
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting device info:', error);
        throw error;
    }
}

// Fungsi untuk reboot device
async function rebootDevice(deviceId) {
    try {
        const response = await axios.post(
            `${GENIEACS_CONFIG.baseUrl}/devices/${deviceId}/tasks`,
            {
                name: 'reboot',
                device: deviceId
            },
            {
                auth: {
                    username: GENIEACS_CONFIG.username,
                    password: GENIEACS_CONFIG.password
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error rebooting device:', error);
        throw error;
    }
}

// Error handler
bot.on('polling_error', (error) => {
    console.log(error);
});

console.log('Telegram bot started...'); 