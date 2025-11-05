# APK Build Troubleshooting Guide

## Memory Issues

### Error: "Could not reserve enough space for XXXX object heap"

**Solution**: The Gradle build process is trying to allocate too much memory. This has been fixed by reducing the memory allocation in `gradle.properties`.

If you still encounter this issue:

1. **Check available RAM**: Make sure you have at least 2GB of free RAM
2. **Close other applications**: Close memory-intensive applications
3. **Reduce memory further**: Edit `gradle.properties` and change `-Xmx512m` to `-Xmx384m` or `-Xmx256m`
4. **Disable Gradle daemon**: Add `org.gradle.daemon=false` to `gradle.properties`

### Error: "OutOfMemoryError"

**Solution**: 
1. Increase memory allocation in `gradle.properties`:
   ```
   org.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=512m
   ```
2. Or build with more memory:
   ```bash
   export GRADLE_OPTS="-Xmx1024m"
   npm run apk:build-release
   ```

## Build Failures

### Error: "SDK location not found"

**Solution**: Set ANDROID_HOME environment variable:
```bash
# Windows
set ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk

# Linux/Mac
export ANDROID_HOME=$HOME/Android/Sdk
```

### Error: "Java not found"

**Solution**: Set JAVA_HOME environment variable:
```bash
# Windows
set JAVA_HOME=C:\Program Files\Java\jdk-11

# Linux/Mac
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
```

### Error: "Failed to download Gradle"

**Solution**: 
1. Check internet connection
2. Try building again (Gradle will retry)
3. Manually download Gradle from https://gradle.org/releases/

## Other Common Issues

### Build takes too long

**Solution**: 
1. Enable parallel builds: Set `org.gradle.parallel=true` in `gradle.properties`
2. Use Gradle daemon: `org.gradle.daemon=true` (already enabled)
3. Clear Gradle cache: `gradlew clean`

### APK file not found after build

**Solution**: Check the output location:
- Debug: `./app/build/outputs/bundle/debug/app-debug.aab`
- Release: `./app/build/outputs/bundle/release/app-release.aab`

### Signing key errors

**Solution**: 
1. Make sure `android.keystore` exists in the project root
2. If missing, generate a new one:
   ```bash
   bubblewrap keygen
   ```
3. Remember your keystore password and key alias password

### Manifest URL errors

**Solution**: 
1. Make sure your domain is accessible
2. Verify `manifest.json` is accessible at `https://smartfishcare.site/manifest.json`
3. Check that icons are accessible at their URLs

## Performance Tips

1. **First build is slow**: The first build downloads dependencies and sets up the Android project. Subsequent builds are faster.

2. **Use incremental builds**: After the first build, only changed files are rebuilt.

3. **Clean build**: If you encounter strange errors, try:
   ```bash
   gradlew clean
   npm run apk:build-release
   ```

## Getting Help

If you continue to experience issues:
1. Check the full error message in the terminal
2. Try building with debug output: `gradlew assembleRelease --stacktrace --info`
3. Check the [Bubblewrap documentation](https://github.com/GoogleChromeLabs/bubblewrap)
4. Review the [Gradle documentation](https://docs.gradle.org/)

