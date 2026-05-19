# 🧛 Vampir Köylü — Kurulum Rehberi

Yazılım bilgin olmasa da bu adımları takip edersen uygulama çalışır!
Toplam süre: yaklaşık **20-30 dakika**

---

## ADIM 1 — Firebase Kurulumu (ücretsiz veritabanı)

### 1.1 Firebase hesabı oluştur
1. https://firebase.google.com adresine git
2. Sağ üstteki **"Get started"** butonuna tıkla
3. Google hesabınla giriş yap

### 1.2 Yeni proje oluştur
1. **"Create a project"** tıkla
2. Proje adı: `vampir-koylu` yaz
3. Google Analytics: **Disable** et (gerek yok)
4. **"Create project"** tıkla

### 1.3 Realtime Database oluştur
1. Sol menüde **"Build"** → **"Realtime Database"** tıkla
2. **"Create Database"** tıkla
3. Konum: **United States** seç (ücretsiz)
4. Güvenlik kuralları: **"Start in test mode"** seç → **"Enable"** tıkla

### 1.4 Güvenlik kurallarını güncelle
1. Realtime Database sayfasında **"Rules"** sekmesine tıkla
2. Şu kodu yapıştır:
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```
3. **"Publish"** tıkla

### 1.5 Web app ekle ve config al
1. Sol üstteki ⚙️ (Project Settings) tıkla
2. Aşağı kaydır, **"</> Web"** ikonuna tıkla
3. App nickname: `vampir-koylu` yaz → **"Register app"** tıkla
4. Sana şöyle bir kod verecek:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "vampir-koylu-xxx.firebaseapp.com",
  databaseURL: "https://vampir-koylu-xxx-default-rtdb.firebaseio.com",
  projectId: "vampir-koylu-xxx",
  storageBucket: "vampir-koylu-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
}
```
5. **Bu bilgileri bir yere kopyala!**

---

## ADIM 2 — Kodu Güncelle

`src/firebase.js` dosyasını aç ve `firebaseConfig` içindeki değerleri kendi bilgilerinle değiştir:

```javascript
const firebaseConfig = {
  apiKey: "BURAYA_KENDI_API_KEY",
  authDomain: "BURAYA_KENDI_AUTH_DOMAIN",
  databaseURL: "BURAYA_KENDI_DATABASE_URL",
  projectId: "BURAYA_KENDI_PROJECT_ID",
  storageBucket: "BURAYA_KENDI_STORAGE_BUCKET",
  messagingSenderId: "BURAYA_KENDI_SENDER_ID",
  appId: "BURAYA_KENDI_APP_ID"
}
```

---

## ADIM 3 — GitHub'a Yükle (ücretsiz)

### 3.1 GitHub hesabı oluştur
1. https://github.com adresine git
2. **"Sign up"** tıkla ve ücretsiz hesap oluştur

### 3.2 Yeni repository oluştur
1. Giriş yaptıktan sonra sağ üstteki **"+"** → **"New repository"** tıkla
2. Repository adı: `vampir-koylu`
3. **"Public"** seç (ücretsiz hosting için)
4. **"Create repository"** tıkla

### 3.3 Dosyaları yükle
1. Repository sayfasında **"uploading an existing file"** linkine tıkla
2. Tüm proje dosyalarını (klasörlerle birlikte) sürükle bırak
3. **"Commit changes"** tıkla

---

## ADIM 4 — Vercel'e Deploy Et (ücretsiz)

### 4.1 Vercel hesabı oluştur
1. https://vercel.com adresine git
2. **"Sign Up"** → **"Continue with GitHub"** tıkla

### 4.2 Projeyi deploy et
1. **"Add New..."** → **"Project"** tıkla
2. GitHub repon listede görünecek, **"Import"** tıkla
3. Framework Preset: **Vite** seç
4. **"Deploy"** tıkla
5. 2-3 dakika bekle

### 4.3 Linkini al
Deploy tamamlanınca sana bir link verecek:
```
https://vampir-koylu-xxx.vercel.app
```

Bu link senin uygulamanın adresi! Arkadaşlarınla paylaş.

---

## ADIM 5 — Telefona Kur (Ana Ekrana Ekle)

### Android (Chrome):
1. Linki Chrome'da aç
2. Sağ üst köşedeki 3 nokta menüsü → **"Ana ekrana ekle"**
3. **"Ekle"** tıkla
4. Artık telefonda uygulama ikonu var! 🎉

### iPhone (Safari):
1. Linki Safari'de aç
2. Alt ortadaki paylaş butonu (kare + ok)
3. **"Ana Ekrana Ekle"**
4. **"Ekle"** tıkla

---

## Nasıl Oynanır?

1. **Admin** uygulamayı açar → "Oda Oluştur" → adını girer
2. Oda kodu oluşur (örn: `XKQR2`), arkadaşlarına verir
3. **Arkadaşlar** "Odaya Katıl" → kodu girer → katılır
4. **Admin** rol sayılarını ayarlar (vampir, doktor sayısı)
5. **Admin** "Oyunu Başlat" tıklar
6. Herkes rolünü gizlice görür → "Hazırım" der
7. Oyun başlar!

---

## Sorun Yaşarsan

- Firebase bağlantı hatası → `src/firebase.js` içindeki bilgileri kontrol et
- Sayfa açılmıyor → Vercel deployment'ı kontrol et
- Oyun takılı kaldı → Sayfayı yenile

---

İyi oyunlar! 🧛👨‍🌾
