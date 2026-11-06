# AURA 3.0 — Prism tasarım sistemi

Kaynak tasarım Figma'dadır: **AURA Studio — Prism (3.0 tasarım)**
(https://www.figma.com/design/XpaiN5CjTIopS5RqELC9qZ). Dosyada şunlar var:

- `Prism / Renk` değişkenleri (Gece ve Gün modları) ve `Prism / Ölçü` değişkenleri;
- metin ve efekt stilleri;
- bileşenler: Button, IconButton, Chip, Segment, DockItem, RatioTile, AuraMark, StatusBar;
- 43 ikon;
- beş telefon ekranı: koyu ve açık tema.

Koddaki karşılıkları `src/aura-3.css` dosyasındadır. Bu dosya `aura-2.css`'ten sonra yüklenir; yerleşim (telefon, tablet, masaüstü) `aura-2.css`'te kalır.

## Konsept

Prism, uygulamanın adındaki "aura"yı görünür kılar. Arayüz soğuk grafit tonlarında, sakin ve geri planda durur; video ekrandaki en parlak öğedir. İridesan **aura gradyanı** (şeftali → pembe → lila → gök) yalnızca önemli anlarda görünür:

- ekrandaki tek ana eylem (Dışa aktar, Videoyu hazırla, Devam et);
- oynatma halkası;
- marka işareti;
- etkin aracın üst çizgisi.

Seçim ve odak düz **aura lilası** ile, yumuşak bir ışıkla gösterilir. Başlıklarda **Syne**, arayüzün geri kalanında **Outfit** kullanılır.

İlkeler:

1. **Tek aura.** Gradyan süs değildir. Bir ekranda tek gradyan düğme olur. Katmanlardaki "Tamam" mürekkep renkli haptır.
2. **Önce içerik.** Yüzeyler soğuk grafittir, hiçbir şey önizlemeyle yarışmaz.
3. **Başparmak için.** Telefonda alt kısım buzlu cam efektli yüzen bir araç çubuğudur. Dokunma hedefleri 44 px'tir, katmanlar alttan açılır ve köşeler büyüktür.
4. **İki tema, tek dil.** Gece ve Gün aynı değişkenlerle çalışır.

## Ekran mimarisi

Akışlar ve özellikler 2.8.0 ile aynıdır.

| Ekran | Yapı |
| --- | --- |
| Ana sayfa | Arkada hafif aura ışıması, başlık, hap biçiminde etiket, Syne başlık ("Senin imzan." gradyanlı), kart düzeni (büyük "Müzik videosu" kartı + iki küçük kart), "Hazır görünümleri keşfet" kartı |
| Kurgu (telefon) | Başlık (geri, aura işareti, görünüm, ara, kaydet, **Dışa aktar**), önizleme araçları, önizleme, aura halkalı oynatma, zaman çizelgesi kartı, buzlu cam araç çubuğu |
| Açık araç (telefon) | Alttan açılan katman: tutamak, Syne başlık, mürekkep "Tamam", sekmeler, içerik |
| Kurgu (≥ 700 px) | Sol araç rayı (etkin araçta dikey aura çizgisi), araç paneli, sahne, zaman çizelgesi |

## Renk

| Token | Gece | Gün | Kullanım |
| --- | --- | --- | --- |
| `--color-canvas` | `#08090d` | `#f3f3f6` | Uygulama zemini |
| `--color-panel` | `#11131a` | `#ffffff` | Kart, katman, pencere |
| `--color-raised` | `#1a1d26` | `#ebecf1` | İkincil düğme, çip, segment rayı |
| `--color-hover` | `#232734` | `#e1e3ea` | Üzerine gelme, kaydırıcı rayı |
| `--color-selected` | `#2b3040` | `#ffffff` | Seçili segment |
| `--color-ink` | `#f4f5f8` | `#0d0e14` | Birincil metin, "Tamam" ve "Böl" zemini |
| `--color-mute` | `#a3a8b8` | `#4f5466` | İkincil metin, araç adları |
| `--color-soft` | `#8a90a2` | `#626779` | Yardımcı metin (zemin, panel ve yükseltilmiş yüzeyde) |
| `--color-line` / `-strong` | `#1f2230` / `#343949` | `#e3e4ea` / `#c9cbd6` | Ayırıcı, kenarlık |
| `--color-accent` | `#b7a4ff` | `#5b45d6` | Seçim, odak, etkin araç |
| `--color-accent-soft` | lila %14 | mor %10 | Seçili araç ve kutu zemini |
| `--color-danger` | `#ff7a85` | `#c2283a` | Hata, silme |
| `--aura-gradient` | şeftali `#ffb38a` → pembe `#ff8fd0` → lila `#b7a4ff` → gök `#7fe3ff` | aynı | Ana düğme, oynatma halkası, işaret |
| `--aura-ink` | `#120b2e` | `#120b2e` | Aura üzerindeki metin |
| `--aura-text-1…4` | aura renkleri | `#d2541f`, `#c42d8c`, `#5b45d6`, `#13809f` | Gradyanlı başlık metni |

Kontrast değerleri (WCAG AA; küçük metin için en az 4,5:1, büyük metin için en az 3:1):

| Çift | Gece | Gün |
| --- | --- | --- |
| `ink` | 12–18,3:1 | 15–19,3:1 |
| `mute` | 5,5–8,4:1 | 5,9–7,5:1 |
| `soft` (zemin, panel, yükseltilmiş yüzey) | 5,3–6,2:1 | 4,8–5,6:1 |
| `accent` | 6,1–9,3:1 | 5–6,4:1 |
| Aura üzerindeki `aura-ink` | 8,8–12,9:1 | 8,8–12,9:1 |
| Gradyanlı başlık (büyük metin) | 9,3–13,6:1 | 3,8–5,8:1 |

`soft` hover ve seçili zeminlerde kullanılmaz; orada `mute` kullanılır.

## Tipografi

| Token | Boyut | Aile · ağırlık · harf aralığı | Kullanım |
| --- | --- | --- | --- |
| `--text-display` | 40–72 px | Syne 700 · −0,035 em | Ana sayfa başlığı |
| `--text-display-2` | 28 px | Syne 700 · −0,02 em | Pencere başlığı ("Hazır araçlar") |
| `--text-title-1` | 22 px | Syne 600 · −0,015 em | Katman başlığı (375 px altında 17 px) |
| `--text-title-2` | 17 px | Syne 600 · −0,01 em | Kart ve bölüm başlığı |
| `--text-body` | 15 px | Outfit 400 | Açıklama |
| `--text-callout` | 14 px | Outfit 500 | Satır başlığı |
| `--text-footnote` | 13 px | Outfit 500 | Düğme, segment |
| `--text-caption` | 12 px | Outfit 500 | Süre, yardımcı metin |
| `--text-label` | 11 px | Outfit 600 · BÜYÜK HARF 0,08–0,16 em | Bölüm etiketi |

Yazı tipleri uygulamayla birlikte gelir; internet bağlantısı gerekmez.

## Boşluk, şekil, derinlik

- **Boşluk** 4 noktalı ızgaraya göre: `--space-1` 4 px, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32, `-10` 40.
- **Köşe yarıçapı:**
  - `--radius-xs` 8;
  - `-sm` 12 (ikincil düğme, segment öğesi, klip);
  - `-md` 16 (segment rayı, seçim kutusu);
  - `-lg` 20 (kart, önizleme, açılır menü);
  - `-xl` 28 (alt katman, pencere, araç çubuğu, ana sayfa kartları);
  - `-full` (ana düğme, çip, ikon düğmesi).
- **Derinlik:**
  - `--elevation-1`: seçili segment;
  - `--elevation-2`: araç çubuğu, açılır menü, bildirim;
  - `--elevation-3`: pencere, katman;
  - `--glow-aura`: ana düğme ve oynatma halkası.
- **Dokunma hedefi:** başlık ve oynatma denetimleri en az 44 px; telefonda araç çubuğu düğmeleri 56 px yüksekliğindedir.

## Bileşenler ve durumlar

| Bileşen | Normal | Üzerine gelme / basılı | Seçili / etkin | Devre dışı |
| --- | --- | --- | --- | --- |
| Ana düğme | Aura gradyanlı hap, `aura-ink` metin, `--glow-aura` | Doygunluk +%15 / %97 ölçek | — | %38 opaklık, ışıma yok |
| Onay ("Tamam") | Mürekkep renkli hap, zemin renginde metin | — / %97 ölçek | — | %38 opaklık |
| İkincil düğme | `raised` zemin, `line` kenarlık, 12 px köşe | `hover` / %97 ölçek | — | %38 opaklık |
| İkon düğmesi | Saydam daire, 44 px | `raised` / %97 ölçek | — | %38 opaklık |
| Çip | `raised` zemin, `line` kenarlık, hap | `hover` | "Böl": mürekkep zemin | %38 opaklık |
| Segment | `raised` ray, `mute` metin | Metin `ink` | `selected` zemin + `elevation-1` | Soluk |
| Seçim kutusu / oran kutusu | `raised`, `line` kenarlık | — | Lila kenarlık, `accent-soft` zemin, hale ve ışık | Soluk |
| Araç çubuğu öğesi | `mute` ikon ve yazı ("Başla" grubunda `ink`) | `raised` | `accent-soft` zemin, lila ikon, aura çizgisi (telefonda üstte, rayda solda) | %35 opaklık |
| Oynatma düğmesi | `raised` daire, aura halkası, ışık | — / %94 ölçek | — | %50 opaklık |
| Oynatma konumu | 4 px ray | — | Oynatılan kısım aura ile dolar | — |
| Zaman çizelgesi klibi | `track-source` | — | Lila kenarlık, 3 px hale, yumuşak ışık | — |
| Klavye odağı | — | — | Hale: 1,5 px lila çizgi ve 5 px yumuşak halka | — |

## Hareket

- `--duration-fast` (120 ms): renk değişimleri ve basılma ölçeği.
- `--duration-base` (200 ms): kart geçişleri ve ok kayması.
- Yumuşama eğrisi: `--ease-out` = `cubic-bezier(.2,.8,.2,1)`.
- `prefers-reduced-motion: reduce` açıkken geçişler 1 ms'ye iner; basılma ölçeği ve ok kayması kapanır.

## Uygulama notları

- Yeni bileşenler yalnızca tokenlarla yazılmalı; renk, yarıçap ve boşluk değerleri doğrudan yazılmamalı.
- Aura gradyanı bir ekranda tek ana eylemde kullanılır. Katman içindeki onay düğmesi `ink` haptır.
- Pencere ve açılır menüler `<body>`'ye taşındığı için kuralları kök sınıfa bağlanmaz (`.transition-dialog`, `.atelier-dialog`, `.studio-popover`).
- Gradyan çerçeveler `padding-box` / `border-box` arka plan katmanlarıyla yapılır; bu yöntem köşe yarıçapını korur.
- Panellerde ve pencerelerde yana kayan alan yoktur: galeriler `repeat(auto-fill, minmax(--gallery-min, 1fr))` ızgarasıyla, çip ve sekme sıraları satır kaydırmayla aşağı doğru dizilir. Yalnızca zaman çizelgesi ve alttaki araç çubuğu yataydır.
- Oynatma konumu kaydırıcısı ilerlemeyi `--range-progress` değişkeninden okur. Bu değişkeni `studio-panels.tsx` ayarlar.
- Figma değişkenleri ve bu dosyadaki tokenlar aynı adları kullanır (`bg/panel` ↔ `--color-panel`). Değerler SwiftUI, Jetpack Compose ya da Flutter temasına doğrudan aktarılabilir.
