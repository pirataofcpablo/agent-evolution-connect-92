
interface N8nConfig {
  webhookUrl: string;
  apiKey?: string;
  n8nUrl?: string;
  enableWebhook: boolean;
  enableApi: boolean;
  aiModel?: 'groq' | 'openai' | null;
  aiApiKey?: string;
}

export const saveN8nConfig = (instanceName: string, config: N8nConfig): void => {
  localStorage.setItem(`n8n_config_${instanceName}`, JSON.stringify(config));
};

export const getN8nConfig = (instanceName: string): N8nConfig | null => {
  const config = localStorage.getItem(`n8n_config_${instanceName}`);
  return config ? JSON.parse(config) : null;
};

export const sendMessageToN8n = async (
  message: string,
  senderNumber: string,
  config: N8nConfig
): Promise<boolean> => {
  if (config.enableWebhook && config.webhookUrl) {
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sender: senderNumber,
          timestamp: new Date().toISOString(),
          aiModel: config.aiModel || null,
          instanceName: config.webhookUrl.split('/').pop() || 'unknown'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar mensagem para o webhook n8n:', error);
      return false;
    }
  }

  if (config.enableApi && config.apiKey && config.n8nUrl) {
    try {
      // Implementar chamada para API do n8n
      // Esta parte depende da API específica do n8n configurada pelo usuário
      return true;
    } catch (error) {
      console.error('Erro ao chamar API do n8n:', error);
      return false;
    }
  }

  return false;
};

