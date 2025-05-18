
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: string;
  color: "blue" | "purple" | "green" | "red" | "yellow";
  buttonText: string;
  buttonAction: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  description,
  icon,
  color,
  buttonText,
  buttonAction
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-900/20",
      border: "border-blue-700/30",
      text: "text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700"
    },
    purple: {
      bg: "bg-purple-900/20",
      border: "border-purple-700/30",
      text: "text-purple-400",
      button: "bg-purple-600 hover:bg-purple-700"
    },
    green: {
      bg: "bg-green-900/20",
      border: "border-green-700/30",
      text: "text-green-400",
      button: "bg-green-600 hover:bg-green-700"
    },
    red: {
      bg: "bg-red-900/20",
      border: "border-red-700/30",
      text: "text-red-400",
      button: "bg-red-600 hover:bg-red-700"
    },
    yellow: {
      bg: "bg-yellow-900/20",
      border: "border-yellow-700/30",
      text: "text-yellow-400",
      button: "bg-yellow-600 hover:bg-yellow-700"
    }
  };
  
  return (
    <div className={cn("p-6 border rounded-lg transition-all hover:shadow-md", 
      colorClasses[color].border, colorClasses[color].bg)}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className={cn("text-xl font-medium mb-2", colorClasses[color].text)}>
        {title}
      </h3>
      <p className="text-gray-300 mb-6">{description}</p>
      <Button 
        onClick={buttonAction}
        className={cn("w-full", colorClasses[color].button)}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default IntegrationCard;
