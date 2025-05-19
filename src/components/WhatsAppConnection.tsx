
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquare, QrCode, Link, Unlink, Trash2, Check, RefreshCw } from "lucide-react";
import { useEvoInstance } from '@/hooks/useEvoInstance';
import { Button } from "@/components/ui/button";

const WhatsAppConnection: React.FC = () => {
  const [instanceNameInput, setInstanceNameInput] = useState('');
  const {
    loading,
    qrcode,
    instanceName,
    instanceStatus,
    error,
    createInstance,
    logout,
    deleteInst,
    refreshInstanceStatus
  } = useEvoInstance();
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Função para atualizar o status
  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await refreshInstanceStatus();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instanceNameInput.trim()) {
      createInstance(instanceNameInput.trim());
    }
  };
  
  // Verificar status ao montar o componente
  useEffect(() => {
    if (instanceName) {
      refreshInstanceStatus();
    }
  }, [instanceName]);

  return (
    <Card className="border-blue-500/20 bg-black">
      <CardHeader>
        <CardTitle className="text-xl text-blue-400">Conectar à Instância</CardTitle>
        <CardDescription className="text-gray-400">
          Conecte-se à instância da Evolution para usar os agentes IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-gray-900 rounded-md mb-4">
          <h3 className="text-lg mb-2">Instruções:</h3>
          <ol className="list-decimal ml-6 space-y-2 text-gray-300">
            <li>Digite seu nome ou nome da empresa no campo abaixo</li>
            <li>Clique em "Gerar QR Code" para conectar ao WhatsApp</li>
            <li>Escaneie o QR Code com seu WhatsApp</li>
            <li>Após conectar, você poderá integrar bots IA ao seu sistema</li>
          </ol>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4 border-red-500 bg-red-900/20">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!instanceName || instanceStatus === "Desligada" ? (
          <div className="p-4 bg-blue-900/20 rounded-md">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome ou Empresa
                </label>
                <input 
                  type="text" 
                  id="nome" 
                  name="nome"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white" 
                  placeholder="Seu Nome ou Nome da Empresa" 
                  value={instanceNameInput}
                  onChange={(e) => setInstanceNameInput(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>Processando...</>
                ) : (
                  <><QrCode className="w-4 h-4" /> Gerar QR Code para WhatsApp</>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-green-400">
                <Check className="h-5 w-5" />
                <h3 className="font-medium">Instância Conectada</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="border-green-500 text-green-400 hover:bg-green-900/20"
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-1">{refreshing ? "Atualizando..." : "Atualizar status"}</span>
              </Button>
            </div>
            <div className="mb-4">
              <p className="text-gray-300">Nome: {instanceName?.replace("_Cliente", "")}</p>
              <p className="text-gray-300">Status: {instanceStatus}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={logout}
                disabled={loading || refreshing}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
              >
                <Unlink className="w-4 h-4" /> Desconectar
              </button>
              <button 
                onClick={deleteInst}
                disabled={loading || refreshing}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Excluir Instância
              </button>
            </div>
          </div>
        )}
        
        {qrcode && (
          <div className="mt-6 flex flex-col items-center">
            <div className="bg-white p-4 rounded-md">
              <img 
                src={qrcode} 
                alt="QR Code para conexão WhatsApp" 
                className="w-48 h-48"
              />
            </div>
            <p className="mt-4 text-sm text-gray-400">Escaneie o QR Code com seu WhatsApp</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppConnection;
