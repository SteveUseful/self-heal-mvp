// self-healing/staticAnalysis.js
import fs from 'fs';
import path from 'path';

// Bug patterns for different languages
const bugPatterns = {
  javascript: [
    {
      name: 'Potential Null Reference',
      pattern: /\w+\.\w+\(\)/g,
      check: (match, code) => {
        const before = code.substring(0, match.index);
        return !before.includes('?.') && !before.includes('&&');
      },
      severity: 'warning',
      fix: (match) => `${match.replace(/\.(\w+)\(\)/, '?.$1()')}`
    },
    {
      name: 'Unhandled Promise',
      pattern: /new Promise\([^)]*\)/g,
      check: (match, code) => {
        const after = code.substring(match.index + match[0].length);
        return !after.includes('.catch(') && !after.includes('.then(');
      },
      severity: 'error',
      fix: (match) => `${match}.catch(err => console.error(err))`
    },
    {
      name: 'Memory Leak - Event Listener',
      pattern: /addEventListener\([^)]*\)/g,
      check: (match, code) => {
        const after = code.substring(match.index + match[0].length);
        return !after.includes('removeEventListener');
      },
      severity: 'warning',
      fix: (match) => `// Consider removing event listener when component unmounts`
    },
    {
      name: 'Potential Race Condition',
      pattern: /setTimeout\([^)]*\)/g,
      check: (match, code) => {
        const after = code.substring(match.index + match[0].length);
        return after.includes('setTimeout') && !after.includes('clearTimeout');
      },
      severity: 'warning',
      fix: (match) => `// Consider using clearTimeout to prevent race conditions`
    }
  ],
  
  python: [
    {
      name: 'Unsafe File Operation',
      pattern: /open\([^)]*\)/g,
      check: (match, code) => {
        return !code.includes('with open(');
      },
      severity: 'error',
      fix: (match) => `with ${match} as f:`
    },
    {
      name: 'Potential Division by Zero',
      pattern: /\w+\s*\/\s*\w+/g,
      check: (match, code) => {
        const after = code.substring(match.index + match[0].length);
        return !after.includes('if') && !after.includes('except');
      },
      severity: 'warning',
      fix: (match) => `# Check for zero before division`
    }
  ],
  
  java: [
    {
      name: 'Resource Leak',
      pattern: /new\s+\w+\([^)]*\)/g,
      check: (match, code) => {
        const after = code.substring(match.index + match[0].length);
        return !after.includes('try-with-resources') && !after.includes('.close()');
      },
      severity: 'warning',
      fix: (match) => `// Consider using try-with-resources`
    }
  ]
};

export function analyzeCodeForBugs(filePath, language) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const patterns = bugPatterns[language] || bugPatterns.javascript;
  const bugs = [];
  
  patterns.forEach(pattern => {
    const matches = code.matchAll(pattern.pattern);
    
    for (const match of matches) {
      if (pattern.check(match[0], code)) {
        bugs.push({
          type: pattern.name,
          line: getLineNumber(code, match.index),
          severity: pattern.severity,
          description: `Potential ${pattern.name.toLowerCase()} detected`,
          suggestion: pattern.fix(match[0]),
          code: match[0]
        });
      }
    }
  });
  
  return bugs;
}

export function analyzeProjectForBugs(projectPath) {
  const bugs = [];
  
  // Recursively find all code files
  const codeFiles = findCodeFiles(projectPath);
  
  codeFiles.forEach(file => {
    const language = detectLanguageFromFile(file);
    const fileBugs = analyzeCodeForBugs(file, language);
    bugs.push(...fileBugs.map(bug => ({ ...bug, file })));
  });
  
  return bugs;
}

function findCodeFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findCodeFiles(fullPath, files);
    } else if (isCodeFile(item)) {
      files.push(fullPath);
    }
  });
  
  return files;
}

function isCodeFile(filename) {
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.cpp', '.c'];
  return extensions.some(ext => filename.endsWith(ext));
}

function detectLanguageFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go'
  };
  return languageMap[ext] || 'javascript';
}

function getLineNumber(code, index) {
  return code.substring(0, index).split('\n').length;
}

export function generateBugReport(bugs) {
  if (bugs.length === 0) {
    return '✅ No potential bugs found in static analysis.';
  }
  
  const report = bugs.map(bug => `
**${bug.severity.toUpperCase()}**: ${bug.type}
**File**: ${bug.file}
**Line**: ${bug.line}
**Description**: ${bug.description}
**Code**: \`${bug.code}\`
**Suggestion**: ${bug.suggestion}
`).join('\n---\n');
  
  return `🐛 **Static Analysis Found ${bugs.length} Potential Issues**\n\n${report}`;
}
