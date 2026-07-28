# 🛠️ Installation Guide — DARLEK CANN

This guide provides clean, step-by-step instructions to deploy, run, and self-compile **DARLEK CANN** on any local system.

---

## 📋 Prerequisites

Before setting up the Cognitive Evolutionary Command Reactor, ensure you have the following installed:
* **Node.js**: Version `18.x` or `20.x`+ recommended.
* **npm**: Version `9.x`+ (included with Node.js) or **bun** / **yarn** / **pnpm**.
* **Git**: To clone the repository and sync local branch targets.

---

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository
Open a terminal and fetch the codebase:
```bash
git clone https://github.com/your-username/darlek-cann.git
cd darlek-cann
```

### Step 2: Install Dependencies
Run npm to fetch all packages needed for full-stack and sub-agent modules:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the template environment file to activate the local configuration:
```bash
cp .env.example .env
```
Open `.env` in your text editor and provide your **Gemini API Key**:
```env
# Database file location
DATABASE_URL="file:./dev.db"

# Your Google AI Studio / Gemini API Key
GEMINI_API_KEY=AIzaSy...
```

### Step 4: Bootstrap the Local Database
Generate the Prisma system artifacts and synchronize schemas safely to compile the SQLite physical layer:
```bash
npx prisma db push
```

### Step 5: Start the Development Server
Bootstrap the Next.js framework in dev mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the holographic dashboard.

---

## 🐳 Running with Docker (Optional)

You can containerize the service using standard build setups:

```bash
# Build the core image
docker build -t darlek-cann:latest .

# Run the container mapping internal port 3000
docker run -p 3000:3000 --env-file .env darlek-cann:latest
```

---

## 🔎 Troubleshooting Common Issues

* **SQLite database is locked / malformed**:
  If SQL synchronization has unresolved handles, run:
  ```bash
  rm prisma/dev.db*
  npx prisma db push
  ```
* **API Key is missing**:
  Ensure `.env` contains valid keys and that `process.env.GEMINI_API_KEY` isn't prefixed with client-exposed bindings.
