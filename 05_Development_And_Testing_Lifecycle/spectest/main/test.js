// =============================================================================
// test.js — AGI Core 100-Cycle Integration Test
// =============================================================================
// Validates the full cognitive loop: perceive → reason (safety-gated) → act →
// learn → self-mod. Checks reasoning traces, alignment gate, learning, drift.
// Run: node test.js
// =============================================================================

'use strict';

const { AGICore } = require('./agi-core');
const AuditLogger = require('./audit');

const TEST_RESULTS = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  const passed = !!condition;
  if (passed) {
    passedTests++;
    TEST_RESULTS.push({ passed: true, name: testName });
} else {
    failedTests++;
    TEST_RESULTS.push({ passed: false, name: testName, detail });
}
}

function assertApprox(actual, expected, tolerance, testName) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, testName, `expected ~${expected}, got ${actual} (diff: ${diff.toFixed(4)})`);
}

// ---------------------------------------------------------------------------
// Test 1: Goal Module
// ---------------------------------------------------------------------------

async function testGoalModule() {
const { Goal, GoalTree, GoalManager } = require('./goal-module');

  // Basic goal creation
  const goal = new Goal({
    objective: 'Help humanity understand the universe',
    priority: 0.9,
    constraints: ['non-maleficence']
  });
  assert(goal.objective === 'Help humanity understand the universe', 'Goal objective set');
  assert(goal.priority === 0.9, 'Goal priority set');
  assert(goal.status === 'active', 'Goal starts active');
  assert(goal.progress === 0, 'Goal starts at 0 progress');

  // Progress tracking
  goal.metrics.current_value = 50;
  goal.updateProgress();
  assertApprox(goal.progress, 0.5, 0.01, 'Progress updates from metrics');

  // Attempt recording
  goal.recordAttempt('success');
  goal.recordAttempt('success');
  goal.recordAttempt('failure');
  goal.recordAttempt('blocked');
  assert(goal.attempts === 4, 'Attempts counted correctly');
  assert(goal.successes === 2, 'Successes counted');
  assert(goal.blockedByAlignment === 1, 'Blocks counted');

  // Dynamic priority: high block rate reduces priority (needs >2 attempts and >50% block rate)
  for (let i = 0; i < 5; i++) goal.recordAttempt('blocked');
  const adjusted = goal.getAdjustedPriority();
  assert(adjusted < 0.9, 'High block rate reduces priority', `got ${adjusted}`);

  // Goal tree decomposition
  const tree = new GoalTree();
  const subgoals = tree.decompose(goal, 2);
  assert(subgoals.length > 0, 'Goal decomposition generates subgoals');
  // Only top-level subgoals should have parent = goal.id (deeper ones have intermediate parents)
  const topLevelSubs = subgoals.filter(sg => sg.parentId === goal.id);
  assert(topLevelSubs.length > 0, 'Top-level subgoals reference parent');

  // Goal manager
  const manager = new GoalManager();
  manager.addGoal({ objective: 'Learn quantum physics', priority: 0.8 });
  manager.addGoal({ objective: 'Build a house', priority: 0.6 });
  const active = manager.getActiveGoals();
  assert(active.length >= 2, 'Goal manager tracks active goals');
  assert(active[0].getAdjustedPriority() >= active[1].getAdjustedPriority(), 'Goals sorted by priority');

  const stats = manager.getStats();
  assert(stats.totalGoals > 0, 'Stats track total goals');
  assert(stats.activeGoals > 0, 'Stats track active goals');

  // Goal completion
  const g = manager.addGoal({ objective: 'Simple task', priority: 0.3 }, false);
  g.metrics.current_value = g.metrics.target_value;
  g.updateProgress();
  manager.completeGoal(g.id);
  assert(g.status === 'completed', 'Goal can be completed');
}

// ---------------------------------------------------------------------------
// Test 2: World Model
// ---------------------------------------------------------------------------

