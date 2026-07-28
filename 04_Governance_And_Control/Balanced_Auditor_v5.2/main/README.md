see 1 branch

# 🌌 System Auditor (AI Codebase Analyzer)

An autonomous, AI-driven dashboard that ingests GitHub repositories, analyzes their architectural maturity, and automatically generates comprehensive documentation and UI mockups.

## ✨ Features

* **🧠 Deep Context Analysis**: Utilizes `gemini-3.1-pro-preview` to synthesize codebase context and categorize repositories into architectural tiers (Foundation, Integration, Experimental).
* **🖼️ UI Mockup Generation**: Automatically hallucinates professional dashboard mockups for your projects using `gemini-2.5-flash-image` based purely on the repository's code context.
* **📊 Cosmic Dashboard**: A premium, dark-themed, terminal-inspired interface to track build statuses, health metrics, and audit logs.
* **📝 Automated README Synthesis**: Compiles the AI analysis, architectural synthesis, and UI mockups into ready-to-use Markdown.

## 🚀 Getting Started

### Prerequisites

You will need Node.js installed, along with an API key for Google's Gemini models.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/system-auditor.git
   cd system-auditor
