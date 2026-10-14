/** UI-only copy. Project text, identifiers, file names and saved values are never translated. */
let language: "tr" | "en" = "tr";
export function setInterfaceCopyLanguage(next: "tr" | "en") {
  language = next;
}
export function ui(value: string): string;
export function ui(value: string | undefined): string | undefined;
export function ui(value: string | undefined): string | undefined {
  return value === undefined ? value : language === "en" ? (english[value] ?? value) : value;
}
const english: Record<string, string> = Object.fromEntries(
  `
Sahne geçişi|Scene transition
Sahne aralıkları|Scene boundaries
Geçiş kategorileri|Transition categories
Sahne geçiş efektleri|Scene transition effects
Geçiş ara|Search transitions
Geçiş süresi|Transition duration
Sahne geçiş süresi|Scene transition duration
Etkin süre|Effective duration
Efekti seç, süresini ayarla ve önizle.|Choose an effect, set its duration and preview it.
Kısa kliplerde süre otomatik kısalır. Toplam video süresi ve ses zamanları değişmez.|Short clips automatically limit the duration. Total video length and audio timing stay unchanged.
Bu aramada geçiş bulunamadı.|No transitions match this search.
Geçişi önizle|Preview transition
Görüntüler hazırlanıyor|Preparing frames
Tüm aralıklara uygula|Apply to all boundaries
Tüm geçişleri kaldır|Remove all transitions
Çapraz çözülme|Cross dissolve
Siyaha geçiş|Fade through black
Beyaza geçiş|Fade through white
Sola sil|Wipe left
Sağa sil|Wipe right
Sola it|Push left
Yukarı it|Push up
Zoom geçişi|Zoom transition
Bulanık çözülme|Blur dissolve
Dairesel açılma|Iris reveal
Işık çakması|Light flash
Oynatma başlığına git|Go to playhead
Klip: seç · Kenarlar: kırp · Aradaki simge: geçiş · Katman ve altyazıları sürükleyerek taşı|Clip: select · Edges: trim · Boundary icon: transition · Drag layers and captions to move them
Başlangıcı sürükle|Drag start
Bitişi sürükle|Drag end
Önceki kesim noktası|Previous edit point
Sonraki kesim noktası|Next edit point
Mıknatıs: kenarları ve vuruşları yakala|Magnet: snap to edges and beats
Vuruşlara böl|Split on beats
Video şablonları|Video templates
Boyut, sahne, renk, altyazı ve kurgu tek dokunuşla hazır.|Size, scene, colour, captions and edit in one tap.
Sosyal|Social
Müzik videosu|Music video
Sinematik|Cinematic
Sade|Minimal
vuruşta kesim|-beat cuts
Kurguyu da uygula|Also apply the edit
En iyi bölümü seçer, vuruşlardan keser; mevcut kesimlerin yerini alır.|Picks the best part and cuts on the beats; it replaces the current cuts.
Müzik çözümlenemediği için yalnızca görünüm uygulanır.|The music could not be analysed, so only the look is applied.
Şablondan önceki hâline dön|Back to before the template
Reels Enerji|Reels Energy
En güçlü 30 sn, her ölçüde ışık çakması|Strongest 30 s, a light flash every bar
TikTok Hızlı|TikTok Fast
15 sn, iki vuruşta bir zoom kesim|15 s, a zoom cut every two beats
Story Sakin|Calm Story
15 sn, rüya ışığı ve yumuşak geçiş|15 s, dreamy light and soft fades
Shorts Neon|Shorts Neon
30 sn, neon tünel ve bulanık kesimler|30 s, neon tunnel and blur cuts
Sözlü Klip|Lyric Video
Tüm şarkı, okunaklı sözler, ipek dalga|Whole song, readable lyrics, silk wave
Konser Işıkları|Concert Lights
Avize ışıkları, iki ölçüde bir beyaz parlama|Chandelier lights, a white flash every two bars
Plak, film dokusu ve sıcak tonlar|Vinyl, film grain and warm tones
Rock Sahnesi|Rock Stage
Sert kontrast, iki ölçüde bir çakma|Hard contrast, a flash every two bars
Film çerçevesi, koyu kenarlar, tutulma|Film frame, dark edges, eclipse
Altın Saat|Golden Hour
Sıcak ışık sızıntısı ve altın tonlar|Warm light leaks and golden tones
Kara Film|Film Noir
Siyah beyaz, film tanesi, org boruları|Black and white, film grain, organ pipes
Sade Gönderi|Clean Post
4:5, en güçlü 60 sn, temiz görünüm|4:5, strongest 60 s, clean look
Hazır araçlar|Ready-made tools
Tek dokunuşla düzenle; her biri Geri al ile tek adımda geri alınır.|Edit in one tap; Undo reverts each in a single step.
En iyi bölüm|Best part
Şarkının en güçlü kısmını Reels, TikTok veya Shorts için seçer; mevcut kesimlerin yerini alır.|Picks the strongest part of the song for Reels, TikTok or Shorts; it replaces the current cuts.
Videoyu müziğin vuruşlarından keser.|Cuts the video on the music's beats.
Fotoğraflar müziğin vuruşunda sırayla değişir.|Photos change in order on the music's beats.
Aç|Open
Sessiz yerleri kes|Cut silent parts
Ses okunamadığı için kullanılamıyor.|Unavailable because the audio could not be read.
Konuşma ve vlog için:|For talks and vlogs:
sessizlik çıkarılır.|of silence is removed.
Çıkarılacak sessizlik bulunamadı.|No silence to remove.
Kes|Cut
Baştaki ve sondaki boşluğu kırp|Trim silence at the start and end
Baştan|From the start
sondan|from the end
sessizlik kırpılır.|of silence is trimmed.
Başta ve sonda sessizlik yok.|There is no silence at the start or end.
Kırp|Trim
Yumuşak giriş ve çıkış|Soft start and ending
Video sessizce açılır, sonunda yavaşça kısılarak biter.|The video fades in and gently fades out at the end.
Uygula|Apply
Tüm kesimlere geçiş|Transition on every cut
kesime çapraz çözülme eklenir.|cuts get a cross dissolve.
Önce videoyu bölün; tek parçada geçiş olmaz.|Split the video first; a single part has no cuts.
Görüntüleri vuruşlara yerleştir|Place pictures on beats
Her görüntü müziğin vuruşunda değişir.|Each picture changes on a beat of the music.
Görüntüler|Pictures
Ekle|Add
Fotoğraf veya kısa videolar ekleyin; sırayla vuruşlara yerleşir.|Add photos or short videos; they are placed on the beats in order.
Ne sıklıkla değişsin?|How often should it change?
Değişim sıklığı|Change frequency
Geçiş|Transition
Görüntü geçişi|Picture transition
Kesme|Cut
Yumuşak|Soft
Zoom|Zoom
Oynatma başlığından başla|Start at the playhead
Görüntüler bitince başa dön|Repeat pictures to the end
Karışık sıra|Shuffle
yerleşim|placements
her biri|each
Yerleştirilecek görüntü yok.|No pictures to place.
Görüntü satırı bu yerleşimle değişir; Geri al ile eski hâline dönebilirsiniz.|The picture row is replaced by this layout; Undo brings the old one back.
Vuruşlara yerleştir|Place on beats
Kapat|Close
Vuruşlar bulunamadı|No beats found
vuruş bulundu|beats found
Bu parçada vuruş bulunamadı.|No beats were found in this track.
Nereyi bölelim?|What should be split?
Bölme alanı|Split range
Tüm video|Whole video
Seçili klip|Selected clip
Ne sıklıkla?|How often?
Kesim sıklığı|Cut frequency
Her vuruş|Every beat
2 vuruş|2 beats
4 vuruş · 1 ölçü|4 beats · 1 bar
8 vuruş · 2 ölçü|8 beats · 2 bars
Kesimlerde geçiş|Transition at cuts
kesim eklenecek|cuts will be added
parçalar|parts
Bu aralıkta eklenecek kesim yok.|There are no cuts to add in this range.
Bir videoda en fazla 60 parça olabilir; ilk|A video can have at most 60 parts; the first
kesim eklenecek. Tümü için daha seyrek bir aralık seçin.|cuts will be added. Pick a sparser interval for all of them.
Bir videoda en fazla 60 parça olabilir. Önce bazı kesimleri birleştirin veya silin.|A video can have at most 60 parts. Delete some cuts first.
Otomatik sahne ayırma|Automatic scene splitting
Sahne değişimlerini cihazda bulur ve ayrı kliplere böler.|Finds scene changes on your device and splits them into separate clips.
Kesimleri kontrol edin; istemediklerinizi kaldırın.|Review the cuts and deselect any you do not want.
Videodaki görüntü değişimlerini bulur. Seçtiğiniz kesimleri tek adımda ayrı kliplere dönüştürür.|Finds visual scene changes and turns your selected boundaries into separate clips in one step.
Sahne algılama için ana kaynak olarak video yükleyin.|Load a video as the main source to detect scenes.
Algılama hassasiyeti|Detection sensitivity
En kısa sahne|Shortest scene
Düşük · daha az kesim|Low · fewer cuts
Dengeli|Balanced
Yüksek · daha fazla kesim|High · more cuts
Sahneleri bul|Find scenes
Yeniden tara|Scan again
Sahneler taranıyor|Scanning scenes
Sahne analizi ilerlemesi|Scene analysis progress
Bulunan sahne kesimleri|Detected scene boundaries
sahne değişimi bulundu|scene changes found
Belirgin bir sahne değişimi bulunamadı. Hassasiyeti artırarak yeniden deneyebilirsiniz.|No distinct scene changes found. Try increasing sensitivity.
Kısa flaşlar elenir. Hızlı kamera hareketleri kesim gibi algılanabilir; uygulamadan önce kontrol edin.|Short flashes are filtered. Fast camera motion can look like a cut; review before applying.
Seçimi temizle|Clear selection
Sahne kesimlerini yatay kaydır|Scroll scene boundaries horizontally
Kesimi önizle|Preview boundary
Sahne kesimini seç|Select scene boundary
kesimi uygula|Apply cuts
Süre, hız, ses ve altyazı zamanları korunur. Mevcut kesimler tekrar bölünmez.|Duration, speed, audio and subtitle times are preserved. Existing boundaries are not split again.
Zaman çizelgesi en fazla 60 klip destekliyor. Bazı kesimleri kaldırın veya en kısa sahne süresini artırın.|The timeline supports up to 60 clips. Deselect some cuts or increase the shortest scene duration.
Sahneler ayrı kliplere bölündü. Tek adımda geri alabilirsiniz.|Scenes were split into separate clips. You can undo in one step.
Sahne analizi tamamlanamadı.|Scene analysis could not finish.
Video kareleri okunamadı. MP4/H.264 video deneyin.|Video frames could not be read. Try an MP4/H.264 video.
Bu cihazda sahne analizi desteklenmiyor.|Scene analysis is not supported on this device.
Sahne analizi için en fazla 60 dakikalık video kullanın.|Use a video up to 60 minutes long for scene analysis.
Altyazı tasarım bölümleri|Caption design sections
Oluştur|Create
Metni düzenle|Edit text
Animasyon kategorisi|Animation category
seçenek ·|options ·
Altyazı animasyonları|Caption animations
Geçiş hızı|Transition speed
Altyazı animasyon hızı|Caption animation speed
Hareket gücü|Motion strength
Altyazı hareket gücü|Caption motion strength
Örnek metinde önizle|Preview sample text
Otomatik altyazı|Automatic captions
Altyazı adımları|Caption steps
Altyazı ekleme yöntemi|Caption source
Altyazı dili|Caption language
Türkçe|Turkish
İngilizce|English
Otomatik algıla|Auto-detect
Tanıma kalitesi|Recognition quality
Daha doğru|More accurate
Daha hızlı|Faster
Eksik bölümü yeniden tara|Scan a missing section again
Sadece seçilen bölüm|Selected section only
Başlangıç (sn)|Start (s)
Tarama başlangıcı|Scan start
Bitiş (sn)|End (s)
Tarama bitişi|Scan end
Doğru şarkı sözlerini yapıştır|Paste the exact lyrics
Her satıra bir cümle|One sentence per line
Şarkı sözleri|Lyrics
Şarkının doğru sözlerini buraya yapıştır|Paste the exact lyrics here
Sözleri altyazıya ekle|Use lyrics as captions
İptal et|Cancel
Altyazı oluştur|Generate captions
SRT yükle|Import SRT
SRT indir|Download SRT
SRT altyazı dosyası|SRT caption file
Satır ekle|Add line
Geri al|Undo
Yinele|Redo
Altyazı oluşturma ilerlemesi|Caption generation progress
Konum, boyut ve zamanlama|Position, size and timing
Altyazıları göster|Show captions
Altyazı stili|Caption style
Altyazı konumu|Caption position
Alt|Bottom
Orta|Center
Üst|Top
Yazı boyutu|Font size
Altyazı yazı boyutu|Caption font size
Zaman kaydır|Time offset
Altyazı zaman kaydırma|Caption time offset
sn|s
satır · düzenle ve dinle|lines · edit and listen
Tümünü temizle|Clear all
Altyazılarda ara|Search captions
Çalan satır|Current line
Altyazı satırları|Caption lines
Bu satırı şimdi başlat|Start this line now
Önceki altyazı sayfası|Previous caption page
satır ·|lines ·
Sonraki altyazı sayfası|Next caption page
Aramanıza uygun satır bulunamadı.|No matching lines found.
Şablon ara|Search templates
Altyazı şablonu ara|Search caption templates
Şablon kategorisi|Template category
Altyazı şablonları|Caption templates
Görünümü geri al|Undo appearance
Bu aramaya uygun şablon yok.|No matching templates.
Altyazı görünümü|Caption appearance
Altyazı yazı tipi|Caption font
Kalınlık|Weight
Altyazı kalınlığı|Caption weight
Normal|Regular
Yarı kalın|Semibold
Kalın|Bold
Vurguda sahne rengini kullan|Use the scene accent color
Vurgu rengi|Accent color
Altyazı vurgu rengi|Caption accent color
Altyazı arka planı|Caption background
Kontur|Outline
Altyazı kontur kalınlığı|Caption outline width
Parıltı|Glow
Altyazı parıltısı|Caption glow
Önce müzik veya video seç|Choose music or video first
Video boyutu|Video size
Kalite|Quality
Video kalitesi|Video quality
720p · Daha hızlı|720p · Faster
1080p · Daha net|1080p · Sharper
Videoyu hazırla|Create video
Yalnızca sesi kaydet · WAV|Export audio only · WAV
Uygulamayı açık tut. İşlem tamamlanınca kaydedebilirsin.|Keep the app open. Save when processing is complete.
Hazırlamayı iptal et|Cancel export
Kaynak ses dalga biçimi|Source waveform
Zaman çizelgesi|Timeline
Kurguya başlamak için müzik seç.|Choose a track to start editing.
Müzik kesimleri|Audio clips
Kurgu zaman çizelgesi|Editing timeline
Buradan böl|Split here
Kurguyu geri al|Undo edit
Kurguyu yinele|Redo edit
Böl|Split
Kesimi sola taşı|Move clip left
Kesimi sağa taşı|Move clip right
Animasyon|Animation
Kesim başlangıcı (sn)|Clip start (s)
Kesim bitişi (sn)|Clip end (s)
Oynatma hızı|Playback speed
Kesim ses düzeyi|Clip volume
Ses girişi (sn)|Fade in (s)
Ses çıkışı (sn)|Fade out (s)
Fotoğraf ve video sahneleri|Photo and video scenes
sahne|scenes
Fotoğraf / video ekle|Add photo / video
Sahne medya dosyaları|Scene media files
Spektrumu görüntülerin üzerinde göster|Show visualizer over media
Medya sahneleri|Media scenes
Kareyi dondur|Freeze frame
Sahneyi çoğalt|Duplicate scene
Sahneyi sil|Delete scene
Sahne başlangıcı (sn)|Scene start (s)
Sahne bitişi (sn)|Scene end (s)
Videodan başlat (sn)|Video offset (s)
Video hızı|Video speed
Görüntü kadrajı|Image framing
Sahne geçişi|Scene transition
Geçiş süresi (sn)|Transition duration (s)
Maske ve renk anahtarı|Mask and chroma key
Görüntü maskesi|Image mask
Silinecek renk|Key color
Renk silme toleransı|Key tolerance
Medya hazırlanıyor…|Preparing media…
Metin araçları|Text tools
Metin ve çıkartmalar|Text and stickers
katman|layers
0 katman|0 layers
Henüz katman yok|No layers yet
Katmanları önizlemede sürükleyerek yerleştirebilirsin.|Drag layers in the preview to position them.
Metin ekle|Add text
PNG çıkartma|PNG sticker
Çıkartma dosyası|Sticker file
Çıkartmalar|Stickers
Görsel katmanlar|Visual layers
Çoğalt|Duplicate
Öne getir|Bring to front
Katmanı sil|Delete layer
Katman metni|Layer text
Katman başlangıcı (sn)|Layer start (s)
Katman bitişi (sn)|Layer end (s)
Yatay konum (%)|Horizontal position (%)
Dikey konum (%)|Vertical position (%)
Katman boyutu|Layer size
Katman dönüşü (°)|Layer rotation (°)
Katman görünümü|Layer appearance
Katman rengi|Layer color
Katman opaklığı|Layer opacity
Katman yazı tipi|Layer font
Katman yazı kalınlığı|Layer font weight
Katman yazı efekti|Layer text effect
Metin arka planı|Text background
Katman animasyonu|Layer animation
Anahtar kareler ve karışım|Keyframes and blending
Bu ana anahtar kare ekle|Add keyframe here
Katman karışımı|Layer blending
Görüntü ayarı bölümleri|Image setting sections
Sıfırla|Reset
Görüntü filtresi|Image filter
Görüntü efekti|Image effect
Efekt gücü|Effect strength
Görüntü efekt gücü|Image effect strength
Renk ayarları|Color settings
Kadraj yakınlığı|Frame zoom
Görüntü dönüşü (°)|Image rotation (°)
Yatay çevir|Flip horizontally
Dikey çevir|Flip vertically
Ek ses ve seslendirme|Tracks and voiceover
Ses dosyası ekle|Add audio file
Ses kaydını bitir|Finish recording
Seslendirme kaydet|Record voiceover
Ek ses dosyası|Additional audio file
Mikrofon kaydediliyor · en fazla 2 dakika|Recording microphone · up to 2 minutes
Ek sesler|Audio tracks
Ek sesi sil|Delete audio track
Ek ses başlangıcı (sn)|Track start (s)
Ek ses bitişi (sn)|Track end (s)
Ek ses kaynağından başlat (sn)|Track source offset (s)
Ek ses düzeyi|Track volume
Ek ses girişi (sn)|Track fade in (s)
Ek ses çıkışı (sn)|Track fade out (s)
Proje zaman çizelgesi|Project timeline
Zaman çizelgesini uzaklaştır|Zoom timeline out
Zaman çizelgesini yakınlaştır|Zoom timeline in
Seçili klibi çoğalt|Duplicate selected clip
Seçili klibi sil|Delete selected clip
Zaman çizelgesinde gezin|Seek in timeline
Ana klipler|Main clips
Video veya müzik ekle|Add video or music
Kaynak klip ayarlarını aç|Open source clip settings
Görüntü satırı|Image track
Yazı ve şekil satırı|Text and shape track
Altyazı satırı|Caption track
Ek ses satırı|Audio track
Alttaki araçlardan yazı, görüntü veya altyazı ekle.|Add text, media or captions from the workspaces.
Klibe dokun: düzenle · Kenarları sürükle: kırp|Tap a clip to edit · Drag its edges to trim
Müzik eklentileri|Music tools
Ses ayarı bölümleri|Audio setting sections
Ritim analizi|Rhythm analysis
Tahmini tempo|Estimated tempo
Algılanan vuruş sayısı|Detected beat count
vuruş algılandı|beats detected
Ritim dalgası|Rhythm wave
Otomatik DJ|Auto DJ
16 vuruşta sahne değiştir|Change scene every 16 beats
Sahne reçeteleri|Scene recipes
Müzik ve sahne reçeteleri|Music and scene recipes
3 bant ekolayzır|3-band equalizer
Ekolayzır hazır ayarları|Equalizer presets
Dinamik denge|Dynamic balance
Ani ses yükselişlerini yumuşat|Smooth sudden volume changes
Ses efektleri|Audio effects
Çıkış sesi|Output volume
Ses paneli çıkış sesi|Audio output volume
Ses ayarları dinleme ve MP4 kaydına uygulanır.|Audio settings apply to playback and MP4 exports.
Sesi sıfırla|Reset audio
Parçayı değiştir|Change track
Son düzenlemeyi geri al|Undo last edit
Son düzenlemeyi yinele|Redo last edit
Sahne görünümünü aç|Open presentation view
Sahneyi PNG olarak indir|Download scene as PNG
Ses kaynağı|Audio source
Parça yükle|Upload track
Mikrofon|Microphone
Örnek|Demo
Hata mesajını kapat|Dismiss error
Kaydın hazır ·|Your export is ready ·
Tekrar indir|Download again
Stüdyo ayarları|Studio settings
Zaman çizelgesine dön|Back to workspace
Düzenleme|Editing
Değişiklikler anında görünür|Changes appear instantly
Düzenleme araçları|Editing tools
Görsel araçlarına git|Open visual tools
Sahneler|Scenes
Kapak ve başlık|Artwork and title
Görüntü düzenleme|Image editing
Kapak ve başlık ayarları|Artwork and title settings
Ses ve ritim|Sound and rhythm
Kaynak dosyasını değiştir|Change source file
Ses efektleri ve ritim|Audio effects and rhythm
Kurgu yedeği · medya dahil|Project file · includes media
Kurguyu yedekle|Save project file
Kurgu yedeği aç|Open project file
Kurgu dosyası işleniyor…|Processing project…
Proje ayarları ve yedekler|Project settings and backups
Sadece bu cihazda|On this device only
Ses dosyanız sunucuya yüklenmez|Your audio stays on your device
Stüdyoya dön|Back to studio
Durdur|Stop
Dosyanı buraya bırak|Drop your file here
Müzik veya kapak fotoğrafı|Music or cover image
Kurgu yedek dosyası|Project backup file
Kapak fotoğrafı dosyası|Cover image file
Müzik dosyası|Music file
Araçlar|Tools
Araç bul|Find a tool
Yapmak istediğin işlemi seç.|Choose what you want to do.
Araç penceresini kapat|Close tools
Araç ara|Search tools
Örn. yazı, kes, efekt…|Try text, trim, effects…
Spektrum bölümleri|Visualizer sections
Sahne ara|Search scenes
Sahne ara…|Search scenes…
Görselleştirme filtresi|Visualizer filter
Görselleştirmeler|Visualizers
Bu aramada sahne bulunamadı.|No matching scenes found.
Renk teması|Color theme
Işık dokusu|Light finish
Hassasiyet|Sensitivity
Hareket hızı|Motion speed
Parçacık alanı|Particles
Kapak fotoğrafı|Cover image
JPG, PNG, WebP · 20 MB’a kadar|JPG, PNG, WebP · up to 20 MB
Kapağı kaldır|Remove cover
Kapak konumu ve görünümü|Cover position and appearance
Kapak konumu|Cover position
Kapak biçimi|Cover shape
Boyut|Size
Kapak boyutu|Cover size
Basla hareket et|React to bass
Görünürlük|Visibility
Arka plan görünürlüğü|Background visibility
Kapak bu tarayıcıda saklanır ve videoya eklenir.|Your cover is stored in this browser and included in the video.
Sahne başlığı|Scene title
Parça veya sanatçı adı|Track or artist name
Parça adı|Track name
Başlık konumu ve yazı stili|Title position and style
Yazı konumu|Text position
Yazı stili|Text style
Başlığı, altyazıdan farklı bir konuma yerleştirebilirsiniz.|You can position the title separately from captions.
Oynatma kontrolleri|Playback controls
Çalma konumu|Playback position
Ses ve oynatma ayarları|Volume and playback settings
Oynatma ayarları|Playback settings
Parçayı tekrarla|Loop track
Başa dön|Back to start
Video oranı|Aspect ratio
Çözünürlük|Resolution
Video çözünürlüğü|Video resolution
MP4 kaydı, oynayan sesi ve bu sahneyi içerir.|The MP4 includes the playing audio and this scene.
Hazır ayarlarım|My presets
Görsel, ses, kapak yerleşimi ve altyazı stilini birlikte saklayın.|Save visuals, audio, cover layout and caption styling together.
Hazır ayar adı|Preset name
Örn. Gece seti|e.g. Night session
Hazır ayarı kaydet|Save preset
Henüz hazır ayar yok. Sevdiğiniz sahneyi burada saklayabilirsiniz.|No presets yet. Save your favorite scene here.
Kayıtlı görünümler|Saved looks
En fazla 8 hazır ayar, bu tarayıcıda saklanır.|Up to 8 presets are stored in this browser.
Ayar yedeği|Settings backup
Yedekle|Back up
Yedeği yükle|Restore backup
AURA ayar dosyası|AURA settings file
Klavye kısayolları|Keyboard shortcuts
Oynat / duraklat|Play / pause
Boşluk|Space
5 saniye geri / ileri|Back / forward 5 seconds
Dinlemeyi sessize al|Mute playback
Tam ekran|Fullscreen
Sahne görünümünden çık|Exit presentation view
Stüdyo ayarlarını sıfırla|Reset studio settings
Animasyon eklemek için bir müzik veya video yükle.|Upload music or video to add animations.
Video animasyonları|Video animations
Animasyon uygulanacak klip|Clip to animate
Klip|Clip
Görüntü ·|Image ·
Video animasyonu türü|Video animation type
Animasyon seçildi|Animation selected
Tamam|Done
Video animasyonu ara|Search video animations
Animasyon ara…|Search animations…
Video animasyon kategorileri|Video animation categories
Bu aramada animasyon bulunamadı.|No matching animations found.
Görseller|Visuals
Renkler|Colors
Hareket|Motion
Tümü|All
Lüks|Signature
Spektrum|Visualizer
Sahne|Scene
Katmanlar|Layers
İçerik|Content
Görünüm|Appearance
Konum|Position
Zaman|Timing
Yazı tipi|Font
Stil|Style
Filtreler|Filters
Efektler|Effects
Renk|Color
Kadraj|Framing
Ritim|Rhythm
Ekolayzır|Equalizer
Metin|Text
Altyazı|Captions
Medya|Media
Ses|Audio
Kapak|Cover
Ayarla|Adjust
Sabit|Static
Yumuşak giriş|Fade in
Yüksel|Rise
Daktilo|Typewriter
Elastik|Elastic
Netleş|Focus
Salınım|Swing
Perde|Wipe
Süzül|Float
Yakın plan|Close-up
Kapalı|Off
Açık|On
Yok|None
Film dokusu|Film grain
Işık sızıntısı|Light leak
Analog ekran|Analog screen
Film çerçevesi|Film frame
Rüya parıltısı|Dream glow
Prizma ışığı|Prism light
Orijinal|Original
Sepya|Sepia
Canlı|Vivid
Soğuk|Cool
Sıcak|Warm
Tam görüntü|Fit
Doldur|Fill
Yakınlaş|Zoom
Kaydır|Slide
Oval|Oval
Yuvarlatılmış|Rounded
Kare|Square
Daire|Circle
Kalp|Heart
Yıldız|Star
Ok|Arrow
Dikdörtgen|Rectangle
Parlaklık|Brightness
Kontrast|Contrast
Doygunluk|Saturation
Sıcaklık|Warmth
Bulanıklık|Blur
Vinyet|Vignette
Bas|Bass
Tiz|Treble
Yankı|Echo
Derinlik|Depth
Genişlik|Width
Düz|Flat
Altın yansıma|Gold sheen
Kabartma|Extrude
Neon|Neon
Modern|Modern
Başlık|Headline
Editoryal|Editorial
Giriş|In
Çıkış|Out
Karma|Loop
Temel|Basic
Işık|Light
Arıza|Glitch
Maske|Mask
Titreşim|Shake
Süre|Duration
Şiddet|Intensity
Tutulma|Eclipse
İpek Yelpaze|Silk Fan
Pırlanta|Brilliant Cut
Turbiyon|Tourbillon
Ay Evreleri|Moon Phases
Mermer|Marble
Org Boruları|Pipe Organ
Şampanya Kadehi|Champagne Flute
Altın Oran|Golden Ratio
Kaleydoskop|Kaleidoscope
Arp|Harp
Yeni|New
Frekans Vadisi|Frequency Valley
Sıvı Metal|Liquid Metal
Faz Çiçeği|Phase Flower
Cam Kuleler|Glass Towers
Altın Plak|Golden Vinyl
Mücevher|Jewels
Saten Dalga|Silk Wave
Platin Bloklar|Platinum Blocks
Kadife Işık|Velvet Light
Kristal Salon|Crystal Hall
İnci Bulutu|Pearl Cloud
Işık Katedrali|Light Cathedral
Prizma|Prism
Spektrogram|Spectrogram
Takımyıldız|Constellation
Çubuklar|Bars
İğne|Needles
İpek|Silk
Ayna|Mirror
Halka|Ring
Taç|Crown
Hale|Halo
Yörünge|Orbit
Tünel|Tunnel
Akış|Flow
Dalga Ağı|Wave Lattice
Kutup|Aurora
Damla|Orbs
Ufuk|Horizon
Şampanya|Champagne
Platin|Platinum
Bakır Gül|Rose Gold
Kor|Ember
Buz|Ice
Yeşim|Jade
Gül|Rose
Altın|Gold
Oynat|Play
Duraklat|Pause
Sessize al|Mute
Sesi aç|Unmute
Hazırlanıyor…|Preparing…
Önizleme|Preview
Dikey|Portrait
Yatay|Landscape
Kapsül|Pill
İris|Iris
Animasyonlar videoya işlenir. SRT dosyaları yalnızca metin ve zamanları içerir.|Animations are rendered into the video. SRT files contain only text and timing.
Parçanın vokallerini yazıya dönüştür, zamanları düzenle ve videoya ekle.|Transcribe the vocals, adjust timing and add them to your video.
Başlamak için bir müzik dosyası yükleyin. Otomatik altyazı yüklenen parçalar içindir.|Upload a track to start. Automatic captions work with imported tracks.
Daha doğru model ilk kullanımda yaklaşık 250 MB indirir ve daha yavaş çalışır. Şarkıda doğru dili seçin; yoğun enstrümanlar kelime hatalarına yol açabilir.|The accurate model downloads about 250 MB on first use and takes longer. Select the song language; dense instrumentation can cause recognition errors.
Altyazı oluştur düğmesiyle bu bölümü yeniden tarayın. Diğer bölümlerin satırları korunur.|Generate captions to scan this section again. Other sections remain unchanged.
Metin aynen kullanılır. Mevcut altyazıda eşleşen kelimeler zamanları belirler; diğer zamanlar tahmin edilir. Metni düzenle adımında dinleyip düzeltebilirsiniz.|Your exact text is used. Matching words in existing captions provide timing; other timings are estimated. Listen and adjust in Edit text.
% · İlk model indirmesi ve işlem birkaç dakika sürebilir.|% · The first model download and processing may take a few minutes.
Ses cihazınızda işlenir. İlk kullanımda model indirilir. En fazla 10 dakika / 50 MB. Vokaller, çalgılarla karıştığında hatalar olabilir; sonucu kontrol edin.|Audio is processed on your device. The model downloads on first use. Up to 10 minutes / 50 MB. Instruments can affect recognition; review the result.
Pozitif kaydırma altyazıyı geciktirir. MP4’e ekrandaki altyazı işlenir.|A positive offset delays captions. The visible captions are rendered into the MP4.
Kelime efektleri otomatik tanınan zamanları kullanır. SRT ve düzenlenen satırlarda kelime süreleri yaklaşık hesaplanır.|Word effects use recognized timings. Word durations in SRT and edited lines are estimated.
İşlem video süresi kadar sürer. Hazırlanırken uygulamayı açık tut; bitince kaydetme penceresi açılır.|Export runs in real time. Keep the app open; a save dialog appears when finished.
Kesim zamanları kaynak parçaya aittir. Altyazılar kesimleri ve hızı takip eder. Hız değişirken ses perdesi korunur.|Clip timings refer to the source track. Captions follow edits and speed. Pitch is preserved when speed changes.
Müziğin üzerine kendi görüntülerini yerleştir. Video sahnelerinin kendi sesi kapalıdır; projenin müziği kullanılır.|Layer your visuals over the music. Video scene audio is muted; the project soundtrack is used.
Ana videonun kesimleri ve hızı Müzik bölümündeki zaman çizelgesinden düzenlenir.|Adjust the main video cuts and speed in the Edit workspace.
0 renk silmeyi kapatır. Yeşil ekran gibi düz bir rengi kaldırmak için artır. Yüksek değer ayrıntıları da silebilir.|0 disables chroma key. Increase to remove a solid color, such as a green screen. High values may also remove details.
Önce zaman çizelgesinde bir konuma git. Konum, boyut, dönüş ve opaklığı ayarla; o an için anahtar kare ekle. Kareler arasındaki hareket doğrusal hesaplanır.|Seek to a point on the timeline, set position, size, rotation and opacity, then add a keyframe. Motion between keyframes is linear.
Müziğe ikinci bir ses dosyası veya mikrofon kaydı ekle. Seslendirmede kulaklık kullanarak müziğin mikrofona karışmasını azalt.|Add a second audio file or a microphone recording. Use headphones when recording to reduce music leaking into the microphone.
Tempo, tekrarlayan bas vuruşlarından tahmin edilir; düzensiz ritimde değer gösterilmez.|Tempo is estimated from repeated bass beats; no value is shown for irregular rhythms.
Müzik, fotoğraf/video dosyaları, kesimler, katmanlar, altyazılar ve görünüm tek dosyada saklanır. Üst sınır 200 MB.|Music, photos, videos, edits, layers, captions and appearance are stored in one file. Maximum 200 MB.
Bu aramada araç bulunamadı. “Yazı”, “ses” veya “video” deneyebilirsin.|No tools found. Try text, audio or video.
Alttaki araç çubuğundan düzenle. Zaman çizelgesindeki klibe dokunarak ayarlarını aç.|Choose a workspace to edit. Tap a timeline clip to open its settings.
Yedek yalnızca ayarları içerir. Ses ve kapak dosyasını ayrıca yükleyin; altyazı metnini SRT olarak saklayın.|This backup contains settings only. Load audio and cover files separately; save caption text as SRT.
Geniş|Wide
Yükseliş|Rise
Karaoke akışı|Karaoke flow
Soldan akış|Flow from left
Sağdan akış|Flow from right
Düşüş|Drop
Çevir|Flip
Sıralı giriş|Stagger
Kelime akışı|Word flow
Nabız|Pulse
Altını çiz|Underline
Kelime çevir|Word flip
Harf aralığı|Letter spacing
Işık geçişi|Light sweep
Maske yükselişi|Mask rise
Işıltı|Glow in
Hız çizgisi|Speed lines
Harf yağmuru|Letter cascade
Fosforlu kalem|Highlighter
Odak büyüt|Focus zoom
Kelime netleş|Word focus
Kalp atışı|Heartbeat
Renk akışı|Color flow
Satırlar perdeden sırayla yükselir|Lines rise from behind a curtain
Parlak bir haleden netleşir|Settles out of a bright halo
Eğik ve hızlı giriş, sonra dikleşir|Fast slanted entrance that straightens
Harfler tek tek yukarıdan düşer|Letters fall in one by one
Söylenen kelimenin altını boyar|Highlights the sung word
Kelime neon tüp gibi titreyip yanar|Words flicker on like neon tubes
Söylenen kelime büyür, diğerleri soluk|The sung word grows, the rest dims
Her kelime söylenirken netleşir|Each word sharpens as it is sung
Söylenen kelime çift vuruşla atar|The sung word beats like a heart
Vurgu rengi yazıda sürekli akar|The accent color flows through the text
Oswald · Uzun başlık|Oswald · Tall headline
Caveat · El yazısı|Caveat · Handwritten
Anton · Güçlü vurgu|Anton · Bold statement
Aydınlanma|Illuminate
Ani Etki|Impact
Kırmızı Mercek|Red lens
Yumuşak Geçiş|Soft fade
Yaklaş|Zoom in
Uzaklaş|Zoom out
Soldan Kaydır|Slide from left
Sağdan Kaydır|Slide from right
Yukarı Kaydır|Slide up
Aşağı Kaydır|Slide down
Dönerek Açıl|Spin open
Işık Patlaması|Light burst
Rüya Odağı|Dream focus
Işık Taraması|Light scan
Dijital Arıza|Digital glitch
Renk Ayrılması|Color split
Sinyal Taraması|Signal scan
Sinyal Kayması|Signal shift
Dairesel Açılış|Circle reveal
Yatay Açılış|Horizontal reveal
Elmas Açılış|Diamond reveal
Dikey Dönüş|Vertical flip
Yatay Dönüş|Horizontal flip
Küp Dönüşü|Cube rotation
Kamera Sarsıntısı|Camera shake
Gönderi|Post
Dengeli|Balanced
Vokal|Vocal
Sol|Left
Sağ|Right
Stüdyo|Studio
Sinema|Cinema
Türler|Genres
Görünüm ve metin düzenleme, altyazı oluşturulunca açılır.|Style and text editing open once captions exist.
Pop Yıldızı|Pop Star
Rap Sahnesi|Rap Stage
Rock Gücü|Rock Power
Arabesk Gecesi|Arabesque Night
Lo-fi Oda|Lo-fi Room
EDM Neon|EDM Neon
R&B Kadife|R&B Velvet
Caz Kulübü|Jazz Club
Klasik Salon|Concert Hall
Türkü Sözü|Folk Lyric
Pop · söylenen kelime öne çıkar|Pop · the sung word steps forward
Rap · Anton ve vuruşla atan kelime|Rap · Anton with words that hit the beat
Rock · Oswald ve sert titreşim|Rock · Oswald with a hard shake
Arabesk & fantezi · sıcak ışıltı|Arabesque · a warm glow
Lo-fi · sakin, netleşen kelimeler|Lo-fi · calm words coming into focus
Elektronik · neon tüp gibi yanar|Electronic · lights up like neon
R&B & soul · akan mor tonlar|R&B & soul · flowing violet tones
Caz · perdeden yükselen satırlar|Jazz · lines rising from the curtain
Klasik & orkestra · zarif harf aralığı|Classical · graceful letter spacing
Türkü & halk · el yazısı ve kalem|Folk · handwriting and highlighter
Merkez|Center
Arka plan|Background
Çember|Circle
Çerçeve|Frame
Boyutlar kayıt tamamlanınca değiştirilebilir.|Dimensions can be changed after recording.
Dikey video kısa video platformları için uygundur.|Portrait video works well on short-form video platforms.
Alttaki araçlardan yazı, görüntü veya altyazı ekle.|Add text, media or captions from the workspaces.
Ses hazırlanıyor…|Preparing audio…
Video hazırlanıyor…|Preparing video…
Kaydı bitir|Finish recording
MP4 kaydet|Save MP4
Tam ekrandan çık|Exit fullscreen
Önizlemeyi göster|Show preview
Küçült|Collapse
CANLI ÖNİZLEME|LIVE PREVIEW
SAHNE ÖNİZLEMESİ|SCENE PREVIEW
DURAKLATILDI|PAUSED
Dinleme sesi kapalı|Playback muted
Dinleme sesi|Playback volume
Dinleme sesini aç|Unmute playback
Dinlemeyi sessize al|Mute playback
Ses düzeyi|Volume
Dosya hazırlanıyor…|Preparing file…
Kapak seç|Choose cover
Kapağı değiştir|Change cover
Görsel seç|Choose image
Geri dön|Back
Altyazı şablonu|Caption template
Çizgi|Line
Üç boyutlu|Three-dimensional
Koyu|Dark
Açık ton|Light
`
    .trim()
    .split("\n")
    .map((line) => {
      const at = line.indexOf("|");
      return [line.slice(0, at), line.slice(at + 1)];
    }),
);
