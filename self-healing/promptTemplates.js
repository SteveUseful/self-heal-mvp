export function buildFixPrompt(testOutput, codeContent) {
  return `
You are an AI that fixes JavaScript code to make failing tests pass.

Here is the current code:
\`\`\`js
${codeContent}
\`\`\`

Here is the failing test output:
\`\`\`
${testOutput}
\`\`\`

The tests expect:
1. sumArray([1,2,3]) should return 6 (not 7)
2. sumArray([]) should return 0 (not 1)

The bugs are:
1. The function adds +1 to the result, but tests expect the actual sum
2. Empty arrays should return 0, not 1

Your task:
Return ONLY the fixed function body (the code inside the function), nothing else.
Remove the +1 and handle empty arrays properly.

Example response format:
\`\`\`js
return a.reduce((s, n) => s + n, 0);
\`\`\`
`;
}
