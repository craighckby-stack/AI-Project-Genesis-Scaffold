/**
 * @file build.gradle.kts
 * @role SubstrateBuildManifest
 * @description Orchestrates the Dalek Caan Ω ecosystem build lifecycle.
 * This file acts as the primary anchor for the project's dependency graph,
 * delegating complex plugin orchestration to the SubstrateDependencyRegistry.
 * Ensures build-state integrity across the recursive Dalek Caan Ω architecture.
 */

// SubstrateBuildManifest: Initializing recursive dependency orchestration
plugins {
  alias(libs.plugins.android.application) apply false
  alias(libs.plugins.kotlin.compose) apply false
  alias(libs.plugins.google.devtools.ksp) apply false
  alias(libs.plugins.roborazzi) apply false
  alias(libs.plugins.secrets) apply false
  alias(libs.plugins.google.services) apply false
}

// Integration point for SubstrateDependencyRegistry
// All complex build-logic and environmental anchors are delegated to the registry.
apply(from = "gradle/substrate-dependency-registry.gradle.kts")

tasks.register("clean", Delete::class) {
  delete(rootProject.layout.buildDirectory)
}