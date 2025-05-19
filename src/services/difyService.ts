
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

// NOVA IMPLEMENTAÇÃO - Função melhorada para registro automático do bot Dify
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
    
    // Detectar a versão e interface da Evolution API verificando endpoints específicos
    console.log("Detectando versão da Evolution API...");
    
    // Verificar primeiro se há suporte à interface específica para Dify
    // Nova abordagem: Primeiro verificar se o endpoint de configuração específica do Dify existe
    try {
      const configCheck = await fetch(`${EVO_API_URL}/instance/webhook/list`, {
        method: 'GET',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (configCheck.ok) {
        console.log("Detectado endpoint de listagem de webhook, usando interface mais recente");
        
        // Registrar o webhook usando a interface moderna v2 (instance/webhook/set)
        const webhookData = {
          instanceName: exactInstanceName,
          url: difyApiUrl,
          type: "dify",
          apiKey: config.apiKey,
          enabled: true
        };
        
        console.log("Registrando webhook com dados:", webhookData);
        
        const response = await fetch(`${EVO_API_URL}/instance/webhook/set`, {
          method: 'POST',
          headers: {
            'apikey': EVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookData)
        });
        
        if (response.ok) {
          console.log("Webhook registrado com sucesso usando endpoint moderno");
          const data = await response.json();
          console.log("Resposta:", data);
          
          // Salvar configuração localmente
          saveDifyConfig(baseName, config);
          return true;
        } else {
          const errorText = await response.text();
          console.error(`Erro no registro do webhook: ${response.status} - ${errorText}`);
          throw new Error(`Erro ao registrar webhook: ${response.status}`);
        }
      }
    } catch (error) {
      console.log("Continuando com métodos alternativos...");
    }
    
    // Tentar interface específica para Dify
    try {
      const difyCheck = await fetch(`${EVO_API_URL}/instance/dify/${exactInstanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (difyCheck.ok || difyCheck.status === 404) {  // 404 é aceitável se ainda não existir configuração
        console.log("Detectado suporte à interface específica para Dify");
        
        const difyData = {
          difyUrl: difyApiUrl,
          difyApiKey: config.apiKey,
          enabled: true
        };
        
        console.log("Registrando com interface específica para Dify:", difyData);
        
        const response = await fetch(`${EVO_API_URL}/instance/dify/${exactInstanceName}`, {
          method: 'POST',
          headers: {
            'apikey': EVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(difyData)
        });
        
        if (response.ok) {
          console.log("Integração Dify registrada com sucesso usando endpoint específico");
          const data = await response.json();
          console.log("Resposta:", data);
          
          // Salvar configuração localmente
          saveDifyConfig(baseName, config);
          return true;
        }
      }
    } catch (error) {
      console.log("Interface específica para Dify não disponível, tentando método alternativo...");
    }
    
    // Tentar endpoint direto de configurações
    try {
      console.log("Tentando através das configurações gerais da instância...");
      
      // Obter configurações atuais da instância
      const settingsResponse = await fetch(`${EVO_API_URL}/instance/settings/${exactInstanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (settingsResponse.ok) {
        const currentSettings = await settingsResponse.json();
        console.log("Configurações atuais:", currentSettings);
        
        // Atualizar configurações com webhook do Dify
        const updatedSettings = {
          ...currentSettings,
          webhook: {
            ...currentSettings?.webhook,
            dify: {
              url: difyApiUrl,
              apiKey: config.apiKey,
              enabled: true
            }
          }
        };
        
        console.log("Atualizando configurações da instância:", updatedSettings);
        
        const updateResponse = await fetch(`${EVO_API_URL}/instance/settings/${exactInstanceName}`, {
          method: 'POST',
          headers: {
            'apikey': EVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedSettings)
        });
        
        if (updateResponse.ok) {
          console.log("Configurações atualizadas com sucesso");
          const data = await updateResponse.json();
          console.log("Resposta:", data);
          
          // Salvar configuração localmente
          saveDifyConfig(baseName, config);
          return true;
        }
      }
    } catch (error) {
      console.log("Método de configurações gerais falhou, tentando último recurso...");
    }
    
    // Tentar através do endpoint de manager
    try {
      console.log("Tentando através do endpoint do manager...");
      
      // Verificar se o endpoint do manager está acessível
      const managerUrl = `${EVO_API_URL}/manager/instance/${exactInstanceName}/dify`;
      console.log(`Verificando endpoint do manager: ${managerUrl}`);
      
      const managerResponse = await fetch(managerUrl, {
        method: 'POST',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: difyApiUrl,
          apiKey: config.apiKey,
          enabled: true
        })
      });
      
      if (managerResponse.ok) {
        console.log("Webhook registrado com sucesso através do manager");
        const data = await managerResponse.json();
        console.log("Resposta:", data);
        
        // Salvar configuração localmente
        saveDifyConfig(baseName, config);
        return true;
      }
    } catch (error) {
      console.log("Todos os métodos falharam para registro automático do webhook");
    }
    
    // Se chegamos aqui, todas as tentativas falharam mas vamos salvar a configuração mesmo assim
    console.log("Salvando configuração localmente para uso do aplicativo");
    saveDifyConfig(baseName, config);
    
    // Informar que a configuração foi salva, mas é necessário registro manual
    throw new Error("Configuração local salva, mas é necessário configurar o webhook manualmente na Evolution API");
    
  } catch (error: any) {
    console.error("Erro no processo de registro do bot Dify:", error);
    throw error;
  }
};

// Importe as funções adicionais do evoService
import { fetchAllInstances, getInstanceDetails } from '../services/evoService';