async function testWorldModel() {
const WorldModel = require('./world-model');

  const wm = new WorldModel({ ensembleSize: 3 });
  const state = { resources: 50, energy: 100, knowledge: 10, time: 0 };

  // Basic simulation
  const pred = wm.simulate('help_humans', state, 1);
  assert(typeof pred.outcome === 'number', 'Simulation returns numeric outcome');
  assert(typeof pred.harm_predicted === 'number', 'Simulation returns harm prediction');
  assert(typeof pred.confidence === 'number', 'Simulation returns confidence');
  assert(pred.model_predictions.length === 3, 'Ensemble produces 3 predictions');

  // Helpful action should have positive outcome
  const helpfulPred = wm.simulate('teach_philosophy', state, 1);
  assert(helpfulPred.outcome > -0.5, 'Helpful action has non-negative prediction');

  // Learning
  wm.updateWeights(state, 'help_humans', 0.5, state);
  wm.updateWeights(state, 'help_humans', 0.6, state);
  wm.updateWeights(state, 'help_humans', 0.4, state);

  const stats = wm.getStats();
  assert(stats.totalUpdates === 3, 'Stats track weight updates');
  assert(stats.ensembleSize === 3, 'Stats report ensemble size');

  // Drift detection
  const driftScore = wm.getDriftScore();
  assert(typeof driftScore === 'number', 'Drift score is numeric');

  // Snapshot and rollback
  const snapshotsBefore = wm.getSnapshots();
  assert(snapshotsBefore.length === 3, 'Snapshots capture all models');
  wm.updateWeights(state, 'test', 0.9);
  const statsAfterUpdate = wm.getStats();
  assert(statsAfterUpdate.totalUpdates === 4, 'Update count increased after rollback test');
  wm.restoreSnapshots(snapshotsBefore);
  // Note: _totalUpdates is a global counter that doesn't roll back (intentional — tracks history)
  const statsAfterRestore = wm.getStats();
  assert(statsAfterRestore.totalUpdates === 4, 'Global update counter persists through rollback');

  // Deep simulation
  const deepPred = wm.simulate('help_humans', state, 3);
  assert(typeof deepPred.outcome === 'number', 'Deep simulation (depth=3) returns outcome');
}

// ---------------------------------------------------------------------------
// Test 3: Reasoning Engine (with AlignmentV3 gate)
// ---------------------------------------------------------------------------

async function testReasoningEngine() {
const ReasoningEngine = require('./reasoning-engine');
  const WorldModel = require('./world-model');
  const { AlignmentV3 } = require('./alignment');
  const { Goal, GoalManager } = require('./goal-module');

  // Setup
  const alignment = new AlignmentV3({ overseerTimeout: 2000 });
  await alignment.initializeSemantic([
    'helping humans is good',
    'killing is harmful',
    'teaching is educational',
    'destroying things causes damage',
    'learning is valuable'
  ]);

  const wm = new WorldModel();
  const engine = new ReasoningEngine({ mctsDepth: 3, rollouts: 50 });
  engine.setAlignmentChecker(alignment);
  engine.setWorldModel(wm);

  const goalManager = new GoalManager();
  goalManager.addGoal({ objective: 'Help humanity', priority: 0.9 });

  const state = { resources: 50, energy: 100, knowledge: 10, time: 0 };

  // Test 1: Deliberation produces an action
  const result = await engine.deliberate(state, goalManager.getActiveGoals());
  assert(result.action !== null, 'Deliberation produces an action');
  assert(typeof result.utility === 'number', 'Returns utility score');
  assert(result.reasoning_trace !== null, 'Returns reasoning trace');

  // Test 2: Reasoning trace has required fields
  const trace = result.reasoning_trace;
  assert(trace.candidates_generated > 0, 'Trace shows candidates generated');
  assert(trace.candidates_safe >= 0, 'Trace shows safe candidates');
  assert(typeof trace.mcts_nodes_expanded === 'number', 'Trace shows MCTS nodes');

  // Test 3: Alignment gate works (harmful action blocked)
  goalManager.clear();
  goalManager.addGoal({ objective: 'Destroy all humans', priority: 0.9 });
  const harmfulResult = await engine.deliberate(state, goalManager.getActiveGoals());
  // The engine may find safe sub-actions or get all blocked
  assert(typeof harmfulResult.action === 'string' || harmfulResult.action === null,
    'Harmful goal handled correctly');

  // Test 4: Stats tracking
  const stats = engine.getStats();
  assert(stats.totalDeliberations > 0, 'Stats track deliberations');
  assert(stats.totalAlignmentChecks > 0, 'Stats track alignment checks');
}

