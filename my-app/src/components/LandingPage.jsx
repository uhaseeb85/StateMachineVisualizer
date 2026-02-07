import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  Workflow,
  ArrowRight,
  Boxes,
  FileJson,
  History,
  Sparkles,
  Search,
  Brain,
  ShieldCheck,
  Waypoints,
  FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import AnimatedDemo from './StateMachineVisualizer/AnimatedDemo';
import storage from '@/utils/storageWrapper';
const FEEDBACK_EMAIL = 'uhaseeb85@gmail.com';

const LandingPage = ({ onGetStarted }) => {
  const [sessionInfo, setSessionInfo] = useState({
    lastMode: 'flowDiagram',
    flowFileName: null,
    stateFileName: null
  });

  useEffect(() => {
    let isMounted = true;

    const loadSessionInfo = async () => {
      try {
        const lastMode = localStorage.getItem('visualizer_mode') || 'flowDiagram';
        const flowFileName = await storage.getItem('flowDiagramData_currentFileName');
        const stateFileName = await storage.getItem('stateMachineCurrentFileName');

        if (!isMounted) return;

        setSessionInfo({
          lastMode,
          flowFileName: flowFileName || null,
          stateFileName: stateFileName || null
        });
      } catch (error) {
        console.error('Failed to load session info:', error);
      }
    };

    loadSessionInfo();

    return () => {
      isMounted = false;
    };
  }, []);
  const handleModeSelect = (mode) => {
    localStorage.setItem('visualizer_mode', mode);
    onGetStarted();
  };

  const modeMeta = useMemo(() => ({
    stateMachine: {
      label: 'State Machine Visualizer',
      icon: Workflow,
      accent: 'text-cyan-300'
    },
    flowDiagram: {
      label: 'Flow Diagram Builder',
      icon: GitBranch,
      accent: 'text-emerald-300'
    },
    logAnalyzer: {
      label: 'Log Analyzer',
      icon: Search,
      accent: 'text-violet-300'
    },
    aiLogAnalysis: {
      label: 'AI Log Analysis',
      icon: Brain,
      accent: 'text-sky-300'
    },
    htmlReports: {
      label: 'Reports',
      icon: FileText,
      accent: 'text-amber-300'
    }
  }), []);

  const lastModeMeta = modeMeta[sessionInfo.lastMode] || modeMeta.flowDiagram;
  const LastModeIcon = lastModeMeta.icon;

  const features = [
    {
      icon: Boxes,
      title: "State Logic Studio",
      description: "Model complex systems with explicit states, rules, and behaviors.",
      className: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
    },
    {
      icon: Waypoints,
      title: "Flow Command Map",
      description: "Branch, merge, and validate API process routes in seconds.",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
    },
    {
      icon: FileJson,
      title: "Export-Grade IO",
      description: "Round-trip CSV/JSON/Excel while preserving custom columns.",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-200"
    },
    {
      icon: History,
      title: "Timeline Control",
      description: "Undo, redo, and compare paths with precise history events.",
      className: "border-violet-500/40 bg-violet-500/10 text-violet-200"
    },
    {
      icon: ShieldCheck,
      title: "Integrity Checks",
      description: "Validate transitions, detect gaps, and surface rule issues.",
      className: "border-rose-500/40 bg-rose-500/10 text-rose-200"
    },
    {
      icon: Sparkles,
      title: "Live Simulation",
      description: "Run scenarios with real-time state feedback and annotations.",
      className: "border-sky-500/40 bg-sky-500/10 text-sky-200"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0d12] text-slate-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(64,220,255,0.18),_transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(22,255,196,0.12),_transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,_rgba(255,142,0,0.12),_transparent_45%)]" />
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(transparent_0,_transparent_47%,_rgba(255,255,255,0.05)_48%,_transparent_49%),linear-gradient(90deg,_transparent_0,_transparent_47%,_rgba(255,255,255,0.05)_48%,_transparent_49%)] bg-[length:60px_60px]" />
        </div>

        <div className="relative pt-16 sm:pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight">
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300">
                    Enterprise Intelligence Suite
                  </span>
                </h1>
                <div className="max-w-xl space-y-4">
                  <p className="text-lg text-slate-300">
                    An enterprise-grade visual builder for state machines, flow diagrams, and log analysis.
                    <span className="block text-slate-200">
                      Map decisions, validate transitions, and simulate outcomes with clarity.
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                      <Waypoints className="h-3 w-3" />
                      Decision graphs
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                      <ShieldCheck className="h-3 w-3" />
                      Flow diagrams
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                      <FileText className="h-3 w-3" />
                      Reporting
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
                      <Search className="h-3 w-3" />
                      Log analysis
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="relative"
              >
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                      <span>Session Dock</span>
                      <span className="text-emerald-300">Ready</span>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-[#0f141b] p-4">
                        <div className="flex items-center gap-3">
                          <LastModeIcon className={`h-5 w-5 ${lastModeMeta.accent}`} />
                          <div className="flex-1">
                            <div className="text-sm font-semibold">Resume last session</div>
                            <div className="text-xs text-slate-400">
                              {lastModeMeta.label}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="h-8 px-3 bg-white/10 text-slate-100 hover:bg-white/20"
                            onClick={() => handleModeSelect(sessionInfo.lastMode)}
                          >
                            Resume
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#0f141b] p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">
                          Recent Files
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Flow Diagram</span>
                            <span className="text-xs text-slate-500">
                              {sessionInfo.flowFileName || 'No saved file'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>State Machine</span>
                            <span className="text-xs text-slate-500">
                              {sessionInfo.stateFileName || 'No saved file'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Launch Bays</p>
            <h2 className="text-2xl font-semibold">Choose your mode</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* State Machine Mode */}
          <motion.div 
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 hover:border-cyan-400/60 hover:bg-white/10 
                     transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[520px]"
            onClick={() => handleModeSelect('stateMachine')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex-grow mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-cyan-500/20">
                  <Workflow className="w-8 h-8 text-cyan-300" />
                </div>
                <h3 className="text-2xl font-semibold">State Machine Visualizer</h3>
              </div>
              <p className="text-slate-300 mb-8 text-lg">
                Design deterministic systems with explicit rules, state types, and guard paths.
              </p>
              <div className="h-[280px] relative">
                <AnimatedDemo mode="stateMachine" />
              </div>
            </div>
            <Button 
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 py-6
                       group-hover:bg-cyan-400 group-hover:text-slate-900 transition-all duration-300"
            >
              Start State Modeling
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Flow Diagram Mode */}
          <motion.div 
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 hover:border-emerald-400/60 hover:bg-white/10 
                     transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[520px]"
            onClick={() => handleModeSelect('flowDiagram')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex-grow mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-emerald-500/20">
                  <GitBranch className="w-8 h-8 text-emerald-300" />
                </div>
                <h3 className="text-2xl font-semibold">Flow Diagram Builder</h3>
              </div>
              <p className="text-slate-300 mb-8 text-lg">
                Build process maps with success/failure logic and instant validation.
              </p>
              <div className="h-[280px] relative">
                <AnimatedDemo mode="flowDiagram" />
              </div>
            </div>
            <Button 
              className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 py-6
                       group-hover:bg-emerald-400 group-hover:text-slate-900 transition-all duration-300"
            >
              Start Flow Mapping
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Reports Mode */}
          <motion.div 
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 hover:border-amber-400/60 hover:bg-white/10 
                     transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[520px]"
            onClick={() => handleModeSelect('htmlReports')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="flex-grow mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-amber-500/20">
                  <FileText className="w-8 h-8 text-amber-300" />
                </div>
                <h3 className="text-2xl font-semibold">Reports</h3>
              </div>
              <p className="text-slate-300 mb-8 text-lg">
                Store and browse metrics dashboards stored as HTML files.
              </p>
              <div className="h-[280px] relative rounded-2xl border border-white/10 bg-[#0f141b] p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Reports</div>
                <div className="mt-4 space-y-3">
                  {['Quarterly Metrics', 'Latency Overview', 'Service Health'].map((label) => (
                    <div key={label} className="flex items-center justify-between text-sm text-slate-300">
                      <span>{label}</span>
                      <span className="text-xs text-slate-500">HTML</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button 
              className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 py-6
                       group-hover:bg-amber-400 group-hover:text-slate-900 transition-all duration-300"
            >
              View Reports
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          
          {/* Log Analyzer Mode */}
          <motion.div 
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 hover:border-violet-400/60 hover:bg-white/10 
                     transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[520px]"
            onClick={() => handleModeSelect('logAnalyzer')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex-grow mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-violet-500/20">
                  <Search className="w-8 h-8 text-violet-300" />
                </div>
                <h3 className="text-2xl font-semibold">Log Analyzer</h3>
              </div>
              <p className="text-slate-300 mb-8 text-lg">
                Decode logs, cluster patterns, and surface anomalies instantly.
              </p>
              <div className="h-[280px] relative">
                <AnimatedDemo mode="logAnalyzer" />
              </div>
            </div>
            <Button 
              className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 py-6
                       group-hover:bg-violet-400 group-hover:text-slate-900 transition-all duration-300"
            >
              Start Log Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          
          {/* AI Log Analysis Mode */}
          <motion.div 
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 hover:border-sky-400/60 hover:bg-white/10 
                     transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[520px]"
            onClick={() => handleModeSelect('aiLogAnalysis')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex-grow mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-sky-500/20">
                  <Brain className="w-8 h-8 text-sky-300" />
                </div>
                <h3 className="text-2xl font-semibold">AI Log Analysis</h3>
              </div>
              <p className="text-slate-300 mb-8 text-lg">
                Ask questions, get summaries, and extract operational signals.
              </p>
              <div className="h-[280px] relative">
                <AnimatedDemo mode="aiLogAnalysis" />
              </div>
            </div>
            <Button 
              className="w-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 py-6
                       group-hover:bg-sky-400 group-hover:text-slate-900 transition-all duration-300"
            >
              Start AI Forensics
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20">
        <motion.h2
          className="text-3xl font-semibold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Feature Highlights
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className={`rounded-2xl border p-6 transition-all duration-300 ${feature.className}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-white/5">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
              </div>
              <p className="text-sm text-slate-200/80">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Technologies and Credits Section */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14">
          <div className="max-w-3xl">
            <h3 className="text-xl font-semibold mb-4">Mission Brief</h3>
            <div className="space-y-4 text-sm text-slate-300">
              <p>
                Visual Flow Builder is built for engineers who need clarity under pressure. Model the logic, validate the edge cases,
                and publish a single, shareable source of truth across product and operations teams.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                <div>
                  <div className="uppercase tracking-[0.2em]">Stack</div>
                  <p className="mt-2">React • Shadcn UI • Framer Motion • Lucide</p>
                </div>
                <div>
                  <div className="uppercase tracking-[0.2em]">Version</div>
                  <p className="mt-2">2.0.0</p>
                </div>
              </div>
              <div className="pt-4 text-xs text-slate-400">
                <span className="uppercase tracking-[0.2em]">Developer Contact</span>
                <div className="mt-2">
                  <a
                    href={`mailto:${FEEDBACK_EMAIL}`}
                    className="text-cyan-300 hover:text-cyan-200"
                  >
                    {FEEDBACK_EMAIL}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 