
import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

interface FinancialProgressBarProps {
  currentValue: number;
  className?: string;
}

const FinancialProgressBar: React.FC<FinancialProgressBarProps> = ({ currentValue, className }) => {
  // Estado para gerenciar o intervalo atual da barra
  const [range, setRange] = useState({
    min: 0,
    max: 10000
  });
  
  // Estado para o valor percentual na barra de progresso
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  // Efeito para ajustar o intervalo e calcular a porcentagem
  useEffect(() => {
    // Determina o intervalo apropriado com base no valor atual
    if (currentValue >= 10000 && range.max === 10000) {
      setRange({ min: 10000, max: 100000 });
    } else if (currentValue >= 100000 && range.max === 100000) {
      setRange({ min: 100000, max: 1000000 });
    } else if (currentValue < 10000 && range.max !== 10000) {
      setRange({ min: 0, max: 10000 });
    }
    
    // Calcula a porcentagem dentro do intervalo atual
    const valueInRange = Math.min(Math.max(currentValue - range.min, 0), range.max - range.min);
    const percentage = (valueInRange / (range.max - range.min)) * 100;
    setProgressPercentage(Math.min(percentage, 100));
  }, [currentValue, range.max, range.min]);
  
  return (
    <div className={`w-full space-y-1 ${className || ''}`}>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatCurrency(range.min)}</span>
        <span>{formatCurrency(range.max)}</span>
      </div>
      <Progress value={progressPercentage} className="h-3" />
      <p className="text-sm text-center text-gray-300">
        Receita: <strong>{formatCurrency(currentValue)}</strong>
      </p>
    </div>
  );
};

export default FinancialProgressBar;
