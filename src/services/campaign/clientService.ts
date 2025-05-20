
// Function to get client information for campaigns
import { ClientInfo } from './types';

// Function to get clients from the client service for campaigns
export const getClientList = async (): Promise<ClientInfo[]> => {
  try {
    // Dynamically import clientService to avoid circular dependencies
    const { getAllClients } = await import('../clientService');
    const clients = getAllClients();
    
    return clients.map(client => ({
      id: client.id,
      name: client.name,
      whatsapp: client.whatsapp
    }));
  } catch (error) {
    console.error("Erro ao obter lista de clientes:", error);
    return [];
  }
};
