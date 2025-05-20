
// Serviço para gerenciamento de templates de cobrança personalizados

export interface ChargeTemplate {
  id: string;
  name: string;
  template: string;
  createdAt: Date;
}

// Chave para armazenamento local
const TEMPLATES_STORAGE_KEY = 'charge_templates';

// Função para obter todos os templates salvos
export const getChargeTemplates = (): ChargeTemplate[] => {
  try {
    const templatesJson = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!templatesJson) return [];
    
    return JSON.parse(templatesJson).map((template: any) => ({
      ...template,
      createdAt: new Date(template.createdAt)
    }));
  } catch (error) {
    console.error('Erro ao carregar templates de cobrança:', error);
    return [];
  }
};

// Função para salvar um novo template
export const saveChargeTemplate = (template: Omit<ChargeTemplate, 'id' | 'createdAt'>): ChargeTemplate => {
  try {
    const templates = getChargeTemplates();
    
    const newTemplate: ChargeTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    
    templates.push(newTemplate);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    
    return newTemplate;
  } catch (error) {
    console.error('Erro ao salvar template de cobrança:', error);
    throw new Error('Não foi possível salvar o template de cobrança');
  }
};

// Função para atualizar um template existente
export const updateChargeTemplate = (id: string, updates: Partial<Omit<ChargeTemplate, 'id' | 'createdAt'>>): ChargeTemplate => {
  try {
    const templates = getChargeTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Template não encontrado');
    }
    
    const updatedTemplate = {
      ...templates[index],
      ...updates
    };
    
    templates[index] = updatedTemplate;
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    
    return updatedTemplate;
  } catch (error) {
    console.error('Erro ao atualizar template de cobrança:', error);
    throw new Error('Não foi possível atualizar o template de cobrança');
  }
};

// Função para excluir um template
export const deleteChargeTemplate = (id: string): boolean => {
  try {
    const templates = getChargeTemplates();
    const updatedTemplates = templates.filter(t => t.id !== id);
    
    if (templates.length === updatedTemplates.length) {
      return false; // Nenhum template foi removido
    }
    
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    return true;
  } catch (error) {
    console.error('Erro ao excluir template de cobrança:', error);
    return false;
  }
};

// Função para processar um template com dados de cliente
export const processTemplate = (
  templateText: string, 
  data: { [key: string]: string | number | Date }
): string => {
  let processed = templateText;
  
  // Substitui todas as variáveis no formato {variavel}
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    
    // Formata valores especiais
    let formattedValue = value;
    if (value instanceof Date) {
      formattedValue = value.toLocaleDateString('pt-BR');
    } else if (typeof value === 'number' && key.toLowerCase().includes('valor')) {
      formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    
    processed = processed.replace(regex, String(formattedValue));
  });
  
  return processed;
};
