
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

// Função de registro de bot Dify revisada para melhor compatibilidade com a API Evolution
export const registerDifyBot = async (
  instanceName: string, 
  config: DifyConfig
): Promise<boolean> => {
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    // Normalizar o nome da instância para diferentes possibilidades
    const baseName = instanceName.replace("_Cliente", "");
    const instanceWithSuffix = `${baseName}_Cliente`;
    
    console.log(`Iniciando registro do bot Dify para a instância: ${instanceName}`);
    console.log(`Nome base: ${baseName}, Nome com sufixo: ${instanceWithSuffix}`);
    
    // Obter detalhes diretos da instância para garantir que está conectada
    const instanceDetails = await getInstanceDetails(instanceName);
    
    if (!instanceDetails) {
      // Se não encontrou por este nome, tentar com o sufixo
      const alternativeDetails = await getInstanceDetails(instanceWithSuffix);
      
      if (!alternativeDetails) {
        // Se ainda não encontrou, tentar com o nome base
        const baseNameDetails = await getInstanceDetails(baseName);
        
        if (!baseNameDetails) {
          // Verificar em todas as instâncias disponíveis
          const allInstances = await fetchAllInstances();
          let foundInstance = false;
          let actualInstanceName = instanceWithSuffix;
          
          if (Array.isArray(allInstances) && allInstances.length > 0) {
            for (const inst of allInstances) {
              const instName = inst.instanceName || inst.name || "";
              
              if (
                instName.toLowerCase() === instanceName.toLowerCase() ||
                instName.toLowerCase() === instanceWithSuffix.toLowerCase() ||
                instName.toLowerCase() === baseName.toLowerCase() ||
                instName.toLowerCase().includes(baseName.toLowerCase())
              ) {
                foundInstance = true;
                actualInstanceName = instName;
                console.log(`Instância encontrada na lista: ${instName}`);
                break;
              }
            }
          }
          
          if (!foundInstance) {
            throw new Error(`Não foi possível encontrar a instância ${instanceName}. Verifique se a instância está conectada.`);
          }
          
          // Continuar com o nome encontrado
          console.log(`Usando nome de instância encontrado: ${actualInstanceName}`);
          
          // Formatar corretamente a URL da API Dify para a integração
          let difyApiUrl = config.apiUrl;
          if (!difyApiUrl.includes('/v1')) {
            difyApiUrl = difyApiUrl.endsWith('/') ? `${difyApiUrl}v1` : `${difyApiUrl}/v1`;
          }
          
          // Construir o corpo da solicitação
          const requestBody = {
            url: difyApiUrl,
            apiKey: config.apiKey,
            enabled: true
          };
          
          console.log(`Enviando solicitação para registrar chatbot Dify usando instância: ${actualInstanceName}`);
          
          // URL da integração com o nome encontrado
          const integrationUrl = `${EVO_API_URL}/webhook/dify/${actualInstanceName}`;
          console.log(`URL para integração: ${integrationUrl}`);
          
          const integrationResponse = await fetch(integrationUrl, {
            method: 'POST',
            headers: {
              'apikey': EVO_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log(`Status da resposta: ${integrationResponse.status}`);
          
          if (!integrationResponse.ok) {
            const errorText = await integrationResponse.text();
            throw new Error(`Falha ao integrar o bot Dify: ${errorText}`);
          }
          
          // Processar resposta bem-sucedida
          const responseData = await integrationResponse.json();
          console.log("Resposta da integração Dify:", responseData);
          
          // Salvar configuração localmente
          saveDifyConfig(baseName, config);
          
          console.log(`Bot Dify registrado com sucesso para ${baseName}`);
          return true;
        }
      }
    }
    
    console.log(`Detalhes da instância encontrados: Nome=${instanceDetails?.instanceName || instanceDetails?.name || 'N/A'}`);
    
    // Determinar qual nome usar para a integração (com ou sem sufixo)
    // Usar o nome exato como retornado pela API
    const finalInstanceName = instanceDetails?.instanceName || instanceDetails?.name || instanceWithSuffix;
    console.log(`Nome final para integração: ${finalInstanceName}`);
    
    // Formatar corretamente a URL da API Dify para a integração
    let difyApiUrl = config.apiUrl;
    if (!difyApiUrl.includes('/v1')) {
      difyApiUrl = difyApiUrl.endsWith('/') ? `${difyApiUrl}v1` : `${difyApiUrl}/v1`;
    }
    
    // Construir o corpo da solicitação
    const requestBody = {
      url: difyApiUrl,
      apiKey: config.apiKey,
      enabled: true
    };
    
    console.log(`Enviando solicitação para registrar chatbot Dify:`, requestBody);
    
    // URL correta para integração com Dify
    const integrationUrl = `${EVO_API_URL}/webhook/dify/${finalInstanceName}`;
    console.log(`URL para integração: ${integrationUrl}`);
    
    const integrationResponse = await fetch(integrationUrl, {
      method: 'POST',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`Status da resposta: ${integrationResponse.status}`);
    
    if (!integrationResponse.ok) {
      // Tentar determinar o erro
      let errorText = "";
      try {
        errorText = await integrationResponse.text();
      } catch (err) {
        errorText = "Não foi possível ler o erro";
      }
      
      // Tentar com nome alternativo se o primeiro falhar
      if (integrationResponse.status === 404 || errorText.includes("not found")) {
        console.log(`Tentativa falhou. Tentando com nome alternativo: ${baseName}`);
        
        const alternativeUrl = `${EVO_API_URL}/webhook/dify/${baseName}`;
        console.log(`URL alternativa: ${alternativeUrl}`);
        
        const alternativeResponse = await fetch(alternativeUrl, {
          method: 'POST',
          headers: {
            'apikey': EVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!alternativeResponse.ok) {
          // Se ainda falhar, tentar uma terceira variante
          console.log(`Segunda tentativa falhou. Tentando com terceira variante.`);
          
          // Tentar com o nome exato como está no localStorage
          const storedName = localStorage.getItem('instanceName');
          if (storedName) {
            const thirdUrl = `${EVO_API_URL}/webhook/dify/${storedName}`;
            console.log(`URL da terceira tentativa: ${thirdUrl}`);
            
            const thirdResponse = await fetch(thirdUrl, {
              method: 'POST',
              headers: {
                'apikey': EVO_API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            });
            
            if (!thirdResponse.ok) {
              const thirdErrorText = await thirdResponse.text();
              console.error(`Erro na terceira tentativa (${thirdResponse.status}):`, thirdErrorText);
              throw new Error(`Falha em todas as tentativas de registro do bot Dify. Último erro: ${thirdErrorText}`);
            }
            
            const thirdResponseData = await thirdResponse.json();
            console.log("Resposta da integração Dify (terceira tentativa):", thirdResponseData);
            
            // Salvar configuração
            saveDifyConfig(baseName, config);
            return true;
          }
          
          const altErrorText = await alternativeResponse.text();
          console.error(`Erro na segunda tentativa (${alternativeResponse.status}):`, altErrorText);
          throw new Error(`Falha nas tentativas de registro do bot Dify. Erro: ${altErrorText}`);
        }
        
        const altResponseData = await alternativeResponse.json();
        console.log("Resposta da integração Dify (segunda tentativa):", altResponseData);
        
        // Salvar configuração
        saveDifyConfig(baseName, config);
        return true;
      }
      
      console.error(`Erro ao registrar bot Dify (${integrationResponse.status}):`, errorText);
      throw new Error(`Falha ao registrar o bot Dify: ${errorText}`);
    }
    
    // Processar resposta bem-sucedida
    const responseData = await integrationResponse.json();
    console.log("Resposta da integração Dify:", responseData);
    
    // Salvar configuração localmente
    saveDifyConfig(baseName, config);
    
    console.log(`Bot Dify registrado com sucesso para ${baseName}`);
    return true;
  } catch (error: any) {
    console.error("Erro ao registrar chatbot Dify:", error);
    throw error;
  }
};

// Importe as funções adicionais do evoService
import { fetchAllInstances, getInstanceDetails } from '../services/evoService';
