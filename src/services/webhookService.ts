
import { getDifyConfig } from './difyService';
import { getN8nConfig } from './n8nService';
import { sendMessageToDify } from './difyService';
import { sendMessageToN8n } from './n8nService';

// Endpoints for Evolution API
const EVO_API_KEY = "29MoyRfK6RM0CWCOXnReOpAj6dIYTt3z";
const EVO_API_URL = "https://v2.solucoesweb.uk";

export interface WhatsAppMessage {
  instanceName: string;
  sender: string;
  message: string;
}

// Register webhook to receive WhatsApp messages
export const registerWebhook = async (instanceName: string, webhookUrl: string): Promise<boolean> => {
  try {
    if (!instanceName || !webhookUrl) {
      console.error("Nome da instância ou URL do webhook inválidos");
      return false;
    }
    
    console.log(`Registrando webhook para ${instanceName} em ${webhookUrl}`);
    
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

    console.log("Enviando requisição para registrar webhook:", options);
    
    const response = await fetch(`${EVO_API_URL}/instance/webhook`, options);
    
    if (!response.ok) {
      // Use text() instead of json() for better error handling
      const responseText = await response.text();
      console.error(`Falha ao registrar webhook para ${instanceName} (${response.status}):`, responseText);
      return false;
    }
    
    // Only parse as JSON if the response is OK
    const responseData = await response.json();
    console.log(`Webhook registrado com sucesso para ${instanceName}:`, responseData);
    return true;
  } catch (error) {
    console.error("Erro ao registrar webhook:", error);
    return false;
  }
};

// Send message to WhatsApp using Evolution API
export const sendWhatsAppMessage = async (
  instanceName: string, 
  recipient: string, 
  message: string
): Promise<boolean> => {
  try {
    if (!instanceName || !recipient || !message) {
      console.error("Parâmetros inválidos para envio de mensagem:", {instanceName, recipient, message});
      return false;
    }

    console.log(`Enviando mensagem para ${recipient} via ${instanceName}: "${message}"`);
    
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

    console.log("Requisição para envio de mensagem:", options);

    const response = await fetch(`${EVO_API_URL}/message/sendText/${instanceName}`, options);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`Erro ao enviar mensagem (${response.status}):`, responseText);
      return false;
    }
    
    const responseData = await response.json();
    console.log("Mensagem enviada com sucesso:", responseData);
    return true;
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return false;
  }
};

// Process incoming message and route to appropriate bot
export const processIncomingMessage = async (message: WhatsAppMessage): Promise<void> => {
  try {
    const { instanceName, sender, message: text } = message;
    
    if (!instanceName || !sender || !text) {
      console.error("Mensagem inválida recebida:", message);
      return;
    }
    
    console.log(`Processando mensagem recebida de ${sender} na instância ${instanceName}: "${text}"`);
    
    // Extract base instance name
    const baseInstanceName = instanceName.replace("_Cliente", "");
    
    // Check if Dify integration is configured
    const difyConfig = getDifyConfig(baseInstanceName);
    if (difyConfig) {
      try {
        console.log("Integração Dify encontrada. Processando mensagem...");
        // Process message with Dify with error handling
        const response = await sendMessageToDify(text, difyConfig);
        
        if (response) {
          // Send response back to WhatsApp
          console.log(`Enviando resposta Dify para ${sender}: "${response}"`);
          const sent = await sendWhatsAppMessage(instanceName, sender, response);
          if (sent) {
            console.log(`Resposta Dify enviada para ${sender}: "${response}"`);
          } else {
            console.error(`Falha ao enviar resposta Dify para ${sender}`);
          }
        } else {
          console.error("Resposta vazia do Dify");
          // Send fallback message
          await sendWhatsAppMessage(instanceName, sender, 
            "Desculpe, estou com problemas para processar sua mensagem no momento. Tente novamente mais tarde.");
        }
        return;
      } catch (error) {
        console.error("Erro ao processar mensagem com Dify:", error);
        // Try N8n as fallback
      }
    } else {
      console.log("Nenhuma integração Dify encontrada para", baseInstanceName);
    }
    
    // If Dify failed or isn't configured, try with N8n
    const n8nConfig = getN8nConfig(baseInstanceName);
    if (n8nConfig) {
      try {
        console.log("Integração n8n encontrada. Processando mensagem...");
        // Send message to n8n (webhook or API)
        const sent = await sendMessageToN8n(text, sender, n8nConfig);
        if (sent) {
          console.log(`Mensagem encaminhada para n8n: ${text}`);
        } else {
          console.error(`Falha ao encaminhar mensagem para n8n: ${text}`);
          // Send fallback message
          await sendWhatsAppMessage(instanceName, sender,
            "Desculpe, estou com problemas para encaminhar sua mensagem no momento. Tente novamente mais tarde.");
        }
      } catch (error) {
        console.error("Erro ao processar mensagem com n8n:", error);
        // Send fallback message
        await sendWhatsAppMessage(instanceName, sender,
          "Desculpe, estou com problemas para processar sua mensagem no momento. Tente novamente mais tarde.");
      }
    } else {
      console.log("Nenhuma integração n8n encontrada para", baseInstanceName);
    }
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
  }
};

// Configuration for backend to receive messages from Evolution
export const setupWebhookReceiver = (backendUrl: string): void => {
  if (!backendUrl) {
    console.error("URL do backend não fornecida");
    return;
  }
  
  console.log(`Webhook receiver configurado em ${backendUrl}`);
  // This function would be implemented in the backend to receive webhooks from Evolution API
};
