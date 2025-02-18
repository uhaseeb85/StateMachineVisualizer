import { ArrowRight, GitBranch, Zap, Shield, Code2, Workflow, SwitchCamera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Import feature screenshots
import interactiveDesignImg from '../assets/features/interactive-design.png';
import simulationImg from '../assets/features/real-time-simulation.png';
import pathAnalysisImg from '../assets/features/path-analysis.png';
import dataPersistenceImg from '../assets/features/data-persistence.png';
import logAnalysisImg from '../assets/features/log-analysis.png';

const ModeCard = ({ title, description, features, icon: Icon, onSelect, color, mainImage }) => (
  <Card className={`p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg
                  transform transition-all duration-200 hover:scale-[1.02] overflow-hidden
                  border-2 hover:border-${color}-500`}>
    <div className="flex flex-col h-full">
      <div className={`w-16 h-16 bg-${color}-100 dark:bg-${color}-900/50 rounded-xl 
                    flex items-center justify-center mb-6`}>
        <Icon className={`w-8 h-8 text-${color}-600 dark:text-${color}-400`} />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
        {description}
      </p>

      {/* Main Feature Image */}
      <div className="relative mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <img 
          src={mainImage} 
          alt={title}
          className="w-full h-48 object-cover transition-all duration-500"
        />
      </div>

      <div className="space-y-4 flex-grow">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full bg-${color}-100 dark:bg-${color}-900/50 
                          flex items-center justify-center flex-shrink-0 mt-1`}>
              <feature.icon className={`w-3 h-3 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
          </div>
        ))}
      </div>

      <Button 
        className={`mt-8 w-full bg-${color}-600 hover:bg-${color}-700 text-white`}
        onClick={onSelect}
      >
        Select {title}
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  </Card>
);

const LandingPage = ({ onGetStarted }) => {
  const handleModeSelect = (mode) => {
    localStorage.setItem('visualizer_mode', mode);
    onGetStarted();
  };

  const modes = [
    {
      title: "State Machine Visualizer",
      description: "Design and validate complex state machines with rules and transitions.",
      color: "blue",
      icon: Workflow,
      mainImage: interactiveDesignImg,
      features: [
        {
          icon: GitBranch,
          text: "Create modify and test state machines with an intuitive interface"
        },
        {
          icon: Shield,
          text: "Import rule and state dictionaries for consistent documentation"
        },
        {
          icon: Zap,
          text: "Real-time simulation with interactive state transitions"
        },
        {
          icon: Code2,
          text: "Advanced log analysis and Splunk integration"
        },
        {
          icon: Code2,
          text: "Import/Export flows in CSV format"
        }
      ]
    },
    {
      title: "Flow Diagram Builder",
      description: "Create linear or branching flow diagrams with success/failure paths.",
      color: "green",
      icon: GitBranch,
      mainImage: pathAnalysisImg,
      features: [
        {
          icon: Workflow,
          text: "Suitable for documenting API flows and other flows involving multiple steps."
        },
        {
          icon: Workflow,
          text: "Build step-by-step flows with success and failure branches"
        },
        {
          icon: Shield,
          text: "Organize steps hierarchically with sub-steps"
        },
        {
          icon: Zap,
          text: "Interactive flow simulation and path analysis"
        },
        {
          icon: Code2,
          text: "Import/Export flows in CSV format"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Visual Flow Builder
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Choose your visualization mode to get started. Each mode offers specialized features
            for different types of flow visualization and validation.
          </p>
        </div>
      </div>

      {/* Mode Selection Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {modes.map((mode, index) => (
            <ModeCard
              key={index}
              {...mode}
              onSelect={() => handleModeSelect(index === 0 ? 'stateMachine' : 'flowDiagram')}
            />
          ))}
        </div>
      </div>

      {/* Additional Features Showcase */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Common Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white dark:bg-gray-800">
            <img src={simulationImg} alt="Simulation" className="w-full h-48 object-cover rounded-lg mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Simulation</h3>
            <p className="text-gray-600 dark:text-gray-300">Test your flows in real-time with interactive simulations.</p>
          </Card>
          <Card className="p-6 bg-white dark:bg-gray-800">
            <img src={dataPersistenceImg} alt="Data Persistence" className="w-full h-48 object-cover rounded-lg mb-4" />
            <h3 className="text-xl font-semibold mb-2">Data Persistence</h3>
            <p className="text-gray-600 dark:text-gray-300">Your work can be saved and can be exported/imported.</p>
          </Card>
          <Card className="p-6 bg-white dark:bg-gray-800">
            <img src={logAnalysisImg} alt="Path Analysis" className="w-full h-48 object-cover rounded-lg mb-4" />
            <h3 className="text-xl font-semibold mb-2">Path Analysis</h3>
            <p className="text-gray-600 dark:text-gray-300">Analyze all possible paths and identify potential issues.</p>
          </Card>
        </div>
      </div>

      {/* Switch Mode Hint */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
          <SwitchCamera className="w-5 h-5" />
          <span>You can switch between modes anytime using the mode switch button</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 