# BelieversFlow ProGuard Rules

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class com.capacitor.** { *; }

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep the app's MainActivity
-keep class com.believersguidelite.app.MainActivity { *; }

# Suppress warnings for missing annotations
-dontwarn javax.annotation.**
