package app.hairbeforelong;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.DisplayCutout;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity implements SensorEventListener {
    private static final String ALBUM = "在头发长长之前";

    private WebView web;
    private SensorManager sensors;
    private Sensor gravity;
    private Vibrator vibrator;
    private volatile float tiltX = 0, tiltY = 1;
    private int insetTop = 0, insetBottom = 0;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        Window w = getWindow();
        w.setBackgroundDrawableResource(R.color.paper);
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = w.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            w.setAttributes(lp);
        }

        sensors = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensors != null) gravity = sensors.getDefaultSensor(Sensor.TYPE_GRAVITY);
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        web = new WebView(this);
        web.setBackgroundColor(0xFFF7E7DC);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                return true; // 哪里也不去
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                pushInsets();
            }
        });
        web.setOnApplyWindowInsetsListener((v, insets) -> {
            readInsets(insets);
            pushInsets();
            return insets;
        });
        setContentView(web);
        hideBars();
        web.loadUrl("file:///android_asset/index.html");
    }

    private void readInsets(WindowInsets insets) {
        int top = 0, bottom = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            DisplayCutout c = insets.getDisplayCutout();
            if (c != null) {
                top = c.getSafeInsetTop();
                bottom = c.getSafeInsetBottom();
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            android.graphics.Insets ge = insets.getInsets(WindowInsets.Type.systemBars());
            top = Math.max(top, ge.top);
            bottom = Math.max(bottom, ge.bottom);
        }
        insetTop = top;
        insetBottom = bottom;
    }

    private void pushInsets() {
        float d = getResources().getDisplayMetrics().density;
        web.evaluateJavascript("window.setSafeInsets&&setSafeInsets(" + Math.round(insetTop / d) + "," + Math.round(insetBottom / d) + ")", null);
    }

    private void hideBars() {
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            w.setDecorFitsSystemWindows(false);
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (sensors != null && gravity != null) sensors.registerListener(this, gravity, SensorManager.SENSOR_DELAY_GAME);
        web.onResume();
        web.resumeTimers();
        web.evaluateJavascript("window.onAppResume&&onAppResume()", null);
    }

    @Override
    protected void onPause() {
        if (sensors != null) sensors.unregisterListener(this);
        web.evaluateJavascript("window.onAppPause&&onAppPause()", null);
        web.onPause();
        web.pauseTimers();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.onAppBack?window.onAppBack():false", v -> {
            if (!"true".equals(v)) moveTaskToBack(true);
        });
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        tiltX = Math.max(-1f, Math.min(1f, -e.values[0] / 9.81f));
        tiltY = Math.max(-1f, Math.min(1f, e.values[1] / 9.81f));
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) { }

    /** 网页这边能用到的全部本机能力 */
    private class Bridge {
        @JavascriptInterface
        public void vibrate(int ms, int amp) {
            if (vibrator == null || !vibrator.hasVibrator()) return;
            int a = Math.max(1, Math.min(255, amp));
            vibrator.vibrate(VibrationEffect.createOneShot(Math.max(1, ms), a));
        }

        @JavascriptInterface
        public String tilt() {
            return tiltX + "," + tiltY;
        }

        @JavascriptInterface
        public boolean saveImage(String dataUrl, String name) {
            try {
                int comma = dataUrl.indexOf(',');
                byte[] bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);
                String file = name + ".png";
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver r = getContentResolver();
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Images.Media.DISPLAY_NAME, file);
                    v.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                    v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + ALBUM);
                    v.put(MediaStore.Images.Media.IS_PENDING, 1);
                    Uri uri = r.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) return false;
                    try (OutputStream o = r.openOutputStream(uri)) {
                        if (o == null) return false;
                        o.write(bytes);
                    }
                    v.clear();
                    v.put(MediaStore.Images.Media.IS_PENDING, 0);
                    r.update(uri, v, null, null);
                    return true;
                }
                if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 7));
                    return false;
                }
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), ALBUM);
                if (!dir.exists() && !dir.mkdirs()) return false;
                File f = new File(dir, file);
                try (FileOutputStream o = new FileOutputStream(f)) {
                    o.write(bytes);
                }
                MediaScannerConnection.scanFile(MainActivity.this, new String[]{f.getAbsolutePath()}, new String[]{"image/png"}, null);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void exit() {
            runOnUiThread(MainActivity.this::finish);
        }
    }
}
