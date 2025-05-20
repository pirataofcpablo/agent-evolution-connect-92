
import { useState, useEffect } from 'react';
import { Calendar, Edit, Trash2, Check } from "lucide-react";
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
import { format, addMinutes } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  scheduleCampaign, 
  getCampaigns, 
  cancelCampaign, 
  getClientList,
  type Campaign 
} from "@/services/campaignService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface Campaign {
  id: string;
  campaignName: string;
  message: string;
  recipients: string[];
  scheduledAt: string;
  status: string;
}

interface ClientOption {
  id: string;
  name: string;
  whatsapp: string;
  selected: boolean;
}

const CampaignPage = () => {
  const [loading, setLoading] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [scheduledTime, setScheduledTime] = useState(format(addMinutes(new Date(), 2), "HH:mm"));
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [showClientSelect, setShowClientSelect] = useState(false);
  const [selectAllClients, setSelectAllClients] = useState(false);

  useEffect(() => {
    loadCampaigns();
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clients = await getClientList();
      setClientOptions(clients.map(client => ({
        ...client,
        selected: false
      })));
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const handleSelectAllClients = (checked: boolean) => {
    setSelectAllClients(checked);
    setClientOptions(prev => prev.map(client => ({
      ...client,
      selected: checked
    })));
  };

  const handleClientToggle = (clientId: string, checked: boolean) => {
    setClientOptions(prev => {
      const updated = prev.map(client => 
        client.id === clientId ? { ...client, selected: checked } : client
      );
      
      // Update selectAll based on whether all clients are selected
      const allSelected = updated.every(client => client.selected);
      setSelectAllClients(allSelected);
      
      return updated;
    });
  };

  const loadCampaigns = async () => {
    const instanceName = localStorage.getItem('instanceName');
    
    if (!instanceName) {
      toast({
        title: "Instância não conectada",
        description: "Conecte uma instância do WhatsApp antes de visualizar campanhas.",
        variant: "destructive",
      });
      return;
    }
    
    setLoadingCampaigns(true);
    try {
      const result = await getCampaigns(instanceName);
      setCampaigns(result || []);
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao buscar campanhas",
        variant: "destructive",
      });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    const instanceName = localStorage.getItem('instanceName');
    
    if (!instanceName) {
      toast({
        title: "Instância não conectada",
        description: "Conecte uma instância do WhatsApp antes de excluir campanhas.",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) {
      return;
    }
    
    try {
      await cancelCampaign(instanceName, campaignId);
      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso."
      });
      loadCampaigns();
    } catch (error) {
      console.error("Erro ao excluir campanha:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir campanha",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName || (!recipients && !clientOptions.some(c => c.selected)) || !message || !scheduledDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se a data/hora é pelo menos 2 minutos no futuro
    const now = new Date();
    const dateTime = new Date(scheduledDate);
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    dateTime.setHours(hours, minutes);
    
    const minimumScheduleTime = addMinutes(now, 2);
    if (dateTime < minimumScheduleTime) {
      toast({
        title: "Data inválida",
        description: "A data e hora do agendamento deve ser pelo menos 2 minutos no futuro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get recipient list from selected clients and/or manual input
      let recipientList: string[] = [];
      
      // Add selected clients
      const selectedClients = clientOptions.filter(c => c.selected);
      if (selectedClients.length > 0) {
        recipientList = [...recipientList, ...selectedClients.map(c => c.whatsapp)];
      }
      
      // Add manually entered recipients if any
      if (recipients.trim()) {
        const manualRecipients = recipients.split(',').map(r => r.trim());
        recipientList = [...recipientList, ...manualRecipients];
      }
      
      // Remove duplicates
      recipientList = [...new Set(recipientList)];
      
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
          description: `A campanha "${campaignName}" foi agendada para ${format(dateTime, "PPP 'às' HH:mm")}. Será enviada automaticamente no horário programado.`,
        });
        
        // Reset form
        setCampaignName("");
        setMessage("");
        setRecipients("");
        setScheduledDate(new Date());
        setScheduledTime(format(addMinutes(new Date(), 2), "HH:mm"));
        setClientOptions(prev => prev.map(c => ({ ...c, selected: false })));
        setSelectAllClients(false);
        
        // Reload campaigns
        loadCampaigns();
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

  // Função que será implementada na próxima versão
  const handleEditCampaign = (campaign: Campaign) => {
    toast({
      title: "Em breve",
      description: "A funcionalidade de edição estará disponível na próxima atualização."
    });
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
          
          <Tabs defaultValue="create">
            <TabsList className="bg-gray-800 mb-4">
              <TabsTrigger value="create" className="data-[state=active]:bg-gray-700">Criar Campanha</TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-gray-700">Campanhas Agendadas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
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
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Destinatários</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowClientSelect(!showClientSelect)} 
                          className="text-xs h-8 bg-gray-800"
                        >
                          {showClientSelect ? "Ocultar Clientes" : "Selecionar Clientes"}
                        </Button>
                      </div>
                      
                      {showClientSelect && (
                        <Card className="bg-gray-800 border-gray-700 p-4">
                          <div className="mb-4 flex items-center">
                            <Checkbox 
                              id="select-all" 
                              checked={selectAllClients} 
                              onCheckedChange={(checked) => handleSelectAllClients(!!checked)} 
                            />
                            <Label htmlFor="select-all" className="ml-2 text-sm font-medium">
                              Selecionar todos
                            </Label>
                          </div>
                          
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {clientOptions.length === 0 ? (
                              <p className="text-sm text-gray-400">Nenhum cliente cadastrado.</p>
                            ) : (
                              clientOptions.map(client => (
                                <div key={client.id} className="flex items-center">
                                  <Checkbox 
                                    id={`client-${client.id}`} 
                                    checked={client.selected}
                                    onCheckedChange={(checked) => handleClientToggle(client.id, !!checked)}
                                  />
                                  <Label htmlFor={`client-${client.id}`} className="ml-2 text-sm">
                                    {client.name} ({client.whatsapp})
                                  </Label>
                                </div>
                              ))
                            )}
                          </div>
                          
                          {clientOptions.some(c => c.selected) && (
                            <div className="mt-4 text-sm text-gray-400">
                              Selecionado: {clientOptions.filter(c => c.selected).length} cliente(s)
                            </div>
                          )}
                        </Card>
                      )}
                      
                      <div>
                        <Textarea 
                          value={recipients} 
                          onChange={(e) => setRecipients(e.target.value)} 
                          placeholder="Adicione números manualmente separados por vírgula (Ex: 5511999999999, 5511888888888)"
                          className="bg-gray-800 border-gray-700"
                        />
                        <p className="text-sm text-gray-400 mt-1">
                          Formato: números com código do país sem + ou espaços (Ex: 5511999999999)
                        </p>
                      </div>
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
            </TabsContent>
            
            <TabsContent value="list">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Campanhas Agendadas</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todas as suas campanhas agendadas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCampaigns ? (
                    <div className="text-center py-8">Carregando campanhas...</div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      Nenhuma campanha agendada. Crie uma nova campanha na aba "Criar Campanha".
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader className="bg-gray-800">
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Data Agendada</TableHead>
                            <TableHead>Destinatários</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {campaigns.map((campaign) => (
                            <TableRow key={campaign.id} className="border-gray-800">
                              <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                              <TableCell>
                                {new Date(campaign.scheduledAt).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell>{campaign.recipients.length} contatos</TableCell>
                              <TableCell>
                                <span 
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    campaign.status === 'scheduled' 
                                      ? 'bg-yellow-500/20 text-yellow-300' 
                                      : campaign.status === 'completed' 
                                      ? 'bg-green-500/20 text-green-300'
                                      : 'bg-red-500/20 text-red-300'
                                  }`}
                                >
                                  {campaign.status === 'scheduled' ? 'Agendada' : 
                                   campaign.status === 'completed' ? 'Concluída' : 'Cancelada'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 bg-gray-700"
                                    onClick={() => handleEditCampaign(campaign)}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 bg-gray-700 hover:bg-red-900 hover:text-red-400"
                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline"
                      className="bg-gray-800 hover:bg-gray-700"
                      onClick={loadCampaigns}
                      disabled={loadingCampaigns}
                    >
                      {loadingCampaigns ? "Atualizando..." : "Atualizar Lista"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CampaignPage;
