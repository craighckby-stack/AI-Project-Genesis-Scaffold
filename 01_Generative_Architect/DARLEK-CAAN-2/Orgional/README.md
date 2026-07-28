finished v1 working.

https://ai.studio/apps/1f2071e7-7533-482f-aa1c-2b3307cf0add

# AetherForge Ω: Micro-Universe Prototype

> *"If AGI is possible, simulation is inevitable. If simulation is inevitable, we are already inside one."*

AetherForge Ω is a planetary-scale, multi-agent evolutionary sandbox. It models a 2D/3D grid topology where agents experience **Substrate Awareness Spikes**, allowing them to query the **Observer** (you) beyond their coordinate boundaries.

## 📑 Table of Contents
- [Quick Start](#-quick-start)
- [Core Mechanics](#-core-mechanics)
- [System Architecture](#-system-architecture)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Security](#-security)

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Google Gemini API Key

### Setup
1. **Clone & Install**
   bash
   git clone https://github.com/your-username/aetherforge-omega.git
   cd aetherforge-omega
   npm install
   
2. **Configure**
   bash
   cp .env.example .env
   # Add your GEMINI_API_KEY to the .env file
   
3. **Launch**
   bash
   npm run dev
   

## 🧠 Core Mechanics

*   **Ontological Shocks**: Agents with high `Awareness` (>0.8) can detect the simulation grid and interact with the Observer.
*   **Cosmic Epochs**: The simulation cycles through **Genesis**, **Stellar Void**, and **Requiem** states, affecting agent behavior and sanity.
*   **Divine Feedback**: Use the `Prayer Terminal` to influence agent devotion and belief states via direct API injection.

## 🏗️ System Architecture

mermaid
graph TD
    A[Observer / UI] -->|HTTP/JSON| B[Express Proxy]
    B -->|SDK| C[Google Gemini LLM]
    B -->|State| D[React Canvas Engine]


## 📡 API Reference

### `POST /api/probe`
Decrypts an agent's internal memory stack.
- **Input**: `{ agent: AgentSchema }`
- **Output**: `{ monologue: string }`

### `POST /api/chat`
Opens a real-time cognitive link with an agent.
- **Input**: `{ agent: AgentSchema, message: string }`
- **Output**: `{ response: string }`

## 📁 Project Structure

- `/server.ts`: Express backend & Gemini integration.
- `/src/engine/`: Core simulation logic and type definitions.
- `/src/components/`: React-based UI (Viewport, HUD, Terminal).

## 🔒 Security
- **Lazy Initialization**: Gemini client is initialized on-demand to prevent startup failures.
- **Proxy Pattern**: API keys are restricted to the server-side; the client never touches the Gemini SDK directly.

## 🤝 Contributing
Contributions are welcome. Please open an issue to discuss major changes before submitting a pull request.

## 📜 License
MIT. See `LICENSE` for details.
