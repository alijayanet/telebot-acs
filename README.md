# Bot GenieACS Telegram

Bot Telegram untuk mengelola dan memantau perangkat GenieACS dengan mudah. Bot ini memungkinkan admin dan pelanggan untuk mengakses informasi perangkat dan melakukan konfigurasi dasar melalui Telegram.

## 🚀 Fitur

### Fitur Admin
- Melihat daftar semua perangkat (`/devices`)
- Mengelola pelanggan (`/customers`, `/addcustomer`, `/delcustomer`)
- Mencari pengguna berdasarkan username PPPoE (`/finduser`)
- Memeriksa status perangkat (`/status`)
- Mengatur konfigurasi WiFi (`/setwifi`, `/setpass`)
- Mengatur kredensial WAN (`/addwan`)
- Me-reboot perangkat (`/reboot`)

### Fitur Pelanggan
- Memeriksa status perangkat (`/mystatus`)
- Memeriksa status WiFi (`/mywifi`)
- Mengubah password WiFi (`/changepass`)
- Mendapatkan ID Telegram (`/myid`)

## 📋 Prasyarat

- Node.js v14 atau lebih baru
- Server GenieACS yang sudah terkonfigurasi
- Token Bot Telegram (dari @BotFather)

## 🚀 Instalasi

1. **Clone repository ini**
   ```bash
   git clone https://github.com/alijayanet/telebot-acs
   cd telebot-acs
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka dan edit file `.env` menggunakan teks editor (misal: `nano .env`):
   ```env
   SERVER1_NAME=ALIJAYA-NET
   SERVER1_BOT_TOKEN=1938127147:AAFMcxxxxxxxx
   SERVER1_ADMIN_IDS=56785xxxxxx
   SERVER1_GENIEACS_URL=http://192.168.8.xx:7557
   SERVER1_GENIEACS_USER=admin
   SERVER1_GENIEACS_PASS=admin
   ```
   *(Atau Anda juga dapat menyesuaikan konfigurasi multi-server langsung di file `config.js`)*

4. **Jalankan Bot**
   ```bash
   npm start
   ```

## ⚙️ Menjalankan di Background (PM2)

Agar bot tetap berjalan di background saat koneksi SSH/Putty ditutup, gunakan **PM2**:

1. Install PM2 secara global:
   ```bash
   npm install pm2 -g
   ```
2. Jalankan bot dengan PM2:
   ```bash
   pm2 start index.js --name "genieacs-bot"
   ```
3. Menyimpan status autostart PM2:
   ```bash
   pm2 save
   pm2 startup
   ```

## 📱 Cara Penggunaan

### Untuk Admin

1. Start bot dengan mengirim `/start`
2. Gunakan `/devices` untuk melihat semua perangkat
3. Untuk menambah pelanggan:
   - Minta pelanggan mengirim `/myid`
   - Gunakan `/addcustomer {ID_TELEGRAM} "NAMA" {DEVICE_SN}`
   - Contoh: `/addcustomer 123456789 "John Doe" ZTEGC8F12345`

### Untuk Pelanggan

1. Start bot dengan mengirim `/start`
2. Kirim `/myid` dan berikan ID ke admin
3. Setelah didaftarkan, gunakan:
   - `/mystatus` untuk cek status perangkat
   - `/mywifi` untuk cek status WiFi
   - `/changepass {PASSWORD}` untuk ganti password WiFi

## 🔒 Keamanan

- Bot menggunakan sistem autentikasi berbasis ID Telegram
- Data pelanggan disimpan terisolasi di `data/customers.json`
- Hanya admin yang dapat mengakses fitur administratif
- Kredensial sensitif dikonfigurasi melalui `.env` atau `config.js` tanpa terekspos di log

## 🤝 Kontribusi & Komunitas

Kontribusi selalu diterima! Silakan buat pull request atau laporkan issue jika menemukan bug.

- 💬 WhatsApp: https://wa.me/6281947215703
- 💬 Group Telegram: https://t.me/alijayaNetAcs

## 📄 Lisensi

Project ini dilisensikan di bawah [MIT License](LICENSE).
