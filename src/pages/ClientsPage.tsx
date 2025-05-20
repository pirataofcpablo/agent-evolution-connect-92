
import { useState, useEffect } from 'react';
import { Calendar, Plus, Save, Trash2, User } from "lucide-react";
import { format, parse } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import SideNav from "@/components/SideNav";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addClient, getAllClients, deleteClient, scheduleClientReminder, Client } from "@/services/clientService";

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [planValue, setPlanValue] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [reminderMessage, setReminderMessage] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    try {
      const clientData = getAllClients();
      setClients(clientData);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive",
      });
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !whatsapp || !planValue || !dueDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Normalize WhatsApp number
    const normalizedWhatsapp = whatsapp.replace(/\D/g, "");
    if (normalizedWhatsapp.length < 10) {
      toast({
        title: "Número inválido",
        description: "Por favor, insira um número de WhatsApp válido com DDD",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newClient = await addClient({
        name,
        whatsapp: normalizedWhatsapp,
        planValue: parseFloat(planValue),
        dueDate: dueDate as Date,
        reminderMessage,
      });
      
      // Schedule the automatic reminder
      const reminderScheduled = await scheduleClientReminder(newClient);
      
      toast({
        title: "Cliente adicionado",
        description: `Cliente ${name} foi adicionado com sucesso${reminderScheduled ? ' e lembrete agendado' : ''}`,
      });
      
      // Reset form
      setName("");
      setWhatsapp("");
      setPlanValue("");
      setDueDate(new Date());
      setReminderMessage("");
      
      // Refresh client list
      loadClients();
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente ${clientName}?`)) {
      return;
    }
    
    try {
      const deleted = deleteClient(id);
      
      if (deleted) {
        toast({
          title: "Cliente excluído",
          description: `O cliente ${clientName} foi excluído com sucesso`,
        });
        loadClients();
      } else {
        throw new Error("Cliente não encontrado");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir cliente",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />
      
      <div className="flex flex-grow">
        <SideNav />
        
        <div className="flex-1 p-6 mx-auto max-w-7xl">
          <div className="flex items-center mb-6">
            <User className="mr-2 h-6 w-6 text-orange-500" />
            <h1 className="text-3xl font-bold">Clientes</h1>
          </div>
          
          <Tabs defaultValue="add">
            <TabsList className="bg-gray-800 mb-4">
              <TabsTrigger value="add" className="data-[state=active]:bg-gray-700">Adicionar Cliente</TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-gray-700">Lista de Clientes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Cadastrar Novo Cliente</CardTitle>
                  <CardDescription>
                    Preencha os dados do cliente para agendamento automático de lembretes de renovação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddClient} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="client-name">Nome do Cliente</Label>
                      <Input 
                        id="client-name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Nome completo do cliente"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">Número do WhatsApp</Label>
                      <Input 
                        id="whatsapp" 
                        value={whatsapp} 
                        onChange={(e) => setWhatsapp(e.target.value)} 
                        placeholder="Ex: 5511999999999"
                        className="bg-gray-800 border-gray-700"
                      />
                      <p className="text-sm text-gray-400">
                        Formato: números com código do país sem + ou espaços (Ex: 5511999999999)
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="plan-value">Valor do Plano</Label>
                        <Input 
                          id="plan-value" 
                          type="number" 
                          step="0.01"
                          value={planValue} 
                          onChange={(e) => setPlanValue(e.target.value)} 
                          placeholder="Ex: 99.90"
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Data de Vencimento</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left bg-gray-800 border-gray-700",
                                !dueDate && "text-gray-400"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {dueDate ? format(dueDate, "PPP") : <span>Selecione uma data</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={dueDate}
                              onSelect={setDueDate}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reminder-message">Mensagem de Lembrete (Opcional)</Label>
                      <Textarea 
                        id="reminder-message" 
                        value={reminderMessage} 
                        onChange={(e) => setReminderMessage(e.target.value)} 
                        placeholder={`Olá [nome], seu plano no valor de R$ [valor] vence amanhã. Segue o pix para renovação: [SEU PIX AQUI]. Qualquer dúvida me chama.`}
                        className="bg-gray-800 border-gray-700 min-h-[100px]"
                      />
                      <p className="text-sm text-gray-400">
                        O sistema automaticamente substituirá [nome] e [valor] pelos dados do cliente. 
                        Se deixar em branco, um modelo padrão será usado.
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2" 
                      disabled={loading}
                    >
                      {loading ? "Salvando..." : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar Cliente e Agendar Lembrete
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="list">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Lista de Clientes</CardTitle>
                  <CardDescription>
                    Gerencie seus clientes e verifique lembretes agendados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clients.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      Nenhum cliente cadastrado. Adicione clientes na aba "Adicionar Cliente".
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader className="bg-gray-800">
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Valor do Plano</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status do Lembrete</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clients.map((client) => (
                            <TableRow key={client.id} className="border-gray-800">
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell>{client.whatsapp}</TableCell>
                              <TableCell>{formatCurrency(client.planValue)}</TableCell>
                              <TableCell>{format(new Date(client.dueDate), "dd/MM/yyyy")}</TableCell>
                              <TableCell>
                                <span 
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    client.reminderScheduled 
                                      ? 'bg-green-500/20 text-green-300' 
                                      : 'bg-yellow-500/20 text-yellow-300'
                                  }`}
                                >
                                  {client.reminderScheduled ? 'Agendado' : 'Pendente'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 bg-gray-700 hover:bg-red-900 hover:text-red-400"
                                  onClick={() => handleDeleteClient(client.id, client.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
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
                      className="bg-gray-800 hover:bg-gray-700 flex items-center gap-2"
                      onClick={loadClients}
                    >
                      <Plus className="h-4 w-4" />
                      Atualizar Lista
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

export default ClientsPage;
