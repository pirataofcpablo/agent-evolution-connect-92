
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { MessageSquare, Send } from "lucide-react";
import { sendWhatsAppMessage } from '@/services/webhookService';

interface TestMessageFormProps {
  instanceName: string | null;
  hasActiveIntegrations: boolean;
  onMessageSent: (message: string, recipient: string) => void;
}

const TestMessageForm: React.FC<TestMessageFormProps> = ({
  instanceName,
  hasActiveIntegrations,
  onMessageSent
}) => {
  const [testMessage, setTestMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instanceName) {
      toast({
        title: "Erro",
        description: "Nenhuma instância conectada",
        variant: "destructive",
      });
      return;
    }
    
    if (!testMessage || !recipient) {
      toast({
        title: "Campos incompletos",
        description: "Preencha a mensagem e o número do destinatário",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      const success = await sendWhatsAppMessage(
        instanceName,
        recipient,
        testMessage
      );
      
      if (success) {
        toast({
          title: "Mensagem enviada",
          description: "A mensagem de teste foi enviada com sucesso",
        });
        onMessageSent(testMessage, recipient);
        setTestMessage("");
      } else {
        throw new Error("Falha ao enviar mensagem");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem de teste:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem de teste",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 border border-blue-500/30 bg-blue-900/10 rounded-md">
      <h3 className="font-medium text-blue-400 mb-3 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Testar Bots
      </h3>
      
      <form onSubmit={handleSendTest} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Número do destinatário</Label>
          <Input
            id="recipient"
            placeholder="5511999998888"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400">
            Formato: código do país + DDD + número (ex: 5511999998888)
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="testMessage">Mensagem de teste</Label>
          <Input
            id="testMessage"
            placeholder="Digite uma mensagem para testar o bot..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={isSending || !instanceName || !hasActiveIntegrations}
          className="bg-blue-600 hover:bg-blue-700 w-full"
        >
          {isSending ? "Enviando..." : (
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Mensagem de Teste
            </div>
          )}
        </Button>
        
        {!hasActiveIntegrations && (
          <p className="text-yellow-400 text-center text-sm">
            Configure pelo menos uma integração antes de enviar mensagens de teste
          </p>
        )}
      </form>
    </div>
  );
};

export default TestMessageForm;