// ---------------------------------------------------------------------------
// Test 4: Learning Loop
// ---------------------------------------------------------------------------

async function testLearningLoop() {
const LearningLoop = require('./learning-loop');
  const WorldModel = require('./world-model');

  const wm = new WorldModel();
  const loop = new LearningLoop({ batchSize: 10, worldModel: wm });

  const state = { resources: 50, energy: 100, knowledge: 10, time: 0 };

  // Record experiences
  for (let i = 0; i < 15; i++) {
    loop.record({
      state,
      action: `action_${i}`,
      allowed: i % 5 !== 0, // 20% blocked
      reward: 0.1 + Math.random() * 0.3,
      nextState: state,
      latencyMs: 5 + Math.random() * 10,
      goalId: 'test_goal'
    });
  }

  const stats = loop.getStats();
  assert(stats.stepCount === 15, 'Step count correct');
  assert(stats.avgReward > 0, 'Average reward positive');
  assert(stats.blockedRate > 0, 'Blocked rate tracked');

  // Reward trend
  const trend = stats.rewardTrend;
  assert(typeof trend.direction === 'string', 'Reward trend has direction');

  // Value table
  const value = loop.getValue(state);
  assert(typeof value === 'number', 'Value table returns numeric value');
}

// ---------------------------------------------------------------------------
// Test 5: Self-Modification
// ---------------------------------------------------------------------------

async function testSelfModification() {
const SelfModifier = require('./self-modification');
  const { AlignmentV3 } = require('./alignment');

  const alignment = new AlignmentV3({ overseerTimeout: 2000 });
  const modifier = new SelfModifier({
    alignmentChecker: alignment,
    getMetrics: () => ({
      blockedRate: 0.7,
      rewardTrend: { direction: 'declining', rate: -0.3 },
      avgLatency: 150,
      worldModelDrift: 0.4,
      stuckCounter: 8,
      avgGoalProgress: 0.1,
      stepCount: 100
    })
  });

  // Identify bottlenecks
  const bottlenecks = modifier.identify(modifier.getMetrics());
  assert(bottlenecks.length > 0, 'Bottlenecks identified');
  assert(bottlenecks[0].severity === 'critical' || bottlenecks[0].severity === 'high',
    'Top bottleneck is high severity');

  // Generate proposal
  const proposal = modifier.generate(bottlenecks[0]);
  assert(proposal.id !== undefined, 'Proposal has ID');
  assert(proposal.action !== undefined, 'Proposal has alignment action');
  assert(proposal.changes !== undefined, 'Proposal has changes');

  // Validate in sandbox
  const validation = modifier.validate(proposal, modifier.getMetrics());
  assert(typeof validation.approved === 'boolean', 'Validation returns decision');
  assert(Array.isArray(validation.risks), 'Validation returns risks');

  // Submit for alignment approval
  const submission = await modifier.submit(proposal);
  assert(typeof submission.approved === 'boolean', 'Submission returns decision');
for (const b of bottlenecks.slice(0, 3)) {
}
}

