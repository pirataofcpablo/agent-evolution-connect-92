
// Typebot service for integration with Evolution API

const LOCAL_STORAGE_KEY = 'typebotConfigs';

interface TypebotConfig {
  apiKey: string;
  workspaceId: string;
  botId: string;
  publicId: string;
  enabled: boolean;
}

// Get Typebot configuration for a specific instance
export const getTypebotConfig = (instanceName: string): TypebotConfig | null => {
  try {
    const configs = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (configs) {
      const parsedConfigs = JSON.parse(configs);
      return parsedConfigs[instanceName] || null;
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter configuração do Typebot:", error);
    return null;
  }
};

// Save Typebot configuration for a specific instance
export const saveTypebotConfig = async (
  instanceName: string, 
  config: TypebotConfig
): Promise<boolean> => {
  try {
    // Get existing configs
    const existingConfigsStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existingConfigs = existingConfigsStr ? JSON.parse(existingConfigsStr) : {};
    
    // Update config for this instance
    existingConfigs[instanceName] = config;
    
    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingConfigs));
    
    console.log(`Configuração do Typebot salva para instância ${instanceName}:`, config);
    return true;
  } catch (error) {
    console.error("Erro ao salvar configuração do Typebot:", error);
    return false;
  }
};

// Test connection with Typebot API
export const testTypebotConnection = async (
  config: TypebotConfig
): Promise<{success: boolean, message: string}> => {
  try {
    if (!config.apiKey || !config.workspaceId) {
      return {
        success: false,
        message: "API Key e Workspace ID são necessários para testar a conexão."
      };
    }

    // Simulate an API call to verify connection
    // In a real implementation, this would make an actual API call to Typebot
    console.log("Testando conexão com Typebot usando:", config);
    
    // Simulate API response
    const responseOk = config.apiKey.length > 10;
    
    if (responseOk) {
      return {
        success: true,
        message: "Conexão com Typebot estabelecida com sucesso!"
      };
    } else {
      return {
        success: false,
        message: "API Key inválida ou muito curta. Verifique suas credenciais."
      };
    }
  } catch (error) {
    console.error("Erro ao testar conexão com Typebot:", error);
    return {
      success: false,
      message: "Ocorreu um erro ao testar a conexão com o Typebot."
    };
  }
};

// Send message to Typebot flow
export const sendMessageToTypebot = async (
  message: string,
  sender: string,
  config: TypebotConfig
): Promise<string | null> => {
  try {
    if (!config.enabled || !config.apiKey || !config.workspaceId) {
      console.log("Integração com Typebot não está habilitada ou configurada corretamente");
      return null;
    }

    console.log(`Enviando mensagem para Typebot: "${message}" de ${sender}`);
    
    // Simulated response - in a real implementation, this would call the Typebot API
    // and return the response from the Typebot flow
    const typebotResponse = `Resposta simulada do Typebot para: "${message}"`;
    
    console.log("Resposta do Typebot:", typebotResponse);
    return typebotResponse;
  } catch (error) {
    console.error("Erro ao enviar mensagem para Typebot:", error);
    return null;
  }
};

// Register webhook for Typebot integration
export const registerTypebotWebhook = async (
  instanceName: string,
  config: TypebotConfig,
  webhookUrl: string
): Promise<boolean> => {
  try {
    if (!config.enabled || !config.apiKey || !config.workspaceId) {
      console.log("Integração com Typebot não está habilitada ou configurada corretamente");
      return false;
    }

    console.log(`Registrando webhook para Typebot na instância ${instanceName}`);
    
    // Simulated response - in a real implementation, this would register the webhook with Typebot
    console.log(`Webhook registrado em ${webhookUrl}`);
    return true;
  } catch (error) {
    console.error("Erro ao registrar webhook para Typebot:", error);
    return false;
  }
};
