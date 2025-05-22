
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
    console.log("Creating n8n flow for instance:", userData.instanceName);
    const n8nApiUrl = "https://n8.solucoesweb.uk/api/v1/workflows";
    const n8nApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTViZTBlMC0wMWRjLTQ0ZGMtYTQxNy1kMzQ2ZTYzYjc1N2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3ODcxNTk1fQ.hLumuzqAqJUU6dZxAcEAezQVHU1w504bhB5zWMqlZIU";
    
    // Sanitize instance name for path (remove special characters and convert to lowercase)
    const sanitizedPath = userData.instanceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const userId = userData.instanceName.replace(/[^a-z0-9]/g, '');
    
    // Updated flow with your enhanced model
    const newWorkflow = {
      name: `WhatsVenda_${userData.instanceName}`,
      active: true,
      nodes: [
        {
          parameters: {
            path: `webhook/whatsapp/${userId}`,
            options: {
              responseMode: "lastNode"
            }
          },
          name: "Receber Mensagem WhatsApp",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1,
          position: [100, 300]
        },
        {
          parameters: {
            functionCode: `const message = $input.all()[0].json;
return [{
  json: {
    userId: "${userId}",
    sender: message.sender || "",
    messageText: message.message || "",
    timestamp: new Date().toISOString()
  }
}];`
          },
          name: "Extrair Dados da Mensagem",
          type: "n8n-nodes-base.function",
          typeVersion: 1,
          position: [300, 300]
        },
        {
          parameters: {
            url: "https://api.groq.com/openai/v1/chat/completions",
            method: "POST",
            headers: {
              parameters: [
                {
                  name: "Authorization",
                  value: "Bearer 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"
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
                  value: "mixtral-8x7b-32768"
                },
                {
                  name: "messages",
                  value: `=[
                    {
                      "role": "system",
                      "content": "Você é um assistente do WhatsVenda para ${userData.instanceName}. Seja educado e profissional em suas respostas."
                    },
                    {
                      "role": "user",
                      "content": "{{$node[\"Extrair Dados da Mensagem\"].json[\"messageText\"]}}"
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
          },
          name: "Consultar Groq IA",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 3,
          position: [500, 300]
        },
        {
          parameters: {
            url: "https://v2.solucoesweb.uk/message/sendText/{{$node[\"Extrair Dados da Mensagem\"].json[\"userId\"]}}_Cliente",
            method: "POST",
            headers: {
              parameters: [
                {
                  name: "apikey",
                  value: "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z"
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
                  name: "number",
                  value: "={{$node[\"Extrair Dados da Mensagem\"].json[\"sender\"]}}"
                },
                {
                  name: "options",
                  value: `={
                    "delay": 1200,
                    "presence": "composing"
                  }`
                },
                {
                  name: "textMessage",
                  value: `={
                    "text": "{{$node[\"Consultar Groq IA\"].json[\"choices\"][0][\"message\"][\"content\"]}}"
                  }`
                }
              ]
            },
            options: {}
          },
          name: "Enviar Resposta WhatsApp",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 3,
          position: [700, 300]
        },
        {
          parameters: {
            path: `webhook/knowledge/${userId}`,
            options: {
              responseMode: "lastNode"
            }
          },
          name: "Receber Conhecimento",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1,
          position: [100, 500]
        },
        {
          parameters: {
            functionCode: `// Processar conhecimento recebido
const data = $input.all()[0].json;
let knowledge = "";

if (data.type === "text") {
  knowledge = data.knowledge || "";
} else if (data.type === "file") {
  knowledge = "Arquivo de conhecimento processado: " + (data.filename || "sem nome");
}

return [{
  json: {
    userId: "${userId}",
    knowledge: knowledge,
    timestamp: new Date().toISOString(),
    success: true,
    message: "Conhecimento registrado com sucesso"
  }
}];`
          },
          name: "Processar Conhecimento",
          type: "n8n-nodes-base.function",
          typeVersion: 1,
          position: [300, 500]
        },
        {
          parameters: {
            keepOnlySet: true,
            values: {
              string: [
                {
                  name: "response",
                  value: "={{ $json[\"message\"] }}"
                }
              ],
              boolean: [
                {
                  name: "success",
                  value: true
                }
              ]
            }
          },
          name: "Preparar Resposta",
          type: "n8n-nodes-base.set",
          typeVersion: 2,
          position: [500, 500]
        }
      ],
      connections: {
        "Receber Mensagem WhatsApp": {
          main: [
            [
              {
                node: "Extrair Dados da Mensagem",
                type: "main",
                index: 0
              }
            ]
          ]
        },
        "Extrair Dados da Mensagem": {
          main: [
            [
              {
                node: "Consultar Groq IA",
                type: "main",
                index: 0
              }
            ]
          ]
        },
        "Consultar Groq IA": {
          main: [
            [
              {
                node: "Enviar Resposta WhatsApp",
                type: "main",
                index: 0
              }
            ]
          ]
        },
        "Receber Conhecimento": {
          main: [
            [
              {
                node: "Processar Conhecimento",
                type: "main",
                index: 0
              }
            ]
          ]
        },
        "Processar Conhecimento": {
          main: [
            [
              {
                node: "Preparar Resposta",
                type: "main",
                index: 0
              }
            ]
          ]
        }
      }
    };

    console.log("Sending request to create n8n flow");
    const response = await fetch(n8nApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey
      },
      body: JSON.stringify(newWorkflow)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Failed to create n8n flow: ${response.status} - ${errorData}`);
      return { success: false };
    }
    
    const data = await response.json();
    console.log("n8n flow created successfully:", data);
    
    // Construir a URL do webhook para o cliente
    const webhookUrl = `https://n8.solucoesweb.uk/webhook/whatsapp/${userId}`;
    
    // Salvar a configuração inicial do n8n
    saveN8nConfig(userData.instanceName, {
      webhookUrl,
      n8nUrl: "https://n8.solucoesweb.uk/api/v1",
      apiKey: n8nApiKey,
      enableWebhook: true,
      enableApi: true,
      aiModel: 'groq',
      aiApiKey: "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"
    });

    return { 
      success: true, 
      webhookUrl 
    };
  } catch (error) {
    console.error("Error creating n8n flow:", error);
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
    const n8nApiBaseUrl = "https://n8.solucoesweb.uk/api/v1";
    const n8nApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTViZTBlMC0wMWRjLTQ0ZGMtYTQxNy1kMzQ2ZTYzYjc1N2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3ODcxNTk1fQ.hLumuzqAqJUU6dZxAcEAezQVHU1w504bhB5zWMqlZIU";
    
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
      wf.name === `WhatsVenda_${instanceName}` || 
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
      node.name === "Consultar Groq IA" || 
      node.name.includes("Groq") || 
      node.name.includes("AI") ||
      node.name.includes("IA") ||
      node.type.includes("httpRequest")
    );
    
    if (aiNodeIndex === -1) {
      console.error("Nó de IA não encontrado no fluxo");
      return false;
    }
    
    // Atualizar o nó baseado no modelo selecionado
    if (aiModel === 'openai') {
      updatedWorkflow.nodes[aiNodeIndex] = {
        ...updatedWorkflow.nodes[aiNodeIndex],
        name: "Consultar OpenAI",
        parameters: {
          url: "https://api.openai.com/v1/chat/completions",
          method: "POST",
          headers: {
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
                value: "gpt-4o"
              },
              {
                name: "messages",
                value: `=[
                  {
                    "role": "system",
                    "content": "Você é um assistente do WhatsVenda para ${instanceName}. Seja educado e profissional em suas respostas."
                  },
                  {
                    "role": "user",
                    "content": "{{$node[\"Extrair Dados da Mensagem\"].json[\"messageText\"]}}"
                  }
                ]`
              },
              {
                name: "temperature",
                value: 0.7
              }
            ]
          }
        }
      };
    } else if (aiModel === 'groq') {
      updatedWorkflow.nodes[aiNodeIndex] = {
        ...updatedWorkflow.nodes[aiNodeIndex],
        name: "Consultar Groq IA",
        parameters: {
          url: "https://api.groq.com/openai/v1/chat/completions",
          method: "POST",
          headers: {
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
                value: "mixtral-8x7b-32768"
              },
              {
                name: "messages",
                value: `=[
                  {
                    "role": "system",
                    "content": "Você é um assistente do WhatsVenda para ${instanceName}. Seja educado e profissional em suas respostas."
                  },
                  {
                    "role": "user",
                    "content": "{{$node[\"Extrair Dados da Mensagem\"].json[\"messageText\"]}}"
                  }
                ]`
              },
              {
                name: "temperature",
                value: 0.7
              }
            ]
          }
        }
      };
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
    
    // Sanitize instance name for path (remove special characters and convert to lowercase)
    const userId = instanceName.replace(/[^a-z0-9]/g, '');
    const knowledgeWebhookUrl = `https://n8.solucoesweb.uk/webhook/knowledge/${userId}`;
    
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
    
    const response = await fetch(knowledgeWebhookUrl, {
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
    const n8nApiBaseUrl = "https://n8.solucoesweb.uk/api/v1";
    const n8nApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTViZTBlMC0wMWRjLTQ0ZGMtYTQxNy1kMzQ2ZTYzYjc1N2MiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3ODcxNTk1fQ.hLumuzqAqJUU6dZxAcEAezQVHU1w504bhB5zWMqlZIU";
    
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
      wf.name === `WhatsVenda_${instanceName}` || 
      wf.name.includes(instanceName)
    );
    
    return !!workflow;
  } catch (error) {
    console.error("Erro ao verificar existência de fluxo n8n:", error);
    return false;
  }
};
