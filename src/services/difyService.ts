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

// Função de registro de bot Dify revisada para resolver o problema de 404 na API Evolution
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
    
    // CORREÇÃO: Verificar instâncias disponíveis na API Evolution
    console.log("Verificando todas as instâncias disponíveis na API Evolution...");
    const instances = await fetchAllInstances();
    
    if (!Array.isArray(instances) || instances.length === 0) {
      throw new Error("Não foi possível obter a lista de instâncias da API Evolution.");
    }
    
    console.log(`Total de ${instances.length} instâncias encontradas na API Evolution`);
    
    // Encontrar a instância correta entre as disponíveis
    let finalInstanceName = "";
    let foundInstance = false;
    
    for (const instance of instances) {
      const apiInstanceName = instance.instanceName || instance.name;
      const status = instance.status || instance.connectionStatus;
      
      console.log(`- Instância API: ${apiInstanceName}, Status: ${status}`);
      
      if (!apiInstanceName) continue;
      
      // Verificar se corresponde à instância atual
      if (apiInstanceName.toLowerCase() === instanceName.toLowerCase() || 
          apiInstanceName.toLowerCase() === instanceWithSuffix.toLowerCase()) {
        console.log(`✓ Encontrada correspondência exata: ${apiInstanceName}`);
        finalInstanceName = apiInstanceName;
        foundInstance = true;
        break;
      }
      
      // Nome parcial também é válido
      if (apiInstanceName.toLowerCase().includes(baseName.toLowerCase())) {
        console.log(`✓ Encontrada correspondência parcial: ${apiInstanceName}`);
        finalInstanceName = apiInstanceName;
        foundInstance = true;
        break;
      }
    }
    
    if (!foundInstance) {
      console.error("Nenhuma instância compatível encontrada na API Evolution");
      throw new Error(`Não foi possível encontrar uma instância compatível com "${instanceName}"`);
    }
    
    console.log(`Instância selecionada para integração: "${finalInstanceName}"`);
    
    // Formatar corretamente a URL da API Dify para a integração
    let difyApiUrl = config.apiUrl;
    if (!difyApiUrl.includes('/v1')) {
      difyApiUrl = difyApiUrl.endsWith('/') ? `${difyApiUrl}v1` : `${difyApiUrl}/v1`;
    }
    
    // CORREÇÃO: Verificar e ajustar o endpoint da API Evolution para webhook
    // Testando diferentes formatos de endpoint para o webhook Dify
    // Nova abordagem usando path API direto
    
    const requestBody = {
      url: difyApiUrl,
      apiKey: config.apiKey,
      enabled: true
    };
    
    console.log("Payload para registro do webhook:", JSON.stringify(requestBody, null, 2));
    
    // Primeiro método - Endpoint padrão
    console.log(`Tentando registro com URL: ${EVO_API_URL}/webhook/dify/${finalInstanceName}`);
    
    try {
      const response = await fetch(`${EVO_API_URL}/webhook/dify/${finalInstanceName}`, {
        method: 'POST',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log(`Resposta HTTP: ${response.status}`);
      
      if (response.ok) {
        console.log("Webhook registrado com sucesso!");
        const data = await response.json();
        console.log("Dados da resposta:", data);
        
        // Salvar configuração localmente
        saveDifyConfig(baseName, config);
        return true;
      }
      
      const errorText = await response.text();
      console.error(`Erro na primeira tentativa: ${errorText}`);
      
      // Não lançar erro aqui, tentar método alternativo
    } catch (error) {
      console.error("Erro na primeira tentativa:", error);
      // Continuar com próxima tentativa
    }
    
    // Segundo método - Endpoint com configuração específica
    console.log(`Tentando segundo método: ${EVO_API_URL}/instance/dify/${finalInstanceName}`);
    
    try {
      const response2 = await fetch(`${EVO_API_URL}/instance/dify/${finalInstanceName}`, {
        method: 'POST',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          difyUrl: difyApiUrl,
          difyApiKey: config.apiKey,
          enabled: true
        })
      });
      
      console.log(`Resposta HTTP do segundo método: ${response2.status}`);
      
      if (response2.ok) {
        console.log("Segundo método: Webhook registrado com sucesso!");
        const data = await response2.json();
        console.log("Dados da resposta:", data);
        
        // Salvar configuração localmente
        saveDifyConfig(baseName, config);
        return true;
      }
      
      const errorText = await response2.text();
      console.error(`Erro na segunda tentativa: ${errorText}`);
      
      // Não lançar erro ainda, tentar método alternativo
    } catch (error) {
      console.error("Erro na segunda tentativa:", error);
      // Continuar com próxima tentativa
    }
    
    // Terceiro método - Endpoint v1 legado
    console.log(`Tentando terceiro método (v1 legado): ${EVO_API_URL}/v1/set-webhook-dify`);
    
    try {
      const response3 = await fetch(`${EVO_API_URL}/v1/set-webhook-dify`, {
        method: 'POST',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: finalInstanceName,
          difyUrl: difyApiUrl,
          difyApiKey: config.apiKey,
          enabled: true
        })
      });
      
      console.log(`Resposta HTTP do terceiro método: ${response3.status}`);
      
      if (response3.ok) {
        console.log("Terceiro método: Webhook registrado com sucesso!");
        const data = await response3.json();
        console.log("Dados da resposta:", data);
        
        // Salvar configuração localmente
        saveDifyConfig(baseName, config);
        return true;
      }
      
      const errorText = await response3.text();
      console.error(`Erro na terceira tentativa: ${errorText}`);
      
    } catch (error) {
      console.error("Erro na terceira tentativa:", error);
    }
    
    // Quarto método - Endpoint direto para configurações
    console.log(`Tentando quarto método: ${EVO_API_URL}/instance/settings/${finalInstanceName}`);
    
    try {
      // Primeiro, obter as configurações atuais
      const getSettings = await fetch(`${EVO_API_URL}/instance/settings/${finalInstanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const currentSettings = await getSettings.json();
      console.log("Configurações atuais:", currentSettings);
      
      // Atualizar as configurações com webhook do Dify
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
      
      const response4 = await fetch(`${EVO_API_URL}/instance/settings/${finalInstanceName}`, {
        method: 'POST',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      });
      
      console.log(`Resposta HTTP do quarto método: ${response4.status}`);
      
      if (response4.ok) {
        console.log("Quarto método: Webhook registrado com sucesso!");
        const data = await response4.json();
        console.log("Dados da resposta:", data);
        
        // Salvar configuração localmente
        saveDifyConfig(baseName, config);
        return true;
      }
      
      const errorText = await response4.text();
      console.error(`Erro na quarta tentativa: ${errorText}`);
      
    } catch (error) {
      console.error("Erro na quarta tentativa:", error);
    }
    
    // Quinto método - Endpoint geral de webhooks
    console.log(`Tentando quinto método: ${EVO_API_URL}/instance/webhook/set`);
    
    try {
      const response5 = await fetch(`${EVO_API_URL}/instance/webhook/set`, {
        method: 'POST',
        headers: {
          'apikey': EVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: finalInstanceName,
          url: difyApiUrl,
          type: "dify",
          apiKey: config.apiKey,
          enabled: true
        })
      });
      
      console.log(`Resposta HTTP do quinto método: ${response5.status}`);
      
      if (response5.ok) {
        console.log("Quinto método: Webhook registrado com sucesso!");
        const data = await response5.json();
        console.log("Dados da resposta:", data);
        
        // Salvar configuração localmente
        saveDifyConfig(baseName, config);
        return true;
      }
      
      const errorText = await response5.text();
      console.error(`Erro na quinta tentativa: ${errorText}`);
      
    } catch (error) {
      console.error("Erro na quinta tentativa:", error);
    }
    
    // Se chegamos aqui, todas as tentativas falharam
    // Considerar salvo localmente mesmo assim para não bloquear o usuário
    console.log("Todas as tentativas de registro de webhook falharam, mas salvando configuração localmente para uso do app");
    saveDifyConfig(baseName, config);
    
    // Devolver erro específico para tratamento na interface
    throw new Error(`Falha em todas as tentativas de registro do webhook Dify para ${finalInstanceName}.`);
    
  } catch (error: any) {
    console.error("Erro no processo de registro do bot Dify:", error);
    throw error;
  }
};

// Importe as funções adicionais do evoService
import { fetchAllInstances, getInstanceDetails } from '../services/evoService';
