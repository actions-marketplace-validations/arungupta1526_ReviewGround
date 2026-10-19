import { describe, it } from 'node:test';
import assert from 'node:assert';
import { estimateReviewEffort } from '../src/utils/effortEstimator.js';

describe('Code Review Effort & Complexity Estimator', () => {
  it('returns trivial score for empty diff', () => {
    const estimate = estimateReviewEffort('');
    assert.strictEqual(estimate.score, 1);
    assert.strictEqual(estimate.label, 'Trivial');
    assert.ok(estimate.badge.includes('1 (Trivial)'));
  });

  it('estimates simple diffs with few lines and files', () => {
    const diff = `
diff --git a/src/utils/math.ts b/src/utils/math.ts
--- a/src/utils/math.ts
+++ b/src/utils/math.ts
@@ -1,3 +1,5 @@
+export function add(a: number, b: number): number {
+  return a + b;
+}
`;
    const estimate = estimateReviewEffort(diff);
    assert.strictEqual(estimate.score, 1);
    assert.strictEqual(estimate.label, 'Trivial');
    assert.strictEqual(estimate.filesCount, 1);
    assert.strictEqual(estimate.linesAdded, 3);
  });

  it('elevates effort tier when security/auth/payment files are touched', () => {
    const diff = `
diff --git a/src/auth/tokenService.ts b/src/auth/tokenService.ts
--- a/src/auth/tokenService.ts
+++ b/src/auth/tokenService.ts
@@ -1,5 +1,10 @@
+export function verifyJwt(token: string) {
+  return jwt.verify(token, secret);
+}
`;
    const estimate = estimateReviewEffort(diff);
    // Even small diff gets elevated from tier 1 (Trivial) to tier 2 (Simple) because of auth
    assert.strictEqual(estimate.score, 2);
    assert.strictEqual(estimate.label, 'Simple');
    assert.ok(estimate.badge.includes('2 (Simple)'));
  });

  it('computes moderate and complex tiers for larger multi-file changes', () => {
    let diff = '';
    for (let i = 0; i < 6; i++) {
      diff += `\ndiff --git a/src/module${i}.ts b/src/module${i}.ts\n`;
      for (let j = 0; j < 30; j++) {
        diff += `+ const var_${i}_${j} = ${j};\n`;
      }
    }
    const estimate = estimateReviewEffort(diff);
    assert.strictEqual(estimate.score, 3);
    assert.strictEqual(estimate.label, 'Moderate');
    assert.strictEqual(estimate.filesCount, 6);
    assert.ok(estimate.badge.includes('3 (Moderate)'));
  });
});
