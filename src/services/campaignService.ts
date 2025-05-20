
// Campaign service for scheduling message broadcasts

interface CampaignParams {
  instanceName: string;
  campaignName: string;
  message: string;
  recipients: string[];
  scheduledDateTime: Date;
}

interface CampaignResult {
  success: boolean;
  campaignId?: string;
  error?: string;
}

export interface Campaign {
  id: string;
  instanceName: string;
  campaignName: string;
  message: string;
  recipients: string[];
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'canceled';
  createdAt: string;
}

// In-memory storage for campaigns (in a real app, this would use a database)
let campaigns: Campaign[] = [];

// Function to load campaigns from localStorage
const loadCampaignsFromStorage = () => {
  try {
    const storedCampaigns = localStorage.getItem('campaigns');
    if (storedCampaigns) {
      campaigns = JSON.parse(storedCampaigns);
    }
  } catch (error) {
    console.error("Erro ao carregar campanhas do localStorage:", error);
  }
};

// Function to save campaigns to localStorage
const saveCampaignsToStorage = () => {
  try {
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
  } catch (error) {
    console.error("Erro ao salvar campanhas no localStorage:", error);
  }
};

// Initialize campaigns from localStorage
loadCampaignsFromStorage();

// Function to schedule a campaign
export const scheduleCampaign = async (params: CampaignParams): Promise<CampaignResult> => {
  try {
    const { instanceName, campaignName, message, recipients, scheduledDateTime } = params;
    
    console.log("Agendando campanha:", {
      instanceName,
      campaignName,
      recipientsCount: recipients.length,
      scheduledDateTime
    });

    // Generate a new unique ID for the campaign
    const campaignId = crypto.randomUUID();
    
    // Always create a local campaign entry regardless of API outcome
    const newCampaign: Campaign = {
      id: campaignId,
      instanceName,
      campaignName,
      message,
      recipients,
      scheduledAt: scheduledDateTime.toISOString(),
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    // Add to local storage first
    campaigns.push(newCampaign);
    saveCampaignsToStorage();

    // Prepare the base instance name (without _Cliente suffix if present)
    const baseInstanceName = instanceName.replace("_Cliente", "");
    
    // Get Evolution API URL from env or default
    const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';
    
    try {
      // Try to call the Evolution API to schedule the campaign
      const response = await fetch(`${EVO_API_URL}/campaign/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: `${baseInstanceName}_Cliente`,
          campaignName,
          message,
          recipients,
          scheduledDateTime: scheduledDateTime.toISOString(),
        }),
      });

      // If API call succeeded, update the local campaign with API data
      if (response.ok) {
        const result = await response.json();
        console.log("Campanha agendada com API sucesso:", result);
        
        // Update the campaign ID if provided by API
        if (result.campaignId || result.id) {
          const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
          if (campaignIndex !== -1) {
            campaigns[campaignIndex].id = result.campaignId || result.id;
            saveCampaignsToStorage();
          }
        }
      } else {
        // If API call failed, log the error but continue with local storage
        console.log("API falhou, mas campanha foi salva localmente");
      }
    } catch (apiError) {
      // API error, but we already saved locally so we continue
      console.error("Erro na API ao agendar campanha, usando apenas armazenamento local:", apiError);
    }
    
    // Return success since we stored it locally
    return { 
      success: true, 
      campaignId: campaignId
    };
  } catch (error) {
    console.error("Erro ao agendar campanha:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao agendar campanha"
    };
  }
};

// Function to get all scheduled campaigns
export const getCampaigns = async (instanceName?: string): Promise<Campaign[]> => {
  try {
    console.log("Buscando campanhas agendadas");
    
    // Load from localStorage first
    loadCampaignsFromStorage();
    
    // If instanceName is provided, filter by instance
    let filteredCampaigns = campaigns;
    if (instanceName) {
      const normalizedInstanceName = instanceName.replace("_Cliente", "");
      filteredCampaigns = campaigns.filter(campaign => 
        campaign.instanceName.replace("_Cliente", "") === normalizedInstanceName
      );
    }
    
    // Also try to get from the API
    try {
      const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';
      
      // Only call API if instanceName is provided
      if (instanceName) {
        // Normalized instance name for API call
        const baseInstanceName = instanceName.replace("_Cliente", "");
        const fullInstanceName = `${baseInstanceName}_Cliente`;
        
        const response = await fetch(`${EVO_API_URL}/campaign/list/${fullInstanceName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const apiCampaigns = await response.json();
          console.log("Campanhas encontradas na API:", apiCampaigns);
          
          // Merge with local campaigns, giving API precedence
          if (Array.isArray(apiCampaigns)) {
            // Map API campaigns to our format
            const formattedApiCampaigns = apiCampaigns.map((apiCampaign: any) => ({
              id: apiCampaign.id || apiCampaign.campaignId,
              instanceName: fullInstanceName,
              campaignName: apiCampaign.campaignName || apiCampaign.name || 'Campanha',
              message: apiCampaign.message || '',
              recipients: apiCampaign.recipients || [],
              scheduledAt: apiCampaign.scheduledDateTime || apiCampaign.scheduledAt,
              status: apiCampaign.status || 'scheduled',
              createdAt: apiCampaign.createdAt || new Date().toISOString()
            }));
            
            // Merge with local campaigns
            const campaignIds = new Set(filteredCampaigns.map(c => c.id));
            formattedApiCampaigns.forEach(apiCampaign => {
              if (!campaignIds.has(apiCampaign.id)) {
                filteredCampaigns.push(apiCampaign);
              }
            });
            
            // Update local storage with merged campaigns
            campaigns = [...campaigns.filter(c => c.instanceName !== fullInstanceName), ...formattedApiCampaigns];
            saveCampaignsToStorage();
          }
        } else {
          console.log("API de lista falhou, usando apenas armazenamento local");
        }
      }
    } catch (apiError) {
      console.error("Erro ao buscar campanhas da API:", apiError);
      // Continue with local campaigns if API fails
    }
    
    return filteredCampaigns;
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    return [];
  }
};

// Function to cancel a scheduled campaign
export const cancelCampaign = async (instanceName: string, campaignId: string): Promise<boolean> => {
  try {
    console.log("Cancelando campanha:", { instanceName, campaignId });
    
    // Update local storage first
    const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex !== -1) {
      campaigns[campaignIndex].status = 'canceled';
      saveCampaignsToStorage();
    }
    
    // Get Evolution API URL from env or default
    const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';
    
    // Try to call the Evolution API to cancel the campaign
    try {
      const response = await fetch(`${EVO_API_URL}/campaign/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName,
          campaignId,
        }),
      });

      if (response.ok) {
        console.log("Campanha cancelada com API sucesso");
      } else {
        console.log("API falhou, mas campanha foi cancelada localmente");
      }
    } catch (apiError) {
      console.error("Erro na API ao cancelar campanha, usando apenas armazenamento local:", apiError);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao cancelar campanha:", error);
    // We'll still check if we updated our local state
    const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
    return campaignIndex !== -1 && campaigns[campaignIndex].status === 'canceled';
  }
};

// Function to get clients from the client service for campaigns
export const getClientList = async (): Promise<{id: string, name: string, whatsapp: string}[]> => {
  try {
    // Dynamically import clientService to avoid circular dependencies
    const { getAllClients } = await import('./clientService');
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
