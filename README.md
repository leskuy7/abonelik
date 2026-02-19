# Abonelik Takip Sistemi (SubTrack)

Kişisel aboneliklerinizi yönetmek, ödemeleri takip etmek ve harcamalarınızı kontrol altında tutmak için geliştirilmiş modern bir web uygulamasıdır.

## Başlatma Talimatları

Projeyi çalıştırmak için hem Frontend hem Backend sunucularının aynı anda çalışması gerekmektedir. İki ayrı terminal penceresi kullanın.

### 1. Backend (Sunucu)
API servislerini ve veritabanı bağlantısını sağlar.

```powershell
cd backend
npm install  # İlk kurulumda
node server.js
```
Backend **http://localhost:5000** adresinde çalışacaktır.

### 2. Frontend (Arayüz)
Kullanıcı arayüzünü sağlar.

```powershell
cd frontend
npm install  # İlk kurulumda
npm run dev
```
Frontend **http://localhost:3000** (veya 3001) adresinde çalışacaktır.

## Test Kullanıcısı
Geliştirme ortamında seed kullanmak isterseniz `backend/prisma/seed.js` dosyası sadece dev ortamında çalışır. Gerekli ortam değişkenleri:
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`

## Notlar
- **PWA (Progressive Web App):** Uygulama telefonunuza yüklenebilir özelliktedir. Geliştirme ortamında (`npm run dev`) PWA özellikleri bazen hata verebilir, bu durumda production build (`npm run build && npm start`) kullanılması önerilir.
- **CORS:** Geliştirme ortamında `localhost:3000` ve `localhost:3001` portlarına izin verilmiştir.

## Teknoloji Yığını
- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express 5, Prisma (PostgreSQL), web-push, node-cron
