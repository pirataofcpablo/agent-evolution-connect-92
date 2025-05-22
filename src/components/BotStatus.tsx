
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDifyConfig } from '@/services/difyService';
import { getN8nConfig } from '@/services/n8nService';
import IntegrationStatusCard from './bot/IntegrationStatusCard';
import TestMessageForm from './bot/TestMessageForm';
import LastSentMessage from './bot/LastSentMessage';
import BotInfoCard from './bot/BotInfoCard';

interface BotStatusProps {
  instanceName: string | null;
}

const BotStatus: React.FC<BotStatusProps> = ({ instanceName }) => {
  const [difyActive, setDifyActive] = useState(false);
  const [n8nActive, setN8nActive] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<string | null>(null);
  const [lastRecipient, setLastRecipient] = useState<string | null>(null);

  useEffect(() => {
    if (instanceName) {
      // Remover o sufixo "_Cliente" do nome da instância para verificar as configurações
      const baseInstanceName = instanceName.replace("_Cliente", "");
      
      // The getDifyConfig function no longer expects arguments, so we call it without any
      const difyConfig = getDifyConfig();
      const n8nConfig = getN8nConfig(baseInstanceName);
      
      setDifyActive(!!difyConfig);
      setN8nActive(!!n8nConfig);
    }
  }, [instanceName]);

  const handleMessageSent = (message: string, recipient: string) => {
    setLastSentMessage(message);
    setLastRecipient(recipient);
  };

  const hasActiveIntegrations = difyActive || n8nActive;

  return (
    <Card className="border-blue-500/20 bg-black">
      <CardHeader>
        <CardTitle className="text-xl text-blue-400">Status dos Bots</CardTitle>
        <CardDescription className="text-gray-400">
          Verifique o status das integrações e teste os bots
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status das integrações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IntegrationStatusCard 
              name="Dify IA"
              isActive={difyActive}
              description="Integração ativa e pronta para processar mensagens"
              activeMessage="Webhook configurado e recebendo mensagens do WhatsApp"
            />
            
            <IntegrationStatusCard 
              name="n8n"
              isActive={n8nActive}
              description="Integração ativa e pronta para processar mensagens"
              activeMessage="Webhook configurado e enviando mensagens para n8n"
            />
          </div>
          
          {/* Testar bot */}
          <TestMessageForm 
            instanceName={instanceName}
            hasActiveIntegrations={hasActiveIntegrations}
            onMessageSent={handleMessageSent}
          />
          
          <LastSentMessage 
            message={lastSentMessage}
            recipient={lastRecipient}
          />
          
          {/* Informações sobre o funcionamento */}
          <BotInfoCard />
        </div>
      </CardContent>
    </Card>
  );
};

export default BotStatus;
