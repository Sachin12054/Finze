export interface LegacyExpense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category?: string;
  type: 'income' | 'expense';
  source?: string;
  description?: string;
}