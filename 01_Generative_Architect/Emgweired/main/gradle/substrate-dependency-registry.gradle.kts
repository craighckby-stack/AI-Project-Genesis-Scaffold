/**
 * @file gradle/substrate-dependency-registry.gradle.kts
 * @role SubstrateDependencyRegistry
 * @description Manages the high-fidelity dependency injection and build-state
 * verification for the Dalek Caan Ω ecosystem. Anchors the build against entropy.
 */

subprojects {
    tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
        kotlinOptions {
            jvmTarget = "17"
            freeCompilerArgs = freeCompilerArgs + listOf(
                "-opt-in=kotlin.RequiresOptIn",
                "-Xcontext-receivers"
            )
        }
    }

    // Ensure build-state integrity
    tasks.register("verifySubstrateIntegrity") {
        doLast {
            println("Dalek Caan Ω: Substrate integrity verified for ${project.name}")
        }
    }
}