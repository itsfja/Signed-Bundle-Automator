import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCode, 
  Folder, 
  FolderCheck, 
  Lock, 
  Key, 
  Terminal, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Download, 
  RefreshCw, 
  Play, 
  FileText, 
  HelpCircle, 
  Info, 
  Cpu, 
  Wrench, 
  ShieldAlert, 
  ArrowRight, 
  UploadCloud, 
  ExternalLink,
  Check,
  Eye,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { ProjectType, KeystoreConfig, AnalysisResponse, DiagnoseResponse } from './types';
import { generateSigningConfig } from './utils/generator';
import { diagnoseBuildError } from './utils/diagnostics';

export default function App() {
  // Tabs: 'automator' | 'troubleshooter' | 'visualizer'
  const [activeTab, setActiveTab] = useState<'automator' | 'troubleshooter' | 'visualizer'>('automator');

  // Input states for Automator
  const [projectType, setProjectType] = useState<ProjectType>('capacitor');
  const [appName, setAppName] = useState('UKcare202526');
  const [packageName, setPackageName] = useState('com.number38.UKcare202526');
  const [versionCode, setVersionCode] = useState('1');
  const [versionName, setVersionName] = useState('1.0.0');
  const [existingGradle, setExistingGradle] = useState('');
  const [useExistingKeystore, setUseExistingKeystore] = useState(true);
  const [keystorePath, setKeystorePath] = useState('I:\\My Drive\\developer\\keys\\keystore');
  
  // Keystore config state
  const [keystoreConfig, setKeystoreConfig] = useState<KeystoreConfig>({
    alias: 'key0',
    keyPassword: 'mysecurepassword123',
    storePassword: 'mysecurepassword123',
    validityDays: 10000,
    fullName: 'Android Developer',
    orgUnit: 'Mobile Engineering',
    organization: 'AI Studio Creators',
    city: 'San Francisco',
    state: 'California',
    country: 'US'
  });

  // State to toggle password visibility
  const [showPasswords, setShowPasswords] = useState(false);

  // Output states
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  
  // Automator inner tabs: 'guide' | 'scripts' | 'configs' | 'destination'
  const [outputTab, setOutputTab] = useState<'guide' | 'scripts' | 'configs' | 'destination'>('guide');
  const [activeScriptIndex, setActiveScriptIndex] = useState(0);
  const [activeConfigTab, setActiveConfigTab] = useState<'properties' | 'gradle'>('properties');

  // Copy helpers
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Troubleshooter states
  const [troubleProjectType, setTroubleProjectType] = useState<ProjectType>('capacitor');
  const [errorLog, setErrorLog] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnoseResult, setDiagnoseResult] = useState<DiagnoseResponse | null>(null);

  // Troubleshooting templates
  const errorTemplates = [
    {
      title: "Keystore Not Found",
      log: "Execution failed for task ':app:validateSigningRelease'.\n> Keystore file '/path/to/project/android/app/release-key.jks' not found for signing config 'release'."
    },
    {
      title: "Password Verification Failed",
      log: "Execution failed for task ':app:packageRelease'.\n> Failed to read key release-key from keystore /path/to/project/android/app/key.jks: Keystore was tampered with, or password was incorrect"
    },
    {
      title: "Invalid Key Alias",
      log: "Execution failed for task ':app:signReleaseBundle'.\n> java.security.UnrecoverableKeyException: Cannot recover key: Alias 'wrong-alias' does not exist"
    },
    {
      title: "JDK/Gradle Incompatibility",
      log: "Could not open remapped class cache for b923ksj (file:/Users/dev/.gradle/caches/sandbox/1).\n> JDK 21 is not compatible with Gradle 7.4. Use JDK 11 or upgrade Gradle."
    }
  ];

  // Cryptographic Visualizer states
  const [visualAppId, setVisualAppId] = useState('com.company.coolapp');
  const [visualVersion, setVisualVersion] = useState('1.0.0');
  const [isSigningSimulated, setIsSigningSimulated] = useState(false);
  const [simulatedSignature, setSimulatedSignature] = useState('');

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Simulate a brief delay to maintain the premium analytical UX feedback loop
      await new Promise((resolve) => setTimeout(resolve, 350));
      
      const result = generateSigningConfig({
        projectType,
        appName,
        packageName,
        keystoreConfig,
        existingGradle: existingGradle || undefined,
        useExistingKeystore,
        keystorePath: useExistingKeystore ? keystorePath : undefined,
        versionCode: versionCode || undefined,
        versionName: versionName || undefined
      });

      setAnalysisResult(result);
      setOutputTab('guide'); // Reset to guide view
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'An unexpected error occurred while generating code signing parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnose = async () => {
    if (!errorLog.trim()) return;
    setIsDiagnosing(true);
    setApiError(null);
    try {
      // Simulate analysis delay for realistic UX feedback
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const result = diagnoseBuildError({
        projectType: troubleProjectType,
        errorLog,
        keystoreConfig
      });

      setDiagnoseResult(result);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'An error occurred while diagnosing the build log.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleDownloadScript = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const simulateSignatureHash = () => {
    setIsSigningSimulated(true);
    // Simple mock hash based on inputs
    let hash = 0;
    const combinedStr = visualAppId + visualVersion + keystoreConfig.alias + keystoreConfig.fullName;
    for (let i = 0; i < combinedStr.length; i++) {
      hash = (hash << 5) - hash + combinedStr.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    setSimulatedSignature(`SHA256-SIG: ${hex}-FB82-4E90-951A-${hex.split('').reverse().join('')}-KEYSTORE-SIGNED`);
  };

  const getFrameworkLogo = (type: ProjectType) => {
    switch (type) {
      case 'flutter': return '🔵';
      case 'react-native': return '⚛️';
      case 'capacitor': return '⚡';
      case 'cordova': return '🪶';
      case 'native-android': return '🤖';
      case 'unity': return '🎮';
      default: return '📦';
    }
  };

  const getFrameworkDisplayName = (type: ProjectType) => {
    switch (type) {
      case 'flutter': return 'Flutter App';
      case 'react-native': return 'React Native';
      case 'capacitor': return 'Capacitor Android';
      case 'cordova': return 'Cordova Android';
      case 'native-android': return 'Native Kotlin/Java';
      case 'unity': return 'Unity Android';
      default: return 'Android Project';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-300 font-sans flex flex-col antialiased">
      {/* Top Navigation / Header */}
      <header className="bg-[#0E0E0E] border-b border-[#1F1F1F] sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-[0_0_12px_rgba(99,102,241,0.4)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Signed Bundle Automator</h1>
              <p className="text-xs text-slate-500 font-mono">Platform Integration Engine</p>
            </div>
          </div>

          {/* Core Tabs */}
          <nav className="flex space-x-1 bg-[#1A1A1A] border border-[#2D2D2D] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('automator')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'automator' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Play className="w-3.5 h-3.5" />
                <span>⚡ Automator</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('troubleshooter')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'troubleshooter' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wrench className="w-3.5 h-3.5" />
                <span>🔧 Troubleshooter</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'visualizer' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Eye className="w-3.5 h-3.5" />
                <span>🔐 Keystore Vault</span>
              </div>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Connection/Secret Key Advisory Banner */}
        <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg mt-0.5 sm:mt-0 border border-indigo-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Secure Offline Android Release Automation</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Utilizes 100% self-contained client-side logic. Your private passwords, alias settings, and error logs are processed entirely in your browser and never sent over the network.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono px-3 py-1 bg-[#1A1A1A] border border-[#2D2D2D] rounded-full text-indigo-400 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            ACTIVE: SECURE CLIENT-SIDE
          </div>
        </div>

        {apiError && (
          <div className="bg-rose-950/20 border border-rose-900/50 text-rose-200 px-4 py-3 rounded-xl flex items-start space-x-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold">Generation Failed: </span>
              {apiError}
            </div>
          </div>
        )}

        {/* Tab Content Panels */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: AUTOMATOR & CONFIGURATOR */}
            {activeTab === 'automator' && (
              <motion.div
                key="automator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                {/* CONFIGURATION FORM: Spans 5 columns */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="bg-[#0C0C0C] rounded-2xl border border-[#1F1F1F] p-6 shadow-md">
                    <div className="flex items-center space-x-2 border-b border-[#1F1F1F] pb-4 mb-4">
                      <Settings className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-base font-semibold text-white">1. Project Metadata & Key Specs</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Project Type */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Project Framework / Platform
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['flutter', 'react-native', 'capacitor', 'native-android', 'cordova', 'unity'] as ProjectType[]).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setProjectType(type)}
                              className={`px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                                projectType === type
                                  ? 'border-indigo-500 bg-indigo-500/10 text-white font-semibold ring-1 ring-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                                  : 'border-[#1F1F1F] bg-[#0E0E0E] hover:border-[#2D2D2D] hover:bg-[#141414] text-slate-300'
                              }`}
                            >
                              <span className="truncate">{getFrameworkDisplayName(type)}</span>
                              <span className="text-base shrink-0">{getFrameworkLogo(type)}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* App Name & Package Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Application Name
                          </label>
                          <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="e.g. My AI App"
                            className="w-full px-3 py-2 border border-[#1F1F1F] rounded-lg text-sm bg-[#0E0E0E] text-white focus:bg-[#141414] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Android Package Name
                          </label>
                          <input
                            type="text"
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                            placeholder="e.g. com.mycompany.app"
                            className="w-full px-3 py-2 border border-[#1F1F1F] rounded-lg text-sm bg-[#0E0E0E] text-white focus:bg-[#141414] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Play Store Version Configuration */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Version Name (Play Store)
                          </label>
                          <input
                            type="text"
                            value={versionName}
                            onChange={(e) => setVersionName(e.target.value)}
                            placeholder="e.g. 1.0.0"
                            className="w-full px-3 py-2 border border-[#1F1F1F] rounded-lg text-sm bg-[#0E0E0E] text-white focus:bg-[#141414] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Version Code
                            </label>
                            <span className="text-[10px] text-slate-500 normal-case">Must be integer</span>
                          </div>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={versionCode}
                            onChange={(e) => setVersionCode(e.target.value)}
                            placeholder="e.g. 1"
                            className="w-full px-3 py-2 border border-[#1F1F1F] rounded-lg text-sm bg-[#0E0E0E] text-white focus:bg-[#141414] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Keystore Config Security Block */}
                      <div className="bg-[#141414] rounded-xl p-4 border border-[#1F1F1F]">
                        <div className="flex items-center justify-between mb-3 border-b border-[#1F1F1F] pb-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-indigo-400" />
                            Private Keystore Credentials
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="text-2xs text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            {showPasswords ? "Hide Secrets" : "Reveal Secrets"}
                          </button>
                        </div>

                        {/* Existing Keystore Toggle Option */}
                        <div className="mb-4 bg-[#0C0C0C] p-3 rounded-lg border border-[#1F1F1F] flex items-center justify-between">
                          <div className="flex flex-col pr-2">
                            <span className="text-2xs font-bold text-white uppercase tracking-wider">Use Existing Keystore (.jks)</span>
                            <span className="text-[10px] text-slate-500 leading-normal">Configure gradle to sign with your pre-existing .jks keystore.</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={useExistingKeystore}
                              onChange={(e) => setUseExistingKeystore(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#1F1F1F] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-indigo-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600/30 border border-[#2D2D2D] peer-checked:border-indigo-500"></div>
                          </label>
                        </div>

                        {/* Existing Keystore File Path Input */}
                        {useExistingKeystore && (
                          <div className="mb-4 bg-[#141414] p-3 rounded-lg border border-[#1F1F1F] space-y-2">
                            <label className="block text-2xs font-bold text-slate-300 uppercase tracking-wider">
                              Keystore File Path / Location
                            </label>
                            <input
                              type="text"
                              value={keystorePath}
                              onChange={(e) => setKeystorePath(e.target.value)}
                              placeholder="e.g., /Users/username/keys/release-key.jks"
                              className="w-full px-3 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Specify the path to your pre-existing <code className="text-indigo-400">.jks</code> file. This can be an absolute path on your PC or relative to the Android directory.
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                              Key Alias
                            </label>
                            <input
                              type="text"
                              value={keystoreConfig.alias}
                              onChange={(e) => setKeystoreConfig({ ...keystoreConfig, alias: e.target.value })}
                              placeholder="e.g. my-release-key"
                              className="w-full px-3 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                                Store Password
                              </label>
                              <input
                                type={showPasswords ? "text" : "password"}
                                value={keystoreConfig.storePassword}
                                onChange={(e) => setKeystoreConfig({ ...keystoreConfig, storePassword: e.target.value })}
                                className="w-full px-3 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                                Key Private Password
                              </label>
                              <input
                                type={showPasswords ? "text" : "password"}
                                value={keystoreConfig.keyPassword}
                                onChange={(e) => setKeystoreConfig({ ...keystoreConfig, keyPassword: e.target.value })}
                                className="w-full px-3 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          {!useExistingKeystore && (
                            <div>
                              <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                                Certificate Validity (Days)
                              </label>
                              <input
                                type="number"
                                value={keystoreConfig.validityDays}
                                onChange={(e) => setKeystoreConfig({ ...keystoreConfig, validityDays: parseInt(e.target.value) || 10000 })}
                                className="w-full px-3 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Keystore Certificate Details (DName fields) */}
                      {!useExistingKeystore && (
                        <details className="group border border-[#1F1F1F] rounded-xl bg-[#0C0C0C] overflow-hidden transition-all duration-200">
                          <summary className="flex items-center justify-between px-4 py-3 bg-[#0E0E0E] cursor-pointer select-none">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Certificate Signature Info (DName)
                            </span>
                            <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 text-xs">▼</span>
                          </summary>
                          <div className="p-4 border-t border-[#1F1F1F] space-y-3 bg-[#0C0C0C]">
                            <div>
                              <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                                First & Last Name (Common Name - CN)
                              </label>
                              <input
                                type="text"
                                value={keystoreConfig.fullName}
                                onChange={(e) => setKeystoreConfig({ ...keystoreConfig, fullName: e.target.value })}
                                className="w-full px-3 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                                  Organizational Unit (OU)
                                </label>
                                <input
                                  type="text"
                                  value={keystoreConfig.orgUnit}
                                  onChange={(e) => setKeystoreConfig({ ...keystoreConfig, orgUnit: e.target.value })}
                                  className="w-full px-3 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                                  Organization (O)
                                </label>
                                <input
                                  type="text"
                                  value={keystoreConfig.organization}
                                  onChange={(e) => setKeystoreConfig({ ...keystoreConfig, organization: e.target.value })}
                                  className="w-full px-3 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                                  City (L)
                                </label>
                                <input
                                  type="text"
                                  value={keystoreConfig.city}
                                  onChange={(e) => setKeystoreConfig({ ...keystoreConfig, city: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                                  State (ST)
                                </label>
                                <input
                                  type="text"
                                  value={keystoreConfig.state}
                                  onChange={(e) => setKeystoreConfig({ ...keystoreConfig, state: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-2xs font-semibold text-slate-400 mb-0.5">
                                  Country Code (C)
                                </label>
                                <input
                                  type="text"
                                  maxLength={2}
                                  value={keystoreConfig.country}
                                  onChange={(e) => setKeystoreConfig({ ...keystoreConfig, country: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-[#1F1F1F] rounded-md text-xs bg-[#0E0E0E] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        </details>
                      )}

                      {/* Optional Gradle Paste */}
                      <details className="group border border-[#1F1F1F] rounded-xl bg-[#0C0C0C] overflow-hidden">
                        <summary className="flex items-center justify-between px-4 py-3 bg-[#0E0E0E] cursor-pointer select-none">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                            Optional: Context build.gradle
                          </span>
                          <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 text-xs">▼</span>
                        </summary>
                        <div className="p-4 border-t border-[#1F1F1F] space-y-2 bg-[#0C0C0C]">
                          <p className="text-2xs text-slate-400 mb-1">
                            Paste your existing <code className="font-mono bg-[#141414] px-1 py-0.5 rounded text-indigo-400">android/app/build.gradle</code> file. Our generator will analyze its structure and output the ideal signing configurations block.
                          </p>
                          <textarea
                            value={existingGradle}
                            onChange={(e) => setExistingGradle(e.target.value)}
                            placeholder="// Paste your build.gradle here..."
                            className="w-full h-32 px-3 py-2 border border-[#1F1F1F] rounded-lg text-xs font-mono bg-[#0E0E0E] text-slate-300 focus:bg-[#141414] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </details>

                      {/* Action trigger button */}
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-center space-x-2.5 disabled:bg-indigo-800/40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Compiling Automation Directives...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            <span>Assemble Release Automation Engine</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* VISUAL RESULTS & ARTIFACT PANELS: Spans 7 columns */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {!analysisResult ? (
                    /* Initial educational welcome state */
                    <div className="bg-[#0C0C0C] rounded-2xl border border-[#1F1F1F] p-8 shadow-md text-center flex flex-col items-center justify-center min-h-[500px]">
                      <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-full mb-6 ring-8 ring-indigo-500/10">
                        <Lock className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Configure Your Release Pipeline</h3>
                      <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
                        Provide your application specifics on the left. The compiler will structure a customized pipeline to securely sign your binary, and trace the path directly to your signed Android App Bundle (.aab).
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg text-left">
                        <div className="border border-[#1F1F1F] bg-[#141414] p-4 rounded-xl">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Step 01</span>
                          <h4 className="text-xs font-bold text-slate-200 mb-1">{useExistingKeystore ? "Verify JKS Key" : "Generate JKS Key"}</h4>
                          <p className="text-2xs text-slate-400">
                            {useExistingKeystore 
                              ? "Inspect and verify your existing cryptographic key container details safely."
                              : "Create private cryptographic keystore containers safely via JDK keytool."}
                          </p>
                        </div>
                        <div className="border border-[#1F1F1F] bg-[#141414] p-4 rounded-xl">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Step 02</span>
                          <h4 className="text-xs font-bold text-slate-200 mb-1">Inject Gradle</h4>
                          <p className="text-2xs text-slate-400">Enable gradle.signingConfigs to automatically read secrets safely.</p>
                        </div>
                        <div className="border border-[#1F1F1F] bg-[#141414] p-4 rounded-xl">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Step 03</span>
                          <h4 className="text-xs font-bold text-slate-200 mb-1">Release Bundle</h4>
                          <p className="text-2xs text-slate-400">Execute compilation. Trace and package the signed .aab artifact.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Fully compiled result output cards */
                    <div className="bg-[#0C0C0C] rounded-2xl border border-[#1F1F1F] shadow-md flex flex-col overflow-hidden min-h-[550px]">
                      
                      {/* Sub tab navigation */}
                      <div className="bg-[#0E0E0E] border-b border-[#1F1F1F] px-4 flex flex-wrap gap-2 pt-3">
                        <button
                          onClick={() => setOutputTab('guide')}
                          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all -mb-px ${
                            outputTab === 'guide'
                              ? 'border-indigo-500 text-indigo-400 font-semibold'
                              : 'border-transparent text-slate-400 hover:text-white'
                          }`}
                        >
                          📋 Step-by-Step Guide
                        </button>
                        <button
                          onClick={() => setOutputTab('destination')}
                          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all -mb-px ${
                            outputTab === 'destination'
                              ? 'border-indigo-500 text-indigo-400 font-semibold'
                              : 'border-transparent text-slate-400 hover:text-white'
                          }`}
                        >
                          📍 Location Map (.aab)
                        </button>
                        <button
                          onClick={() => setOutputTab('scripts')}
                          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all -mb-px ${
                            outputTab === 'scripts'
                              ? 'border-indigo-500 text-indigo-400 font-semibold'
                              : 'border-transparent text-slate-400 hover:text-white'
                          }`}
                        >
                          💻 Automated Scripts
                        </button>
                        <button
                          onClick={() => setOutputTab('configs')}
                          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all -mb-px ${
                            outputTab === 'configs'
                              ? 'border-indigo-500 text-indigo-400 font-semibold'
                              : 'border-transparent text-slate-400 hover:text-white'
                          }`}
                        >
                          ⚙️ Config Files
                        </button>
                      </div>

                      {/* Tab panels details */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        
                        {/* PANEL A: COMPREHENSIVE GUIDE */}
                        {outputTab === 'guide' && (
                          <div className="space-y-6">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                  <Terminal className="w-5 h-5 text-indigo-400" />
                                  {useExistingKeystore ? "Keystore Verification CLI" : "Keystore Generation CLI"}
                                </h3>
                                <button
                                  onClick={() => triggerCopy(analysisResult.keystoreCommand, 'keytool')}
                                  className="text-2xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/20"
                                >
                                  {copiedText === 'keytool' ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-emerald-400 font-semibold">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy Command</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-slate-400 mb-2">
                                {useExistingKeystore 
                                  ? "Run this verification command in your project directory to inspect your existing keystore and confirm its alias:"
                                  : "Open your system terminal, run this keytool command inside your project directory to generate the release cryptographic key container:"}
                              </p>
                              <div className="terminal-block p-4 rounded-lg text-xs break-all shadow-inner select-all leading-relaxed whitespace-pre-wrap font-mono border border-[#1F1F1F]">
                                {analysisResult.keystoreCommand}
                              </div>
                            </div>

                            <div className="border-t border-[#1F1F1F] pt-4">
                              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                                <Play className="w-5 h-5 text-indigo-400" />
                                Compile & Sign Command
                              </h3>
                              <p className="text-xs text-slate-400 mb-2">
                                Run this release build command in the terminal to trigger Gradle packaging and code signing:
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="bg-[#0F0F0F] text-emerald-400 border border-[#1F1F1F] font-mono text-xs px-4 py-3 rounded-lg flex-1 shadow-inner select-all">
                                  $ {analysisResult.buildCommand}
                                </div>
                                <button
                                  onClick={() => triggerCopy(analysisResult.buildCommand, 'build')}
                                  className="bg-[#1A1A1A] hover:bg-[#2D2D2D] text-slate-300 border border-[#2D2D2D] p-3 rounded-lg transition-all"
                                  title="Copy build command"
                                >
                                  {copiedText === 'build' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div className="border-t border-[#1F1F1F] pt-4 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Target Signed App Bundle Location (.aab)
                              </h4>
                              <p className="text-xs text-emerald-500/80 mb-2">
                                Once built, locate your final signed Google Play compatible App Bundle right here:
                              </p>
                              <div className="flex items-center gap-2">
                                <code className="font-mono text-xs bg-[#0F0F0F] text-indigo-400 border border-[#1F1F1F] px-3 py-2 rounded-lg font-bold select-all break-all flex-1">
                                  {analysisResult.bundleLocation}
                                </code>
                                <button
                                  onClick={() => triggerCopy(analysisResult.bundleLocation, 'location')}
                                  className="bg-[#1A1A1A] hover:bg-[#2D2D2D] border border-[#2D2D2D] text-slate-300 px-3 py-2 rounded-lg text-xs font-semibold shrink-0"
                                >
                                  {copiedText === 'location' ? 'Copied!' : 'Copy Path'}
                                </button>
                              </div>
                            </div>

                            <div className="border-t border-[#1F1F1F] pt-4 prose prose-slate max-w-none text-xs text-slate-300 max-h-[180px] overflow-y-auto pr-2 bg-[#141414] border border-[#1F1F1F] p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                              <h4 className="text-xs font-bold text-white mb-1 border-b border-[#1F1F1F] pb-1">Additional Walkthrough Instructions</h4>
                              {analysisResult.instructions}
                            </div>
                          </div>
                        )}

                        {/* PANEL B: DESTINATION MAP */}
                        {outputTab === 'destination' && (
                          <div className="space-y-6 flex-1 flex flex-col">
                            <div>
                              <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-1">
                                <FolderCheck className="w-5 h-5 text-indigo-400" />
                                Visual Directory Path to Signed Bundle
                              </h3>
                              <p className="text-xs text-slate-400">
                                This diagram visually points out the precise final file tree path for <strong className="text-white">{getFrameworkDisplayName(projectType)}</strong> where your signed <code className="bg-[#141414] px-1 py-0.5 rounded font-mono text-indigo-400 border border-[#1F1F1F]">.aab</code> is created.
                              </p>
                            </div>

                            {/* Render visual folder structure */}
                            <div className="bg-[#111111] rounded-xl p-6 font-mono text-xs text-slate-300 flex-1 border border-[#1F1F1F] shadow-inner overflow-x-auto min-h-[300px]">
                              <div className="space-y-1 bg-transparent p-2">
                                <div className="flex items-center space-x-2 text-indigo-400">
                                  <Folder className="w-4 h-4 shrink-0 fill-indigo-400/20" />
                                  <span className="font-bold">{appName.toLowerCase().replace(/\s+/g, '-')} (Project Root)</span>
                                </div>
                                <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1 py-1">
                                  {projectType === 'flutter' && (
                                    <>
                                      <div className="flex items-center space-x-2 text-slate-500">
                                        <Folder className="w-4 h-4 shrink-0" />
                                        <span>lib/ (Dart source)</span>
                                      </div>
                                      <div className="flex items-center space-x-2 text-emerald-400">
                                        <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                        <span className="font-bold">build/</span>
                                      </div>
                                      <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1">
                                        <div className="flex items-center space-x-2 text-emerald-400">
                                          <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                          <span>app/</span>
                                        </div>
                                        <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1">
                                          <div className="flex items-center space-x-2 text-emerald-400">
                                            <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                            <span>outputs/</span>
                                          </div>
                                          <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1">
                                            <div className="flex items-center space-x-2 text-emerald-400">
                                              <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                              <span>bundle/</span>
                                            </div>
                                            <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1">
                                              <div className="flex items-center space-x-2 text-emerald-400">
                                                <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                                <span className="font-semibold">release/</span>
                                              </div>
                                              <div className="pl-4 border-l border-dashed border-emerald-500/50 ml-2 py-1">
                                                <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-bold animate-pulse inline-flex">
                                                  <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
                                                  <span>app-release.aab</span>
                                                  <span className="text-2xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider ml-1">SIGNED BUNDLE</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {projectType !== 'flutter' && (
                                    <>
                                      <div className="flex items-center space-x-2 text-emerald-400">
                                        <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                        <span className="font-bold">android/</span>
                                      </div>
                                      <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1">
                                        <div className="flex items-center space-x-2 text-slate-500">
                                          <FileText className="w-4 h-4 shrink-0" />
                                          <span className="font-semibold text-indigo-400">key.properties</span>
                                          <span className="text-3xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1 rounded">Safeguard Credentials</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-slate-400">
                                          <FileText className="w-4 h-4 shrink-0" />
                                          <span className="text-amber-400 font-medium">release-key.jks (Keystore file)</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-emerald-400">
                                          <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                          <span>app/</span>
                                        </div>
                                        <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1">
                                          <div className="flex items-center space-x-2 text-emerald-400">
                                            <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                            <span>build/</span>
                                          </div>
                                          <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1">
                                            <div className="flex items-center space-x-2 text-emerald-400">
                                              <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                              <span>outputs/</span>
                                            </div>
                                            <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1">
                                              <div className="flex items-center space-x-2 text-emerald-400">
                                                <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                                <span>bundle/</span>
                                              </div>
                                              <div className="pl-4 border-l border-[#2D2D2D] ml-2 space-y-1">
                                                <div className="flex items-center space-x-2 text-emerald-400">
                                                  <Folder className="w-4 h-4 shrink-0 fill-emerald-400/10" />
                                                  <span className="font-semibold">release/</span>
                                                </div>
                                                <div className="pl-4 border-l border-dashed border-emerald-500/50 ml-2 py-1">
                                                  <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-bold animate-pulse inline-flex">
                                                    <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
                                                    <span>app-release.aab</span>
                                                    <span className="text-2xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider ml-1">SIGNED BUNDLE</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Command to open in Explorer/Mac Finder */}
                            <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
                              <div className="flex items-center space-x-2">
                                <FolderOpen className="w-4 h-4 text-slate-400" />
                                <span>Command to instantly reveal this folder in your OS File Manager:</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-[#141414] border border-[#1F1F1F] px-3 py-1.5 rounded font-mono font-semibold text-slate-200 shrink-0">
                                <span>explorer.exe . \android\app\build\outputs\bundle\release</span>
                                <button
                                  onClick={() => triggerCopy('explorer.exe .\\android\\app\\build\\outputs\\bundle\\release', 'open-explorer')}
                                  className="text-indigo-400 hover:text-indigo-300 ml-1.5 cursor-pointer"
                                  title="Copy Windows command"
                                >
                                  {copiedText === 'open-explorer' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PANEL C: AUTOMATED SCRIPTS */}
                        {outputTab === 'scripts' && (
                          <div className="space-y-4 flex-1 flex flex-col">
                            <div>
                              <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-1">
                                <Cpu className="w-5 h-5 text-indigo-400" />
                                One-Click Automation Scripts
                              </h3>
                              <p className="text-xs text-slate-400">
                                Download or copy these fully autonomous setup scripts. Simply place them in your project root, run them, and they will automate keytool parameters, keystore creation, safe credential properties, compilation, and point you directly to the signed bundle!
                              </p>
                            </div>

                            {/* Script tabs */}
                            <div className="flex space-x-1 border-b border-[#1F1F1F] pb-1.5">
                              {analysisResult.scripts.map((script, idx) => (
                                <button
                                  key={script.filename}
                                  onClick={() => setActiveScriptIndex(idx)}
                                  className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-all ${
                                    activeScriptIndex === idx
                                      ? 'bg-indigo-600 text-white shadow-md'
                                      : 'text-slate-400 hover:bg-[#141414] hover:text-white'
                                  }`}
                                >
                                  {script.type === 'bash' ? '🍏 macOS / Linux (.sh)' : '🪟 Windows PowerShell (.ps1)'}
                                </button>
                              ))}
                            </div>

                            {/* Active script details */}
                            <div className="flex-1 flex flex-col justify-between">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono font-semibold text-indigo-400">
                                  📄 {analysisResult.scripts[activeScriptIndex].filename}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => triggerCopy(analysisResult.scripts[activeScriptIndex].content, 'script-code')}
                                    className="text-2xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded"
                                  >
                                    {copiedText === 'script-code' ? 'Copied!' : 'Copy Script'}
                                  </button>
                                  <button
                                    onClick={() => handleDownloadScript(analysisResult.scripts[activeScriptIndex].filename, analysisResult.scripts[activeScriptIndex].content)}
                                    className="text-2xs text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1 font-medium px-2.5 py-1 rounded shadow-md cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download File</span>
                                  </button>
                                </div>
                              </div>

                              <div className="bg-[#0F0F0F] text-slate-300 border border-[#1F1F1F] p-4 rounded-xl font-mono text-xs overflow-auto max-h-[300px] shadow-inner leading-relaxed whitespace-pre select-all">
                                {analysisResult.scripts[activeScriptIndex].content}
                              </div>
                              <p className="text-3xs text-slate-500 italic mt-2">
                                *Note: Always review shell scripts before executing. This script automates check folders, runs keytool with non-interactive parameters, outputs configs safely, and runs Gradle.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* PANEL D: CONFIG FILES */}
                        {outputTab === 'configs' && (
                          <div className="space-y-4 flex-1 flex flex-col">
                            <div>
                              <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-1">
                                <FileCode className="w-5 h-5 text-indigo-400" />
                                Secret Key Isolation & Gradle Configs
                              </h3>
                              <p className="text-xs text-slate-400">
                                Keeping keystore passwords out of source control is crucial. Create a <code className="bg-[#141414] border border-[#1F1F1F] px-1 rounded text-indigo-400">key.properties</code> file for local credentials, then load it dynamically into Gradle.
                              </p>
                            </div>

                            {/* Sub tab for files */}
                            <div className="flex border-b border-[#1F1F1F]">
                              <button
                                onClick={() => setActiveConfigTab('properties')}
                                className={`px-4 py-2 text-xs font-bold transition-all -mb-px border-b-2 ${
                                  activeConfigTab === 'properties'
                                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                                    : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                              >
                                🔒 key.properties (Safeguard)
                              </button>
                              <button
                                onClick={() => setActiveConfigTab('gradle')}
                                className={`px-4 py-2 text-xs font-bold transition-all -mb-px border-b-2 ${
                                  activeConfigTab === 'gradle'
                                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                                    : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                              >
                                🐘 app/build.gradle (Signing Configs)
                              </button>
                            </div>

                            {activeConfigTab === 'properties' ? (
                              <div className="flex-1 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-2xs font-semibold text-slate-400">
                                    Place file inside: <code className="font-mono bg-[#141414] border border-[#1F1F1F] px-1 py-0.5 rounded text-indigo-400">android/key.properties</code>
                                  </span>
                                  <button
                                    onClick={() => triggerCopy(analysisResult.propertiesFile, 'properties')}
                                    className="text-2xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                                  >
                                    {copiedText === 'properties' ? 'Copied properties!' : 'Copy Code'}
                                  </button>
                                </div>
                                <div className="bg-[#0F0F0F] text-slate-300 border border-[#1F1F1F] p-4 rounded-xl font-mono text-xs overflow-auto max-h-[250px] shadow-inner select-all whitespace-pre leading-relaxed">
                                  {analysisResult.propertiesFile}
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-2xs font-semibold text-slate-400">
                                    Inject this code block inside <code className="font-mono bg-[#141414] border border-[#1F1F1F] px-1 py-0.5 rounded text-indigo-400">android/app/build.gradle</code>:
                                  </span>
                                  <button
                                    onClick={() => triggerCopy(analysisResult.gradleCode, 'gradle-code')}
                                    className="text-2xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                                  >
                                    {copiedText === 'gradle-code' ? 'Copied gradle!' : 'Copy Code'}
                                  </button>
                                </div>
                                <div className="bg-[#0F0F0F] text-slate-300 border border-[#1F1F1F] p-4 rounded-xl font-mono text-xs overflow-auto max-h-[250px] shadow-inner select-all whitespace-pre leading-relaxed">
                                  {analysisResult.gradleCode}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="border-t border-[#1F1F1F] pt-4 mt-6 flex items-center justify-between">
                          <button
                            onClick={() => setAnalysisResult(null)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Recalculate New App Specifications</span>
                          </button>
                          <div className="text-3xs text-slate-500 font-mono">
                            Signed Bundle Automator v1.0.0
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 2: INTERACTIVE TROUBLESHOOTER & DEBUGGER */}
            {activeTab === 'troubleshooter' && (
              <motion.div
                key="troubleshooter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                {/* TROUBLESHOOTER CONTROLS: Spans 5 columns */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="bg-[#0C0C0C] rounded-2xl border border-[#1F1F1F] p-6 shadow-md">
                    <div className="flex items-center space-x-2 border-b border-[#1F1F1F] pb-4 mb-4">
                      <Terminal className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-base font-semibold text-white">Compile Error Diagnostics</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Project Type
                        </label>
                        <select
                          value={troubleProjectType}
                          onChange={(e) => setTroubleProjectType(e.target.value as ProjectType)}
                          className="w-full px-3 py-2 border border-[#1F1F1F] rounded-lg text-sm bg-[#0E0E0E] text-white focus:bg-[#141414] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="flutter">Flutter App</option>
                          <option value="react-native">React Native App</option>
                          <option value="capacitor">Capacitor Android</option>
                          <option value="cordova">Cordova Android</option>
                          <option value="native-android">Native Kotlin/Java</option>
                          <option value="unity">Unity Android</option>
                        </select>
                      </div>

                      {/* Presets templates */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Click to load preset error logs:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {errorTemplates.map((tpl) => (
                            <button
                              key={tpl.title}
                              type="button"
                              onClick={() => {
                                setErrorLog(tpl.log);
                                setDiagnoseResult(null);
                              }}
                              className="text-3xs text-left bg-[#141414] hover:bg-[#1C1C1C] text-slate-300 px-2 py-1.5 rounded-lg border border-[#1F1F1F] hover:border-[#2D2D2D] truncate font-semibold cursor-pointer"
                            >
                              ⚠️ {tpl.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Log text input */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Paste your Gradle Build/Signing Error Log
                        </label>
                        <textarea
                          value={errorLog}
                          onChange={(e) => setErrorLog(e.target.value)}
                          placeholder="Paste terminal error details here (e.g. Task :app:validateSigningRelease failed, Keystore tampered, password verification failed, apksigner exceptions, etc...)"
                          className="w-full h-56 px-3 py-2 border border-[#1F1F1F] rounded-lg text-xs font-mono bg-[#0E0E0E] text-red-400 focus:bg-[#141414] focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>

                      {/* Action button */}
                      <button
                        type="button"
                        onClick={handleDiagnose}
                        disabled={isDiagnosing || !errorLog.trim()}
                        className="w-full bg-[#E11D48] hover:bg-rose-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-center space-x-2.5 disabled:bg-red-950/40 disabled:text-red-400/50 disabled:border-[#1F1F1F] disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isDiagnosing ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Diagnosing Build Stack...</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-5 h-5" />
                            <span>Diagnose Signing Failure</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* DIAGNOSTIC OUTPUT: Spans 7 columns */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {!diagnoseResult ? (
                    <div className="bg-[#0C0C0C] rounded-2xl border border-[#1F1F1F] p-8 shadow-md text-center flex flex-col items-center justify-center min-h-[500px]">
                      <div className="bg-red-500/10 text-red-400 p-4 rounded-full mb-6 ring-8 ring-red-500/10">
                        <ShieldAlert className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Build & Signing Diagnostic Lab</h3>
                      <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
                        Pasted build logs are analyzed on-the-fly by our secure client-side Build Diagnostics engine. Get custom remedies, correct gradle config scripts, and precise workarounds instantly.
                      </p>
                      <span className="text-xs font-mono text-slate-500 bg-[#141414] border border-[#1F1F1F] px-2 py-1 rounded">
                        Paste a log on the left to activate diagnostics
                      </span>
                    </div>
                  ) : (
                    <div className="bg-[#0C0C0C] rounded-2xl border border-[#1F1F1F] shadow-md overflow-hidden flex flex-col min-h-[500px]">
                      <div className="bg-[#140F0F] border-b border-[#2D1F1F] p-6 flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-white">
                          <div className="bg-red-500/20 text-red-400 p-2 rounded-lg">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base leading-tight">Diagnosis Complete</h3>
                            <p className="text-2xs text-red-400/80 mt-0.5">Automated android build audit results</p>
                          </div>
                        </div>
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-2xs font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          Resolved Fix
                        </span>
                      </div>

                      <div className="p-6 flex-1 space-y-6">
                        {/* Root Cause Card */}
                        <div className="bg-[#140F0F] border-l-4 border-red-500 rounded-r-xl p-4 border border-[#2D1F1F] border-l-red-500">
                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Detected Root Cause</h4>
                          <p className="text-sm text-slate-200 font-semibold">{diagnoseResult.rootCause}</p>
                        </div>

                        {/* General Solution */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remedy Overview</h4>
                          <p className="text-xs text-slate-300 leading-relaxed bg-[#141414] p-3 rounded-lg border border-[#1F1F1F]">
                            {diagnoseResult.solution}
                          </p>
                        </div>

                        {/* Steps to Fix */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Corrective Actions To Take</h4>
                          <ul className="space-y-2">
                            {diagnoseResult.stepsToFix.map((step, idx) => (
                              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300 bg-[#0E0E0E] border border-[#1F1F1F] p-2.5 rounded-lg shadow-sm">
                                <span className="bg-indigo-500/10 text-indigo-400 w-5 h-5 rounded-full flex items-center justify-center font-bold text-2xs shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Corrected Configs */}
                        {diagnoseResult.correctedConfigs && diagnoseResult.correctedConfigs.length > 0 && (
                          <div className="border-t border-[#1F1F1F] pt-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remediated Configuration File Snippets</h4>
                            <div className="space-y-4">
                              {diagnoseResult.correctedConfigs.map((config) => (
                                <div key={config.filename} className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-2xs font-mono font-bold text-indigo-400">📄 {config.filename}</span>
                                    <button
                                      onClick={() => triggerCopy(config.content, config.filename)}
                                      className="text-3xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                                    >
                                      {copiedText === config.filename ? 'Copied!' : 'Copy Corrected snippet'}
                                    </button>
                                  </div>
                                  <div className="bg-[#0F0F0F] text-slate-300 border border-[#1F1F1F] p-4 rounded-xl font-mono text-2xs overflow-auto max-h-[180px] whitespace-pre shadow-inner select-all">
                                    {config.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: CRYPTOGRAPHIC KEYSTORE VISUALIZER */}
            {activeTab === 'visualizer' && (
              <motion.div
                key="visualizer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Left explanation card */}
                <div className="bg-[#0C0C0C] rounded-2xl border border-[#1F1F1F] p-6 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 border-b border-[#1F1F1F] pb-4 mb-4">
                      <Lock className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-base font-semibold text-white">Demystifying Android App Bundles & Signing</h2>
                    </div>

                    <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
                      <p>
                        An <strong className="text-slate-200">Android App Bundle (.aab)</strong> is the publishing format for Google Play. It contains all your compiled code and resources, but defers APK generation and signing to Google Play itself.
                      </p>
                      <p>
                        However, Google Play <strong className="text-slate-200">requires</strong> that the uploaded bundle be digitally signed with a private developer certificate (<code className="bg-[#141414] border border-[#1F1F1F] px-1.5 py-0.5 rounded text-indigo-400">release-key.jks</code>).
                      </p>

                      <div className="bg-[#140F1F] border-l-4 border-indigo-500 rounded-r-xl p-4 space-y-2 mt-4 border border-[#231E2D] border-l-indigo-500">
                        <h4 className="font-bold text-xs text-indigo-300">What is inside a Keystore container?</h4>
                        <ul className="list-disc pl-4 space-y-1 text-2xs text-indigo-200/90">
                          <li><strong className="text-indigo-300">Private Key:</strong> Used to generate the cryptographic signature of your app. Must remain absolutely secret!</li>
                          <li><strong className="text-indigo-300">Public Certificate:</strong> Authenticates you as the legitimate owner. Embedded in your bundle.</li>
                          <li><strong className="text-indigo-300">Alias:</strong> The name given to this specific key pair (e.g. "release-key").</li>
                        </ul>
                      </div>

                      <div className="border border-[#1F1F1F] bg-[#141414] p-4 rounded-xl space-y-3">
                        <h4 className="font-bold text-xs text-slate-300">Test the Signature Simulator:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-3xs font-semibold text-slate-400 mb-0.5">App ID</label>
                            <input
                              type="text"
                              value={visualAppId}
                              onChange={(e) => setVisualAppId(e.target.value)}
                              className="w-full px-2 py-1 bg-[#0E0E0E] text-white border border-[#1F1F1F] rounded text-xs focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-semibold text-slate-400 mb-0.5">Version</label>
                            <input
                              type="text"
                              value={visualVersion}
                              onChange={(e) => setVisualVersion(e.target.value)}
                              className="w-full px-2 py-1 bg-[#0E0E0E] text-white border border-[#1F1F1F] rounded text-xs focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={simulateSignatureHash}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 rounded text-xs flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Digitally Sign App Bundle</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-3xs text-slate-500 font-mono border-t border-[#1F1F1F] pt-4 mt-6">
                    SHA-256 Code Signing Certification Lab
                  </div>
                </div>

                {/* Right Visualizer Sandbox */}
                <div className="bg-[#0C0C0C] text-slate-100 rounded-2xl p-6 shadow-md border border-[#1F1F1F] flex flex-col justify-between min-h-[450px]">
                  <div>
                    <span className="text-2xs font-bold font-mono tracking-widest text-indigo-400 uppercase block mb-1">
                      Visual Cryptographic Vault
                    </span>
                    <h3 className="text-lg font-bold text-white mb-4">Digital Signature Verification</h3>

                    {/* Visual representation of JKS file */}
                    <div className="border border-[#1F1F1F] bg-[#0E0E0E] p-6 rounded-xl space-y-6 relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 right-0 p-3 text-3xs font-mono bg-indigo-500/10 border-l border-b border-indigo-500/20 text-indigo-400 uppercase rounded-bl-xl font-bold">
                        Keystore Container
                      </div>

                      {/* Header alias */}
                      <div className="flex items-center space-x-2 border-b border-[#1F1F1F] pb-3">
                        <Key className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          File: <span className="text-slate-200" title={useExistingKeystore ? keystorePath : undefined}>
                            {useExistingKeystore ? (keystorePath.split('/').pop() || 'release-key.jks') : 'release-key.jks'}
                          </span> [Alias: {keystoreConfig.alias}]
                        </span>
                      </div>

                      {/* Key specs */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 block text-3xs">Validity Period</span>
                          <span className="text-slate-300 font-bold">{keystoreConfig.validityDays} Days (~{(keystoreConfig.validityDays/365).toFixed(1)} years)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-3xs">Key Encryption</span>
                          <span className="text-slate-300 font-bold">RSA 2048-bit (SHA256withRSA)</span>
                        </div>
                      </div>

                      {/* Certificate details block */}
                      <div className="border border-[#1F1F1F] bg-[#141414] p-4 rounded-lg space-y-2">
                        <span className="text-3xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Certificate Identity Details (DName)</span>
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 font-mono text-2xs">
                          <div className="truncate"><span className="text-slate-500">CN:</span> {keystoreConfig.fullName}</div>
                          <div className="truncate"><span className="text-slate-500">OU:</span> {keystoreConfig.orgUnit}</div>
                          <div className="truncate"><span className="text-slate-500">O:</span> {keystoreConfig.organization}</div>
                          <div className="truncate"><span className="text-slate-500">Locality:</span> {keystoreConfig.city}, {keystoreConfig.state}</div>
                        </div>
                      </div>

                      {/* Active Signature Simulated Box */}
                      <AnimatePresence>
                        {isSigningSimulated && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 space-y-1.5 relative overflow-hidden"
                          >
                            <div className="flex items-center space-x-2 text-indigo-300">
                              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span className="text-xs font-bold font-mono">Bundle Digital Signature Injected</span>
                            </div>
                            <div className="font-mono text-3xs text-slate-400 break-all select-all py-1 bg-[#0F0F0F] border border-[#1F1F1F] px-2 rounded">
                              {simulatedSignature}
                            </div>
                            <div className="text-3xs text-indigo-400 leading-normal">
                              This cryptographic signature ensures that no third party can modify the App ID <span className="text-indigo-200">({visualAppId})</span> or bundle layout. When Google Play processes this `.aab`, it matches the visual signature against your developer key history to authenticate upgrades safely!
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-6 bg-[#141414] p-3 rounded-lg border border-[#1F1F1F] font-mono">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Always preserve your <code className="bg-[#0E0E0E] border border-[#1F1F1F] px-1 py-0.5 rounded text-indigo-300 text-3xs">.jks</code> file. If lost, you cannot update your application in Google Play!</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      {/* Persistent footer */}
      <footer className="bg-[#0C0C0C] border-t border-[#1F1F1F] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">Signed Bundle Automator</span>
            <span>|</span>
            <span>Interactive Android Publishing Companion</span>
          </div>
          <div>
            Built with React 19, Tailwind CSS 4, and server-side Gemini 3.5 Flash
          </div>
        </div>
      </footer>
    </div>
  );
}
