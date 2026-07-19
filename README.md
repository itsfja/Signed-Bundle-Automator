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

### Step 3: Configure Play Store Versions & Package Name in the Automator UI
You can set custom version parameters and your registered Google Play package name directly inside the app before generating your script:

1. **Package Name**: Enter your exact Google Play package name (e.g. `com.number38.UKcare202526`).
2. **Version Name**: The user-visible version string (e.g., `1.0.0` or `1.1.2`).
3. **Version Code**: A positive integer that increments with every Play Store update (e.g., `1`, `2`, `3`).
4. **How it works**: 
   * **Automated Package Sync**: For **Capacitor / React Native / Native Android** projects, our generated script automatically parses your `android/app/build.gradle` file and updates the `applicationId` to match your specified package name (`com.number38.UKcare202526`), as well as configuring the `versionCode` and `versionName` parameters inside your `defaultConfig` section.
   * For **Flutter** projects, these values are automatically injected as command-line arguments: `--build-name=1.0.0 --build-number=1`.

---

### Step 4: Run the Generated Script and Automatic Signing
1. Paste the generated PowerShell script (`automate-release.ps1`) or Bash script (`automate-release.sh`) into your project's root folder.
2. Open PowerShell as an administrator (or terminal on macOS/Linux) inside your project.
3. Execute the script:
   ```powershell
   .\automate-release.ps1
   ```
4. **The Automator's Secret Weapon (Auto-Signing)**:
   * Normally, if your `build.gradle` file isn't perfectly modified, Gradle produces an **unsigned** App Bundle (`.aab`), which Google Play Console rejects.
   * **Our updated scripts solve this automatically!** After compiling your App Bundle, the script dynamically scans your build output directories for `.aab` files and signs them directly using your JDK's **`jarsigner`** utility.
   * It then runs a cryptographic verification pass to guarantee that the signature is completely valid and accepted by Google Play.

Your finished, signed `.aab` bundle will be ready for immediate upload to the Google Play Console! 🎉
