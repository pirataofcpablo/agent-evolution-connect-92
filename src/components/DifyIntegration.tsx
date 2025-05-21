
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DifyIntegrationProps {
  instanceName: string;
}

const DifyIntegration: React.FC<DifyIntegrationProps> = ({ instanceName }) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-yellow-900/20 border-yellow-500/30">
        <AlertCircle className="h-5 w-5 text-yellow-500" />
        <AlertTitle className="text-yellow-500">Integração Removida</AlertTitle>
        <AlertDescription className="text-gray-300">
          A integração com Dify foi temporariamente removida do sistema devido a problemas de compatibilidade.
          Entre em contato com o suporte para mais informações.
        </AlertDescription>
      </Alert>
      
      <Card className="border-gray-800 bg-gray-950">
        <CardHeader>
          <CardTitle className="text-xl text-gray-300">Integração Dify Indisponível</CardTitle>
          <CardDescription className="text-gray-400">
            Esta funcionalidade foi temporariamente desativada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-gray-900 rounded-md text-center">
            <p className="text-gray-400">
              A integração com a plataforma Dify foi removida temporariamente.
              Estamos trabalhando para resolver os problemas e restabelecer esta funcionalidade em breve.
            </p>
            <p className="mt-4 text-blue-400">
              Por favor, utilize a integração n8n como alternativa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DifyIntegration;
