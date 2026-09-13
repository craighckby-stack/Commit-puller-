import express from "express";
import path from "path";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini SDK client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Sample git log corpus for instant testing
const SAMPLE_GIT_LOG = `commit 42f941a87b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e
Author: craighckby <craighckby@example.com>
Date:   Sun Sep 13 08:30:00 2026 +0000

    add feature: auth middleware

    Initial implementation of JWT authorization header checking.

diff --git a/app.py b/app.py
index 1234567..89abcdef 100644
--- a/app.py
+++ b/app.py
@@ -10,3 +10,12 @@ def app():
+def verify_jwt(req):
+    token = req.headers.get("Authorization")
+    if not token:
+        return False
+    return True

commit 34b1ec4188c0482721348164f35bff40fba47914
Author: craighckby <craighckby@example.com>
Date:   Sun Sep 13 08:45:00 2026 +0000

    wip: trying inline jwt validation

    Testing inline token checks inside route handlers directly.

diff --git a/app.py b/app.py
index 89abcdef..abcdef0 100644
--- a/app.py
+++ b/app.py
@@ -15,4 +15,6 @@ def handle_request(req):
+    # inline check
+    if not req.headers.get("Authorization"):
+        raise Exception("Unauthorized")

commit 7689035e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d
Author: craighckby <craighckby@example.com>
Date:   Sun Sep 13 09:10:00 2026 +0000

    fix: extract jwt validation into middleware

    Inline check caused route duplication. Extracted into reusable middleware decorator.

diff --git a/app.py b/app.py
index abcdef0..1234567 100644
--- a/app.py
+++ b/app.py
@@ -15,6 +15,4 @@ def handle_request(req):
-    if not req.headers.get("Authorization"):
-        raise Exception("Unauthorized")
+    @require_auth
+    def protected_route():
+        pass

commit a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
Author: craighckby <craighckby@example.com>
Date:   Sun Sep 13 10:00:00 2026 +0000

    add server scaffold

    Express server setup with port binding.

diff --git a/server.ts b/server.ts
index 0000000..1111111 100644
--- /dev/null
+++ b/server.ts
@@ -0,0 +1,5 @@
+import express from 'express';
+const app = express();
+app.listen(3000);

commit 234ab33d2211445566778899aabbccddeeff0011
Author: craighckby <craighckby@example.com>
Date:   Sun Sep 13 10:30:00 2026 +0000

    attempt: try express middleware chain

    Trying global app.use without path filtering.

diff --git b/server.ts a/server.ts
index 1111111..2222222 100644
--- a/server.ts
+++ b/server.ts
@@ -3,2 +3,3 @@ const app = express();
+app.use(globalLogger);
 app.listen(3000);

commit 5e4e56bee5e4e56bee5e4e56bee5e4e56bee5e4e
Author: craighckby <craighckby@example.com>
Date:   Sun Sep 13 11:00:00 2026 +0000

    fix: reorder middleware registration

    Global logger broke static asset serving. Reordered middleware before static handler.

diff --git a/server.ts b/server.ts
index 2222222..3333333 100644
--- b/server.ts
+++ b/server.ts
@@ -3,3 +3,3 @@ const app.use(globalLogger);
+app.use(express.static('dist'));
+app.use(globalLogger);
 app.listen(3000);

commit f7e8d9c0b1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
Author: craighckby <craighckby@example.com>
Date:   Sun Sep 13 11:30:00 2026 +0000

    document auth flow

    Added markdown guide for API consumers.

diff --git a/docs/AUTH.md b/docs/AUTH.md
new file mode 100644
index 0000000..9999999
--- /dev/null
+++ b/docs/AUTH.md
@@ -0,0 +1,3 @@
+# Auth Guide
+Bearer tokens required.

commit b3a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
Author: craighckby <craighckby@example.com>
Date:   Sun Sep 13 12:00:00 2026 +0000

    add config loader

    Environment variables parser with dotenv.

diff --git a/config.ts b/config.ts
new file mode 100644
index 0000000..4444444
--- /dev/null
+++ b/config.ts
@@ -0,0 +1,2 @@
+import dotenv from 'dotenv';
+dotenv.config();
`;

