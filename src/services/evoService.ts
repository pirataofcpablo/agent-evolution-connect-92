
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
    
    // Verificar possíveis formatos do nome (com ou sem sufixo _Cliente)
    const possibleNames = [
      instanceName,
      instanceName.endsWith("_Cliente") ? instanceName : `${instanceName}_Cliente`,
      instanceName.replace("_Cliente", "")
    ];
    
    console.log(`Nomes possíveis para busca: ${possibleNames.join(", ")}`);
    
    // Debug - listar todas as instâncias e seus status
    console.log("Lista de todas as instâncias disponíveis:");
    instances.forEach((instance, index) => {
      console.log(`${index + 1}. ${instance.instanceName} (status: ${instance.status || 'N/A'})`);
    });
    
    // Verificar se algum dos possíveis nomes existe nas instâncias
    // Tornando a comparação case-insensitive
    const foundInstance = instances.find(instance => 
      possibleNames.some(name => 
        instance.instanceName?.toLowerCase() === name.toLowerCase()
      )
    );
    
    if (foundInstance) {
      console.log(`Instância encontrada: ${foundInstance.instanceName} com status: ${foundInstance.status}`);
      return { 
        exists: true, 
        status: foundInstance.status 
      };
    } else {
      // Se não encontrou, verificamos mais detalhadamente
      // Verificação adicional para casos onde a API retorna instâncias com formato de nome diferente
      console.log("Tentando verificação mais detalhada...");
      for (const instance of instances) {
        for (const name of possibleNames) {
          if (instance.instanceName?.toLowerCase().includes(name.toLowerCase())) {
            console.log(`Correspondência parcial encontrada: ${instance.instanceName} contém ${name}`);
            return {
              exists: true,
              status: instance.status
            };
          }
        }
      }
      
      console.log("Nenhuma instância correspondente encontrada");
      return { exists: false };
    }
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

// Função específica para verificar instâncias conectadas na inicialização
export const verifyConnectedInstance = async (): Promise<{instanceName: string | null, status: string | null}> => {
  try {
    console.log("Verificando instâncias conectadas na inicialização...");
    const instances = await fetchAllInstances();
    
    if (!Array.isArray(instances) || instances.length === 0) {
      console.log("Nenhuma instância encontrada");
      return {instanceName: null, status: null};
    }
    
    // Verificar quais instâncias estão conectadas
    const connectedInstances = instances.filter(instance => 
      instance.status === "CONNECTED" || 
      instance.status === "ONLINE" || 
      instance.status === "On" ||
      instance.status === "Connected"
    );
    
    if (connectedInstances.length > 0) {
      const instance = connectedInstances[0];
      const normalizedName = instance.instanceName?.replace("_Cliente", "") || null;
      
      console.log(`Instância conectada encontrada: ${instance.instanceName} (normalizada: ${normalizedName})`);
      return {
        instanceName: normalizedName,
        status: instance.status || "Connected"
      };
    }
    
    // Se não encontrou nenhuma conectada, tentar buscar pelo localStorage
    const storedName = localStorage.getItem('instanceName');
    if (storedName) {
      // Verificar se a instância armazenada existe
      const storedInstance = instances.find(instance => 
        instance.instanceName?.toLowerCase() === storedName.toLowerCase() ||
        instance.instanceName?.toLowerCase().includes(storedName.toLowerCase().replace("_Cliente", ""))
      );
      
      if (storedInstance) {
        const normalizedName = storedInstance.instanceName?.replace("_Cliente", "") || null;
        console.log(`Instância armazenada encontrada: ${storedInstance.instanceName} (normalizada: ${normalizedName}) com status: ${storedInstance.status || "Desconhecido"}`);
        
        return {
          instanceName: normalizedName,
          status: storedInstance.status || "Desconhecido"
        };
      }
    }
    
    console.log("Nenhuma instância conectada encontrada");
    return {instanceName: null, status: null};
  } catch (error) {
    console.error("Erro ao verificar instâncias conectadas:", error);
    return {instanceName: null, status: null};
  }
};
