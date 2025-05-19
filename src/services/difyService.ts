
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

// Corrected webhook registration function for Dify integration
export const registerDifyBot = async (
  instanceName: string, 
  config: DifyConfig
): Promise<boolean> => {
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    console.log(`Registrando bot Dify para a instância ${instanceName}`);
    
    // Verificando se a instância existe
    const checkInstanceResponse = await fetch(`${EVO_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!checkInstanceResponse.ok) {
      const errorText = await checkInstanceResponse.text();
      console.error(`Erro ao verificar instâncias (${checkInstanceResponse.status}):`, errorText);
      throw new Error("Não foi possível verificar as instâncias disponíveis");
    }
    
    // Registrar o chatbot Dify na integração da Evolution API
    console.log(`Registrando chatbot Dify na instância ${instanceName}`);
    
    // Conforme a documentação da Evolution API para a integração de chatbots Dify
    const integrationOptions = {
      method: 'POST',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enabled: true, // Habilitar o chatbot
        description: "Integração automática Dify", // Descrição do chatbot
        settings: {
          type: "Chat Bot", // Tipo do bot
          url: config.apiUrl, // URL da API do Dify
          apikey: config.apiKey, // API Key do Dify
          triggerType: "All" // Tipo de trigger (responde a todas as mensagens)
        }
      })
    };

    console.log("Enviando requisição para registrar chatbot Dify:", integrationOptions);
    
    // Chamada para registrar o chatbot na instância
    const integrationResponse = await fetch(`${EVO_API_URL}/dify/${instanceName}`, integrationOptions);
    
    if (!integrationResponse.ok) {
      let errorText = "";
      try {
        errorText = await integrationResponse.text();
      } catch (err) {
        errorText = "Não foi possível ler o erro";
      }
      
      console.error(`Erro ao registrar chatbot Dify (${integrationResponse.status}):`, errorText);
      throw new Error("Falha ao registrar o chatbot Dify na instância WhatsApp");
    }
    
    const responseData = await integrationResponse.json();
    console.log("Resposta do registro do chatbot Dify:", responseData);
    
    if (responseData.error) {
      throw new Error(`Erro retornado pela API: ${responseData.error}`);
    }
    
    // Salvar a configuração localmente
    saveDifyConfig(instanceName.replace("_Cliente", ""), config);
    
    console.log("Integração do chatbot Dify concluída com sucesso");
    return true;
  } catch (error: any) {
    console.error("Erro ao registrar chatbot Dify:", error);
    throw error;
  }
};
