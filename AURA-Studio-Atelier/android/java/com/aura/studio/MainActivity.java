package com.aura.studio;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.*;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

/**
 * Offline-first WebView shell. No storage permission: imports/exports use Android's picker.
 * Written without lambdas so the class files also dex with the Debian `dx` tool chain.
 */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int PICK_FILE = 10, SAVE_FILE = 11, MICROPHONE = 12;
    private WebView web;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest microphoneRequest;
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private final Downloads downloads = new Downloads();
    private final ExecutorService files = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private int backRequest;
    /** Files other apps shared with or opened in AURA, served once to the page. */
    private final Map<String, Incoming> incoming = new LinkedHashMap<>();
    private volatile String language = "tr";

    private static final class Incoming {
        final Uri uri; final String name, mime;
        boolean taken;
        Incoming(Uri uri, String name, String mime) { this.uri = uri; this.name = name; this.mime = mime; }
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(245, 244, 239));
        getWindow().setNavigationBarColor(Color.rgb(245, 244, 239));
        root = new FrameLayout(this);
        // The studio asks for the screen to stay on only while it plays, exports or analyses.
        root.setKeepScreenOn(false);
        root.setBackgroundColor(Color.rgb(245, 244, 239));
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
                    Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
                    view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                    // The root owns system/IME spacing; do not apply it again inside WebView.
                    return WindowInsets.CONSUMED;
                }
            });
        }
        web = new WebView(this);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        File exportCache = new File(getCacheDir(), "exports");
        File[] orphaned = exportCache.listFiles();
        if (orphaned != null) for (File file : orphaned) file.delete();
        cleanShared();
        web.setBackgroundColor(Color.rgb(245, 244, 239));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        // A document picker returns after the original tap's activation expires.
        // Media remains controlled by the studio; only our bundled page is loaded.
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.addJavascriptInterface(downloads, "AuraAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                root.removeView(view);
                view.destroy();
                web = null;
                new AlertDialog.Builder(MainActivity.this)
                    .setTitle("AURA Studio yeniden açılmalı")
                    .setMessage("Görüntüleme motoru durdu. Uygulamayı yeniden açın; son düzenlemeniz Başlangıç ekranındaki Son oturum kartından geri yüklenebilir. Sorun sürerse Android System WebView güncellemesini kontrol edin.")
                    .setPositiveButton("Yeniden aç", new android.content.DialogInterface.OnClickListener() {
                        @Override public void onClick(android.content.DialogInterface dialog, int which) { recreate(); }
                    })
                    .setNegativeButton("Kapat", new android.content.DialogInterface.OnClickListener() {
                        @Override public void onClick(android.content.DialogInterface dialog, int which) { finish(); }
                    })
                    .setCancelable(false).show();
                return true;
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return asset(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (local(request.getUrl())) return false;
                if (request.isForMainFrame() && request.hasGesture()) openExternal(request.getUrl());
                return true;
            }
        });
        ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                return asset(request.getUrl());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.setType("*/*");
                List<String> types = new ArrayList<>();
                for (String accept : params.getAcceptTypes()) {
                    for (String item : accept.split(",")) {
                        item = item.trim();
                        if (item.startsWith(".")) item = MimeTypeMap.getSingleton().getMimeTypeFromExtension(item.substring(1));
                        if (item != null && item.contains("/")) types.add(item);
                    }
                }
                if (!types.isEmpty()) picker.putExtra(Intent.EXTRA_MIME_TYPES, types.toArray(new String[0]));
                picker.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try { startActivityForResult(picker, PICK_FILE); }
                catch (ActivityNotFoundException error) { callback.onReceiveValue(null); fileCallback = null; show("Dosya seçici bulunamadı."); }
                return true;
            }
            @Override public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override public void run() {
                        if (!local(request.getOrigin()) || !Arrays.asList(request.getResources()).contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                            request.deny(); return;
                        }
                        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                            request.grant(new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
                        } else {
                            if (microphoneRequest != null) microphoneRequest.deny();
                            microphoneRequest = request;
                            requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, MICROPHONE);
                        }
                    }
                });
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                if (microphoneRequest == request) microphoneRequest = null;
            }
            @Override public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullscreenView != null) { callback.onCustomViewHidden(); return; }
                fullscreenView = view; fullscreenCallback = callback;
                root.addView(view, new FrameLayout.LayoutParams(-1, -1)); web.setVisibility(View.GONE);
            }
            @Override public void onHideCustomView() { leaveFullscreen(); }
        });
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        java.util.regex.Matcher version = java.util.regex.Pattern.compile("Chrome/(\\d+)").matcher(settings.getUserAgentString());
        if (version.find() && Integer.parseInt(version.group(1)) < 120) {
            final android.content.pm.PackageInfo provider = WebView.getCurrentWebViewPackage();
            new AlertDialog.Builder(this)
                .setTitle("Görüntüleme bileşeni güncellenmeli")
                .setMessage("AURA Studio için bu telefondaki Android System WebView bileşenini güncelleyin, ardından uygulamayı yeniden açın.")
                .setPositiveButton("Uygulama ayarları", new android.content.DialogInterface.OnClickListener() {
                    @Override public void onClick(android.content.DialogInterface dialog, int which) {
                        if (provider != null) {
                            try { startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + provider.packageName))); }
                            catch (ActivityNotFoundException ignored) {}
                        }
                        finish();
                    }
                })
                .setNegativeButton("Kapat", new android.content.DialogInterface.OnClickListener() {
                    @Override public void onClick(android.content.DialogInterface dialog, int which) { finish(); }
                })
                .setCancelable(false).show();
            return;
        }
        web.loadUrl("https://" + HOST + "/android/index.html");
        // A recreated activity must not import the same shared file again.
        if (state == null) receive(getIntent());
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        receive(intent);
    }
    private boolean en() { return "en".equals(language); }

    /** Share/Open with: the page fetches the file from /__incoming/<id>, nothing is copied. */
    private void receive(Intent intent) {
        if (intent == null || web == null) return;
        Uri uri = null;
        if (Intent.ACTION_SEND.equals(intent.getAction())) {
            Object stream = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (stream instanceof Uri) uri = (Uri) stream;
            else if (intent.getClipData() != null && intent.getClipData().getItemCount() > 0) uri = intent.getClipData().getItemAt(0).getUri();
        } else if (Intent.ACTION_VIEW.equals(intent.getAction())) uri = intent.getData();
        setIntent(new Intent(Intent.ACTION_MAIN));
        if (uri == null || !"content".equals(uri.getScheme())) return;
        String name = null;
        try (android.database.Cursor cursor = getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) name = cursor.getString(0);
        } catch (Exception ignored) {}
        String mime = null;
        try { mime = getContentResolver().getType(uri); } catch (Exception ignored) {}
        if (mime == null) mime = intent.getType();
        if (mime == null || !mime.matches("[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+")) mime = "application/octet-stream";
        if (name == null || name.trim().isEmpty()) name = uri.getLastPathSegment();
        if (name == null || name.trim().isEmpty()) name = "aura-dosya";
        name = name.replaceAll("[\\\\/\\x00-\\x1f]", "_");
        if (name.length() > 100) name = name.substring(name.length() - 100);
        synchronized (incoming) {
            // Only the latest shared file is kept; older unread ones are dropped.
            incoming.clear();
            incoming.put(UUID.randomUUID().toString(), new Incoming(uri, name, mime));
        }
        web.evaluateJavascript("window.dispatchEvent(new Event('aura-incoming'))", null);
    }
    private WebResourceResponse incomingResponse(String id) {
        Incoming item;
        synchronized (incoming) { item = incoming.get(id); }
        if (item == null) return missing();
        try {
            InputStream input = getContentResolver().openInputStream(item.uri);
            if (input == null) return missing();
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-store");
            headers.put("X-Content-Type-Options", "nosniff");
            return new WebResourceResponse(item.mime, null, 200, "OK", headers, input);
        } catch (Exception error) { return missing(); }
    }
    private void cleanShared() {
        // Shared exports stay readable for the receiving app for a day.
        File[] old = ExportProvider.sharedDir(getCacheDir()).listFiles();
        if (old == null) return;
        long limit = System.currentTimeMillis() - 24L * 60 * 60 * 1000;
        for (File dir : old) {
            if (dir.lastModified() > limit) continue;
            File[] inner = dir.listFiles();
            if (inner != null) for (File file : inner) file.delete();
            dir.delete();
        }
    }

    private static boolean local(Uri uri) { return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()); }
    private WebResourceResponse asset(Uri uri) {
        if (!local(uri)) return null;
        String path = uri.getPath();
        if (path == null || path.contains("..") || path.contains("\\")) return missing();
        if (path.equals("/")) path = "/android/index.html";
        if (path.startsWith("/__incoming/")) return incomingResponse(path.substring("/__incoming/".length()));
        String extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        if (extension.equals("js") || extension.equals("mjs")) mime = "text/javascript";
        if (extension.equals("wasm")) mime = "application/wasm";
        if (extension.equals("woff2")) mime = "font/woff2";
        if (extension.equals("webmanifest")) mime = "application/manifest+json";
        if (mime == null) mime = "application/octet-stream";
        try {
            InputStream input = getAssets().open("web" + path);
            Map<String, String> headers = new HashMap<>();
            headers.put("Access-Control-Allow-Origin", "https://" + HOST);
            headers.put("X-Content-Type-Options", "nosniff");
            return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers, input);
        } catch (IOException error) { return missing(); }
    }
    private WebResourceResponse missing() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
    private void openExternal(Uri uri) {
        if (!"https".equals(uri.getScheme()) && !"http".equals(uri.getScheme())) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (ActivityNotFoundException error) { show("Bağlantıyı açacak uygulama bulunamadı."); }
    }
    private void show(final String message) {
        runOnUiThread(new Runnable() {
            @Override public void run() { Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show(); }
        });
    }
    private void exportError(final String message) {
        show(message);
        runOnUiThread(new Runnable() {
            @Override public void run() {
                if (web != null) web.evaluateJavascript("window.dispatchEvent(new CustomEvent('aura-export-error',{detail:" + org.json.JSONObject.quote(message) + "}))", null);
            }
        });
    }
    private void leaveFullscreen() {
        if (fullscreenView == null) return;
        root.removeView(fullscreenView); fullscreenView = null; web.setVisibility(View.VISIBLE);
        if (fullscreenCallback != null) fullscreenCallback.onCustomViewHidden();
        fullscreenCallback = null;
    }
    /** Back closes the studio's open panel first; leaving with unsaved or exporting work asks first. */
    @Override public void onBackPressed() {
        if (fullscreenView != null) { leaveFullscreen(); return; }
        if (web == null) { super.onBackPressed(); return; }
        final int request = ++backRequest;
        // A page that does not answer (still loading, hung) must not trap the user.
        main.postDelayed(new Runnable() {
            @Override public void run() { if (request == backRequest) { backRequest++; leave(); } }
        }, 1500);
        web.evaluateJavascript("typeof window.auraBack==='function'?window.auraBack():null", new ValueCallback<String>() {
            @Override public void onReceiveValue(String value) {
                if (request != backRequest) return;
                backRequest++;
                handleBack(value);
            }
        });
    }
    private void handleBack(String value) {
        String result = "";
        try {
            Object parsed = new JSONTokener(value == null ? "null" : value).nextValue();
            if (parsed instanceof String) result = (String) parsed;
        } catch (JSONException ignored) {}
        String[] parts = result.split("\\|");
        boolean en = parts.length > 1 && "en".equals(parts[1]);
        switch (parts[0]) {
            case "handled": return;
            case "saving":
                show(en ? "Saving your work… Press back again in a moment." : "Çalışman kaydediliyor… Birazdan geri tuşuna tekrar bas.");
                return;
            case "busy":
                confirmLeave(en ? "Export in progress" : "Dışa aktarma sürüyor",
                    en ? "Recording needs AURA Studio on screen. Leaving now may stop or damage the export." : "Kayıt için AURA Studio ekranda kalmalı. Şimdi çıkarsan dışa aktarma durabilir veya bozulabilir.", en);
                return;
            case "unsaved":
                confirmLeave(en ? "Leave AURA Studio?" : "AURA Studio'dan çıkılsın mı?",
                    en ? "Your latest edit could not be kept in My projects (storage may be full). Save a project file first if you want to keep it." : "Son düzenlemen Projelerim'e kaydedilemedi (depolama dolu olabilir). Korumak istiyorsan önce proje dosyası kaydet.", en);
                return;
            default:
                if (web != null && web.canGoBack()) web.goBack(); else leave();
        }
    }
    private void confirmLeave(String title, String message, boolean en) {
        if (isFinishing()) return;
        new AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton(en ? "Stay" : "Kal", null)
            .setNegativeButton(en ? "Leave" : "Çık", new android.content.DialogInterface.OnClickListener() {
                @Override public void onClick(android.content.DialogInterface dialog, int which) { leave(); }
            })
            .show();
    }
    private void leave() {
        if (fullscreenView != null) leaveFullscreen();
        super.onBackPressed();
    }
    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == MICROPHONE && microphoneRequest != null) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) microphoneRequest.grant(new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
            else microphoneRequest.deny();
            microphoneRequest = null;
        }
    }
    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == PICK_FILE && fileCallback != null) {
            Uri[] chosen = null;
            if (result == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    chosen = new Uri[data.getClipData().getItemCount()];
                    for (int i = 0; i < chosen.length; i++) chosen[i] = data.getClipData().getItemAt(i).getUri();
                } else if (data.getData() != null) chosen = new Uri[] { data.getData() };
            }
            fileCallback.onReceiveValue(chosen); fileCallback = null;
        }
        if (code == SAVE_FILE) downloads.saved(result == RESULT_OK && data != null ? data.getData() : null);
    }
    @Override protected void onDestroy() {
        main.removeCallbacksAndMessages(null);
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (microphoneRequest != null) microphoneRequest.deny();
        downloads.clear(); files.shutdown();
        if (web != null) { web.removeJavascriptInterface("AuraAndroid"); web.destroy(); web = null; }
        super.onDestroy();
    }

    private static final class Export {
        final String id, name, mime;
        final File file;
        final long expected;
        long written;
        FileOutputStream stream;
        Export(String id, String name, String mime, File file, long expected) throws IOException {
            this.id = id; this.name = name; this.mime = mime; this.file = file; this.expected = expected;
            stream = new FileOutputStream(file);
        }
        void close() { try { if (stream != null) stream.close(); } catch (IOException ignored) {} stream = null; }
        void delete() { close(); file.delete(); }
    }
    public final class Downloads {
        private final Map<String, Export> pending = new HashMap<>();
        private final ArrayDeque<Export> queue = new ArrayDeque<>();
        private Export active;
        @JavascriptInterface public synchronized String beginDownload(String name, String mime, long size) {
            if (size < 0 || size > 256L * 1024 * 1024 || pending.size() + queue.size() + (active == null ? 0 : 1) >= 3) return "";
            try {
                name = name.replaceAll("[\\\\/\\x00-\\x1f]", "_");
                if (name.length() > 128) name = name.substring(name.length() - 128);
                if (name.trim().isEmpty()) name = "aura-export";
                if (!mime.matches("[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+")) mime = "application/octet-stream";
                String id = UUID.randomUUID().toString();
                File dir = new File(getCacheDir(), "exports"); dir.mkdirs();
                Export item = new Export(id, name, mime, new File(dir, id), size);
                pending.put(id, item); return id;
            } catch (Exception error) { return ""; }
        }
        @JavascriptInterface public synchronized boolean appendDownload(String id, String encoded) {
            Export item = pending.get(id);
            if (item == null || encoded == null || encoded.length() > 180000) return false;
            try {
                byte[] bytes = Base64.decode(encoded, Base64.NO_WRAP);
                if (item.written + bytes.length > item.expected) return false;
                item.stream.write(bytes); item.written += bytes.length; return true;
            } catch (Exception error) { abortDownload(id); return false; }
        }
        @JavascriptInterface public synchronized boolean finishDownload(String id) {
            Export item = pending.remove(id);
            if (item == null) return false;
            item.close();
            if (item.written != item.expected) { item.delete(); return false; }
            queue.add(item);
            runOnUiThread(new Runnable() { @Override public void run() { next(); } });
            return true;
        }
        @JavascriptInterface public synchronized void abortDownload(String id) {
            Export item = pending.remove(id); if (item != null) item.delete();
        }
        @JavascriptInterface public String takeIncoming() {
            JSONArray list = new JSONArray();
            synchronized (incoming) {
                for (Map.Entry<String, Incoming> entry : incoming.entrySet()) {
                    if (entry.getValue().taken) continue;
                    entry.getValue().taken = true;
                    try { list.put(new JSONObject().put("id", entry.getKey()).put("name", entry.getValue().name).put("type", entry.getValue().mime)); }
                    catch (JSONException ignored) {}
                }
            }
            return list.toString();
        }
        @JavascriptInterface public void releaseIncoming(String id) {
            synchronized (incoming) { incoming.remove(id); }
        }
        @JavascriptInterface public void setLanguage(String value) { language = "en".equals(value) ? "en" : "tr"; }
        @JavascriptInterface public void keepAwake(final boolean on) {
            runOnUiThread(new Runnable() {
                @Override public void run() { if (root != null) root.setKeepScreenOn(on); }
            });
        }
        /** Each finished export asks where it goes: gallery, another app, or a chosen folder. */
        private synchronized void next() {
            if (active != null || queue.isEmpty() || isFinishing()) return;
            final Export item = active = queue.remove();
            final boolean en = en();
            final String collection = galleryFolder(item.mime);
            final List<String> labels = new ArrayList<>();
            final List<Runnable> actions = new ArrayList<>();
            if (collection != null) {
                boolean music = item.mime.startsWith("audio/");
                labels.add(en ? (music ? "Save to Music" : "Save to gallery") : (music ? "Müzik klasörüne kaydet" : "Galeriye kaydet"));
                actions.add(new Runnable() { @Override public void run() { saveToGallery(item, collection); } });
            }
            labels.add(en ? "Share…" : "Paylaş…");
            actions.add(new Runnable() { @Override public void run() { share(item); } });
            labels.add(en ? "Save to a folder…" : "Klasöre kaydet…");
            actions.add(new Runnable() { @Override public void run() { chooseFolder(item); } });
            new AlertDialog.Builder(MainActivity.this)
                .setTitle(item.name)
                .setItems(labels.toArray(new String[0]), new DialogInterface.OnClickListener() {
                    @Override public void onClick(DialogInterface dialog, int which) { actions.get(which).run(); }
                })
                .setNegativeButton(en ? "Cancel" : "Vazgeç", new DialogInterface.OnClickListener() {
                    @Override public void onClick(DialogInterface dialog, int which) { dialog.cancel(); }
                })
                .setOnCancelListener(new DialogInterface.OnCancelListener() {
                    @Override public void onCancel(DialogInterface dialog) { finishActive(item); }
                })
                .show();
        }
        private synchronized void finishActive(Export item) {
            if (active == item) { item.delete(); active = null; }
            next();
        }
        private synchronized void chooseFolder(Export item) {
            Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            save.addCategory(Intent.CATEGORY_OPENABLE); save.setType(item.mime);
            save.putExtra(Intent.EXTRA_TITLE, item.name);
            try { startActivityForResult(save, SAVE_FILE); }
            catch (ActivityNotFoundException error) { finishActive(item); exportError(en() ? "No save window is available." : "Kaydetme penceresi bulunamadı."); }
        }
        /** MediaStore folders need no storage permission on Android 10+. */
        private String galleryFolder(String mime) {
            if (Build.VERSION.SDK_INT < 29) return null;
            if (mime.startsWith("video/")) return Environment.DIRECTORY_MOVIES + "/AURA Studio";
            if (mime.startsWith("image/")) return Environment.DIRECTORY_PICTURES + "/AURA Studio";
            if (mime.startsWith("audio/")) return Environment.DIRECTORY_MUSIC + "/AURA Studio";
            return null;
        }
        private synchronized void saveToGallery(final Export item, final String folder) {
            active = null;
            final boolean en = en();
            files.execute(new Runnable() {
                @Override public void run() {
                    Uri target = null;
                    try {
                        Uri collection = item.mime.startsWith("video/") ? MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                            : item.mime.startsWith("image/") ? MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                            : MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.MediaColumns.DISPLAY_NAME, item.name);
                        values.put(MediaStore.MediaColumns.MIME_TYPE, item.mime);
                        values.put(MediaStore.MediaColumns.RELATIVE_PATH, folder);
                        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                        target = getContentResolver().insert(collection, values);
                        if (target == null) throw new IOException("No gallery entry");
                        try (InputStream input = new FileInputStream(item.file); OutputStream output = getContentResolver().openOutputStream(target, "w")) {
                            if (output == null) throw new IOException("No output");
                            byte[] buffer = new byte[64 * 1024]; int read;
                            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                        }
                        values.clear();
                        values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                        getContentResolver().update(target, values, null, null);
                        show(en ? item.name + " saved to " + folder + "." : item.name + " kaydedildi: " + folder.replace("Movies", "Filmler").replace("Pictures", "Resimler").replace("Music", "Müzik"));
                    } catch (Exception error) {
                        if (target != null) try { getContentResolver().delete(target, null, null); } catch (Exception ignored) {}
                        exportError(en ? "Could not save to the gallery. Try Save to a folder." : "Galeriye kaydedilemedi. Klasöre kaydet seçeneğini deneyin.");
                    } finally { item.delete(); }
                }
            });
            next();
        }
        private synchronized void share(Export item) {
            active = null;
            boolean en = en();
            try {
                File dir = new File(ExportProvider.sharedDir(getCacheDir()), item.id);
                if (!dir.mkdirs() && !dir.isDirectory()) throw new IOException("No share folder");
                String name = item.name.replace('/', '_');
                File shared = new File(dir, name);
                item.close();
                if (!item.file.renameTo(shared)) throw new IOException("Move failed");
                Uri uri = ExportProvider.uriFor(item.id, name);
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType(item.mime);
                send.putExtra(Intent.EXTRA_STREAM, uri);
                send.setClipData(ClipData.newRawUri(name, uri));
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(send, en ? "Share " + name : name + " paylaş"));
            } catch (Exception error) {
                item.delete();
                exportError(en ? "Could not open sharing. Try Save to a folder." : "Paylaşım açılamadı. Klasöre kaydet seçeneğini deneyin.");
            }
            next();
        }
        private synchronized void saved(final Uri uri) {
            final Export item = active; active = null;
            if (item != null) {
                if (uri == null) item.delete();
                else files.execute(new Runnable() {
                    @Override public void run() {
                        try (InputStream input = new FileInputStream(item.file); OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
                            if (output == null) throw new IOException("No output");
                            byte[] buffer = new byte[64 * 1024]; int read;
                            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                            show(item.name + " kaydedildi.");
                        } catch (Exception error) { exportError("Dosya kaydedilemedi. Başka bir klasör seçerek yeniden deneyin."); }
                        finally { item.delete(); }
                    }
                });
            }
            next();
        }
        private synchronized void clear() {
            for (Export item : pending.values()) item.delete(); pending.clear();
            for (Export item : queue) item.delete(); queue.clear();
            if (active != null) active.delete(); active = null;
        }
    }
}
