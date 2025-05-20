
// Campaign API service for Evolution API interactions
import { CampaignParams, Campaign } from './types';

// Get Evolution API URL from env or default
const getApiUrl = (): string => {
  return import.meta.env.VITE_EVO_API_URL || '/api/evolution';
};

// Function to prepare instance name format
export const normalizeInstanceName = (instanceName: string): string => {
  // Ensure instance name has _Cliente suffix
  const baseInstanceName = instanceName.replace("_Cliente", "");
  return `${baseInstanceName}_Cliente`;
};

// Function to schedule a campaign via Evolution API
export const scheduleApiCampaign = async (
  params: CampaignParams,
  campaignId: string
): Promise<{success: boolean, apiCampaignId?: string}> => {
  try {
    const { instanceName, campaignName, message, recipients, scheduledDateTime } = params;
    
    // Prepare the base instance name
    const normalizedInstance = normalizeInstanceName(instanceName);
    const EVO_API_URL = getApiUrl();
    
    const response = await fetch(`${EVO_API_URL}/campaign/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName: normalizedInstance,
        campaignName,
        message,
        recipients,
        scheduledDateTime: scheduledDateTime.toISOString(),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Campanha agendada com API sucesso:", result);
      
      // Return the campaign ID from API if available
      return {
        success: true,
        apiCampaignId: result.campaignId || result.id
      };
    } else {
      console.log("API falhou, mas campanha foi salva localmente");
      return { success: false };
    }
  } catch (error) {
    console.error("Erro na API ao agendar campanha:", error);
    return { success: false };
  }
};

// Function to get campaigns from the Evolution API
export const fetchApiCampaigns = async (instanceName: string): Promise<Campaign[]> => {
  try {
    const EVO_API_URL = getApiUrl();
    const normalizedInstance = normalizeInstanceName(instanceName);
    
    const response = await fetch(`${EVO_API_URL}/campaign/list/${normalizedInstance}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const apiCampaigns = await response.json();
      console.log("Campanhas encontradas na API:", apiCampaigns);
      
      if (Array.isArray(apiCampaigns)) {
        // Map API campaigns to our format
        return apiCampaigns.map((apiCampaign: any) => ({
          id: apiCampaign.id || apiCampaign.campaignId,
          instanceName: normalizedInstance,
          campaignName: apiCampaign.campaignName || apiCampaign.name || 'Campanha',
          message: apiCampaign.message || '',
          recipients: apiCampaign.recipients || [],
          scheduledAt: apiCampaign.scheduledDateTime || apiCampaign.scheduledAt,
          status: apiCampaign.status || 'scheduled',
          createdAt: apiCampaign.createdAt || new Date().toISOString()
        }));
      }
    } else {
      console.log("API de lista falhou, usando apenas armazenamento local");
    }
    
    return [];
  } catch (error) {
    console.error("Erro ao buscar campanhas da API:", error);
    return [];
  }
};

// Function to cancel a campaign via Evolution API
export const cancelApiCampaign = async (instanceName: string, campaignId: string): Promise<boolean> => {
  try {
    const EVO_API_URL = getApiUrl();
    
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
      return true;
    } else {
      console.log("API falhou, mas campanha foi cancelada localmente");
      return false;
    }
  } catch (error) {
    console.error("Erro na API ao cancelar campanha:", error);
    return false;
  }
};
