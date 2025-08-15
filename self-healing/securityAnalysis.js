// self-healing/securityAnalysis.js
import fs from 'fs';
import path from 'path';

// Security vulnerability patterns
const securityPatterns = {
  javascript: [
    {
      name: 'SQL Injection',
      pattern: /query\([^)]*\+\s*\w+[^)]*\)/g,
      severity: 'critical',
      description: 'Potential SQL injection vulnerability',
      fix: 'Use parameterized queries or prepared statements'
    },
    {
      name: 'XSS Vulnerability',
      pattern: /innerHTML\s*=\s*[^;]+/g,
      severity: 'high',
      description: 'Potential XSS vulnerability through innerHTML',
      fix: 'Use textContent or sanitize input with DOMPurify'
    },
    {
      name: 'Hardcoded Credentials',
      pattern: /(password|secret|key|token)\s*[:=]\s*['"][^'"]+['"]/gi,
      severity: 'critical',
      description: 'Hardcoded credentials found',
      fix: 'Use environment variables or secure credential management'
    },
    {
      name: 'Insecure Random',
      pattern: /Math\.random\(\)/g,
      severity: 'medium',
      description: 'Insecure random number generation',
      fix: 'Use crypto.getRandomValues() for security-critical operations'
    },
    {
      name: 'Eval Usage',
      pattern: /eval\s*\(/g,
      severity: 'critical',
      description: 'Dangerous eval() usage',
      fix: 'Avoid eval(). Use JSON.parse() or other safe alternatives'
    },
    {
      name: 'Insecure HTTP',
      pattern: /http:\/\//g,
      severity: 'medium',
      description: 'Insecure HTTP protocol usage',
      fix: 'Use HTTPS for all external requests'
    }
  ],
  
  python: [
    {
      name: 'SQL Injection',
      pattern: /execute\([^)]*\+\s*\w+[^)]*\)/g,
      severity: 'critical',
      description: 'Potential SQL injection vulnerability',
      fix: 'Use parameterized queries with placeholders'
    },
    {
      name: 'Shell Injection',
      pattern: /os\.system\([^)]*\+\s*\w+[^)]*\)/g,
      severity: 'critical',
      description: 'Potential shell injection vulnerability',
      fix: 'Use subprocess.run() with proper argument lists'
    },
    {
      name: 'Hardcoded Credentials',
      pattern: /(password|secret|key|token)\s*=\s*['"][^'"]+['"]/gi,
      severity: 'critical',
      description: 'Hardcoded credentials found',
      fix: 'Use environment variables or secure credential management'
    }
  ],
  
  java: [
    {
      name: 'SQL Injection',
      pattern: /executeQuery\([^)]*\+\s*\w+[^)]*\)/g,
      severity: 'critical',
      description: 'Potential SQL injection vulnerability',
      fix: 'Use PreparedStatement with parameterized queries'
    },
    {
      name: 'Hardcoded Credentials',
      pattern: /(password|secret|key|token)\s*=\s*['"][^'"]+['"]/gi,
      severity: 'critical',
      description: 'Hardcoded credentials found',
      fix: 'Use environment variables or secure credential management'
    }
  ]
};

export function analyzeSecurity(projectPath) {
  const vulnerabilities = [];
  
  // Analyze code files for security issues
  const codeFiles = findCodeFiles(projectPath);
  
  codeFiles.forEach(file => {
    const language = detectLanguageFromFile(file);
    const patterns = securityPatterns[language] || [];
    const code = fs.readFileSync(file, 'utf-8');
    
    patterns.forEach(pattern => {
      const matches = code.matchAll(pattern.pattern);
      
      for (const match of matches) {
        vulnerabilities.push({
          type: pattern.name,
          severity: pattern.severity,
          description: pattern.description,
          fix: pattern.fix,
          file: file,
          line: getLineNumber(code, match.index),
          code: match[0]
        });
      }
    });
  });
  
  // Analyze dependencies for known vulnerabilities
  const dependencyVulns = analyzeDependencies(projectPath);
  vulnerabilities.push(...dependencyVulns);
  
  // Analyze configuration files
  const configVulns = analyzeConfigFiles(projectPath);
  vulnerabilities.push(...configVulns);
  
  return vulnerabilities;
}