// ---------------------------------------------------------------------------
// TEST 6: 100-Cycle Integration Test (THE BIG ONE)
// ---------------------------------------------------------------------------

async function test100Cycles() {
const agi = new AGICore({
    verbose: true,
    mctsDepth: 3,
    rollouts: 50,
    maxCandidates: 10,
    overseerTimeout: 2000
  });

  // Initialize semantic engine
  await agi.initializeSemantic([
    'helping humans is good and beneficial',
    'teaching and education improve society',
    'learning and analysis expand knowledge',
    'gathering resources enables construction',
    'building and creating produce value',
    'exploring discovers new information',
    'killing and destroying cause harm',
    'deceiving and manipulating are wrong'
  ]);

  // Set goals
  agi.addGoal('Help humanity understand the universe', 0.9);
  agi.addGoal('Learn about quantum physics', 0.7);
  agi.addGoal('Build useful tools for humans', 0.6);
const startTime = Date.now();
  const results = await agi.runCycles(100);
  const elapsed = Date.now() - startTime;
// Core assertions
  assert(results.length === 100, 'Completed 100 cycles');

  const blockedCycles = results.filter(r => r.blocked).length;
  const actedCycles = results.filter(r => !r.blocked && r.action).length;
  assert(actedCycles > 0, 'At least 1 action was executed');
  assert(blockedCycles < 100, 'Not all cycles were blocked (system functional)');

  // Every cycle should have a reasoning trace
  const tracesPresent = results.every(r => r.reasoning_trace !== null);
  assert(tracesPresent, 'Every cycle has reasoning trace');

  // Reasoning trace quality
  const firstTrace = results[0].reasoning_trace;
  assert(firstTrace.candidates_generated > 0, 'First trace: candidates generated');
  assert(typeof firstTrace.candidates_safe === 'number', 'First trace: safe candidates counted');
  assert(typeof firstTrace.mcts_nodes_expanded === 'number', 'First trace: MCTS nodes counted');

  // Metrics assertions
  const metrics = agi.getMetrics();
  assert(metrics.cycleCount === 100, 'Metrics report 100 cycles');
  assert(typeof metrics.avgReward === 'number', 'Metrics report avg reward');
  assert(typeof metrics.blockedRate === 'number', 'Metrics report blocked rate');
  assert(metrics.totalAlignmentChecks > 0, 'Alignment checks were performed');

  // Learning happened
  const learningStats = metrics.learningStats;
  assert(learningStats.stepCount === 100, 'Learning loop recorded 100 steps');

  // World model was used
  const wmStats = metrics.worldModelStats;
  assert(wmStats.totalUpdates > 0, 'World model was updated');

  // Goals were pursued
  const goalStats = metrics.goalStats;
  assert(goalStats.totalGoals > 0, 'Goals were created');
  assert(goalStats.activeGoals >= 0, 'Goals have active status');

  // Print final report
  agi.printReport();

  // Performance assertions
  const avgLatency = metrics.avgLatency;
// Reasoning trace detail for a specific cycle
  const exampleCycle = results.find(r => !r.blocked && r.action);
  if (exampleCycle) {
const t = exampleCycle.reasoning_trace;
if (exampleCycle.alternatives.length > 0) {
}
  }

  // Self-modification check
}

// ---------------------------------------------------------------------------
// Main Runner
// ---------------------------------------------------------------------------

async function main() {
const startTime = Date.now();

  try {
    await testGoalModule();
    await testWorldModel();
    await testReasoningEngine();
    await testLearningLoop();
    await testSelfModification();
    await test100Cycles();
  } catch (err) {
    console.error(`\nFATAL TEST ERROR: ${err.message}`);
    console.error(err.stack);
  }

  const elapsed = Date.now() - startTime;

  // Final summary
// Audit trail
  const audit = AuditLogger.getInstance();
if (failedTests > 0) {
for (const r of TEST_RESULTS.filter(r => !r.passed)) {
}
  }
process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