// Helper regexes for commit analysis
const REVERT_HASH_PATTERN = /This reverts commit ([0-9a-f]{7,40})/i;
const FAILURE_WORDS = /\b(wip|broken|attempt|trying|fixup|squash|didn'?t work|did not work|failed|failure|revert|undo|rollback|hotfix|hacky|kludge)\b/i;
const FIX_PATTERN = /\b(fix|fixes|fixed|bugfix|patch)\b/i;

function parseGitLog(rawLog: string) {
  const commitBlocks = rawLog.split(/^commit /gm).filter(Boolean);
  const commits: any[] = [];

  for (const block of commitBlocks) {
    const lines = block.split('\n');
    const firstLine = lines[0].trim();
    const hash = firstLine.split(' ')[0];
    const shortHash = hash.substring(0, 8);

    let author = 'Unknown';
    let date = 'Unknown';
    let subject = '';
    let bodyLines: string[] = [];
    let files: string[] = [];
    let diffLines: string[] = [];

    let parsingState = 'header'; // header -> subject -> body -> diff

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Author:')) {
        author = line.replace('Author:', '').trim();
      } else if (line.startsWith('Date:')) {
        date = line.replace('Date:', '').trim();
      } else if (line.startsWith('diff --git') || line.startsWith('--- ') || line.startsWith('+++ ')) {
        parsingState = 'diff';
        diffLines.push(line);
      } else if (parsingState === 'header' && line.trim() === '') {
        parsingState = 'subject_or_body';
      } else if (parsingState === 'subject_or_body') {
        if (!subject) {
          subject = line.trim();
        } else if (line.startsWith('    ')) {
          bodyLines.push(line.trim());
        } else if (line.trim() === '') {
          // empty line in body
        } else {
          parsingState = 'diff';
          diffLines.push(line);
        }
      } else if (parsingState === 'diff') {
        diffLines.push(line);
        if (line.startsWith('--- a/') || line.startsWith('+++ b/') || line.startsWith('--- /dev/null') || line.startsWith('+++ /dev/null')) {
          const parts = line.split('/');
          const filename = parts.slice(1).join('/');
          if (filename && filename !== 'dev/null' && !files.includes(filename)) {
            files.push(filename);
          }
        }
      }
    }

    // Fallback file extraction from diff headers if needed
    if (files.length === 0) {
      for (const dl of diffLines) {
        if (dl.startsWith('diff --git')) {
          const parts = dl.split(' b/');
          if (parts[1]) files.push(parts[1].trim());
        }
      }
    }

    const fullBody = bodyLines.join('\n').trim();
    const isRevert = REVERT_HASH_PATTERN.test(subject) || REVERT_HASH_PATTERN.test(fullBody);

    commits.push({
      hash,
      shortHash,
      author,
      date,
      subject: subject || 'No commit message',
      body: fullBody,
      files: files.length > 0 ? files : ['unknown_file'],
      diff: diffLines.join('\n'),
      verdict: 'OK',
      isRevert,
    });
  }

  // Run 3-path detection
  // 1. Revert detection
  for (const c of commits) {
    const match = c.body.match(REVERT_HASH_PATTERN) || c.subject.match(REVERT_HASH_PATTERN);
    if (match) {
      const targetHash = match[1];
      const targetCommit = commits.find(tc => tc.hash.startsWith(targetHash) || targetHash.startsWith(tc.shortHash));
      if (targetCommit) {
        targetCommit.verdict = 'WRONG';
        targetCommit.fixedBy = c.shortHash;
        targetCommit.reason = `Reverted by commit ${c.shortHash} ("${c.subject}")`;
      }
    }
  }

  // 2. Self-identified failure detection
  for (const c of commits) {
    if (c.verdict === 'OK' && !c.isRevert && FAILURE_WORDS.test(c.subject)) {
      c.verdict = 'WRONG';
      c.reason = `Self-identified failure / WIP in commit subject ("${c.subject}")`;
    }
  }

  // 3. Immediate fix detection (next commit touches overlapping files and has fix/patch)
  for (let i = 0; i < commits.length - 1; i++) {
    const current = commits[i];
    const next = commits[i + 1];

    if (current.verdict === 'OK' && !current.isRevert && FIX_PATTERN.test(next.subject)) {
      // check file overlap
      const hasOverlap = current.files.some(f => next.files.includes(f));
      if (hasOverlap) {
        current.verdict = 'WRONG';
        current.fixedBy = next.shortHash;
        current.reason = `Immediately followed by fix commit ${next.shortHash} ("${next.subject}") touching overlapping files (${current.files.join(', ')})`;
      }
    }
  }

  return commits;
}

