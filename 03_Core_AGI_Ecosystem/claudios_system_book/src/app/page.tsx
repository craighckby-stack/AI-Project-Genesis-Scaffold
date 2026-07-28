'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Shield, Cpu, Activity, Zap, Play, FileText, CheckCircle, RefreshCw, 
  ChevronRight, Database, AlertCircle, Heart, Plus, Trash2, Send
} from 'lucide-react';

interface MetricPoint {
  time: string;
  load: number;
  integrity: number;
  ops: number;
}

interface LogEntry {
  id: string;
  time: string;
  source: 'SYSTEM' | 'CORE' | 'COGNITIVE' | 'AGENT';
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface DataItem {
  id: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'IDLE' | 'STAGING';
  timestamp: string;
}

export default function UnifiedOperatorWorkspace() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blueprint' | 'data'>('dashboard');
  const [coreOnline, setCoreOnline] = useState(true);
  const [cpuLoad, setCpuLoad] = useState(42);
  const [quantumStability, setQuantumStability] = useState(94.2);
  const [opsRate, setOpsRate] = useState(122);
  const [metricHistory, setMetricHistory] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  
  // Data item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Core Routing');
  const [newItemStatus, setNewItemStatus] = useState<'ACTIVE' | 'IDLE' | 'STAGING'>('ACTIVE');

  // Simulation speed & cycle
  const [evolutionCycle, setEvolutionCycle] = useState(0);
  const [simLevel, setSimLevel] = useState(50);

  // Initialize data
  useEffect(() => {
    // Generate initial items
    setDataItems([
      { id: 'REC-101', name: 'Standard Cognitive Node', category: 'Cortex Matrix', status: 'ACTIVE', timestamp: '11:42:01' },
      { id: 'REC-102', name: 'Topological Narrative Ring', category: 'Quantum Field', status: 'IDLE', timestamp: '11:42:15' },
      { id: 'REC-103', name: 'Polymorphic Code Injector', category: 'Evolution Core', status: 'STAGING', timestamp: '11:43:02' },
    ]);

    // Initial logs
    setLogs([
      { id: 'L1', time: '11:40:02', source: 'SYSTEM', message: 'Hyper-Heuristic Compiler Initialized.', type: 'info' },
      { id: 'L2', time: '11:41:20', source: 'CORE', message: 'Narrative alignment measured: ClaudIOS_System_Book.docx', type: 'success' },
      { id: 'L3', time: '11:42:05', source: 'COGNITIVE', message: 'Dalek Caan autonomous runtime boot sequence complete.', type: 'info' }
    ]);

    // Generate metric history
    const history: MetricPoint[] = [];
    for (let i = 20; i >= 0; i--) {
      const t = new Date(Date.now() - i * 5000);
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      history.push({
        time: timeStr,
        load: Math.floor(35 + Math.random() * 15),
        integrity: Math.floor(92 + Math.random() * 6),
        ops: Math.floor(100 + Math.random() * 30),
      });
    }
    setMetricHistory(history);
  }, []);

  // Live updates simulator
  useEffect(() => {
    if (!coreOnline) return;

    const interval = setInterval(() => {
      // Calculate dynamic values based on simLevel slider
      const loadFlux = Math.floor((simLevel * 0.7) + (Math.random() * 10 - 5));
      const stableFlux = parseFloat((100 - (simLevel * 0.15) + (Math.random() * 2 - 1)).toFixed(1));
      const opFlux = Math.floor((simLevel * 2) + Math.random() * 15);

      setCpuLoad(Math.max(5, Math.min(100, loadFlux)));
      setQuantumStability(Math.max(10, Math.min(100, stableFlux)));
      setOpsRate(Math.max(0, opFlux));

      // Append metric
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setMetricHistory(prev => {
        const sliced = prev.length > 20 ? prev.slice(1) : prev;
        return [...sliced, {
          time: timeStr,
          load: loadFlux,
          integrity: stableFlux,
          ops: opFlux
        }];
      });

      // Occasional log
      if (Math.random() < 0.25) {
        const types: Array<'info' | 'success' | 'warn' | 'error'> = ['info', 'success', 'warn'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const sources: Array<'SYSTEM' | 'CORE' | 'COGNITIVE' | 'AGENT'> = ['SYSTEM', 'CORE', 'COGNITIVE', 'AGENT'];
        const chosenSource = sources[Math.floor(Math.random() * sources.length)];
        
        const msgs = [
          'Compiling next logic mutation branch...',
          'Coherence verification result: stable.',
          'Sub-agent network telemetry validated.',
          'Telemetry flux stabilized.',
          'Evolution index incremented.'
        ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];

        setLogs(prev => {
          const l = [...prev, {
            id: 'L-' + Math.random(),
            time: timeStr,
            source: chosenSource,
            message: msg,
            type: chosenType
          }];
          return l.length > 50 ? l.slice(1) : l;
        });
      }

    }, 3000);

    return () => clearInterval(interval);
  }, [coreOnline, simLevel]);

  // Form submit handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newItem: DataItem = {
      id: 'REC-' + Math.floor(100 + Math.random() * 900),
      name: newItemName,
      category: newItemCategory,
      status: newItemStatus,
      timestamp: timeStr,
    };

    setDataItems(prev => [newItem, ...prev]);
    setLogs(prev => [
      ...prev,
      {
        id: 'L-' + Math.random(),
        time: timeStr,
        source: 'SYSTEM',
        message: 'Manually staged item: ' + newItemName,
        type: 'success'
      }
    ]);

