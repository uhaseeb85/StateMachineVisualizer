import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from "@/components/ui/card";

const ModeCard = ({ 
  title, 
  description, 
  features, 
  icon: Icon, 
  onSelect, 
  color, 
  demoComponent 
}) => (
  <Card 
    className={`p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg
                transform transition-all duration-200 hover:scale-[1.02] overflow-hidden
                border-2 hover:border-${color}-500 cursor-pointer
                hover:shadow-xl transition-all duration-300`}
    onClick={onSelect}
  >
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

      {/* Animated Demo */}
      <div className="mb-6">
        {demoComponent}
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

      <div className={`mt-8 w-full h-12 flex items-center justify-center gap-2 
                    text-${color}-600 dark:text-${color}-400 font-medium
                    border-t border-gray-100 dark:border-gray-700 pt-4`}>
        Select {title}
        <ArrowRight className="w-5 h-5" />
      </div>
    </div>
  </Card>
);

export default ModeCard; 