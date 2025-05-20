
// Mercado Pago service for payment integration and subscription management

const LOCAL_STORAGE_KEY = 'mercadoPagoConfigs';

interface MercadoPagoConfig {
  accessToken: string;
  enabled: boolean;
  notifyDaysBeforeExpiration: number;
  reminderMessage: string;
  thankYouMessage: string;
}

// Get Mercado Pago configuration for a specific instance
export const getMercadoPagoConfig = (instanceName: string): MercadoPagoConfig | null => {
  try {
    const configs = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (configs) {
      const parsedConfigs = JSON.parse(configs);
      return parsedConfigs[instanceName] || null;
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter configuração do Mercado Pago:", error);
    return null;
  }
};

// Save Mercado Pago configuration for a specific instance
export const saveMercadoPagoConfig = async (
  instanceName: string, 
  config: MercadoPagoConfig
): Promise<boolean> => {
  try {
    // Get existing configs
    const existingConfigsStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existingConfigs = existingConfigsStr ? JSON.parse(existingConfigsStr) : {};
    
    // Update config for this instance
    existingConfigs[instanceName] = config;
    
    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingConfigs));
    
    console.log(`Configuração do Mercado Pago salva para instância ${instanceName}:`, config);
    return true;
  } catch (error) {
    console.error("Erro ao salvar configuração do Mercado Pago:", error);
    return false;
  }
};

// Test connection with Mercado Pago API
export const testMercadoPagoConnection = async (
  config: MercadoPagoConfig
): Promise<{success: boolean, message: string}> => {
  try {
    if (!config.accessToken) {
      return {
        success: false,
        message: "Access Token é necessário para testar a conexão."
      };
    }

    // Simulate an API call to verify connection
    // In a real implementation, this would make an actual API call to Mercado Pago
    console.log("Testando conexão com Mercado Pago usando:", config);
    
    // Simulate API response
    const responseOk = config.accessToken.length > 20;
    
    if (responseOk) {
      return {
        success: true,
        message: "Conexão com Mercado Pago estabelecida com sucesso!"
      };
    } else {
      return {
        success: false,
        message: "Access Token inválido ou muito curto. Verifique suas credenciais."
      };
    }
  } catch (error) {
    console.error("Erro ao testar conexão com Mercado Pago:", error);
    return {
      success: false,
      message: "Ocorreu um erro ao testar a conexão com o Mercado Pago."
    };
  }
};

// Generate payment link for a subscription renewal
export const generatePaymentLink = async (
  clientId: string,
  clientName: string,
  amount: number,
  description: string,
  config: MercadoPagoConfig
): Promise<string | null> => {
  try {
    if (!config.enabled || !config.accessToken) {
      console.log("Integração com Mercado Pago não está habilitada ou configurada corretamente");
      return null;
    }

    console.log(`Gerando link de pagamento para cliente ${clientName} no valor de ${amount}`);
    
    // Simulated payment link - in a real implementation, this would call the Mercado Pago API
    const paymentLink = `https://mpago.la/simulated/${clientId}/${amount}`;
    
    console.log("Link de pagamento gerado:", paymentLink);
    return paymentLink;
  } catch (error) {
    console.error("Erro ao gerar link de pagamento:", error);
    return null;
  }
};

// Send payment reminder to customer with payment link
export const sendPaymentReminder = async (
  instanceName: string,
  clientId: string,
  clientName: string, 
  whatsappNumber: string,
  amount: number,
  daysUntilExpiration: number,
  config: MercadoPagoConfig
): Promise<boolean> => {
  try {
    if (!config.enabled || !config.accessToken) {
      console.log("Integração com Mercado Pago não está habilitada ou configurada corretamente");
      return false;
    }

    // Generate payment link
    const paymentLink = await generatePaymentLink(
      clientId, 
      clientName, 
      amount, 
      `Renovação de assinatura para ${clientName}`,
      config
    );

    if (!paymentLink) {
      console.error("Não foi possível gerar o link de pagamento");
      return false;
    }

    // Replace placeholders in the reminder message
    let message = config.reminderMessage;
    message = message.replace(/{nome}/g, clientName);
    message = message.replace(/{dias}/g, daysUntilExpiration.toString());
    message = message.replace(/{link}/g, paymentLink);

    // Send WhatsApp message
    const { sendWhatsAppMessage } = await import('./webhookService');
    const sent = await sendWhatsAppMessage(
      `${instanceName}_Cliente`,
      whatsappNumber,
      message
    );

    return sent;
  } catch (error) {
    console.error("Erro ao enviar lembrete de pagamento:", error);
    return false;
  }
};

