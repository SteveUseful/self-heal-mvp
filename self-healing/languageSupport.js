// self-healing/languageSupport.js
import fs from 'fs';
import path from 'path';

// Language-specific configurations
const languageConfigs = {
  javascript: {
    extensions: ['.js', '.jsx', '.mjs'],
    testRunners: {
      jest: 'npm test',
      mocha: 'npm run test',
      vitest: 'npm run test'
    },
    commonBugs: [
      'null reference',
      'undefined variable',
      'async/await error',
      'promise rejection',
      'type coercion'
    ]
  },
  
  typescript: {
    extensions: ['.ts', '.tsx'],
    testRunners: {
      jest: 'npm test',
      mocha: 'npm run test',
      vitest: 'npm run test'
    },
    commonBugs: [
      'type error',
      'interface mismatch',
      'null reference',
      'async/await error'
    ]
  },
  
  python: {
    extensions: ['.py'],
    testRunners: {
      pytest: 'pytest',
      unittest: 'python -m unittest',
      nose: 'nosetests'
    },
    commonBugs: [
      'indentation error',
      'import error',
      'type error',
      'attribute error',
      'key error'
    ]
  },
  
  java: {
    extensions: ['.java'],
    testRunners: {
      junit: 'mvn test',
      gradle: './gradlew test'
    },
    commonBugs: [
      'null pointer exception',
      'class not found',
      'compilation error',
      'type mismatch'
    ]
  },
  
  go: {
    extensions: ['.go'],
    testRunners: {
      goTest: 'go test ./...',
      goTestVerbose: 'go test -v ./...'
    },
    commonBugs: [
      'nil pointer dereference',
      'import error',
      'type error',
      'compilation error'
    ]
  }
};

export function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  for (const [language, config] of Object.entries(languageConfigs)) {
    if (config.extensions.includes(ext)) {
      return language;
    }
  }
  
  return 'unknown';
}

export function getTestRunner(language, projectPath) {
  const config = languageConfigs[language];
  if (!config) return null;
  
  // Check for common test runner files
  const packageJsonPath = path.join(projectPath, 'package.json');
  const pomXmlPath = path.join(projectPath, 'pom.xml');
  const buildGradlePath = path.join(projectPath, 'build.gradle');
  const goModPath = path.join(projectPath, 'go.mod');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const scripts = packageJson.scripts || {};
    
    if (scripts.test) {
      return 'npm test';
    }
  }
  
  if (fs.existsSync(pomXmlPath)) {
    return 'mvn test';
  }
  
  if (fs.existsSync(buildGradlePath)) {
    return './gradlew test';
  }
  
  if (fs.existsSync(goModPath)) {
    return 'go test ./...';
  }
  
  // Default runners
  return config.testRunners[Object.keys(config.testRunners)[0]];
}

export function buildLanguageSpecificPrompt(language, code, testOutput) {
  const config = languageConfigs[language];
  if (!config) {
    return buildGenericPrompt(code, testOutput);
  }
  
  const commonBugs = config.commonBugs.join(', ');
  
  return `
You are an expert ${language} developer. Analyze the following code and fix the bugs.

**Language:** ${language}
**Common ${language} bugs to check for:** ${commonBugs}

**Code:**
\`\`\`${language}
${code}
\`\`\`

**Test Output:**
\`\`\`
${testOutput}
\`\`\`

**Instructions:**
1. Identify the specific ${language} bugs in the code
2. Provide a minimal fix that addresses the test failures
3. Return ONLY the corrected code block
4. Ensure the fix follows ${language} best practices

**Response format:**
\`\`\`${language}
// Your fixed code here
\`\`\`
`;
}

function buildGenericPrompt(code, testOutput) {
  return `
You are an expert programmer. Analyze the following code and fix the bugs.

**Code:**
\`\`\`
${code}
\`\`\`

**Test Output:**
\`\`\`
${testOutput}
\`\`\`

**Instructions:**
1. Identify the bugs in the code
2. Provide a minimal fix that addresses the test failures
3. Return ONLY the corrected code block

**Response format:**
\`\`\`
// Your fixed code here
\`\`\`
`;
}

export function getLanguageExtensions(language) {
  return languageConfigs[language]?.extensions || [];
}

export function getSupportedLanguages() {
  return Object.keys(languageConfigs);
}
