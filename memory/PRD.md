# Cari Hesap Takip - PRD

## Overview
Tamamen offline (internet bağlantısı gerektirmeyen) çalışan, Türkçe arayüze sahip mobil cari hesap takip uygulaması. React Native Expo (SDK 54) ile geliştirildi; Android ve iOS cihazlarda native kurulum dosyası (APK/IPA) olarak dağıtılabilir.

## Hedef Kullanıcı
Tedarikçi/müşteri ilişkilerini, banka hesaplarını ve kredi kartlarını tek bir yerden takip etmek isteyen küçük işletme sahipleri ve bireysel kullanıcılar.

## Mimari
- **Frontend**: Expo Router 6 + React Native 0.81 + TypeScript
- **State**: React Context + useReducer benzeri pattern
- **Storage**: 100% local — Web'de localStorage, Native'de @react-native-async-storage
- **Backend**: Yok (uygulama tamamen istemci tarafında çalışır)

## Özellikler

### 1. Dashboard (Özet)
- Net Pozisyon kartı (Banka Varlık − Şirket Borç − Kart Borcu)
- 4 metrik bento grid: Şirket Borç, Banka Varlık, Kart Borcu, Toplam Limit
- Yaklaşan Hesap Kesimleri (5 günden az kalanlar sarı uyarı)
- Ödenmemiş Şirketler listesi (en yüksek borçtan başlayarak)
- Kart Bazlı Borçlar (her kart için kullanım çubuğu, %80+ kırmızı)

### 2. Cari Hesaplar
- Tedarikçi / Müşteri olarak sınıflandırma
- Açılış bakiyesi (+ borç, − alacak)
- İşlemler:
  - **Yeni Alış** → şirket borcu artar
  - **Elden Ödeme** → şirket borcu azalır
  - **Kart ile Ödeme** → şirket borcu azalır + seçilen kredi kartının kullanımı artar (gerçek hayat akışıyla aynı)

### 3. Kredi Kartları
- Görsel kart tasarımı (her kart farklı renk paleti, kalan limit + harcama çubuğu)
- Limit, mevcut borç, hesap kesim günü, son ödeme gün farkı
- İşlemler:
  - **Bireysel Harcama** → kart kullanımı artar
  - **Bankadan Öde** → banka bakiyesi azalır + kart borcu azalır
- Bir sonraki hesap kesim tarihi ve son ödeme tarihi gösterimi
- 5 gün kala otomatik sarı uyarı

### 4. Banka Hesapları
- Hesap adı, hesap türü (vadesiz vb), bakiye
- Para Ekle / Para Çek işlemleri
- Toplam varlık header'da görünür

### 5. Ödemeler / Hareket Geçmişi
- Tüm işlemler kronolojik listelenir
- Her işlem türü için renkli ikon (alış kırmızı, ödeme yeşil)
- İlişkili şirket/kart/banka bilgisi
- Uzun bas → işlemi geri al (bakiyeler eski haline döner)

## Teknik Detaylar

### Veri Modeli
- `companies[]`: id, name, type, balance, phone, note, createdAt
- `banks[]`: id, name, accountName, balance, createdAt
- `cards[]`: id, name, bankName, limit, used, statementDay, dueDayOffset, createdAt
- `transactions[]`: id, type, amount, date, companyId?, cardId?, bankId?, note

### Türkçe Sayı Parsing
"1.000,50" gibi Türkçe formatlı girdileri `parseTRY()` fonksiyonu doğru parse eder.

### Para Birimi
Tüm tutarlar `formatTRY()` ile Türk Lirası formatında gösterilir: `1.234,56 ₺`

## Dağıtım
- Önizleme: Web preview (Emergent) ve Expo Go QR kodu
- Üretim: Emergent platformunda sağ üstteki **Publish** butonu ile Android APK / iOS IPA üretimi

## Test Durumu
✅ 11/11 fonksiyonel akış geçti (testing_agent_v3_expo iteration_1)
- Dashboard, navigasyon, CRUD (cari/kart/banka), işlemler, çoklu hesap senkronizasyonu, kalıcılık doğrulandı.
