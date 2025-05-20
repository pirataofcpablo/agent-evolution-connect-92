
// Telegram bot API service for notifications and integration

// Interface for telegram configuration
export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyRenewal: boolean;
  notifyPayment: boolean;
  sendRenewalNotice: boolean;
  sendScheduledMessages: boolean;
}

// Retrieve the configuration for the specified instance
export const getTelegramConfig = (instanceName: string): TelegramConfig | null => {
  try {
    const storedConfig = localStorage.getItem(`telegram_config_${instanceName}`);
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar configuração do Telegram:", error);
    return null;
  }
};

// Save the configuration for the specified instance
export const saveTelegramConfig = async (instanceName: string, config: TelegramConfig): Promise<boolean> => {
  try {
    localStorage.setItem(`telegram_config_${instanceName}`, JSON.stringify(config));
    console.log(`Configuração do Telegram salva para instância ${instanceName}:`, config);
    return true;
  } catch (error) {
    console.error("Erro ao salvar configuração do Telegram:", error);
    throw error;
  }
};

// Test the connection to the Telegram bot
export const testTelegramConnection = async (config: TelegramConfig): Promise<{success: boolean, message?: string}> => {
  try {
    if (!config.botToken || !config.chatId) {
      return { 
        success: false, 
        message: "Token do bot ou ID do chat inválidos" 
      };
    }

    // Preparar a mensagem de teste
    const testMessage = "🤖 Teste de conexão com bot do Telegram realizado com sucesso!";
    
    // URL da API do Telegram para enviar mensagens
    const telegramApiUrl = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    
    // Enviar a mensagem de teste
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: testMessage,
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      return { 
        success: true,
        message: "Conexão estabelecida com sucesso!"
      };
    } else {
      return { 
        success: false, 
        message: `Erro: ${data.description || 'Falha ao enviar mensagem'}`
      };
    }
  } catch (error) {
    console.error("Erro ao testar conexão com Telegram:", error);
    return { 
      success: false, 
      message: `Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
};

// Send notification to Telegram
export const sendTelegramMessage = async (
  instanceName: string,
  message: string,
  type: 'renewal' | 'payment' | 'notice' | 'scheduled' = 'notice'
): Promise<boolean> => {
  try {
    const config = getTelegramConfig(instanceName);
    
    if (!config || !config.enabled) {
      console.log("Configuração do Telegram não encontrada ou desabilitada");
      return false;
    }
    
    // Verificar se este tipo de mensagem está habilitado
    if (
      (type === 'renewal' && !config.notifyRenewal) ||
      (type === 'payment' && !config.notifyPayment) ||
      (type === 'notice' && !config.sendRenewalNotice) ||
      (type === 'scheduled' && !config.sendScheduledMessages)
    ) {
      console.log(`Notificações do tipo ${type} estão desabilitadas`);
      return false;
    }
    
    // URL da API do Telegram para enviar mensagens
    const telegramApiUrl = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    
    // Enviar a mensagem
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log("Mensagem enviada com sucesso para o Telegram");
      return true;
    } else {
      console.error("Erro ao enviar mensagem para o Telegram:", data.description);
      return false;
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem para o Telegram:", error);
    return false;
  }
};

// Send notification when a client renews a subscription
export const notifyClientRenewal = async (instanceName: string, clientName: string, planName: string, value: number): Promise<boolean> => {
  const message = `✅ <b>Renovação de Assinatura</b>\n\nO cliente <b>${clientName}</b> renovou o plano <b>${planName}</b> no valor de <b>R$ ${value.toFixed(2)}</b>.`;
  return sendTelegramMessage(instanceName, message, 'renewal');
};

// Send notification when a payment is made
export const notifyPaymentReceived = async (instanceName: string, clientName: string, planName: string, value: number): Promise<boolean> => {
  const message = `💰 <b>Pagamento Recebido</b>\n\nO cliente <b>${clientName}</b> realizou o pagamento do plano <b>${planName}</b> no valor de <b>R$ ${value.toFixed(2)}</b>.`;
  return sendTelegramMessage(instanceName, message, 'payment');
};

// Send renewal notice to client via bot
export const sendClientRenewalNotice = async (
  instanceName: string, 
  clientName: string,
  planName: string,
  daysLeft: number,
  paymentLink: string,
  qrCodeUrl?: string
): Promise<boolean> => {
  let message = `🔔 <b>Aviso de Renovação</b>\n\nOlá <b>${clientName}</b>, seu plano <b>${planName}</b> vencerá em <b>${daysLeft} dias</b>.\n\nPara renovar, acesse o link: ${paymentLink}`;
  
  if (qrCodeUrl) {
    message += "\n\n<b>Ou escaneie o QR Code enviado abaixo para pagamento.</b>";
  }
  
  const sent = await sendTelegramMessage(instanceName, message, 'notice');
  
  // Se tem QR Code e a primeira mensagem foi enviada com sucesso, envia o QR Code
  if (sent && qrCodeUrl) {
    try {
      const config = getTelegramConfig(instanceName);
      if (config && config.enabled) {
        const telegramApiUrl = `https://api.telegram.org/bot${config.botToken}/sendPhoto`;
        
        const response = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: config.chatId,
            photo: qrCodeUrl,
            caption: "QR Code para pagamento do seu plano."
          })
        });
        
        const data = await response.json();
        return data.ok;
      }
    } catch (error) {
      console.error("Erro ao enviar QR Code para o Telegram:", error);
    }
  }
  
  return sent;
};

// Send a scheduled message to user or group/channel
export const sendScheduledMessage = async (
  instanceName: string,
  message: string,
  scheduleDate?: Date
): Promise<boolean> => {
  // Se uma data foi fornecida e é no futuro, agendamos a mensagem
  if (scheduleDate && scheduleDate > new Date()) {
    const timeUntilSend = scheduleDate.getTime() - new Date().getTime();
    
    // Agendar o envio da mensagem
    setTimeout(() => {
      sendTelegramMessage(instanceName, message, 'scheduled');
    }, timeUntilSend);
    
    return true;
  } 
  
  // Se nenhuma data foi fornecida ou é no passado, enviamos imediatamente
  return sendTelegramMessage(instanceName, message, 'scheduled');
};
