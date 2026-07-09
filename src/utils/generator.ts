import { KeystoreConfig, ProjectType, AnalysisResponse, ScriptOutput } from '../types';

export function generateSigningConfig(params: {
  projectType: ProjectType;
  appName: string;
  packageName: string;
  keystoreConfig: KeystoreConfig;
  existingGradle?: string;
  useExistingKeystore?: boolean;
  keystorePath?: string;
  versionCode?: string;
  versionName?: string;
}): AnalysisResponse {
  const {
    projectType,
    appName,
    packageName,
    keystoreConfig,
    useExistingKeystore,
    keystorePath,
    versionCode,
    versionName
  } = params;

  const defaultKeystoreName = 'release-key.jks';
  const resolvedKeystorePath = keystorePath || `android/app/${defaultKeystoreName}`;
  const filenameOnly = resolvedKeystorePath.split('/').pop() || defaultKeystoreName;

  // 1. Keystore Command
  let keystoreCommand = '';
  if (useExistingKeystore) {
    keystoreCommand = `keytool -list -v -keystore "${resolvedKeystorePath}" -alias "${keystoreConfig.alias}" -storepass "${keystoreConfig.storePassword || ''}"`;
  } else {
    const dname = `CN=${keystoreConfig.fullName || 'Android Developer'}, OU=${keystoreConfig.orgUnit || 'Development'}, O=${keystoreConfig.organization || 'My Company'}, L=${keystoreConfig.city || 'My City'}, S=${keystoreConfig.state || 'My State'}, C=${keystoreConfig.country || 'US'}`;
    keystoreCommand = `keytool -genkey -v -keystore "${resolvedKeystorePath}" -alias "${keystoreConfig.alias}" -keyalg RSA -keysize 2048 -validity ${keystoreConfig.validityDays || 10000} -storepass "${keystoreConfig.storePassword || ''}" -keypass "${keystoreConfig.keyPassword || ''}" -dname "${dname}"`;
  }

  // 2. key.properties File Content
  const propertiesFile = `storePassword=${keystoreConfig.storePassword || ''}
keyPassword=${keystoreConfig.keyPassword || ''}
keyAlias=${keystoreConfig.alias}
storeFile=${resolvedKeystorePath}
`;

  // 3. build.gradle Code
  // Determine if we are referencing gradle from root/android/app/build.gradle
  const relativePropertiesPath = projectType === 'native-android' 
    ? 'rootProject.file("key.properties")' 
    : 'rootProject.file("../key.properties")';

  const gradleCode = `// 1. Place this block at the top of your app/build.gradle file (outside any other block)
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new java.io.FileInputStream(keystorePropertiesFile))
}

android {
    ...
    defaultConfig {
        applicationId "${packageName}"
        ${versionCode ? `versionCode ${versionCode}` : 'versionCode 1'}
        ${versionName ? `versionName "${versionName}"` : 'versionName "1.0"'}
        ...
    }

    // 2. Add or update the signingConfigs release block inside the 'android' block
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'] ?: "${filenameOnly}")
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    // 3. Ensure your buildType release block references this signing configuration
    buildTypes {
        release {
            signingConfig signingConfigs.release
            
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}`;

  // 4. Compile Command & Bundle Location
  let buildCommand = '';
  let bundleLocation = '';

  switch (projectType) {
    case 'flutter':
      buildCommand = 'flutter build appbundle --release';
      if (versionName) {
        buildCommand += ` --build-name=${versionName}`;
      }
      if (versionCode) {
        buildCommand += ` --build-number=${versionCode}`;
      }
      bundleLocation = 'build/app/outputs/bundle/release/app-release.aab';
      break;
    case 'react-native':
      buildCommand = 'cd android && ./gradlew bundleRelease';
      bundleLocation = 'android/app/build/outputs/bundle/release/app-release.aab';
      break;
    case 'capacitor':
      buildCommand = 'cd android && ./gradlew bundleRelease';
      bundleLocation = 'android/app/build/outputs/bundle/release/app-release.aab';
      break;
    case 'cordova':
      buildCommand = 'cordova build android --release -- --packageType=bundle';
      bundleLocation = 'platforms/android/app/build/outputs/bundle/release/app-release.aab';
      break;
    case 'native-android':
      buildCommand = './gradlew bundleRelease';
      bundleLocation = 'app/build/outputs/bundle/release/app-release.aab';
      break;
    case 'unity':
      buildCommand = 'Build directly inside Unity Editor (File > Build Settings > Android > check "Build App Bundle")';
      bundleLocation = 'ProjectRootDir/Builds/Android/app-release.aab (defined inside Unity Build Config)';
      break;
    default:
      buildCommand = './gradlew bundleRelease';
      bundleLocation = 'app/build/outputs/bundle/release/app-release.aab';
  }

  // 4b. PowerShell Specific Build Command
  let psBuildCommand = '';
  switch (projectType) {
    case 'flutter':
      psBuildCommand = 'flutter build appbundle --release';
      if (versionName) {
        psBuildCommand += ` --build-name=${versionName}`;
      }
      if (versionCode) {
        psBuildCommand += ` --build-number=${versionCode}`;
      }
      break;
    case 'react-native':
    case 'capacitor':
      psBuildCommand = 'if (Test-Path "android") {\r\n    Set-Location android\r\n    cmd.exe /c "gradlew.bat bundleRelease"\r\n    if ($LASTEXITCODE -ne 0) { throw "gradlew.bat bundleRelease failed" }\r\n    Set-Location ..\r\n} else {\r\n    throw "Android folder not found."\r\n}';
      break;
    case 'cordova':
      psBuildCommand = 'cordova build android --release -- --packageType=bundle';
      break;
    case 'native-android':
      psBuildCommand = 'cmd.exe /c "gradlew.bat bundleRelease"\r\nif ($LASTEXITCODE -ne 0) { throw "gradlew.bat bundleRelease failed" }';
      break;
    case 'unity':
      psBuildCommand = '';
      break;
    default:
      psBuildCommand = 'cmd.exe /c "gradlew.bat bundleRelease"\r\nif ($LASTEXITCODE -ne 0) { throw "gradlew.bat bundleRelease failed" }';
  }

  // 5. Steps & Instructions
  const keyActionLabel = useExistingKeystore ? 'Locate and Verify' : 'Generate New';
  const instructions = `### Android Release Signing Guide for **${appName}** (${projectType.toUpperCase()})

This guide explains how to secure your production build utilizing a standard \`key.properties\` architecture. 
This is the **safest** approach recommended by Google, preventing your cryptographic release passwords from being committed to public Git repositories.

---

### Step 1: ${keyActionLabel} Release Keystore
${useExistingKeystore 
  ? `Since you are using an existing release keystore, verify that the file exists at **\`${resolvedKeystorePath}\`**.
  
You can inspect and confirm your alias name and certificate validity using this standard JDK command:
\`\`\`bash
${keystoreCommand}
\`\`\`
`
  : `Run the following JDK \`keytool\` utility command in your system terminal to generate a brand new private cryptographic signing key:
\`\`\`bash
${keystoreCommand}
\`\`\`
This will securely create a file at \`${resolvedKeystorePath}\` containing your private cryptographic key. Keep this file extremely safe!
`
}

