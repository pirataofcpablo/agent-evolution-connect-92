
// Client service for managing customer data and automated reminders

export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  planValue: number;
  dueDate: Date;
  reminderMessage?: string;
  reminderScheduled?: boolean;
}

// In-memory storage for clients (in a real app, this would use a database)
let clients: Client[] = [];

// Function to add a new client
export const addClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
  try {
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      reminderScheduled: false,
    };
    
    clients.push(newClient);
    
    // Store in localStorage for persistence
    saveClientsToStorage();
    
    console.log("Cliente adicionado:", newClient);
    return newClient;
  } catch (error) {
    console.error("Erro ao adicionar cliente:", error);
    throw error;
  }
};

// Function to get all clients
export const getAllClients = (): Client[] => {
  // Load from localStorage if not loaded yet
  if (clients.length === 0) {
    loadClientsFromStorage();
  }
  return clients;
};

// Function to get a client by ID
export const getClientById = (id: string): Client | undefined => {
  return clients.find(client => client.id === id);
};

// Function to update a client
export const updateClient = (updatedClient: Client): Client => {
  const index = clients.findIndex(client => client.id === updatedClient.id);
  
  if (index === -1) {
    throw new Error("Cliente não encontrado");
  }
  
  clients[index] = updatedClient;
  saveClientsToStorage();
  
  return updatedClient;
};

// Function to delete a client
export const deleteClient = (id: string): boolean => {
  const initialLength = clients.length;
  clients = clients.filter(client => client.id !== id);
  
  const deleted = clients.length < initialLength;
  if (deleted) {
    saveClientsToStorage();
  }
  
  return deleted;
};

// Function to mark a client reminder as scheduled
export const markReminderScheduled = (clientId: string): void => {
  const client = getClientById(clientId);
  
  if (client) {
    client.reminderScheduled = true;
    updateClient(client);
  }
};

// Helper functions for localStorage persistence
const saveClientsToStorage = () => {
  localStorage.setItem('clients', JSON.stringify(clients));
};

const loadClientsFromStorage = () => {
  const storedClients = localStorage.getItem('clients');
  
  if (storedClients) {
    clients = JSON.parse(storedClients).map((client: any) => ({
      ...client,
      dueDate: new Date(client.dueDate) // Convert string back to Date
    }));
  }
};

// Schedule automatic reminder for client payment renewal
export const scheduleClientReminder = async (client: Client): Promise<boolean> => {
  try {
    // Create a date 1 day before the due date
    const reminderDate = new Date(client.dueDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    
    // Default template message if none provided
    const defaultMessage = `Olá ${client.name}, seu plano no valor de R$ ${client.planValue.toFixed(2)} vence amanhã. Segue o pix para renovação: [SEU PIX AQUI]. Qualquer dúvida me chama.`;
    const message = client.reminderMessage || defaultMessage;
    
    // Get the instance name from localStorage
    const instanceName = localStorage.getItem('instanceName');
    if (!instanceName) {
      console.error("Nenhuma instância conectada");
      return false;
    }
    
    // Call the campaign service to schedule the reminder
    const { scheduleCampaign } = await import('./campaignService');
    
    const result = await scheduleCampaign({
      instanceName,
      campaignName: `Lembrete de Renovação - ${client.name}`,
      message,
      recipients: [client.whatsapp],
      scheduledDateTime: reminderDate
    });
    
    if (result.success) {
      // Mark client as having a scheduled reminder
      markReminderScheduled(client.id);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Erro ao programar lembrete do cliente:", error);
    return false;
  }
};
