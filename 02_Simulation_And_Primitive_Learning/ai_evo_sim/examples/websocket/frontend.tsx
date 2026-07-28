/**
 * @file examples/websocket/frontend.tsx
 * @description High-integrity WebSocket client interface for the DARLEK_CAAN_ENGINE.
 * @role Real-time event-driven communication layer.
 * @integration Connects to the system's internal WebSocket gateway via XTransformPort.
 * @architecture Implements a decoupled lifecycle pattern for socket management with atomic state synchronization.
 */

'use client';

import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

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

/**
 * @constant GATEWAY_CONFIG
 * @description Centralized configuration for the WebSocket gateway to prevent drift.
 */
const GATEWAY_CONFIG = {
  PORT: '3003',
  RECONNECT_ATTEMPTS: 5,
  TIMEOUT: 10000,
};

export default function SocketDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = io(`/?XTransformPort=${GATEWAY_CONFIG.PORT}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: GATEWAY_CONFIG.RECONNECT_ATTEMPTS,
      timeout: GATEWAY_CONFIG.TIMEOUT,
    });

    socketRef.current = socket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);
    const onUserJoined = (data: { user: User; message: Message }) => {
      setMessages((prev) => [...prev, data.message]);
      setUsers((prev) => prev.some((u) => u.id === data.user.id) ? prev : [...prev, data.user]);
    };
    const onUserLeft = (data: { user: User; message: Message }) => {
      setMessages((prev) => [...prev, data.message]);
      setUsers((prev) => prev.filter((u) => u.id !== data.user.id));
    };
    const onUsersList = (data: { users: User[] }) => setUsers(data.users);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessage);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('users-list', onUsersList);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessage);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('users-list', onUsersList);
      socket.disconnect();
    };
  }, []);

  const handleJoin = useCallback(() => {
    if (socketRef.current && username.trim()) {
      socketRef.current.emit('join', { username: username.trim() });
      setIsUsernameSet(true);
    }
  }, [username]);

  const sendMessage = useCallback(() => {
    if (socketRef.current && inputMessage.trim()) {
      socketRef.current.emit('message', { content: inputMessage.trim(), username });
      setInputMessage('');
    }
  }, [inputMessage, username]);

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket Gateway
            <span className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isUsernameSet ? (
            <div className="flex gap-2">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter identity..." />
              <Button onClick={handleJoin} disabled={!isConnected || !username.trim()}>Join</Button>
            </div>
          ) : (
            <>
              <ScrollArea className="h-80 w-full border rounded-md p-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="mb-2">
                    <span className="font-bold text-xs text-muted-foreground">{msg.username}: </span>
                    <span className="text-sm">{msg.content}</span>
                  </div>
                ))}
                <div ref={scrollEndRef} />
              </ScrollArea>
              <div className="flex gap-2">
                <Input 
                  value={inputMessage} 
                  onChange={(e) => setInputMessage(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                  placeholder="Message..." 
                />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




