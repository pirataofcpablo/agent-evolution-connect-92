
interface DifyConfig {
  apiKey: string;
  apiUrl: string;
  applicationId: string;
  modelType: string;
}

export const saveDifyConfig = (instanceName: string, config: DifyConfig): void => {
  try {
    localStorage.setItem(`dify_config_${instanceName}`, JSON.stringify(config));
    console.log(`Configuração Dify salva para ${instanceName}:`, config);
  } catch (error) {
    console.error(`Erro ao salvar configuração Dify para ${instanceName}:`, error);
  }
};

export const getDifyConfig = (instanceName: string): DifyConfig | null => {
  try {
    const config = localStorage.getItem(`dify_config_${instanceName}`);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error(`Erro ao recuperar configuração Dify para ${instanceName}:`, error);
    return null;
  }
};

// Improved test connection function with better error handling
export const testDifyConnection = async (config: DifyConfig): Promise<boolean> => {
  try {
    // Fix: Use the correct endpoint based on model type
    const endpoint = config.modelType === 'chat' 
      ? `/chat-messages` 
      : `/completion-messages`;
    
    // Make sure the URL ends with "/v1" if not already present
    const baseUrl = config.apiUrl.endsWith('/v1') ? config.apiUrl : `${config.apiUrl}/v1`;
    const finalUrl = `${baseUrl}${endpoint}`;
    
    console.log(`Testando conexão Dify com URL: ${finalUrl}`);
    
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        inputs: {},
        query: "Teste de conexão",
        response_mode: "blocking",
        conversation_id: '',
        user: 'whatsapp-integration-test'
      })
    });

    console.log("Resposta do teste Dify:", response.status);
    
    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Erro na resposta Dify:", errorData);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao testar conexão com Dify:', error);
    return false;
  }
};

// Improved send message function with better error handling
export const sendMessageToDify = async (
  message: string, 
  config: DifyConfig
): Promise<string> => {
  try {
    const endpoint = config.modelType === 'chat' 
      ? `/chat-messages` 
      : `/completion-messages`;
    
    // Make sure the URL ends with "/v1" if not already present
    const baseUrl = config.apiUrl.endsWith('/v1') ? config.apiUrl : `${config.apiUrl}/v1`;
    const finalUrl = `${baseUrl}${endpoint}`;
    
    console.log(`Enviando mensagem para Dify: ${message}`);
    console.log(`URL: ${finalUrl}`);
    
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'blocking',
        conversation_id: '',
        user: 'whatsapp-user'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Erro na API Dify (${response.status}):`, errorData);
      throw new Error(`Erro na API Dify: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Resposta do Dify:", data);
    return data.answer || "Não consegui processar sua mensagem.";
  } catch (error) {
    console.error('Erro ao enviar mensagem para o Dify:', error);
    return "Erro ao processar mensagem com o assistente Dify.";
  }
};

// Improved webhook registration function
export const registerDifyBot = async (
  instanceName: string, 
  config: DifyConfig
): Promise<boolean> => {
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    console.log(`Registrando webhook do Dify para a instância ${instanceName}`);
    
    // URL for Evolution API to send messages to
    // Use window.location.origin as base URL in the browser environment
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const webhookUrl = `${baseUrl}/api/dify/webhook/${instanceName}`;
    
    console.log(`URL do webhook: ${webhookUrl}`);
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: instanceName,
        webhookUrl: webhookUrl,
        events: ["messages.upsert"]
      })
    };

    console.log("Enviando requisição para registrar webhook:", options);

    const response = await fetch(`${EVO_API_URL}/instance/webhook`, options);
    
    if (!response.ok) {
      const responseData = await response.text();
      console.error(`Erro ao registrar webhook (${response.status}):`, responseData);
      return false;
    }
    
    const responseData = await response.json();
    console.log("Resposta do registro do webhook:", responseData);
    return true;
  } catch (error) {
    console.error("Erro ao registrar webhook do Dify:", error);
    return false;
  }
};
