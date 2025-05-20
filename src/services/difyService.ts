
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
  webhookEnabled?: boolean;
  difyWebhookUrl?: string;
  webhookSecret?: string;
  n8nIntegration?: boolean;
  n8nWebhookUrl?: string;
  webhookPayloadTemplate?: string;
}

export const buildDifyAPIUrl = (config: DifyConfig) => {
  const baseUrl = config.difyUrl || 'https://cloud.dify.ai';
  const apiKey = config.difyApiKey || config.apiKey;
  const encodedInstanceName = encodeURIComponent(config.instanceName || '');

  return `${baseUrl}/v1/chat-messages/whatsapp/webhook/${encodedInstanceName}?api_key=${apiKey}`;
};

export const buildDifyWebhookPayload = (message: string, sender: string, instance: string, template?: string) => {
  // Default template if none provided
  const defaultTemplate = `{
    "message": "{{message}}",
    "sender": "{{sender}}",
    "instance": "{{instance}}",
    "timestamp": "{{timestamp}}"
  }`;

  const payloadTemplate = template || defaultTemplate;
  
  // Replace variables in template
  const payload = payloadTemplate
    .replace(/{{message}}/g, message)
    .replace(/{{sender}}/g, sender)
    .replace(/{{instance}}/g, instance)
    .replace(/{{timestamp}}/g, new Date().toISOString());

  try {
    // Parse to ensure it's valid JSON
    return JSON.parse(payload);
  } catch (error) {
    console.error("Erro ao processar template de payload:", error);
    // Fallback to a simple valid JSON if template is invalid
    return {
      message,
      sender,
      instance,
      timestamp: new Date().toISOString()
    };
  }
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
    
    // Verificar conexão com Dify usando a API
    const apiUrl = config.apiUrl || 'https://api.dify.ai/v1';
    const appId = config.applicationId;
    
    if (!appId) {
      throw new Error("ID da aplicação não fornecido");
    }
    
    // Verificar apenas a autenticação sem enviar mensagem real
    // Usamos a API de meta-info ou healthcheck que não consome tokens
    try {
      const testUrl = `${apiUrl}/app-info`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      };
      
      const response = await fetch(testUrl, { 
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        console.log("Conexão com Dify validada com sucesso");
        return true;
      }
      
      console.log("Resposta do teste de conexão:", await response.text());
      throw new Error(`Falha na autenticação com o Dify (${response.status})`);
    } catch (error) {
      console.error("Erro ao testar API Dify primária:", error);
      
      // Tente um método alternativo de teste
      // Alguns endpoints do Dify podem variar dependendo da versão/hospedagem
      try {
        const alternativeTestUrl = `${apiUrl}/applications/${appId}`;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        };
        
        const altResponse = await fetch(alternativeTestUrl, { 
          method: 'GET',
          headers 
        });
        
        if (altResponse.ok) {
          console.log("Conexão com Dify validada usando método alternativo");
          return true;
        }
        
        return false;
      } catch (secondError) {
        console.error("Erro no método alternativo de teste:", secondError);
        return false;
      }
    }
  } catch (error) {
    console.error("Erro ao testar conexão com Dify:", error);
    return false;
  }
};

