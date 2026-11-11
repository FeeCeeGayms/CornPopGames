#!/usr/bin/env bash
# Builds a debug-signed CornKart APK without Gradle, using only the Android
# build-tools (aapt2, dx, zipalign, apksigner), javac and an android.jar.
#
#   ./build-apk.sh                 # web files from the folder above (../index.html, ../game.js, ../assets)
#   WEB=../dist ./build-apk.sh     # or from another web build
#
# Override tool locations with ANDROID_JAR=... and BUILD_TOOLS=... if needed.
set -euo pipefail
cd "$(dirname "$0")"
HERE=$(pwd)
WEB=${WEB:-..}
OUT=${OUT:-$HERE/build}
SDK=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/usr/lib/android-sdk}}
ANDROID_JAR=${ANDROID_JAR:-$(ls -d "$SDK"/platforms/android-*/android.jar | sort -V | tail -1)}
BUILD_TOOLS=${BUILD_TOOLS:-$(ls -d "$SDK"/build-tools/[0-9]* | sort -V | tail -1)}
MAIN=app/src/main

echo "android.jar: $ANDROID_JAR"
echo "build-tools: $BUILD_TOOLS"
for f in index.html game.js assets/apu.js assets/cornpop.js assets/beardy.js assets/peepo.js assets/honkler.js assets/qoq.js assets/sounds.js; do
  [ -f "$WEB/$f" ] || { echo "Missing $WEB/$f: build the web version first (node build.mjs)"; exit 1; }
done

rm -rf "$OUT" && mkdir -p "$OUT"/{res,gen,classes} "$MAIN/assets"

# 1. Web game into the APK assets, with fonts bundled so it works offline.
rm -rf "$MAIN/assets"/* && mkdir -p "$MAIN/assets/assets"
cp "$WEB/game.js" "$MAIN/assets/"
cp "$WEB"/assets/*.js "$MAIN/assets/assets/"   # every racer model and the sample bank
mkdir -p "$MAIN/assets/assets/music" && cp "$WEB"/assets/music/*.js "$MAIN/assets/assets/music/"   # the songs
cp -r web-overrides/fonts web-overrides/fonts.css "$MAIN/assets/"
sed -e '/fonts.googleapis.com\/css2/c\<link rel="stylesheet" href="fonts.css">' \
    -e '/rel="preconnect"/d' "$WEB/index.html" > "$MAIN/assets/index.html"

# 2. Resources and manifest (Gradle takes the package name from app/build.gradle; we add it here).
sed 's#<manifest #<manifest package="com.cornkart.game" #' "$MAIN/AndroidManifest.xml" > "$OUT/AndroidManifest.xml"
"$BUILD_TOOLS/aapt2" compile --dir "$MAIN/res" -o "$OUT/res/res.zip"
"$BUILD_TOOLS/aapt2" link -o "$OUT/unsigned.apk" -I "$ANDROID_JAR" \
  --manifest "$OUT/AndroidManifest.xml" -A "$MAIN/assets" \
  --java "$OUT/gen" --version-code 19 --version-name 19.0 --min-sdk-version 24 --target-sdk-version 34 \
  "$OUT/res/res.zip"

# 3. Java to dex.
javac -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -nowarn -Xlint:-options \
  -d "$OUT/classes" $(find "$MAIN/java" "$OUT/gen" -name '*.java')
"$BUILD_TOOLS/dx" --dex --min-sdk-version=24 --output="$OUT/classes.dex" "$OUT/classes"
(cd "$OUT" && zip -q unsigned.apk classes.dex)

# 4. Align and sign with a debug key.
KEY=${KEYSTORE:-$HERE/debug.keystore}
if [ ! -f "$KEY" ]; then
  keytool -genkeypair -keystore "$KEY" -storepass android -keypass android -alias androiddebugkey \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US" >/dev/null 2>&1
fi
"$BUILD_TOOLS/zipalign" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
"$BUILD_TOOLS/apksigner" sign --ks "$KEY" --ks-pass pass:android --key-pass pass:android \
  --out "$HERE/CornKart-debug.apk" "$OUT/aligned.apk"
"$BUILD_TOOLS/apksigner" verify "$HERE/CornKart-debug.apk"
echo "Built $HERE/CornKart-debug.apk ($(du -h "$HERE/CornKart-debug.apk" | cut -f1))"
