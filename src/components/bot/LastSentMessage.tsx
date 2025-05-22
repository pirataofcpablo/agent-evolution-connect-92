
import React from 'react';

interface LastSentMessageProps {
  message: string | null;
  recipient: string | null;
}

const LastSentMessage: React.FC<LastSentMessageProps> = ({ message, recipient }) => {
  if (!message || !recipient) return null;
  
  return (
    <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-md">
      <p className="text-green-400 font-medium">Última mensagem enviada:</p>
      <div className="mt-2 text-gray-300 text-sm">
        <p className="mb-1"><strong>Para:</strong> {recipient}</p>
        <p><strong>Mensagem:</strong> {message}</p>
      </div>
    </div>
  );
};

export default LastSentMessage;
