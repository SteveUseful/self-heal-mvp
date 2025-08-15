// self-healing/architecturalAnalysis.js
import fs from 'fs';
import path from 'path';

// Architectural anti-patterns and their fixes
const architecturalPatterns = {
  javascript: [
    {
      name: 'God Object',
      pattern: /class\s+\w+\s*\{[\s\S]*?\}/g,
      check: (match, code) => {
        const classContent = match[0];
        const methods = (classContent.match(/^\s*\w+\s*\([^)]*\)/gm) || []).length;
        const properties = (classContent.match(/^\s*\w+\s*[:=]/gm) || []).length;
        return methods > 10 || properties > 15;
      },
      severity: 'high',
      suggestion: 'Consider breaking this class into smaller, focused classes following Single Responsibility Principle'
    },
    {
      name: 'Callback Hell',
      pattern: /\.then\([^)]*\)/g,
      check: (match, code) => {
        const after = code.substring(match.index);
        const thenCount = (after.match(/\.then\(/g) || []).length;
        return thenCount > 3;
      },
      severity: 'medium',
      suggestion: 'Consider using async/await or breaking into smaller functions'
    },
    {
      name: 'Circular Dependencies',
      pattern: /import.*from.*['"]\.\.?\/.*['"]/g,
      check: (match, code) => {
        // This is a simplified check - real circular dependency detection is more complex
        return true;
      },
      severity: 'high',
      suggestion: 'Review import structure and consider dependency injection or restructuring'
    }
  ],
  
  python: [
    {
      name: 'Monolithic Function',
      pattern: /def\s+\w+\s*\([^)]*\):[\s\S]*?return/g,
      check: (match, code) => {
        const functionContent = match[0];
        const lines = functionContent.split('\n').length;
        return lines > 50;
      },
      severity: 'medium',
      suggestion: 'Break this function into smaller, focused functions'
    }
  ]
};

export function analyzeArchitecture(projectPath) {
  const issues = [];
  
  // Analyze file structure
  const structureIssues = analyzeFileStructure(projectPath);
  issues.push(...structureIssues);
  
  // Analyze code patterns
  const codeIssues = analyzeCodePatterns(projectPath);
  issues.push(...codeIssues);
  
  // Analyze dependencies
  const dependencyIssues = analyzeDependencies(projectPath);
  issues.push(...dependencyIssues);
  
  return issues;
}

function analyzeFileStructure(projectPath) {
  const issues = [];
  
  // Check for flat directory structure (too many files in root)
  const rootFiles = fs.readdirSync(projectPath).filter(item => {
    const fullPath = path.join(projectPath, item);
    return fs.statSync(fullPath).isFile() && item.endsWith('.js');
  });
  
  if (rootFiles.length > 10) {
    issues.push({
      type: 'File Organization',
      severity: 'medium',
      description: 'Too many files in root directory',
      suggestion: 'Organize files into logical directories (components, utils, services, etc.)',
      files: rootFiles
    });
  }
  
  return issues;
}

function analyzeCodePatterns(projectPath) {
  const issues = [];
  const codeFiles = findCodeFiles(projectPath);
  
  codeFiles.forEach(file => {
    const language = detectLanguageFromFile(file);
    const patterns = architecturalPatterns[language] || [];
    const code = fs.readFileSync(file, 'utf-8');
    
    patterns.forEach(pattern => {
      const matches = code.matchAll(pattern.pattern);
      
      for (const match of matches) {
        if (pattern.check(match[0], code)) {
          issues.push({
            type: pattern.name,
            severity: pattern.severity,
            description: pattern.name,
            suggestion: pattern.suggestion,
            file: file,
            line: getLineNumber(code, match.index)
          });
        }
      }
    });
  });
  
  return issues;
}

function analyzeDependencies(projectPath) {
  const issues = [];
  
  // Check package.json for potential issues
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    // Check for too many dependencies
    const deps = Object.keys(packageJson.dependencies || {}).length;
    const devDeps = Object.keys(packageJson.devDependencies || {}).length;
    
    if (deps > 50) {
      issues.push({
        type: 'Dependency Bloat',
        severity: 'medium',
        description: `Too many production dependencies (${deps})`,
        suggestion: 'Review and remove unused dependencies. Consider using bundle analysis tools.',
        count: deps
      });
    }
    
    if (devDeps > 30) {
      issues.push({
        type: 'Development Dependency Bloat',
        severity: 'low',
        description: `Many development dependencies (${devDeps})`,
        suggestion: 'Review and consolidate development tools.',
        count: devDeps
      });
    }
  }
  
  return issues;
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
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go'];
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

export function generateArchitecturalReport(issues) {
  if (issues.length === 0) {
    return '✅ No architectural issues found.';
  }
  
  const report = issues.map(issue => `
**${issue.severity.toUpperCase()}**: ${issue.type}
**Description**: ${issue.description}
**File**: ${issue.file || 'N/A'}
**Line**: ${issue.line || 'N/A'}
**Suggestion**: ${issue.suggestion}
`).join('\n---\n');
  
  return `🏗️ **Architectural Analysis Found ${issues.length} Issues**\n\n${report}`;
}

export function suggestRefactoring(issues) {
  const suggestions = [];
  
  issues.forEach(issue => {
    switch (issue.type) {
      case 'God Object':
        suggestions.push({
          type: 'Class Refactoring',
          description: 'Break large class into smaller classes',
          steps: [
            'Identify distinct responsibilities in the class',
            'Create separate classes for each responsibility',
            'Use composition or inheritance as appropriate',
            'Update references to use new classes'
          ]
        });
        break;
        
      case 'Callback Hell':
        suggestions.push({
          type: 'Async Refactoring',
          description: 'Convert callbacks to async/await',
          steps: [
            'Identify the promise chain',
            'Convert to async function',
            'Replace .then() with await',
            'Add proper error handling with try/catch'
          ]
        });
        break;
        
      case 'File Organization':
        suggestions.push({
          type: 'Directory Restructuring',
          description: 'Organize files into logical directories',
          steps: [
            'Create directories: components/, utils/, services/, etc.',
            'Move files to appropriate directories',
            'Update import statements',
            'Update build configuration if needed'
          ]
        });
        break;
    }
  });
  
  return suggestions;
}
