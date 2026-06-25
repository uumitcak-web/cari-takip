# Akınsoft Cari Takip - PRD

## Amaç
Offline (internetsiz) çalışan, Android & iOS için Expo ile geliştirilmiş cari hesap takip mobil uygulaması.

## Ana Özellikler
- Cari hesap takibi (Şirketlere alış / ödeme, kart ile ödeme)
- Kredi kartı takibi (Limit, kullanılan, kalan, hesap kesim günü, son ödeme)
- Banka hesapları takibi (Giriş/Çıkış)
- Genel Özet (Net pozisyon, toplam borç/varlık)
- **Genel Durum (Kupür Dökümü)**: 200/100/50/20/10/5 TL kupür adedi girilir, toplam otomatik hesaplanır.
- Bankalar > **Evde (Nakit)**: sabit kart; Genel Durum'da girilen kupür toplamı buraya yansır ve "Varlıklarım" toplamına dahil olur.
- TRY (₺) para birimi, Türkçe arayüz
- Tamamen offline (AsyncStorage)

## Teknik
- Expo Router (file-based), React Native, TypeScript
- AsyncStorage + localStorage (web)
- Context API store

## Sekmeler
1. Özet (Dashboard)
2. Cariler (Şirketler)
3. Kartlar (Kredi Kartları)
4. Bankalar (Banka hesapları + Evde nakit kartı)
5. Genel Durum (Kupür Dökümü)

## Yapılması Bekleyenler
- P0: Hesap kesim tarihi yaklaşan kartlar için yerel bildirim (expo-notifications) — APK build sonrası test edilecek.
- P1: Raporlar / Yedekleme (kullanıcı isteğine göre)
