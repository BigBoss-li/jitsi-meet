#!/bin/bash

set -e

echo "📱 Checking connected Android devices..."
adb devices | sed -n '2p'

echo "🚀 Step 1: Build Jitsi Meet Android SDK"

JITSI_DIR="/Users/lizhuangzhi/workspace/CHENSHEN/jitsi-meet"
MAVEN_REPO="/Users/lizhuangzhi/software/mvnRepo"

cd "$JITSI_DIR"
if ! UV_THREADPOOL_SIZE=2 ./android/scripts/release-sdk.sh "$MAVEN_REPO"; then
  echo "❌ Jitsi SDK build failed"
#   exit 1
fi

echo "✅ Jitsi SDK build finished"
echo "----------------------------------"

echo "🚀 Step 2: Build & Run MeetingApp on connected phone"

MEETING_APP_DIR="/Users/lizhuangzhi/workspace/CHENSHEN/solar-centaur-chiron-android/MeetingApp"
cd "$MEETING_APP_DIR"

# chmod +x ./gradlew

# 清理旧构建
./gradlew clean

# 安装并运行 Debug 到「已连接的真机」
./gradlew installStagingDebug

echo "🎉 App installed on your connected phone!"
echo "👉 如果没有自动打开，请在手机上手动点 App 图标"