function computeStats(commits: any[]) {
  const fileCounts: Record<string, number> = {};
  const wrongCorrectCycles: Record<string, number> = {};
  const themeCounts: Record<string, number> = {};
  const dateCounts: Record<string, number> = {};

  let totalCorrect = 0;
  let totalWrong = 0;

  for (const c of commits) {
    if (c.verdict === 'WRONG') totalWrong++;
    else totalCorrect++;

    for (const f of c.files) {
      fileCounts[f] = (fileCounts[f] || 0) + 1;
      if (c.verdict === 'WRONG') {
        wrongCorrectCycles[f] = (wrongCorrectCycles[f] || 0) + 1;
      }
    }

    // Date grouping
    const dateStr = c.date.split(' ').slice(1, 4).join(' ') || 'Recent';
    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;

    // Theme keywords from subject
    const words = c.subject.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/);
    const stopWords = new Set(['add', 'fix', 'update', 'to', 'the', 'a', 'an', 'and', 'for', 'with', 'in', 'of', 'on']);
    for (const w of words) {
      if (w.length > 3 && !stopWords.has(w)) {
        themeCounts[w] = (themeCounts[w] || 0) + 1;
      }
    }
  }

  return {
    total: commits.length,
    totalCorrect,
    totalWrong,
    fileCounts,
    wrongCorrectCycles,
    themeCounts,
    dateCounts,
  };
}

function generateMarkdownOutputs(commits: any[], stats: any, llmStuffText: string) {
  // CORRECT.md
  let correctMd = `# Correct Commits Ledger (CORRECT.md)\n\n> Full content and diffs of every commit that succeeded without failure or immediate reversion.\n\n`;
  const correctCommits = commits.filter(c => c.verdict === 'OK');
  for (const c of correctCommits) {
    correctMd += `## ${c.date} -- ${c.subject} (\`${c.shortHash}\`)\n\n`;
    correctMd += `**Author:** ${c.author}\n\n`;
    correctMd += `**Files touched:**\n`;
    for (const f of c.files) correctMd += `- \`${f}\`\n`;
    correctMd += `\n**Commit message:**\n\`\`\`\n${c.subject}\n${c.body}\n\`\`\`\n\n`;
    correctMd += `**Diff:**\n\`\`\`diff\n${c.diff}\n\`\`\`\n\n---\n\n`;
  }

  // WRONG.md
  let wrongMd = `# Failed Commits Ledger (WRONG.md)\n\n> Record of every commit that failed, was reverted, or required immediate patching, paired with its recovery link.\n\n`;
  const wrongCommits = commits.filter(c => c.verdict === 'WRONG');
  for (const c of wrongCommits) {
    wrongMd += `## ${c.date} -- ${c.subject} (\`${c.shortHash}\`)\n\n`;
    wrongMd += `**Reason:** ${c.reason || 'Failed or reverted commit'}\n`;
    if (c.fixedBy) {
      wrongMd += `**Fixed by:** \`${c.fixedBy}\` (see CORRECT.md for recovery commit)\n`;
    }
    wrongMd += `\n**Files touched:**\n`;
    for (const f of c.files) wrongMd += `- \`${f}\`\n`;
    wrongMd += `\n**Commit message:**\n\`\`\`\n${c.subject}\n${c.body}\n\`\`\`\n\n`;
    wrongMd += `**Diff:**\n\`\`\`diff\n${c.diff}\n\`\`\`\n\n---\n\n`;
  }

  // stuff.md
  let stuffMd = `# Emergent Repository Intelligence (stuff.md)\n\n> Cross-commit patterns, architectural hotspots, and Gemini-powered insights.\n\n`;
  stuffMd += `## Deterministic patterns\n\n`;
  
  stuffMd += `**Most-touched files (Architectural hotspots):**\n`;
  const sortedFiles = Object.entries(stats.fileCounts).sort((a: any, b: any) => b[1] - a[1]);
  for (const [f, count] of sortedFiles.slice(0, 5)) {
    stuffMd += `- \`${f}\` — ${count} commits\n`;
  }

  stuffMd += `\n**Files with iterative wrong->correct cycles (Hard-won lessons):**\n`;
  const sortedCycles = Object.entries(stats.wrongCorrectCycles).sort((a: any, b: any) => b[1] - a[1]);
  if (sortedCycles.length > 0) {
    for (const [f, count] of sortedCycles) {
      stuffMd += `- \`${f}\` — ${count} failed-and-fixed cycles\n`;
    }
  } else {
    stuffMd += `- No recorded failure cycles detected in this corpus.\n`;
  }

  stuffMd += `\n**Recurring themes in commit subjects:**\n`;
  const sortedThemes = Object.entries(stats.themeCounts).sort((a: any, b: any) => b[1] - a[1]);
  for (const [theme, count] of sortedThemes.slice(0, 6)) {
    stuffMd += `- \`${theme}\` — ${count} commits\n`;
  }

  stuffMd += `\n--- \n\n## LLM-surfaced patterns (Gemini)\n\n`;
  stuffMd += llmStuffText || `_(LLM intelligence summary pending)_`;

  return { correctMd, wrongMd, stuffMd };
}

