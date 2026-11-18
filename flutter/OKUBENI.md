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
