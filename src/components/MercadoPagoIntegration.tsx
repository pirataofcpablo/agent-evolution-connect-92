
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Check, Info, Loader2, BarChart } from 'lucide-react';
import { getMercadoPagoConfig, saveMercadoPagoConfig, testMercadoPagoConnection } from '@/services/mercadoPagoService';

interface MercadoPagoIntegrationProps {
  instanceName: string;
}

interface MercadoPagoConfig {
  accessToken: string;
  enabled: boolean;
  notifyDaysBeforeExpiration: number;
  reminderMessage: string;
  thankYouMessage: string;
}

const MercadoPagoIntegration: React.FC<MercadoPagoIntegrationProps> = ({ instanceName }) => {
  const [config, setConfig] = useState<MercadoPagoConfig>({
    accessToken: '',
    enabled: false,
    notifyDaysBeforeExpiration: 29,
    reminderMessage: 'Olá {nome}, seu plano vence em {dias} dias. Para renovar, utilize o link de pagamento: {link}',
    thankYouMessage: 'Muito obrigado {nome}! Qualquer dúvida é só me chamar.'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    loadConfig();
  }, [instanceName]);

  const loadConfig = async () => {
    if (!instanceName) return;
    setLoading(true);
    try {
      const existingConfig = getMercadoPagoConfig(instanceName);
      if (existingConfig) {
        setConfig(existingConfig);
      }
    } catch (error) {
      console.error("Erro ao carregar configuração do Mercado Pago:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setConfig(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setConfig(prev => ({
        ...prev,
        [name]: parseInt(value, 10)
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!instanceName) {
      toast({
        title: "Erro",
        description: "Nome da instância não encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (!config.accessToken) {
      toast({
        title: "Campo obrigatório",
        description: "O token de acesso é um campo obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await saveMercadoPagoConfig(instanceName, config);
      
      toast({
        title: "Configuração salva",
        description: "Configuração do Mercado Pago salva com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração do Mercado Pago.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.accessToken) {
      toast({
        title: "Campo obrigatório",
        description: "O token de acesso é um campo obrigatório para testar a conexão.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await testMercadoPagoConnection(config);
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Conexão bem-sucedida",
          description: "Conexão com Mercado Pago estabelecida com sucesso!",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: result.message || "Não foi possível conectar ao Mercado Pago.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setTestResult({
        success: false,
        message: "Erro ao testar conexão com Mercado Pago."
      });
      
      toast({
        title: "Erro no teste",
        description: "Ocorreu um erro ao testar a conexão com o Mercado Pago.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
        <span className="ml-2 text-yellow-500">Carregando configuração...</span>
      </div>
    );
  }

  return (
    <Card className="border-yellow-500/20 bg-black text-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-3xl">💰</span>
          <div>
            <CardTitle className="text-xl text-yellow-400">Integração com Mercado Pago</CardTitle>
            <CardDescription className="text-gray-400">
              Configure a integração para renovação automática de assinaturas via Mercado Pago
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-yellow-900/20 border-yellow-500/30">
          <Info className="h-5 w-5 text-yellow-400" />
          <AlertTitle className="text-yellow-400">Renovação automática de assinaturas</AlertTitle>
          <AlertDescription className="text-gray-300">
            Esta integração permite enviar avisos de renovação para seus clientes antes do vencimento,
            gerar links de pagamento personalizados e enviar mensagens de agradecimento após o pagamento.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token do Mercado Pago</Label>
            <Input 
              id="accessToken"
              name="accessToken"
              value={config.accessToken}
              onChange={handleInputChange}
              placeholder="Insira seu Access Token do Mercado Pago"
              className="bg-gray-900 border-gray-700"
            />
            <p className="text-xs text-gray-400">
              Encontrado nas configurações da sua conta Mercado Pago
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notifyDaysBeforeExpiration">Dias antes do vencimento para notificar</Label>
            <Input 
              id="notifyDaysBeforeExpiration"
              name="notifyDaysBeforeExpiration"
              type="number"
              value={config.notifyDaysBeforeExpiration}
              onChange={handleInputChange}
              placeholder="29"
              min="1"
              max="90"
              className="bg-gray-900 border-gray-700"
            />
            <p className="text-xs text-gray-400">
              Quantos dias antes do vencimento o sistema deve enviar a notificação
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reminderMessage">Mensagem de renovação</Label>
            <Textarea 
              id="reminderMessage"
              name="reminderMessage"
              value={config.reminderMessage}
              onChange={handleInputChange}
              placeholder="Mensagem que será enviada com o link de pagamento"
              className="bg-gray-900 border-gray-700 h-24"
            />
            <p className="text-xs text-gray-400">
              Use {'{nome}'} para incluir o nome do cliente, {'{dias}'} para dias até o vencimento, e {'{link}'} para o link de pagamento
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="thankYouMessage">Mensagem de agradecimento</Label>
            <Textarea 
              id="thankYouMessage"
              name="thankYouMessage"
              value={config.thankYouMessage}
              onChange={handleInputChange}
              placeholder="Mensagem que será enviada após o pagamento ser confirmado"
              className="bg-gray-900 border-gray-700 h-24"
            />
            <p className="text-xs text-gray-400">
              Use {'{nome}'} para incluir o nome do cliente
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={config.enabled}
              onChange={handleInputChange as any}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="enabled">Habilitar integração</Label>
          </div>
          
          {testResult && (
            <Alert className={testResult.success ? 
              "bg-green-900/20 border-green-500/30" : 
              "bg-red-900/20 border-red-500/30"}
            >
              {testResult.success ? 
                <Check className="h-5 w-5 text-green-400" /> : 
                <AlertCircle className="h-5 w-5 text-red-400" />
              }
              <AlertTitle className={testResult.success ? "text-green-400" : "text-red-400"}>
                {testResult.success ? "Conexão bem-sucedida" : "Falha na conexão"}
              </AlertTitle>
              <AlertDescription className="text-gray-300">
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}
          
          <Separator className="my-4 bg-gray-800" />
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleTest}
              disabled={testing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {testing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testando</>
              ) : (
                <>Testar Conexão</>
              )}
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando</>
              ) : (
                <>Salvar Configuração</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MercadoPagoIntegration;
