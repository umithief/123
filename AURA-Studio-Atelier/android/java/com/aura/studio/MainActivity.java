package com.aura.studio;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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
import org.json.JSONException;
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
    }

    private static boolean local(Uri uri) { return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()); }
    private WebResourceResponse asset(Uri uri) {
        if (!local(uri)) return null;
        String path = uri.getPath();
        if (path == null || path.contains("..") || path.contains("\\")) return missing();
        if (path.equals("/")) path = "/android/index.html";
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
                    en ? "You have not saved a project file. Your latest edit is kept on this device and can be restored from Last session on the home screen." : "Proje dosyası kaydetmedin. Son düzenlemen bu cihazda saklandı; Başlangıç ekranındaki Son oturum kartından geri yükleyebilirsin.", en);
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
        @JavascriptInterface public void keepAwake(final boolean on) {
            runOnUiThread(new Runnable() {
                @Override public void run() { if (root != null) root.setKeepScreenOn(on); }
            });
        }
        private synchronized void next() {
            if (active != null || queue.isEmpty() || isFinishing()) return;
            active = queue.remove();
            Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            save.addCategory(Intent.CATEGORY_OPENABLE); save.setType(active.mime);
            save.putExtra(Intent.EXTRA_TITLE, active.name);
            try { startActivityForResult(save, SAVE_FILE); }
            catch (ActivityNotFoundException error) { active.delete(); active = null; exportError("Kaydetme penceresi bulunamadı."); next(); }
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
