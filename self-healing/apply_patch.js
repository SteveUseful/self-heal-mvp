import fs from 'fs';
import chalk from 'chalk';
import path from 'path'; // Added missing import

export function applyPatch(filePath, llmResponse) {
  console.log(chalk.blue('🔧 Processing LLM response for patch application...'));
  
  // Try multiple patterns to extract code from LLM response
  let extractedCode = null;
  
  // Pattern 1: Standard code block with language identifier
  const codeBlockMatch = llmResponse.match(/```(?:js|javascript|ts|typescript|py|python|java|go)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    extractedCode = codeBlockMatch[1].trim();
    console.log(chalk.green('✅ Extracted code from standard code block'));
  }
  
  // Pattern 2: Code block without language identifier
  if (!extractedCode) {
    const simpleCodeBlock = llmResponse.match(/```\s*\n([\s\S]*?)\n```/);
    if (simpleCodeBlock) {
      extractedCode = simpleCodeBlock[1].trim();
      console.log(chalk.green('✅ Extracted code from simple code block'));
    }
  }
  
  // Pattern 3: If the response looks like a complete file, use it directly
  if (!extractedCode && (llmResponse.includes('function') || llmResponse.includes('class') || llmResponse.includes('import') || llmResponse.includes('export'))) {
    // Check if it looks like a complete file
    const lines = llmResponse.trim().split('\n');
    if (lines.length > 5) { // Reasonable file size
      extractedCode = llmResponse.trim();
      console.log(chalk.green('✅ Using response as complete file'));
    }
  }
  
  if (!extractedCode) {
    console.log(chalk.red('❌ No code block found in LLM response'));
    console.log(chalk.yellow('LLM Response:'), llmResponse);
    return false;
  }
  
  // Determine if this is a complete file or just a function
  const isCompleteFile = extractedCode.includes('module.exports') || 
                        extractedCode.includes('export') ||
                        extractedCode.includes('import') ||
                        extractedCode.includes('class') ||
                        (extractedCode.split('\n').length > 20);
  
  if (isCompleteFile) {
    // Write the complete file
    fs.writeFileSync(filePath, extractedCode, 'utf-8');
    console.log(chalk.green(`✅ Applied complete file patch to ${filePath}`));
    return true;
  }
  
  // Otherwise, try to extract just the function body and create a complete file
  const functionMatch = extractedCode.match(/function\s+\w+\s*\([^)]*\)\s*\{([\s\S]*)\}/);
  if (functionMatch) {
    const functionBody = functionMatch[1].trim();
    
    // Create the complete file content
    const completeCode = `// ${path.basename(filePath)}
function sumArray(a) {
  ${functionBody}
}

module.exports = { sumArray };

// a small express or script app isn't necessary — tests will trigger the bug
`;
    
    fs.writeFileSync(filePath, completeCode, 'utf-8');
    console.log(chalk.green(`✅ Applied function body patch to ${filePath}`));
    return true;
  }
  
  // If we can't parse it as a function, try to create a minimal working file
  const minimalCode = `// ${path.basename(filePath)}
${extractedCode}

module.exports = { sumArray };
`;
  
  fs.writeFileSync(filePath, minimalCode, 'utf-8');
  console.log(chalk.green(`✅ Applied minimal patch to ${filePath}`));
  return true;
}
