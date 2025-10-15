import { logGeminiSetupInstructions, validateGeminiAPIKey } from '../utils/apiKeyHelper';
import { getAllExpenses } from './databaseService';
import { auth } from './firebase/firebase';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface UserFinancialContext {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  monthlyExpenses: number;
  categories: { [key: string]: number };
  recentTransactions: any[];
  budgetStatus?: string;
}

class GeminiChatBotService {
  private readonly API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  
  // Available models with remaining quota (ordered by preference)
  private readonly GEMINI_MODELS = [
    {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      name: 'Gemini 2.5 Flash',
      quota: 'High quota available'
    },
    {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', 
      name: 'Gemini 2.0 Flash',
      quota: 'Good quota available'
    },
    {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
      name: 'Gemini 2.5 Pro',
      quota: 'Limited but available'
    }
  ];
  
  private currentModelIndex = 0;
  
  async initialize() {
    // Reset to first model on initialization (quotas might have reset)
    this.currentModelIndex = 0;
    
    // Validate API key on initialization
    const validation = validateGeminiAPIKey(this.API_KEY);
    if (!validation.isValid) {
      console.warn('⚠️ Gemini API key validation failed:', validation.message);
      if (validation.suggestions) {
        validation.suggestions.forEach(suggestion => console.warn('💡', suggestion));
      }
      logGeminiSetupInstructions();
    } else {
      console.log('✅ GeminiChatBot initialized with valid API key');
      console.log(`🎯 Using ${this.GEMINI_MODELS[this.currentModelIndex].name} as primary model`);
    }
  }

  private async getUserFinancialContext(): Promise<UserFinancialContext> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's expenses from Firebase
      const expenses = await getAllExpenses(user.uid);
      
      // Calculate financial metrics
      const totalExpenses = expenses
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const totalIncome = expenses
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const balance = totalIncome - totalExpenses;
      
      // Current month expenses
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const monthlyExpenses = expenses
        .filter(e => {
          const expenseDate = new Date(e.date);
          return e.type === 'expense' && 
                 expenseDate.getMonth() === currentMonth && 
                 expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      // Category breakdown
      const categories: { [key: string]: number } = {};
      expenses
        .filter(e => e.type === 'expense')
        .forEach(expense => {
          const category = expense.category || 'Other';
          categories[category] = (categories[category] || 0) + expense.amount;
        });

      // Recent transactions (last 5)
      const recentTransactions = expenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(t => ({
          amount: t.amount,
          category: t.category,
          description: t.description || t.title,
          date: t.date,
          type: t.type
        }));

      return {
        totalExpenses,
        totalIncome,
        balance,
        monthlyExpenses,
        categories,
        recentTransactions
      };
    } catch (error) {
      console.error('❌ Error getting financial context:', error);
      return {
        totalExpenses: 0,
        totalIncome: 0,
        balance: 0,
        monthlyExpenses: 0,
        categories: {},
        recentTransactions: []
      };
    }
  }

  private createFinancialPrompt(userMessage: string, context: UserFinancialContext): string {
    const categoryList = Object.entries(context.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => `${cat}: ₹${amount.toFixed(2)}`)
      .join(', ');

    const recentTransactionsText = context.recentTransactions
      .slice(0, 3)
      .map(t => `₹${t.amount} on ${t.category} - ${t.description || 'No description'}`)
      .join('; ');

    return `You are Finze AI Assistant, a friendly and expert financial advisor. You're chatting with a user of the Finze expense tracking app.

🏦 USER'S FINANCIAL SNAPSHOT:
💰 Total Income: ₹${context.totalIncome.toFixed(2)}
💸 Total Expenses: ₹${context.totalExpenses.toFixed(2)}
🏧 Current Balance: ₹${context.balance.toFixed(2)}
📊 This Month's Spending: ₹${context.monthlyExpenses.toFixed(2)}
🏷️ Top Categories: ${categoryList || 'No spending data yet'}
📝 Recent Transactions: ${recentTransactionsText || 'No transactions yet'}

💬 USER ASKS: "${userMessage}"

RESPOND AS A HELPFUL AI ASSISTANT:
✅ Use their actual financial data to give personalized advice
✅ Be conversational, friendly, and encouraging
✅ Keep responses under 150 words
✅ Use Indian Rupees (₹) format
✅ If they need more specific help, mention Finze app features
✅ Give actionable advice based on their spending patterns
✅ Be realistic but positive about their financial situation

Respond naturally as if you're having a friendly conversation about their finances:`;
  }

  async sendMessage(userMessage: string): Promise<string> {
    try {
      await this.initialize();
      
      // Validate API key before making request
      const validation = validateGeminiAPIKey(this.API_KEY);
      if (!validation.isValid) {
        throw new Error('Invalid API key');
      }
      
      // Get user's financial context
      const financialContext = await this.getUserFinancialContext();
      
      // Create intelligent prompt with context
      const prompt = this.createFinancialPrompt(userMessage, financialContext);
      
      const selectedModel = this.GEMINI_MODELS[this.currentModelIndex];
      console.log(`🤖 Sending to ${selectedModel.name} (${selectedModel.quota})...`);
      
      // Create timeout promise for React Native compatibility
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
      });
      
      // Create fetch promise with current model
      const currentModelUrl = selectedModel.url;
      const fetchPromise = fetch(currentModelUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);
        
