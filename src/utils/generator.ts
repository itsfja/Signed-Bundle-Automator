import { KeystoreConfig, ProjectType, AnalysisResponse, ScriptOutput } from '../types';

export function generateSigningConfig(params: {
  projectType: ProjectType;
  appName: string;
  packageName: string;
  keystoreConfig: KeystoreConfig;
  existingGradle?: string;
  useExistingKeystore?: boolean;
  keystorePath?: string;
}): AnalysisResponse {
  const {
    projectType,
    appName,
    packageName,
    keystoreConfig,
    useExistingKeystore,
    keystorePath
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
      description: 'Automates keystore checks, key.properties generation, and builds the Android release on macOS/Linux.',
      content: `#!/usr/bin/env bash
# Android Release Build Automator for ${appName}
# Built Securely and Locally (Client-Side)

set -e

KEYSTORE_PATH="${resolvedKeystorePath}"
PROPERTIES_FILE="android/key.properties"
[ "${projectType}" = "native-android" ] && PROPERTIES_FILE="key.properties"

echo "🚀 Starting Android Release Automator for ${appName}..."

# 1. Keystore Check/Creation
${useExistingKeystore ? `
echo "🔍 Checking for existing release keystore at: $KEYSTORE_PATH..."
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ ERROR: Pre-existing keystore file not found at: $KEYSTORE_PATH"
    echo "   Please place your release .jks file at that location, or update your path settings and try again."
    exit 1
else
    echo "✅ Keystore found successfully."
fi
` : `
echo "🔍 Checking if keystore file exists..."
if [ -f "$KEYSTORE_PATH" ]; then
    echo "⚠️ Keystore already exists at: $KEYSTORE_PATH. Skipping generation."
else
    echo "📦 Generating a brand new Release Keystore..."
    mkdir -p "$(dirname "$KEYSTORE_PATH")"
    ${keystoreCommand}
    echo "✅ Keystore generated successfully at $KEYSTORE_PATH"
fi
`}

# 2. Key Properties setup
echo "📝 Creating/Updating signing property configuration file ($PROPERTIES_FILE)..."
cat <<EOT > "$PROPERTIES_FILE"
storePassword=${keystoreConfig.storePassword || ''}
keyPassword=${keystoreConfig.keyPassword || ''}
keyAlias=${keystoreConfig.alias}
storeFile=${resolvedKeystorePath}
EOT
echo "✅ Configuration file successfully configured."

# 3. Build Command Execution
echo "🔨 Compiling Android Release App Bundle (.aab)..."
${projectType === 'unity' ? `echo "⚠️ Unity builds must be triggered from within the Unity IDE. Please compile there!"` : `
${buildCommand}
echo "🎉 Build finished successfully!"
echo "📁 Your signed bundle is located at: ${bundleLocation}"
`}
`
    },
    {
      filename: 'automate-release.ps1',
      type: 'powershell' as const,
      description: 'Automates keystore checks, key.properties generation, and builds the Android release on Windows.',
      content: `# Android Release Build Automator for ${appName}
# Built Securely and Locally (Client-Side)

$ErrorActionPreference = "Stop"

$KeystorePath = "${resolvedKeystorePath}"
$PropertiesFile = "android/key.properties"
if ("${projectType}" -eq "native-android") { $PropertiesFile = "key.properties" }

Write-Host "🚀 Starting Android Release Automator for ${appName}..." -ForegroundColor Cyan

# 1. Keystore Check/Creation
${useExistingKeystore ? `
Write-Host "🔍 Checking for existing release keystore at: $KeystorePath..."
if (-not (Test-Path $KeystorePath)) {
    Write-Host "❌ ERROR: Pre-existing keystore file not found at: $KeystorePath" -ForegroundColor Red
    Write-Host "   Please place your release .jks file at that location, or update your path settings and try again." -ForegroundColor Yellow
    Exit 1
} else {
    Write-Host "✅ Keystore found successfully." -ForegroundColor Green
}
` : `
Write-Host "🔍 Checking if keystore file exists..."
if (Test-Path $KeystorePath) {
    Write-Host "⚠️ Keystore already exists at: $KeystorePath. Skipping generation." -ForegroundColor Yellow
} else {
    Write-Host "📦 Generating a brand new Release Keystore..." -ForegroundColor Cyan
    $parentDir = Split-Path $KeystorePath -Parent
    if ($parentDir -and -not (Test-Path $parentDir)) { New-Item -ItemType Directory -Force -Path $parentDir }
    
    # Run keytool via cmd
    & cmd.exe /c "${keystoreCommand}"
    Write-Host "✅ Keystore generated successfully at $KeystorePath" -ForegroundColor Green
}
`}

# 2. Key Properties setup
Write-Host "📝 Creating/Updating signing property configuration file ($PropertiesFile)..."
$PropertiesContent = @"
storePassword=${keystoreConfig.storePassword || ''}
keyPassword=${keystoreConfig.keyPassword || ''}
keyAlias=${keystoreConfig.alias}
storeFile=${resolvedKeystorePath}
"@

Set-Content -Path $PropertiesFile -Value $PropertiesContent -Force
Write-Host "✅ Configuration file successfully configured." -ForegroundColor Green

# 3. Build Command Execution
Write-Host "🔨 Compiling Android Release App Bundle (.aab)..." -ForegroundColor Cyan
${projectType === 'unity' ? `Write-Host "⚠️ Unity builds must be triggered from within the Unity IDE. Please compile there!" -ForegroundColor Yellow` : `
Invoke-Expression "${buildCommand}"
Write-Host "🎉 Build finished successfully!" -ForegroundColor Green
Write-Host "📁 Your signed bundle is located at: ${bundleLocation}" -ForegroundColor Green
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