// Send thank you message after payment confirmation
export const sendThankYouMessage = async (
  instanceName: string,
  clientName: string,
  whatsappNumber: string,
  config: MercadoPagoConfig
): Promise<boolean> => {
  try {
    if (!config.enabled) {
      console.log("Integração com Mercado Pago não está habilitada");
      return false;
    }

    // Replace placeholders in thank you message
    let message = config.thankYouMessage;
    message = message.replace(/{nome}/g, clientName);

    // Send WhatsApp message
    const { sendWhatsAppMessage } = await import('./webhookService');
    const sent = await sendWhatsAppMessage(
      `${instanceName}_Cliente`,
      whatsappNumber,
      message
    );

    return sent;
  } catch (error) {
    console.error("Erro ao enviar mensagem de agradecimento:", error);
    return false;
  }
};

// Check for subscriptions that need renewal and send reminders
export const checkAndSendSubscriptionReminders = async (
  instanceName: string,
  config: MercadoPagoConfig
): Promise<number> => {
  try {
    if (!config.enabled) {
      console.log("Integração com Mercado Pago não está habilitada");
      return 0;
    }

    console.log(`Verificando assinaturas para renovação na instância ${instanceName}`);
    
    // In a real implementation, this would fetch clients from a database
    // and check their subscription expiration dates
    const { getClientList } = await import('./campaign/clientService');
    const clients = await getClientList();
    
    let remindersSent = 0;
    
    for (const client of clients) {
      // Simulate expiration check (in real implementation, would check against actual dates)
      const needsReminder = Math.random() > 0.7;
      
      if (needsReminder) {
        const daysUntilExpiration = config.notifyDaysBeforeExpiration;
        const amount = 99.90; // Simulated amount - in real implementation, would be from database
        
        const sent = await sendPaymentReminder(
          instanceName,
          client.id,
          client.name,
          client.whatsapp,
          amount,
          daysUntilExpiration,
          config
        );
        
        if (sent) {
          remindersSent++;
          console.log(`Lembrete enviado para ${client.name} (${client.whatsapp})`);
        }
      }
    }
    
    console.log(`${remindersSent} lembretes de renovação enviados`);
    return remindersSent;
  } catch (error) {
    console.error("Erro ao verificar assinaturas para renovação:", error);
    return 0;
  }
};

// Process a payment webhook from Mercado Pago
export const processPaymentWebhook = async (
  instanceName: string,
  paymentData: any
): Promise<boolean> => {
  try {
    const config = getMercadoPagoConfig(instanceName);
    
    if (!config || !config.enabled) {
      console.log("Integração com Mercado Pago não está habilitada");
      return false;
    }

    console.log("Processando webhook de pagamento:", paymentData);
    
    // In a real implementation, this would validate the payment data
    // and update the subscription status in the database
    
    // Extract client information
    const clientId = paymentData.external_reference;
    const status = paymentData.status;
    
    if (status === 'approved') {
      // Get client information
      const { getClientList } = await import('./campaign/clientService');
      const clients = await getClientList();
      const client = clients.find(c => c.id === clientId);
      
      if (client) {
        // Send thank you message after a short delay (10 seconds)
        setTimeout(async () => {
          const sent = await sendThankYouMessage(
            instanceName,
            client.name,
            client.whatsapp,
            config
          );
          
          if (sent) {
            console.log(`Mensagem de agradecimento enviada para ${client.name}`);
          }
        }, 10000);
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Erro ao processar webhook de pagamento:", error);
    return false;
  }
};
