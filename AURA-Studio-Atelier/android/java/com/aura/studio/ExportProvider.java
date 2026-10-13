package com.aura.studio;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import android.webkit.MimeTypeMap;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;
import java.util.Locale;

/**
 * Read-only access to finished exports for the Android share sheet. Only files under
 * cache/shared are reachable, and only by apps the share intent granted the URI to.
 */
public final class ExportProvider extends ContentProvider {
    static final String AUTHORITY = "com.aura.studio.exports";

    static Uri uriFor(String id, String name) {
        return new Uri.Builder().scheme("content").authority(AUTHORITY).appendPath(id).appendPath(name).build();
    }
    static File sharedDir(File cache) { return new File(cache, "shared"); }

    private File resolve(Uri uri) throws FileNotFoundException {
        List<String> parts = uri.getPathSegments();
        if (getContext() == null || parts.size() != 2) throw new FileNotFoundException();
        try {
            File base = sharedDir(getContext().getCacheDir()).getCanonicalFile();
            File file = new File(new File(base, parts.get(0)), parts.get(1)).getCanonicalFile();
            if (!file.getPath().startsWith(base.getPath() + File.separator) || !file.isFile()) throw new FileNotFoundException();
            return file;
        } catch (IOException error) { throw new FileNotFoundException(); }
    }

    @Override public boolean onCreate() { return true; }
    @Override public String getType(Uri uri) {
        String name = uri.getLastPathSegment();
        if (name == null || name.lastIndexOf('.') < 0) return "application/octet-stream";
        String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT));
        return mime == null ? "application/octet-stream" : mime;
    }
    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (!"r".equals(mode)) throw new FileNotFoundException("Read only");
        return ParcelFileDescriptor.open(resolve(uri), ParcelFileDescriptor.MODE_READ_ONLY);
    }
    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] args, String order) {
        File file;
        try { file = resolve(uri); } catch (FileNotFoundException error) { return null; }
        if (projection == null) projection = new String[] { OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE };
        MatrixCursor cursor = new MatrixCursor(projection, 1);
        Object[] row = new Object[projection.length];
        for (int i = 0; i < projection.length; i++) {
            if (OpenableColumns.DISPLAY_NAME.equals(projection[i])) row[i] = file.getName();
            else if (OpenableColumns.SIZE.equals(projection[i])) row[i] = file.length();
        }
        cursor.addRow(row);
        return cursor;
    }
    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] args) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri uri, String selection, String[] args) { throw new UnsupportedOperationException(); }
}
