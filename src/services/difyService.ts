
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

// Nova função para testar a conexão com o Dify
export const testDifyConnection = async (config: DifyConfig): Promise<boolean> => {
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
        query: "Teste de conexão",
        response_mode: "blocking",
        conversation_id: '',
        user: 'whatsapp-integration-test',
        files: []
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao testar conexão com Dify:', error);
    return false;
  }
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

// Nova função para registrar o bot Dify na Evolution API
export const registerDifyBot = async (
  instanceName: string, 
  config: DifyConfig
): Promise<boolean> => {
  // Aqui estamos registrando o webhook na Evolution API
  // Este webhook será notificado quando uma nova mensagem chegar
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    // Registrar webhook para a instância
    const webhookUrl = `https://crispy-space-acorn-xj5654vq6rh99g9-3000.app.github.dev/api/dify/webhook/${instanceName}`;
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "instanceName": instanceName,
        "webhookUrl": webhookUrl,
        "events": ["messages.upsert"]
      })
    };

    const response = await fetch(`${EVO_API_URL}/instance/webhook`, options);
    return response.ok;
  } catch (error) {
    console.error("Erro ao registrar webhook do Dify:", error);
    return false;
  }
};
