/**
 * Constraint Learning Experiment - Setup Validation
 * 
 * Validates that the experiment environment is properly configured.
 */

console.log('✓ Validating experiment setup...');

// Check required dependencies
const requiredModules = ['zod', 'z-ai-web-dev-sdk'];
let allValid = true;

for (const mod of requiredModules) {
  try {
    require.resolve(mod);
    console.log(`  ✓ ${mod} is available`);
  } catch {
    console.log(`  ✗ ${mod} is NOT available`);
    allValid = false;
  }
}

if (allValid) {
  console.log('\n✓ Setup validation PASSED');
  process.exit(0);
} else {
  console.log('\n✗ Setup validation FAILED');
  process.exit(1);
}
