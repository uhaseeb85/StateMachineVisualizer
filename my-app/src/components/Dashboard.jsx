import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  LogOut, 
  RefreshCw, 
  Home, 
  UserCheck, 
  Clock, 
  Activity, 
  Layers,
  Workflow,
  GitBranch,
  Search,
  Brain
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_URL = 'http://localhost:5001';

const Dashboard = ({ onLogout }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/api/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnalyticsData();
  }, []);
  
  // Format date string to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get component icon by name
  const getComponentIcon = (component) => {
    switch (component) {
      case 'stateMachine':
        return <Workflow className="w-4 h-4" />;
      case 'flowDiagram':
        return <GitBranch className="w-4 h-4" />;
      case 'logAnalyzer':
        return <Search className="w-4 h-4" />;
      case 'aiLogAnalysis':
        return <Brain className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };
  
  // Function to format component name for display
  const formatComponentName = (component) => {
    switch(component) {
      case 'stateMachine':
        return 'State Machine Visualizer';
      case 'flowDiagram':
        return 'Flow Diagram Builder';
      case 'logAnalyzer':
        return 'Log Analyzer';
      case 'aiLogAnalysis':
        return 'AI Log Analysis';
      default:
        return component;
    }
  };
  
  // Calculate component usage percentages
  const calculateUsagePercentages = () => {
    if (!analyticsData) return {};
    
    const { componentUsage } = analyticsData;
    const total = Object.values(componentUsage).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return Object.keys(componentUsage).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    
    return Object.keys(componentUsage).reduce((acc, key) => {
      acc[key] = Math.round((componentUsage[key] / total) * 100);
      return acc;
    }, {});
  };
  
  const usagePercentages = calculateUsagePercentages();
  
  // Get Browser from user agent
  const getBrowserFromUA = (userAgent) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'Internet Explorer';
    
    return 'Other';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-400" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Analytics Dashboard
            </h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={fetchAnalyticsData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => window.location.href = '/'}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button 
              variant="destructive" 
              className="bg-red-900 hover:bg-red-800"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        
        {error ? (
          <div className="bg-red-900/30 border border-red-900 text-red-200 p-4 rounded-lg">
            <p className="font-semibold">Error: {error}</p>
            <p className="text-sm mt-2">Please try refreshing or logging in again.</p>
          </div>
        ) : isLoading && !analyticsData ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-12 w-12 text-indigo-400 animate-spin" />
              <p className="text-slate-400">Loading analytics data...</p>
            </div>
          </div>
        ) : analyticsData ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-200 text-lg">Total Visits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Activity className="h-8 w-8 text-blue-400" />
                      <span className="text-3xl font-bold text-white">{analyticsData.totalVisits}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-200 text-lg">Most Used Feature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Layers className="h-8 w-8 text-yellow-400" />
                      <div>
                        <span className="text-lg font-bold text-white">
                          {Object.entries(analyticsData.componentUsage)
                            .sort((a, b) => b[1] - a[1])[0][1] > 0
                              ? formatComponentName(Object.entries(analyticsData.componentUsage)
                                  .sort((a, b) => b[1] - a[1])[0][0])
                              : 'None'}
                        </span>
                        {Object.entries(analyticsData.componentUsage)
                            .sort((a, b) => b[1] - a[1])[0][1] > 0 && (
                          <div className="text-sm text-slate-400">
                            {Object.entries(analyticsData.componentUsage)
                              .sort((a, b) => b[1] - a[1])[0][1]} uses
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            
            {/* Component Usage Tab */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Component Usage Statistics</CardTitle>
                  <CardDescription className="text-slate-400">
                    Usage data for each component in the application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md overflow-hidden border border-slate-700">
                    <Table>
                      <TableHeader className="bg-slate-900">
                        <TableRow>
                          <TableHead className="text-slate-300">Component</TableHead>
                          <TableHead className="text-slate-300">Usage Count</TableHead>
                          <TableHead className="text-slate-300">Percentage</TableHead>
                          <TableHead className="text-slate-300">Visualization</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(analyticsData.componentUsage)
                          .sort((a, b) => b[1] - a[1])
                          .map(([component, count]) => (
                            <TableRow key={component} className="hover:bg-slate-700/50">
                              <TableCell className="text-slate-300 font-medium">
                                <div className="flex items-center gap-2">
                                  {getComponentIcon(component)}
                                  {formatComponentName(component)}
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-300">{count}</TableCell>
                              <TableCell className="text-slate-300">{usagePercentages[component]}%</TableCell>
                              <TableCell className="w-[200px]">
                                <div className="w-full bg-slate-700 rounded-full h-2.5">
                                  <div 
                                    className="bg-indigo-600 h-2.5 rounded-full" 
                                    style={{ width: `${usagePercentages[component]}%` }}
                                  ></div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          
                        {Object.values(analyticsData.componentUsage).every(count => count === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                              No component usage recorded
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard; 