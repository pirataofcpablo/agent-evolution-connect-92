
import React from 'react';

const BotInfoCard: React.FC = () => {
  return (
    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-md">
      <h3 className="font-medium text-white mb-2">Como funciona:</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
        <li>Mensagens recebidas no WhatsApp são automaticamente processadas pelo bot configurado</li>
        <li>Se o Dify estiver ativo, as mensagens são analisadas pela IA e respostas enviadas automaticamente</li>
        <li>Se o n8n estiver ativo, as mensagens acionam os fluxos de automação configurados</li>
        <li>Não são necessárias outras configurações, o sistema funciona automaticamente após a integração</li>
      </ul>
    </div>
  );
};

export default BotInfoCard;
