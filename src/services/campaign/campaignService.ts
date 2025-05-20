
// Main campaign service - orchestrates storage and API operations
import { Campaign, CampaignParams, CampaignResult } from './types';
import { 
  loadCampaignsFromStorage, 
  addCampaignToStorage, 
  updateCampaignInStorage 
} from './storageService';
import { 
  scheduleApiCampaign, 
  fetchApiCampaigns,
  cancelApiCampaign
} from './apiService';

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
    
    // Create a local campaign entry
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
    addCampaignToStorage(newCampaign);

    try {
      // Try to call the Evolution API to schedule the campaign
      const apiResult = await scheduleApiCampaign(params, campaignId);
      
      // If API call succeeded and returned a campaign ID, update our local record
      if (apiResult.success && apiResult.apiCampaignId) {
        updateCampaignInStorage(campaignId, { id: apiResult.apiCampaignId });
        return { 
          success: true, 
          campaignId: apiResult.apiCampaignId
        };
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
    const localCampaigns = loadCampaignsFromStorage();
    
    // If instanceName is provided, filter by instance
    let filteredCampaigns = localCampaigns;
    if (instanceName) {
      const normalizedInstanceName = instanceName.replace("_Cliente", "");
      filteredCampaigns = localCampaigns.filter(campaign => 
        campaign.instanceName.replace("_Cliente", "") === normalizedInstanceName
      );
      
      try {
        // Try to get campaigns from API
        const apiCampaigns = await fetchApiCampaigns(instanceName);
        
        if (apiCampaigns.length > 0) {
          // Merge with local campaigns, giving API precedence
          const campaignIds = new Set(filteredCampaigns.map(c => c.id));
          apiCampaigns.forEach(apiCampaign => {
            if (!campaignIds.has(apiCampaign.id)) {
              filteredCampaigns.push(apiCampaign);
            }
          });
        }
      } catch (apiError) {
        console.error("Erro ao buscar campanhas da API:", apiError);
        // Continue with local campaigns if API fails
      }
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
    const updated = updateCampaignInStorage(campaignId, { status: 'canceled' });
    
    try {
      // Try to call the Evolution API to cancel the campaign
      await cancelApiCampaign(instanceName, campaignId);
    } catch (apiError) {
      console.error("Erro na API ao cancelar campanha, usando apenas armazenamento local:", apiError);
    }
    
    return updated;
  } catch (error) {
    console.error("Erro ao cancelar campanha:", error);
    return false;
  }
};

// Re-export client service function
export { getClientList } from './clientService';

// Re-export types for consumers
export type { Campaign, CampaignParams, CampaignResult } from './types';