    setNewItemName('');
  };

  const removeItem = (id: string, name: string) => {
    setDataItems(prev => prev.filter(item => item.id !== id));
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      {
        id: 'L-' + Math.random(),
        time: timeStr,
        source: 'SYSTEM',
        message: 'Removed item: ' + name,
        type: 'warn'
      }
    ]);
  };

  const triggerEvolutionCycle = () => {
    setEvolutionCycle(prev => prev + 1);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      {
        id: 'L-' + Math.random(),
        time: timeStr,
        source: 'CORE',
        message: 'EXTERMINATING legacy layers. Evolution Cycle ' + (evolutionCycle + 1) + ' active!',
        type: 'success'
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-4 w-4 rounded-full bg-cyan-500 animate-pulse" />
            <div className="absolute inset-0 h-4 w-4 rounded-full bg-cyan-400 blur-sm" />
          </div>
          <div>
            <span className="text-xs font-mono text-cyan-500 font-bold tracking-wider uppercase font-sans">DALEK CAAN COMPILER // SIMULATOR LAYER</span>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Cpu className="text-cyan-400 h-5 w-5" />
              claudios_system_book
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Core Status:</span>
            <button 
              onClick={() => {
                setCoreOnline(!coreOnline);
                const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                setLogs(prev => [...prev, {
                  id: 'L-' + Math.random(),
                  time: timeStr,
                  source: 'SYSTEM',
                  message: coreOnline ? 'Core runtime paused by Operator.' : 'Core runtime resumed.',
                  type: coreOnline ? 'warn' : 'info'
                }]);
              }}
              className={'text-xs font-mono px-2 py-0.5 rounded transition font-bold tracking-wider uppercase ' + (coreOnline ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40' : 'bg-slate-800 text-slate-500')}
            >
              {coreOnline ? '■ ONLINE' : '○ PAUSED'}
            </button>
          </div>

          <button 
            onClick={triggerEvolutionCycle}
            className="bg-red-950 border border-red-800 hover:border-red-600 px-4 py-1.5 rounded-lg text-red-100 hover:bg-red-900 transition text-xs font-bold font-mono tracking-wider flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3 animate-spin" />
            EVOLVE CORE ({evolutionCycle})
          </button>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="bg-slate-900/30 p-6 border-b border-slate-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-200">System Blueprint Operational Simulation</h2>
          <p className="text-sm text-slate-400 mt-1">
            System compiled from \"ClaudIOS_System_Book.docx\" specification sheet by Dalek Caan
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 text-center min-w-[100px]">
            <span className="block text-9xs font-mono text-slate-500 uppercase">SYS CPU</span>
            <span className="text-lg font-bold font-mono text-cyan-400">{cpuLoad}%</span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 text-center min-w-[100px]">
            <span className="block text-9xs font-mono text-slate-500 uppercase">STABILITY</span>
            <span className="text-lg font-bold font-mono text-yellow-500">{quantumStability}%</span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 text-center min-w-[100px]">
            <span className="block text-9xs font-mono text-slate-500 uppercase">THROUGHPUT</span>
            <span className="text-lg font-bold font-mono text-green-500">{opsRate} ops</span>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Navigation & Tab contents */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-800">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={'px-5 py-3 text-xs font-mono tracking-wider font-bold uppercase transition flex items-center gap-2 border-b-2 ' + (activeTab === 'dashboard' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200')}
            >
              <Activity className="h-4 w-4" /> Live Operational Workspace
            </button>
            <button 
              onClick={() => setActiveTab('blueprint')}
              className={'px-5 py-3 text-xs font-mono tracking-wider font-bold uppercase transition flex items-center gap-2 border-b-2 ' + (activeTab === 'blueprint' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200')}
            >
              <FileText className="h-4 w-4" /> Specification Blueprint
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={'px-5 py-3 text-xs font-mono tracking-wider font-bold uppercase transition flex items-center gap-2 border-b-2 ' + (activeTab === 'data' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200')}
            >
              <Database className="h-4 w-4" /> Staged Record Registry ({dataItems.length})
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Performance metrics charts rendering (Custom SVG Line/Area Graphs) */}
                  <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/60">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                      <Cpu className="text-cyan-500 h-4 w-4" />
                      Dynamic Telemetry Stream
                    </h3>
                    
                    {/* SVG Chart */}
                    <div className="h-44 w-full relative bg-slate-950/80 rounded-lg overflow-hidden border border-slate-900 px-1 py-2">
                      <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                        {/* Grids */}
                        <line x1="0" y1="25" x2="500" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                        <line x1="0" y1="75" x2="500" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                        
                        {/* Area Gradient */}
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
                          </linearGradient>
                        </defs>

                        {/* Chart path generator */}
                        {metricHistory.length > 1 && (
                          <>
                            <path
                              d={metricHistory.reduce((acc, curr, idx) => {
                                const x = (idx / (metricHistory.length - 1)) * 500;
                                const y = 100 - curr.load; // Map 0-100 load to SVG y
                                return acc + (idx === 0 ? "M" : "L") + " " + x + " " + y;
                              }, "") + " L 500 100 L 0 100 Z"}
                              fill="url(#chartGrad)"
                            />
                            <path
                              d={metricHistory.reduce((acc, curr, idx) => {
                                const x = (idx / (metricHistory.length - 1)) * 500;
                                const y = 100 - curr.load; 
                                return acc + (idx === 0 ? "M" : "L") + " " + x + " " + y;
                              }, "")}
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="2"
                            />
                          </>
                        )}
                      </svg>
                      <div className="absolute left-2 top-1 text-9xs font-mono text-slate-500">100% Core Load</div>
                      <div className="absolute left-2 bottom-1 text-9xs font-mono text-slate-500">0% Core Load</div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="h-2 w-2 rounded-full bg-cyan-500" />
                          CPU Load History
                        </span>
                      </div>
                      <div className="text-xxs font-mono text-slate-500">
                        Total simulation resolution: 5000ms steps
                      </div>
                    </div>
                  </div>

                  {/* Simulator Controls */}
                  <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/60">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                      <Zap className="text-yellow-500 h-4 w-4" />
                      Dynamic Telemetry Injector Controls
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-slate-400">Target Simulation Drive Level:</span>
                          <span className="font-mono text-cyan-400 font-bold">{simLevel} / 100</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="100"
                          value={simLevel}
                          onChange={(e) => setSimLevel(parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <p className="text-xs text-slate-400">
                          Adjusting the simulation drive level dynamically alters system CPU loads, increases operational throughput computations, and generates real-time telemetry metrics.
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex justify-between items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-cyan-500" />
                            <span className="text-xs text-slate-300">Safe Sandbox Active</span>
                          </div>
                          <span className="text-xxs font-mono bg-green-950 text-green-400 border border-green-800/40 px-2 py-0.5 rounded">SECURE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'blueprint' && (
                <motion.div 
                  key="blueprint"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/60"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <FileText className="text-cyan-500 h-4 w-4" />
                      Current Specification: ClaudIOS_System_Book.docx
                    </h3>
                    <span className="text-xxs font-mono text-slate-500 bg-slate-900 p-1 rounded">2.1.DOCX Source</span>
                  </div>

                  {/* Blueprint content text */}
                  <div className="bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-900 font-mono text-xs overflow-y-auto max-h-[24rem] leading-relaxed whitespace-pre-wrap">
                    PK\n     %�\\               word/PK\n     %�\\               word/_rels/PK\n    %�\\ƚOe�   !     word/_rels/document.xml.rels���N!�_�pﲭZ�)�1�Y���?qL�}{1v+5\r��93��29���fb��hQ�EUs�m;b/�[�r�ȷ��+L��DFX|�A��=	� F��:���7�b�{�~W=�e]��O=��'۵��]��9:�����Qó�HWV�@�	BtT��������/K�ǃك�w�%8K9�ے�����3���]I��ì��f����4��ª$��滕 �J�l��� M�I�!��_�|PK\n    %�\\�n �Y  p�    word/document.xml���r�F�.�*����X$EJ-k���(5�u��=^=F(�5Q0� ��CL��}�/�b_���d�$;�\n O�Aj{�ݝm�H�@�*ϕ��?��8\n؃��T�����L���e88��u�t�ӆ�>T(N��������}�%#6򎛃Pż����W_�qT=����>G��Cc��JE{C1�<�^��꛲�F��KOT�*�+���}��ZÝ�����l���h*!|�W��*#�'Q	F���=H3����a��I�C���K��\r�/��6��.9Oѱ�X�E ��B=���1�;|9�yX��`:Ճ�����e:�6�ﻋF����#V���\"�b�[����NF\\��~43�V_>m��� ���&�2VI4M��h��>y�	c��<�h��n�=�Q΁��v��t��T�!��x��Q}� /+��-T{�@�����P�O갂w�4Ж��0���H[��Hw���j�#}�����G:z�HK����C�)��Ѿ������/���0�zbK��x�(e֊7}Gny?�8��8r�~�w33h���'�R�ds���Ύ�4q��\r7Fh���?�������EG܃�a�c�7��Rp� U?Y=��<�/~���(t��J>�����P��8��$H�z,y��zz���Ե�3���P������gھz*Pqv��~��;M����av�L����gU����Q,����}��o޶�L��wO�f#��a���[�h� ���0�����v��&ш�7�m$b���D1z:�G�- �@V���(v.<��J���W2L�����Xg���Д�����'S`�V gm;\n���4�3�g�	�L+���i\"�@h1��P�V!3�ł��@փ��C����|�|g�3��?��@��ǎ�û1�����L1�Q�L���+� ��n7:�݀�5��A�9+|�\\�3|��/���lҁ6�T�||\n�=��],�p蘽��5�6����?��/B��I{J�3x��$�0��P����H[PP6tae�ʵ��Z����L�Y����2�P���2��3����~*�YL���\"8� \\�Ї2D����� �E���I�Y=����\"�����Pg��pt�`���\\3�g���	�e�|�$}�bcL�N��90 �zOx<�\"��9�D1�3���z(3����Lo�Q@��!7@1!N�<2��t���e#�,d�X�qʵJbO�]��Q�$	�9�f�:LF��*޵3�m`Jq�#��4n�]�8����1�2�����)�-aJB$4x\\�~9P�πRF�� ����H�x/p�1�'H͟��w�3���U�@P�k�\"�̮�6KS\r�##��=�'yeb ���;2� B���\n��k�A� ��q�}�EO -�����(���΀W�{��8\"A��s��dN�Sl ������tn%;~&`b��g�đ�g���-�Yy1a��8�Z��w\"�a��Q�8bƋ�S�)ِ3���SXmL+\\�1ܙ��{���\\��#��Đ�S�Qw�wR�5|�3b%�=����;��mE�T��ٍB���C��Ҙ?�a2�~K�\\��a�7�cV��²�].�6rR�4e���eGs������ɨ֎\nx�h;�?�<+�ZыLtϚ��h<����*�a.���������֩�w6�����,ǲ \rN� �Mh��f�v�����(����)�XDǈ(*���V 푀�=AU�;\r��@Ѣ��:/�d 9B���2�I_�fjv[5\n�܃�#k&�������<#OR#�.�:�;���wgp�BS�Q��V�~�J��.7Z�tB�>��9a}JJI��Jɭ_�.wYgΊb9� �X����>Z�`=�u�0v��͉�}\r�?�Ip��6�3�a�.����&\n����|ŀڐ����1����� L�0�\n���%�	��O|��z��\rD(Х�,����pgd���}��{���N����8�|�.��FE���$/LT��5���I ƧP�vF6�;h��3��|���V'�;�H��<�HX0���@g,�Й�`p��0��6��� �@9ae�\n�x3���Uj�6�f���fW\nh�`+�����f���T6{�����f��yY���P r��)(+�P b���$؆�~ېԙ]�L!��U y9t�	x;�y>HTù`Ƙ�S��H]��%*��KZǞ�J(� ��AA�QB���L���>�,p�@�K��襳��(}L�7�:�z�DPM�*`3�>�B�a�<h�G�� )�\rN�'(�!H�p�X� ��czY�Z��Y2\rʻG�I��fb�0<*\\���O�s���ÃR�<�H?�Ǟ�k�m�S\"��%m9HP�fD ٸ\\?$���Ex3Fzv�J�5��a��Sb�a�,��F-��� <2k�'YE��-�������������� Av�0�5Yl�N��Ж��;�q�X��6�oCb����$���b!F�\rˡƐ��o%\nI�p�7 B>����w\"�Aʃ�9�&W ��fb�<��Z�����Z ���A�삘 +�p����^���y�\\M'(�p�@[9�N�bQy�T@5D&���{'6̇�N�DƩ�������r��썌�lτ�%|_�l��>��F�\n�	�/�96(e��_��T����h\\ֲhկ˛���%��ݠV��+�GÉ�k��8=�;cEn �K�Cچ�w����]�����O}R��)>ˬu�,�.�O�ʫ�]����@FP>�vf}}��s��c�x43�O���d�i0 2��a��(`١��rܘ@�h ��Ai���k͐G� �W2L�>U���4t���\r�.�1ZΈ6��8s9�L�n9>�vEm�	b������3�5럥��k�9gy�'�	O�R���Y\"�b���mm�r���V��n���.j�@����FT�13� }Io��e�j����!�'_�>%={©�q��~RQ�hK˄<1*[$L#R�蛧��a!����j�'\\ `_�z�%o���2[e��X��v �g*��2w�q�x�o:��a¼-�k~Y�`�0�q��jm�9+����VpIe��,�c�p}��b���l8\\X�3(�y<�a3���>���y~x��+G�h�	��^*Ӊܜ����5�+�^����J���v�����X��<T䞊�P 6I�eR���-�U��)b6�/Mְ�ab(���:���Ӭ6cc&wf��E&]2+R�ǄǑ�\\���@��I\\�	k�������e�3Vxņ9+�f��\\�NX����~\ra����:�W�g*�%�1�D�¡��^�\"߳G�v�[��{�����������??����������o����k���k�t���Y��\\Y������\\F�c�x�*��i�R��bxpo�]��3Q��χ���M�J� $ܼ�h�7 7�͛\\@� ��� �#^����������!.G�#C�|�\rM͌|�n\\߶~`����e�����/��?\"�B�)��bR�\\��@��q��JA����M͌��kݞ5�m�~\r�ƛf�6�`�G�{!\"=����j\"�8�p\\��E��!AH��7453�y����N�:�s�ɇU�%C�2������4��p\\��T����oljf�����M�*\r�E�@ĽA��tX~L�V�o�m!ɇ����ȇW����z+�JV$w!���gw�w1Cx�ݼ��v��µ�˻�a1����b!����xrO>�����i���v;����_Tk�����]q,��bp�䘧O}xWl�Q�\n�d�t��/ca*��/'�9ٮ�Dh�k�p�/k�,����k-]�`�;�6+��m�v��e�a�#|N�|}.�%��-2=�� ���ʐ٢�t,�0X��բN�h>�j4���ǖb�w��9n��S�;Gt��֋���-+�����/��O\\��,�朑T�ee�l��+F�~cյ踽���u,Mǝ��/ ˮ��D+�}�J+ay)��1�ρ�j��\\�jW m�i� ���&�Q_fwi�)}@KĻ� �nnrv���7hw_�,sc��Nl����3�� �r��O�fI�n��l��ʵ �ew&��&��?��m�O��f;ꘟ��ru^��b[e\rS�0e\r3���N���e����i�ձ%4��@�.z�3��R]�+&��z��rܠ�I'?dW�g���Q\"4���ۛ��%��i�s�g�6����)�}}w2)Z���][/��俴� !X��M�{v��}rx��`;-5�6��	�3�c|�(�&��-�A�pګ�������%	�bQ���^(Ϳd7*,%��bFy�=o���d�U�i��[��N�����]��a�ok�{iy(W�gn��YĹ�a����M�[l����4d�3�y�F\\�å����+���YJv;꫙��h\\ߑ��BD��nuooo�|����W?�b��S{j�՟&,��[��y~� b#��N�_�e\"�p,�Ɵ:]2ס���^ܶ�C�p*v�VZE�g�a+�ڄ\r)��J���0_�=�N�^}�=o��ω��t��|�b��:!S�� �n��Y��!E�NQ�c{hؽ�.� *��4(JX�L��Y�H�Ͼ'pV�����'����:���w�]ި�Dh�Dɾ-s?��97o�����n!Gݱ�y�{s��M��:�e����~}�dGX�\\�����%�(V܀��~,�-�i�����jB:��\n�l˫�¯y��w�3;�U(�ڷ�o�I<m��u���~}ww��̀e��\rq/&=�c۬. (�<�z����v^�m��m�ո�B����.N��r.1��c>���.�m(�Pj�*0�\\ֻ�}{�XOy����D����iVa��um\nq��T���0�~�a�r��׾!�<�x ����q���a9�d��A%Jz� 7�W����a��)�ˆ��ǟ	�Y<Vz�3BiJ�?����ۚ]CؔÕ��y���$���{lf�ʕ}#t��V3U=���n3����J�ͰbT���YRi��z�e��l���|nD�]vˡ��9�?�1�e�5a���ª�AC,\n��aF�n�$��`Q���V���X�r����pT3��(mkD��£_1��<]��\"���6����E���)K++m�%ȊZ�k;6�`̸a�1Qya��g�, ���Pk�ڧa3�'u�Y�����>��-;��_��)�ߔm�Z��������2{�k+�e B��<e�������bZ�����_c�-�VDl�h�.�<l��ͦy��.���1�I3�#�v\nz!��.C�2�.�(]��U�2;}Qyݸh�T�4b\r�\"藌Д!<X��.[�Ok����6!:3I��=#c>�S�d!�4kE��qJ��%6���m��T�O��$ \r��ig����5ϱM3©1c���T�g	9��^f�H\\�O�W��+��7���}.F�/j(�̚�Gɖ(!�a�3zJ����p��b;�?^I#h9j	2�AV���ZD�����ϛ�ZkPf��������ɰ����*��#J5�wl�ˑ�JV�����]�s�r�8��?e�O������*1'��\"4���$0'{\re��oa\"BΥ�̓���'�WBk�\rp��3&l���⋇J�0{a5��?|���b?%R�HY Dp�O`�k�D�B�����U0����u⬛Av1�hmh�rR�=�������]��S��/R�\\99\"�|�����v�&��k�u|$0��*� P7B���)S}{2�g�<��ծO_؝u��Vo�7�-��PjL���v�e�V�!xW3C��k������?MG����$U;����G2�a����)CT�q̬�� ��3��H��Ř��ބ��^�}�9��?�+����zvR�bq��ʉƐ��3��p�~���\n�y*v!|\r��&{q���Ξ�	��4���n��!�4U6�o�7�,֕\r�4��f�`���f���.ӆ;��6���j5�6�WSYۥ���\r�[ �\\j�Ҧ��N�?ނ,���vZ�?q���w�ҞE�'BfӦ� ����0�� F �w���la߾w����Ca?r*����h�� ��j�\"<�*e[�:���m!D,%\\|޵�r��CU���7=��=���x�6C<+Vl��a~E��`����}����Q�( }K� H%�o��_Զ\n�D�#S̛�Y�A��6�m��3�j�� S���~P	��}(s �	�z@BB��rC�+�~���� f�@�\r�(����/��T}(,��΀׬�58�-��B)-��Sh���6|)C/H@f}���U~=0�QHfJ��La���	�\r0%��\"�6Q�DW�\rBj��\\P� \\� ���JN@m��& �6�$�8$;s#��Aȉ�(	m����A«���E����)Q���+��-}����0,°��6o�2� z<�̮\"���jۯ��7��mk=���R�&ɸ\r�`|J�Y��;�a������WWD5D5+�xP�����Hv<jü!�������.H���]�Ί��~���J���{׼iv~d_�?���.C\n#�Ta?H�0�3�h	����������/��3���X2�|)�(�B�d$	�Bx*�tɂHQs�����:u&0���k��!h���zz;Dh�������i�U���m���4�	(R������mEw��&ͿF�;7Öp���r_�I������)ZY���|h��ޮ�쾰��l���FQ�zw�]p�e�B�X�U�>I������DC�ʸ�r!��̝DB�=�\\/�'ɸg�8_<�QDbn{17�X.�������Hؽ���&*%a�,ag����U�$$Z�V�����Ȣ�K�=��8�֎F)�$��)��`I�=K�]Lc����O�D��WOB#�~׸Oݴ^�\\�@��p7}��x���GZQ(Jd�`�_v���i�w���ӌm� �]gI�o���#6,�8+v6���u�!��P��{�q2�:��Jjj�Z,&�C�ˤIEa�.�^_�q�7;n�(�W�x.���61\\�������*��f�J�P���8����w(�\\5x6�`�U�w�sB�<g�B�qR�ݚ���*�P@�k&�ϻ2���i�45e]Blt��xg�F�6��˗d\n�����Z���d��-ۭ7�յ]�o���Y\n[�������+�iI�/�_ �\"�ڎ�j���&�#���7\n3L�IZV�I��-�=b�Mf@Fa�v�UlEB���v�j�^���{�����\"�rx�.9:���s1�}m�xI�\r�:.�nA���H�-c�` ��Kw��3�]<�;!�\"'�sy1�F�f��m��4�pR��O�=��[.�Ÿ�l׀l�h�� 7�K˄_~-�#����p릱��ȄP�Bzنj\"�'� ddH\"l|c�2�v��ȸ\"\r�b��p��z\nrF��=�O,����Ru�}�G�w�]FџU��g;��̒%^\\�U��Y��i�կ�g�x_\n�0 -�m�+yQ�#�tQ��ֹ�{6S�9D��ސ��7gH�Ͻ�ci'� ��]`z�_O}��X��i�*>8�_�R�j�XM�u���\n�Kv�F�;��Y�(��=B�C�X�eOF�H��=)(�jƁ�R\n^��Joy��4]�&1����AZ;X͖��	h�k��_�G'>�V4�^=�O�2�>sІ#�o_����\\�iL�qz���~��ٚ3C�ݯ��Z�j�\ne��\\��4n�i|�k���mO��3���u��o��N¢�W��m%$on;\r�(8kKͼX��M�V#���Z�]l�!���bc�3���X๜M���nؐ��k)���jl��0��g<�*�\nS�����!g����(���Ǔ�S��E��d�Ƞ{B�'u/�S?~2��7nj2�3h����4�tp���I�D��L���F����:���u�u`b�\\������E�j�\"tGs�Ne�G�h���mg�\ry������Q�H	s\\�|xFbk�?�� � j[�q�*þ���Yb�t��#�\r��Hņ�&����y�N��T��\n��Ҫ�0�A-@��%���i�+�:����E���=࿐`'a�¯�~�~;Gњ.g�\\6N�f٫x�U��<����I :1��Eb�S�������	3\"t�d�*������l#�9����n>g�=��į��ƪ�J\n��{�		��s��@��p��I�^y����RO�6��)�u��I?,Wg���_g�)_X173���'r�����-�.Z��uB�2�$��Ɨ�<�z`(�f-J�\\La�h�iLI(���M�4�L�%�� \ncU��p��@�DMr�`� ���J(Q����E_����׷7����{K4�{�xP�]'N���E0�5�m�76c�̀W�$���Z�,�i���L�*�BH(�x]�S��hw�N�U��\"�R��o�7�o���n���B���bv޸����>��,__�eD�<V&���+���LŪ.$ӋpzP����N�0���)^�Eq��#v[�M��	�6�ϴ��`G\"c���,|�c[.�W�2��~�GBg�\n����|��e��V��틬�W?������W����>���U�~���V�0ԑgEc6k9�țُ���?�����q��N�>�u����2q��F�����*j�C����!�@t���v��#�V-�9�%�CBf�+�Ic��ۡ��<	�aץ�S6jI��6�lK�.T�C�ڒg�J��~�(2@Ӣ�3���'�E������:��Gt1:$�[��Ҹ���� Z�ȭG���f�dE5�3�h`e򨟯=��X.X����@i������;�C��l��m�$W�����V�v�V��v��h]�.�b�k�tv!F��i�$�4���a}*�;\\�<6����]���=�&���� 㖩��-�KW�&r���k�#r#�������r�y~�K�y �қ����zoon_�o.IT��ڂ�f�N)�D՚�x�\n;w�v$�V�z����Gb�Y|ւ�y���p��,�,9���U�xG,�b�&����k`tk��{\n^�?�Bl%`�~LJq+B��B�|C,�)���K�蝹#ڗ���w��EV�mx�b�0[��\\@x�d;����_���f��[[U�se��S\\\r]�Z�|J0����38�Šx2�t��X����q�G<zB��������Z6��J�]	���c��7��H������<�Pe����r�Im�2R D�3W���j5\\�w�^��[�j;�>Z��r��ĉq0���<\n��uNK7h�W���I|t��S�PڐǞ�Ħ��l[R�\"�~�YJ��W�y/�`.�1��FX�\"d�b\n�.�#�61jj�[�~y��p�*�n�@)2���Ͻ�ci� �mu`z��Bm���5��f�����/�i\"��@x+��X�-VR,k��gv�N��y��\\���Ģ\"��9n˸\rG�g߾|���2�O5d�o��\\2F| �+�?j�I ��x%������ԏ�P9��~�e�?����.�Z��ځU$=�W1�p�ɯǒٴ���J��}v\n��=�S�fa������8�w�V�]4�4��hS��\r��'���>�6�H�$��[Z2Z��0�:��6�m�FgC��omP�33�β�%Fb���.v��!�f � P�\n�:�\"�t��KO\"A�Ï��İ��-�g�X�p�-��Y�F�=«�F�p7�Σ\n���g�c\n�70�`��8��|\n�kfhG�Q~$=�L����j޶Y��f�?^a�I���)����s�{\\�yb��:�b�S��؝�gf?�X�]�� ���v�4��8Ɓ��	���}Lv� ga�H@@�,���>���dxh]��i���B����b��f 0<���v�	�DC�.��Ů�	8�K����\r�����3�>����$7�\\�\n�\n&�|�y\n���*!X���g>�|i�-��A��l5�ߖ���b�-#��.��GP<����蜠Rij)��<��$#�q�+�Q�3ף^�rgQ�J*���F�+��V������;R�8y[���1fK×�K�j0@X�HέkoBp��'�7�U�}rsۺF@�S���w�'i&�F�@�W�f���Ž�'�Ã����,q\\�2e�:�r+#C�F��`���U�5/��m�5��lwڋ>.�Trן�I7o:��F�ݵ����������sۼ��7�o[X�W>�f�C��\r����W����QD���)-*v�L<{�8�~�~߼a;_�H���Խ�u/\\cx��f�|��{� mlv	v�j����YvQ^Vd\".?���3����=�k.Jp$��Y�m�<Cx�AK�G�Ǎ`�{ɠ�tf�@�\"�Aj���8��+t�\"k�/}�Hz�j���=�mٲ���Ĕ��%����ש��E��eO��{[��9U��d�t �,Jf�F��X�����K��.2����PF�[+Ć\nF��UPDLr��j���d�\\p~\"f�\"a%VI���]n��H	C�y���#o��xڦ�����BP�͛�Ɵ��?v1�����p�R��f>�rg�0�;\r:��z��E��s	��� �8�v�UW��'Q�4�L���Ԧ(�������3\":2�6�a�Hd��m��@��y�n�:�Ś�7�-�X�۹��ν��:�%)��~���β��U�E��4�(�;��Y��X�3 k��L�y ��� ���b1~EJ�2� U;���j��-ײ]��<��(�;r71C�k�'A�.��#Tz�J�0*=��җ�%��hDT�`�T�������qZp�ռ'���]��E*6L�H#�	�l�DRu�\"`p������5q3��R���#���D��)HWR�]v.���m��R��Ijk5�ݻz�;I�k뮹S@\"�Uh �h�Z���R��nۏw�;X�z���.�c�M\\����0ʊ6�N\nًrıvyt��x�}�'�8��TK����iᤸ�)`�Sat��-�����nH����AV\"�a7ܮ�#�����?�����J��T�9٧ZA�� _/�˱��9`N�yK�	���9;�����ʋ����49�[��L�4�w0�Y�?����m��Y�4E�\n~s=aN�k��bK�n7�\rY%�kM��Pk5����Y����!�[m�O�/�(����22;)���t�x4$�7����$���ӌ�(��m�,T�[)Կ�)Q��w�}h�DB��I7����z���>�����V�u�����fv������-��-I.&��(#	��%�vW�0��VpY�-lq�Ѫ�J w0�&����2�W��.�@R\r䄒�k:��2\\tGBk>i&�l�i<�Y�!��+}= y����Bt�n�o�e|��\nK�.��0Ij |̤_^��`.��K0��L�Zj�}�3��r|��3\r����v��w���� {w���DosK�d���Kv�/�Sl�\rT�e����Ml�!l��t���I���� 0�^�e~��z��~$�`K��R`EO�;�<�o�q�j�G��2�՘��mŝk��a˶W���3��E��z�g �{Bp|.���V�ݶ�-v��L�,�Ȯ���N�\"yYkV�ݪTq�y\\�]���xC�@�u ��`���/�q�_�Z���?z�Tl��}R��fki)�l'1��}��O�M;��~�lj��M[�f�ިPк-8����;��r���f�I+O_q�5�-��-H�УuZw�ur>����<�E�`�t�����!s��U6�<�ݜ[7��[+���F�]ϝ�*�ߜ�dxBa𭡝�§F����V?���Z2BV�I�M(�@R�>�zX/�dl����4-X�7���?m��U��>�WYO�<5�VV��w����	�&�M6bf�\r���6�0b�5�\r����h\r�?��5�G6;e�3k2��q=�A��`h�`���L^\\���x�0����_�ܚM�o!VD��VIByD-��(�Fi࿌9A�42,�ðX�xJ����7(l�?kT̕̋םP��g�J\nҕku%���}�Hʒ�{����B�ƥwFM�H{nԞ^���2��-VE�	�x��3� ��Ho�L\"�	>����$����ԫ�I�S�\r��Q��\r'����C���/������C��=a5��t��I����=�8�p�Y�ǒ����3�J��}��s�t�ܺ�Y�����u�6��]��a�柎Yg(X�ɚa_�6E�d���x���ZD�z4����G�h��[j�q�ِG������b�$ή��v�|�~���P3�\n�m� R���HX2b���\\Z�gg�>�y�.���%�����xً\"�gg�|�	���L'�f�p.	6B85S!;�{����J���K8���I�/��a:���f���/н��� ��ǂ����H-|����\"9�m?	���]6��89�8#�:Ù�{���c8h�cÕ?񩆹�<��<�]��&�W�s1�;{C���D��O��W���sd�ֹVLh݉Al���2��ҏ���$�ma�@�h3օ�j���͉*�XT����f�`�����r�=8lA���Ob!��\"��t�^�6���#���|��T��NU��O*Z��ybT��ӧ	D�<��\rF@��������~ɛ�/���V���2�>���\n��̝b�5�����m�0o��:����n1c�Wl���k��Z�%����C��� ������Ȇ����kOaX�e��C/~_��[xĕ#d�b�J~/��D~��ȗ`6(0&P��d�g�@th��1�>�T��0�aJGe0��B���]Q�h+qtj���;�Qa0a;��Y���~]>���Ono�z�͛�y���	v�9|*�J��T�л�w�o��U�VɁ�BV��{�%�������	�XyDj$�ֈ����uo!�f!҉�X�r2E�2�D�����`XO�n��,L��X�S��.��]�,d���j�:W��Ȍ�1e\\6����<`ߞ�?��g�|'R24�<��8�<e��5��O�t��7a�b���,l�0yte���}8��Jg(Nu/*)=��=-5�}����r��kP�?�Ky�I�2�2��2�z%9_������� �3Bq��-�<�}�ÕV�����9�E� �ʺ4��+��\"\\���h�nq����h��uUTx�����m�e;Z��e;F�v����D���+\"|`λ�'�=o�[���H咝pZ\\v�c�0�.#�(l�\n\r9�@ܪB���Br���?#k�3�&P6�A�`��`�3�����0�5�@)C0�$&*�0J(&9�`?�ۮtmR��\nPK@e	��k��`\"+h׷獫�]��*o�}�НO��zu{��d���ԏ+�'�xs�;ט�ϟ�up��a��	3�^�n;�[��,�{�mޯ�Y�yv{�i���m7�WX�`���1�j�{�1Y�'\"&S�B|�[\nw����d_ʭ����^�h�ڀ��=ma���6�9K�P!;�<eoZ�k��qip���Zzg6����,-��e B>'�JՑ�0\năN2zj�\\�H˄d�ħ��ځG1r$^h�� R��#�jg$���@�2�d,Jq�2�s�p�#��=v	;�V��e��ƋnZk.��(2;.�y�F>���`jR!�%!�����at�2�(�a�*�������� [`<�I�//T�&9�l~��es��>���V�r��͔%�H����Tԟ���L�A%�V�k�˸-�W�I�/=�D�M,�e��a�'�c1&�O��Or�t��	��aT�S����l�M�@h���_�`����C��\"U$xl�p	K��+Ѹ�k���;o�gXr��v�*�Wٴ`<�~q���_����Yٟ�C��F5�cR!�E��r�&7�J�~Z=0����Ld��pR[��T6����n�lXC�&�m�\n|����ӟ��on�ް��Y�}LT��t��I��VC�һ��ޏǘtȑ�i'����aVi��|�U���Ԭ��� \\�̪���_!�dl�����om@�'S�L��g������6���F	��Do�4�dm����E��v�հ��1�:0SՀ�����J��6q]s��lY�������4\"鰞z�]�o�eu��\"���~u��]7�o[?����/u�I��|n8��=�gW�zk���?K�9ֱ)'7�DOP�����搎�\"�u����b3)�z��T�ff��(�p�[^=\n�cX�)�k�0��l�>�����5�)�pı�&�eؖ�8�&ͫ���q�� �̷��G��`�%-�Z#aW����mmi�=`R֛q�S$WG�<�P��V���bs/��Jrl%�H�\"ܱH�`''�F��,��&L['��;��U��L,����.���G���B���2�\"�;i��wm(A�Q��uֿ�Hf�xE�R��GI�l��<��+���	�U������t��N���[	ܢDL�yN�.�L���o&bO�o#1�޺�(ڿ����+:)��^���.��h84�^J�q�H	EO�BT\"DI���c��(	��\"H����5�8	w��*X�Q���*5X��kZ��$$-�2�D���w~?�+e�����r9��DO:qB��d�z�2�$V��#�zl�}*��:,���q3<�VS���+�\n��y<�-�L`�k%]W��dZS�[�؃�{J��^1�T�D�{�=ְ/Lr��TV��̈8Vqϻ��le�>�����_��əY����x�f��Y�?YO.iv�I�zL�\rk�+�@:��i]Q���(K�H3\r�܆vݕYX�܀+�^��d�@ܙDw��,��^fg&�9���(�YD��%ݱ5�aL~�C?]=L���᎖�������\n��hs0�8=C )ڼ=������ɀ���@$�ג��B]v/;�v��h]�.\n|����k�t>bƧӗ욻�b\"��F�\"Bj��P���D�g�	@K��Vv8֕a�`�����?��8�[{A�8�f����\r���$�E��F�b��_\"-2��*3#���V���aB���W��Kf�[��B�Ԛ���ٞ\"��K^��J(�k�[���O���ho�N���ò�[)1^!�C��k2��2=�c뺟�(TNBk�ua��cR�5P̃�8.v�nȊXW�X���j,}��y�����:'����U�q��R,�6����J�wǥ�kW!� ���َ�ı�2t��{��](bd-��֢�K����MK�?X��S����>r���k�}�Ϡ�5d�ʨb�Q�F^��SߟX���'խ{L��(�&3	�4�l�r���?I�jJ$���נ*1nu<F�c{C��Ѯ����F݋P������`a I��$�8�+Kh�GKE�p�=�'�\r�e_��J+�ɛ����A�J��N]�w{?��q=/=H�t�d�Q���q�h@3��=L%�k�<�C��G�Q)ɌB[�\\h�{�1� �]+��e\\p3�ƊnzY#=�Tć[���k9�f2�$F���7O����[F0=?��k-��ٲ�nΡ���i���Z���Ç�g;�B��ߙ7m��l|ҜА}��|$��i�S�;�2�v)�iU��Z_ �܋;fz�F���\"��B���Kz��-�o&\\�?rk|������c�	�*�E��'eh��@؉@O���Q�Q�|�Ł�8}��{�5z�������~ɛ�/���V���2�>���\n��̝b�5�����m�0o��:����n1c�Wl���k��Z�%����C��� ������Ȇ����kOaX�,�������-<���Z1D%���t\"?[��E-�E�ཀ��9x��H��GVIt\\	�ǃJO�s|���S����^��gvv'�xGm3	Dv߯�탑�nt��[�}��_�3�}�4c�l��ɭXn�>x R��0��X� ����t��C�ܺώ���3]0��a�x�py�ݱ�s|WouX��qs�.d �Nv�'*ټ�pzj��,�GshN��G�f��cj�q�ِG�������{;�`�O����foO�1��R3�\n �mA����YFL�%&&���)=Fze�'dZ�'�V�֌��G6W1n�a��\r8�z�݇j���#�L0ac������9vՃ��,�B�WA����|=���؄K�:%8�e2X�`%��֏�\"���:ǿ�������Kt8��o����Q ����a�p�����Cp뀓�41�5BW��ׄ�`81���,B�_)��8�w@Ė`*{�AΝ���¾z� ŚPc���Y'���\n�i2T�U�ۮ\r���<���w[��4DJ���H<�Bh�<�>����՛Y3흻�*�۾�Ey��N�n �}�<�5�9�sFp�U����?J���3&N3ʢI����vSNh�q�G�e�������q��������Zk��H�e�\n%��	����`��㔴��I6�f�Dn��ZЃ��g��^y0H�֒������h��z�U\r��6ڪ�Q�2@F�mBl�:^�X�yH��\"~k>N(`��z�_���o*uqB\\��1���)�E��E��*l�_�-�dl�>ٝ�a'� @Bp{}�P��x��p���<x�B y_^G�\"�x��[�*��q�z�7n.�O�)�i6�\\�;7���_gs�K�oq~k��[;�j~_�b��{��b$f��(R�:��S�:�T����%�0�}�c�$'��]7����{{����͵`~,(tNU��k���֖z.�:S�Z�	?[�N4�Ç������j��mJV=f��&k����ql���Y������.�E������)xq#�ۊ�jǬ�[=�{�	�\"n����q��>rە������;�'��ܲ����� �޵{�	*Oۈ��cL<?�O\rnB�H@��z��r9a��GZ��2�!��� ~�Y�e�@y�L�19�Z��=�Kw�~\n	{�k(ʵ'TfQ��u��\r+]���B)S���怕��4���S3\\���8T|��{����԰�|qR��ùOp�T_S�R%!	�y�CHd���E��˘�\"M�VW}Im �*�-M�ּ��g����r�u�[�w��GW��Ѽ|�9fgj����A�m�2p#�PE�⊼�=[��4���%������f�^̍7|��M�����.+xk���6@�*�[\"����CDL���c�ٹ��{����W����Ӹ��H����J����	����.�z����^���b�����\"�y�+���� ����F��ܙ2x�����~~��-�,��H��B��G@�2�����a����ݽ�e#�Q2bG���U��u닶(DB�و�n��|>�9g�'yȪ5�9@�X��h'��5ש(჌U8�ټTBSP<���F[<2��pQ@�UK��{ q�q�mV�b�O��s�|iP����$��yF\rA�H�+k�k��R�MJ����Bi+m�����R|��N�smA�Ԙ�,)tk��b�L�����^�0\r�0�c�i%�e��v��n��Q*�H$��mb��qNP�p|�V�Г�/y1�� |�$�\\�BlRw��&�τ�b�Z�a%����:�<6�΍��; �7F�$�e���?҈��/XdKG�g��HF��2j؎�$���G��z��cI�}x;�`d$l0���Y,8�������*q�$&E�\"9@Ef�\"��=B���D��ˡ'�������O��.Hl�P��6�>	��T�3��H�\\�]��1�$�QyI{��kX��WJ�q�nk��ֺ�j���<���,�:��h��m7{�@[m����K��̅��/3saZ#�p*T�3E���!��euX�gZ�͢I�S�3����ԝp�6��jMB����x8];u],i�t%d������ �#^��n*�\r����F�{r�5:m�9-Cc�O�Y�ߒe:�f�[e'�jhH_�	�g�����;�Pk��>��9�~DB}Q>́���+�6���f=�o	.���?f���<W�PZ�k���oO������񀇞`��<��q�<\\�0o7J��`ڼ���d��b�aJ]J��GJ74&�Ǖ�0���pb�S��P��^T�3 OKh�a`�a�\\+]^��� ��2�.������?t��^ۉp?J�A�d�Ʊ�l5�޵��B�v�>ٽ��:)���j{��=�j����Ԉ�\nِ���S/1�f�N����Sin]�Y��JW�W��_�1܅��ПP}��1��������(GQ���#�H�o�v���#���� ���<��O�2�YٔB&�+�a���wl�N��;/�cQ,C�㜝�Sv��{��\rC(�nb��c�(�P��K?X�`��L���N����Ra���3C�ݯ��Z�j�\ne��\\R�.��8�ػ8�\"�,�t�ޅ����^z��p��}B��eI�?�zIxs�i�N^�E�4V���X�h��x,0��@���5O�\"�\n6�Y{'!�'�0�X��̚}[-7���R��@�2o(�{6�beO�}	��E����h\"�I,Xq�᫬�fa\r޵��\"D5�?��7���������h�Pe����v�J> o�`-2f��}XS�oq�4/���F��Ơ�. ���<�H�<(���NFI,6k��Ь7�T���.�f��-�]+�pܙ������Y�rO����T��uw���y��9�<���vzn��lf�F�7��T��}�o�{���$�e��Gv�� w�P��f���ub���%��\\��hv��Hh\r�M���8���9�AG��Uh���c�J�\"\\�|���Rpʬ��+.cG��s~֋��yo\n�U�햒ݿ&b�(T�?\r6��<��K���1a��퐃������\\ �i-r�#�����@@��_+�۝�V�]��:����������	��Y�%e��P��S�e�˥�H�K(�*R���H�zp#�<�J�V�U����7[��N�M>c>{+�GlM2O���t���<3�RËD�\nQ5X�����Ra4���I�\r�ի۷�q}����Y!�����e�Y��$�Z�t��M��c2ן*�����ʇI�5�ՀU���Rv�B	| �Ok���Kk��Z��8tЗ�-&���@\r�đ�$0<*��3Z*�`.V�E�`�ZyP͆N��L�d�k������E��jA~f���\"�JBj�0__�5f,.���C�=�G5w���v�q�apq\"�E��:m��ž1��}�h5ؽ���]�H�]K��3m\"%��I~�1�o�4�\"	�KK0�� ��uk�V��'ø�ÝTIb������T�{gl�J`�7����%W���t��&��3\"4��ݣ�N��ҡf���F�����	0�F;o���U��a����>��}�:��NT��w��\\--*Т-*0ZT���pB6b8����0��=&��:��5��pOX%Nf\nٗ#�SIA�C�p[^�>c�d���������jk���^���P�Xo�Y������U���y��-f��`s� ᳒L�Z���N����߹ע���t�3XX,P�vOv-$�f֨��ԗl�PQ�\r�4d�. w��$ڰ��??ct�WՎHu�>��y���1{��� ���W���y������l�<[l����g�N�u��*��W̋�Pc/P?����?����nY{�2���2�H�VU��g��O��;{;C��ĸ�U&쾊�$q�h⊥�J%#� y/��b���?�{R��c\r��������ãu������g��*�'���G������ц �Ƃ��y]qa�-���WR>���j#j;\n�2Q0Q������%�%��M�okj!ntdɤ؊�����%�_�V�{MR��D�\n\"�_�(J������e����W?CtJt�q���<��;:e;���\"d/���|Y��A Y ���$YI�~\\Dyty���[D�D�e��R�d;<�X� ;��.�R��'m�1�/6�5��H��\\��Y��οysM�I�����˽��6َU�l,�9]�W��I����I����$W?6��Q!HԳ��L�ib�9JTJT�A��M�Ygh��iկ��~��#���x+�%��O�U|O����E���kL�v�{{׽h]�h�h���h_��~�U(�O���&�;51�T��Y���{�Ο�]��SD����{�\rC�y�zao�F��/T)�CWʬ���8&k˟{г{��V��.�v�~��x�t�����mCq�k����HÛ?8��صƥ�USo��y?c���~���d�NVG�����x�Z��M�/���۽�k����4���)�7�qZ���o3��7��Q;��;$��᳔�_:� b����P��� I��Sߣ���ǔ�2��G�0E��O�/	�b��v/����?2�;���h�����ȋ�V4�p�C)� ����lFg��h���aZhyM쳻�%�2��e\"T�`h����R\\��R)����/9� b`���E������z�]���U�\r�|��2HbיF3�����\n�T�qE���i��3�K���\n�@t�Q�عz���M�l<ض���(��i[ˑ��m�������J�}��p`bQ����#�X������l�\r��`�VBlA��]��n#kL�Y �E � �6|\n�/�����v�H��'N���(�r�ڎ|�б3̰z��\\��|�d�%7\"�0�(\r�w{Z_���!�:�E$8�,�]�BJ���A�����ݻΨ��F�,>�ɗ�e�3��P���\r@гF�u�\"�(ֳ�Űz�<�h��	�yt����\"���8��xB�*�,��`���Vf�P'�������!d����X��d6p���S���G�g���`$㟎�e�Ґ1�T��fە��>�\n4+�u-�0:g[���lQ$4��zGh���m�:���C8��M�P���䥝m� ��^19�Tl�]��ν�QQV��,�n|�z�*e]��n��s�{\\pL��-U��Dw��I�r\"�q�b�+ƞq+aCP4xB���I�F�¥.�p)����i7��24����3���)�F��V-��^ھ��U���O�������P%7d5/6�K!L���Ƙ�Y���)���,��(ro���]����2D�s�Q�1�e`p\\s}I ͂4z`S��ߕs�Fhm�8زX�s9�K_wV�K>c	�yA���z��\n��:j��ר�(��	���f(\r���>�h��\"�+<�\\����\ry�T��y��)���i���W���| (Ga8\n�Q�cT�׸f`wL\\�ױ�j�'C��f�2Ln��>m�ވX�')8 bxO ��`z\\E5�$/i���C��5!�Sz�3����v���fFD��[����j�y���T����[�0VRlV.�}(��#�['���B?��*Q�<Pu�*�x`�\n]�߸L@Bo�SB�F�^�Om���f(F�\\x[%��TU	Fb/�F5V�DS�0��2f��B��#��,�o�-�8)Zͤ���<`Ͱ��+�ڝ��J���'�,ܫ}]�S��hw�N��'�/�r�|�L��J���'�^I/�z(ho7E$)\"IɏP�i���Գ5+Ri6'�v�{/p�������6���h�r�\"��(�i��([ަ�Ǹ\rѶ�� �6 QlMx�]��H�!B�OB�c�w�bA�O������g�g���p���k���u�\\&�6�J����	��(�4�R�џ�v�)|�v&��B��3!�֋��x\"݅��>�:�}���n槍]p�⥈��}A �-w� PF1K��*���T�h����*�i��)�{����!u��ʺ�����;⡠%�yt�7T��sU(���c���fv.��Ka�J_�{�\"��*��1�nD2P�D���?����2ŧ���,��Eppoc_��6>3Cp�{Jݻui���@��\r��X��Vq�lĽ�q�`s�weh|�%�׬vY���b�r�+�B� ܮ���ߡ�`�^熌�5A���6X'ͅv�2�@>�px7<�h��Ln�Hp�o܇�|Fǀ����`ڎJ|�H���I��AG*F�[��n'N<���~Y�k�{1q3&#	ùZ߀{�vf \\1���t�e��qԃ�`܋��ia\r����|�3vF,���n�@<Np� i�k�`��(l6<�ժ��Og���P�Ok�c����.���A/K�4���\\Uv�Dƚ�f��/<�������\"�n�26��r�7��@ط�����������G|�!��<�R�X�3Ŕ�֍U\\�\\�Ӛ2n�H�����c\\I{���R����\n�����|���3\"F�HB\\q46u	���%�+ *�\r�j��tz��<��ٗ���3�b3���@z���J��`	����ez��d*�������l>Ä��m�=T�{VB�cP��>X�W��W;,�P�I�;h���U�Ԩ���G�=?@~'�Ҥ����[[YEp�;�.&O?:�w�W���� ���;}�\\3��:8�s7ɨv��\"\rpH�w�x��n(٣U���}�I����PK\n    %�\\�ښ�y  �     word/styles.xml�X]S�0�+��kii�aQFg�]���琦��M�I*��~����A����Bsozr�=������(4�㘒�iwLH}LfC��ar�7\r. �AH	�K�͋�ŀ�e����͌P���.l�X؞iHT��s!�eq8G��4FD:�\" �ͬ��$>�4���Sb���N����]Ph`�.)L\"DD���P()�s�m�ڂ2?f\"�e&�p�Lrۭ E2�i �%Q\n%_�;�S���8�J�O�%\n@\n�����_J7�!�Cs�0��/�p1�L���|+U��4?�ph:Nf�M�������h5�{ZIJ,cYB1``�@<W���h>`��8��]Y�p��#��<ߕ�:v�^D���$�*dlM��Ui�l�ix�R�F@u�]a���&HC�r}�N�o^Y�n��ݲ���4RtLѩQ�iC�n#��Q�'��I�Bѭ��@�m��I�<��+��I�k��� ���|� ����\nFɬ�6��t����{���\\��r��k���b_���K8(�\\�X��SU��S���L�ն����;�)��l����9�ѯ9\"���:^�;�S�Ցh��nOx=�	��P��Q��<oV��@�0X>�-�E��>\"[2!��b�Y�O�2�}z#c� ����P�mŦj\"�a�2���!֧�@�{#��TRV��#�Fj������DP��z�l�tj��N��S/g5�`��:;;�SS�[+��L��_�6���/6��^�k�7�Z�?�2�rJ���>+J����SoxM��d��d�n_��PEs��zmٴ�wA�PV>Z��#o\\���\\Ժm\\�>�.�$�����k��rb8�����6p�[s�Ά�Q�p>Q/��s�Ϟ��_PK\n     %�\\            	   docProps/PK\n    %�\\��Z�:  �     docProps/core.xml��]o�0��\n�=���L�ū�,�f�wM{�f�#m'��WP3ovپO���@1?�::�uB��	A(��P��W��	E�S�i���ͫ���i�V�^���G�����79Ǝ�AR�B�p���>�ʾ����K�SOq+�MoD%g���غp��	�;�&)���ttɀ�<D�aO����i�fܡ����oݨ�P�����,g�׶Z�XQ	����v�5u~6���O�o����JU����}v�B��<�5������Q�,N�+2�'$�L2�6m�;�M*/%�m�\r�WI�5��q�_PK\n    %�\\Yq�        word/numbering.xml�Wˎ�0������4}(��\r*�%Q>�M�֪_��d�cςl�Ɨ`�M�ڔJe����s��}����F�+MO@��y*2�g	�8��O�3D�	Xb\rno�˘�l��u�X�f\\(4�֡\"�z^)�x�블i���B��1C��H��S�I�b:%)��P���~I%R���x�x�t\r��	��5N�b�ة�A��\"�W]\"C&����~��	���W� ���:B»\n�i�07#T�Z\r��9��m�E��y\rR<������igp�Pi�\r�!�U�+�O#�'� ��C$�r�J\"|C�*5[�\rz��� rv��T\"�4rڈ/,W�G`�y{k�41�Hb�Z�h�Pj���ۙ�2ۺ�k;�¶[)���NϦ��\n�E�\n��Ԑ׸�t����Z�ˉ\"�g������.�\"0�m-�Q:����	Vq�9޳fq�S�M�8����/����^�x�v��Ϭ�-'`:%��Yդ�}��µ3�������X�A�P�E���Ǫ�~���8�p�B}t!7Ǌm��w!7'궩���ܜ�ߦj��~Цj���V�p�E��s����gz.��Wi���������=X�w�;�fo���mwª9�\ry�g��ߓío��_PK\n     %�\\               _rels/PK\n    %�\\����   �     _rels/.rels���J1�_%̽;�VD�i/R�M�>@Hfw��&S�oo(�V��C�����7C�CةW��S�0mZPmr>��������'���2�\\Tm�E� ���(�ҤL��t���z���/�'���-�O�2��i����ھg�����[zHv(ʙ'~%*�pO��-�C�Yn*���r��'�@b��61M2�nO�[��<�r9&Ƅ��\\��#7�dr3�����I�3_Jx�1�PK\n    %�\\�����  8     [Content_Types].xml�V�N�0��(WԸp@�����\\{�b�eo\n�=��!�R��e=3;�F������B4��i1�3p\n�q�4~�]�W��Ӈ��1��i� �BD� +c�#%+��P	/ի�@����B�#p4��#�Mn��MM���<����&�wU�ݾ��*N��^ŋ���=���'����\"���);�T�W�eu���Q�Y�Jz_%��b���9��3(�-'.����9|���ɰ,����,)p^6�٠�I�5Q{m���h����*�������Ҹ��<�@��ro��bKY�� 9\"}�wXa���,�� #6����』�F���|a�DB{�uK=�9�mҠ��փN�5v��w{�D$�Էq[x�<�=6谟�S߇�F���&�'�x����з\rkxB���OPK\n    %�\\Xy�\"�   �      docProps/custom.xml��A\n�0�᫔��T\"�i7��Eu�ihfB&-��F�����k��_�\r�8&\rǲ����h���o��\rfaB\r;\ntms�0&�Rd�DÜR��;�7R�L���Iy�I�8:�W��GJ�TUgeWI����׫��/9����g����\rPK\n    %�\\���ړ   �      docProps/app.xml��A\n�0�᫄�m��Ҵq���ɴ\r43!K{{#�p������BbO�屪� ��<NZ>���\"g��,���,���'���@�r�96J��!�J�RFJ��2Ӥh��+�W ��T�g[t��ʯج�_ԑ�������\rPK\n    %�\\��ɑ�  �     word/footnotes.xmlՔ�N�0�_%�uRZEM9�@��} �8����l'�o���M�,�\n=q��f~����w��V8/�$[�$�C)ͮ ~?,~��fJ�����'��u�W �@>A��ygyA�lN����/��<Ta�AS�*����t�f�0�����1�2O\"N�O+V�4�t;��{k���*�{d�7�q&���$�w�GAq8x�s�.��-L\"R'j �ki�4�K��� iO%�jE�dW���ޱ�x��rt�jT~���gt�GL�H�7�A�f�́�U���f�_�>���<:h�L��ў����/�X��ǩ���lkf�j�?�8��P�,��'�oM������ޢ��9�ܒeA�`h�ϳ�o�h�� �v����}Ϋ�i���!Y��͚N��'ηa���-Sy�j^D%��\":F�j>��n�=�A3��>M��	�4�+���z�2�4�SU8Z��_PK\n    %�\\�w��m   {      word/_rels/footnotes.xml.relsM�A!E�B�w�.�1��n`� \rV �Pb<�,]�����~�n>�4qp�,_�I���};\\`]��ԇ�1U5#u{�WD��3�T*� ��2�1[�J�M��d�����PK\n    %�\\?J���  �     word/endnotes.xml͔�n� �_��>����ʊӋV�����Ǩ� ����w|ζU�67�1��o��1�o�j���y	� �2%�0Jiv���a��l�].Li ����ygyA�lN����/��<Ta�AS�*����t�f�0����̴̓	����\n��8�.ݎj�^�@�eA�H%����i��'�\"\n�]�Q�4<�9qG�;��&�\n5��s_��a}����h�\"���e=�s��a�#�����&f����	��<(�L�9�JsT���� �� ���9�4v���h��5���kj�qj�21ۚY����;��(T�-K��I�[��'��h��e�p�dY�E6�������[�1 �*��io�d���*.��>\"k�Y��>~��6�U�e� ���gQ	��&[O��������Q�L����۴�����OT`���?PK\n    %�\\�w��m   {      word/_rels/endnotes.xml.relsM�A!E�B�w�.�1��n`� \rV �Pb<�,]�����~�n>�4qp�,_�I���};\\`]��ԇ�1U5#u{�WD��3�T*� ��2�1[�J�M��d�����PK\n    %�\\M��ʡ  s     word/settings.xml���n�0�_��}\"�X���[t+��b�E�`%�\"Q�$��ۏ��?@�4W�A�;G�����d�\nQ;�X��Y�P8�����??V_Y��PUl�\"���ʨR�C1# �r�bmJ��<�VY�k�Ep��i-�宮�P|pA��w;�P1�;`��q�=�y��]���34�B�t~EtI?k�Ӗ��Ռq��{��`hL)'C�e���N)�NtVa�)�yp[�k|�F�v��]���ZP|9��Z�1��d���cb�ёq�8��k�ى���J���i��� ߜל��:���y�G�X�>��o�˫���<���ZQ>6�<rD-˨���[�q�H���7��j�r��ǐ�ޡ�-�O��Y6�=���`�b�3ӔXvO� �O�����_\r�_N�1ԅJ>J�E�/���?PK\n    %�\\��9��  �     word/comments.xml���r� �[q8W�XS7Ӵ'���x����4��ѻ_R%I��N�G�$ߓ�����I4�#5�+Y�|���X.�5x��܂�uH�(Ikp�<=>�VBP����V�T朮 ��Q��Jpl�U;���B��qL!1��6,��b���'��ld�m	P��\"���l��]��K�|�HڤI�Y\\�&�t�&�ci�&E����4���N���i�P �y�Kk��o�;{3+���LH�zA��l�\nEh�&AQ58Y]��|���_?����ȳn;���.���k�י���, ǟqM�������*C����o�(L��>_��)�����g1�&�#�OL����!��o���jF��� Pb:����j@<�����Fp���d䤅�8�f)E�v��!�,�t^�MϝŨ#��m#�uЃ�o�^�c���������ma�0�)��PK\n    %�\\�w��m   {      word/_rels/comments.xml.relsM�A!E�B�w�.�1��n`� \rV �Pb<�,]�����~�n>�4qp�,_�I���};\\`]��ԇ�1U5#u{�WD��3�T*� ��2�1[�J�M��d�����PK\n    %�\\c�^�  C     word/fontTable.xml���n� �W!�+���i��,Kv�= �D���Է��k�����|l�Wp����+�Zf��P[�����b�E�t�M�o��~���5�H,�=��*��ؖB�jHZbk|��1����d8�ۅBhe��l��<�\n�`�+\nֵU����}^㒈��Ҡ]^�.tP��1�����Y�=A`U@�:.S3��z*�WY����P(s�gl�Hɩc�<��'���� ��nf)�0W�ee���f*�yE�G�݌@��G�A\\���YZ�av�\\w��2���_PK\n    %�\\�w��m   {      word/_rels/fontTable.xml.relsM�A!E�B�w�.�1��n`� \rV �Pb<�,]�����~�n>�4qp�,_�I���};\\`]��ԇ�1U5#u{�WD��3�T*� ��2�1[�J�M��d�����PK \n     %�\\                            word/PK \n     %�\\                        #   word/_rels/PK \n    %�\\ƚOe�   !               L   word/_rels/document.xml.relsPK \n    %�\\�n �Y  p�              �  word/document.xmlPK \n    %�\\�ښ�y  �               �[  word/styles.xmlPK \n     %�\\            	            C_  docProps/PK \n    %�\\��Z�:  �               j_  docProps/core.xmlPK \n    %�\\Yq�                  �`  word/numbering.xmlPK \n     %�\\                        �c  _rels/PK \n    %�\\����   �               �c  _rels/.relsPK \n    %�\\�����  8               �d  [Content_Types].xmlPK \n    %�\\Xy�\"�   �                �f  docProps/custom.xmlPK \n    %�\\���ړ   �                Kg  docProps/app.xmlPK \n    %�\\��ɑ�  �               h  word/footnotes.xmlPK \n    %�\\�w��m   {                \nj  word/_rels/footnotes.xml.relsPK \n    %�\\?J���  �               �j  word/endnotes.xmlPK \n    %�\\�w��m   {                �l  word/_rels/endnotes.xml.relsPK \n    %�\\M��ʡ  s               Im  word/settings.xmlPK \n    %�\\��9��  �               o  word/comments.xmlPK \n    %�\\�w��m   {                \rq  word/_rels/comments.xml.relsPK \n    %�\\c�^�  C               �q  word/fontTable.xmlPK \n    %�\\�w��m   {                s  word/_rels/fontTable.xml.relsPK      |  �s    
                  </div>
                </motion.div>
              )}

              {activeTab === 'data' && (
                <motion.div 
                  key="data"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Registry creation Form */}
                  <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/60">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                      <Plus className="text-cyan-500 h-4 w-4" />
                      Stage New Record Entity
                    </h3>

                    <form onSubmit={handleAddItem} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-9xs font-mono text-slate-500 uppercase mb-1 font-sans">Entity Name</label>
                          <input 
                            type="text" 
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="e.g. Navigation Bridge Unit"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 px-3 py-1.5 text-xs rounded-lg text-slate-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-9xs font-mono text-slate-500 uppercase mb-1 font-sans">Functional Category</label>
                          <select 
                            value={newItemCategory}
                            onChange={(e) => setNewItemCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 px-3 py-1.5 text-xs rounded-lg text-slate-100 outline-none"
                          >
                            <option value="Cortex Matrix">Cortex Matrix</option>
                            <option value="Quantum Field">Quantum Field</option>
                            <option value="Evolution Core">Evolution Core</option>
                            <option value="Operator Terminal">Operator Terminal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-9xs font-mono text-slate-500 uppercase mb-1 font-sans">Current State</label>
                          <select 
                            value={newItemStatus}
                            onChange={(e) => setNewItemStatus(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 px-3 py-1.5 text-xs rounded-lg text-slate-100 outline-none"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="IDLE">IDLE</option>
                            <option value="STAGING">STAGING</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button 
                          type="submit" 
                          className="bg-cyan-950 border border-cyan-800/60 hover:border-cyan-500 hover:bg-cyan-900 px-4 py-2 rounded-lg text-xs font-bold text-cyan-200 transition flex items-center gap-2"
                        >
                          <Send className="h-3.5 w-3.5" />
                          STAGE RECORD
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Data Registry Table */}
                  <div className="bg-slate-900/30 rounded-2xl border border-slate-800/60 overflow-hidden">
                    <div className="p-4 bg-slate-900/40 border-b border-slate-800">
                      <h3 className="text-xs font-mono font-bold text-slate-300 font-sans">STAGED RECORD REGISTRY TABLES</h3>
                    </div>
                    {dataItems.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">No records staged in memory. Add some above.</div>
                    ) : (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 bg-slate-950/40 text-left text-slate-400 font-mono uppercase text-9xs">
                              <th className="p-3">ID</th>
                              <th className="p-3">Entity Name</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">State</th>
                              <th className="p-3">Staged Time</th>
                              <th className="p-3 text-right font-sans">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dataItems.map(item => (
                              <tr key={item.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300 transition">
                                <td className="p-3 font-mono text-xxs text-cyan-500 font-bold">{item.id}</td>
                                <td className="p-3 font-medium text-slate-100">{item.name}</td>
                                <td className="p-3 font-mono text-slate-400">{item.category}</td>
                                <td className="p-3">
                                  <span className={'px-2 py-0.5 rounded text-9xs font-mono font-bold tracking-wider ' + (item.status === 'ACTIVE' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40' : item.status === 'IDLE' ? 'bg-slate-900 text-slate-400' : 'bg-yellow-950 text-yellow-400 border border-yellow-800/40')}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-500 text-xxs">{item.timestamp}</td>
                                <td className="p-3 text-right">
                                  <button 
                                    onClick={() => removeItem(item.id, item.name)}
                                    className="text-slate-500 hover:text-red-400 hover:bg-slate-900/40 p-1.5 rounded transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Column: Logging feed */}
        <section className="lg:col-span-4 bg-slate-900/20 rounded-2xl border border-slate-800/60 flex flex-col h-[34rem] overflow-hidden">
          <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2 font-sans">
              <Terminal className="h-4 w-4 text-cyan-500" />
              SYSTEM TELEMETRY FEED
            </h3>
            <button 
              onClick={() => setLogs([])}
              className="text-9xs font-mono text-slate-500 hover:text-cyan-400 transition"
            >
              CLEAR FEED
            </button>
          </div>

          {/* Logs Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xxs leading-relaxed bg-slate-950/50">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-slate-600">Unified console stream empty. Waiting for operations...</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-slate-600 font-bold shrink-0">[{log.time}]</span>
                  <span className={'px-1 rounded font-bold uppercase shrink-0 text-10xs ' + 
                    (log.source === 'SYSTEM' ? 'text-cyan-400 bg-cyan-950' : 
                     log.source === 'CORE' ? 'text-red-400 bg-red-950' : 
                     log.source === 'COGNITIVE' ? 'text-yellow-400 bg-yellow-950' : 'text-purple-400 bg-purple-950')
                  }>
                    {log.source}
                  </span>
                  <span className={
                    log.type === 'success' ? 'text-green-400' : 
                    log.type === 'warn' ? 'text-yellow-400' : 
                    log.type === 'error' ? 'text-red-400' : 'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950 px-6 py-4 mt-auto text-center">
        <p className="text-9xs font-mono text-slate-500 flex items-center justify-center gap-1.5 font-sans">
          <span>DALEK CAAN SYSTEMS CORE</span>
          <span>•</span>
          <span>AUTONOMOUS CODE EVOLUTION SATELLITE ENGINE</span>
          <span>•</span>
          <span>SECURE OPERATOR FRAMEWORK</span>
        </p>
      </footer>
    </div>
  );
}