
import { Client } from './clientService';

// Interface para dados financeiros gerais
export interface FinancialSummary {
  totalRevenue: number;
  totalPlans: number;
  upcomingRevenue: number;
  dueClients: Client[];
}

// Função para calcular a receita total com base nos clientes
export const calculateTotalRevenue = (clients: Client[]): number => {
  return clients.reduce((total, client) => total + client.planValue, 0);
};

// Função para contar o total de planos vendidos
export const countTotalPlans = (clients: Client[]): number => {
  return clients.length;
};

// Função para calcular receita futura nos próximos N dias
export const calculateUpcomingRevenue = (clients: Client[], days: number = 30): number => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return clients.reduce((total, client) => {
    const dueDate = new Date(client.dueDate);
    
    // Verifica se o vencimento está dentro do período especificado
    if (dueDate >= today && dueDate <= futureDate) {
      return total + client.planValue;
    }
    return total;
  }, 0);
};

// Função para obter clientes com vencimento próximo
export const getClientsWithUpcomingDueDate = (
  clients: Client[], 
  minDays: number = 25, 
  maxDays: number = 32
): Client[] => {
  const today = new Date();
  
  return clients.filter(client => {
    const dueDate = new Date(client.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= minDays && diffDays <= maxDays;
  });
};

// Função para obter o resumo financeiro
export const getFinancialSummary = (clients: Client[]): FinancialSummary => {
  return {
    totalRevenue: calculateTotalRevenue(clients),
    totalPlans: countTotalPlans(clients),
    upcomingRevenue: calculateUpcomingRevenue(clients, 30),
    dueClients: getClientsWithUpcomingDueDate(clients)
  };
};
