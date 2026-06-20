# Walkthrough — Running Open Design and Manual Installation Guide

We have successfully launched the Open Design server (daemon and web app) locally, and verified its state. Below are the details on how it is running, along with a complete step-by-step manual installation guide.

---

## Current Dev Server Status

The local development server has been started and is fully operational:

*   **Web Frontend URL:** [http://127.0.0.1:51390/](http://127.0.0.1:51390/)
*   **API Daemon URL:** [http://127.0.0.1:51389/](http://127.0.0.1:51389/)

Here is a visual screenshot of the interface loaded directly from your local dev server:

![Open Design User Interface](file:///C:/Users/setup%20game/.gemini/antigravity/brain/604acb55-be85-4be2-bb2d-13942f69335c/artifacts/open_design_home.png)

---

## Step-by-Step Manual Installation Guide

Follow these instructions to download, install dependencies, and run the Open Design product manually on your system:

### 1. Environment Requirements

Ensure you have the following prerequisites installed on your Windows machine:

| Component | Recommended Version | Verification Command |
| :--- | :--- | :--- |
| **Node.js** | `~24` (or `25` with our patch) | `node -v` |
| **pnpm** | `10.33.x` | `pnpm -v` |
| **Git** | Any recent version | `git --version` |

> [!TIP]
> If you need to install Node 24 on Windows, the easiest way is using `nvm-windows`. Run:
> ```powershell
> nvm install 24
> nvm use 24
> ```

### 2. Download and Clone

First, clone the repository and navigate into the project directory:
```powershell
git clone <repository-url>
cd open-design
```

### 3. Install Dependencies

1. Enable Corepack to use the pinned package manager version, or install it globally:
   ```powershell
   corepack enable
   # Or fallback:
   npm install -g pnpm@10.33.2
   ```
2. Approve the native build scripts required by SQLite and Electron (pnpm 10 blocks scripts by default for security):
   ```powershell
   pnpm approve-builds
   ```
3. Run the installation command:
   ```powershell
   pnpm install
   ```

> [!IMPORTANT]
> If compiling native modules (like `better-sqlite3`) fails during installation, you must install **Build Tools for Visual Studio 2022** with the **Desktop development with C++** workload.

### 4. How to Launch Manually

From the repository root directory, run the following command to start both the API daemon and the Web UI in the foreground:
```powershell
pnpm tools-dev run web
```
Once the compilation completes, the terminal will print the local URL (e.g., `http://127.0.0.1:51390/`). Open this URL in your browser to start design generation!

### 5. Downloading/Saving Artifacts Manually

Once the AI agent finishes generating a prototype in the UI:
1. Look at the toolbar in the interactive preview tab.
2. Click the **Save to disk** button.
3. This will download and save the generated HTML/CSS files manually to your local filesystem under the `./.od/artifacts/` folder.
