
// API Evo service for WhatsApp connection

interface DifyConfig {
  apiKey: string;
  apiUrl: string;
  applicationId: string;
  modelType: string;
}

export const saveDifyConfig = (instanceName: string, config: DifyConfig): void => {
  try {
    // Normalizar o nome da instância removendo _Cliente se presente
    const normalizedName = instanceName.replace("_Cliente", "");
    localStorage.setItem(`dify_config_${normalizedName}`, JSON.stringify(config));
    console.log(`Configuração Dify salva para ${normalizedName}:`, config);
  } catch (error) {
    console.error(`Erro ao salvar configuração Dify para ${instanceName}:`, error);
  }
};

export const getDifyConfig = (instanceName: string): DifyConfig | null => {
  try {
    // Normalizar o nome da instância removendo _Cliente se presente
    const normalizedName = instanceName.replace("_Cliente", "");
    const config = localStorage.getItem(`dify_config_${normalizedName}`);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error(`Erro ao recuperar configuração Dify para ${instanceName}:`, error);
    return null;
  }
};

// Função de teste de conexão corrigida para melhor comunicação com a API Dify
export const testDifyConnection = async (config: DifyConfig): Promise<boolean> => {
  try {
    console.log(`Testando conexão com Dify usando API key: ${config.apiKey.substring(0, 5)}...`);
    console.log(`URL da API: ${config.apiUrl}, Tipo de modelo: ${config.modelType}`);
    
    // Corrigir endpoint com base no tipo de modelo
    const endpoint = config.modelType === 'chat' 
      ? `/chat-messages` 
      : `/completion-messages`;
    
    // Garantir que a URL base esteja formatada corretamente
    let baseUrl = config.apiUrl;
    if (!baseUrl.includes('/v1')) {
      baseUrl = baseUrl.endsWith('/') ? `${baseUrl}v1` : `${baseUrl}/v1`;
    }
    
    const finalUrl = `${baseUrl}${endpoint}`;
    console.log(`URL final para teste: ${finalUrl}`);
    
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
        user: "test-user"
      })
    });

    console.log(`Código de status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Erro na resposta Dify (${response.status}):`, errorData);
      throw new Error(`Erro na API Dify: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Resposta do teste Dify bem-sucedida:", data);
    return true;
  } catch (error) {
    console.error('Erro durante o teste de conexão com Dify:', error);
    return false;
  }
};

// Função para verificar o status atual da instância através da API Evolution
export const checkInstanceStatus = async (instanceName: string): Promise<{exists: boolean, connected: boolean}> => {
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    console.log(`Verificando status da instância: ${instanceName}`);
    
    // Primeiro tentar obter detalhes diretos da instância se disponível
    const normalizedName = instanceName.replace("_Cliente", "");
    const fullName = normalizedName + "_Cliente";
    
    console.log(`Tentando verificação direta para: ${fullName} e ${normalizedName}`);
    
    try {
      // Usar a nova função getInstanceDetails para verificação direta
      const instanceDetails = await getInstanceDetails(instanceName);
      
      if (instanceDetails) {
        console.log(`Instância encontrada diretamente: ${instanceDetails.instanceName || instanceDetails.name}`);
        const status = instanceDetails.status || instanceDetails.connectionStatus || "Unknown";
        
        const isConnected = 
          status === "CONNECTED" || 
          status === "ONLINE" || 
          status === "On" ||
          status === "Connected" ||
          status === "open";
        
        return {
          exists: true,
          connected: isConnected
        };
      }
    } catch (directError) {
      console.log("Verificação direta falhou, tentando método alternativo");
    }
    
    // Se o método direto falhar, tentar com a lista de instâncias
    const instances = await fetchAllInstances();
    console.log(`Instâncias encontradas: ${instances?.length || 0}`);
    
    if (Array.isArray(instances)) {
      // Verificar possíveis formatos de nome
      const possibleNames = [
        instanceName,
        fullName,
        normalizedName,
        instanceName.toLowerCase(),
        fullName.toLowerCase(),
        normalizedName.toLowerCase()
      ];
      
      // Procurar correspondência na lista de instâncias
      for (const instance of instances) {
        if (!instance.instanceName && !instance.name) continue;
        
        const currentName = (instance.instanceName || instance.name || "").toLowerCase();
        
        // Verificar correspondências
        for (const name of possibleNames) {
          if (currentName === name.toLowerCase() || 
              currentName.includes(normalizedName.toLowerCase())) {
            
            console.log(`Instância encontrada: ${instance.instanceName || instance.name} com status: ${instance.status || instance.connectionStatus || 'N/A'}`);
            
            const status = instance.status || instance.connectionStatus || "Unknown";
            const isConnected = 
              status === "CONNECTED" || 
              status === "ONLINE" || 
              status === "On" ||
              status === "Connected" ||
              status === "open";
            
            return {
              exists: true,
              connected: isConnected
            };
          }
        }
      }
    }
    
    console.log("Nenhuma instância encontrada com o nome fornecido");
    return {exists: false, connected: false};
  } catch (error) {
    console.error("Erro ao verificar status da instância:", error);
    return {exists: false, connected: false};
  }
};

// Função de envio de mensagem atualizada
export const sendMessageToDify = async (
  message: string, 
  config: DifyConfig
): Promise<string> => {
  try {
    const endpoint = config.modelType === 'chat' 
      ? `/chat-messages` 
      : `/completion-messages`;
    
    // Garantir que a URL base esteja formatada corretamente
    let baseUrl = config.apiUrl;
    if (!baseUrl.includes('/v1')) {
      baseUrl = baseUrl.endsWith('/') ? `${baseUrl}v1` : `${baseUrl}/v1`;
    }
    
    const finalUrl = `${baseUrl}${endpoint}`;
    
    console.log(`Enviando mensagem para Dify: "${message}"`);
    console.log(`URL final: ${finalUrl}`);
    
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

// Função melhorada para registro automático do bot Dify
export const registerDifyBot = async (
  instanceName: string, 
  config: DifyConfig
): Promise<boolean> => {
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    // Log detalhado para depuração
    console.log("======= INICIANDO REGISTRO DO BOT DIFY =======");
    console.log(`Instância fornecida: ${instanceName}`);
    
    // Normalizar o nome da instância para diferentes possibilidades
    const baseName = instanceName.replace("_Cliente", "");
    const instanceWithSuffix = `${baseName}_Cliente`;
    
    console.log(`Nome base: ${baseName}`);
    console.log(`Nome com sufixo: ${instanceWithSuffix}`);
    
    // Obter detalhes diretos da instância para identificar a instância exata no Evolution API
    const instanceDetails = await getInstanceDetails(instanceWithSuffix);
    
    if (!instanceDetails) {
      console.error("Não foi possível obter detalhes da instância");
      throw new Error(`Não foi possível encontrar informações para a instância ${instanceName}`);
    }
    
    console.log("Detalhes da instância obtidos:", instanceDetails);
    const exactInstanceName = instanceDetails.instanceName || instanceDetails.name || instanceWithSuffix;
    console.log(`Nome exato da instância: ${exactInstanceName}`);
    
    // Formatar corretamente a URL da API Dify para a integração
    let difyApiUrl = config.apiUrl;
    if (!difyApiUrl.includes('/v1')) {
      difyApiUrl = difyApiUrl.endsWith('/') ? `${difyApiUrl}v1` : `${difyApiUrl}/v1`;
    }
    
    // Criar array com diferentes formatos de endpoints para tentar
    const endpointFormats = [
      // Formato para API mais recente
      { 
        url: `${EVO_API_URL}/instance/dify/${exactInstanceName}`,
        method: 'POST',
        body: {
          difyUrl: difyApiUrl,
          difyApiKey: config.apiKey,
          enabled: true
        }
      },
      // Formato para endpoint manager
      { 
        url: `${EVO_API_URL}/manager/instance/${exactInstanceName}/dify`,
        method: 'POST',
        body: {
          url: difyApiUrl,
          apiKey: config.apiKey,
          enabled: true
        }
      },
      // Formato para webhook especifico
      { 
        url: `${EVO_API_URL}/instance/webhook/set`,
        method: 'POST',
        body: {
          instanceName: exactInstanceName,
          url: difyApiUrl,
          type: "dify",
          apiKey: config.apiKey,
          enabled: true
        }
      },
      // Formato para webhook genérico
      { 
        url: `${EVO_API_URL}/instance/webhook/${exactInstanceName}`,
        method: 'POST',
        body: {
          url: difyApiUrl,
          type: "dify",
          apiKey: config.apiKey,
          enabled: true
        }
      }
    ];
    
    // Tentativa adicional com endpoint no formato da Evolution v2
    endpointFormats.push({
      url: `${EVO_API_URL}/webhook/set`,
      method: 'POST',
      body: {
        webhook: {
          url: difyApiUrl,
          apiKey: config.apiKey
        },
        events: ["all"],
        enabled: true,
        type: "dify",
        instanceName: exactInstanceName
      }
    });
    
    // Formato para configuração direta nas settings
    let settingsEndpoint = null;
    try {
      // Obter configurações atuais primeiro
      const settingsResponse = await fetch(`${EVO_API_URL}/instance/settings/${exactInstanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (settingsResponse.ok) {
        const currentSettings = await settingsResponse.json();
        settingsEndpoint = {
          url: `${EVO_API_URL}/instance/settings/${exactInstanceName}`,
          method: 'POST',
          body: {
            ...currentSettings,
            webhook: {
              ...currentSettings?.webhook,
              dify: {
                url: difyApiUrl,
                apiKey: config.apiKey,
                enabled: true
              }
            }
          }
        };
        endpointFormats.push(settingsEndpoint);
      }
    } catch (error) {
      console.log("Não foi possível obter configurações atuais para atualização");
    }
    
    // Tentar cada formato de endpoint até que um funcione
    console.log(`Tentando ${endpointFormats.length} formatos de endpoint diferentes...`);
    
    let successfulEndpoint = null;
    for (const [index, endpoint] of endpointFormats.entries()) {
      try {
        console.log(`[${index + 1}/${endpointFormats.length}] Tentando endpoint: ${endpoint.url}`);
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'apikey': EVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(endpoint.body)
        });
        
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          data = responseText;
        }
        
        if (response.ok || response.status === 200 || response.status === 201) {
          console.log(`Sucesso com endpoint ${index + 1}:`, data);
          successfulEndpoint = endpoint;
          break;
        } else {
          console.log(`Falha no endpoint ${index + 1} (${response.status}):`, data);
        }
      } catch (error) {
        console.error(`Erro ao tentar endpoint ${index + 1}:`, error);
      }
    }
    
    // Tentar método especial para o formato da Evolution API v2 Manager
    if (!successfulEndpoint) {
      try {
        console.log(`Tentando endpoint do manager v2 específico com botões de configuração...`);
        const managerEndpoint = `${EVO_API_URL}/manager/bots/add`;
        const response = await fetch(managerEndpoint, {
          method: 'POST',
          headers: {
            'apikey': EVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instance: exactInstanceName,
            botType: "dify",
            configuration: {
              apiUrl: difyApiUrl,
              apiKey: config.apiKey,
              enabled: true
            }
          })
        });
        
        if (response.ok) {
          console.log("Sucesso com endpoint manager v2!");
          successfulEndpoint = { url: managerEndpoint, method: 'POST', body: {} };
        } else {
          const data = await response.text();
          console.log(`Falha no endpoint manager v2 (${response.status}):`, data);
        }
      } catch (error) {
        console.error("Erro ao tentar endpoint manager v2:", error);
      }
    }
    
    // Salvar configuração local em todos os casos
    saveDifyConfig(baseName, config);
    
    // Se nenhum endpoint funcionou, mesmo assim retornar para modo manual
    if (!successfulEndpoint) {
      console.log("Nenhum endpoint funcionou, mas config local foi salva.");
      throw new Error("Configuração local salva. Webhook não pôde ser registrado automaticamente.");
    }
    
    return true;
  } catch (error: any) {
    console.error("Erro no processo de registro do bot Dify:", error);
    throw error;
  }
};

