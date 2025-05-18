
interface DifyConfig {
  apiKey: string;
  apiUrl: string;
  applicationId: string;
  modelType: string;
}

export const saveDifyConfig = (instanceName: string, config: DifyConfig): void => {
  localStorage.setItem(`dify_config_${instanceName}`, JSON.stringify(config));
};

export const getDifyConfig = (instanceName: string): DifyConfig | null => {
  const config = localStorage.getItem(`dify_config_${instanceName}`);
  return config ? JSON.parse(config) : null;
};

export const sendMessageToDify = async (
  message: string, 
  config: DifyConfig
): Promise<string> => {
  try {
    const endpoint = config.modelType === 'chat' 
      ? `/chat-messages` 
      : `/completion-messages`;
    
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'blocking',
        conversation_id: '',
        user: 'whatsapp-user',
        files: []
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API Dify: ${response.statusText}`);
    }

    const data = await response.json();
    return data.answer || "Não consegui processar sua mensagem.";
  } catch (error) {
    console.error('Erro ao enviar mensagem para o Dify:', error);
    return "Erro ao processar mensagem com o assistente Dify.";
  }
};
