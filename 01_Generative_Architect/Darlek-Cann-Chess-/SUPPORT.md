# Support and Troubleshooting: DARLEK CANN ENGINE

We want your experience with the **DARLEK CANN ENGINE** to be flawless! If you encounter issues with calculation freezes, audio synthesis blocks, or keyboard controls, please check the steps below.

---

## 1. Common Issues and Resolutions

### A. Web Audio Synthesis Muted / Mute Alert
- **Cause**: Modern browsers automatically block Web Audio contexts until a user makes an active interaction (click or keypress) on the document canvas.
- **Remedy**: Click anywhere on the interface or tap any game button (e.g., toggle "HIGH CONTRAST") to authorize Audio Context playback. Also verify the "SOUND EFFECTS" toggle is turned on in the control sidebar.

### B. Minimax Computation Performance Lag (Freezes)
- **Cause**: If playing on Level 6, Level 666, or choosing high search depths on older devices, processing millions of chess nodes concurrently can clog single-thread JS environments.
- **Remedy**: Set the Match Pace or Difficulty down to Level 3 or 4. A simulated loading spinner appears on Freezer (666) difficulty to indicate intensive computation cycles.

### C. Resetting Stale Persistent Checkpoints
- **Cause**: A corrupted previous game state saved in your local database may cause render conflicts on reload.
- **Remedy**: Press the **RESTART** button located in the universal control header. This re-initializes clean state settings, clears active history caches, and restarts game boards instantly.

---

## 2. Support Channels

If troubleshooting does not solve your issue:

1. **Submit a Bug Issue**: File a standard issue ticket on the GitHub Repository, including game log lines from your terminal console.
2. **Community Discussions**: Join standard repository chats to suggest custom CSS styling configurations or share coordinate chess strategies.

