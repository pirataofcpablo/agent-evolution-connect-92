
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
}

export function calculateDaysUntil(date: Date | string): number {
  if (!date) return 0;
  
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // Normaliza as datas para meia-noite para cálculo preciso de dias
  const target = new Date(targetDate.setHours(0, 0, 0, 0));
  const current = new Date(today.setHours(0, 0, 0, 0));
  
  // Calcula a diferença em dias
  const diffTime = target.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
