
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDifyConfig } from '@/services/difyService';
import { getN8nConfig } from '@/services/n8nService';
import { sendWhatsAppMessage } from '@/services/webhookService';
import { MessageSquare, Bot, Send } from "lucide-react";

interface BotStatusProps {
  instanceName: string | null;
}

const BotStatus: React.FC<BotStatusProps> = ({ instanceName }) => {
  const [difyActive, setDifyActive] = useState(false);
  const [n8nActive, setN8nActive] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (instanceName) {
      const difyConfig = getDifyConfig(instanceName);
      const n8nConfig = getN8nConfig(instanceName);
      
      setDifyActive(!!difyConfig);
      setN8nActive(!!n8nConfig);
    }
  }, [instanceName]);

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
            <div className={`p-4 border rounded-md ${difyActive ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
              <div className="flex items-center gap-2">
                <Bot className={`h-5 w-5 ${difyActive ? 'text-green-400' : 'text-gray-400'}`} />
                <h3 className={`font-medium ${difyActive ? 'text-green-400' : 'text-gray-400'}`}>Dify IA</h3>
              </div>
              <p className="text-sm mt-2 text-gray-300">
                {difyActive 
                  ? "Integração ativa e pronta para processar mensagens" 
                  : "Integração não configurada"}
              </p>
            </div>
            
            <div className={`p-4 border rounded-md ${n8nActive ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
              <div className="flex items-center gap-2">
                <Bot className={`h-5 w-5 ${n8nActive ? 'text-green-400' : 'text-gray-400'}`} />
                <h3 className={`font-medium ${n8nActive ? 'text-green-400' : 'text-gray-400'}`}>n8n</h3>
              </div>
              <p className="text-sm mt-2 text-gray-300">
                {n8nActive 
                  ? "Integração ativa e pronta para processar mensagens" 
                  : "Integração não configurada"}
              </p>
            </div>
          </div>
          
          {/* Testar bot */}
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
                disabled={isSending || !instanceName || (!difyActive && !n8nActive)}
                className="bg-blue-600 hover:bg-blue-700 w-full"
              >
                {isSending ? "Enviando..." : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Mensagem de Teste
                  </div>
                )}
              </Button>
              
              {(!difyActive && !n8nActive) && (
                <p className="text-yellow-400 text-center text-sm">
                  Configure pelo menos uma integração antes de enviar mensagens de teste
                </p>
              )}
            </form>
          </div>
          
          {/* Informações sobre o funcionamento */}
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-md">
            <h3 className="font-medium text-white mb-2">Como funciona:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
              <li>Mensagens recebidas no WhatsApp serão processadas pelo bot configurado</li>
              <li>Se o Dify estiver ativo, as mensagens serão processadas pelo assistente IA</li>
              <li>Se o n8n estiver ativo, as mensagens acionarão os fluxos de automação configurados</li>
              <li>As respostas serão enviadas automaticamente de volta ao WhatsApp</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BotStatus;
