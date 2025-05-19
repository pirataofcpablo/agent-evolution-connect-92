
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
    const response = await fetch(`${API_URL}/instance/connect/${instanceName}`, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao conectar à instância:', error);
    throw error;
  }
};

export const checkInstanceExists = async (instanceName: string): Promise<{exists: boolean, status?: string}> => {
  try {
    // Buscar todas as instâncias
    const instances = await fetchAllInstances();
    
    // Verificar possíveis formatos do nome (com ou sem sufixo _Cliente)
    const possibleNames = [
      instanceName,
      instanceName.endsWith("_Cliente") ? instanceName : `${instanceName}_Cliente`,
      instanceName.replace("_Cliente", "")
    ];
    
    // Verificar se algum dos possíveis nomes existe nas instâncias
    const foundInstance = instances.find(instance => 
      possibleNames.some(name => 
        instance.instanceName?.toLowerCase() === name.toLowerCase()
      )
    );
    
    if (foundInstance) {
      return { 
        exists: true, 
        status: foundInstance.status 
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error("Erro ao verificar existência da instância:", error);
    return { exists: false };
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
