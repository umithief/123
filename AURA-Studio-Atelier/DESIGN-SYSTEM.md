# AURA 3.0 — Lumen tasarım sistemi

Tokenlar ve bileşen kuralları `src/aura-3.css` dosyasındadır. Bu dosya `aura-2.css`'ten sonra yüklenir. Yerleşim (telefon, tablet, masaüstü) `aura-2.css`'te kalır.

## Konsept

Kurgu ekranı karanlık bir oda gibi düşünüldü; içindeki tek ışık kaynağı video. Arayüz geri planda durur:

- Hafif sıcak tonlu, siyaha yakın nötr renkler kullanılır.
- Tek bir yazı ailesi (Outfit) ve tek bir yazı ölçeği vardır.
- Tek bir vurgu rengi vardır: **Aura kehribarı**. Yalnızca ana eylemde, geçerli seçimde ve oynatma çizgisinde kullanılır.

İmza ayrıntı **hale**dir: seçili ya da odaklanmış her denetim kehribar bir çizgi ve yumuşak bir ışıkla çevrelenir. Bu her yerde aynıdır.

## Ekran mimarisi

| Ekran | Yapı |
| --- | --- |
| Ana sayfa | Başlık · tanıtım · açık proje · Projelerim · "Ne yaratmak istersin?" kartları · hazır görünümler |
| Kurgu (telefon) | Başlık (geri, ara, kaydet, **Dışa aktar**) · önizleme denetimleri · önizleme · oynatma · zaman çizelgesi · yüzen araç çubuğu |
| Açık araç (telefon) | Alttan açılan katman: tutamak, başlık, **Tamam**, sekmeler, içerik |
| Kurgu (≥ 700 px) | Sol araç rayı · araç paneli · sahne · tam genişlik zaman çizelgesi |

Her ekranda tek bir kehribar ana düğme bulunur: Dışa aktar, Tamam, Videoyu hazırla ya da Devam et.

## Renk

| Token | Koyu | Açık | Kullanım |
| --- | --- | --- | --- |
| `--color-canvas` | `#0b0b0d` | `#f4f2ee` | Uygulama zemini |
| `--color-panel` | `#131316` | `#fdfcfa` | Panel, kart, alt katman |
| `--color-raised` | `#1b1b20` | `#eeebe5` | İkincil düğme, segment rayı |
| `--color-hover` | `#24242a` | `#e5e1d9` | Üzerine gelme, basılı |
| `--color-selected` | `#2c2c33` | `#ffffff` | Seçili segment |
| `--color-ink` | `#f5f3ef` | `#17171a` | Birincil metin |
| `--color-mute` | `#aaa69f` | `#57544e` | İkincil metin |
| `--color-soft` | `#8b877f` | `#6b675f` | Yardımcı metin, etiket |
| `--color-line` / `-strong` | `#222228` / `#383840` | `#e2ded6` / `#c4bfb4` | Ayırıcı, kenarlık |
| `--color-accent` | `#f2c27e` | `#8a560c` | Ana eylem, seçim, oynatma çizgisi |
| `--color-accent-ink` | `#1c1307` | `#ffffff` | Vurgu üzerindeki metin |
| `--color-accent-soft` | kehribar %13 | bronz %10 | Seçili araç zemini, hale ışığı |
| `--color-danger` | `#ff8473` | `#b3321f` | Hata, silme |

Kontrast (WCAG AA, küçük metin için ≥ 4,5:1):

- Koyu tema:
  - `mute`: 7,1–8,1:1
  - `soft`: 4,8–5,5:1
  - `accent`: 10,5–12:1
  - vurgu üzerindeki metin: 11,2:1
- Açık tema:
  - `mute`: 6,3–7,4:1
  - `soft`: 4,7–5,5:1
  - `accent`: 5,2–6:1
  - vurgu üzerindeki beyaz metin: 6,2:1

## Tipografi

Tek aile kullanılır: **Outfit** (400, 500, 600). Uygulamayla birlikte gelir, internet gerektirmez.