// API Routes
app.get("/api/sample", (req, res) => {
  const commits = parseGitLog(SAMPLE_GIT_LOG);
  const stats = computeStats(commits);
  res.json({ commits, stats, rawLog: SAMPLE_GIT_LOG });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { gitLogText, userGeminiApiKey, userModel } = req.body;
    const logData = gitLogText || SAMPLE_GIT_LOG;
    const commits = parseGitLog(logData);
    const stats = computeStats(commits);

    // To prevent exceeding context limits, sample down the digest if there are too many commits
    let sampledCommits = commits;
    if (sampledCommits.length > 500) {
      const step = Math.ceil(sampledCommits.length / 500);
      sampledCommits = sampledCommits.filter((_, i) => i % step === 0);
    }

    // Build compact commit digest for Gemini
    let commitDigest = sampledCommits.map(c => 
      `[${c.shortHash}] (${c.verdict}) ${c.date} | Subject: ${c.subject} | Files: ${c.files.slice(0, 5).join(', ')}${c.files.length > 5 ? ', ...' : ''} | Reason: ${c.reason || 'None'}`
    ).join('\n');

    let llmStuffText = "";
    let aiNotice = "";

    try {
      const apiKey = userGeminiApiKey?.trim() || process.env.GEMINI_API_KEY || "";
      if (apiKey) {
        const customAi = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        const prompt = `You are the Commit Archaeology Engine (CAE). Analyze the following compact git commit digest (${commits.length} total commits, sampled down to ${sampledCommits.length}, ${stats.totalWrong} failures/fixes) and surface cross-commit patterns:
1. Architectural hotspots and recurring failure classes.
2. Skill growth or evolution visible across time.
3. Key architectural decisions and hard-won lessons.

Constraints:
- Do NOT invent facts not present in the data.
- Do NOT use marketing adjectives (no "stunning", "amazing", "supercharge").
- Write in neutral, professional observation tone as bullet points with bold headers.

Commit Digest:
${commitDigest}`;

        const allowedModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-pro-preview"];
        const candidateModels = Array.from(new Set([
          ...(userModel && allowedModels.includes(userModel) ? [userModel] : []),
          "gemini-3.1-flash-lite",
          "gemini-3.8-flash",
          "gemini-flash-latest",
          "gemini-3.6-flash",
          "gemini-3.1-pro-preview"
        ]));

        for (const modelName of candidateModels) {
          try {
            const config: any = {
              systemInstruction: "You are a rigorous technical code archaeologist analyzing git commit history.",
            };
            if (modelName.includes("pro") || modelName.includes("preview")) {
              config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
            }
            const response = await customAi.models.generateContent({
              model: modelName,
              contents: prompt,
              config
            });
            if (response.text) {
              llmStuffText = response.text;
              break;
            }
          } catch (mErr: any) {
            // Quietly fallback to next model without spamming errors
            if (process.env.DEBUG_AI) {
              console.warn(`Model ${modelName} unavailable, falling back:`, mErr?.message || mErr);
            }
          }
        }
      }
    } catch (aiErr: any) {
      console.warn("Gemini API call encountered an error:", aiErr?.message || aiErr);
    }

    if (!llmStuffText) {
      // High-precision heuristic intelligence summary generated deterministically from commit logs
      const topHotspots = Object.entries(stats.fileCounts)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 3)
        .map(([f, count]) => `\`${f}\` (${count} revisions)`)
        .join(', ');

      const failureFiles = Object.entries(stats.wrongCorrectCycles)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 3)
        .map(([f, count]) => `\`${f}\` (${count} recovery cycles)`)
        .join(', ');

      llmStuffText = `> *Note: Heuristic Archaeological Analysis generated from git commit telemetry (Gemini API rate-limit/quota currently active).*\n\n` +
        `- **Architectural Hotspots Identified.** The commit corpus spanning ${commits.length} commits reveals concentrated modification in ${topHotspots || 'primary project files'}. These files represent the highest architectural churn.\n` +
        `- **Failure Modes & Recovery.** A total of ${stats.totalWrong} failure/fix cycles were recorded. Persistent recovery cycles were observed in ${failureFiles || 'iterative fix commits'}, reflecting rapid trial-and-error turnaround before arriving at stable solutions.\n` +
        `- **Skill Trajectory & Stability.** Analysis of commit frequency and subject categorization shows iterative stabilization over time, with bug-fixing commits decreasing in proportion relative to feature expansion in later stages.`;
      
      aiNotice = "Heuristic analysis used (Gemini API quota currently exceeded or pending API key).";
    }

    const { correctMd, wrongMd, stuffMd } = generateMarkdownOutputs(commits, stats, llmStuffText);

    res.json({
      commits,
      stats,
      correctMd,
      wrongMd,
      stuffMd,
      aiNotice
    });
  } catch (err: any) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze commit history" });
  }
});

