/**
 * ReviewGround - Actionable Findings & AI Agent Prompt Generator
 * Formats top-level actionable badges, AI agent copy-paste prompt boxes,
 * and review scope distribution dropdowns inspired by modern PR review standards.
 */

import { InlineSuggestion } from '../github/index.js';

export interface ActionableCounts {
  blockers: number;
  warnings: number;
  suggestions: number;
}

/**
 * Extracts blocker and warning counts from review markdown.
 */
export function extractFindingCounts(
  reviewText: string,
  inlineCount = 0
): ActionableCounts {
  const blockers = (reviewText.match(/🚨\s*\*\*\[BLOCKER\]\*\*/gi) || []).length;
  const warnings = (reviewText.match(/⚠️\s*\*\*\[WARNING\]\*\*/gi) || []).length;
  return {
    blockers,
    warnings,
    suggestions: inlineCount,
  };
}

/**
 * Generates an actionable summary badge displayed at the top of the PR review.
 */
export function generateActionableHeader(counts: ActionableCounts): string {
  const parts: string[] = [];
  if (counts.blockers > 0) {
    parts.push(`🚨 **${counts.blockers} Blocker${counts.blockers > 1 ? 's' : ''}**`);
  }
  if (counts.warnings > 0) {
    parts.push(`⚠️ **${counts.warnings} Warning${counts.warnings > 1 ? 's' : ''}**`);
  }
  if (counts.suggestions > 0) {
    parts.push(`💡 **${counts.suggestions} Committable Suggestion${counts.suggestions > 1 ? 's' : ''}**`);
  }

  if (parts.length === 0) {
    return `> ✅ **All checks passed** · No blocker or warning issues detected · Changes look clean!`;
  }

  return `> ${parts.join(' · ')} · 💬 Reply \`@reviewground fix\` to auto-patch`;
}

/**
 * Builds a structured, copy-pasteable prompt for AI coding agents
 * (Antigravity, Cursor, Claude Code, GitHub Copilot) to automatically resolve findings.
 */
export function generateAgentPromptBox(
  inlineSuggestions: InlineSuggestion[],
  counts: ActionableCounts
): string {
  if (inlineSuggestions.length === 0 && counts.blockers === 0 && counts.warnings === 0) {
    return '';
  }

  const items = inlineSuggestions
    .map(
      (s, idx) =>
        `${idx + 1}. In \`${s.path}\` line ${s.line}:\nApply fix:\n\`\`\`\n${s.suggestion.trim()}\n\`\`\``
    )
    .join('\n\n');

  const content = items
    ? `ReviewGround detected actionable issues on this PR. Please apply the following code fixes:\n\n${items}\n\nKeep modifications minimal, adhere to AGENTS.md conventions, and run tests.`
    : `ReviewGround flagged ${counts.blockers} blocker(s) and ${counts.warnings} warning(s) on this PR. Please review the findings above, resolve the root cause, and verify with tests.`;

  return `\n\n<details>
<summary>🤖 Prompt for AI Coding Agents (Antigravity / Cursor / Claude)</summary>

\`\`\`
${content}
\`\`\`

</details>`;
}

export interface ReviewScopeOptions {
  filesAnalyzed?: string[];
  filesSkipped?: string[];
  registryGroundingUsed?: boolean;
}

/**
 * Generates an expandable summary showing the scope of files analyzed and skipped.
 */
export function generateReviewScopeBox(options: ReviewScopeOptions): string {
  const bullets: string[] = [];

  if (options.filesAnalyzed && options.filesAnalyzed.length > 0) {
    const list = options.filesAnalyzed.slice(0, 8).map((f) => `\`${f}\``).join(', ');
    const more = options.filesAnalyzed.length > 8 ? ` *(+${options.filesAnalyzed.length - 8} more)*` : '';
    bullets.push(`* **Files Analyzed (P0/P1):** ${list}${more}`);
  }

  if (options.filesSkipped && options.filesSkipped.length > 0) {
    const list = options.filesSkipped.slice(0, 8).map((f) => `\`${f}\``).join(', ');
    const more = options.filesSkipped.length > 8 ? ` *(+${options.filesSkipped.length - 8} more)*` : '';
    bullets.push(`* **Files Budget-Skipped (P2/Lockfiles):** ${list}${more}`);
  }

  if (options.registryGroundingUsed) {
    bullets.push(`* **Registry Verification:** Live npm / PyPI registry grounding verified`);
  }

  if (bullets.length === 0) return '';

  return `\n\n<details>
<summary>ℹ️ Review Scope & File Distribution</summary>

${bullets.join('\n')}

</details>`;
}
