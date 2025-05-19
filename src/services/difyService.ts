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
    // Remover qualquer sufixo _Cliente para normalização
    const baseInstanceName = instanceName.replace("_Cliente", "");
    const instanceWithSuffix = `${baseInstanceName}_Cliente`;
    
    console.log(`Iniciando registro do bot Dify para a instância base: ${baseInstanceName}`);
    console.log(`Tentando com nome com sufixo: ${instanceWithSuffix}`);
    
    // Obter lista de instâncias
    console.log("Buscando todas as instâncias disponíveis...");
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
    console.log("Total de instâncias encontradas:", instances?.length || 0);
    
    // Debug - listar todas as instâncias e seus nomes
    if (Array.isArray(instances)) {
      instances.forEach((instance: any, index: number) => {
        console.log(`Instância ${index + 1}: ${instance.instanceName || 'Nome não definido'}`);
      });
    }
    
    // Verificar se existe com qualquer um dos nomes (com ou sem sufixo)
    let foundInstance = null;
    let foundInstanceName = "";
    
    if (Array.isArray(instances)) {
      // Primeiro tentar com o nome exatamente como passado
      foundInstance = instances.find((instance: any) => 
        instance.instanceName?.toLowerCase() === instanceName.toLowerCase());
      
      // Se não encontrou, tentar com sufixo _Cliente
      if (!foundInstance) {
        foundInstance = instances.find((instance: any) => 
          instance.instanceName?.toLowerCase() === instanceWithSuffix.toLowerCase());
        
        if (foundInstance) {
          foundInstanceName = instanceWithSuffix;
          console.log(`Encontrada instância com sufixo: ${foundInstanceName}`);
        }
      } else {
        foundInstanceName = instanceName;
        console.log(`Encontrada instância com nome exato: ${foundInstanceName}`);
      }
      
      // Se ainda não encontrou, tentar sem sufixo _Cliente
      if (!foundInstance) {
        foundInstance = instances.find((instance: any) => 
          instance.instanceName?.toLowerCase() === baseInstanceName.toLowerCase());
        
        if (foundInstance) {
          foundInstanceName = baseInstanceName;
          console.log(`Encontrada instância com nome base: ${foundInstanceName}`);
        }
      }
    }
    
    // Se não encontrou a instância, lançar erro
    if (!foundInstance) {
      console.error("Nenhuma instância encontrada com os nomes testados:");
      console.error(`- ${instanceName}`);
      console.error(`- ${baseInstanceName}`);
      console.error(`- ${instanceWithSuffix}`);
      throw new Error(`Instância não encontrada. Verifique se a instância está conectada.`);
    }
    
    console.log(`Instância encontrada: ${foundInstanceName}, status: ${foundInstance.status || 'N/A'}`);
    console.log(`Prosseguindo com a integração para ${foundInstanceName}`);
    
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
    const integrationUrl = `${EVO_API_URL}/webhook/dify/${foundInstanceName}`;
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
    saveDifyConfig(baseInstanceName, config);
    
    console.log(`Bot Dify registrado com sucesso para ${baseInstanceName}`);
    return true;
  } catch (error: any) {
    console.error("Erro ao registrar chatbot Dify:", error);
    throw error;
  }
};