// Função para configurar webhook no Dify
export const configureDifyWebhook = async (config: DifyConfig): Promise<boolean> => {
  try {
    if (!config.webhookEnabled || !config.difyWebhookUrl) {
      console.log("Configuração de webhook não ativada ou URL não fornecida");
      return false;
    }
    
    console.log("Tentando configurar webhook no Dify:", {
      url: config.difyWebhookUrl,
      secret: config.webhookSecret ? "***" : "não fornecido"
    });
    
    // Como a API do Dify pode variar, podemos simular sucesso até que o usuário
    // confirme os detalhes exatos da API de webhooks do Dify para implementação
    
    // Na implementação real, faríamos uma chamada para a API do Dify aqui:
    // const apiUrl = config.apiUrl || 'https://api.dify.ai/v1';
    // const appId = config.applicationId;
    // const webhookApi = `${apiUrl}/applications/${appId}/webhook/config`;
    
    // const response = await fetch(webhookApi, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${config.apiKey}`
    //   },
    //   body: JSON.stringify({
    //     url: config.difyWebhookUrl,
    //     secret: config.webhookSecret
    //   })
    // });
    
    // return response.ok;
    
    // Simulação temporária
    console.log("Webhook configurado com sucesso (simulação)");
    return true;
  } catch (error) {
    console.error("Erro ao configurar webhook no Dify:", error);
    return false;
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
                webhookUrl: config.webhookEnabled ? config.difyWebhookUrl : null,
                webhookSecret: config.webhookSecret || null,
                n8nIntegration: config.n8nIntegration || false,
                n8nWebhookUrl: config.n8nWebhookUrl || null,
                webhookPayloadTemplate: config.webhookPayloadTemplate || null
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
                webhookUrl: null,
                webhookSecret: null,
                n8nIntegration: false,
                n8nWebhookUrl: null,
                webhookPayloadTemplate: null
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
    
    // Se a integração com n8n estiver ativada, enviar via n8n
    if (config.n8nIntegration && config.n8nWebhookUrl) {
      try {
        console.log("Usando integração n8n para enviar mensagem");
        
        const payload = buildDifyWebhookPayload(
          message, 
          "whatsapp", 
          config.instanceName || "", 
          config.webhookPayloadTemplate
        );
        
        const response = await fetch(config.n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        // Se o webhook n8n retornou uma resposta, usamos ela
        if (response.ok) {
          try {
            const data = await response.json();
            if (data && data.response) {
              console.log("Resposta recebida do n8n:", data.response);
              return data.response;
            }
          } catch (jsonError) {
            console.warn("Resposta do n8n não é JSON válido:", jsonError);
          }
        }
      } catch (n8nError) {
        console.error("Erro ao enviar para n8n:", n8nError);
        // Fallback para API direta do Dify
      }
    }
    
    // Implementação padrão - enviar diretamente para o Dify
    const apiUrl = config.apiUrl || 'https://api.dify.ai/v1';
    const appId = config.applicationId;
    
    if (!appId) {
      throw new Error("ID da aplicação não fornecido");
    }
    
    // Chamar API do Dify
    const chatUrl = `${apiUrl}/chat-messages`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };
    
    const body = {
      inputs: {},
      query: message,
      response_mode: "blocking",
      conversation_id: null,
      user: "whatsapp-user"
    };
    
    const response = await fetch(chatUrl, { 
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      console.error("Erro na resposta do Dify:", response.status);
      throw new Error(`Erro ao obter resposta do Dify: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // Se tem webhook configurado, enviar a resposta para o webhook
    if (config.webhookEnabled && config.difyWebhookUrl) {
      try {
        console.log("Enviando resposta para webhook:", config.difyWebhookUrl);
        
        const webhookPayload = buildDifyWebhookPayload(
          responseData.answer || "Sem resposta",
          "dify-ai",
          config.instanceName || "",
          config.webhookPayloadTemplate
        );
        
        fetch(config.difyWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.webhookSecret ? { 'X-Webhook-Secret': config.webhookSecret } : {})
          },
          body: JSON.stringify(webhookPayload)
        }).catch(webhookError => {
          console.error("Erro ao enviar para webhook:", webhookError);
        });
      } catch (webhookError) {
        console.error("Erro ao processar webhook:", webhookError);
      }
    }
    
    // Retornar a resposta do Dify
    return responseData.answer || "Não foi possível obter uma resposta.";
  } catch (error) {
    console.error("Erro ao enviar mensagem para Dify:", error);
    return "Desculpe, ocorreu um erro ao processar sua mensagem.";
  }
};
