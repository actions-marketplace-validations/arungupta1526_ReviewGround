import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  extractFindingCounts,
  generateActionableHeader,
  generateAgentPromptBox,
  generateReviewScopeBox,
} from '../src/utils/actionableSummary.js';
import { InlineSuggestion } from '../src/github/index.js';

describe('Actionable Summary & AI Agent Prompt Box', () => {
  it('correctly extracts blocker and warning counts from markdown', () => {
    const reviewText = `
🚨 **[BLOCKER]**: SQL Injection vulnerability in user search query.
⚠️ **[WARNING]**: Missing index on foreign key column.
⚠️ **[WARNING]**: Potential memory leak in unclosed stream.
💡 **[SUGGESTION]**: Extract helper function.
`;
    const counts = extractFindingCounts(reviewText, 2);
    assert.strictEqual(counts.blockers, 1);
    assert.strictEqual(counts.warnings, 2);
    assert.strictEqual(counts.suggestions, 2);
  });

  it('generates all-clean header when 0 blockers or warnings are found', () => {
    const counts = { blockers: 0, warnings: 0, suggestions: 0 };
    const header = generateActionableHeader(counts);
    assert.ok(header.includes('All checks passed'));
    assert.ok(header.includes('No blocker or warning issues detected'));
  });

  it('generates multi-part actionable header badge with fix hint', () => {
    const counts = { blockers: 2, warnings: 1, suggestions: 3 };
    const header = generateActionableHeader(counts);
    assert.ok(header.includes('🚨 **2 Blockers**'));
    assert.ok(header.includes('⚠️ **1 Warning**'));
    assert.ok(header.includes('💡 **3 Committable Suggestions**'));
    assert.ok(header.includes('@reviewground fix'));
  });

  it('generates structured prompt for AI coding agents with file and line references', () => {
    const suggestions: InlineSuggestion[] = [
      {
        path: 'src/auth/jwt.ts',
        line: 42,
        suggestion: 'const token = verifyToken(req.headers.authorization);',
      },
      {
        path: 'src/db/client.ts',
        line: 105,
        suggestion: 'await client.end();',
      },
    ];
    const promptBox = generateAgentPromptBox(suggestions, { blockers: 1, warnings: 1, suggestions: 2 });
    assert.ok(promptBox.includes('🤖 Prompt for AI Coding Agents'));
    assert.ok(promptBox.includes('src/auth/jwt.ts'));
    assert.ok(promptBox.includes('line 42'));
    assert.ok(promptBox.includes('verifyToken'));
    assert.ok(promptBox.includes('src/db/client.ts'));
    assert.ok(promptBox.includes('line 105'));
    assert.ok(promptBox.includes('AGENTS.md'));
  });

  it('returns empty prompt box when there are no suggestions, blockers, or warnings', () => {
    const promptBox = generateAgentPromptBox([], { blockers: 0, warnings: 0, suggestions: 0 });
    assert.strictEqual(promptBox, '');
  });

  it('generates review scope dropdown with analyzed, skipped, and registry bullets', () => {
    const scopeBox = generateReviewScopeBox({
      filesAnalyzed: ['src/app.ts', 'src/auth.ts'],
      filesSkipped: ['pnpm-lock.yaml', 'assets/logo.svg'],
      registryGroundingUsed: true,
    });
    assert.ok(scopeBox.includes('ℹ️ Review Scope & File Distribution'));
    assert.ok(scopeBox.includes('Files Analyzed (P0/P1)'));
    assert.ok(scopeBox.includes('`src/app.ts`'));
    assert.ok(scopeBox.includes('Files Budget-Skipped (P2/Lockfiles)'));
    assert.ok(scopeBox.includes('`pnpm-lock.yaml`'));
    assert.ok(scopeBox.includes('Live npm / PyPI'));
  });

  it('sanitizes nested code fences and details tags inside agent prompt suggestions', () => {
    const suggestions: InlineSuggestion[] = [
      {
        path: 'src/app.ts',
        line: 12,
        suggestion: '</details>```injection```',
      },
    ];
    const promptBox = generateAgentPromptBox(suggestions, { blockers: 0, warnings: 0, suggestions: 1 });
    assert.ok(!promptBox.includes('</details>```'));
    assert.ok(promptBox.includes("'''injection'''"));
  });
});
