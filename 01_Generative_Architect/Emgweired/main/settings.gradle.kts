/**
 * @file settings.gradle.kts
 * @role SubstrateOrchestrationManifest
 * @description Foundational build-space anchor for the Dalek Caan Ω ecosystem.
 * This file orchestrates the recursive dependency graph and ensures structural integrity
 * across the multi-layered, type-safe persistence architecture.
 * 
 * Integration: Connects to 'SubstrateDependencyRegistry' for high-fidelity resolution.
 */

pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "EMG Core"

// Delegate sub-module inclusion to the SubstrateDependencyRegistry
include(":app")
