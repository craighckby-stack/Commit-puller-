/**
 * Core domain types and statistical models for commit auditing and analysis.
 */

/**
 * Audit verdict indicating whether a commit adheres to expected standards.
 */
export type CommitVerdict = 'OK' | 'WRONG';

/**
 * Detailed representation of a parsed Git commit along with its evaluation metadata.
 */
export interface CommitRecord {
  /** Full SHA-1/SHA-256 commit hash */
  hash: string;
  /** Abbreviated commit hash (typically 7-8 characters) */
  shortHash: string;
  /** Name or identifier of the commit author */
  author: string;
  /** ISO-formatted or formatted commit timestamp */
  date: string;
  /** First line summary of the commit message */
  subject: string;
  /** Full descriptive body of the commit message */
  body: string;
  /** List of file paths modified, added, or deleted in this commit */
  files: string[];
  /** Raw unified diff patch content */
  diff: string;
  /** Evaluation status of the commit */
  verdict: CommitVerdict;
  /** Reference or hash of the commit that fixed issues introduced by this commit */
  fixedBy?: string;
  /** Explanatory note or diagnostic feedback regarding the verdict */
  reason?: string;
  /** Indicates whether this commit reverts a previous change */
  isRevert?: boolean;
}

/**
 * Aggregated statistics and metric distributions across evaluated commits.
 */
export interface CommitStats {
  /** Total count of processed commits */
  total: number;
  /** Total count of commits passing review */
  totalCorrect: number;
  /** Total count of commits flagged with defects or issues */
  totalWrong: number;
  /** Frequency distribution of modified file paths */
  fileCounts: Record<string, number>;
  /** Cycle frequency metrics tracking transitions between defective and corrected states */
  wrongCorrectCycles: Record<string, number>;
  /** Distribution of commit classifications by theme/topic */
  themeCounts: Record<string, number>;
  /** Temporal distribution mapping dates to commit volume */
  dateCounts: Record<string, number>;
}