// New function to create a flow in n8n automatically
export const createN8nFlow = async (userData: {
  instanceName: string;
  userName: string;
  webhookUrl: string;
}): Promise<{ success: boolean; webhookUrl?: string }> => {
  try {
    const n8nApiUrl = "https://n8n.whatsvenda.com/api/v1/workflows";
    const n8nApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTViZTBlMC0wMWRjLTQ0ZGMtYTQxNy1kMzQ2ZTYzYjc1N2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3NzI3NDE0fQ.9Q-wwkTsMcUjHylJTZ5ibpMZNkkOWV21CJ3m4KR114A";
    
    // Criando um fluxo simples com um webhook de entrada e um nó de IA
    const newWorkflow = {
      name: `WhatsVenda_Integration_${userData.instanceName}`,
      active: true,
      nodes: [
        {
          parameters: {
            httpMethod: "POST",
            path: userData.instanceName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            options: {},
            responseMode: "lastNode",
            responseData: "firstEntryJson"
          },
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1,
          position: [250, 300]
        },
        {
          parameters: {
            modelType: "default",
            options: {},
            prompt: {
              value: "Você é um assistente de IA para WhatsVenda, instanceName: {{$node[\"Webhook\"].json[\"instanceName\"]}}, message: {{$node[\"Webhook\"].json[\"message\"]}}, sender: {{$node[\"Webhook\"].json[\"sender\"]}}"
            }
          },
          name: "AI Agent",
          type: "n8n-nodes-base.openAi",
          typeVersion: 1,
          position: [500, 300]
        },
        {
          parameters: {
            keepOnlySet: true,
            values: {
              string: [
                {
                  name: "response",
                  value: "={{ $json[\"text\"] }}"
                }
              ]
            },
            options: {}
          },
          name: "Set Response",
          type: "n8n-nodes-base.set",
          typeVersion: 2,
          position: [700, 300]
        }
      ],
      connections: {
        Webhook: {
          main: [
            [
              {
                node: "AI Agent",
                type: "main",
                index: 0
              }
            ]
          ]
        },
        "AI Agent": {
          main: [
            [
              {
                node: "Set Response",
                type: "main",
                index: 0
              }
            ]
          ]
        }
      }
    };

    const response = await fetch(n8nApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey
      },
      body: JSON.stringify(newWorkflow)
    });

    if (!response.ok) {
      console.error(`Erro ao criar fluxo n8n: ${response.status}`);
      return { success: false };
    }

    const data = await response.json();
    console.log("Fluxo n8n criado com sucesso:", data);
    
    // Construir a URL do webhook para o cliente
    const webhookUrl = `https://n8n.whatsvenda.com/webhook/${userData.instanceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    // Salvar a configuração inicial do n8n
    saveN8nConfig(userData.instanceName, {
      webhookUrl,
      enableWebhook: true,
      enableApi: false,
      aiModel: null
    });

    return { 
      success: true, 
      webhookUrl 
    };
  } catch (error) {
    console.error("Erro ao criar fluxo n8n:", error);
    return { success: false };
  }
};

// Função para atualizar o modelo de IA no fluxo n8n
export const updateN8nFlowAiModel = async (
  instanceName: string, 
  aiModel: 'groq' | 'openai',
  apiKey: string
): Promise<boolean> => {
  try {
    // Primeiro, buscar o fluxo existente
    const n8nApiBaseUrl = "https://n8n.whatsvenda.com/api/v1";
    const n8nApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTViZTBlMC0wMWRjLTQ0ZGMtYTQxNy1kMzQ2ZTYzYjc1N2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3NzI3NDE0fQ.9Q-wwkTsMcUjHylJTZ5ibpMZNkkOWV21CJ3m4KR114A";
    
    // Buscar todos os workflows para encontrar o correspondente a esta instância
    const response = await fetch(`${n8nApiBaseUrl}/workflows`, {
      headers: {
        'X-N8N-API-KEY': n8nApiKey
      }
    });
    
    if (!response.ok) {
      console.error(`Erro ao buscar fluxos n8n: ${response.status}`);
      return false;
    }
    
    const workflows = await response.json();
    const workflow = workflows.data.find((wf: any) => 
      wf.name === `WhatsVenda_Integration_${instanceName}` || 
      wf.name.includes(instanceName)
    );
    
    if (!workflow) {
      console.error(`Fluxo para instância ${instanceName} não encontrado`);
      return false;
    }
    
    // Atualizar o nó de IA no fluxo existente
    const workflowId = workflow.id;
    const workflowDetail = await fetch(`${n8nApiBaseUrl}/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': n8nApiKey
      }
    }).then(res => res.json());
    
    // Clone do fluxo atual para modificação
    const updatedWorkflow = {...workflowDetail};
    
    // Encontrar o nó de IA
    const aiNodeIndex = updatedWorkflow.nodes.findIndex((node: any) => 
      node.name === "AI Agent" || node.type.includes("openAi") || node.type.includes("Ai")
    );
    
    if (aiNodeIndex === -1) {
      console.error("Nó de IA não encontrado no fluxo");
      return false;
    }
    
    // Atualizar o nó baseado no modelo selecionado
    if (aiModel === 'openai') {
      updatedWorkflow.nodes[aiNodeIndex] = {
        ...updatedWorkflow.nodes[aiNodeIndex],
        type: "n8n-nodes-base.openAi",
        parameters: {
          ...updatedWorkflow.nodes[aiNodeIndex].parameters,
          authentication: "apiKey",
          apiKey: apiKey,
          modelType: "default",
          model: "gpt-4o",
          options: {
            maxTokens: 1000
          }
        }
      };
    } else if (aiModel === 'groq') {
      updatedWorkflow.nodes[aiNodeIndex] = {
        ...updatedWorkflow.nodes[aiNodeIndex],
        type: "n8n-nodes-base.httpRequest",
        parameters: {
          authentication: "genericCredentialType",
          url: "https://api.groq.com/openai/v1/chat/completions",
          method: "POST",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "Authorization",
                value: `Bearer ${apiKey}`
              },
              {
                name: "Content-Type",
                value: "application/json"
              }
            ]
          },
          sendBody: true,
          contentType: "json",
          bodyParameters: {
            parameters: [
              {
                name: "model",
                value: "llama3-70b-8192"
              },
              {
                name: "messages",
                value: `=[
                  {
                    "role": "system",
                    "content": "Você é um assistente de IA para WhatsVenda"
                  },
                  {
                    "role": "user",
                    "content": "{{$node[\"Webhook\"].json[\"message\"]}}"
                  }
                ]`
              },
              {
                name: "temperature",
                value: 0.7
              }
            ]
          },
          options: {}
        }
      };
      
      // Atualizar as conexões do nó para que ele se conecte ao nó Set Response
      if (updatedWorkflow.connections && updatedWorkflow.connections["AI Agent"]) {
        // Copiar as conexões do nó AI Agent
        updatedWorkflow.connections[updatedWorkflow.nodes[aiNodeIndex].name] = 
          updatedWorkflow.connections["AI Agent"];
        // Remover as conexões antigas
        if (updatedWorkflow.nodes[aiNodeIndex].name !== "AI Agent") {
          delete updatedWorkflow.connections["AI Agent"];
        }
      }
      
      // Ajustar o nó Set Response para obter a resposta do modelo Groq
      const setNodeIndex = updatedWorkflow.nodes.findIndex((node: any) => 
        node.name === "Set Response"
      );
      
      if (setNodeIndex !== -1) {
        updatedWorkflow.nodes[setNodeIndex].parameters.values.string[0].value = 
          "={{ $json.body.choices[0].message.content }}";
      }
    }
    
    // Enviar o fluxo atualizado
    const updateResponse = await fetch(`${n8nApiBaseUrl}/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey
      },
      body: JSON.stringify(updatedWorkflow)
    });
    
    if (!updateResponse.ok) {
      console.error(`Erro ao atualizar fluxo n8n: ${updateResponse.status}`);
      return false;
    }
    
    console.log("Modelo de IA atualizado com sucesso no fluxo n8n");
    
    // Atualizar a configuração local do n8n
    const currentConfig = getN8nConfig(instanceName);
    if (currentConfig) {
      saveN8nConfig(instanceName, {
        ...currentConfig,
        aiModel,
        aiApiKey: apiKey
      });
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar modelo de IA no fluxo n8n:", error);
    return false;
  }
};

// Função para enviar conhecimento para o agente IA no n8n
export const sendKnowledgeToN8nAgent = async (
  instanceName: string,
  knowledge: string | File,
  type: 'text' | 'file' = 'text'
): Promise<boolean> => {
  try {
    const config = getN8nConfig(instanceName);
    if (!config || !config.webhookUrl) {
      console.error("Configuração n8n não encontrada para esta instância");
      return false;
    }
    
    const formData = new FormData();
    
    if (type === 'text') {
      formData.append('knowledge', knowledge as string);
      formData.append('type', 'text');
    } else {
      formData.append('file', knowledge as File);
      formData.append('type', 'file');
    }
    
    formData.append('instanceName', instanceName);
    formData.append('action', 'add_knowledge');
    
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      body: formData
    });
    
    return response.ok;
  } catch (error) {
    console.error("Erro ao enviar conhecimento para o agente n8n:", error);
    return false;
  }
};

// Função para verificar se o fluxo já existe
export const checkN8nFlowExists = async (instanceName: string): Promise<boolean> => {
  try {
    const n8nApiBaseUrl = "https://n8n.whatsvenda.com/api/v1";
    const n8nApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTViZTBlMC0wMWRjLTQ0ZGMtYTQxNy1kMzQ2ZTYzYjc1N2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3NzI3NDE0fQ.9Q-wwkTsMcUjHylJTZ5ibpMZNkkOWV21CJ3m4KR114A";
    
    const response = await fetch(`${n8nApiBaseUrl}/workflows`, {
      headers: {
        'X-N8N-API-KEY': n8nApiKey
      }
    });
    
    if (!response.ok) {
      console.error(`Erro ao buscar fluxos n8n: ${response.status}`);
      return false;
    }
    
    const workflows = await response.json();
    const workflow = workflows.data.find((wf: any) => 
      wf.name === `WhatsVenda_Integration_${instanceName}` || 
      wf.name.includes(instanceName)
    );
    
    return !!workflow;
  } catch (error) {
    console.error("Erro ao verificar existência de fluxo n8n:", error);
    return false;
  }
};
