# Motonom başarım rozetleri (Flutter)

`achievement_badge.dart` dosyasını projende örneğin `lib/widgets/achievement_badge.dart` olarak kaydet.
Dosya ek paket istemez; yalnızca Flutter SDK kullanır. Flutter 3.27 veya üstü gerekir (`Color.toARGB32`).

## Kullanım

```dart
import 'widgets/achievement_badge.dart';

// Kazanılmış ELİT rozet
AchievementBadge(
  tier: BadgeTier.elite,
  motif: achievementMotifs['Gece Devriyesi'] ?? BadgeMotif.pulse,
  size: 96,
  child: const Icon(Icons.nightlight_round),
)

// Kazanılmış MİTİK rozet
AchievementBadge(tier: BadgeTier.mythic, motif: BadgeMotif.speed, child: const Icon(Icons.speed))

// Kilitli rozet: ilerleme çevrede yeşil çizgi olarak görünür
AchievementBadge(tier: BadgeTier.locked, progress: 60, child: const Icon(Icons.lock_outline))

// Kazanma anı: celebrateKey değiştiğinde animasyon oynar
AchievementBadge(tier: BadgeTier.elite, celebrateKey: kazanilanZaman, child: ...)
```

Mevcut rozet görselini (altıgen resim/widget) bu widget ile değiştirmen yeterli. Ortadaki ikon,
uygulamada zaten kullandığın ikon olabilir; rozet onu ortalar ve seviyenin rengine boyar.

Seviyeler: `BadgeTier.elite`, `BadgeTier.mythic`, `BadgeTier.locked`
Motifler: `night`, `speed`, `route`, `social`, `trophy`, `explore`, `shield`, `pulse`
`achievementMotifs` haritası Başarım Odası'ndaki başarım adlarını motiflere eşler.

Not: Bu dosya Flutter'da derlenip denenmeden hazırlandı. Derleme hatası çıkarsa hata mesajını gönder, düzelteyim.

---

# Motonom rütbe amblemleri (Flutter)

`rank_emblem.dart` dosyasını örneğin `lib/widgets/rank_emblem.dart` olarak kaydet. Bu dosya da ek paket istemez.

## Kullanım

```dart
import 'widgets/rank_emblem.dart';

// Kullanıcının Apex puanına göre kademesi (13.656 APX → 5, Kademe Ustası)
RankEmblem(tier: rankEmblemTierForApex(user.apex), size: 180)

// Kariyer Yolu listesindeki her satır için küçük amblem
for (final r in rankEmblems)
  ListTile(
    leading: RankEmblem(tier: r.tier, size: 48),
    title: Text(r.name),
    trailing: Text('${r.minApex} APX'),
  )

// Tema rengini değiştirmek istersen (varsayılan uygulama mavisi 0xFF1F4BFF)
RankEmblem(tier: 7, size: 160, accent: const Color(0xFF1F4BFF))
```

Kademeler: 1 Çaylak Sürücü (0) · 2 Sokak Pilotu (500) · 3 Asfalt Kâşifi (2.000) · 4 Rota Komutanı (5.000)
· 5 Kademe Ustası (12.000) · 6 Elit Sürücü (20.000) · 7 Efsane Sürücü (35.000 APX).

Huzmeler, kanatlar ve alevler kutunun %15 dışına taşar; amblemin çevresinde biraz boşluk bırak.
Başarım Odası'ndaki büyük kadrandaki ikonun yerine `RankEmblem(tier: ..., size: 150)` koyabilirsin.
Cihazda "animasyonları azalt" açıksa amblem sabit, dolu bir karede durur.

Not: Bu dosya da Flutter'da derlenip denenmeden hazırlandı. Derleme hatası çıkarsa hata mesajını gönder, düzelteyim.