| Token | Boyut | Ağırlık · aralık | Kullanım |
| --- | --- | --- | --- |
| `--text-display` | 36–68 px | 600 · −0,035 em | Ana sayfa başlığı |
| `--text-title-1` | 22 px | 600 · −0,015 em | Pencere başlığı |
| `--text-title-2` | 17 px | 600 · −0,01 em | Panel ve bölüm başlığı |
| `--text-body` | 15 px | 400 | Açıklama |
| `--text-callout` | 14 px | 500 | Kart başlığı |
| `--text-footnote` | 13 px | 500 | Düğme, segment |
| `--text-caption` | 12 px | 500 | Süre, yardımcı metin |
| `--text-label` | 11 px | 600 · BÜYÜK HARF 0,08–0,2 em | Bölüm etiketi, araç adı |

## Boşluk, şekil, derinlik

- **Boşluk** 4 noktalı ızgaraya göre: `--space-1` 4 px, `-2` 8, `-3` 12, `-4` 16, `-5` 20, `-6` 24, `-8` 32, `-10` 40.
- **Köşe yarıçapı:** `--radius-xs` 6 px · `-sm` 10 (zaman çizelgesi klibi, alan) · `-md` 12 (düğme, segment, karo) · `-lg` 16 (kart, önizleme, açılır menü) · `-xl` 24 (alt katman, pencere, araç çubuğu) · `-full` (ana düğme, çip).
- **Derinlik:**
  - `--elevation-1`: seçili segment;
  - `--elevation-2`: araç çubuğu, açılır menü, bildirim, oynat düğmesi;
  - `--elevation-3`: pencere.
  - `--sheen` ana düğmelere ince bir üst parlaklık verir.
- **Dokunma hedefi:** başlık ve oynatma denetimleri en az `--touch` 44 px. Araç çubuğu düğmeleri 54 px yüksekliğindedir.

## Bileşenler ve durumlar

| Bileşen | Normal | Üzerine gelme / basılı | Seçili | Devre dışı |
| --- | --- | --- | --- | --- |
| Ana düğme | Kehribar hap, `--sheen` | `--color-accent-strong` / %97 ölçek | — | %38 opaklık |
| İkincil düğme | `raised` zemin, `line` kenar, 12 px köşe | `hover` / %97 ölçek | — | %38 opaklık |
| İkon düğme | Saydam, 44 px | `raised` / %97 ölçek | — | %38 opaklık |
| Segment | `raised` ray | metin `ink` | `selected` zemin + `elevation-1` | — |
| Seçim karosu | `line` kenar | — | Kehribar kenar + **hale** | soluk |
| Araç çubuğu düğmesi | `mute` ikon ve yazı | `raised` | `accent-soft` zemin, kehribar ikon ve gösterge çizgisi (telefonda üstte, rayda solda) | %35 opaklık |
| Klavye odağı | — | — | **hale** (2 px dış çizgi yerine) | — |
| Zaman çizelgesi klibi | `track-source` | — | Kehribar kenar + 3 px ışık | — |

## Hareket

- `--duration-fast` (120 ms): renk değişimleri ve basılma ölçeği.
- `--duration-base` (200 ms): kart geçişleri.
- Yumuşama eğrisi: `--ease-out` = `cubic-bezier(.2,.8,.2,1)`.
- `prefers-reduced-motion: reduce` açıkken geçişler ve animasyonlar 1 ms'ye iner, basılma ölçeği kapanır.

## Uygulama notları

- Yeni bileşenler yalnızca tokenlarla yazılmalıdır. Renk, yarıçap ya da boşluk değerini doğrudan yazmayın.
- Kehribar rengi süs için kullanılmaz. Bir ekranda birden fazla kehribar dolgulu düğme varsa biri ikincil olmalıdır.
- Pencere ve açılır menüler `<body>`'ye taşındığı için kuralları kökle sınırlanmaz (`.transition-dialog`, `.atelier-dialog`, `.studio-popover`).
- Tokenlar tek düz değerler olduğu için SwiftUI, Jetpack Compose ya da Flutter temasına doğrudan aktarılabilir.
