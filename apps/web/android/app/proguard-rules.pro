# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor reads each plugin's permission list from its @CapacitorPlugin /
# @Permission annotations at runtime. R8 full mode (AGP 8 default) drops
# annotation data unless the annotation types themselves are kept, and its
# bundled rules don't. Symptom without this: checkPermissions() resolves
# empty and requestPermissions() hangs with no dialog (release builds only).
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault
-keep @interface com.getcapacitor.annotation.** { *; }
