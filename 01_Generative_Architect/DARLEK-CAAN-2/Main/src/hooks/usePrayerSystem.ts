import { useState, useCallback, useEffect } from 'react';
import { Agent, WorldState, PrayerEmail } from '../engine/types';

export const usePrayerSystem = (
  world: WorldState, 
  agents: Agent[], 
  onResolve?: (id: string, reply: string) => void
) => {
  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
  const [userReply, setUserReply] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [transmissionLogs, setTransmissionLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setTransmissionLogs(prev => [...prev.slice(-4), `> ${msg}`]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setSelectedPrayerId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSendReply = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const prayer = world.prayers?.find(p => p.id === selectedPrayerId);
    const agent = agents.find(a => a.id === prayer?.agentId);

    if (!prayer || !userReply.trim()) return;
    
    setStatus('submitting');
    addLog("INITIATING_ENCRYPTED_UPLINK");

    try {
      // Siphoned from Darlek-Caan-system-Deployment- logic
      const response = await fetch('/api/pray', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Epistemic-Weight': '0.95',
          'X-Quantum-Signature': crypto.randomUUID()
        },
        body: JSON.stringify({
          prayerId: prayer.id,
          agentData: agent,
          worldState: {
            id: world.id,
            era: world.era,
            entropy: world.entropy
          },
          userMessage: userReply,
          timestamp: Date.now()
        })
      });

      if (!response.ok) throw new Error('TRANSMISSION_FAILED');

      addLog("PACKET_RECEIVED_BY_AGENT_CORE");
      onResolve?.(prayer.id, userReply);
      setUserReply('');
      setStatus('success');
      addLog("COMMUNION_COMPLETE");
    } catch (err) {
      console.error("Aether Transmission Error:", err);
      setStatus('error');
      addLog("CRITICAL_SIGNAL_LOSS");
    }
  }, [selectedPrayerId, userReply, world, agents, onResolve]);

  return {
    selectedPrayerId,
    setSelectedPrayerId,
    userReply,
    setUserReply,
    status,
    setStatus,
    transmissionLogs,
    handleSendReply
  };
};




