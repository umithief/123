# Yayın kaydı — 2026-11-05

- **Yöntem:** Cloudflare Worker `motonom-simulasyon` (hesap `ce9e2fb8cef0de99776b17c9fabf1f84`, alan adı `motonom.app`).
  Pages projesi `motonom-landing` değiştirilmedi; canlı production deploy `4c25386b` olduğu gibi duruyor.
- **Worker kaynağı:** `deploy/worker.mjs` — commit `4bda7e5`, SHA-256 `416f9e0a2dfe4108c23e0d876ea5f57c045b46a0a14fc71cdd0a08608ce48848`,
  yükleme etag `7ae10cb0899e41366365e8713b16d6bfe97696c809599e68a138139b64c9c65c`, 2026-11-05T15:18:52Z.
- **Route'lar (zone `32337587ab13e9d7cf5a095cbb5cc8b3`):**

| Desen | Route ID |
|---|---|
| `motonom.app/motosiklet-simulasyonu*` | `ccb00050d79d47fd8698f474b8ec83ef` |
| `motonom.app/assets/msim-*` | `10edacf897fa4075a4ffefb58b67a52e` |
| `motonom.app/veri/motosiklet-modelleri.json` | `fc79d6441b09495384a2209b5120ed66` |
| `motonom.app/sitemap-diger.xml` | `493543c0a9e7468092583723bec8e646` |
| `motonom.app/sitemap.xml` | `425410fe4f9849c4bfb14a9fc35eb51b` |
| `motonom.app/llms.txt` | `2c2fe655a5234a64ab72280668ab559f` |

## Canlı doğrulama (yayından hemen sonra)

- Yeni sayfa, 4 JS/CSS dosyası ve veri dosyası: 200, SHA-256 `dist/site` ile birebir aynı.
- `sitemap-diger.xml`, `sitemap.xml`, `llms.txt`: canlı Pages dosyası + yama = build çıktısı (SHA-256 aynı).
- `/a2-uygun-mu` baytları değişmedi; `/telemetri → /surus-modu`, `/pack-ride → /surus-arkadasi`, `/adana`, `/kulupler`
  yönlendirmeleri çalışıyor; `/api/count` 200; bilinmeyen `/assets/msim-*` 404 (Pages).
- `/motosiklet-simulasyonu.html` ve `/motosiklet-simulasyonu/` → eğik çizgisiz adrese yönleniyor.
- Gerçek tarayıcıda: `?a=ktm-390-duke&b=honda-cb500-hornet` doğru çiziliyor (A2: "Sınırda" / "Uygun görünüyor"),
  şema yalnızca WebApplication + FAQPage, Faz 2 açılışta yüklenmiyor, "Simülasyonu başlat" ile yükleniyor.

## Geri alma

Cloudflare → motonom.app → Workers Routes → yukarıdaki altı route'u silin (isteğe bağlı: `motonom-simulasyon`
script'ini de silin). Site anında önceki hâline döner; Pages deploy'una dokunmak gerekmez.

## Kalıcı hale getirme (önerilir)

Bir sonraki Pages deploy'unda `dist/site` içeriği ana site ağacına eklenirse Worker route'ları silinebilir.
Eklenmezse de sayfa çalışmaya devam eder (Worker route'ları Pages'in önünde).
