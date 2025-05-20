
// Main export file - re-exports from modular campaign services
export { 
  scheduleCampaign,
  getCampaigns,
  cancelCampaign,
  getClientList,
  type Campaign,
  type CampaignParams,
  type CampaignResult
} from './campaign/campaignService';
