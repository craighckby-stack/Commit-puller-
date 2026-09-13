export interface CommitRecord {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  subject: string;
  body: string;
  files: string[];
  diff: string;
  verdict: 'OK' | 'WRONG';
  fixedBy?: string;
  reason?: string;
  isRevert?: boolean;
}

export interface CommitStats {
  total: number;
  totalCorrect: number;
  totalWrong: number;
  fileCounts: Record<string, number>;
  wrongCorrectCycles: Record<string, number>;
  themeCounts: Record<string, number>;
  dateCounts: Record<string, number>;
}
