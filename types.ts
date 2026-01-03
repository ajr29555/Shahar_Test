export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export enum ExcuseTone {
  Professional = 'professional',
  Casual = 'casual',
  Funny = 'funny',
  Unbelievable = 'unbelievable'
}
