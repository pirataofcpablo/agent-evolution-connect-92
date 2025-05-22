
import React from 'react';
import { Bot } from "lucide-react";

interface IntegrationStatusCardProps {
  name: string;
  isActive: boolean;
  description: string;
  activeMessage?: string;
}

const IntegrationStatusCard: React.FC<IntegrationStatusCardProps> = ({
  name,
  isActive,
  description,
  activeMessage
}) => {
  return (
    <div className={`p-4 border rounded-md ${isActive ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
      <div className="flex items-center gap-2">
        <Bot className={`h-5 w-5 ${isActive ? 'text-green-400' : 'text-gray-400'}`} />
        <h3 className={`font-medium ${isActive ? 'text-green-400' : 'text-gray-400'}`}>{name}</h3>
      </div>
      <p className="text-sm mt-2 text-gray-300">
        {isActive ? description : "Integração não configurada"}
      </p>
      {isActive && activeMessage && (
        <div className="mt-2 text-xs text-gray-400">
          {activeMessage}
        </div>
      )}
    </div>
  );
};

export default IntegrationStatusCard;
