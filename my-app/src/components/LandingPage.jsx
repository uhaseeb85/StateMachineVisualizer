import React from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, 
  Workflow, 
  ArrowRight, 
  Boxes, 
  Network,
  FileJson,
  History,
  Lightbulb,
  Sparkles,
  Search,
  FileText,
  Brain
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import AnimatedDemo from './StateMachineVisualizer/AnimatedDemo';

const LandingPage = ({ onGetStarted }) => {
  const handleModeSelect = (mode) => {
    localStorage.setItem('visualizer_mode', mode);
    onGetStarted();
  };

  const features = [
    {
      icon: Boxes,
      title: "State Management",
      description: "Create and manage complex state machines with an intuitive interface",
      color: "blue"
    },
    {
      icon: Network,
      title: "Flow Visualization",
      description: "Visualize API process flows and transitions interactively",
      color: "green"
    },
    {
      icon: FileJson,
      title: "Import/Export",
      description: "Support for JSON and CSV formats with data persistence",
      color: "purple"
    },
    {
      icon: History,
      title: "Version Control",
      description: "Track changes and maintain history of modifications",
      color: "orange"
    },
    {
      icon: Lightbulb,
      title: "Path Validation",
      description: "Interactive validation of state transitions and rules",
      color: "yellow"
    },
    {
      icon: Sparkles,
      title: "Simulation",
      description: "Try out flows with real-time simulation and testing",
      color: "pink"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative pt-24 pb-16 sm:pt-32 sm:pb-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <motion.h1 
                className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent 
                         bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Visual Flow Builder
              </motion.h1>
              <motion.p 
                className="mt-6 text-lg leading-8 text-gray-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Design, visualize, and validate complex workflows with our intuitive interface.
                Build state machines, flow diagrams, and analyze logs with ease.
              </motion.p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* State Machine Mode */}
          <motion.div 
            className="group relative rounded-3xl bg-gradient-to-b from-blue-500/10 to-transparent p-10 hover:from-blue-500/20 
                     transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[550px]"
            onClick={() => handleModeSelect('stateMachine')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex-grow mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Workflow className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-semibold">State Machine Visualizer</h3>
              </div>
              <p className="text-gray-400 mb-8 text-lg">
                Design and validate complex state machines with rules and transitions.
                Perfect for modeling system behaviors and decision flows.
              </p>
              <div className="h-[280px] relative">
                <AnimatedDemo mode="stateMachine" />
              </div>
            </div>
            <Button 
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-6
                       group-hover:bg-blue-500 group-hover:text-white transition-all duration-300"
            >
              Start Building
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Flow Diagram Mode */}
          <motion.div 
            className="group relative rounded-3xl bg-gradient-to-b from-green-500/10 to-transparent p-10 hover:from-green-500/20 
                     transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[550px]"
            onClick={() => handleModeSelect('flowDiagram')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex-grow mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <GitBranch className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-semibold">Flow Diagram Builder</h3>
              </div>
              <p className="text-gray-400 mb-8 text-lg">
                Create linear or branching flow diagrams with success/failure paths.
                Ideal for API flows and process documentation.
              </p>
              <div className="h-[280px] relative">
                <AnimatedDemo mode="flowDiagram" />
              </div>
            </div>
            <Button 
              className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-6
                       group-hover:bg-green-500 group-hover:text-white transition-all duration-300"
            >
              Start Building
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          
          {/* Log Analyzer Mode */}
          <motion.div 
            className="group relative rounded-3xl bg-gradient-to-b from-purple-500/10 to-transparent p-10 hover:from-purple-500/20 
                     transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[550px]"
            onClick={() => handleModeSelect('logAnalyzer')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex-grow mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Search className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold">Log Analyzer</h3>
              </div>
              <p className="text-gray-400 mb-8 text-lg">
                Analyze log files to identify patterns and troubleshoot issues.
                Supports local files and Splunk integration.
              </p>
              <div className="h-[280px] relative bg-gray-800/50 rounded-lg overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <FileText className="w-20 h-20 text-purple-400 mb-6" />
                  <div className="text-center px-8">
                    <h4 className="text-xl font-medium text-purple-300 mb-3">Pattern-Based Analysis</h4>
                    <p className="text-base text-gray-400">
                      Identify issues in logs using customizable pattern dictionaries
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-6
                       group-hover:bg-purple-500 group-hover:text-white transition-all duration-300"
            >
              Start Analyzing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
          
          {/* AI Log Analysis Mode */}
          <motion.div 
            className="group relative rounded-3xl bg-gradient-to-b from-indigo-500/10 to-transparent p-10 hover:from-indigo-500/20 
                     transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[550px]"
            onClick={() => handleModeSelect('aiLogAnalysis')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex-grow mb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-indigo-500/20">
                  <Brain className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-semibold">AI Log Analysis</h3>
              </div>
              <p className="text-gray-400 mb-8 text-lg">
                Analyze log files using AI to get intelligent insights and answers.
                Ask questions about your logs in natural language.
              </p>
              <div className="h-[280px] relative">
                <AnimatedDemo mode="aiLogAnalysis" />
              </div>
            </div>
            <Button 
              className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 py-6
                       group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300"
            >
              Start AI Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <motion.h2 
          className="text-3xl font-bold text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Feature Highlights
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className={`rounded-xl bg-${feature.color}-500/10 p-8 hover:bg-${feature.color}-500/20 
                       transition-all duration-300 flex flex-col h-full min-h-[200px]`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`p-3 rounded-lg bg-${feature.color}-500/20 w-fit mb-6`}>
                <feature.icon className={`w-8 h-8 text-${feature.color}-400`} />
              </div>
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-400 text-lg">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Technologies and Credits Section */}
      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
          {/* About Section */}
          <div className="max-w-2xl">
            <h3 className="text-xl font-semibold mb-6">About</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <p>
                Visual Flow Builder helps you create and understand complex workflows through interactive diagrams. 
                Whether you're designing state machines, mapping out process flows, or analyzing logs, this tool makes it simple to 
                visualize, validate, and share your work.
              </p>
              <div className="space-y-2">
                <p className="text-gray-400 font-medium">Acknowledgments:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>Built with React</li>
                  <li>Design elements from Shadcn UI</li>
                  <li>Interface icons by Lucide</li>
                  <li>Smooth animations by Framer</li>
                </ul>
              </div>
              <p className="text-gray-400 mt-6">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 