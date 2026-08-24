import { runRateEngineTests } from './rateEngine.test';
import { runAssignmentEngineTests } from './assignmentEngine.test';

function main() {
  console.log('====================================================');
  console.log('🚀 LOGITRACK ENGINE - AUTOMATED TEST VERIFICATION');
  console.log('====================================================');

  const rateResults = runRateEngineTests();
  const assignResults = runAssignmentEngineTests();

  const totalPassed = rateResults.passed + assignResults.passed;
  const totalFailed = rateResults.failed + assignResults.failed;
  const totalTests = totalPassed + totalFailed;

  console.log('\n====================================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('====================================================');
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`✓ Passed:        ${totalPassed}`);
  console.log(`✗ Failed:        ${totalFailed}`);

  if (totalFailed > 0) {
    console.error('\n⚠️ Failures detected:');
    [...rateResults.errors, ...assignResults.errors].forEach((e) => console.error(e));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TESTS PASSED WITH 100% SUCCESS RATE!\n');
    process.exit(0);
  }
}

main();
