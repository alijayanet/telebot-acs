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

- Node.js v12 atau lebih baru
- Server GenieACS yang sudah terkonfigurasi
- Token Bot Telegram


## 🚀 Instalasi
```
apt install git curl -y
```

1. Clone repository ini
```
git clone https://github.com/alijayanet/telebot-acs
```
3. Masuk ke direktori project
   ```
   cd telebot-acs
   ```
4. Install dependensi
   ```
   npm install
   ```
6. Jalankan bot
   ```
   node index.js
   ```
   sebelum di jalankan edit configurasinya dulu
   
## ⚙️ Konfigurasi

1. edit file `config.js` dengan format berikut:

2. Ganti nilai-nilai berikut:
   - `botToken`: Token bot Telegram dari BotFather
   - `adminIds`: Array berisi ID Telegram admin
   - `genieacs.baseUrl`: URL server GenieACS
   - `genieacs.username`: Username GenieACS
   - `genieacs.password`: Password GenieACS


### 📱 Cara Penggunaan

### Untuk Admin

1. Start bot dengan mengirim `/start`
2. Gunakan `/devices` untuk melihat semua perangkat
3. Untuk menambah pelanggan:
   - Minta pelanggan mengirim `/myid`
   - Gunakan `/addcustomer {ID_TELEGRAM} {NAMA} {DEVICE_SN}`
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
- Hanya admin yang dapat mengakses fitur administratif
- Pelanggan hanya dapat mengakses perangkat yang terdaftar untuk mereka
- Password dan kredensial sensitif disimpan dengan aman

## 🤝 Kontribusi

Kontribusi selalu diterima! Silakan buat pull request atau laporkan issue jika menemukan bug.

## 📄 Lisensi

Project ini dilisensikan di bawah [MIT License](LICENSE).

## ⚠️ Disclaimer

Bot ini adalah alat bantu untuk mengelola perangkat
