/**
 * AnalysisReport Component - Refactored
 * Uses utility functions, constants, and smaller focused components
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  PieChart,
  FileText,
  Target,
  Calendar
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import new architecture components
import FileStatusBadge from './ui/FileStatusBadge';

// Import utilities and constants
import { 
  formatDateTime, 
  formatFileSize, 
  calculateStats,
  exportToJson,
  generateReport 
} from '../utils';
import { 
  FILE_STATUS, 
  RISK_LEVELS, 
  RISK_COLORS 
} from '../constants';

const AnalysisReport = ({ 
  processedFiles, 
  analysisResults, 
  onClearAll, 
  onExportReport 
}) => {
  const [timeRange, setTimeRange] = useState('all');

  // Calculate statistics using utility function
  const stats = useMemo(() => 
    calculateStats(processedFiles, analysisResults), 
    [processedFiles, analysisResults]
  );

  // Calculate risk distribution
  const riskDistribution = useMemo(() => {
    const distribution = { 
      [RISK_LEVELS.HIGH]: 0, 
      [RISK_LEVELS.MEDIUM]: 0, 
      [RISK_LEVELS.LOW]: 0 
    };
    
    processedFiles.forEach(file => {
      const analysis = analysisResults[file.id];
      if (analysis?.riskLevel) {
        distribution[analysis.riskLevel]++;
      }
    });
    
    return distribution;
  }, [processedFiles, analysisResults]);

  const handleExportReport = () => {
    const reportData = generateReport(processedFiles, analysisResults, stats);
    exportToJson(reportData, `fraud-analysis-report-${new Date().toISOString().split('T')[0]}`);
    if (onExportReport) onExportReport();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ReportHeader 
        onExportReport={handleExportReport}
        onClearAll={onClearAll}
      />

      {/* Key Metrics */}
      <KeyMetrics stats={stats} />

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart distribution={riskDistribution} />
        <TrendAnalysis stats={stats} />
      </div>

      {/* Detailed Files List */}
      <DetailedFilesList 
        processedFiles={processedFiles}
        analysisResults={analysisResults}
      />

      {/* Summary Insights */}
      <SummaryInsights 
        stats={stats}
        totalFiles={processedFiles.length}
      />
    </div>
  );
};

/**
 * Report Header Component
 */
const ReportHeader = ({ onExportReport, onClearAll }) => (
  <Card className="bg-slate-800/50">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-white flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        Analysis Report Dashboard
      </CardTitle>
      <div className="flex gap-2">
        <Button onClick={onExportReport} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
        <Button 
          onClick={onClearAll} 
          variant="outline" 
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>
    </CardHeader>
  </Card>
);

/**
 * Key Metrics Component
 */
const KeyMetrics = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard
      title="Total Files"
      value={stats.total}
      subtitle="Processed"
      icon={FileText}
      iconColor="blue"
    />
    
    <MetricCard
      title="Suspicious"
      value={stats.suspicious}
      subtitle={`${stats.suspiciousRate.toFixed(1)}%`}
      icon={AlertTriangle}
      iconColor="red"
      trend={stats.trend}
    />
    
    <MetricCard
      title="Clear"
      value={stats.clear}
      subtitle={`${stats.clearRate.toFixed(1)}%`}
      icon={CheckCircle}
      iconColor="green"
    />
    
    <MetricCard
      title="Avg Confidence"
      value={`${Math.round(stats.avgConfidence * 100)}%`}
      subtitle="Detection accuracy"
      icon={Target}
      iconColor="purple"
    />
  </div>
);

