
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

    // Prepare the base instance name (without _Cliente suffix if present)
    const baseInstanceName = instanceName.replace("_Cliente", "");
    
    // Get Evolution API URL from env or default
    const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';
    
    // Call the Evolution API to schedule the campaign
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API ao agendar campanha:", errorText);
      throw new Error(`Erro ao agendar campanha: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Campanha agendada com sucesso:", result);
    
    return { 
      success: true, 
      campaignId: result.campaignId || result.id 
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
export const getCampaigns = async (instanceName: string) => {
  try {
    console.log("Buscando campanhas agendadas para a instância:", instanceName);
    
    // Get Evolution API URL from env or default
    const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';
    
    // Call the Evolution API to get campaigns
    const response = await fetch(`${EVO_API_URL}/campaign/list/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar campanhas: ${response.status} ${response.statusText}`);
    }

    const campaigns = await response.json();
    console.log("Campanhas encontradas:", campaigns);
    
    return campaigns;
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    throw error;
  }
};

// Function to cancel a scheduled campaign
export const cancelCampaign = async (instanceName: string, campaignId: string) => {
  try {
    console.log("Cancelando campanha:", { instanceName, campaignId });
    
    // Get Evolution API URL from env or default
    const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';
    
    // Call the Evolution API to cancel the campaign
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

    if (!response.ok) {
      throw new Error(`Erro ao cancelar campanha: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Campanha cancelada com sucesso:", result);
    
    return result;
  } catch (error) {
    console.error("Erro ao cancelar campanha:", error);
    throw error;
  }
};
