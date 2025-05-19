
import { useState } from 'react';
import { Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { scheduleCampaign } from "@/services/campaignService";

const CampaignPage = () => {
  const [loading, setLoading] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("12:00");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName || !message || !recipients || !scheduledDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Format the date and time
      const dateTime = new Date(scheduledDate);
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      dateTime.setHours(hours, minutes);
      
      // Get recipient list (split by commas and trim whitespace)
      const recipientList = recipients.split(',').map(r => r.trim());
      
      // Get the connected instance name from localStorage
      const instanceName = localStorage.getItem('instanceName');
      
      if (!instanceName) {
        toast({
          title: "Instância não conectada",
          description: "Conecte uma instância do WhatsApp antes de agendar campanhas.",
          variant: "destructive",
        });
        return;
      }
      
      const result = await scheduleCampaign({
        instanceName,
        campaignName,
        message,
        recipients: recipientList,
        scheduledDateTime: dateTime
      });
      
      if (result.success) {
        toast({
          title: "Campanha agendada",
          description: `A campanha "${campaignName}" foi agendada para ${format(dateTime, "PPP 'às' HH:mm")}`,
        });
        
        // Reset form
        setCampaignName("");
        setMessage("");
        setRecipients("");
        setScheduledDate(undefined);
        setScheduledTime("12:00");
      } else {
        throw new Error(result.error || "Erro ao agendar campanha");
      }
    } catch (error) {
      console.error("Erro ao agendar campanha:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao agendar campanha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />
      
      <div className="flex flex-grow">
        <SideNav />
        
        <div className="flex-1 p-6 mx-auto max-w-7xl">
          <div className="flex items-center mb-6">
            <Calendar className="mr-2 h-6 w-6 text-orange-500" />
            <h1 className="text-3xl font-bold">Campanhas</h1>
          </div>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Agendar Nova Campanha</CardTitle>
              <CardDescription>
                Programe o envio de mensagens para múltiplos contatos em uma data e hora específica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Nome da Campanha</Label>
                  <Input 
                    id="campaign-name" 
                    value={campaignName} 
                    onChange={(e) => setCampaignName(e.target.value)} 
                    placeholder="Ex: Promoção de Natal"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea 
                    id="message" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="Digite a mensagem que será enviada..."
                    className="bg-gray-800 border-gray-700 min-h-[120px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipients">Destinatários</Label>
                  <Textarea 
                    id="recipients" 
                    value={recipients} 
                    onChange={(e) => setRecipients(e.target.value)} 
                    placeholder="Digite os números separados por vírgula (Ex: 5511999999999, 5511888888888)"
                    className="bg-gray-800 border-gray-700"
                  />
                  <p className="text-sm text-gray-400">
                    Formato: números com código do país sem + ou espaços (Ex: 5511999999999)
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Envio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left bg-gray-800 border-gray-700",
                            !scheduledDate && "text-gray-400"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, "PPP") : <span>Selecione uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-time">Horário</Label>
                    <Input 
                      id="scheduled-time" 
                      type="time" 
                      value={scheduledTime} 
                      onChange={(e) => setScheduledTime(e.target.value)} 
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                  disabled={loading}
                >
                  {loading ? "Agendando..." : "Agendar Campanha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignPage;
