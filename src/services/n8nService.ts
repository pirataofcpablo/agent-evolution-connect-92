
interface N8nConfig {
  webhookUrl: string;
  apiKey?: string;
  n8nUrl?: string;
  enableWebhook: boolean;
  enableApi: boolean;
}

export const saveN8nConfig = (instanceName: string, config: N8nConfig): void => {
  localStorage.setItem(`n8n_config_${instanceName}`, JSON.stringify(config));
};

export const getN8nConfig = (instanceName: string): N8nConfig | null => {
  const config = localStorage.getItem(`n8n_config_${instanceName}`);
  return config ? JSON.parse(config) : null;
};

export const sendMessageToN8n = async (
  message: string,
  senderNumber: string,
  config: N8nConfig
): Promise<boolean> => {
  if (config.enableWebhook && config.webhookUrl) {
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sender: senderNumber,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar mensagem para o webhook n8n:', error);
      return false;
    }
  }

  if (config.enableApi && config.apiKey && config.n8nUrl) {
    try {
      // Implementar chamada para API do n8n
      // Esta parte depende da API específica do n8n configurada pelo usuário
      return true;
    } catch (error) {
      console.error('Erro ao chamar API do n8n:', error);
      return false;
    }
  }

  return false;
};
