class BytestormApp {
  constructor() {
    this.editor = null;
    this.currentFile = 'index.html';
    this.STORAGE_KEY = 'bytestorm:files';
    this.files = this.loadFilesFromStorage() || this.getDefaultFiles();
    this.terminalHistory = [];
    this.commandHistory = [];
    this.historyIndex = -1;
    
    this.init();
  }

  async init() {
    this.setupTerminal();
    await this.setupEditor();
    this.setupFileSelector();
    this.setupPreview();
    this.setupEventListeners();
    this.showWelcomeMessage();
  }

  setupTerminal() {
    this.terminalOutput = document.getElementById('terminal-output');
    this.terminalInput = document.getElementById('terminal-input');
    
    this.terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleCommand(this.terminalInput.value.trim());
        this.terminalInput.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      }
    });
  }

  async setupEditor() {
    return new Promise((resolve) => {
      require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
      require(['vs/editor/editor.main'], () => {
        // Get the current theme to set the correct editor theme
        const currentTheme = localStorage.getItem('bytestorm-theme') || 'dark';
        const editorTheme = currentTheme === 'light' ? 'vs' : 'vs-dark';
        
        this.editor = monaco.editor.create(document.getElementById('editor-container'), {
          value: this.files[this.currentFile],
          language: this.getLanguageFromFile(this.currentFile),
          theme: editorTheme,
          fontSize: 13,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on'
        });

        this.editor.onDidChangeModelContent(() => {
          this.files[this.currentFile] = this.editor.getValue();
          this.saveFilesToStorage();
          this.updatePreview();
        });

        resolve();
      });
    });
  }

  setupFileSelector() {
    this.updateFileSelector();
    this.setupFileBrowser();
  }

  setupPreview() {
    this.previewFrame = document.getElementById('preview-frame');
    this.updatePreview();

    document.getElementById('refresh-preview').addEventListener('click', () => {
      this.updatePreview();
    });
  }

  setupEventListeners() {
    const snapshotBtn = document.getElementById('snapshot-btn');
    // Disabled in Local Mode; keep tooltip via title attribute in HTML
    snapshotBtn.setAttribute('disabled', 'disabled');

    // Theme toggle functionality
    this.setupThemeToggle();

    // Panel toggle functionality
    document.querySelectorAll('.panel-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const panel = e.target.closest('.panel');
        panel.classList.toggle('collapsed');
        e.target.textContent = panel.classList.contains('collapsed') ? '+' : '−';
      });
    });
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('bytestorm-theme') || 'dark';
    this.setTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme);
    });
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bytestorm-theme', theme);
    
    const themeIcon = document.querySelector('.theme-icon');
    const themeToggle = document.getElementById('theme-toggle');
    
    if (theme === 'light') {
      themeIcon.textContent = '🌞';
      themeToggle.title = 'Switch to dark mode';
    } else {
      themeIcon.textContent = '🌙';
      themeToggle.title = 'Switch to light mode';
    }

    // Update Monaco editor theme
    if (this.editor) {
      monaco.editor.setTheme(theme === 'light' ? 'vs' : 'vs-dark');
    }
  }

  getLanguageFromFile(fileName) {
    const ext = fileName.split('.').pop();
    switch (ext) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'py': return 'python';
      case 'json': return 'json';
      default: return 'plaintext';
    }
  }

  switchToFile(fileName) {
    // Save current file
    if (this.editor) {
      this.files[this.currentFile] = this.editor.getValue();
      this.saveFilesToStorage();
    }

    // Update UI
    this.currentFile = fileName;
    this.updateFileSelector();

    // Switch editor content
    if (this.editor) {
      const model = monaco.editor.createModel(
        this.files[fileName] ?? '',
        this.getLanguageFromFile(fileName)
      );
      this.editor.setModel(model);
    }

    this.updatePreview();
  }

  updatePreview() {
    const htmlContent = this.files['index.html'] ?? '';
    const cssContent = this.files['style.css'] ?? '';
    const jsContent = this.files['script.js'] ?? '';

    // Inject CSS and JS into HTML
    const fullHTML = htmlContent
      .replace('</head>', `<style>${cssContent}</style></head>`)
      .replace('</body>', `<script>${jsContent}</script></body>`);

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.previewFrame.src = url;

    // Clean up previous URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  handleCommand(command) {
    if (!command) return;

    this.commandHistory.push(command);
    this.historyIndex = this.commandHistory.length;

    this.addToTerminal(`$ ${command}`, 'terminal-command');

    // Parse command
    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
      case 'help':
        this.showHelp();
        break;
      case 'ls':
        this.listFiles();
        break;
      case 'pwd':
        this.comingSoon('environment commands (pwd)');
        break;
      case 'whoami':
        this.comingSoon('environment commands (whoami)');
        break;
      case 'echo':
        this.addToTerminal(args.join(' '), 'terminal-output-text');
        break;
      case 'touch':
        if (!args[0]) {
          this.addToTerminal('touch: missing file operand', 'terminal-error');
        } else {
          this.createFile(args[0]);
          this.addToTerminal(`created: ${args[0]}`, 'terminal-success');
        }
        break;
      case 'python':
        this.comingSoon('Python execution');
        break;
      case 'node':
        this.comingSoon('Node.js execution');
        break;
      case 'npm':
        this.comingSoon('npm/package management');
        break;
      case 'clear':
        this.clearTerminal();
        break;
      case 'cat':
        this.catFile(args);
        break;
      case 'snapshot':
        this.comingSoon('snapshots');
        break;
      default:
        this.addToTerminal(`Command '${cmd}' not found. Type 'help' for available commands.`, 'terminal-error');
    }
  }

  navigateHistory(direction) {
    if (this.commandHistory.length === 0) return;

    this.historyIndex += direction;
    this.historyIndex = Math.max(-1, Math.min(this.historyIndex, this.commandHistory.length - 1));

    if (this.historyIndex === -1) {
      this.terminalInput.value = '';
    } else {
      this.terminalInput.value = this.commandHistory[this.historyIndex];
    }
  }

  addToTerminal(text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    this.terminalOutput.appendChild(line);
    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
  }

  clearTerminal() {
    this.terminalOutput.innerHTML = '';
  }

  showHelp() {
    const helpText = [
      '📚 Bytestorm — Local Mode',
      '',
      'Available:',
      '  echo <text>         - print text',
      '  ls                  - list files (local)',
      '  cat <file>          - print file contents (local)',
      '  touch <file>        - create empty file (local)',
      '  clear               - clear terminal',
      '  help                - show this help',
      '',
      'Coming soon (Connected Mode):',
      '  pwd',
      '  whoami',
      '  python, node, npm',
      '  snapshot (Modal-backed)',
      '',
      '💡 Tip: Use ↑/↓ arrows for command history'
    ];

    helpText.forEach(line => {
      this.addToTerminal(line, 'terminal-success');
    });
  }

  listFiles() {
    const files = Object.keys(this.files).sort().join('  ');
    this.addToTerminal(files, 'terminal-output-text');
  }

  catFile(args) {
    const fileName = args[0];
    if (!fileName) {
      this.addToTerminal('cat: missing file operand', 'terminal-error');
      return;
    }
    if (!(fileName in this.files)) {
      this.addToTerminal(`cat: ${fileName}: No such file`, 'terminal-error');
      return;
    }
    this.addToTerminal(this.files[fileName], 'terminal-output-text');
  }

  showWelcomeMessage() {
    setTimeout(() => {
      const welcomeMessages = [
        '🏝️  Welcome to Bytestorm  🏝️',
        '',
        '> Edit code in the editor, see results in the preview.',
        '> Terminal supports a limited set of local commands.',
        '> Connected Mode (real execution) is coming soon.',
        '> Type "help" to see available commands.',
        '> Try editing the files and seeing what happens!'
      ];

      welcomeMessages.forEach((msg, i) => {
        setTimeout(() => {
          this.addToTerminal(msg, 'terminal-success');
        }, i * 200);
      });
    }, 500);
  }

  comingSoon(feature) {
    this.addToTerminal(`⏳ ${feature} not available in Local Mode. Connected Mode coming soon.`, 'terminal-output-text');
  }

  updateFileSelector() {
    const fileNameElement = document.querySelector('.file-name');
    const fileIconElement = document.querySelector('.file-icon');
    
    if (fileNameElement && fileIconElement) {
      fileNameElement.textContent = this.currentFile;
      fileIconElement.textContent = this.getFileIcon(this.currentFile);
    }
  }

  setupFileBrowser() {
    const fileSelector = document.getElementById('file-selector');
    const overlay = document.getElementById('file-browser-overlay');
    const closeButton = document.getElementById('close-file-browser');
    
    fileSelector.addEventListener('click', () => {
      this.openFileBrowser();
    });
    
    closeButton.addEventListener('click', () => {
      this.closeFileBrowser();
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeFileBrowser();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
        this.closeFileBrowser();
      }
    });
  }

  openFileBrowser() {
    const overlay = document.getElementById('file-browser-overlay');
    const fileGrid = document.getElementById('file-grid');
    
    // Populate file grid
    fileGrid.innerHTML = '';
    const files = Object.keys(this.files).sort();
    
    files.forEach(fileName => {
      const fileItem = document.createElement('button');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
        <div class="file-item-icon">${this.getFileIcon(fileName)}</div>
        <div class="file-item-name">${fileName}</div>
      `;
      
      fileItem.addEventListener('click', () => {
        this.switchToFile(fileName);
        this.closeFileBrowser();
      });
      
      fileGrid.appendChild(fileItem);
    });
    
    overlay.classList.remove('hidden');
  }

  closeFileBrowser() {
    const overlay = document.getElementById('file-browser-overlay');
    overlay.classList.add('hidden');
  }

  getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'js': return '⚡';
      case 'json': return '📋';
      case 'py': return '🐍';
      case 'md': return '📝';
      case 'txt': return '📄';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg': return '🖼️';
      default: return '📄';
    }
  }

  createFile(fileName) {
    if (!fileName) return;
    if (!(fileName in this.files)) {
      this.files[fileName] = '';
      this.saveFilesToStorage();
      this.updateFileSelector();
    }
  }

  takeSnapshot() {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const snapshotData = {
      timestamp,
      files: { ...this.files },
      currentFile: this.currentFile
    };

    // For now, just simulate saving to localStorage
    localStorage.setItem(`bytestorm-snapshot-${timestamp}`, JSON.stringify(snapshotData));

    this.addToTerminal(`📸 Snapshot saved: ${timestamp}`, 'terminal-success');
    this.addToTerminal('🎯 Future: This will save your Modal sandbox state!', 'terminal-output-text');

    // Visual feedback
    const btn = document.getElementById('snapshot-btn');
    const originalText = btn.textContent;
    btn.textContent = '✅ Saved!';
    btn.style.background = 'var(--coral-orange)';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
  }

  // --- Local persistence (Local Mode) ---
  getDefaultFiles() {
    return {
      'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Welcome to Bytestorm!</h1>\n  <p>Start building something amazing...</p>\n  <script src="script.js"></script>\n</body>\n</html>',
      'style.css': '/* Add your styles here */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 40px;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n}\n\nh1 {\n  text-align: center;\n  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\n}',
      'script.js': 'const runDebug = false;\n\ndocument.addEventListener("DOMContentLoaded", function() {\n\n  if (runDebug){\n    console.log("Page loaded and ready!");\n  }\n  \n});'
    };
  }

  loadFilesFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
      return null;
    } catch (_) {
      return null;
    }
  }

  saveFilesToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.files));
    } catch (_) {
      // ignore quota or serialization errors in Local Mode
    }
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BytestormApp();
});
