
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

// Função de registro de bot Dify completamente revisada
export const registerDifyBot = async (
  instanceName: string, 
  config: DifyConfig
): Promise<boolean> => {
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    console.log(`Iniciando registro do bot Dify para a instância ${instanceName}`);
    
    // Verificar se a instância existe usando o endpoint correto
    console.log(`Verificando se a instância ${instanceName} existe...`);
    
    const fetchInstancesResponse = await fetch(`${EVO_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!fetchInstancesResponse.ok) {
      const errorText = await fetchInstancesResponse.text();
      console.error(`Erro ao buscar instâncias (${fetchInstancesResponse.status}): ${errorText}`);
      throw new Error(`Erro ao buscar instâncias: ${fetchInstancesResponse.status}`);
    }
    
    const instances = await fetchInstancesResponse.json();
    console.log("Instâncias disponíveis:", instances);
    
    // Verificar se a instância existe por nome exato
    const instanceExists = Array.isArray(instances) && instances.some((instance: any) => {
      console.log(`Comparando: '${instance.instanceName?.toLowerCase()}' com '${instanceName.toLowerCase()}'`);
      return instance.instanceName?.toLowerCase() === instanceName.toLowerCase();
    });
    
    console.log(`Instância ${instanceName} existe? ${instanceExists ? "Sim" : "Não"}`);
    
    if (!instanceExists) {
      // Se não encontrar com o sufixo _Cliente, tente sem ele
      const baseInstanceName = instanceName.replace("_Cliente", "");
      const baseInstanceExists = Array.isArray(instances) && instances.some((instance: any) => {
        return instance.instanceName?.toLowerCase() === baseInstanceName.toLowerCase();
      });
      
      if (baseInstanceExists) {
        console.log(`Encontrada instância com nome base: ${baseInstanceName}`);
        instanceName = baseInstanceName; // Use o nome sem sufixo
      } else {
        console.error(`Instância ${instanceName} não encontrada`);
        throw new Error(`Instância ${instanceName} não encontrada. Verifique se a instância está conectada.`);
      }
    }
    
    console.log(`Instância ${instanceName} encontrada, procedendo com a integração`);
    
    // Formatar corretamente a URL da API Dify para a integração
    let difyApiUrl = config.apiUrl;
    if (!difyApiUrl.includes('/v1')) {
      difyApiUrl = difyApiUrl.endsWith('/') ? `${difyApiUrl}v1` : `${difyApiUrl}/v1`;
    }
    
    // Usar o endpoint correto para registrar o webhook do Dify
    console.log(`Registrando webhook para Dify na instância ${instanceName}`);
    
    // Corpo da requisição conforme documentação da Evolution API para integração Dify
    const requestBody = {
      url: difyApiUrl,
      apiKey: config.apiKey,
      enabled: true
    };
    
    console.log(`Enviando solicitação para registrar chatbot Dify:`, requestBody);
    
    // Usar o endpoint correto para integração com o Dify
    const integrationUrl = `${EVO_API_URL}/webhook/dify/${instanceName}`;
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
      let errorText = "";
      try {
        errorText = await integrationResponse.text();
      } catch (err) {
        errorText = "Não foi possível ler o erro";
      }
      
      console.error(`Erro ao registrar bot Dify (${integrationResponse.status}):`, errorText);
      throw new Error(`Falha ao registrar o bot Dify: ${errorText}`);
    }
    
    // Processar resposta bem-sucedida
    const responseData = await integrationResponse.json();
    console.log("Resposta da integração Dify:", responseData);
    
    // Salvar configuração localmente
    const baseInstanceName = instanceName.replace("_Cliente", "");
    saveDifyConfig(baseInstanceName, config);
    
    console.log(`Bot Dify registrado com sucesso para ${baseInstanceName}`);
    return true;
  } catch (error: any) {
    console.error("Erro ao registrar chatbot Dify:", error);
    throw error;
  }
};
