import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// Store original buggy code
const originalCode = `// demo-app/index.js
function sumArray(a) {
  // bug: uses .reduce incorrectly if array is empty (throws)
  return a.reduce((s, n) => s + n, 0) + 1; // the +1 is intentional "business logic bug"
}

// New functions with different types of bugs
function findMax(arr) {
  // Bug: doesn't handle empty arrays
  return Math.max(...arr);
}

function validateEmail(email) {
  // Bug: overly simple regex that misses edge cases
  const regex = /^[^@]+@[^@]+\\.[^@]+$/;
  return regex.test(email);
}

function asyncOperation(data) {
  // Bug: missing error handling
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data * 2);
    }, 100);
  });
}

function processUser(user) {
  // Bug: potential null reference
  return {
    name: user.name.toUpperCase(),
    age: user.age,
    email: user.email.toLowerCase()
  };
}

module.exports = { 
  sumArray, 
  findMax, 
  validateEmail, 
  asyncOperation, 
  processUser 
};`;

// Language detection and support
const supportedLanguages = {
  'js': 'javascript',
  'javascript': 'javascript',
  'ts': 'typescript',
  'typescript': 'typescript',
  'py': 'python',
  'python': 'python',
  'java': 'java',
  'go': 'go'
};

function detectLanguage(filename) {
  const ext = path.extname(filename).toLowerCase().substring(1);
  return supportedLanguages[ext] || 'javascript';
}

// API Routes
app.get('/api/run-tests', async (req, res) => {
  try {
    const demoAppPath = path.resolve(__dirname, '../demo-app');
    
    // Read current code
    const currentCode = fs.readFileSync(path.join(demoAppPath, 'index.js'), 'utf-8');
    
    // Run tests
    const result = await execa('npm', ['test'], { 
      cwd: demoAppPath,
      stdio: 'pipe'
    });
    
    res.json({
      success: true,
      code: currentCode,
      output: result.stdout,
      failures: 0
    });
  } catch (error) {
    const demoAppPath = path.resolve(__dirname, '../demo-app');
    const currentCode = fs.readFileSync(path.join(demoAppPath, 'index.js'), 'utf-8');
    
    res.json({
      success: false,
      code: currentCode,
      output: error.stdout || error.stderr,
      failures: 1
    });
  }
});

app.post('/api/heal', async (req, res) => {
  try {
    const demoAppPath = path.resolve(__dirname, '../demo-app');
    const selfHealingPath = path.resolve(__dirname, '../self-healing');
    
    // Run the self-healing agent
    const result = await execa('node', ['agent.js'], { 
      cwd: selfHealingPath,
      stdio: 'pipe',
      env: { ...process.env, LLM_MODE: 'ollama' }
    });
    
    // Read the fixed code
    const fixedCode = fs.readFileSync(path.join(demoAppPath, 'index.js'), 'utf-8');
    
    res.json({
      success: true,
      fixedCode: fixedCode,
      output: result.stdout
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      output: error.stdout || error.stderr
    });
  }
});

app.post('/api/reset', (req, res) => {
  try {
    const demoAppPath = path.resolve(__dirname, '../demo-app');
    fs.writeFileSync(path.join(demoAppPath, 'index.js'), originalCode, 'utf-8');
    
    res.json({
      success: true,
      code: originalCode
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// New API endpoints for enhanced functionality
app.post('/api/analyze', async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;
    
    // Create temporary file for analysis
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `temp.${language === 'javascript' ? 'js' : language}`);
    fs.writeFileSync(tempFile, code, 'utf-8');
    
    // Run comprehensive analysis
    const selfHealingPath = path.resolve(__dirname, '../self-healing');
    const result = await execa('node', ['agent.js'], { 
      cwd: selfHealingPath,
      stdio: 'pipe',
      env: { 
        ...process.env, 
        LLM_MODE: 'ollama',
        TEMP_FILE: tempFile,
        ANALYSIS_ONLY: 'true'
      }
    });
    
    // Clean up
    fs.unlinkSync(tempFile);
    
    res.json({
      success: true,
      analysis: result.stdout,
      language: language
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      analysis: error.stdout || error.stderr
    });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const language = detectLanguage(req.file.originalname);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      code: fileContent,
      language: language,
      filename: req.file.originalname
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/languages', (req, res) => {
  res.json({
    languages: Object.values(supportedLanguages),
    extensions: Object.keys(supportedLanguages)
  });
});

app.get('/api/demo-code/:language', (req, res) => {
  const { language } = req.params;
  
  const demoCodes = {
    javascript: `// JavaScript Demo with Common Bugs
function calculateTotal(items) {
  // Bug: doesn't handle null/undefined items
  return items.reduce((sum, item) => sum + item.price, 0);
}

function validateUser(user) {
  // Bug: potential null reference
  return user.name.length > 0 && user.email.includes('@');
}

async function fetchData(url) {
  // Bug: missing error handling
  const response = await fetch(url);
  return response.json();
}

module.exports = { calculateTotal, validateUser, fetchData };`,
    
    python: `# Python Demo with Common Bugs
def calculate_average(numbers):
    # Bug: doesn't handle empty list
    return sum(numbers) / len(numbers)

def process_user(user):
    # Bug: potential attribute error
    return user.name.upper() + " - " + user.email.lower()

def read_file(filename):
    # Bug: unsafe file operation
    file = open(filename, 'r')
    content = file.read()
    return content

# Test cases
if __name__ == "__main__":
    print(calculate_average([1, 2, 3, 4, 5]))`,
    
    java: `// Java Demo with Common Bugs
public class Calculator {
    public static int divide(int a, int b) {
        // Bug: doesn't handle division by zero
        return a / b;
    }
    
    public static String processName(String name) {
        // Bug: potential null pointer exception
        return name.toUpperCase();
    }
    
    public static void main(String[] args) {
        System.out.println(divide(10, 2));
        System.out.println(processName("john"));
    }
}`
  };
  
  res.json({
    success: true,
    code: demoCodes[language] || demoCodes.javascript,
    language: language
  });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
  
  socket.on('code-change', (data) => {
    // Broadcast code changes to other clients (for collaborative features)
    socket.broadcast.emit('code-updated', data);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Self-Healing Dashboard running on http://localhost:${PORT}`);
  console.log(`📁 File uploads enabled`);
  console.log(`🌍 Supported languages: ${Object.values(supportedLanguages).join(', ')}`);
});
