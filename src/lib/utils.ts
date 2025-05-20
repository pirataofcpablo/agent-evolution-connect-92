
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

// Convert base64 image data to a file object that can be used in image elements
export function base64ToImageFile(base64Data: string, filename: string = 'qrcode.png'): File | null {
  try {
    // Check if it's a valid base64 string
    if (!base64Data || !base64Data.includes('base64')) {
      return null;
    }
    
    // Extract the base64 data (remove the MIME type prefix)
    const base64Content = base64Data.split(',')[1];
    const mimeType = base64Data.split(';')[0].split(':')[1];
    
    // Convert base64 to blob
    const byteCharacters = atob(base64Content);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  } catch (error) {
    console.error("Erro ao converter base64 para arquivo:", error);
    return null;
  }
}

// Format Mercado Pago QR code data for sharing via Telegram
export function formatQrCodeForTelegram(qrCodeData: string): string {
  // Check if we have data
  if (!qrCodeData) return '';
  
  // If it's already a URL, return as is
  if (qrCodeData.startsWith('http')) {
    return qrCodeData;
  }
  
  // If it's base64 data, keep it as is (Telegram API can handle base64 images)
  if (qrCodeData.startsWith('data:image')) {
    return qrCodeData;
  }
  
  // If it's just the QR code content, we need to convert it
  // This is just a placeholder implementation - usually QR code data from Mercado Pago
  // would already be properly formatted
  return `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(qrCodeData)}`;
}

// Convert payment link to a shareable format (useful for WhatsApp or Telegram)
export function formatPaymentLink(link: string, includeText: boolean = false): string {
  if (!link) return '';
  
  // Make sure the link is properly formatted
  const formattedLink = link.startsWith('http') ? link : `https://${link}`;
  
  if (!includeText) {
    return formattedLink;
  }
  
  // Format with text for messaging apps
  return `Para realizar o pagamento, acesse o link: ${formattedLink}`;
}

// Open Chatwoot in a new window
export function openChatwoot(): void {
  const chatwootUrl = "http://app.solucoesweb.uk";
  window.open(chatwootUrl, "_blank");
}
