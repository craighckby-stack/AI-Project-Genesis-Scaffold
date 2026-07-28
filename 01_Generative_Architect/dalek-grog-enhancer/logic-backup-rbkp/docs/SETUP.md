# Setup Guide

## Prerequisites

- Node.js 18+
- npm or bun
- GitHub account
- API keys (see below)

## API Keys Required

### 1. GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:user`
4. Copy the token

### 2. Cerebras API Key

1. Go to https://cerebras.ai
2. Sign up / log in
3. Navigate to API Keys
4. Create a new key

### 3. Grok API Key (Optional - Fallback)

1. Go to https://x.ai
2. Apply for API access
3. Get your key

### 4. Gemini API Key (For Enhancer)

1. Go to https://aistudio.google.com/
2. Get API key
3. Use for system prompt

## Installation

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/dalek-grog-enhancer.git
cd dalek-grog-enhancer

# Copy environment template
cp .env.example .env

# Edit .env with your keys
nano .env

# Install engine dependencies
cd engine
npm install

# Start the engine
npm run dev
```

## First Run

1. Open http://localhost:3000
2. Enter your target repository (user/repo format)
3. Upload a DNA file or use the sample
4. Set saturation guidelines
5. Click "RUN NEXUS SIPHON"

## Troubleshooting

### "GITHUB_TOKEN missing"
- Ensure your .env file has GITHUB_TOKEN set
- Restart the server after editing .env

### "Rate limit exceeded"
- Wait for rate limit reset (usually 1 hour)
- Use resume mode to avoid reprocessing

### "No files discovered"
- Check repository format is user/repo
- Ensure token has repo access
- Check if repository is private

## Next Steps

- Customize DNA templates with your patterns
- Adjust saturation guidelines for your needs
- Set up the enhancer in Google AI Studio
