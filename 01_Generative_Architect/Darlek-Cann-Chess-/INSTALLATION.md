# Installation Guide: DARLEK CANN CHESS ENGINE

This guide provides instructions for setting up the **DARLEK CANN ENGINE** in a development environment.

---

## 1. Prerequisites

Ensure your environment meets the following requirements:

- **Node.js**: Version `20.x` or higher (LTS recommended).
- **npm**: Version `9.x` or higher.
- **Git**: Required for source control.
- **nvm (Node Version Manager)**: Highly recommended to manage Node versions easily (`nvm use`).

---

## 2. Installation Steps

### Step A: Clone the Repository
bash
git clone https://github.com/your-username/Darlek-Cann-Chess.git
cd Darlek-Cann-Chess


### Step B: Install Dependencies
bash
npm install


### Step C: Environment Configuration
Copy the template and configure your local secrets:
bash
cp .env.example .env.local

Edit `.env.local` and provide your `GEMINI_API_KEY`.

---

## 3. Development Workflow

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server on `http://localhost:3000` |
| `npm run lint` | Runs ESLint to check code coherence |
| `npm run build` | Compiles the project into the `/dist` directory |
| `npm run test` | Executes the test suite (if configured) |

---

## 4. Docker Deployment (Optional)

For a containerized environment that bypasses local dependency issues:

1. **Build Image**: `docker build -t darlek-cann-engine:latest .`
2. **Run Container**: `docker run -d -p 3000:3000 --env-file .env.local --name darlek-chess darlek-cann-engine:latest`

---

## 5. Troubleshooting

- **Dependency Conflicts**: If installation fails, run `rm -rf node_modules package-lock.json && npm install`.
- **Port Conflicts**: If port 3000 is in use, modify the `vite.config.ts` or set the `PORT` environment variable.
- **API Errors**: Ensure your `GEMINI_API_KEY` is valid and has sufficient quota for engine interactions.
