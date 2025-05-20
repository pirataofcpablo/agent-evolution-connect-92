
// Campaign service shared types

export interface CampaignParams {
  instanceName: string;
  campaignName: string;
  message: string;
  recipients: string[];
  scheduledDateTime: Date;
}

export interface CampaignResult {
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

export interface ClientInfo {
  id: string;
  name: string;
  whatsapp: string;
}
