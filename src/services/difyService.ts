
// Este arquivo foi simplificado para resolver problemas de compatibilidade.
// As funções básicas foram movidas para webhookService.ts

export const buildDifyWebhookPayload = () => {
  return {};
};

export const getDifyConfig = (instanceName?: string) => {
  // Return null since Dify integration has been removed
  return null;
};

export const checkInstanceStatus = async () => {
  return { exists: false, connected: false };
};
