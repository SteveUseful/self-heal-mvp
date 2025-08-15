# Self-Healing Code Platform - Web Dashboard

A comprehensive web interface for the AI-powered self-healing code platform that allows users to analyze, detect, and automatically fix bugs in their code.

## 🚀 Features

### Core Functionality
- **Multi-Language Support**: JavaScript, TypeScript, Python, Java, Go
- **File Upload**: Upload your own code files for analysis
- **Code Editor**: Built-in syntax-highlighted code editor
- **Real-time Analysis**: Live feedback and analysis results
- **Auto-Fix**: AI-powered bug detection and automatic fixes

### Analysis Types
- **Static Analysis**: Find potential bugs without running tests
- **Security Analysis**: Detect security vulnerabilities
- **Architectural Analysis**: Identify code structure issues
- **Test Analysis**: Run tests and fix failures

### User Experience
- **Modern UI**: Beautiful, responsive design
- **Real-time Logs**: Live updates during analysis
- **Tabbed Interface**: Organized view of different analysis types
- **Demo Code**: Pre-loaded examples for each language

## 🛠️ Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Ollama (for local LLM) or OpenAI API key

### Installation

1. **Install Dependencies**
   ```bash
   cd web-dashboard
   npm install
   ```

2. **Configure LLM**
   
   **Option A: Ollama (Local)**
   ```bash
   # Install Ollama from https://ollama.ai
   ollama pull codellama
   export LLM_MODE=ollama
   ```
   
   **Option B: OpenAI**
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   export LLM_MODE=openai
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the Dashboard**
   Open http://localhost:3000 in your browser

## 🌐 Deployment

### Local Development
```bash
npm run dev  # Auto-restart on file changes
```

### Production Deployment

#### Option 1: Heroku
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set LLM_MODE=openai
heroku config:set OPENAI_API_KEY=your_api_key

# Deploy
git push heroku main
```

#### Option 2: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Option 3: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

#### Option 4: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t self-healing-dashboard .
docker run -p 3000:3000 self-healing-dashboard
```

## 📱 Usage

### Getting Started
1. **Choose Language**: Select your programming language from the dropdown
2. **Load Code**: Either upload a file or load demo code
3. **Analyze**: Click "Analyze Code" to run comprehensive analysis
4. **Review Results**: Check the analysis tabs for detailed results
5. **Auto-Fix**: Click "Auto-Fix" to apply AI-powered fixes
6. **Test**: Run tests to verify the fixes work

### Supported File Types
- `.js` - JavaScript files
- `.ts` - TypeScript files  
- `.py` - Python files
- `.java` - Java files
- `.go` - Go files

### Analysis Results
- **Static Analysis**: Potential bugs, null references, memory leaks
- **Security Analysis**: SQL injection, XSS, hardcoded credentials
- **Architectural Analysis**: Code structure, anti-patterns, refactoring suggestions
- **Test Results**: Test execution and failure analysis

## 🔧 Configuration

### Environment Variables
```bash
# LLM Configuration
LLM_MODE=ollama|openai
OPENAI_API_KEY=your_api_key  # Required if using OpenAI

# Server Configuration  
PORT=3000  # Default port
NODE_ENV=production|development

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB default
```

### Customization
- **Themes**: Modify CSS variables in `index.html`
- **Languages**: Add new languages in `server.js`
- **Analysis**: Extend analysis types in the self-healing backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: Report bugs on GitHub
- **Documentation**: Check the main project README
- **Community**: Join our Discord/Telegram for help

## 🎯 Roadmap

- [ ] User authentication and accounts
- [ ] Project management and history
- [ ] Team collaboration features
- [ ] Advanced code editor features
- [ ] Integration with Git repositories
- [ ] CI/CD pipeline integration
- [ ] Mobile app version
- [ ] API for third-party integrations
