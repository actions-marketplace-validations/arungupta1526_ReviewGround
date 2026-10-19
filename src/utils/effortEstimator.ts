/**
 * ReviewGround - Code Review Effort & Complexity Estimator
 * Computes human review effort estimation and complexity tiers (1-5)
 * based on diff hunk analysis, additions/deletions, and file criticality.
 */

export interface EffortEstimate {
  score: 1 | 2 | 3 | 4 | 5;
  label: 'Trivial' | 'Simple' | 'Moderate' | 'Complex' | 'Substantial';
  estimatedMinutes: string;
  filesCount: number;
  linesAdded: number;
  linesDeleted: number;
  badge: string;
}

const CRITICAL_KEYWORDS = [
  'auth',
  'security',
  'payment',
  'crypto',
  'token',
  'secret',
  'webhook',
  'password',
  'credential',
];

/**
 * Parses a unified git diff and estimates review complexity and duration.
 */
export function estimateReviewEffort(diff: string): EffortEstimate {
  if (!diff || diff.trim().length === 0) {
    return {
      score: 1,
      label: 'Trivial',
      estimatedMinutes: '~1–3 mins',
      filesCount: 0,
      linesAdded: 0,
      linesDeleted: 0,
      badge: '⏱️ **Review Effort**: 1 (Trivial) · ~1–3 mins (0 lines)',
    };
  }

  const lines = diff.split('\n');
  let added = 0;
  let deleted = 0;
  const files = new Set<string>();

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
      if (match) files.add(match[1]);
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      added++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deleted++;
    }
  }

  const filesCount = files.size || 1;
  const totalChangedLines = added + deleted;

  // Check file criticality (security/auth/payments increase complexity)
  let hasCriticalFile = false;
  for (const file of files) {
    const lower = file.toLowerCase();
    if (CRITICAL_KEYWORDS.some((kw) => lower.includes(kw))) {
      hasCriticalFile = true;
      break;
    }
  }

  let score: 1 | 2 | 3 | 4 | 5 = 1;
  let label: EffortEstimate['label'] = 'Trivial';
  let estimatedMinutes = '~5 mins';

  if (totalChangedLines <= 30 && filesCount <= 2) {
    score = 1;
    label = 'Trivial';
    estimatedMinutes = '~5 mins';
  } else if (totalChangedLines <= 120 && filesCount <= 4) {
    score = 2;
    label = 'Simple';
    estimatedMinutes = '~10–15 mins';
  } else if (totalChangedLines <= 400 && filesCount <= 8) {
    score = 3;
    label = 'Moderate';
    estimatedMinutes = '~20–30 mins';
  } else if (totalChangedLines <= 1000 || filesCount <= 15) {
    score = 4;
    label = 'Complex';
    estimatedMinutes = '~45–60 mins';
  } else {
    score = 5;
    label = 'Substantial';
    estimatedMinutes = '~60+ mins';
  }

  // Elevate score by 1 tier if sensitive/security/payment files are touched
  if (hasCriticalFile && score < 5) {
    score = (score + 1) as 2 | 3 | 4 | 5;
    if (score === 2) {
      label = 'Simple';
      estimatedMinutes = '~10–15 mins';
    } else if (score === 3) {
      label = 'Moderate';
      estimatedMinutes = '~20–30 mins';
    } else if (score === 4) {
      label = 'Complex';
      estimatedMinutes = '~45–60 mins';
    } else if (score === 5) {
      label = 'Substantial';
      estimatedMinutes = '~60+ mins';
    }
  }

  const badge = `⏱️ **Review Effort**: ${score} (${label}) · ${estimatedMinutes} (${totalChangedLines} lines across ${filesCount} file${filesCount === 1 ? '' : 's'})`;

  return {
    score,
    label,
    estimatedMinutes,
    filesCount,
    linesAdded: added,
    linesDeleted: deleted,
    badge,
  };
}
