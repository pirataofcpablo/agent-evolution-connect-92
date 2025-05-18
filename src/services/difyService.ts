
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

// Nova função para testar a conexão com o Dify
export const testDifyConnection = async (config: DifyConfig): Promise<boolean> => {
  try {
    const endpoint = config.modelType === 'chat' 
      ? `/chat-messages` 
      : `/completion-messages`;
    
    console.log(`Testando conexão Dify com endpoint: ${config.apiUrl}${endpoint}`);
    
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

    console.log("Resposta do teste Dify:", response.status);
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
    
    console.log(`Enviando mensagem para Dify: ${message}`);
    console.log(`URL: ${config.apiUrl}${endpoint}`);
    
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
      console.error(`Erro na API Dify: ${response.status} ${response.statusText}`);
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

// Função para registrar o bot Dify na Evolution API
export const registerDifyBot = async (
  instanceName: string, 
  config: DifyConfig
): Promise<boolean> => {
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    console.log(`Registrando webhook do Dify para a instância ${instanceName}`);
    
    // URL para onde a Evolution API enviará as mensagens
    // Usamos a URL atual do navegador como base para o webhook
    const baseUrl = window.location.origin;
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
      const responseData = await response.json().catch(() => ({}));
      console.error("Erro ao registrar webhook:", responseData);
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
