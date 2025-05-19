
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

// Função para verificar o status atual da instância através da API Evolution
export const checkInstanceStatus = async (instanceName: string): Promise<{exists: boolean, connected: boolean}> => {
  const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
  const EVO_API_URL = "https://v2.solucoesweb.uk";
  
  try {
    console.log(`Verificando status da instância: ${instanceName}`);
    
    // Verificar variações de nome (com e sem _Cliente)
    const possibleNames = [
      instanceName,
      instanceName.endsWith("_Cliente") ? instanceName : `${instanceName}_Cliente`,
      instanceName.replace("_Cliente", "")
    ];
    
    console.log(`Nomes possíveis para busca: ${possibleNames.join(", ")}`);
    
    // Obter lista de instâncias
    const fetchInstancesResponse = await fetch(`${EVO_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!fetchInstancesResponse.ok) {
      throw new Error(`Erro ao buscar instâncias: ${fetchInstancesResponse.status}`);
    }
    
    const instances = await fetchInstancesResponse.json();
    console.log(`Instâncias encontradas: ${instances?.length || 0}`);
    
    // Debug - listar todas as instâncias
    if (Array.isArray(instances)) {
      console.log("Lista de instâncias disponíveis:");
      instances.forEach((inst: any, index: number) => {
        console.log(`${index + 1}. ${inst.instanceName} (status: ${inst.status || 'N/A'})`);
      });
    }
    
    // Verificar se algum dos possíveis nomes existe nas instâncias
    let foundInstance = null;
    let foundName = "";
    
    if (Array.isArray(instances)) {
      for (const name of possibleNames) {
        foundInstance = instances.find((instance: any) => 
          instance.instanceName?.toLowerCase() === name.toLowerCase());
        
        if (foundInstance) {
          foundName = name;
          console.log(`Instância encontrada como: ${foundName} (status: ${foundInstance.status || 'N/A'})`);
          break;
        }
      }
    }
    
    if (!foundInstance) {
      console.log("Nenhuma instância encontrada com os nomes testados");
      return {exists: false, connected: false};
    }
    
    const isConnected = foundInstance.status === "CONNECTED" || 
                       foundInstance.status === "ONLINE" || 
                       foundInstance.status === "On";
    
    return {
      exists: true,
      connected: isConnected
    };
    
  } catch (error) {
    console.error("Erro ao verificar status da instância:", error);
    return {exists: false, connected: false};
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
    // Normalizar nomes de instância para diferentes casos
    const baseInstanceName = instanceName.replace("_Cliente", "");
    const instanceWithSuffix = `${baseInstanceName}_Cliente`;
    
    console.log(`Iniciando registro do bot Dify para a instância base: ${baseInstanceName}`);
    console.log(`Também verificando com sufixo: ${instanceWithSuffix}`);
    
    // Verificar se a instância existe e está conectada
    const instanceStatus = await checkInstanceStatus(instanceName);
    
    if (!instanceStatus.exists) {
      console.error(`Instância não encontrada: ${instanceName}`);
      throw new Error(`Instância ${instanceName} não encontrada. Verifique se o nome está correto e se ela está criada no sistema.`);
    }
    
    if (!instanceStatus.connected) {
      console.error(`Instância encontrada, mas não está conectada: ${instanceName}`);
      throw new Error(`A instância ${instanceName} existe, mas não está conectada. Conecte-a primeiro antes de integrar o bot Dify.`);
    }
    
    console.log(`Instância verificada e conectada. Prosseguindo com integração Dify.`);
    
    // Determinar qual nome usar para a integração (com ou sem sufixo)
    // Primeiro tentamos com o nome exato como fornecido
    let finalInstanceName = instanceName;
    
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
      let errorText = "";
      try {
        errorText = await integrationResponse.text();
      } catch (err) {
        errorText = "Não foi possível ler o erro";
      }
      
      // Se a primeira tentativa falhar com erro 404, tentar com o nome alternativo
      if (integrationResponse.status === 404 && finalInstanceName !== instanceWithSuffix) {
        console.log(`Tentativa falhou. Tentando novamente com nome alternativo: ${instanceWithSuffix}`);
        
        const alternativeUrl = `${EVO_API_URL}/webhook/dify/${instanceWithSuffix}`;
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
          const altErrorText = await alternativeResponse.text();
          console.error(`Erro na segunda tentativa (${alternativeResponse.status}):`, altErrorText);
          throw new Error(`Falha nas duas tentativas de registro do bot Dify: ${altErrorText}`);
        }
        
        const altResponseData = await alternativeResponse.json();
        console.log("Resposta da integração Dify (segunda tentativa):", altResponseData);
        
        // Salvar com o nome base (sem sufixo) para manter consistência
        saveDifyConfig(baseInstanceName, config);
        return true;
      }
      
      console.error(`Erro ao registrar bot Dify (${integrationResponse.status}):`, errorText);
      throw new Error(`Falha ao registrar o bot Dify: ${errorText}`);
    }
    
    // Processar resposta bem-sucedida
    const responseData = await integrationResponse.json();
    console.log("Resposta da integração Dify:", responseData);
    
    // Salvar configuração localmente com o nome base
    saveDifyConfig(baseInstanceName, config);
    
    console.log(`Bot Dify registrado com sucesso para ${baseInstanceName}`);
    return true;
  } catch (error: any) {
    console.error("Erro ao registrar chatbot Dify:", error);
    throw error;
  }
};
