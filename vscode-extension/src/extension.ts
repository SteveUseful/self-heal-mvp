import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Self-Healing Code extension is now active!');

    let detectBugs = vscode.commands.registerCommand('self-healing.detectBugs', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const code = document.getText();
        
        vscode.window.showInformationMessage('🔍 Detecting bugs in your code...');
        
        try {
            const bugs = await detectBugsInCode(code, document.languageId);
            if (bugs.length > 0) {
                showBugReport(bugs);
            } else {
                vscode.window.showInformationMessage('✅ No bugs detected!');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error detecting bugs: ${error}`);
        }
    });

    let autoFix = vscode.commands.registerCommand('self-healing.autoFix', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const code = document.getText();
        
        vscode.window.showInformationMessage('🛠️ Analyzing and fixing bugs...');
        
        try {
            const fixedCode = await autoFixCode(code, document.languageId);
            if (fixedCode && fixedCode !== code) {
                await applyFix(editor, fixedCode);
                vscode.window.showInformationMessage('✅ Code fixed successfully!');
            } else {
                vscode.window.showInformationMessage('No fixes needed or no changes made');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error fixing code: ${error}`);
        }
    });

    context.subscriptions.push(detectBugs, autoFix);
}

async function detectBugsInCode(code: string, language: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        // For now, we'll use a simple heuristic approach
        // In a real implementation, this would call your self-healing backend
        const bugs = [];
        
        // Simple bug detection patterns
        if (language === 'javascript' || language === 'typescript') {
            // Check for common JavaScript bugs
            if (code.includes('Math.max(...arr)') && !code.includes('arr.length')) {
                bugs.push({
                    type: 'Empty Array Error',
                    description: 'Math.max() with spread operator may fail on empty arrays',
                    line: findLineNumber(code, 'Math.max(...'),
                    severity: 'warning'
                });
            }
            
            if (code.includes('.reduce(') && code.includes('+ 1')) {
                bugs.push({
                    type: 'Logic Error',
                    description: 'Unexpected +1 in reduce operation',
                    line: findLineNumber(code, '+ 1'),
                    severity: 'error'
                });
            }
            
            if (code.includes('.toUpperCase()') && !code.includes('?.') && !code.includes('&&')) {
                bugs.push({
                    type: 'Null Reference',
                    description: 'Potential null reference when calling toUpperCase()',
                    line: findLineNumber(code, '.toUpperCase()'),
                    severity: 'warning'
                });
            }
        }
        
        resolve(bugs);
    });
}

async function autoFixCode(code: string, language: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // For now, we'll apply simple fixes
        // In a real implementation, this would call your LLM backend
        let fixedCode = code;
        
        if (language === 'javascript' || language === 'typescript') {
            // Fix Math.max with empty array
            fixedCode = fixedCode.replace(
                /Math\.max\(\.\.\.(\w+)\)/g,
                'Math.max(...$1, -Infinity)'
            );
            
            // Fix reduce with +1
            fixedCode = fixedCode.replace(
                /\.reduce\([^)]+\) \+ 1/g,
                '.reduce((s, n) => s + n, 0)'
            );
            
            // Fix potential null references
            fixedCode = fixedCode.replace(
                /(\w+)\.toUpperCase\(\)/g,
                '$1?.toUpperCase() || $1'
            );
        }
        
        resolve(fixedCode);
    });
}

async function applyFix(editor: vscode.TextEditor, newCode: string) {
    const document = editor.document;
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
    );
    
    await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, newCode);
    });
}

function findLineNumber(code: string, searchText: string): number {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchText)) {
            return i + 1;
        }
    }
    return 1;
}

function showBugReport(bugs: any[]) {
    const panel = vscode.window.createWebviewPanel(
        'bugReport',
        'Bug Detection Report',
        vscode.ViewColumn.One,
        {}
    );
    
    const bugList = bugs.map(bug => `
        <div class="bug-item ${bug.severity}">
            <h3>${bug.type}</h3>
            <p>${bug.description}</p>
            <small>Line: ${bug.line}</small>
        </div>
    `).join('');
    
    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .bug-item { margin: 10px 0; padding: 15px; border-radius: 5px; }
                .bug-item.error { background: #fee; border-left: 4px solid #f56565; }
                .bug-item.warning { background: #fef5e7; border-left: 4px solid #ed8936; }
                h3 { margin: 0 0 10px 0; }
                p { margin: 5px 0; }
                small { color: #666; }
            </style>
        </head>
        <body>
            <h1>🐛 Bug Detection Report</h1>
            <p>Found ${bugs.length} potential issues:</p>
            ${bugList}
        </body>
        </html>
    `;
}

export function deactivate() {}
