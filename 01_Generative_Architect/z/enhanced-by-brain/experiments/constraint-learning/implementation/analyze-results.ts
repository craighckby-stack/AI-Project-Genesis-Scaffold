/**
 * Constraint Learning Experiment - Analyze Results
 * 
 * Analyzes the results from the constraint learning experiment.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('Analyzing experiment results...');

const dataDir = join(process.cwd(), 'experiments', 'constraint-learning', 'data');
const resultsPath = join(dataDir, 'experiment-results.json');

if (!existsSync(resultsPath)) {
  console.log('No experiment results found. Run the experiment first.');
  process.exit(0);
}

const results = JSON.parse(readFileSync(resultsPath, 'utf-8'));

console.log('\n=== EXPERIMENT ANALYSIS ===\n');
console.log(`Experiment: ${results.experiment}`);
console.log(`Timestamp: ${results.timestamp}`);
console.log(`Iterations: ${results.iterations}`);
console.log(`\nResults:`);
console.log(`  Passed: ${results.results.passed}`);
console.log(`  Failed: ${results.results.failed}`);
console.log(`  Accuracy: ${(results.results.accuracy * 100).toFixed(1)}%`);
console.log(`\nConstraints Tested:`);
results.constraints_tested.forEach((c: string) => console.log(`  - ${c}`));
console.log(`\nInsights:`);
results.insights.forEach((i: string) => console.log(`  • ${i}`));

console.log('\n✓ Analysis complete');
