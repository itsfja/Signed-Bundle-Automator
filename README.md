# Android Release Automator 🚀

An easy, step-by-step ("Ladybird") guide to setting up your development environment and successfully compiling your Google Play-ready Android App Bundle (`.aab`) using our automated scripts.

---

## 🐞 The Ladybird Steps to Release Success

### Step 1: Set Up your Java Environment (JDK)
Android builds require a Java Development Kit (JDK). **JDK 17 or 21** are highly recommended. *Avoid JDK 25 or higher as modern build tools do not support it yet.*

1. **Download & Install**: Go to [Eclipse Adoptium](https://adoptium.net/) and download the installer for **JDK 21** (or JDK 17).
2. **Set your JAVA_HOME Environment Variable**:
   * **Windows**:
     1. Search for "Edit the system environment variables" in your Windows Search Bar.
     2. Click **Environment Variables...**
     3. Under *System Variables*, click **New...**
     4. Set Variable Name to: `JAVA_HOME`
     5. Set Variable Value to your install path (e.g., `C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot`).
   * **PowerShell Check**:
     ```powershell
     echo $Env:JAVA_HOME
     ```
3. **Update your PATH**:
   * Under *System Variables*, find the `Path` variable and click **Edit...**
   * Click **New** and add: `%JAVA_HOME%\bin`

---

### Step 2: Set Up your Android SDK
To compile Android binaries, Gradle needs to know where your Android SDK is located.

1. **Download & Install**: Download and install [Android Studio](https://developer.android.com/studio). This automatically downloads the standard Android SDK.
2. **Set your ANDROID_HOME Environment Variable**:
   * Under *System Variables*, click **New...**
   * Set Variable Name to: `ANDROID_HOME`
   * Set Variable Value to your SDK location (typically: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk` or `C:\Android\Sdk`).
3. **How our Script Helps**: 
   * Even if `ANDROID_HOME` is missing, our updated PowerShell script scans common locations and automatically generates a `local.properties` file inside your project's `android/` directory with the correct `sdk.dir=...` setting!

---

### Step 3: Configure Play Store Versions in the Automator UI
You can now set custom version parameters directly inside the app before generating your script:

1. **Version Name**: The user-visible version string (e.g., `1.0.0` or `1.1.2`).
2. **Version Code**: A positive integer that increments with every Play Store update (e.g., `1`, `2`, `3`).
3. **How it works**: 
   * For **Flutter** projects, these values are automatically injected as command-line arguments: `--build-name=1.0.0 --build-number=1`.
   * For **Capacitor / React Native / Native Android** projects, the script automatically parses your `android/app/build.gradle` file and updates the `versionCode` and `versionName` parameters inside your `defaultConfig` section.

---

### Step 4: Run the Generated Script
1. Paste the generated PowerShell script (`automate-release.ps1`) into your project's root folder.
2. Open PowerShell as an administrator or within your terminal inside your project.
3. Execute the script:
   ```powershell
   .\automate-release.ps1
   ```
4. The script will:
   * Verify and bind your JDK and Android SDK.
   * Create or locate a secure release Keystore.
   * Inject and update your version parameters in `build.gradle`.
   * Build, align, and sign a release-ready `.aab` file!

Your finished `.aab` bundle will be ready for upload to the Google Play Console! 🎉
