# ------------------------------------------------------------------------------
# DARLEK CAAN Ω - PROGUARD EVOLUTION MANIFEST
# Role: System-wide obfuscation, reflection shielding, and runtime integrity.
# Integration: Connects to app/build.gradle.kts and src/lib/env-orchestrator.ts
# ------------------------------------------------------------------------------

# --- 1. CORE ENGINE PROTECTION (Dalek Caan Ω Recursive Logic) ---
# Prevents the compiler from stripping or renaming critical recursive logic
# that relies on reflection or dynamic state evaluation.
-keep class com.dalek.engine.** { *; }
-keep interface com.dalek.engine.types.** { *; }
-keepclassmembers class * implements com.dalek.engine.IRecursiveEntity { 
    public <methods>; 
}

# --- 2. ZERO-LEAK SANDBOXING (Environment Orchestration) ---
# Protects sensitive environment-orchestrator logic from being exposed
# via stack traces or class name analysis.
-keep class src.lib.env_orchestrator.** { *; }
-keepclassmembers class src.lib.env_orchestrator.** { 
    private <fields>; 
}

# --- 3. FIREBASE & NETWORKING INTEGRITY ---
# Ensures Firebase SDKs remain functional while obfuscating custom wrappers.
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keepattributes Signature,InnerClasses,EnclosingMethod

# --- 4. DEBUGGING & TRACEABILITY ---
# Preserves line numbers for critical system crashes while stripping 
# source file metadata to prevent path leakage.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- 5. WEBVIEW & JS INTERFACE PROTECTION ---
# Protects custom JS interfaces used for the AgentProbe narrative decryption.
-keepclassmembers class * implements android.webkit.JavascriptInterface {
    public *;
}

# --- 6. GENERAL OPTIMIZATION ---
-optimizations !code/simplification/arithmetic,!code/simplification/cast
-allowaccessmodification
-dontskipnonpubliclibraryclasses

# --- 7. DELEGATED REGISTRY INTEGRATION ---
# Imports external obfuscation constraints from the SubstrateObfuscationRegistry
-include proguard-substrate-registry.pro