import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  GitCommit, CheckCircle2, XCircle, Brain, FileCode, Search, 
  Download, RefreshCw, Layers, Terminal, Sparkles, Copy, Check, Plus, Tag, X,
  Github, UploadCloud, Lock, Globe, ExternalLink, ShieldCheck, AlertCircle, FolderGit2,
  Settings, Key, Cpu, User, Save, Eye, EyeOff, FolderDown, Archive, Star
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CommitRecord, CommitStats } from './types';

export default function App() {
  const [commits, setCommits] = useState<CommitRecord[]>([]);
  const [stats, setStats] = useState<CommitStats | null>(null);
  const [correctMd, setCorrectMd] = useState<string>('');
  const [wrongMd, setWrongMd] = useState<string>('');
  const [stuffMd, setStuffMd] = useState<string>('');
  const [rawLogInput, setRawLogInput] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'correct' | 'wrong' | 'stuff' | 'search'>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string | null>(null);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);

  // Settings Panel State
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState<boolean>(false);

  // Custom user themes state
  const [customThemes, setCustomThemes] = useState<string[]>(['refactor', 'middleware', 'auth', 'config']);
  const [newThemeInput, setNewThemeInput] = useState<string>('');

  // Comprehensive User API & Connection Inputs State
  const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem('cae_github_pat') || '');
  const [githubAccount, setGithubAccount] = useState<string>(() => localStorage.getItem('cae_github_account') || '');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('cae_gemini_api_key') || '');
  const [commitLimit, setCommitLimit] = useState<number>(() => parseInt(localStorage.getItem('cae_commit_limit') || '500', 10));
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem('cae_selected_model');
    if (saved && ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-pro-preview'].includes(saved)) return saved;
    return 'gemini-3.1-flash-lite';
  });

  const [showPatToken, setShowPatToken] = useState<boolean>(false);
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [configSavedNotice, setConfigSavedNotice] = useState<boolean>(false);

  // GitHub Push Integration State
  const [showGitHubModal, setShowGitHubModal] = useState<boolean>(false);
  const [githubUser, setGithubUser] = useState<{ login: string; name: string; avatar_url: string; html_url: string } | null>(null);
  const [verifyingToken, setVerifyingToken] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [showRepoModal, setShowRepoModal] = useState<boolean>(false);
  const [fetchingHistory, setFetchingHistory] = useState<boolean>(false);
  const [analyzeEntireHistory, setAnalyzeEntireHistory] = useState<boolean>(true);

  // Public GitHub Repository discovery & account switcher state
  const [repoAccountInput, setRepoAccountInput] = useState<string>(() => localStorage.getItem('cae_github_account') || '');
  const [repoSearchFilter, setRepoSearchFilter] = useState<string>('');
  const [directRepoInput, setDirectRepoInput] = useState<string>('');
  const [loadingRepos, setLoadingRepos] = useState<boolean>(false);
  const [repoLoadError, setRepoLoadError] = useState<string | null>(null);

  const [repoName, setRepoName] = useState<string>('Archaeology-Engine');
  const [isPrivateRepo, setIsPrivateRepo] = useState<boolean>(false);
  const [targetFolder, setTargetFolder] = useState<string>('archaeology');
  const [pushScope, setPushScope] = useState<'deliverables' | 'full_app'>('deliverables');

  const [pushingToGitHub, setPushingToGitHub] = useState<boolean>(false);
  const [pushSuccess, setPushSuccess] = useState<{
    repoUrl: string;
    owner: string;
    repoName: string;
    results: Array<{ path: string; status: string; url: string }>;
  } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  const loadRepositories = async (targetAccount?: string) => {
    setLoadingRepos(true);
    setRepoLoadError(null);
    try {
      const accountToFetch = targetAccount !== undefined ? targetAccount.trim() : repoAccountInput.trim();
      const res = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: githubToken.trim(), 
          account: accountToFetch,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRepoLoadError(data.error || 'Failed to load repositories');
        setUserRepos([]);
      } else if (Array.isArray(data)) {
        setUserRepos(data);
      }
    } catch (err: any) {
      setRepoLoadError('Failed to connect to GitHub repository service');
      setUserRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  // Load sample and initial repositories on mount
  useEffect(() => {
    loadSampleRepo();
    if (githubToken) {
      verifyGitHubToken(githubToken);
    } else {
      loadRepositories();
    }
  }, []);

  const saveConfigSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem('cae_github_pat', githubToken.trim());
    localStorage.setItem('cae_github_account', githubAccount.trim());
    localStorage.setItem('cae_gemini_api_key', geminiApiKey.trim());
    localStorage.setItem('cae_commit_limit', commitLimit.toString());
    localStorage.setItem('cae_selected_model', selectedModel);
    setRepoAccountInput(githubAccount.trim());

    if (githubToken.trim()) {
      verifyGitHubToken(githubToken.trim());
    } else {
      loadRepositories(githubAccount.trim());
    }

    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 3000);
  };

  const verifyGitHubToken = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;
    setVerifyingToken(true);
    setTokenError(null);
    try {
      const res = await fetch('/api/github/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToVerify.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTokenError(data.error || 'Invalid GitHub Token');
        setGithubUser(null);
        loadRepositories(githubAccount);
      } else {
        setGithubUser(data);
        if (!githubAccount) {
          setGithubAccount(data.login);
          setRepoAccountInput(data.login);
          localStorage.setItem('cae_github_account', data.login);
        }
        
        loadRepositories(githubAccount || data.login);
      }
    } catch (err: any) {
      setTokenError('Failed to verify GitHub token');
      setGithubUser(null);
      loadRepositories(githubAccount);
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleGitHubPush = async () => {
    if (!githubToken.trim()) {
      setTokenError('Personal Access Token is required');
      setShowGitHubModal(true);
      return;
    }
    setPushingToGitHub(true);
    setPushError(null);
    setPushSuccess(null);

    let filesToPush: Array<{ path: string; content: string }> = [
      { path: 'CORRECT.md', content: correctMd },
      { path: 'WRONG.md', content: wrongMd },
      { path: 'stuff.md', content: stuffMd },
      { path: 'COMMITS_LEDGER.md', content: `# Complete Commit Ledger\n\nTotal Commits Analyzed: ${commits.length}\n\n` + commits.map(c => `### [${c.verdict}] ${c.shortHash} - ${c.subject}\n**Author:** ${c.author} | **Date:** ${c.date}\n${c.reason ? `**Note:** ${c.reason}\n` : ''}\n\`\`\`diff\n${c.diff}\n\`\`\`\n`).join('\n---\n\n') },
      { path: 'RAW_GIT_LOG.txt', content: rawLogInput || 'No raw git log captured' },
    ];

    if (pushScope === 'full_app') {
      filesToPush.push(
        { path: 'README.md', content: `# Archaeology Engine Deliverables\n\nGenerated by Commit Archaeology Engine (CAE).\n\n## Included Deliverables in this Folder\n- \`CORRECT.md\` - Success ledger with all confirmed clean commits (newest first)\n- \`WRONG.md\` - Failure and recovery ledger with paired fix commits (newest first)\n- \`stuff.md\` - Gemini intelligence deep archaeological report\n- \`COMMITS_LEDGER.md\` - Complete per-commit breakdown and unified diffs\n- \`RAW_GIT_LOG.txt\` - Complete extracted git history\n` },
        { path: 'SUMMARY.json', content: JSON.stringify({ stats, totalCommits: commits.length, timestamp: new Date().toISOString() }, null, 2) },
        { path: 'metadata.json', content: JSON.stringify({ name: "Archaeology Engine Deliverables", description: "Commit Archaeology Engine deliverables" }, null, 2) }
      );
    }

    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken.trim(),
          repoName: repoName.trim() || 'Archaeology-Engine',
          isPrivate: isPrivateRepo,
          targetFolder: targetFolder.trim(),
          files: filesToPush,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPushError(data.error || 'Failed to push repository to GitHub');
      } else {
        setPushSuccess(data);
      }
    } catch (err: any) {
      setPushError(err.message || 'Error executing push to GitHub');
    } finally {
      setPushingToGitHub(false);
    }
  };

  const loadSampleRepo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sample');
      const data = await res.json();
      setCommits(data.commits);
      setStats(data.stats);
      setRawLogInput(data.rawLog);

      const analysisRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gitLogText: data.rawLog,
          userGeminiApiKey: geminiApiKey,
          userModel: selectedModel,
        })
      });
      const analysisData = await analysisRes.json();
      setCorrectMd(analysisData.correctMd);
      setWrongMd(analysisData.wrongMd);
      setStuffMd(analysisData.stuffMd);
    } catch (err) {
      console.error("Failed to load sample repo:", err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async (overrideLog?: string) => {
    setAnalyzing(true);
    setShowPasteModal(false);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gitLogText: overrideLog || rawLogInput,
          userGeminiApiKey: geminiApiKey,
          userModel: selectedModel,
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(`Analysis error: ${data.error}`);
        setAnalyzing(false);
        return;
      }
      setCommits(data.commits);
      setStats(data.stats);
      setCorrectMd(data.correctMd);
      setWrongMd(data.wrongMd);
      setStuffMd(data.stuffMd);
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Failed to run analysis:", err);
      alert("Failed to connect to backend analysis server.");
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchAndAnalyzeRepo = async (repoFullName: string) => {
    if (!repoFullName || !repoFullName.trim()) {
      alert("Please specify a valid repository name (e.g., owner/repo or full GitHub URL).");
      return;
    }
    const cleanRepoName = repoFullName.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
    setFetchingHistory(true);
    setShowRepoModal(false);
    try {
      const res = await fetch('/api/github/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: githubToken.trim(), 
          repoFullName: cleanRepoName, 
          limit: commitLimit, 
          fetchAll: analyzeEntireHistory 
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Failed to fetch history for ${cleanRepoName}: ${data.error || 'Repository not found or rate limited'}`);
        return;
      }
      setRawLogInput(data.rawLogText);
      await runAnalysis(data.rawLogText);
    } catch (err: any) {
      console.error("Failed to fetch history:", err);
      alert("Error fetching repo history. Check repository visibility and network connection.");
    } finally {
      setFetchingHistory(false);
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFolderAsZip = async () => {
    try {
      const zip = new JSZip();
      const folderName = targetFolder.trim() || 'cae-archaeology-deliverables';
      const folder = zip.folder(folderName) || zip;

      folder.file('CORRECT.md', correctMd);
      folder.file('WRONG.md', wrongMd);
      folder.file('stuff.md', stuffMd);
      folder.file('RAW_GIT_LOG.txt', rawLogInput || '');
      folder.file('SUMMARY.json', JSON.stringify({ stats, totalCommits: commits.length, generatedAt: new Date().toISOString() }, null, 2));
      folder.file(
        'COMMITS_LEDGER.md',
        `# Complete Commit Ledger\n\nTotal Commits Analyzed: ${commits.length}\n\n` +
          commits.map(c => `### [${c.verdict}] ${c.shortHash} - ${c.subject}\n**Author:** ${c.author} | **Date:** ${c.date}\n${c.reason ? `**Note:** ${c.reason}\n` : ''}\n\`\`\`diff\n${c.diff}\n\`\`\`\n`).join('\n---\n\n')
      );
      folder.file(
        'README.md',
        `# Commit Archaeology Engine Deliverables\n\nGenerated for repository history (${commits.length} commits analyzed).\n\n## Files in this Folder:\n- \`CORRECT.md\`: Clean/unbroken commits ledger\n- \`WRONG.md\`: Broken, reverted, and patched commits with recovery links\n- \`stuff.md\`: Gemini AI deep architectural insights and patterns\n- \`COMMITS_LEDGER.md\`: Complete commit-by-commit diff ledger\n- \`RAW_GIT_LOG.txt\`: Complete raw git log history\n- \`SUMMARY.json\`: Quantitative metrics and stats\n`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
      alert('Failed to generate ZIP archive.');
    }
  };

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleAddCustomTheme = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newThemeInput.trim().toLowerCase();
    if (trimmed && !customThemes.includes(trimmed)) {
      setCustomThemes(prev => [...prev, trimmed]);
      setNewThemeInput('');
    }
  };

  const handleRemoveCustomTheme = (themeToRemove: string) => {
    setCustomThemes(prev => prev.filter(t => t !== themeToRemove));
    if (selectedThemeFilter === themeToRemove) {
      setSelectedThemeFilter(null);
      setSearchQuery('');
    }
  };

  const handleSelectThemeFilter = (theme: string) => {
    if (selectedThemeFilter === theme) {
      setSelectedThemeFilter(null);
      setSearchQuery('');
    } else {
      setSelectedThemeFilter(theme);
      setSearchQuery(theme);
    }
  };

  const autoThemes = stats?.themeCounts ? Object.keys(stats.themeCounts) : [];
  const allThemesSet = Array.from(new Set([...customThemes, ...autoThemes]));

  const themeList = allThemesSet.map(theme => {
    const count = commits.filter(c => 
      c.subject.toLowerCase().includes(theme.toLowerCase()) || 
      c.body.toLowerCase().includes(theme.toLowerCase()) ||
      c.files.some(f => f.toLowerCase().includes(theme.toLowerCase()))
    ).length;
    return { theme, count, isCustom: customThemes.includes(theme) };
  }).sort((a, b) => b.count - a.count);

  const filteredCommits = commits.filter(c => {
    const activeFilter = selectedThemeFilter || searchQuery;
    if (!activeFilter) return true;
    const q = activeFilter.toLowerCase();
    return (
      c.subject.toLowerCase().includes(q) ||
      c.hash.toLowerCase().includes(q) ||
      c.author.toLowerCase().includes(q) ||
      c.files.some(f => f.toLowerCase().includes(q)) ||
      (c.reason && c.reason.toLowerCase().includes(q))
    );
  });

  const fileChartData = stats?.fileCounts 
    ? Object.entries(stats.fileCounts)
        .map(([file, count]) => ({ file: file.split('/').pop() || file, fullName: file, count: Number(count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neutral-800/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-neutral-800/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <header className="bg-neutral-900/90 backdrop-blur-xl border-b border-neutral-800/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 p-[1px] shadow-sm ">
              <div className="w-full h-full bg-black rounded-[11px] flex items-center justify-center">
                <GitCommit className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Commit Archaeology Engine</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/25 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-blue-400" />
                    {selectedModel}
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">Deep Git History Postmortems & Emergent Code Intelligence</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsSettingsPanelOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all shadow-sm shadow-purple-500/20"
            >
              <Settings className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Settings</span>
            </button>

            <button 
              onClick={() => setShowGitHubModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all shadow-sm"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Push</span>
            </button>

            <button 
              onClick={() => {
                if (userRepos.length === 0 && githubToken) verifyGitHubToken(githubToken);
                setShowRepoModal(true);
              }}
              disabled={fetchingHistory || analyzing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fetch History</span>
            </button>

            <button 
              onClick={() => setShowPasteModal(true)}
              disabled={fetchingHistory || analyzing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition-all border border-neutral-800 disabled:opacity-50"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Paste Log</span>
            </button>

            <button 
              onClick={loadSampleRepo}
              disabled={loading || analyzing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition-all border border-neutral-800 disabled:opacity-50"
            >
              {loading || analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden sm:inline">Sample</span>
            </button>
          </div>
        </div>
      </header>

      {/* Segmented Navigation Bar */}
      <nav className="bg-neutral-900/40 border-b border-neutral-800/60 sticky top-16 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1.5 overflow-x-auto py-2.5 no-scrollbar">
            {[
              { id: 'dashboard', label: 'Archaeology Dashboard', icon: Layers, count: null, color: 'blue' },
              { id: 'correct', label: 'CORRECT.md', icon: CheckCircle2, count: stats?.totalCorrect, color: 'emerald' },
              { id: 'wrong', label: 'WRONG.md', icon: XCircle, count: stats?.totalWrong, color: 'rose' },
              { id: 'stuff', label: 'stuff.md', icon: Brain, count: null, color: 'purple' },
              { id: 'search', label: 'Search & Filter', icon: Search, count: null, color: 'blue' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-neutral-900 text-white border-blue-500/40 shadow-sm shadow-none'
                      : 'bg-neutral-950/40 text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-neutral-900/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${
                    isActive 
                      ? tab.color === 'emerald' ? 'text-emerald-400'
                        : tab.color === 'rose' ? 'text-rose-400'
                        : tab.color === 'purple' ? 'text-purple-400'
                        : 'text-blue-400'
                      : 'text-neutral-500 group-hover:text-neutral-300'
                  }`} />
                  <span>{tab.label}</span>

                  {tab.count !== null && tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      tab.color === 'emerald' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
                      tab.color === 'rose' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' :
                      'bg-neutral-800 text-neutral-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-neutral-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {(loading || analyzing) ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xs font-mono text-neutral-400 tracking-wide">
              {analyzing ? `Gemini AI (${selectedModel}) synthesizing archaeology corpus...` : "Parsing repository git log structure..."}
            </p>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-8">
                {/* Metric Cards Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-neutral-900/80 p-5 rounded-2xl border border-neutral-800/80 shadow-sm flex items-center justify-between hover:border-neutral-700 transition-all">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Total Commits</p>
                      <h3 className="text-2xl font-bold font-mono text-white mt-1">{stats.total}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-300">
                      <GitCommit className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>

                  <div className="bg-neutral-900/80 p-5 rounded-2xl border border-neutral-800/80 shadow-sm flex items-center justify-between hover:border-emerald-500/30 transition-all">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Correct Commits</p>
                      <h3 className="text-2xl font-bold font-mono text-emerald-300 mt-1">{stats.totalCorrect}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-neutral-900/80 p-5 rounded-2xl border border-neutral-800/80 shadow-sm flex items-center justify-between hover:border-rose-500/30 transition-all">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-rose-400">Wrong / Reverted</p>
                      <h3 className="text-2xl font-bold font-mono text-rose-300 mt-1">{stats.totalWrong}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-neutral-900/80 p-5 rounded-2xl border border-neutral-800/80 shadow-sm flex items-center justify-between hover:border-purple-500/30 transition-all">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-purple-400">File Hotspots</p>
                      <h3 className="text-2xl font-bold font-mono text-purple-300 mt-1">{Object.keys(stats.fileCounts).length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Hotspots Chart & Subject Theme Chips */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Top Touched Files Chart */}
                  <div className="lg:col-span-5 bg-neutral-900/80 p-6 rounded-2xl border border-neutral-800/80 shadow-sm flex flex-col">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300 mb-4 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      Architectural Hotspots
                    </h3>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fileChartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                          <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={11} />
                          <YAxis dataKey="file" type="category" width={90} stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '10px', color: '#f8fafc', fontSize: '12px' }}
                            formatter={(value: any) => [`${value} commits`, 'Touched']} 
                          />
                          <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recurring Keywords & User Themes */}
                  <div className="lg:col-span-7 bg-neutral-900/80 p-6 rounded-2xl border border-neutral-800/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-400" />
                          Subject Keywords & Themes
                        </h3>
                        {selectedThemeFilter && (
                          <button
                            onClick={() => {
                              setSelectedThemeFilter(null);
                              setSearchQuery('');
                            }}
                            className="inline-flex items-center space-x-1 text-[11px] font-mono text-blue-400 hover:text-blue-300"
                          >
                            <X className="w-3 h-3" />
                            <span>Clear Filter ({selectedThemeFilter})</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mb-4">
                        Click any keyword pill to filter commits, or add your own custom subject theme tags below:
                      </p>

                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                        {themeList.map(({ theme, count, isCustom }) => {
                          const isSelected = selectedThemeFilter?.toLowerCase() === theme.toLowerCase();
                          return (
                            <div
                              key={theme}
                              onClick={() => {
                                handleSelectThemeFilter(theme);
                                setActiveTab('search');
                              }}
                              className={`group inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-white text-black border-blue-400 shadow-sm'
                                  : isCustom
                                  ? 'bg-purple-950/40 text-purple-200 border-purple-500/30 hover:bg-purple-900/50'
                                  : 'bg-black text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                              }`}
                            >
                              <span>{theme}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                                isSelected ? 'bg-blue-900 text-blue-100' : 'bg-neutral-800/80 text-neutral-400'
                              }`}>
                                {count}
                              </span>
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveCustomTheme(theme);
                                  }}
                                  className="text-neutral-400 hover:text-rose-400 ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <form onSubmit={handleAddCustomTheme} className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add theme tag (e.g. refactor, auth, api)..."
                        value={newThemeInput}
                        onChange={(e) => setNewThemeInput(e.target.value)}
                        className="flex-1 bg-black text-xs px-3.5 py-2.5 rounded-xl border border-neutral-800 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center space-x-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Tag</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Archaeology Deliverables Download & Push Card */}
                <div className="bg-neutral-900 rounded-2xl p-6 sm:p-8 border border-neutral-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-400" />
                      Archaeology Deliverables & Complete File Folder
                    </h3>
                    <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                      Complete commit files ready for download or push to a new folder in GitHub. Every new commit is ordered chronologically newest-first.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={downloadFolderAsZip}
                      className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      <FolderDown className="w-4 h-4" />
                      <span>Download All (Complete Folder .zip)</span>
                    </button>
                    <button
                      onClick={() => setShowGitHubModal(true)}
                      className="inline-flex items-center space-x-2 bg-white hover:bg-neutral-200 text-black font-mono text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      <Github className="w-4 h-4" />
                      <span>Push to New Folder</span>
                    </button>
                    <button
                      onClick={() => downloadFile('CORRECT.md', correctMd)}
                      className="inline-flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-xs px-3.5 py-2.5 rounded-xl transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CORRECT.md</span>
                    </button>
                    <button
                      onClick={() => downloadFile('WRONG.md', wrongMd)}
                      className="inline-flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-xs px-3.5 py-2.5 rounded-xl transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>WRONG.md</span>
                    </button>
                    <button
                      onClick={() => downloadFile('stuff.md', stuffMd)}
                      className="inline-flex items-center space-x-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-xs px-3.5 py-2.5 rounded-xl transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>stuff.md</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Markdown Viewers (CORRECT.md, WRONG.md, stuff.md) */}
            {(activeTab === 'correct' || activeTab === 'wrong' || activeTab === 'stuff') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="font-mono text-xs font-bold text-white">
                      {activeTab === 'correct' ? 'CORRECT.md' : activeTab === 'wrong' ? 'WRONG.md' : 'stuff.md'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowGitHubModal(true)}
                      className="inline-flex items-center space-x-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono px-3.5 py-2 rounded-xl transition-all"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Push to GitHub</span>
                    </button>
                    <button
                      onClick={() => {
                        const content = activeTab === 'correct' ? correctMd : activeTab === 'wrong' ? wrongMd : stuffMd;
                        const filename = `${activeTab}.md`;
                        copyToClipboard(content, activeTab);
                        downloadFile(filename, content);
                      }}
                      className="inline-flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 font-mono px-3.5 py-2 rounded-xl border border-neutral-800 transition-all"
                    >
                      {copiedTab === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                      <span>{copiedTab === activeTab ? 'Copied & Exported!' : 'Copy / Export'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-black rounded-2xl border border-neutral-800 shadow-sm overflow-hidden">
                  <pre className="p-6 text-xs font-mono text-neutral-300 whitespace-pre-wrap overflow-x-auto leading-relaxed selection:bg-blue-600 selection:text-white">
                    {activeTab === 'correct' ? correctMd : activeTab === 'wrong' ? wrongMd : stuffMd}
                  </pre>
                </div>
              </div>
            )}

            {/* Search & Filter Tab */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="bg-neutral-900/90 p-6 rounded-2xl border border-neutral-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300">Search & Filter Commit History</h2>
                    {(searchQuery || selectedThemeFilter) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedThemeFilter(null);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Search commit subject, hash, author, modified files, or failure reason..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedThemeFilter(null);
                      }}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-800 bg-black text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredCommits.length === 0 ? (
                    <div className="text-center py-16 bg-neutral-900/40 rounded-2xl border border-neutral-800/80 text-neutral-500 text-xs font-mono">
                      No commits match current search filter criteria.
                    </div>
                  ) : (
                    filteredCommits.map((c) => (
                      <div key={c.hash} className="bg-neutral-900/80 p-5 rounded-2xl border border-neutral-800/80 space-y-3 hover:border-neutral-700 transition-all shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              c.verdict === 'OK' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {c.verdict}
                            </span>
                            <span className="font-mono text-xs text-blue-400 font-bold">{c.shortHash}</span>
                            <span className="text-xs text-neutral-500">• {c.date}</span>
                          </div>
                          {c.fixedBy && (
                            <span className="text-[11px] font-mono text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                              Fixed by: {c.fixedBy}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-neutral-200">{c.subject}</h3>
                        {c.reason && (
                          <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-mono">
                            Reason: {c.reason}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.files.map((f: string) => (
                            <span key={f} className="text-[11px] bg-black text-neutral-400 px-2.5 py-1 rounded-lg font-mono border border-neutral-800">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Slide-out Settings Side Panel (Drawer) */}
      {isSettingsPanelOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsSettingsPanelOpen(false)}
          ></div>

          {/* Right Side Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-sm flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800/80 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Settings className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">System Settings</h2>
              </div>
              <button 
                onClick={() => setIsSettingsPanelOpen(false)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-32 scroll-smooth custom-scrollbar">
              {configSavedNotice && (
                <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-mono animate-in slide-in-from-top-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Preferences saved successfully to local state.</span>
                </div>
              )}

              <form id="settings-form" onSubmit={saveConfigSettings} className="space-y-8">
                {/* GitHub Preferences */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-400 pb-2 border-b border-neutral-800/50">
                    <Github className="w-4 h-4" />
                    <h3 className="text-xs font-bold font-mono uppercase tracking-widest">GitHub Configuration</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300">GitHub Personal Access Token (PAT)</label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <input
                            type={showPatToken ? 'text' : 'password'}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            value={githubToken}
                            onChange={(e) => {
                              setGithubToken(e.target.value);
                              setTokenError(null);
                            }}
                            className="w-full bg-black text-xs font-mono pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-800 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPatToken(!showPatToken)}
                            className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                          >
                            {showPatToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => verifyGitHubToken(githubToken)}
                          disabled={verifyingToken || !githubToken.trim()}
                          className="px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-neutral-200 rounded-xl transition-all border border-neutral-700 disabled:opacity-50 shrink-0"
                        >
                          {verifyingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Verify'}
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1.5">
                        <a
                          href="https://github.com/settings/tokens/new?scopes=repo"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                        >
                          Generate a new token <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {tokenError && (
                        <div className="mt-2 text-[11px] font-mono text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{tokenError}</span>
                        </div>
                      )}

                      {githubUser && (
                        <div className="mt-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                          <img src={githubUser.avatar_url} alt={githubUser.login} className="w-5 h-5 rounded-full border border-emerald-500/50" />
                          <span>Verified: <strong>{githubUser.login}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-neutral-300">GitHub Account / Username</label>
                        <span className="text-[10px] text-neutral-500">Optional for public exploration</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. octocat, torvalds, or leave blank"
                        value={githubAccount}
                        onChange={(e) => setGithubAccount(e.target.value)}
                        className="w-full bg-black text-xs font-mono px-3.5 py-2.5 rounded-xl border border-neutral-800 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      />
                      <p className="text-[10px] text-neutral-500">
                        When left blank, the engine automatically browses and discovers public GitHub accounts and repositories.
                      </p>
                    </div>

                    <div className={`space-y-1.5 pt-2 ${analyzeEntireHistory ? 'opacity-50 pointer-events-none' : ''}`}>
                      <label className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                        <span>Max Commits to Fetch</span>
                        <span className="text-blue-400 font-mono">{analyzeEntireHistory ? 'ALL' : commitLimit}</span>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={commitLimit}
                        disabled={analyzeEntireHistory}
                        onChange={(e) => setCommitLimit(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <p className="text-[10px] text-neutral-500">Higher limits provide deeper insights but take slightly longer to fetch.</p>
                    </div>

                  </div>
                </div>

                {/* Gemini API Preferences */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-400 pb-2 border-b border-neutral-800/50">
                    <Cpu className="w-4 h-4" />
                    <h3 className="text-xs font-bold font-mono uppercase tracking-widest">Gemini AI Models</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300">Custom Gemini API Key</label>
                      <div className="relative">
                        <input
                          type={showGeminiKey ? 'text' : 'password'}
                          placeholder="AIzaSy... (leave blank to use env var)"
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          className="w-full bg-black text-xs font-mono pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-800 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey(!showGeminiKey)}
                          className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-500">Overrides the default system API key if provided.</p>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-xs font-semibold text-neutral-300">Analysis Engine Model Version</label>
                      <div className="flex flex-col gap-2.5">
                        {[
                          { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', badge: 'High Availability & Quota / Recommended' },
                          { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Fast / High Capacity' },
                          { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', badge: 'Standard Flash' },
                          { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', badge: 'Deep Reasoning' },
                        ].map(model => (
                          <label 
                            key={model.id}
                            className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                              selectedModel === model.id
                                ? 'bg-purple-500/10 border-purple-500/50 shadow-sm'
                                : 'bg-black border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <input 
                              type="radio"
                              name="ai-model"
                              value={model.id}
                              checked={selectedModel === model.id}
                              onChange={(e) => setSelectedModel(e.target.value)}
                              className="mt-1 accent-purple-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white font-mono">{model.name}</span>
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                                  selectedModel === model.id 
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                }`}>
                                  {model.badge}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-neutral-800/80 bg-black/50 backdrop-blur-md">
              <button
                type="submit"
                form="settings-form"
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-white hover:bg-neutral-200 text-xs font-semibold text-black transition-all shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences to Local State</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* GitHub Repository Creation & File Push Modal */}
      {showGitHubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-sm border border-neutral-800 space-y-6 my-8 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">GitHub Repository System</h3>
                  <p className="text-[11px] text-neutral-400">Create new GitHub repo & push Archaeology deliverables</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGitHubModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* GitHub PAT Verification Block */}
            <div className="space-y-3 bg-black p-4 rounded-xl border border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  GitHub Personal Access Token (PAT)
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=CommitArchaeologyEngine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Generate Token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex space-x-2">
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => {
                    setGithubToken(e.target.value);
                    setTokenError(null);
                  }}
                  className="flex-1 bg-neutral-900 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-neutral-800 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => verifyGitHubToken(githubToken)}
                  disabled={verifyingToken || !githubToken.trim()}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-xl transition-all border border-neutral-700 disabled:opacity-50"
                >
                  {verifyingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                </button>
              </div>

              {tokenError && (
                <div className="text-[11px] font-mono text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{tokenError}</span>
                </div>
              )}

              {githubUser && (
                <div className="flex items-center space-x-2.5 pt-1">
                  <img src={githubUser.avatar_url} alt={githubUser.login} className="w-6 h-6 rounded-full border border-neutral-700" />
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Connected as <strong>{githubUser.login}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Repository Config Form */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                  Target Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="Archaeology-Engine"
                  className="w-full bg-black text-xs font-mono px-3.5 py-2.5 rounded-xl border border-neutral-800 text-neutral-200 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-neutral-500">If repository does not exist on GitHub, it will be created automatically.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Target Folder on GitHub</label>
                  </div>
                  <input
                    type="text"
                    value={targetFolder}
                    onChange={(e) => setTargetFolder(e.target.value)}
                    placeholder="e.g. archaeology, history, docs (leave empty for root)"
                    className="w-full bg-black text-xs font-mono px-3.5 py-2.5 rounded-xl border border-neutral-800 text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['archaeology', 'history', 'commit-deliverables', 'docs'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setTargetFolder(f)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                          targetFolder === f ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                        }`}
                      >
                        /{f}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTargetFolder('')}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                        targetFolder === '' ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                      }`}
                    >
                      / (root)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Visibility</label>
                  <div className="flex items-center space-x-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsPrivateRepo(false)}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-mono flex items-center justify-center gap-1 border ${
                        !isPrivateRepo ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' : 'bg-black text-neutral-400 border-neutral-800'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivateRepo(true)}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-mono flex items-center justify-center gap-1 border ${
                        isPrivateRepo ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' : 'bg-black text-neutral-400 border-neutral-800'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Private</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scope Selection */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Complete Files to Place in Folder</label>
                <div className="space-y-2 bg-black p-3.5 rounded-xl border border-neutral-800 text-xs font-mono text-neutral-300">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pushScope"
                      checked={pushScope === 'deliverables'}
                      onChange={() => setPushScope('deliverables')}
                      className="accent-blue-500"
                    />
                    <span>All Core Files (<code className="text-emerald-400">CORRECT.md</code>, <code className="text-rose-400">WRONG.md</code>, <code className="text-purple-400">stuff.md</code>, <code className="text-blue-400">COMMITS_LEDGER.md</code>, <code className="text-neutral-400">RAW_GIT_LOG.txt</code>)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pushScope"
                      checked={pushScope === 'full_app'}
                      onChange={() => setPushScope('full_app')}
                      className="accent-blue-500"
                    />
                    <span>Complete Bundle + README.md & SUMMARY.json Metrics</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Error or Success Alert */}
            {pushError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{pushError}</span>
              </div>
            )}

            {pushSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Successfully created & pushed to GitHub!
                  </span>
                  <a
                    href={pushSuccess.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-mono"
                  >
                    <span>View Repository</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-neutral-300 pt-1">
                  {pushSuccess.results.map(r => (
                    <div key={r.path} className="flex items-center justify-between">
                      <span>✓ {r.path}</span>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-200">
                        view file
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 border-t border-neutral-800/80 pt-4">
              <button
                type="button"
                onClick={() => setShowGitHubModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:bg-neutral-800 transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleGitHubPush}
                disabled={pushingToGitHub || !githubToken.trim()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-xs font-semibold text-black transition-all shadow-sm disabled:opacity-50"
              >
                {pushingToGitHub ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>Create Repo & Push Files</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Git Log Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-sm border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                Paste Custom Git Log
              </h3>
              <button 
                onClick={() => setShowPasteModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-neutral-400">
              Paste raw output from <code className="bg-black px-1.5 py-0.5 rounded text-blue-400 font-mono">git log -p</code>. The CAE engine will run 3-path failure detection and synthesize Gemini intelligence.
            </p>

            <textarea
              rows={12}
              value={rawLogInput}
              onChange={(e) => setRawLogInput(e.target.value)}
              placeholder="commit 42f941a87b6c...&#10;Author: ...&#10;Date: ...&#10;&#10;    subject line&#10;&#10;diff --git ..."
              className="w-full font-mono text-xs p-4 rounded-xl border border-neutral-800 bg-black text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:bg-neutral-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => runAnalysis()}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-xs font-semibold text-black transition-all shadow-sm"
              >
                Run Archaeology Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Repo Modal */}
      {showRepoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-sm border border-neutral-800 space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0 border-b border-neutral-800/80 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Github className="w-4 h-4 text-blue-400" />
                  Select Repository to Analyze
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Analyze any public GitHub account, popular open-source repository, or your authenticated repositories.
                </p>
              </div>
              <button 
                onClick={() => setShowRepoModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Direct Any Repo Analysis Bar */}
            <div className="bg-black p-3 rounded-xl border border-neutral-800 space-y-2 shrink-0">
              <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Analyze Any Public GitHub Repository Directly
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. facebook/react, torvalds/linux, or https://github.com/shadcn-ui/ui"
                  value={directRepoInput}
                  onChange={(e) => setDirectRepoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && directRepoInput.trim()) {
                      fetchAndAnalyzeRepo(directRepoInput.trim());
                    }
                  }}
                  className="flex-1 bg-neutral-900 text-xs font-mono px-3 py-2 rounded-xl border border-neutral-800 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => directRepoInput.trim() && fetchAndAnalyzeRepo(directRepoInput.trim())}
                  disabled={!directRepoInput.trim() || fetchingHistory}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0"
                >
                  {fetchingHistory ? 'Fetching...' : 'Analyze Repo'}
                </button>
              </div>
            </div>

            {/* Account Switcher & Public Exploration */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  Browse Public Account / Organization
                </label>
                <span className="text-[10px] text-neutral-500">
                  {repoAccountInput ? `Browsing @${repoAccountInput}` : 'Browsing Public GitHub Repos'}
                </span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter username/org (e.g. facebook, vercel, shadcn-ui) or leave empty"
                  value={repoAccountInput}
                  onChange={(e) => setRepoAccountInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadRepositories(repoAccountInput);
                    }
                  }}
                  className="flex-1 bg-black text-xs font-mono px-3 py-2 rounded-xl border border-neutral-800 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => loadRepositories(repoAccountInput)}
                  disabled={loadingRepos}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-xl transition-all border border-neutral-700 disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  {loadingRepos ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>{repoAccountInput.trim() ? 'Load Account' : 'Explore Public'}</span>
                </button>
              </div>

              {/* Quick Account Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRepoAccountInput('');
                    loadRepositories('');
                  }}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                    !repoAccountInput ? 'bg-purple-600/30 text-purple-300 border-purple-500/50' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  ★ Popular Public
                </button>
                {['shadcn-ui', 'facebook', 'vercel', 'tailwindlabs', 'torvalds', 'vuejs'].map((acc) => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => {
                      setRepoAccountInput(acc);
                      loadRepositories(acc);
                    }}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                      repoAccountInput === acc ? 'bg-purple-600/30 text-purple-300 border-purple-500/50' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    @{acc}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter loaded repositories */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter loaded repositories..."
                  value={repoSearchFilter}
                  onChange={(e) => setRepoSearchFilter(e.target.value)}
                  className="w-full bg-black text-xs font-mono pl-8 pr-3 py-1.5 rounded-xl border border-neutral-800 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                {userRepos.filter(r => !repoSearchFilter || r.name.toLowerCase().includes(repoSearchFilter.toLowerCase()) || r.full_name.toLowerCase().includes(repoSearchFilter.toLowerCase())).length} repos
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-800/40 border border-neutral-800/60 shrink-0">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-200">Analyze Entire Commit History</span>
                <span className="text-[10px] text-neutral-400">Fetch all commit pages across the complete git log.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={analyzeEntireHistory}
                  onChange={(e) => setAnalyzeEntireHistory(e.target.checked)}
                />
                <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            {/* Repository List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {loadingRepos ? (
                <div className="text-center py-10 space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400 mx-auto" />
                  <p className="text-xs text-neutral-400">Loading public GitHub repositories...</p>
                </div>
              ) : repoLoadError ? (
                <div className="text-center py-8 space-y-3 bg-rose-500/5 rounded-xl border border-rose-500/20 p-4">
                  <p className="text-xs text-rose-400">{repoLoadError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRepoAccountInput('');
                      loadRepositories('');
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-all shadow-sm"
                  >
                    <span>Load Public Repositories</span>
                  </button>
                </div>
              ) : userRepos.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-sm text-neutral-400">No repositories found for this selection.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRepoAccountInput('');
                      loadRepositories('');
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-all shadow-sm"
                  >
                    <span>Load Public GitHub Repos</span>
                  </button>
                </div>
              ) : (
                userRepos
                  .filter(repo => !repoSearchFilter || repo.name.toLowerCase().includes(repoSearchFilter.toLowerCase()) || repo.full_name.toLowerCase().includes(repoSearchFilter.toLowerCase()) || (repo.description && repo.description.toLowerCase().includes(repoSearchFilter.toLowerCase())))
                  .map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => fetchAndAnalyzeRepo(repo.full_name)}
                      disabled={fetchingHistory || analyzing}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-black border border-neutral-800 hover:border-blue-500/50 hover:bg-neutral-950 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-200 truncate">{repo.name}</span>
                          {repo.private ? (
                            <Lock className="w-3 h-3 text-neutral-500 shrink-0" />
                          ) : (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">public</span>
                          )}
                          {repo.stargazers_count > 0 && (
                            <span className="text-[10px] text-amber-400/80 flex items-center gap-0.5 font-mono shrink-0">
                              <Star className="w-3 h-3 fill-amber-400/80" />
                              {repo.stargazers_count > 1000 ? `${(repo.stargazers_count / 1000).toFixed(1)}k` : repo.stargazers_count}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block truncate">{repo.full_name}</span>
                        {repo.description && (
                          <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">{repo.description}</p>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 px-3 py-1.5 rounded-lg bg-neutral-800/60 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 font-medium">
                        {fetchingHistory ? 'Fetching...' : 'Analyze History'}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-neutral-900/80 border-t border-neutral-800/80 py-4 mt-auto backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
          <span>Commit Archaeology Engine — Powered by Google AI Studio & Gemini ({selectedModel})</span>
          <span className="font-mono text-neutral-400 font-medium">craighckby-stack 2026</span>
        </div>
      </footer>
    </div>
  );
}
