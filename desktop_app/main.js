const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
let getPort;

// Dynamically import get-port since it's an ESM module
(async () => {
    getPort = (await import('get-port')).default;
})();

let Store;
(async () => {
    Store = (await import('electron-store')).default;
})();

let mainWindow;
let backendProcess;
let frontendProcess;
let store;

async function createWindow() {
    store = new Store();

    // Check if configuration exists
    const hasConfig = store.get('isConfigured') === true;

    // Start the backend server on a random available port
    const backendPort = await getPort({ port: 5000 });
    
    // We will assume the backend is bundled inside the electron app in the "backend" folder
    // For development, we fallback to the parent directory's backend
    const backendPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'backend', 'server.js')
        : path.join(__dirname, '..', 'persona_backend', 'server.js');

    const backendEnv = { ...process.env, PORT: backendPort };
    if (store.get('dbUri')) backendEnv.MONGODB_URI = store.get('dbUri');
    if (store.get('neo4jUri')) backendEnv.NEO4J_URI = store.get('neo4jUri');
    if (store.get('neo4jUsername')) backendEnv.NEO4J_USERNAME = store.get('neo4jUsername');
    if (store.get('neo4jPassword')) backendEnv.NEO4J_PASSWORD = store.get('neo4jPassword');
    if (store.get('ollamaUrl')) backendEnv.OLLAMA_URL = store.get('ollamaUrl');

    backendProcess = spawn('node', [backendPath], {
        cwd: path.dirname(backendPath),
        env: backendEnv
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    // Start the frontend Next.js server
    const frontendPort = await getPort({ port: 3000 });
    const frontendPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'frontend')
        : path.join(__dirname, '..', 'persona_app');

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    frontendProcess = spawn(npmCmd, ['run', 'dev'], {
        cwd: frontendPath,
        env: {
            ...process.env,
            PORT: frontendPort,
            NEXT_PUBLIC_API_URL: `http://localhost:${backendPort}/api`
        }
    });

    frontendProcess.stdout.on('data', (data) => {
        console.log(`Frontend: ${data}`);
    });

    frontendProcess.stderr.on('data', (data) => {
        console.error(`Frontend Error: ${data}`);
    });

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Wait briefly for frontend to start, then load frontend
    setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${frontendPort}/`);
    }, 3000);

    // Pass the backend port and config status to the renderer when it asks
    ipcMain.handle('get-app-info', () => {
        return {
            backendPort,
            isConfigured: store.get('isConfigured') || false,
            config: {
                dbUri: store.get('dbUri'),
                neo4jUri: store.get('neo4jUri'),
                neo4jUsername: store.get('neo4jUsername'),
                neo4jPassword: store.get('neo4jPassword'),
                ollamaUrl: store.get('ollamaUrl') || 'http://localhost:11434'
            }
        };
    });

    ipcMain.handle('save-config', async (event, newConfig) => {
        store.set('dbUri', newConfig.dbUri);
        store.set('neo4jUri', newConfig.neo4jUri);
        store.set('neo4jUsername', newConfig.neo4jUsername);
        store.set('neo4jPassword', newConfig.neo4jPassword);
        store.set('ollamaUrl', newConfig.ollamaUrl);
        store.set('isConfigured', true);
        
        // Tell backend to reload config? Or just restart the backend process.
        // For simplicity, we can restart the backend process
        restartBackend(backendPort);
        return true;
    });
}

function restartBackend(port) {
    if (backendProcess) {
        backendProcess.kill();
    }
    
    const backendPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'backend', 'server.js')
        : path.join(__dirname, '..', 'persona_backend', 'server.js');

    const backendEnv = { ...process.env, PORT: port };
    if (store.get('dbUri')) backendEnv.MONGODB_URI = store.get('dbUri');
    if (store.get('neo4jUri')) backendEnv.NEO4J_URI = store.get('neo4jUri');
    if (store.get('neo4jUsername')) backendEnv.NEO4J_USERNAME = store.get('neo4jUsername');
    if (store.get('neo4jPassword')) backendEnv.NEO4J_PASSWORD = store.get('neo4jPassword');
    if (store.get('ollamaUrl')) backendEnv.OLLAMA_URL = store.get('ollamaUrl');

    backendProcess = spawn('node', [backendPath], {
        cwd: path.dirname(backendPath),
        env: backendEnv
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
    if (frontendProcess) {
        frontendProcess.kill();
    }
});
