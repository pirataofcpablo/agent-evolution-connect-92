// API Evo service for WhatsApp connection

interface DifyConfig {
  instanceName: string;
  apiKey: string;
  enabled?: boolean;
  difyUrl?: string;
  difyApiKey?: string;
  url?: string;
  type?: string;
}

export const buildDifyAPIUrl = (config: DifyConfig) => {
  const baseUrl = config.difyUrl || 'https://cloud.dify.ai';
  const apiKey = config.difyApiKey || config.apiKey;
  const encodedInstanceName = encodeURIComponent(config.instanceName);

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

export const registerDifyBot = async (config: DifyConfig) => {
  try {
    const EVO_API_URL = import.meta.env.VITE_EVO_API_URL || '/api/evolution';
    const difyApiUrl = buildDifyAPIUrl(config);

    console.log("Registrando webhook para Dify:", {
      instanceName: config.instanceName,
      difyApiUrl,
    });

    // Primeiro registramos o webhook
    const response = await fetch(`${EVO_API_URL}/webhook/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName: config.instanceName,
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
      const settingsResponse = await fetch(`${EVO_API_URL}/settings/${config.instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (settingsResponse.ok) {
        const currentSettings = await settingsResponse.json();

        await fetch(`${EVO_API_URL}/settings/${config.instanceName}`, {
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