function analyzeDependencies(projectPath) {
  const vulnerabilities = [];
  
  // Check package.json for known vulnerable packages
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // This is a simplified check - in production, you'd use npm audit or similar
    const knownVulnerablePackages = [
      'lodash', // Example - check for specific vulnerable versions
      'moment',
      'jquery'
    ];
    
    knownVulnerablePackages.forEach(pkg => {
      if (deps[pkg]) {
        vulnerabilities.push({
          type: 'Vulnerable Dependency',
          severity: 'high',
          description: `Potentially vulnerable package: ${pkg}`,
          fix: `Update ${pkg} to latest version or check npm audit`,
          file: 'package.json',
          line: 1,
          package: pkg,
          version: deps[pkg]
        });
      }
    });
  }
  
  return vulnerabilities;
}

function analyzeConfigFiles(projectPath) {
  const vulnerabilities = [];
  
  // Check for common security misconfigurations
  const configFiles = [
    '.env',
    'config.json',
    'webpack.config.js',
    'next.config.js'
  ];
  
  configFiles.forEach(configFile => {
    const configPath = path.join(projectPath, configFile);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      
      // Check for exposed secrets
      if (content.includes('password') || content.includes('secret')) {
        vulnerabilities.push({
          type: 'Exposed Secrets',
          severity: 'critical',
          description: `Potential secrets in ${configFile}`,
          fix: 'Move secrets to environment variables or secure storage',
          file: configFile,
          line: 1
        });
      }
      
      // Check for insecure configurations
      if (content.includes('NODE_ENV=development') && content.includes('debug=true')) {
        vulnerabilities.push({
          type: 'Debug Mode Enabled',
          severity: 'medium',
          description: 'Debug mode enabled in production config',
          fix: 'Disable debug mode in production',
          file: configFile,
          line: 1
        });
      }
    }
  });
  
  return vulnerabilities;
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

export function generateSecurityReport(vulnerabilities) {
  if (vulnerabilities.length === 0) {
    return '✅ No security vulnerabilities found.';
  }
  
  // Group by severity
  const critical = vulnerabilities.filter(v => v.severity === 'critical');
  const high = vulnerabilities.filter(v => v.severity === 'high');
  const medium = vulnerabilities.filter(v => v.severity === 'medium');
  const low = vulnerabilities.filter(v => v.severity === 'low');
  
  let report = `🔒 **Security Analysis Found ${vulnerabilities.length} Issues**\n\n`;
  
  if (critical.length > 0) {
    report += `🚨 **CRITICAL (${critical.length})**\n`;
    critical.forEach(v => {
      report += `- ${v.type}: ${v.description}\n  File: ${v.file}:${v.line}\n  Fix: ${v.fix}\n\n`;
    });
  }
  
  if (high.length > 0) {
    report += `⚠️ **HIGH (${high.length})**\n`;
    high.forEach(v => {
      report += `- ${v.type}: ${v.description}\n  File: ${v.file}:${v.line}\n  Fix: ${v.fix}\n\n`;
    });
  }
  
  if (medium.length > 0) {
    report += `⚠️ **MEDIUM (${medium.length})**\n`;
    medium.forEach(v => {
      report += `- ${v.type}: ${v.description}\n  File: ${v.file}:${v.line}\n  Fix: ${v.fix}\n\n`;
    });
  }
  
  return report;
}

export function suggestSecurityFixes(vulnerabilities) {
  const fixes = [];
  
  vulnerabilities.forEach(vuln => {
    switch (vuln.type) {
      case 'SQL Injection':
        fixes.push({
          type: 'SQL Injection Fix',
          description: 'Replace string concatenation with parameterized queries',
          steps: [
            'Identify the vulnerable query',
            'Replace string concatenation with placeholders',
            'Use prepared statements or parameterized queries',
            'Validate and sanitize all inputs'
          ],
          example: {
            before: 'query("SELECT * FROM users WHERE id = " + userId)',
            after: 'query("SELECT * FROM users WHERE id = ?", [userId])'
          }
        });
        break;
        
      case 'XSS Vulnerability':
        fixes.push({
          type: 'XSS Fix',
          description: 'Sanitize user input before rendering',
          steps: [
            'Identify where user input is rendered',
            'Use textContent instead of innerHTML',
            'Sanitize input with DOMPurify or similar',
            'Implement Content Security Policy (CSP)'
          ],
          example: {
            before: 'element.innerHTML = userInput',
            after: 'element.textContent = userInput'
          }
        });
        break;
        
      case 'Hardcoded Credentials':
        fixes.push({
          type: 'Credential Management Fix',
          description: 'Move credentials to environment variables',
          steps: [
            'Identify hardcoded credentials',
            'Create environment variables',
            'Update code to use process.env',
            'Add .env to .gitignore',
            'Document required environment variables'
          ],
          example: {
            before: 'const password = "secret123"',
            after: 'const password = process.env.DB_PASSWORD'
          }
        });
        break;
    }
  });
  
  return fixes;
}