---

### Step 2: Configure \`key.properties\` File
Create a new file named \`key.properties\` in your Android project directory (typically inside the root \`android/\` directory for multi-platform frameworks, or the project root for native Gradle). Add the following lines:

\`\`\`properties
${propertiesFile}\`\`\`

> ⚠️ **Crucial Security Tip:** Ensure you add \`key.properties\` and \`*.jks\` files to your \`.gitignore\` file. Never commit these files to GitHub or any public version control systems.

---

### Step 3: Configure Gradle to Read Keys
Update your Android application's build config (\`android/app/build.gradle\`) to securely load parameters from the properties file:

\`\`\`groovy
${gradleCode}
\`\`\`

---

### Step 4: Execute Production Build
Run the release compilation command in your terminal:
\`\`\`bash
${buildCommand}
\`\`\`

Once compiled, your signed production Android App Bundle will be available at:
📁 **\`${bundleLocation}\`**

You are now ready to upload this file directly to the **Google Play Console**!`;

  // 6. Scripts (Bash & PowerShell)
  const scripts = [
    {
      filename: 'automate-release.sh',
      type: 'bash' as const,
      description: 'Automates dependency restoration, platform addition, keystore creation, key.properties configuration, and release build on macOS/Linux.',
      content: `#!/usr/bin/env bash
# Android Release Build Automator for ${appName}
# Built Securely and Locally (Client-Side)

set -e

KEYSTORE_PATH="${resolvedKeystorePath}"
PROPERTIES_FILE="android/key.properties"
[ "${projectType}" = "native-android" ] && PROPERTIES_FILE="key.properties"

echo "[START] Starting Android Release Automator for ${appName}..."

# 0.1. Java / JDK Environment Check
echo "[JDK] Verifying Java development environment..."
if [ "$(uname)" = "Darwin" ] && command -v /usr/libexec/java_home >/dev/null 2>&1; then
    if /usr/libexec/java_home -v 17 >/dev/null 2>&1; then
        export JAVA_HOME=$(/usr/libexec/java_home -v 17)
    elif /usr/libexec/java_home -v 21 >/dev/null 2>&1; then
        export JAVA_HOME=$(/usr/libexec/java_home -v 21)
    else
        export JAVA_HOME=$(/usr/libexec/java_home)
    fi
    export PATH="$JAVA_HOME/bin:$PATH"
    echo "[JDK] Configured macOS JAVA_HOME: $JAVA_HOME"
elif [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    echo "[JDK] Using existing JAVA_HOME: $JAVA_HOME"
    # Warn about JDK 25+ incompatibility
    if "$JAVA_HOME/bin/java" -version 2>&1 | grep -q "version \"25"; then
        echo "[WARNING] You are using JDK 25. Gradle does not support Java 25 yet."
        echo "          If your build fails with 'class file major version 69', please use JDK 17 or 21."
    fi
elif command -v java >/dev/null 2>&1; then
    echo "[JDK] Java command found in PATH."
    if java -version 2>&1 | grep -q "version \"25"; then
        echo "[WARNING] Your system Java is JDK 25. Gradle does not support Java 25 yet."
        echo "          If your build fails with 'class file major version 69', please install and use JDK 17 or 21."
    fi
else
    echo "[WARNING] Java command not found in PATH and JAVA_HOME is not set."
    echo "          Android builds will likely fail. Please install JDK 17/21 and configure your PATH."
fi

# 0.2. Android SDK Environment Check
echo "[SDK] Verifying Android SDK development environment..."
ANDROID_SDK_PATH=""
if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME" ]; then
    ANDROID_SDK_PATH="$ANDROID_HOME"
    echo "[SDK] Using existing ANDROID_HOME: $ANDROID_HOME"
elif [ -n "$ANDROID_SDK_ROOT" ] && [ -d "$ANDROID_SDK_ROOT" ]; then
    ANDROID_SDK_PATH="$ANDROID_SDK_ROOT"
    echo "[SDK] Using existing ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
elif [ "$(uname)" = "Darwin" ] && [ -d "$HOME/Library/Android/sdk" ]; then
    ANDROID_SDK_PATH="$HOME/Library/Android/sdk"
    export ANDROID_HOME="$ANDROID_SDK_PATH"
    echo "[SDK] Auto-detected macOS Android SDK: $ANDROID_HOME"
elif [ -d "$HOME/Android/Sdk" ]; then
    ANDROID_SDK_PATH="$HOME/Android/Sdk"
    export ANDROID_HOME="$ANDROID_SDK_PATH"
    echo "[SDK] Auto-detected Linux Android SDK: $ANDROID_HOME"
else
    echo "[WARNING] ANDROID_HOME is not set and could not auto-detect your Android SDK location."
    echo "          Please set the ANDROID_HOME environment variable to your Android SDK folder."
fi

# 0. Dependency and Platform Setup
echo "[SETUP] Checking and preparing project dependencies and platforms..."
if [ "${projectType}" = "capacitor" ]; then
    if [ ! -d "node_modules" ]; then
        echo "Installing npm dependencies..."
        npm install
    fi
    
    # Check if Capacitor core is installed, if not add it and CLI/Android
    if [ -f "package.json" ]; then
        if ! grep -q '"@capacitor/core"' package.json; then
            echo "Capacitor dependencies not found. Installing @capacitor/core, @capacitor/cli, @capacitor/android..."
            npm install @capacitor/core @capacitor/android
            npm install -D @capacitor/cli
        fi
    fi

    if [ ! -d "dist" ] && [ ! -d "www" ] && [ ! -d "build" ]; then
        echo "Building web project assets..."
        npm run build || true
    fi

    webDir="dist"
    if [ -d "build" ]; then
        webDir="build"
    elif [ -d "www" ]; then
        webDir="www"
    fi

    if [ ! -d "$webDir" ]; then
        echo "Creating temporary web assets folder '$webDir' for Capacitor initialization..."
        mkdir -p "$webDir"
        echo "<html><body>Placeholder</body></html>" > "$webDir/index.html"
    fi

    if [ ! -f "capacitor.config.json" ] && [ ! -f "capacitor.config.ts" ] && [ ! -f "capacitor.config.js" ]; then
        echo "Initializing Capacitor configuration..."
        npx cap init "${appName}" "${packageName}" --web-dir="$webDir"
    fi

    if [ ! -f "android/build.gradle" ] && [ ! -f "android/build.gradle.kts" ]; then
        echo "Adding Android platform using Capacitor CLI..."
        if [ -d "android" ]; then
            rm -rf android
        fi
        npx cap add android
    fi

    echo "Syncing web assets to Android platform..."
    npx cap sync
elif [ "${projectType}" = "cordova" ]; then
    if [ ! -d "node_modules" ]; then
        echo "Installing npm dependencies..."
        npm install
    fi
    if [ ! -d "platforms/android" ]; then
        echo "Adding Android platform using Cordova..."
        npx cordova platform add android || cordova platform add android
    fi
elif [ "${projectType}" = "react-native" ]; then
    if [ ! -d "node_modules" ]; then
        echo "Installing npm dependencies..."
        npm install
    fi
elif [ "${projectType}" = "flutter" ]; then
    if [ ! -d "android" ]; then
        echo "Setting up missing android folder for Flutter..."
        flutter create --platforms=android .
    fi
    echo "Getting Flutter dependencies..."
    flutter pub get
fi

# 0.3. Android SDK local.properties configuration
if [ -n "$ANDROID_SDK_PATH" ]; then
    LOCAL_PROPERTIES_DIR="android"
    if [ "${projectType}" = "native-android" ]; then
        LOCAL_PROPERTIES_DIR="."
    elif [ "${projectType}" = "cordova" ]; then
        LOCAL_PROPERTIES_DIR="platforms/android"
    fi
    
    if [ -d "$LOCAL_PROPERTIES_DIR" ]; then
        echo "[SDK] Automatically configuring sdk.dir in $LOCAL_PROPERTIES_DIR/local.properties..."
        echo "sdk.dir=$ANDROID_SDK_PATH" > "$LOCAL_PROPERTIES_DIR/local.properties"
    fi
fi

# 0.4. Play Store Version Configuration
if [ "${projectType}" != "flutter" ] && [ "${projectType}" != "unity" ] && { [ -n "${versionCode || ''}" ] || [ -n "${versionName || ''}" ]; }; then
    GRADLE_PATH="android/app/build.gradle"
    if [ "${projectType}" = "native-android" ]; then
        GRADLE_PATH="app/build.gradle"
    elif [ "${projectType}" = "cordova" ]; then
        GRADLE_PATH="platforms/android/app/build.gradle"
    fi

    if [ -f "$GRADLE_PATH" ]; then
        echo "[VERSION] Injecting Play Store version updates..."
        node -e "
const fs = require('fs');
const file = '$GRADLE_PATH';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let updated = false;
    if ('${versionCode || ''}') {
        if (content.match(/versionCode\s+\d+/)) {
            content = content.replace(/(versionCode\s+)\d+/, '\$1' + '${versionCode || ''}');
            updated = true;
        }
    }
    if ('${versionName || ''}') {
        if (content.match(/versionName\s+(['\"])[^'\"]+(['\"])/)) {
            content = content.replace(/(versionName\s+)(['\"])[^'\"]+(['\"])/, '\$1\$2' + '${versionName || ''}' + '\$3');
            updated = true;
        }
    }
    if (updated) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('[VERSION] Successfully updated version parameters in ' + file);
    } else {
        console.log('[VERSION] Version properties not found in standard defaultConfig format.');
    }
}
"
    fi
fi

# 1. Keystore Check/Creation
${useExistingKeystore ? `
echo "[CHECK] Checking for existing release keystore at: $KEYSTORE_PATH..."
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "[ERROR] Pre-existing keystore file not found at: $KEYSTORE_PATH"
    echo "   Please place your release .jks file at that location, or update your path settings and try again."
    exit 1
else
    echo "[OK] Keystore found successfully."
fi
` : `
echo "[CHECK] Checking if keystore file exists..."
if [ -f "$KEYSTORE_PATH" ]; then
    echo "[WARNING] Keystore already exists at: $KEYSTORE_PATH. Skipping generation."
else
    echo "[SETUP] Generating a brand new Release Keystore..."
    mkdir -p "$(dirname "$KEYSTORE_PATH")"
    ${keystoreCommand}
    echo "[OK] Keystore generated successfully at $KEYSTORE_PATH"
fi
`}

# 2. Key Properties setup
echo "[CONFIG] Creating/Updating signing property configuration file ($PROPERTIES_FILE)..."
mkdir -p "$(dirname "$PROPERTIES_FILE")"
cat <<EOT > "$PROPERTIES_FILE"
storePassword=${keystoreConfig.storePassword || ''}
keyPassword=${keystoreConfig.keyPassword || ''}
keyAlias=${keystoreConfig.alias}
storeFile=${resolvedKeystorePath}
EOT
echo "[OK] Configuration file successfully configured."

# 3. Build Command Execution
echo "[BUILD] Compiling Android Release App Bundle (.aab)..."
${projectType === 'unity' ? `echo "[WARNING] Unity builds must be triggered from within the Unity IDE. Please compile there!"` : `
${buildCommand}
echo "[SUCCESS] Build finished successfully!"
echo "[OUTPUT] Your signed bundle is located at: ${bundleLocation}"
`}
`
    },
    {
      filename: 'automate-release.ps1',
      type: 'powershell' as const,
      description: 'Automates dependency restoration, platform addition, keystore creation, key.properties configuration, and release build on Windows.',
      content: `# Android Release Build Automator for ${appName}
# Built Securely and Locally (Client-Side)

$ErrorActionPreference = "Stop"

$KeystorePath = "${resolvedKeystorePath}"
$PropertiesFile = "android/key.properties"
if ("${projectType}" -eq "native-android") { $PropertiesFile = "key.properties" }

Write-Host "[START] Starting Android Release Automator for ${appName}..." -ForegroundColor Cyan

# 0.1. Java / JDK Environment Check
Write-Host "[JDK] Verifying Java development environment..." -ForegroundColor Cyan

function Test-JavaHome($path) {
    if (-not $path) { return $false }
    # Strip any enclosing quotes that might be present in environment variables
    $cleanPath = $path.ToString().Trim('"').Trim("'").Trim()
    if ($cleanPath -and (Test-Path $cleanPath)) {
        $javaExe = Join-Path $cleanPath "bin\\java.exe"
        if (Test-Path $javaExe) {
            return $true
        }
    }
    return $false
}

$Candidates = @()

# 1. Clean and check current environment JAVA_HOME
if ($env:JAVA_HOME) {
    $env:JAVA_HOME = $env:JAVA_HOME.Trim('"').Trim("'").Trim()
    if (Test-JavaHome $env:JAVA_HOME) {
        $Candidates += [PSCustomObject]@{
            Path = $env:JAVA_HOME
            Source = "JAVA_HOME"
        }
    }
}

# 2. Check Android Studio's bundled JDK locations
$StudioPaths = @(
    "C:\\Program Files\\Android\\Android Studio\\jbr",
    "C:\\Program Files\\Android\\Android Studio\\jre",
    "C:\\Program Files\\Android\\Android Studio (Preview)\\jbr",
    "C:\\Program Files\\Android\\Android Studio (Preview)\\jre"
)
$localAndroidStudio = Join-Path $env:LOCALAPPDATA "Android\\Android Studio"
if (Test-Path $localAndroidStudio) {
    $StudioPaths += Join-Path $localAndroidStudio "jbr"
    $StudioPaths += Join-Path $localAndroidStudio "jre"
}

foreach ($p in $StudioPaths) {
    if (Test-JavaHome $p) {
        $Candidates += [PSCustomObject]@{
            Path = $p
            Source = "Android Studio Bundle"
        }
    }
}

# 3. Check general program file directories for Eclipse Adoptium, Java, Microsoft, etc.
$SearchRoots = @(
    "C:\\Program Files\\Eclipse Adoptium",
    "C:\\Program Files\\Java",
    "C:\\Program Files\\Microsoft",
    "C:\\Program Files\\Amazon Corretto",
    "C:\\Program Files\\Zulu",
    "C:\\Program Files\\Semeru",
    "C:\\Program Files\\BellSoft"
)

foreach ($root in $SearchRoots) {
    if (Test-Path $root) {
        try {
            Get-ChildItem $root -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                if (Test-JavaHome $_.FullName) {
                    $Candidates += [PSCustomObject]@{
                        Path = $_.FullName
                        Source = "Program Files Search"
                    }
                }
            }
        } catch {}
    }
}

# 4. Check system command path
$javaFromPath = Get-Command java -ErrorAction SilentlyContinue
if ($javaFromPath) {
    $javaDir = Split-Path $javaFromPath.Source -Parent
    $derivedHome = Split-Path $javaDir -Parent
    if (Test-JavaHome $derivedHome) {
        $Candidates += [PSCustomObject]@{
            Path = $derivedHome
            Source = "System Path (Derived)"
        }
    }
}

# Score candidates to prefer compatible Gradle environments (JDK 17 or 21) and avoid JDK 25
$ValidJDKs = @()
$seenPaths = @{}

foreach ($c in $Candidates) {
    if ($seenPaths.ContainsKey($c.Path)) { continue }
    $seenPaths[$c.Path] = $true
    
    $score = 10  # Base score
    $versionText = ""
    
    # Run java -version to determine compatibility
    try {
        $javaExe = Join-Path $c.Path "bin\\java.exe"
        $versionOutput = & $javaExe -version 2>&1 | Out-String
        if ($versionOutput -match 'version "([^"]+)"') {
            $versionText = $Matches[1]
        }
    } catch {}
    
    if ($versionText -match "^17\\." -or $c.Path -match "17" -or $c.Path -match "jdk-17" -or $c.Path -match "jdk17") {
        $score += 100 # Strongly prefer JDK 17
    } elseif ($versionText -match "^21\\." -or $c.Path -match "21" -or $c.Path -match "jdk-21" -or $c.Path -match "jdk21") {
        $score += 90 # Strongly prefer JDK 21
    } elseif ($c.Source -eq "Android Studio Bundle") {
        $score += 85 # JetBrains Runtime is usually perfectly matched
    } elseif ($versionText -match "^11\\." -or $c.Path -match "11" -or $c.Path -match "jdk-11") {
        $score += 50
    } elseif ($versionText -match "^25\\." -or $c.Path -match "25" -or $c.Path -match "jdk-25") {
        $score -= 60 # Penalize JDK 25 significantly as Gradle does not support class file major version 69
    }
    
    $ValidJDKs += [PSCustomObject]@{
        Path = $c.Path
        Source = $c.Source
        Version = $versionText
        Score = $score
    }
}

$JavaDetected = $false
if ($ValidJDKs.Count -gt 0) {
    # Sort descending by score
    $SortedJDKs = $ValidJDKs | Sort-Object Score -Descending
    $bestJDK = $SortedJDKs[0]
    
    $env:JAVA_HOME = $bestJDK.Path
    $env:PATH = "$(Join-Path $bestJDK.Path 'bin');$env:PATH"
    $JavaDetected = $true
    
    Write-Host "[JDK] Selected compatible Java home: $($bestJDK.Path)" -ForegroundColor Green
    Write-Host "      (Source: $($bestJDK.Source), Estimated Version: $($bestJDK.Version))" -ForegroundColor Gray
    
    if ($bestJDK.Score -lt 0) {
        Write-Warning "The only available Java installation found is JDK 25 (Version: $($bestJDK.Version))."
        Write-Warning "Gradle does not yet support Java 25 (class file major version 69)."
        Write-Warning "If your build fails, please install JDK 17 or 21 from https://adoptium.net/ and restart your terminal."
    }
} else {
    Write-Warning "Could not find any valid JDK installations or JAVA_HOME. Android builds will likely fail."
    Write-Warning "Please download and install JDK 17 or 21 from Eclipse Adoptium (https://adoptium.net/)."
}

# 0.2. Android SDK Environment Check
Write-Host "[SDK] Verifying Android SDK development environment..." -ForegroundColor Cyan

$AndroidSdkPath = $null
$SdkSearchPaths = @()

if ($env:ANDROID_HOME) {
    $SdkSearchPaths += $env:ANDROID_HOME.Trim('"').Trim("'").Trim()
}
if ($env:ANDROID_SDK_ROOT) {
    $SdkSearchPaths += $env:ANDROID_SDK_ROOT.Trim('"').Trim("'").Trim()
}

$localSdk = Join-Path $env:LOCALAPPDATA "Android/Sdk"
$SdkSearchPaths += $localSdk
$SdkSearchPaths += "C:/Program Files (x86)/Android/android-sdk"
$SdkSearchPaths += "C:/Android/Sdk"

foreach ($path in $SdkSearchPaths) {
    if ($path -and (Test-Path $path)) {
        if ((Test-Path (Join-Path $path "platform-tools")) -or (Test-Path (Join-Path $path "platforms"))) {
            $AndroidSdkPath = $path
            break
        }
    }
}

if ($AndroidSdkPath) {
    $env:ANDROID_HOME = $AndroidSdkPath
    Write-Host "[SDK] Detected Android SDK location at: $AndroidSdkPath" -ForegroundColor Green
    Write-Host "[SDK] Temporarily configured ANDROID_HOME." -ForegroundColor Gray
} else {
    Write-Warning "ANDROID_HOME is not set and could not auto-detect your Android SDK location."
    Write-Warning "Please set the ANDROID_HOME environment variable to your Android SDK folder,"
    Write-Warning "or install the Android SDK using Android Studio (https://developer.android.com/studio)."
}

# 0. Dependency and Platform Setup
Write-Host "[SETUP] Checking and preparing project dependencies and platforms..." -ForegroundColor Cyan
if ("${projectType}" -eq "capacitor") {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
    
    # Read package.json to verify capacitor is present
    $pkgJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $hasCapacitor = $null
    if ($pkgJson.dependencies -and $pkgJson.dependencies.'@capacitor/core') {
        $hasCapacitor = $true
    }
    
    if (-not $hasCapacitor) {
        Write-Host "Capacitor dependencies not found. Installing @capacitor/core, @capacitor/cli, @capacitor/android..." -ForegroundColor Yellow
        npm install @capacitor/core @capacitor/android
        if ($LASTEXITCODE -ne 0) { throw "Failed to install @capacitor/core and @capacitor/android" }
        npm install -D @capacitor/cli
        if ($LASTEXITCODE -ne 0) { throw "Failed to install @capacitor/cli" }
    }

    if (-not (Test-Path "dist") -and -not (Test-Path "www") -and -not (Test-Path "build")) {
        Write-Host "Building web project assets..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
    }
    
    $webDir = "dist"
    if (Test-Path "build") { $webDir = "build" }
    elseif (Test-Path "www") { $webDir = "www" }
    
    if (-not (Test-Path $webDir)) {
        Write-Host "Creating temporary web assets folder '$webDir' for Capacitor initialization..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Force -Path $webDir
        Set-Content -Path (Join-Path $webDir "index.html") -Value "<html><body>Placeholder</body></html>"
    }

    if (-not (Test-Path "capacitor.config.*")) {
        Write-Host "Initializing Capacitor configuration..." -ForegroundColor Yellow
        npx cap init "${appName}" "${packageName}" --web-dir=$webDir
        if ($LASTEXITCODE -ne 0) { throw "Capacitor initialization (cap init) failed" }
    }

    if (-not (Test-Path "android/build.gradle") -and -not (Test-Path "android/build.gradle.kts")) {
        Write-Host "Adding Android platform using Capacitor CLI..." -ForegroundColor Yellow
        if (Test-Path "android") {
            Remove-Item -Recurse -Force "android"
        }
        npx cap add android
        if ($LASTEXITCODE -ne 0) { throw "Failed to add Android platform (cap add android)" }
    }

    Write-Host "Syncing web assets to Android platform..." -ForegroundColor Yellow
    npx cap sync
    if ($LASTEXITCODE -ne 0) { throw "Capacitor sync (cap sync) failed" }
} elseif ("${projectType}" -eq "cordova") {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
    if (-not (Test-Path "platforms/android")) {
        Write-Host "Adding Android platform using Cordova..." -ForegroundColor Yellow
        npx cordova platform add android
        if ($LASTEXITCODE -ne 0) { throw "Cordova add platform failed" }
    }
} elseif ("${projectType}" -eq "react-native") {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
} elseif ("${projectType}" -eq "flutter") {
    if (-not (Test-Path "android")) {
        Write-Host "Setting up missing android folder for Flutter..." -ForegroundColor Yellow
        flutter create --platforms=android .
        if ($LASTEXITCODE -ne 0) { throw "Flutter create failed" }
    }
    Write-Host "Getting Flutter dependencies..." -ForegroundColor Yellow
    flutter pub get
    if ($LASTEXITCODE -ne 0) { throw "Flutter pub get failed" }
}

# 0.3. Android SDK local.properties configuration
if ($AndroidSdkPath) {
    $LocalPropertiesDir = "android"
    if ("${projectType}" -eq "native-android") {
        $LocalPropertiesDir = "."
    } elseif ("${projectType}" -eq "cordova") {
        $LocalPropertiesDir = "platforms/android"
    }
    
    if (Test-Path $LocalPropertiesDir) {
        $localPropertiesFile = Join-Path $LocalPropertiesDir "local.properties"
        # Format path with forward slashes for sdk.dir in local.properties using char codes to avoid slash escapes
        $formattedSdkPath = $AndroidSdkPath.Replace([char]92, [char]47)
        
        Write-Host "[SDK] Writing/Updating Android SDK location in $localPropertiesFile..." -ForegroundColor Cyan
        if (-not (Test-Path $localPropertiesFile)) {
            New-Item -ItemType File -Path $localPropertiesFile -Force | Out-Null
        }
        Set-Content -Path $localPropertiesFile -Value "sdk.dir=$formattedSdkPath" -Force
        Write-Host "[SDK] Successfully configured sdk.dir in local.properties" -ForegroundColor Green
    }
}

# 0.4. Play Store Version Configuration
if ("${projectType}" -ne "flutter" -and "${projectType}" -ne "unity" -and ("${versionCode || ''}" -or "${versionName || ''}")) {
    $GradlePath = "android/app/build.gradle"
    if ("${projectType}" -eq "native-android") {
        $GradlePath = "app/build.gradle"
    } elseif ("${projectType}" -eq "cordova") {
        $GradlePath = "platforms/android/app/build.gradle"
    }

    if (Test-Path $GradlePath) {
        Write-Host "[VERSION] Injecting Play Store version updates..." -ForegroundColor Cyan
        $content = Get-Content $GradlePath -Raw
        $updated = $false
        if ("${versionCode || ''}") {
            if ($content -match 'versionCode\s+\d+') {
                $content = $content -replace '(versionCode\s+)\d+', "\`$1${versionCode || ''}"
                $updated = $true
            }
        }
        if ("${versionName || ''}") {
            if ($content -match 'versionName\s+([''"])[^''"]+([''"])') {
                $content = $content -replace '(versionName\s+)([''"])[^''"]+([''"])', "\`$1\`$2${versionName || ''}\`$3"
                $updated = $true
            }
        }
        if ($updated) {
            Set-Content -Path $GradlePath -Value $content -Force
            Write-Host "[VERSION] Successfully updated version parameters in $GradlePath" -ForegroundColor Green
        } else {
            Write-Host "[VERSION] Version properties not found in standard defaultConfig format." -ForegroundColor Yellow
        }
    }
}

# 1. Keystore Check/Creation
${useExistingKeystore ? `
Write-Host "[CHECK] Checking for existing release keystore at: $KeystorePath..."
if (-not (Test-Path $KeystorePath)) {
    Write-Host "[ERROR] Pre-existing keystore file not found at: $KeystorePath" -ForegroundColor Red
    Write-Host "   Please place your release .jks file at that location, or update your path settings and try again." -ForegroundColor Yellow
    Exit 1
} else {
    Write-Host "[OK] Keystore found successfully." -ForegroundColor Green
}
` : `
Write-Host "[CHECK] Checking if keystore file exists..."
if (Test-Path $KeystorePath) {
    Write-Host "[WARNING] Keystore already exists at: $KeystorePath. Skipping generation." -ForegroundColor Yellow
} else {
    Write-Host "[SETUP] Generating a brand new Release Keystore..." -ForegroundColor Cyan
    $parentDir = Split-Path $KeystorePath -Parent
    if ($parentDir -and -not (Test-Path $parentDir)) { New-Item -ItemType Directory -Force -Path $parentDir }
    
    # Run keytool via cmd
    & cmd.exe /c "${keystoreCommand}"
    Write-Host "[OK] Keystore generated successfully at $KeystorePath" -ForegroundColor Green
}
`}

# 2. Key Properties setup
Write-Host "[CONFIG] Creating/Updating signing property configuration file ($PropertiesFile)..." -ForegroundColor Cyan
$propertiesDir = Split-Path $PropertiesFile -Parent
if ($propertiesDir -and -not (Test-Path $propertiesDir)) { New-Item -ItemType Directory -Force -Path $propertiesDir }

$PropertiesContent = @"
storePassword=${keystoreConfig.storePassword || ''}
keyPassword=${keystoreConfig.keyPassword || ''}
keyAlias=${keystoreConfig.alias}
storeFile=${resolvedKeystorePath}
"@

Set-Content -Path $PropertiesFile -Value $PropertiesContent -Force
Write-Host "[OK] Configuration file successfully configured." -ForegroundColor Green

# 3. Build Command Execution
Write-Host "[BUILD] Compiling Android Release App Bundle (.aab)..." -ForegroundColor Cyan
${projectType === 'unity' ? `Write-Host "[WARNING] Unity builds must be triggered from within the Unity IDE. Please compile there!" -ForegroundColor Yellow` : `
${psBuildCommand}
Write-Host "[SUCCESS] Build finished successfully!" -ForegroundColor Green
Write-Host "[OUTPUT] Your signed bundle is located at: ${bundleLocation}" -ForegroundColor Green
`}
`
    }
  ];

  return {
    keystoreCommand,
    propertiesFile,
    gradleCode,
    buildCommand,
    bundleLocation,
    instructions,
    scripts
  };
}
