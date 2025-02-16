import { ArrowRight, GitBranch, Zap, Shield, Code2, Workflow } from 'lucide-react';
import { Button } from "../components/ui/button";

// Import feature screenshots
import interactiveDesignImg from '../assets/features/interactive-design.png';
import simulationImg from '../assets/features/real-time-simulation.png';
import pathAnalysisImg from '../assets/features/path-analysis.png';
import dataPersistenceImg from '../assets/features/data-persistence.png';
import logAnalysisImg from '../assets/features/log-analysis.png';
import ruleManagementImg from '../assets/features/rule-management.png';

const FeatureCard = ({ icon: Icon, title, description, color, image }) => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg
                  transform transition-all duration-200 hover:scale-105 overflow-hidden">
    <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/50 rounded-lg 
                    flex items-center justify-center mb-4`}>
      <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300 mb-4">
      {description}
    </p>
    <div className="relative group">
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover object-top transition-all duration-500 
                   group-hover:object-bottom"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 
                    to-transparent opacity-0 group-hover:opacity-100 transition-opacity 
                    duration-300 pointer-events-none" />
    </div>
  </div>
);

const LandingPage = ({ onGetStarted }) => {
  const features = [
    {
      icon: Workflow,
      title: "Interactive Design",
      description: "Create and modify state machines with an intuitive drag-and-drop interface. Define states, transitions, and rules effortlessly.",
      color: "blue",
      image: interactiveDesignImg
    },
    {
      icon: Zap,
      title: "Real-time Simulation",
      description: "Test your state machine in real-time with interactive simulations. Validate transitions and identify potential issues instantly.",
      color: "green",
      image: simulationImg
    },
    {
      icon: GitBranch,
      title: "Path Analysis",
      description: "Discover and analyze all possible paths between states. Identify loops and validate state machine logic comprehensively.",
      color: "purple",
      image: pathAnalysisImg
    },
    {
      icon: Shield,
      title: "Data Persistence",
      description: "Your work is automatically saved and version-controlled. Export and import state machines in various formats.",
      color: "orange",
      image: dataPersistenceImg
    },
    {
      icon: Code2,
      title: "Log Analysis",
      description: "Analyze logs to understand state machine behavior. Integrate with Splunk for advanced log analysis.",
      color: "red",
      image: logAnalysisImg
    },
    {
      icon: Workflow,
      title: "Rule Management",
      description: "Define complex transition rules with an intuitive interface. Import rule dictionaries for consistent documentation.",
      color: "yellow",
      image: ruleManagementImg
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            State Machine <span className="text-blue-600 dark:text-blue-400">Visualizer</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Design, visualize, and validate complex state machines with an intuitive and powerful interface.
            Perfect for developers, architects, and system designers.
          </p>
          <Button 
            onClick={onGetStarted}
            className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white
                     transform transition-all duration-200 hover:scale-105"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Start designing your state machines today with our powerful and intuitive tools.
        </p>
        <Button 
          onClick={onGetStarted}
          className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white
                   transform transition-all duration-200 hover:scale-105"
        >
          Launch Application
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default LandingPage; 