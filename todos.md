# Bytestorm Development TODOs

**Status: Frontend prototyped, backend completely TODO**

## **Remaining Work Summary:**
- **File system** needs Modal sandbox backend (currently localStorage)
- **Programming environments** need Modal execution (python, node, npm)
- **Snapshots** need Modal filesystem snapshots (currently localStorage)  
- **Preview system** needs server-side rendering for non-web projects
- **Backend services** need to be built from scratch (auth, websockets, deployment)
- **Infrastructure** needs deployment architecture

### **Mock File System**
**CURRENTLY:** Files stored in JavaScript object with localStorage persistence
**NEEDS:** Real filesystem backed by Modal sandbox

### **Terminal Commands - Local vs Connected Mode**
**CURRENTLY:** Mixed implementation - some local commands work, others show "Connected Mode coming soon"

#### **Working Local Commands:**
- **`ls`** - Lists files from local file system ✅
- **`cat <file>`** - Reads file contents from local files ✅
- **`touch <file>`** - Creates new empty files locally ✅
- **`echo <text>`** - Prints text ✅
- **`clear`** - Clears terminal ✅
- **`help`** - Shows available commands ✅

#### **Commands Awaiting Connected Mode (Modal sandbox):**
- **Environment commands:** `pwd`, `whoami`
- **Programming environments:** `python`, `node`, `npm`
- **Package management:** `pip install`, `npm install`
- **File operations:** `mkdir`, `rm`, `mv`, `cp`
- **Git operations:** `git init`, `git add`, `git commit`
- **Process management:** `ps`, `kill`, `jobs`

### **Mock Snapshot System**
**CURRENTLY:** Saves to localStorage with placeholder UI
**NEEDS:** 
- Real Modal `Sandbox.snapshot_filesystem()` calls
- Snapshot restoration functionality
- Snapshot browsing/management UI
- Snapshot sharing between users

### **Preview System Limitations**
**CURRENTLY WORKS:** Client-side HTML/CSS/JS preview
**NEEDS:** 
- Server-side rendering for Python Flask/Django apps
- Node.js application preview (Express servers)
- Database integration preview
- API endpoint testing

### **Missing Backend Architecture**
**NEEDS:**
- **Authentication service** (login/logout/session management)
- **Sandbox orchestration service** (create/destroy/manage Modal sandboxes per user)
- **WebSocket service** (stream command output from sandboxes in real-time)
- **File synchronization service** (sync editor changes to sandbox filesystem)
- **Artifact deployment service** (deploy user projects as live web pages)
- **Snapshot management service** (create/restore/list Modal snapshots)

### **Missing User Management Features**
**NEEDS:**
- User registration/login system
- Session persistence
- User workspace isolation
- Project sharing capabilities
- User settings/preferences

### **Missing Real-Time Communication**
**NEEDS:**
- WebSocket connection to stream command output
- Real-time file synchronization
- Terminal input/output streaming
- Multiple terminal session management
- Process management (interrupt running commands)

### **Missing Deployment Infrastructure**  
**NEEDS:**
- Artifact compilation (bundle HTML/CSS/JS projects)
- Static site hosting (serve user projects on subdomains)
- Dynamic application hosting (Python/Node apps with their own URLs)
- Environment variable management
- Domain management for user projects
