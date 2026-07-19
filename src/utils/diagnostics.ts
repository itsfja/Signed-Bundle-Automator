import { KeystoreConfig, ProjectType, DiagnoseResponse } from '../types';

export function diagnoseBuildError(params: {
  projectType: ProjectType;
  errorLog: string;
  keystoreConfig?: KeystoreConfig;
}): DiagnoseResponse {
  const { projectType, errorLog, keystoreConfig } = params;
  const log = errorLog.toLowerCase();

  // Rule 1: Keystore file not found
  if (
    log.includes('keystore file') && (log.includes('not found') || log.includes('does not exist') || log.includes('filenotfoundexception'))
  ) {
    return {
      rootCause: "The Gradle build process could not locate the release keystore (.jks or .keystore) file at the path configured in your project properties.",
      solution: "Verify and align the absolute or relative directory paths defined inside your key.properties configuration file, and place the physical file in the correct folder.",
      stepsToFix: [
        "Check your 'key.properties' file and inspect the 'storeFile' configuration key.",
        "Ensure the path is either absolute (e.g. '/Users/username/keys/release-key.jks') or correctly relative to your Android project build folder (usually android/app/).",
        "Place your physical keystore container file in that exact targeted directory.",
        "Re-trigger the release compilation command."
      ],
      correctedConfigs: [
        {
          filename: "key.properties",
          content: `storePassword=${keystoreConfig?.storePassword || 'yourPassword'}
keyPassword=${keystoreConfig?.keyPassword || 'yourPassword'}
keyAlias=${keystoreConfig?.alias || 'yourAlias'}
storeFile=${keystoreConfig ? 'android/app/release-key.jks' : 'your-relative-or-absolute-path-to-keystore.jks'}`
        }
      ]
    };
  }

  // Rule 2: Keystore password mismatch or tampering
  if (
    log.includes('password verification failed') || 
    log.includes('keystore was tampered with') || 
    log.includes('incorrect password') ||
    log.includes('failed to decrypt')
  ) {
    return {
      rootCause: "The provided Keystore password ('storePassword') is incorrect. This causes verification to fail or flags potential file tampering.",
      solution: "Rectify and double-check the 'storePassword' value inside your key.properties file to exactly match the passphrase used when the keystore was originally generated.",
      stepsToFix: [
        "Open your key.properties configuration file.",
        "Verify your 'storePassword' entry matches the original keystore secret.",
        "If you forgot your password, you will have to generate a brand new keystore file, or verify if you have an older backup of key.properties.",
        "Save and re-run your build command."
      ],
      correctedConfigs: [
        {
          filename: "key.properties",
          content: `storePassword=${keystoreConfig?.storePassword || 'REPLACE_WITH_CORRECT_KEYSTORE_PASSWORD'}
keyPassword=${keystoreConfig?.keyPassword || 'REPLACE_WITH_CORRECT_KEYSTORE_PASSWORD'}
keyAlias=${keystoreConfig?.alias || 'yourAlias'}
storeFile=release-key.jks`
        }
      ]
    };
  }

  // Rule 3: Key alias / private key mismatch or password incorrect
  if (
    log.includes('cannot recover key') || 
    log.includes('alias does not exist') ||
    log.includes('keyalias') && log.includes('mismatch') ||
    log.includes('unrecoverablekeyexception')
  ) {
    return {
      rootCause: "The Gradle build system located the keystore file, but could not recover the private key-pair. This happens if the 'keyAlias' name is incorrect or if 'keyPassword' differs from the master 'storePassword' and was specified incorrectly.",
      solution: "Confirm your alias name and supply the exact matching 'keyPassword' for that specific private key alias within key.properties.",
      stepsToFix: [
        "Run 'keytool -list -v -keystore <your-keystore-path>' to print all aliases present in your JKS container.",
        "Update the 'keyAlias' field in key.properties to match one of the printed aliases.",
        "Ensure 'keyPassword' is correct. (In most modern keystores, the key password is identical to the store password).",
        "Re-run the build."
      ],
      correctedConfigs: [
        {
          filename: "key.properties",
          content: `storePassword=${keystoreConfig?.storePassword || 'yourPassword'}
keyPassword=${keystoreConfig?.keyPassword || 'yourPassword'}
keyAlias=ENTER_EXACT_PRINTED_ALIAS_NAME
storeFile=release-key.jks`
        }
      ]
    };
  }

  // Rule 4: Missing Gradle Signing Configuration
  if (
    log.includes('signingconfig') && (log.includes('missing') || log.includes('not found') || log.includes('null'))
  ) {
    return {
      rootCause: "The release build configuration block inside your build.gradle file references a 'signingConfig' that has not been defined, or has been defined in the wrong order.",
      solution: "Ensure your 'signingConfigs' block is declared *before* the 'buildTypes' block inside your app/build.gradle script.",
      stepsToFix: [
        "Open 'android/app/build.gradle'.",
        "Verify that 'signingConfigs { release { ... } }' is declared *above* 'buildTypes { release { ... } }'. Gradle is sequential and will throw errors if references are parsed before declaration.",
        "Check that 'signingConfig signingConfigs.release' is written exactly inside 'buildTypes.release'."
      ],
      correctedConfigs: [
        {
          filename: "android/app/build.gradle",
          content: `android {
    ...
    signingConfigs {
        release {
            storeFile file("release-key.jks")
            storePassword "password"
            keyAlias "alias"
            keyPassword "password"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
        }
    }
}`
        }
      ]
    };
  }

  // Rule 5: Android SDK location not found
  if (log.includes('sdk location not found') || log.includes('android_home') || log.includes('sdk.dir')) {
    return {
      rootCause: "The Android build toolchain cannot find the Android SDK installation directory. This is standard on new developer environments where the 'ANDROID_HOME' environment variable or a 'local.properties' file is missing.",
      solution: "Create a 'local.properties' file inside your Android project root folder containing the path to your Android SDK.",
      stepsToFix: [
        "Determine where your Android SDK is installed (e.g. '/Users/username/Library/Android/sdk' on macOS, or 'C:\\Users\\username\\AppData\\Local\\Android\\Sdk' on Windows).",
        "Create a file named 'local.properties' in your Android root project directory.",
        "Add a single line: 'sdk.dir=/your/exact/sdk/path' (use double backslashes on Windows, or forward slashes).",
        "Save and retry the release command."
      ],
      correctedConfigs: [
        {
          filename: "local.properties",
          content: "sdk.dir=/Users/YOUR_USER_NAME/Library/Android/sdk"
        }
      ]
    };
  }

  // Rule 6: Google Play Store / Package Name Mismatch
  if (
    (log.includes('package name') && (log.includes('needs to have') || log.includes('mismatch') || log.includes('invalid') || log.includes('reject') || log.includes('upload') || log.includes('registered'))) ||
    log.includes('com.number38') ||
    (log.includes('applicationid') && log.includes('mismatch'))
  ) {
    return {
      rootCause: "The package name (applicationId) configured in your build script does not match the package name registered for this application inside the Google Play Console (e.g. com.number38.UKcare202526).",
      solution: "Align the package name to exactly 'com.number38.UKcare202526' inside our Automator UI, re-generate the script, and execute it on your codebase.",
      stepsToFix: [
        "Go to the Automator tab in our Signed Bundle Automator UI.",
        "Set the Package Name input field to exactly: com.number38.UKcare202526",
        "Set the Application Name input field to exactly: UKcare202526",
        "Click 'Generate Build Script' to recreate the PowerShell or Bash script with these correct values.",
        "Re-run the newly generated script inside your terminal. It will automatically update the package name and app name inside: android/app/build.gradle, AndroidManifest.xml, capacitor.config.json, capacitor.config.ts, and strings.xml.",
        "Re-upload your newly built and signed 'app-release.aab' or 'app-release.apk' bundle to the Google Play Console."
      ],
      correctedConfigs: [
        {
          filename: "capacitor.config.json",
          content: `{
  "appId": "com.number38.UKcare202526",
  "appName": "UKcare202526",
  "webDir": "dist",
  "bundledWebRuntime": false
}`
        }
      ]
    };
  }

  // Fallback for general errors
  return {
    rootCause: `General Android release compilation/signing issue detected during execution for a ${projectType.toUpperCase()} codebase.`,
    solution: "Verify key variables, clean compile caches, and confirm Java Development Kit (JDK) versions.",
    stepsToFix: [
      "Ensure you are running a supported JDK version compatible with your Gradle version (JDK 17 is standard for modern Gradle 8+).",
      "Run your clean command (e.g., './gradlew clean' or 'flutter clean') to clear any stale cache inputs.",
      "Check that your signing properties in 'key.properties' are fully populated and correct.",
      "Inspect the full build stacktrace above for any sub-compilation failures or Proguard shrinker issues."
    ]
  };
}
