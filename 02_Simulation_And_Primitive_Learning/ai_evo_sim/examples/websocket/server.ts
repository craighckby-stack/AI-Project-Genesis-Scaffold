/**
 * @file server.ts
 * @description High-integrity WebSocket event orchestrator for the DARLEK_CAAN_ENGINE.
 * This module manages real-time state synchronization, connection lifecycle, and event routing.
 * 
 * Integration: Connects to frontend.tsx via Socket.io protocol.
 * Architecture: Implements a singleton-like ConnectionRegistry for state consistency and memory safety.
 * 
 * @version 3.0.0
 */

import { createServer, Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';

// --- Interfaces ---

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  type: 'user' | 'system';
}

interface JoinPayload {
  username: string;
}

interface MessagePayload {
  content: string;
  username: string;
}

// --- Architectural Registry ---

class ConnectionRegistry {
  private users: Map<string, User> = new Map();

  public register(id: string, username: string): User {
    const user: User = { id, username };
    this.users.set(id, user);
    return user;
  }

  public unregister(id: string): User | undefined {
    const user = this.users.get(id);
    if (user) this.users.delete(id);
    return user;
  }

  public getActiveUsers(): User[] {
    return Array.from(this.users.values());
  }

  public validateUser(id: string, username: string): boolean {
    const user = this.users.get(id);
    return user !== undefined && user.username === username;
  }
}

// --- Utilities ---

class MessageFactory {
  public static create(username: string, content: string, type: 'user' | 'system'): Message {
    return {
      id: randomUUID(),
      username,
      content,
      timestamp: new Date().toISOString(),
      type,
    };
  }
}

// --- Orchestrator Initialization ---

const registry = new ConnectionRegistry();
const httpServer: HttpServer = createServer();
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// --- Event Routing ---

io.on('connection', (socket: Socket) => {
socket.on('join', (data: JoinPayload) => {
    if (!data?.username) return;
    const user = registry.register(socket.id, data.username);
    const joinMsg = MessageFactory.create('System', `${data.username} joined the nexus.`, 'system');
    
    io.emit('user-joined', { user, message: joinMsg });
    socket.emit('users-list', { users: registry.getActiveUsers() });
  });

  socket.on('message', (data: MessagePayload) => {
    if (registry.validateUser(socket.id, data.username)) {
      io.emit('message', MessageFactory.create(data.username, data.content, 'user'));
    }
  });

  socket.on('disconnect', (reason: string) => {
    const user = registry.unregister(socket.id);
    if (user) {
      const leaveMsg = MessageFactory.create('System', `${user.username} disconnected.`, 'system');
      io.emit('user-left', { user, message: leaveMsg });
    }
});

  socket.on('error', (err: Error) => console.error(`[CRITICAL] Socket error (${socket.id}):`, err));
});

// --- Lifecycle Management ---

const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => console.log(`[SYSTEM] WebSocket orchestrator active on port ${PORT}`));

const shutdown = (signal: string) => {
io.close(() => {
    httpServer.close(() => {
process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err: Error) => console.error('[FATAL] Uncaught Exception:', err));





