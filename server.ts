import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client to prevent crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Endpoint to analyze project and generate configurations and scripts
app.post("/api/signed-bundle/analyze", async (req, res) => {
  try {
    const ai = getAiClient();
    const { projectType, appName, packageName, keystoreConfig, existingGradle } = req.body;

    if (!projectType || !appName || !packageName || !keystoreConfig) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const systemInstruction = `You are a professional Android Build Engineer and Automation expert. 
Your goal is to guide developers who have built an AI application to the point where they successfully generate and find their signed Android App Bundle (.aab) file.
Provide precise configurations, standard security practices (e.g., using key.properties and NOT hardcoding credentials in build.gradle), and automated setup scripts.`;

    const prompt = `Analyze this request and generate the bundle signing configurations and automation scripts:
- Project Type/Framework: ${projectType}
- Application Name: ${appName}
- Android Package Name: ${packageName}

Keystore Details:
- Key Alias: ${keystoreConfig.alias}
- Key Password: ${keystoreConfig.keyPassword || "Same as store password"}
- Store Password: ${keystoreConfig.storePassword || "Specified in environment or run config"}
- Validity in Days: ${keystoreConfig.validityDays}
- Certificate Full Name (CN): ${keystoreConfig.fullName}
- Organizational Unit (OU): ${keystoreConfig.orgUnit}
- Organization (O): ${keystoreConfig.organization}
- City/Locality (L): ${keystoreConfig.city}
- State/Province (ST): ${keystoreConfig.state}
- Country Code (C): ${keystoreConfig.country}

${existingGradle ? `Here is the user's existing build.gradle file for context:\n\`\`\`groovy\n${existingGradle}\n\`\`\`` : "No existing build.gradle was provided. Generate standard configurations from scratch."}

Please output:
1. The exact 'keytool' command to generate the JKS keystore safely with correct -dname (including CN, OU, O, L, S, C).
2. The exact content for 'key.properties' (to place in android/key.properties or root/key.properties depending on framework).
3. The exact code block for 'signingConfigs' and 'buildTypes' to be placed inside android/app/build.gradle. It should safely read properties from 'key.properties'.
4. The exact CLI terminal command to compile/build the signed release App Bundle (.aab).
5. The exact file path (relative to project root) where the signed bundle (.aab) will be located upon completion.
6. A beautiful Markdown description instructing the developer step-by-step.
7. Automated, robust scripts (one Bash script for macOS/Linux, one PowerShell script for Windows) that automate the entire process: creating directory structures, running keytool, creating key.properties, configuring Gradle or warning them to configure, executing build, and outputting the location of the signed bundle. Use variables for directories and ensure safe runs.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keystoreCommand: {
              type: Type.STRING,
              description: "The full keytool command to generate the JKS file based on the configured inputs. Ensure -dname is correctly filled in."
            },
            propertiesFile: {
              type: Type.STRING,
              description: "The complete content for key.properties file to keep keystore passwords secure."
            },
            gradleCode: {
              type: Type.STRING,
              description: "The complete and exact gradle configurations (signingConfigs and buildTypes release block) to be injected in app/build.gradle."
            },
            buildCommand: {
              type: Type.STRING,
              description: "The terminal command to compile/build the release bundle, based on the selected projectType."
            },
            bundleLocation: {
              type: Type.STRING,
              description: "The exact directory path where the signed bundle (.aab) will be created after a successful build."
            },
            instructions: {
              type: Type.STRING,
              description: "Clear, beautifully formatted markdown instructions on how to set up the files, run the keystore generator, apply the gradle configurations, run the build command, and locate the bundle."
            },
            scripts: {
              type: Type.ARRAY,
              description: "Custom automator script files.",
              items: {
                type: Type.OBJECT,
                properties: {
                  filename: { type: Type.STRING, description: "e.g., 'automate-bundle.sh' or 'automate-bundle.ps1'" },
                  content: { type: Type.STRING, description: "Complete script content including comments, path detection, and error checking." },
                  type: { type: Type.STRING, description: "either 'bash' or 'powershell'" },
                  description: { type: Type.STRING, description: "Brief description of what this script does" }
                },
                required: ["filename", "content", "type", "description"]
              }
            }
          },
          required: [
            "keystoreCommand",
            "propertiesFile",
            "gradleCode",
            "buildCommand",
            "bundleLocation",
            "instructions",
            "scripts"
          ]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Endpoint to diagnose compilation/signing errors
app.post("/api/signed-bundle/diagnose", async (req, res) => {
  try {
    const ai = getAiClient();
    const { projectType, errorLog, keystoreConfig } = req.body;

    if (!errorLog) {
      return res.status(400).json({ error: "Error log is required" });
    }

    const systemInstruction = `You are a senior Android Build Engineer specializing in debugging compilation, signing, and asset packaging errors (like those from Gradle, Proguard, R8, apksigner, keytool, or bundletool).`;

    const prompt = `Diagnose the following build error for an Android/Bundle project of type '${projectType || "unknown"}'.
Error Log:
\`\`\`
${errorLog}
\`\`\`

${keystoreConfig ? `Context on configured Keystore:
- Alias: ${keystoreConfig.alias}
- Validity Days: ${keystoreConfig.validityDays}
- Full Name: ${keystoreConfig.fullName}` : ""}

Provide a precise diagnosis:
1. Root Cause: What exactly went wrong (e.g., mismatched keystore passwords, missing keys, outdated Gradle, wrong keystore path, duplicate files, certificate expired, or JDK/gradle incompatibility).
2. General Solution: Summary of how to fix it.
3. Steps to Fix: Actionable list of steps.
4. Corrected Configurations: Any updated files (like key.properties or build.gradle snippets) that will solve this error.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: {
              type: Type.STRING,
              description: "A clear, concise, and professional explanation of why the build/signing failed."
            },
            solution: {
              type: Type.STRING,
              description: "The general solution to fix this issue."
            },
            stepsToFix: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of sequential, actionable steps to fix the issue."
            },
            correctedConfigs: {
              type: Type.ARRAY,
              description: "Any files that need to be updated, with their correct content.",
              items: {
                type: Type.OBJECT,
                properties: {
                  filename: { type: Type.STRING, description: "e.g., 'key.properties' or 'build.gradle'" },
                  content: { type: Type.STRING, description: "The corrected code or content." }
                },
                required: ["filename", "content"]
              }
            }
          },
          required: ["rootCause", "solution", "stepsToFix"]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Diagnosis Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Vite & Static file setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