        // Handle specific API errors
        if (response.status === 429) {
          // Try next model if available
          if (this.currentModelIndex < this.GEMINI_MODELS.length - 1) {
            this.currentModelIndex++;
            const nextModel = this.GEMINI_MODELS[this.currentModelIndex];
            console.log(`⚡ Switching to ${nextModel.name} due to quota exceeded`);
            // Retry with the next model
            return this.sendMessage(userMessage);
          } else {
            // No more models available
            try {
              const errorData = JSON.parse(errorText);
              const retryInfo = errorData.error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'));
              const retryDelay = retryInfo?.retryDelay || '60s';
              throw new Error(`quota_exceeded:${retryDelay}`);
            } catch {
              throw new Error('quota_exceeded:60s');
            }
          }
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('invalid_api_key');
        } else {
          throw new Error(`Gemini API error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('✅ Gemini AI response received successfully');
        console.log('📊 Response length:', aiResponse.length, 'characters');
        return aiResponse;
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } catch (error) {
      console.error('❌ Error calling Gemini AI:', error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
          console.warn('⏱️ Gemini API request timed out');
        } else if (error.message.includes('network') || error.message.includes('NetworkError')) {
          console.warn('🌐 Network error connecting to Gemini API');
        } else if (error.message.includes('Invalid API key') || error.message.includes('API key')) {
          console.warn('🔑 Gemini API key issue');
        }
      }
      
      // Fallback to local intelligent responses
      return this.generateLocalResponse(userMessage, await this.getUserFinancialContext());
    }
  }

  private generateLocalResponse(userMessage: string, context: UserFinancialContext): string {
    const message = userMessage.toLowerCase();
    
    // Personalized responses based on user's actual data
    if (message.includes('budget') || message.includes('spending')) {
      const topCategory = Object.entries(context.categories)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topCategory) {
        return `Based on your spending data, your highest expense category is ${topCategory[0]} (₹${topCategory[1].toFixed(2)}). I recommend setting a monthly budget of ₹${(context.monthlyExpenses * 1.1).toFixed(2)} to give yourself some buffer. Would you like help creating category-specific budgets?`;
      }
      
      return `Looking at your monthly expenses of ₹${context.monthlyExpenses.toFixed(2)}, I suggest following the 50/30/20 rule. Would you like me to break this down for your specific situation?`;
    }
    
    if (message.includes('save') || message.includes('saving')) {
      const savingsPotential = Math.max(0, context.totalIncome - context.totalExpenses);
      
      if (savingsPotential > 0) {
        return `Great news! You currently have a positive balance of ₹${context.balance.toFixed(2)}. Based on your spending pattern, you could potentially save ₹${(savingsPotential * 0.2).toFixed(2)} more per month by optimizing your expenses. Would you like specific suggestions?`;
      } else {
        return `I notice your expenses are higher than income. Let's focus on reducing your top spending categories first. Your biggest expense is likely in ${Object.keys(context.categories)[0] || 'an untracked category'}. Should we analyze this together?`;
      }
    }
    
    if (message.includes('expense') || message.includes('track')) {
      const recentExpense = context.recentTransactions[0];
      
      if (recentExpense) {
        return `I see your most recent transaction was ₹${recentExpense.amount} in ${recentExpense.category}. You've spent ₹${context.monthlyExpenses.toFixed(2)} this month. To better track expenses, try categorizing them properly and setting spending alerts. Need help with any specific category?`;
      }
      
      return `You have ₹${context.totalExpenses.toFixed(2)} in tracked expenses. To improve tracking, I recommend using the AI scanner feature for receipts and setting up recurring transaction templates. What type of expenses do you struggle to track?`;
    }
    
    if (message.includes('balance') || message.includes('money') || message.includes('financial')) {
      return `Your current financial snapshot: Balance of ₹${context.balance.toFixed(2)}, with ₹${context.monthlyExpenses.toFixed(2)} spent this month. ${context.balance > 0 ? 'You\'re in a good position!' : 'Let\'s work on improving your balance.'} What specific financial goal would you like to focus on?`;
    }
    
    if (message.includes('category') || message.includes('categories')) {
      const topCategories = Object.entries(context.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
        
      if (topCategories.length > 0) {
        const categoryText = topCategories
          .map(([cat, amount]) => `${cat} (₹${amount.toFixed(2)})`)
          .join(', ');
        return `Your top spending categories are: ${categoryText}. These represent ${((topCategories.reduce((sum, [,amount]) => sum + amount, 0) / context.totalExpenses) * 100).toFixed(1)}% of your total expenses. Would you like suggestions to optimize any of these?`;
      }
      
      return `I recommend tracking expenses in these key categories: Food & Dining, Transportation, Shopping, Entertainment, Bills, and Healthcare. This will give you better insights into your spending patterns.`;
    }
    
    // Enhanced default response with more financial insights
    const savingsRate = context.totalIncome > 0 ? ((context.balance / context.totalIncome) * 100) : 0;
    const monthlyBurnRate = context.monthlyExpenses;
    
    let insight = "";
    if (savingsRate > 20) {
      insight = "You're doing great with savings! 🎉";
    } else if (savingsRate > 10) {
      insight = "Good progress on savings, but there's room for improvement! 💪";
    } else if (savingsRate > 0) {
      insight = "Let's work on boosting your savings rate! 📈";
    } else {
      insight = "Let's focus on creating a positive savings balance! 💡";
    }
    
    return `I'm here to help with your finances! ${insight} 
    
📊 Your financial snapshot:
• Balance: ₹${context.balance.toFixed(2)}
• Monthly spending: ₹${monthlyBurnRate.toFixed(2)}
• Savings rate: ${savingsRate.toFixed(1)}%
• Total expenses: ₹${context.totalExpenses.toFixed(2)}

I can help with budgeting, saving strategies, expense analysis, or any specific financial questions. What would you like to focus on?`;
  }
}

export const geminiChatBotService = new GeminiChatBotService();
export default geminiChatBotService;