/**
 * Individual Metric Card Component
 */
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor, 
  trend 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400'
  };

  return (
    <Card className="bg-slate-800/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className={`text-3xl font-bold ${
              iconColor === 'red' ? 'text-red-400' : 
              iconColor === 'green' ? 'text-green-400' :
              iconColor === 'purple' ? 'text-purple-400' : 'text-white'
            }`}>
              {value}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">{subtitle}</p>
              {trend && (
                trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-red-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-400" />
                )
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[iconColor]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Risk Distribution Chart Component
 */
const RiskDistributionChart = ({ distribution }) => {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  return (
    <Card className="bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-400" />
          Risk Level Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(distribution).map(([level, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={level} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    level === RISK_LEVELS.HIGH ? 'bg-red-500' :
                    level === RISK_LEVELS.MEDIUM ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-white">{level} Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{count}</span>
                  <Badge className={RISK_COLORS[level]}>
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
        
        {total === 0 && (
          <div className="text-center py-8">
            <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No data available</p>
            <p className="text-sm text-gray-500">Process some files to see risk distribution</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Trend Analysis Component
 */
const TrendAnalysis = ({ stats }) => (
  <Card className="bg-slate-800/50">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-400" />
        Trend Analysis
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
          <span className="text-white">Detection Rate</span>
          <Badge className="bg-blue-500/20 text-blue-400">
            {stats.suspiciousRate.toFixed(1)}%
          </Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
          <span className="text-white">Average Confidence</span>
          <Badge className="bg-purple-500/20 text-purple-400">
            {Math.round(stats.avgConfidence * 100)}%
          </Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
          <span className="text-white">Recent Trend</span>
          <div className="flex items-center gap-2">
            {stats.trend === 'up' ? (
              <>
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Increasing</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Decreasing</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <AlertTriangle className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-blue-300">
          <strong>Trend Analysis:</strong> Based on the last 10 processed files compared to overall statistics.
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
);

/**
 * Detailed Files List Component
 */
const DetailedFilesList = ({ processedFiles, analysisResults }) => (
  <Card className="bg-slate-800/50">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-400" />
        Processed Files Details ({processedFiles.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      {processedFiles.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No files processed yet</p>
          <p className="text-sm text-gray-500">Upload and process files to see detailed analysis here</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {processedFiles.map((file, index) => (
            <FileListItem
              key={file.id}
              file={file}
              analysis={analysisResults[file.id]}
              index={index}
            />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

/**
 * Individual File List Item
 */
const FileListItem = ({ file, analysis, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-gray-600"
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div>
        <p className="text-white font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span>{formatDateTime(file.processedAt)}</span>
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs text-gray-400">Confidence</p>
        <p className="text-white font-medium">
          {Math.round((file.confidence || 0) * 100)}%
        </p>
      </div>
      
      <FileStatusBadge 
        status={file.status} 
        riskLevel={analysis?.riskLevel}
      />
    </div>
  </motion.div>
);

/**
 * Summary Insights Component
 */
const SummaryInsights = ({ stats, totalFiles }) => (
  <Card className="bg-slate-800/50">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <Calendar className="w-5 h-5 text-green-400" />
        Summary Insights
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 className="text-white font-medium mb-3">Key Findings:</h5>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Processed {totalFiles} audio file{totalFiles !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>
                {stats.suspicious} suspicious conversation{stats.suspicious !== 1 ? 's' : ''} detected 
                ({stats.suspiciousRate.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>
                {stats.clear} clear conversation{stats.clear !== 1 ? 's' : ''} verified 
                ({stats.clearRate.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Average detection confidence: {Math.round(stats.avgConfidence * 100)}%</span>
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="text-white font-medium mb-3">Recommendations:</h5>
          <div className="space-y-2 text-sm text-gray-400">
            {stats.suspiciousRate > 20 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span>High fraud rate detected. Review security protocols.</span>
              </div>
            )}
            {stats.avgConfidence < 0.7 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Consider reviewing unclear cases manually for better accuracy.</span>
              </div>
            )}
            {totalFiles < 10 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Process more files for better statistical insights.</span>
              </div>
            )}
            {stats.suspiciousRate < 5 && totalFiles > 20 && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Low fraud rate indicates good security measures.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AnalysisReport; 