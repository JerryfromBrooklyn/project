import React from 'react';
import { APP_VERSION } from '../config/version';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export const VersionDisplay: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-apple-blue-50 rounded-full text-sm font-medium text-apple-blue-700 hover:bg-apple-blue-100 transition-colors cursor-help border border-apple-blue-200">
            <Info className="w-4 h-4" />
            <span className="font-semibold">{APP_VERSION.getVersionString()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Current application version</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 