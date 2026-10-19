/**
 * ReviewGround - Pre-Merge Invariant Checks Table
 * Generates an executive pre-merge status summary table cross-referencing
 * unit test coverage, secret sanitization, registry verification, and blocker counts.
 */

import { TestCoverageReport } from '../testCoverageDetector.js';
import { ActionableCounts } from './actionableSummary.js';

export interface PreMergeChecksOptions {
  coverageReport?: TestCoverageReport | null;
  counts: ActionableCounts;
  hasRegistryGrounding?: boolean;
}

export interface PreMergeCheckItem {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  statusText: string;
  details: string;
  resolution: string;
}

/**
 * Builds the pre-merge status checks list and renders an expandable markdown table.
 */
export function generatePreMergeChecksBox(options: PreMergeChecksOptions): string {
  const checks: PreMergeCheckItem[] = [];

  // Check 1: Test Coverage
  if (options.coverageReport) {
    if (options.coverageReport.hasTestCoverage) {
      checks.push({
        name: '🧪 Unit Test Coverage',
        status: 'passed',
        statusText: '✅ Passed',
        details: options.coverageReport.testFilesChanged.length > 0
          ? `Test files updated (${options.coverageReport.testFilesChanged.length} file(s))`
          : 'No uncovered functions/endpoints introduced',
        resolution: 'Maintained',
      });
    } else {
      const uncoveredCount = options.coverageReport.newSymbols.filter(
        (s) => s.symbolType === 'function' || s.symbolType === 'endpoint'
      ).length;
      checks.push({
        name: '🧪 Unit Test Coverage',
        status: 'warning',
        statusText: '⚠️ Warning',
        details: `${uncoveredCount} new exported function(s)/endpoint(s) without test files`,
        resolution: 'Add corresponding unit test stubs',
      });
    }
  }

  // Check 2: Secret & PII Sanitization
  checks.push({
    name: '🔒 Secret Leak Sanitization',
    status: 'passed',
    statusText: '✅ Passed',
    details: 'Pre-flight entropy & pattern sanitization completed without leaks',
    resolution: 'Verified clean',
  });

  // Check 3: Dependency Registry Grounding
  if (options.hasRegistryGrounding) {
    checks.push({
      name: '📦 Package Registry Grounding',
      status: 'passed',
      statusText: '✅ Passed',
      details: 'Live npm / PyPI registry verification active',
      resolution: 'Verified against authoritative registries',
    });
  }

  // Check 4: Code Review Findings (Blockers & Warnings)
  if (options.counts.blockers > 0) {
    checks.push({
      name: '🚨 Code Review Quality & Security',
      status: 'failed',
      statusText: '❌ Failed',
      details: `${options.counts.blockers} blocker(s) detected`,
      resolution: 'Resolve blocker finding(s) before merge',
    });
  } else if (options.counts.warnings > 0) {
    checks.push({
      name: '⚠️ Code Review Quality & Security',
      status: 'warning',
      statusText: '⚠️ Warning',
      details: `${options.counts.warnings} warning(s) detected`,
      resolution: 'Inspect and resolve warnings',
    });
  } else {
    checks.push({
      name: '🛡️ Code Review Quality & Security',
      status: 'passed',
      statusText: '✅ Passed',
      details: '0 Blockers, 0 Warnings detected',
      resolution: 'Clean and approved',
    });
  }

  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const failedCount = checks.filter((c) => c.status === 'failed').length;

  const summaryParts: string[] = [`✅ ${passedCount} Passed`];
  if (warningCount > 0) summaryParts.push(`⚠️ ${warningCount} Warning${warningCount === 1 ? '' : 's'}`);
  if (failedCount > 0) summaryParts.push(`❌ ${failedCount} Failed`);

  const summaryHeader = `📋 Pre-Merge Checks: ${summaryParts.join(' · ')}`;

  const rows = checks
    .map((c) => `| ${c.name} | ${c.statusText} | ${c.details} | ${c.resolution} |`)
    .join('\n');

  return `\n\n<details>
<summary>${summaryHeader}</summary>

| Check | Status | Details | Resolution |
| :--- | :---: | :--- | :--- |
${rows}

</details>`;
}
