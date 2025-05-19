// API Evo service for WhatsApp connection

const API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
const API_URL = "https://v2.solucoesweb.uk";

export interface EvoInstance {
  instanceName: string;
  status?: string;
  qrcode?: {
    base64: string;
  };
}

export const createEvoInstance = async (name: string): Promise<EvoInstance> => {
  const instanceName = `${name}_Cliente`;
  
  const options = {
    method: 'POST',
    headers: {
      'apikey': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "instanceName": instanceName,
      "token": "",
      "qrcode": true,
      "integration": "WHATSAPP-BAILEYS"
    })
  };

  try {
    const response = await fetch(`${API_URL}/instance/create`, options);
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    throw error;
  }
};

export const fetchAllInstances = async (): Promise<EvoInstance[]> => {
  const options = {
    method: 'GET',
    headers: {
      'apikey': API_KEY,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await fetch(`${API_URL}/instance/fetchInstances`, options);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar instâncias: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Debug - listar todas as instâncias encontradas
    if (Array.isArray(data)) {
      console.log("Instâncias disponíveis na fetchAllInstances:");
      data.forEach((inst: any, index: number) => {
        console.log(`${index + 1}. ${inst.instanceName} (status: ${inst.status || 'N/A'})`);
      });
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro ao buscar instâncias:', error);
    return [];
  }
};

export const createWorkspace = async (instanceName: string): Promise<any> => {
  const workspaceName = instanceName.replace("_Cliente", "");

  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': API_KEY
    },
    body: JSON.stringify({
      "name": workspaceName
    })
  };

  try {
    const response = await fetch('https://crispy-space-acorn-xj5654vq6rh99g9-3000.app.github.dev/api/v1/workspace/new', options);
    
    if (response.status === 403) {
      throw new Error('403 Forbidden: Verifique a chave da API e as permissões.');
    }
    
    if (!response.ok) {
      throw new Error(`Erro na criação do workspace: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar workspace:', error);
    throw error;
  }
};

export const connectToInstance = async (instanceName: string): Promise<any> => {
  const options = {
    method: 'GET',
    headers: {
      apikey: API_KEY
    }
  };

  try {
    console.log(`Tentando conectar à instância: ${instanceName}`);
    const response = await fetch(`${API_URL}/instance/connect/${instanceName}`, options);
    const data = await response.json();
    console.log(`Resposta da conexão: `, data);
    return data;
  } catch (error) {
    console.error('Erro ao conectar à instância:', error);
    throw error;
  }
};

export const checkInstanceExists = async (instanceName: string): Promise<{exists: boolean, status?: string}> => {
  try {
    console.log(`Verificando existência da instância: ${instanceName}`);
    
    // Buscar todas as instâncias
    const instances = await fetchAllInstances();
    console.log(`Total de instâncias encontradas: ${instances.length}`);
    
    // Mostrar todas as instâncias para debug
    if (Array.isArray(instances)) {
      console.log("Lista completa de instâncias da API Evolution:");
      instances.forEach((inst, idx) => {
        console.log(`${idx + 1}. Nome: ${inst.instanceName || 'N/A'} | Status: ${inst.status || 'N/A'}`);
      });
    }
    
    // Normalizar nomes para diferentes formatos possíveis
    const baseName = instanceName.replace('_Cliente', '');
    const fullName = baseName + '_Cliente';
    
    // Verificar todos os possíveis formatos do nome
    const possibleNames = [
      instanceName,
      fullName,
      baseName,
      instanceName.toLowerCase(),
      fullName.toLowerCase(),
      baseName.toLowerCase()
    ];
    
    console.log(`Verificando correspondências para: ${possibleNames.join(', ')}`);
    
    // Verificar correspondências de forma mais flexível
    for (const instance of instances) {
      if (!instance.instanceName) continue;
      
      const currentName = instance.instanceName.toLowerCase();
      
      // Verificar se algum dos possíveis nomes corresponde
      for (const name of possibleNames) {
        if (currentName === name.toLowerCase() || currentName.includes(baseName.toLowerCase())) {
          console.log(`Instância encontrada: ${instance.instanceName} com status: ${instance.status || 'N/A'}`);
          return {
            exists: true,
            status: instance.status
          };
        }
      }
    }
    
    console.log("Nenhuma instância correspondente encontrada após verificação minuciosa");
    return { exists: false };
  } catch (error) {
    console.error("Erro ao verificar existência da instância:", error);
    return { exists: false };
  }
};

export const getInstanceStatus = async (instanceName: string): Promise<string | null> => {
  try {
    // Normalizar nome removendo sufixo _Cliente se existir
    const normalizedName = instanceName.replace('_Cliente', '');
    const fullName = `${normalizedName}_Cliente`;
    
    console.log(`Verificando status para instância ${instanceName} (normalizado: ${normalizedName}, completo: ${fullName})`);
    
    // Obter todas as instâncias para encontrar a correspondente
    const instances = await fetchAllInstances();
    
    // Verificar todas as instâncias para correspondência exata ou parcial
    const matchedInstance = instances.find(instance => {
      if (!instance.instanceName) return false;
      
      const instanceLower = instance.instanceName.toLowerCase();
      return instanceLower === instanceName.toLowerCase() ||
             instanceLower === fullName.toLowerCase() ||
             instanceLower === normalizedName.toLowerCase() ||
             instanceLower.includes(normalizedName.toLowerCase());
    });
    
    if (matchedInstance) {
      console.log(`Instância encontrada: ${matchedInstance.instanceName} com status: ${matchedInstance.status || 'Desconhecido'}`);
      return matchedInstance.status || 'Desconhecido';
    }
    
    console.log(`Nenhuma instância encontrada para ${instanceName}`);
    return null;
  } catch (error) {
    console.error('Erro ao obter status da instância:', error);
    return null;
  }
};

export const logoutInstance = async (instanceName: string): Promise<any> => {
  const options = {
    method: 'DELETE',
    headers: {
      apikey: API_KEY
    }
  };

  try {
    const response = await fetch(`${API_URL}/instance/logout/${instanceName}`, options);
    return await response.json();
  } catch (error) {
    console.error('Erro ao desconectar instância:', error);
    throw error;
  }
};

export const deleteInstance = async (instanceName: string): Promise<any> => {
  const options = {
    method: 'DELETE',
    headers: {
      apikey: API_KEY
    }
  };

  try {
    const response = await fetch(`${API_URL}/instance/delete/${instanceName}`, options);
    return await response.json();
  } catch (error) {
    console.error('Erro ao excluir instância:', error);
    throw error;
  }
};

// Função melhorada para verificar instâncias conectadas na inicialização
export const verifyConnectedInstance = async (): Promise<{instanceName: string | null, status: string | null}> => {
  try {
    console.log("Verificando instâncias conectadas na inicialização...");
    const instances = await fetchAllInstances();
    
    if (!Array.isArray(instances) || instances.length === 0) {
      console.log("Nenhuma instância encontrada");
      return {instanceName: null, status: null};
    }
    
    // Debug - mostrar todas as instâncias recebidas da API
    console.log(`Total de instâncias recebidas: ${instances.length}`);
    instances.forEach((inst, idx) => {
      const name = inst.instanceName || inst.name || 'N/A';
      const status = inst.status || inst.connectionStatus || 'N/A';
      console.log(`${idx + 1}. Nome: ${name} | Status: ${status}`);
    });
    
    // Verificar instâncias conectadas com uma abordagem mais flexível
    // Procurar por diferentes formatos/propriedades de status
    for (const instance of instances) {
      // Na Evolution V2, o status pode estar em diferentes propriedades
      const instanceName = instance.instanceName || instance.name;
      const connectionStatus = instance.status || instance.connectionStatus;
      
      if (!instanceName) continue;
      
      // Verificar diferentes valores que indicam conexão
      const isConnected = 
        connectionStatus === "CONNECTED" || 
        connectionStatus === "ONLINE" || 
        connectionStatus === "On" ||
        connectionStatus === "Connected" ||
        connectionStatus === "open"; // Adicionado "open" que aparece na Evolution v2
        
      if (isConnected) {
        console.log(`Instância conectada encontrada: ${instanceName} com status: ${connectionStatus}`);
        // Normalizar o nome removendo o sufixo _Cliente para uso consistente na aplicação
        const normalizedName = instanceName.replace("_Cliente", "");
        return {
          instanceName: normalizedName,
          status: connectionStatus
        };
      }
    }
    
    // Se não encontrou nenhuma conectada, verificar localmente
    console.log("Nenhuma instância com status conectado encontrada na API");
    
    // Verificar no localStorage como fallback
    const storedName = localStorage.getItem('instanceName');
    if (storedName) {
      // Verificar se esta instância existe na lista
      const normalizedStoredName = storedName.replace("_Cliente", "");
      const fullStoredName = normalizedStoredName + "_Cliente";
      
      // Procurar por possíveis variações de nome
      for (const instance of instances) {
        const instanceName = instance.instanceName || instance.name;
        if (!instanceName) continue;
        
        if (instanceName.toLowerCase().includes(normalizedStoredName.toLowerCase()) ||
            instanceName === storedName) {
          console.log(`Instância do localStorage encontrada na API: ${instanceName}`);
          return {
            instanceName: normalizedStoredName,
            status: instance.status || instance.connectionStatus || "Desconhecido"
          };
        }
      }
    }
    
    return {instanceName: null, status: null};
  } catch (error) {
    console.error("Erro ao verificar instâncias conectadas:", error);
    return {instanceName: null, status: null};
  }
};

// Nova função para obter detalhes diretos de uma instância específica
export const getInstanceDetails = async (instanceName: string): Promise<EvoInstance | null> => {
  try {
    // Tentar diferentes variantes do nome
    const baseName = instanceName.replace('_Cliente', '');
    const fullName = baseName + '_Cliente';
    
    // Primeiro, tentar obter com o nome exato
    const options = {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    // Tentar primeiro com o nome completo
    console.log(`Buscando detalhes da instância: ${fullName}`);
    let response = await fetch(`${API_URL}/instance/fetchInstance/${fullName}`, options);
    
    // Se falhou, tentar com o nome base
    if (!response.ok) {
      console.log(`Não encontrado como ${fullName}, tentando com ${instanceName}`);
      response = await fetch(`${API_URL}/instance/fetchInstance/${instanceName}`, options);
      
      // Se ainda falhou, tentar fetch de todas as instâncias
      if (!response.ok) {
        console.log("Buscando em todas as instâncias...");
        const allInstances = await fetchAllInstances();
        
        const matchedInstance = allInstances.find(inst => {
          const instName = inst.instanceName || inst.name;
          if (!instName) return false;
          
          return instName.toLowerCase() === instanceName.toLowerCase() ||
                 instName.toLowerCase() === fullName.toLowerCase() ||
                 instName.toLowerCase().includes(baseName.toLowerCase());
        });
        
        if (matchedInstance) {
          console.log(`Instância encontrada na lista completa: ${matchedInstance.instanceName}`);
          return matchedInstance;
        }
        
        console.log("Instância não encontrada em nenhuma verificação");
        return null;
      }
    }
    
    const data = await response.json();
    console.log("Detalhes da instância obtidos:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar detalhes da instância:", error);
    return null;
  }
};
