
// Campaign storage service for localStorage operations
import { Campaign } from './types';

// In-memory storage for campaigns
let campaigns: Campaign[] = [];

// Function to load campaigns from localStorage
export const loadCampaignsFromStorage = (): Campaign[] => {
  try {
    const storedCampaigns = localStorage.getItem('campaigns');
    if (storedCampaigns) {
      campaigns = JSON.parse(storedCampaigns);
    }
    return [...campaigns];
  } catch (error) {
    console.error("Erro ao carregar campanhas do localStorage:", error);
    return [];
  }
};

// Function to save campaigns to localStorage
export const saveCampaignsToStorage = (updatedCampaigns?: Campaign[]): void => {
  try {
    if (updatedCampaigns) {
      campaigns = updatedCampaigns;
    }
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
  } catch (error) {
    console.error("Erro ao salvar campanhas no localStorage:", error);
  }
};

// Function to add a campaign to storage
export const addCampaignToStorage = (campaign: Campaign): void => {
  campaigns.push(campaign);
  saveCampaignsToStorage();
};

// Function to update a campaign in storage
export const updateCampaignInStorage = (campaignId: string, updates: Partial<Campaign>): boolean => {
  const index = campaigns.findIndex(c => c.id === campaignId);
  if (index !== -1) {
    campaigns[index] = { ...campaigns[index], ...updates };
    saveCampaignsToStorage();
    return true;
  }
  return false;
};

// Initialize campaigns from localStorage on module load
loadCampaignsFromStorage();
