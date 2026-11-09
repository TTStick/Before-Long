#!/bin/bash
# 不依赖 Gradle，直接用 SDK 自带工具打包
set -euo pipefail
cd "$(dirname "$0")"

SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
BT="$SDK/build-tools/35.0.0"
PLATFORM="$SDK/platforms/android-35/android.jar"
VERSION_CODE="${VERSION_CODE:-1}"
VERSION_NAME="${VERSION_NAME:-1.0}"
OUT="../在头发长长之前.apk"

rm -rf build
mkdir -p build/compiled build/gen build/classes build/dex build/assets

python3 make_icon.py

# 游戏本体（不带测试页）
cp -R ../game/. build/assets/
rm -f build/assets/test.html

"$BT/aapt2" compile --dir res -o build/compiled/res.zip
"$BT/aapt2" link -o build/base.apk \
  -I "$PLATFORM" \
  --manifest AndroidManifest.xml \
  -A build/assets \
  --java build/gen \
  --min-sdk-version 26 --target-sdk-version 35 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  build/compiled/res.zip

javac --release 8 -nowarn -Xlint:-options -classpath "$PLATFORM" -d build/classes \
  $(find src build/gen -name '*.java')

"$BT/d8" --release --min-api 26 --lib "$PLATFORM" --output build/dex \
  $(find build/classes -name '*.class')

cp build/base.apk build/unsigned.apk
(cd build/dex && zip -q -j ../unsigned.apk classes.dex)

"$BT/zipalign" -f -p 4 build/unsigned.apk build/aligned.apk

KS=hair.keystore
if [ ! -f "$KS" ]; then
  keytool -genkeypair -v -keystore "$KS" -alias hair -keyalg RSA -keysize 2048 -validity 12000 \
    -storepass hairbeforelong -keypass hairbeforelong -dname "CN=Hair Before Long" >/dev/null 2>&1
fi

"$BT/apksigner" sign --ks "$KS" --ks-pass pass:hairbeforelong --key-pass pass:hairbeforelong \
  --v1-signing-enabled false --v2-signing-enabled true --v3-signing-enabled true \
  --out "$OUT" build/aligned.apk
"$BT/apksigner" verify --print-certs "$OUT" | head -3
ls -la "$OUT"
