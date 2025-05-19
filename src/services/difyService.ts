// API Evo service for WhatsApp connection

interface DifyConfig {
  instanceName?: string;
  apiKey: string;
  enabled?: boolean;
  difyUrl?: string;
  difyApiKey?: string;
  url?: string;
  type?: string;
  apiUrl?: string;
  applicationId?: string;
  modelType?: string;
}

export const buildDifyAPIUrl = (config: DifyConfig) => {
  const baseUrl = config.difyUrl || 'https://cloud.dify.ai';
  const apiKey = config.difyApiKey || config.apiKey;
  const encodedInstanceName = encodeURIComponent(config.instanceName || '');

  return `${baseUrl}/v1/chat-messages/whatsapp/webhook/${encodedInstanceName}?api_key=${apiKey}`;
};

export const getDifyConfig = (instanceName: string): DifyConfig | null => {
  try {
    const storedConfig = localStorage.getItem(`difyConfig_${instanceName}`);
    if (storedConfig) {
      return JSON.parse(storedConfig) as DifyConfig;
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter configuração Dify do localStorage:", error);
    return null;
  }
};

export const saveDifyConfig = (config: DifyConfig) => {
  try {
    localStorage.setItem(`difyConfig_${config.instanceName}`, JSON.stringify(config));
    console.log(`Configuração Dify salva para a instância ${config.instanceName}`);
  } catch (error) {
    console.error("Erro ao salvar configuração Dify no localStorage:", error);
  }
};

export const deleteDifyConfig = (instanceName: string) => {
  try {
    localStorage.removeItem(`difyConfig_${instanceName}`);
    console.log(`Configuração Dify removida para a instância ${instanceName}`);
  } catch (error) {
    console.error("Erro ao remover configuração Dify do localStorage:", error);
  }
};

export const testDifyConnection = async (config: DifyConfig): Promise<boolean> => {
  try {
    console.log("Testando conexão com Dify:", config);
    // Simulate API call for now
    return Promise.resolve(true);
  } catch (error) {
    console.error("Erro ao testar conexão com Dify:", error);
    return Promise.resolve(false);
  }
};

export const registerDifyBot = async (instanceName: string, config: DifyConfig) => {
  try {
    const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';
    const difyApiUrl = buildDifyAPIUrl({...config, instanceName});

    console.log("Registrando webhook para Dify:", {
      instanceName,
      difyApiUrl,
    });

    // Primeiro registramos o webhook
    const response = await fetch(`${EVO_API_URL}/webhook/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName: instanceName,
        url: difyApiUrl,
        apiKey: config.apiKey,
        enabled: true,
        type: "dify",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register webhook: ${response.statusText}`);
    }

    // Depois atualizamos as configurações do bot para a instância
    try {
      const settingsResponse = await fetch(`${EVO_API_URL}/settings/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (settingsResponse.ok) {
        const currentSettings = await settingsResponse.json();

        await fetch(`${EVO_API_URL}/settings/${instanceName}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            ...currentSettings,
            webhooks: {
              ...currentSettings?.webhooks,
              dify: {
                url: difyApiUrl,
                apiKey: config.apiKey,
                enabled: true,
              },
            },
          }),
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      // Continue mesmo com erro nas configurações
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar webhook Dify:", error);
    return { success: false, error };
  }
};

export const unregisterDifyBot = async (instanceName: string) => {
  try {
    const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';

    console.log(`Desativando webhook para Dify na instância ${instanceName}`);

    // Desativar o webhook
    const response = await fetch(`${EVO_API_URL}/webhook/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName: instanceName,
        enabled: false,
        type: "dify",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to unregister webhook: ${response.statusText}`);
    }

    // Atualizar as configurações do bot para a instância
    try {
      const settingsResponse = await fetch(`${EVO_API_URL}/settings/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (settingsResponse.ok) {
        const currentSettings = await settingsResponse.json();

        await fetch(`${EVO_API_URL}/settings/${instanceName}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            ...currentSettings,
            webhooks: {
              ...currentSettings?.webhooks,
              dify: {
                url: null,
                apiKey: null,
                enabled: false,
              },
            },
          }),
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      // Continue mesmo com erro nas configurações
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao desativar webhook Dify:", error);
    return { success: false, error };
  }
};

export const checkInstanceStatus = async (instanceName: string) => {
  try {
    const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';
    console.log(`Verificando status da instância: ${instanceName}`);
    
    // Simulate API call
    return { exists: true, connected: true };
  } catch (error) {
    console.error("Erro ao verificar status da instância:", error);
    return { exists: false, connected: false };
  }
};

export const checkExistingWebhooks = async (instanceName: string) => {
  try {
    console.log(`Verificando webhooks existentes para: ${instanceName}`);
    // Simulate API call
    return [];
  } catch (error) {
    console.error("Erro ao verificar webhooks existentes:", error);
    return [];
  }
};

export const setupDifyWebhookViaProxy = async (instanceName: string, config: DifyConfig) => {
  try {
    console.log("Configurando webhook via proxy:", {instanceName, config});
    // Simulate API call
    return true;
  } catch (error) {
    console.error("Erro ao configurar webhook via proxy:", error);
    return false;
  }
};

export const setupDifyWebhookViaIframe = async (instanceName: string, config: DifyConfig) => {
  try {
    console.log("Gerando URL para iframe de configuração:", {instanceName, config});
    // Return a mock URL for now
    return "https://example.com/setup-iframe";
  } catch (error) {
    console.error("Erro ao gerar URL para iframe:", error);
    throw error;
  }
};

export const sendMessageToDify = async (message: string, config: DifyConfig) => {
  try {
    console.log("Enviando mensagem para Dify:", {message, config});
    // Simulate API call
    return "Resposta simulada do Dify";
  } catch (error) {
    console.error("Erro ao enviar mensagem para Dify:", error);
    return null;
  }
};