// Função adicional para verificar webhooks existentes e suas configurações
export const checkExistingWebhooks = async (instanceName: string): Promise<any[]> => {
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    // Normalizar o nome da instância
    const baseName = instanceName.replace("_Cliente", "");
    const instanceWithSuffix = `${baseName}_Cliente`;
    
    // Tentar diferentes endpoints para listar webhooks
    const endpoints = [
      `${EVO_API_URL}/instance/webhook/list/${instanceWithSuffix}`,
      `${EVO_API_URL}/instance/webhook/list`,
      `${EVO_API_URL}/webhook/list/${instanceWithSuffix}`,
      `${EVO_API_URL}/manager/instance/${instanceWithSuffix}/webhooks`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': EVO_API_KEY
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Webhooks encontrados via ${endpoint}:`, data);
          
          // Filtrar apenas webhooks do tipo dify se for uma lista
          if (Array.isArray(data)) {
            const difyWebhooks = data.filter(webhook => 
              webhook.type === 'dify' || 
              webhook.name === 'dify' || 
              webhook.webhook_type === 'dify'
            );
            return difyWebhooks;
          } else if (data.webhooks && Array.isArray(data.webhooks)) {
            return data.webhooks.filter(webhook => 
              webhook.type === 'dify' || 
              webhook.name === 'dify' || 
              webhook.webhook_type === 'dify'
            );
          }
          return data;
        }
      } catch (err) {
        console.log(`Erro ao tentar endpoint ${endpoint}:`, err);
      }
    }
    
    return [];
  } catch (error) {
    console.error("Erro ao verificar webhooks existentes:", error);
    return [];
  }
};

// Função para configurar webhook diretamente via iframe
export const setupDifyWebhookViaIframe = async (
  instanceName: string,
  config: DifyConfig
): Promise<string> => {
  // Esta função gera um URL que pode ser usado em um iframe para configuração
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    // Normalizar o nome da instância
    const baseName = instanceName.replace("_Cliente", "");
    const instanceWithSuffix = `${baseName}_Cliente`;
    
    // Formatar URL da API Dify
    let difyApiUrl = config.apiUrl;
    if (!difyApiUrl.includes('/v1')) {
      difyApiUrl = difyApiUrl.endsWith('/') ? `${difyApiUrl}v1` : `${difyApiUrl}/v1`;
    }
    
    // Criar URL codificado para o iframe
    const iframeUrl = `${EVO_API_URL}/manager/embed/dify-setup?` + new URLSearchParams({
      instance: instanceWithSuffix,
      apiUrl: difyApiUrl,
      apiKey: config.apiKey,
      returnUrl: window.location.href
    }).toString();
    
    console.log(`URL do iframe gerado: ${iframeUrl}`);
    
    return iframeUrl;
  } catch (error) {
    console.error("Erro ao gerar URL para iframe:", error);
    throw error;
  }
};

// Nova função para configurar webhook diretamente via API com proxy
export const setupDifyWebhookViaProxy = async (
  instanceName: string,
  config: DifyConfig
): Promise<boolean> => {
  // Esta função usa um endpoint proxy para configurar o webhook
  try {
    // Normalizar o nome da instância
    const baseName = instanceName.replace("_Cliente", "");
    const instanceWithSuffix = `${baseName}_Cliente`;
    
    // Formatar URL da API Dify
    let difyApiUrl = config.apiUrl;
    if (!difyApiUrl.includes('/v1')) {
      difyApiUrl = difyApiUrl.endsWith('/') ? `${difyApiUrl}v1` : `${difyApiUrl}/v1`;
    }
    
    // Tentar usar um endpoint proxy para configuração
    const proxyUrl = "https://api.integrador-whatsapp.com/webhook/setup-dify";
    
    console.log(`Tentando configurar webhook via proxy: ${proxyUrl}`);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: instanceWithSuffix,
        difyUrl: difyApiUrl,
        difyApiKey: config.apiKey,
        apiKey: "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z" // Chave da Evolution API
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Erro na resposta do proxy (${response.status}):`, errorData);
      throw new Error(`Erro na API de proxy: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Resposta do proxy:", data);
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || "Erro desconhecido no proxy");
    }
  } catch (error) {
    console.error("Erro ao configurar webhook via proxy:", error);
    return false;
  }
};

// Importe as funções adicionais do evoService
import { fetchAllInstances, getInstanceDetails } from '../services/evoService';
