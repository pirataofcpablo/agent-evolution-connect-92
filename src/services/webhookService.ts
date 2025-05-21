
// API Evo service for WhatsApp connection

import { getN8nConfig, createN8nFlow, sendMessageToN8n } from './n8nService';
import { getTypebotConfig, sendMessageToTypebot } from './typebotService';
import { getMercadoPagoConfig } from './mercadoPagoService';
import { getTelegramConfig, notifyPaymentReceived } from './telegramService';

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

// Creates a n8n flow for a new instance automatically
export const setupN8nForNewInstance = async (instanceName: string): Promise<boolean> => {
  try {
    console.log(`Configurando n8n automaticamente para a instância ${instanceName}`);
    
    // Remove _Cliente suffix if present for base instance name
    const baseInstanceName = instanceName.replace("_Cliente", "");
    
    // Create n8n flow
    const result = await createN8nFlow({
      instanceName: baseInstanceName,
      userName: baseInstanceName,
      webhookUrl: ""
    });
    
    if (!result.success) {
      console.error("Falha ao criar fluxo n8n automático");
      return false;
    }
    
    console.log(`Fluxo n8n criado com sucesso para ${baseInstanceName} com webhook: ${result.webhookUrl}`);
    return true;
  } catch (error) {
    console.error("Erro ao configurar n8n:", error);
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
    
    // Check if Typebot integration is configured (first priority)
    const typebotConfig = getTypebotConfig(baseInstanceName);
    if (typebotConfig && typebotConfig.enabled) {
      try {
        console.log("Integração Typebot encontrada. Processando mensagem...");
        const response = await sendMessageToTypebot(text, sender, typebotConfig);
        
        if (response) {
          // Send response back to WhatsApp
          console.log(`Enviando resposta Typebot para ${sender}: "${response}"`);
          const sent = await sendWhatsAppMessage(instanceName, sender, response);
          if (sent) {
            console.log(`Resposta Typebot enviada para ${sender}: "${response}"`);
            return;
          }
        }
      } catch (error) {
        console.error("Erro ao processar mensagem com Typebot:", error);
        // Continue to other services as fallback
      }
    }
    
    // Check if n8n integration is configured (second priority)
    const n8nConfig = getN8nConfig(baseInstanceName);
    if (n8nConfig && n8nConfig.webhookUrl) {
      try {
        console.log("Integração n8n encontrada. Processando mensagem...");
        const sent = await sendMessageToN8n(text, sender, n8nConfig);
        if (sent) {
          console.log(`Mensagem encaminhada para n8n: ${text}`);
          return;
        }
      } catch (error) {
        console.error("Erro ao processar mensagem com n8n:", error);
      }
    }
    
    // Default fallback response if no integration is available
    await sendWhatsAppMessage(instanceName, sender,
      "Olá! No momento estamos sem integrações configuradas para responder automaticamente. Um atendente entrará em contato em breve.");
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
  }
};

// Process payment notifications from Mercado Pago
export const processPaymentNotification = async (instanceName: string, paymentData: any): Promise<boolean> => {
  try {
    console.log(`Processando notificação de pagamento para ${instanceName}:`, paymentData);
    
    // Extract base instance name
    const baseInstanceName = instanceName.replace("_Cliente", "");
    
    // Get Mercado Pago configuration
    const { processPaymentWebhook } = await import('./mercadoPagoService');
    const success = await processPaymentWebhook(baseInstanceName, paymentData);
    
    // If payment was successful and we have client details, send notification to Telegram
    if (success && paymentData && paymentData.client_info) {
      const telegramConfig = getTelegramConfig(baseInstanceName);
      if (telegramConfig && telegramConfig.enabled && telegramConfig.notifyPayment) {
        try {
          // Extract client info from payment data
          const { 
            client_name = "Cliente", 
            plan_name = "Plano", 
            amount = 0 
          } = paymentData.client_info;
          
          // Send notification to Telegram
          await notifyPaymentReceived(baseInstanceName, client_name, plan_name, Number(amount));
        } catch (telegramError) {
          console.error("Erro ao enviar notificação para o Telegram:", telegramError);
        }
      }
    }
    
    return success;
  } catch (error) {
    console.error("Erro ao processar notificação de pagamento:", error);
    return false;
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
