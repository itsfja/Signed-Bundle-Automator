export type ProjectType = 'native-android' | 'flutter' | 'react-native' | 'capacitor' | 'cordova' | 'unity';

export interface KeystoreConfig {
  alias: string;
  keyPassword?: string;
  storePassword?: string;
  validityDays: number;
  fullName: string;
  orgUnit: string;
  organization: string;
  city: string;
  state: string;
  country: string;
}

export interface AnalysisRequest {
  projectType: ProjectType;
  appName: string;
  packageName: string;
  keystoreConfig: KeystoreConfig;
  existingGradle?: string;
  existingProperties?: string;
  useExistingKeystore?: boolean;
  keystorePath?: string;
}

export interface ScriptOutput {
  filename: string;
  content: string;
  type: 'bash' | 'powershell';
  description: string;
}

export interface AnalysisResponse {
  keystoreCommand: string;
  propertiesFile: string;
  gradleCode: string;
  buildCommand: string;
  bundleLocation: string;
  instructions: string;
  scripts: ScriptOutput[];
}

export interface DiagnoseRequest {
  projectType: ProjectType;
  errorLog: string;
  keystoreConfig?: KeystoreConfig;
}

export interface DiagnoseResponse {
  rootCause: string;
  solution: string;
  stepsToFix: string[];
  correctedConfigs?: {
    filename: string;
    content: string;
  }[];
}
