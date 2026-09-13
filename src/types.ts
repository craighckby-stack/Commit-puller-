/**
 * Core domain types and statistical models for commit auditing and analysis.
 *
 * @module types
 */

/**
 * Audit verdict indicating whether a commit adheres to expected quality and correctness standards.
 */
export type CommitVerdict = 'OK' | 'WRONG';

/**
 * Detailed representation of a parsed Git commit along with its evaluation metadata.
 */
export interface CommitRecord {
  /** Full cryptographic commit hash (SHA-1 / SHA-256). */
  hash: string;
  /** Abbreviated commit identifier (typically 7-8 hex characters). */
  shortHash: string;
  /** Name or identifier of the commit author. */
  author: string;
  /** Formatted or ISO-8601 timestamp representing commit creation time. */
  date: string;
  /** Primary summary line of the commit message. */
  subject: string;
  /** Full descriptive body of the commit message. */
  body: string;
  /** List of file paths modified, added, or deleted in this commit. */
  files: string[];
  /** Raw unified diff patch content. */
  diff: string;
  /** Quality and correctness evaluation verdict. */
  verdict: CommitVerdict;
  /** Hash or reference identifier of the commit that resolved defects introduced by this commit. */
  fixedBy?: string;
  /** Diagnostic reasoning or explanatory feedback regarding the verdict. */
  reason?: string;
  /** Indicates whether this commit represents a reversion of a prior changeset. */
  isRevert?: boolean;
}

/**
 * Mapping type for statistical frequency distributions across metadata properties.
 */
export type MetricFrequencyMap = Record<string, number>;

/**
 * Aggregated metrics and frequency distributions computed across a set of evaluated commits.
 */
export interface CommitStats {
  /** Total count of evaluated commits. */
  total: number;
  /** Total count of commits meeting acceptable quality standards. */
  totalCorrect: number;
  /** Total count of commits flagged with defects or regressions. */
  totalWrong: number;
  /** Frequency map tracking commit modifications per file path. */
  fileCounts: MetricFrequencyMap;
  /** Cycle metrics tracking transitions between defective states and remediation commits. */
  wrongCorrectCycles: MetricFrequencyMap;
  /** Categorical distribution of commits grouped by thematic classifications or tags. */
  themeCounts: MetricFrequencyMap;
  /** Temporal distribution mapping calendar dates (YYYY-MM-DD) to commit volumes. */
  dateCounts: MetricFrequencyMap;
}