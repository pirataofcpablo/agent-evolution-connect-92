
import { getDifyConfig } from './difyService';
import { getN8nConfig } from './n8nService';
import { sendMessageToDify } from './difyService';
import { sendMessageToN8n } from './n8nService';

// Endpoints da Evolution API para receber e enviar mensagens
const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
const EVO_API_URL = "https://v2.solucoesweb.uk";

export interface WhatsAppMessage {
  instanceName: string;
  sender: string;
  message: string;
}

// Registrar um webhook para receber mensagens do WhatsApp
export const registerWebhook = async (instanceName: string, webhookUrl: string): Promise<boolean> => {
  try {
    const options = {
      method: 'POST',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "instanceName": instanceName,
        "webhookUrl": webhookUrl,
        "events": ["messages.upsert"]
      })
    };

    const response = await fetch(`${EVO_API_URL}/instance/webhook`, options);
    
    if (response.ok) {
      console.log(`Webhook registrado com sucesso para ${instanceName}`);
    } else {
      console.error(`Falha ao registrar webhook para ${instanceName}:`, await response.text());
    }
    
    return response.ok;
  } catch (error) {
    console.error("Erro ao registrar webhook:", error);
    return false;
  }
};

// Enviar mensagem para o WhatsApp usando a Evolution API
export const sendWhatsAppMessage = async (
  instanceName: string, 
  recipient: string, 
  message: string
): Promise<boolean> => {
  try {
    const options = {
      method: 'POST',
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "number": recipient,
        "options": {
          "delay": 1000,
          "presence": "composing"
        },
        "textMessage": {
          "text": message
        }
      })
    };

    console.log(`Enviando mensagem para ${recipient} via ${instanceName}`);
    const response = await fetch(`${EVO_API_URL}/message/sendText/${instanceName}`, options);
    
    if (response.ok) {
      console.log("Mensagem enviada com sucesso");
    } else {
      console.error("Erro ao enviar mensagem:", await response.text());
    }
    
    return response.ok;
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return false;
  }
};

// Processar mensagem recebida e rotear para o bot apropriado
export const processIncomingMessage = async (message: WhatsAppMessage): Promise<void> => {
  const { instanceName, sender, message: text } = message;
  console.log(`Processando mensagem recebida de ${sender} na instância ${instanceName}: "${text}"`);
  
  const baseInstanceName = instanceName.replace("_Cliente", "");
  
  // Verificar se há integração com Dify configurada
  const difyConfig = getDifyConfig(baseInstanceName);
  if (difyConfig) {
    try {
      console.log("Integração Dify encontrada. Processando mensagem...");
      // Processar mensagem com Dify
      const response = await sendMessageToDify(text, difyConfig);
      
      // Enviar resposta de volta para o WhatsApp
      await sendWhatsAppMessage(instanceName, sender, response);
      console.log(`Resposta Dify enviada para ${sender}: "${response}"`);
      return;
    } catch (error) {
      console.error("Erro ao processar mensagem com Dify:", error);
    }
  } else {
    console.log("Nenhuma integração Dify encontrada para", baseInstanceName);
  }
  
  // Se falhou ou não tem Dify, tentar com n8n
  const n8nConfig = getN8nConfig(baseInstanceName);
  if (n8nConfig) {
    try {
      console.log("Integração n8n encontrada. Processando mensagem...");
      // Enviar mensagem para o n8n (webhook ou API)
      await sendMessageToN8n(text, sender, n8nConfig);
      console.log(`Mensagem encaminhada para n8n: ${text}`);
    } catch (error) {
      console.error("Erro ao processar mensagem com n8n:", error);
    }
  } else {
    console.log("Nenhuma integração n8n encontrada para", baseInstanceName);
  }
};

// Configuração para o backend receber mensagens da Evolution e processá-las
export const setupWebhookReceiver = (backendUrl: string): void => {
  console.log(`Webhook receiver configurado em ${backendUrl}`);
  // Esta função seria implementada no backend para receber webhooks da Evolution API
  // No contexto atual, estamos simulando essa funcionalidade
};
