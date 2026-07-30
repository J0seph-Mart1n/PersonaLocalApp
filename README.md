# Persona Local Desktop App

This is the standalone Electron wrapper for the **Persona AI System**. 

The Persona application consists of a Next.js frontend and an Express Node.js backend, which are developed and maintained in separate repositories. This desktop wrapper seamlessly orchestrates both codebases, booting them simultaneously within an isolated native desktop environment.

## 🚀 Overview

*   **Unified Bootstrapping:** Automatically spawns the Express backend (`localhost:5000`) and Next.js frontend (`localhost:3000`) child processes on startup.
*   **Native GUI:** Wraps the entire web application inside an Electron window, providing a unified local desktop experience without needing a browser.
*   **Configuration Manager:** Securely stores your local database URIs and credentials (MongoDB, Neo4j, Ollama) via `electron-store`, safely injecting them into the backend at runtime.
*   **Zero-Cloud Dependency:** Designed to run the 100% offline Persona architecture locally on your machine.

## 📦 Project Structure

Because the frontend and backend are maintained in separate repositories, this application expects the following folder structure during local development:

```text
RAG_Project/
│
├── desktop_app/          # <-- You are here
├── persona_app/          # Next.js Frontend repository
└── persona_backend/      # Node.js Backend repository
```

## 🔗 Project Links

- [Frontend Repository](https://github.com/J0seph-Mart1n/PersonaWebApp)
- [Backend Repository](https://github.com/J0seph-Mart1n/Persona_Backend)

## 🛠️ Prerequisites

Before running the desktop application, ensure you have the following installed and running locally:

1.  **Node.js & npm** (Modern versions)
2.  **Neo4j Desktop / Server** (running on `bolt://localhost:7687`)
3.  **MongoDB** (running on `mongodb://127.0.0.1:27017`)
4.  **Ollama** (running locally on port `11434` with your required models pulled, e.g., `llama3.2` and `nomic-embed-text`)

You must also clone the frontend and backend repositories into the parent directory as shown in the project structure above. You need to run `npm install` in both `persona_app` and `persona_backend` before running the desktop wrapper.

## 🚀 Setup & Execution

1.  **Navigate to the Desktop App:**
    ```bash
    cd desktop_app
    ```

2.  **Install Electron Dependencies:**
    ```bash
    npm install
    ```
    *(Note: If you run into issues with the Electron binary download, you may need to approve scripts via `npm approve-scripts electron-winstaller`)*.

3.  **Launch the Application:**
    ```bash
    npm start
    ```

When you run `npm start`, the Electron main process will:
*   Start the Express backend from `../persona_backend/server.js`.
*   Start the Next.js development server from `../persona_app` using `npm run dev`.
*   Inject the appropriate ports and environment variables.
*   Open the desktop GUI window and load the Next.js frontend.

## ⚙️ Configuration

The first time you run the app, you will be prompted to configure your local environment (Database URIs, Credentials). 

These settings are saved persistently using `electron-store` to your system's app data directory and will be automatically passed to the backend server on subsequent boots. You do not need to manually edit `.env` files for the backend while using the desktop wrapper.