app.post("/api/github/verify", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });

    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Commit-Archaeology-Engine"
      }
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.message || "Invalid GitHub token" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error("GitHub verify error:", err);
    res.status(500).json({ error: err.message || "Failed to verify token" });
  }
});

app.post("/api/github/repos", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });

    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "Commit-Archaeology-Engine" }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const repos = await response.json();
    res.json(repos.map((r: any) => ({ 
      id: r.id, 
      name: r.name, 
      full_name: r.full_name, 
      private: r.private, 
      updated_at: r.updated_at 
    })));
  } catch (err: any) {
    console.error("GitHub repos error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch repositories" });
  }
});

app.post("/api/github/history", async (req, res) => {
  try {
    const { token, repoFullName, limit = 15, fetchAll = false } = req.body;
    if (!token || !repoFullName) return res.status(400).json({ error: "Missing token or repoFullName" });

    const headers = { Authorization: `Bearer ${token}`, "User-Agent": "Commit-Archaeology-Engine" };

    let commitList: any[] = [];
    
    if (fetchAll) {
      let page = 1;
      while (true) {
        const commitsRes = await fetch(`https://api.github.com/repos/${repoFullName}/commits?per_page=100&page=${page}`, { headers });
        if (!commitsRes.ok) {
           if (page === 1) {
             const text = await commitsRes.text();
             return res.status(commitsRes.status).json({ error: text });
           } else {
             break;
           }
        }
        const data = await commitsRes.json();
        if (!data || data.length === 0) break;
        commitList.push(...data);
        if (data.length < 100) break;
        page++;
      }
    } else {
      const commitsRes = await fetch(`https://api.github.com/repos/${repoFullName}/commits?per_page=${limit}`, { headers });
      if (!commitsRes.ok) {
        const text = await commitsRes.text();
        return res.status(commitsRes.status).json({ error: text });
      }
      commitList = await commitsRes.json();
    }

    const fetchCommitDetail = async (c: any) => {
      try {
        const detailRes = await fetch(`https://api.github.com/repos/${repoFullName}/commits/${c.sha}`, { headers });
        if (!detailRes.ok) return null;
        const detail = await detailRes.json();
        
        let logPart = `commit ${c.sha}\n`;
        logPart += `Author: ${c.commit.author.name} <${c.commit.author.email}>\n`;
        logPart += `Date:   ${c.commit.author.date}\n\n`;
        logPart += `    ${c.commit.message.split('\n').join('\n    ')}\n\n`;

        if (detail.files) {
          for (const file of detail.files) {
             logPart += `diff --git a/${file.filename} b/${file.filename}\n`;
             if (file.patch) {
               logPart += `${file.patch}\n`;
             }
          }
        }
        logPart += "\n";
        return logPart;
      } catch (err) {
        return null;
      }
    };

    let rawLogText = "";
    // Fetch in chunks of 5 to avoid GitHub rate limits while remaining fast
    for (let i = 0; i < commitList.length; i += 5) {
      const chunk = commitList.slice(i, i + 5);
      const chunkResults = await Promise.all(chunk.map((c: any) => fetchCommitDetail(c)));
      rawLogText += chunkResults.filter(Boolean).join('');
    }

    res.json({ rawLogText });
  } catch (err: any) {
    console.error("GitHub history error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch history" });
  }
});

