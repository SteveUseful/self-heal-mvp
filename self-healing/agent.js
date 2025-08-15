import { execa } from 'execa';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { buildFixPrompt } from './promptTemplates.js';
import { callLLM } from './call_llm.js';
import { applyPatch } from './apply_patch.js';
import { confirmPatch } from './cli.js';
import { detectLanguage, getTestRunner, buildLanguageSpecificPrompt } from './languageSupport.js';
import { analyzeProjectForBugs, generateBugReport } from './staticAnalysis.js';
import { analyzeArchitecture, generateArchitecturalReport, suggestRefactoring } from './architecturalAnalysis.js';
import { analyzeSecurity, generateSecurityReport, suggestSecurityFixes } from './securityAnalysis.js';

const DEMO_APP_PATH = path.resolve('../demo-app');
const TARGET_FILE = path.join(DEMO_APP_PATH, 'index.js');

async function runTests() {
  try {
    // Detect language and get appropriate test runner
    const language = detectLanguage(TARGET_FILE);
    const testRunner = getTestRunner(language, DEMO_APP_PATH) || 'npm test';
    
    console.log(`Detected language: ${language}`);
    console.log(`Using test runner: ${testRunner}`);
    
    const [command, ...args] = testRunner.split(' ');
    await execa(command, args, { cwd: DEMO_APP_PATH });
    return null; // No failures
  } catch (err) {
    return err.stdout || err.stderr;
  }
}

async function main() {
  console.log(chalk.cyan('🚀 Starting Advanced Self-Healing Agent...'));

  // 1. Run tests first
  const testOutput = await runTests();
  
  // 2. Static analysis for bugs without test failures
  console.log(chalk.blue('🔍 Running static analysis...'));
  const staticBugs = analyzeProjectForBugs(DEMO_APP_PATH);
  
  // 3. Architectural analysis
  console.log(chalk.blue('🏗️ Analyzing architecture...'));
  const architecturalIssues = analyzeArchitecture(DEMO_APP_PATH);
  
  // 4. Security analysis
  console.log(chalk.blue('🔒 Analyzing security...'));
  const securityVulns = analyzeSecurity(DEMO_APP_PATH);

  // Generate comprehensive reports
  console.log(chalk.yellow('\n📊 COMPREHENSIVE ANALYSIS REPORT'));
  console.log('='.repeat(50));
  
  if (testOutput) {
    console.log(chalk.red('❌ Test Failures Detected'));
    console.log('Sending to LLM for fixes...');
    
    const codeContent = fs.readFileSync(TARGET_FILE, 'utf-8');
    const language = detectLanguage(TARGET_FILE);
    const prompt = buildLanguageSpecificPrompt(language, codeContent, testOutput);
    const newCode = await callLLM(prompt);

    if (await confirmPatch(newCode)) {
      const patchApplied = applyPatch(TARGET_FILE, newCode);
      if (!patchApplied) {
        console.log(chalk.red('❌ Failed to apply patch'));
        return;
      }
      console.log(chalk.blue('🔄 Re-running tests...'));
      const result = await runTests();

      if (!result) {
        console.log(chalk.green('🎉 All tests now pass!'));
      } else {
        console.log(chalk.red('❌ Tests still failing:\n'), result);
      }
    } else {
      console.log(chalk.red('🚫 Patch rejected by user.'));
    }
  } else {
    console.log(chalk.green('✅ All tests are passing.'));
  }

  // Static analysis report
  if (staticBugs.length > 0) {
    console.log(chalk.yellow('\n🐛 STATIC ANALYSIS'));
    console.log(generateBugReport(staticBugs));
  } else {
    console.log(chalk.green('✅ No static analysis issues found.'));
  }

  // Architectural analysis report
  if (architecturalIssues.length > 0) {
    console.log(chalk.yellow('\n🏗️ ARCHITECTURAL ANALYSIS'));
    console.log(generateArchitecturalReport(architecturalIssues));
    
    const refactoringSuggestions = suggestRefactoring(architecturalIssues);
    if (refactoringSuggestions.length > 0) {
      console.log(chalk.blue('\n🛠️ REFACTORING SUGGESTIONS:'));
      refactoringSuggestions.forEach(suggestion => {
        console.log(`\n${suggestion.type}: ${suggestion.description}`);
        suggestion.steps.forEach((step, i) => {
          console.log(`  ${i + 1}. ${step}`);
        });
      });
    }
  } else {
    console.log(chalk.green('✅ No architectural issues found.'));
  }

  // Security analysis report
  if (securityVulns.length > 0) {
    console.log(chalk.yellow('\n🔒 SECURITY ANALYSIS'));
    console.log(generateSecurityReport(securityVulns));
    
    const securityFixes = suggestSecurityFixes(securityVulns);
    if (securityFixes.length > 0) {
      console.log(chalk.red('\n🛡️ SECURITY FIXES NEEDED:'));
      securityFixes.forEach(fix => {
        console.log(`\n${fix.type}: ${fix.description}`);
        fix.steps.forEach((step, i) => {
          console.log(`  ${i + 1}. ${step}`);
        });
        if (fix.example) {
          console.log(`\n  Example:`);
          console.log(`    Before: ${fix.example.before}`);
          console.log(`    After:  ${fix.example.after}`);
        }
      });
    }
  } else {
    console.log(chalk.green('✅ No security vulnerabilities found.'));
  }

  // Summary
  const totalIssues = (testOutput ? 1 : 0) + staticBugs.length + architecturalIssues.length + securityVulns.length;
  console.log(chalk.cyan(`\n📈 SUMMARY: Found ${totalIssues} total issues to address`));
}

main();
