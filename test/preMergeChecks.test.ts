import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generatePreMergeChecksBox } from '../src/utils/preMergeChecks.js';

describe('Pre-Merge Invariant Checks Table', () => {
  it('generates all-clean pre-merge checklist when all checks pass', () => {
    const table = generatePreMergeChecksBox({
      coverageReport: {
        newSymbols: [],
        testFilesChanged: ['test/auth.test.ts'],
        hasTestCoverage: true,
        warnings: [],
        suggestedTests: '',
      },
      counts: { blockers: 0, warnings: 0, suggestions: 0 },
      hasRegistryGrounding: true,
    });

    assert.ok(table.includes('📋 Pre-Merge Checks: ✅'));
    assert.ok(table.includes('🧪 Unit Test Coverage'));
    assert.ok(table.includes('🔒 Secret Leak Sanitization'));
    assert.ok(table.includes('📦 Package Registry Grounding'));
    assert.ok(table.includes('🛡️ Code Review Quality & Security'));
    assert.ok(table.includes('✅ Passed'));
  });

  it('flags warning when test coverage is missing for new functions', () => {
    const table = generatePreMergeChecksBox({
      coverageReport: {
        newSymbols: [
          {
            filePath: 'src/app.ts',
            symbolName: 'calculateTotal',
            symbolType: 'function',
            language: 'typescript',
          },
        ],
        testFilesChanged: [],
        hasTestCoverage: false,
        warnings: ['Missing tests'],
        suggestedTests: '',
      },
      counts: { blockers: 0, warnings: 0, suggestions: 1 },
      hasRegistryGrounding: false,
    });

    assert.ok(table.includes('⚠️ 1 Warning'));
    assert.ok(table.includes('1 new exported function(s)/endpoint(s) without test files'));
    assert.ok(table.includes('Add corresponding unit test stubs'));
  });

  it('flags failed status when blockers are present', () => {
    const table = generatePreMergeChecksBox({
      coverageReport: null,
      counts: { blockers: 1, warnings: 2, suggestions: 0 },
      hasRegistryGrounding: true,
    });

    assert.ok(table.includes('❌ 1 Failed'));
    assert.ok(table.includes('1 blocker(s) detected'));
    assert.ok(table.includes('Resolve blocker finding(s) before merge'));
  });
});
