
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { CreditCard, Info, Loader2 } from 'lucide-react';
import { getMercadoPagoConfig, saveMercadoPagoConfig, testMercadoPagoConnection } from '@/services/mercadoPagoService';

interface MercadoPagoIntegrationProps {
  instanceName: string;
}

const MercadoPagoIntegration: React.FC<MercadoPagoIntegrationProps> = ({ instanceName }) => {
  const [config, setConfig] = useState({
    accessToken: '',
    enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [instanceName]);

  const loadConfig = async () => {
    if (!instanceName) return;
    setLoading(true);
    try {
      const existingConfig = getMercadoPagoConfig(instanceName);
      if (existingConfig) {
        setConfig({
          accessToken: existingConfig.accessToken || '',
          enabled: existingConfig.enabled || false
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configuração do Mercado Pago:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = e.target.checked;
      setConfig(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [name]: e.target.value
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
      // Montamos um config completo com os valores default para os campos que não usamos mais aqui
      const fullConfig = {
        accessToken: config.accessToken,
        enabled: config.enabled,
        notifyDaysBeforeExpiration: 3,
        reminderMessage: "Olá {nome}, sua mensalidade vence em {dias} dias. Para renovar, utilize o link/QR code: {link}",
        thankYouMessage: "Obrigado pelo pagamento!"
      };
      
      await saveMercadoPagoConfig(instanceName, fullConfig);
      
      toast({
        title: "Configuração salva",
        description: "Token de acesso do Mercado Pago salvo com sucesso!",
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
    try {
      // Usamos o config completo para o teste também
      const fullConfig = {
        accessToken: config.accessToken,
        enabled: config.enabled,
        notifyDaysBeforeExpiration: 3,
        reminderMessage: "",
        thankYouMessage: ""
      };
      
      const result = await testMercadoPagoConnection(fullConfig);
      
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
            <CardTitle className="text-xl text-yellow-400">Mercado Pago</CardTitle>
            <CardDescription className="text-gray-400">
              Configure o acesso ao Mercado Pago para processar pagamentos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-yellow-900/20 border-yellow-500/30">
          <Info className="h-5 w-5 text-yellow-400" />
          <AlertTitle className="text-yellow-400">Gestão financeira simplificada</AlertTitle>
          <AlertDescription className="text-gray-300">
            Insira apenas o token de acesso do Mercado Pago. As opções avançadas de cobrança e 
            gerenciamento estão disponíveis no "Gestor Pix".
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
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={config.enabled}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="enabled">Habilitar integração</Label>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button 
              onClick={handleTest}
              disabled={testing}
              className="bg-amber-600 hover:bg-amber-700"
              variant="ghost"
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
                <>Salvar Token</>
              )}
            </Button>
          </div>
          
          <p className="text-sm text-gray-400 border-t border-gray-700 pt-4 mt-6">
            <CreditCard className="inline-block mr-2 h-4 w-4" />
            Para configurar cobranças automáticas e visualizar QR Codes de pagamento, 
            acesse o <strong>Gestor Pix</strong> no menu lateral.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MercadoPagoIntegration;