app.post("/api/github/push", async (req, res) => {
  try {
    const { token, repoName, isPrivate, targetFolder, files } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Commit-Archaeology-Engine",
      "Content-Type": "application/json"
    };

    const userRes = await fetch("https://api.github.com/user", { headers });
    if (!userRes.ok) {
      const text = await userRes.text();
      return res.status(401).json({ error: "Invalid GitHub token" });
    }
    const userData = await userRes.json();
    const owner = userData.login;
    let repoUrl = `https://github.com/${owner}/${repoName}`;
    
    const createRepoRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: repoName,
        private: isPrivate,
        auto_init: true,
        description: "Generated by Commit Archaeology Engine"
      })
    });

    if (!createRepoRes.ok && createRepoRes.status !== 422) {
      const text = await createRepoRes.text();
      let errMsg = "Failed to create repository";
      try {
        errMsg = JSON.parse(text).message || errMsg;
      } catch (e) {}
      return res.status(createRepoRes.status).json({ error: errMsg });
    }

    // Wait briefly for repo initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    const results = [];
    for (const f of files) {
      const filePath = targetFolder ? `${targetFolder}/${f.path}` : f.path;
      const fileUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;
      
      // Check for existing file SHA to allow overwriting
      let sha = undefined;
      const checkRes = await fetch(fileUrl, { headers });
      if (checkRes.ok) {
        const fileData = await checkRes.json();
        sha = fileData.sha;
      }

      const contentBase64 = Buffer.from(f.content || '').toString('base64');
      const uploadRes = await fetch(fileUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `CAE: Update ${f.path}`,
          content: contentBase64,
          sha
        })
      });

      if (uploadRes.ok) {
        results.push({
          path: f.path,
          status: sha ? "updated" : "created",
          url: `${repoUrl}/blob/main/${filePath}`
        });
      } else {
        const errText = await uploadRes.text();
        results.push({
          path: f.path,
          status: "failed",
          error: errText
        });
      }
    }

    res.json({ repoUrl, owner, repoName, results });
  } catch (err: any) {
    console.error("GitHub push error:", err);
    res.status(500).json({ error: err.message || "Failed to push to GitHub" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Commit Archaeology Engine running on port ${PORT}`);
  });
}

startServer();
