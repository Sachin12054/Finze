/**
 * Budget Monitoring Service
 * Monitors budget spending and triggers notifications when thresholds are reached
 */

import NotificationService from './notificationService';
import { EnhancedFirebaseService, Budget, Transaction } from './firebase/enhancedFirebaseService';

export interface BudgetAlert {
  budgetId: string;
  category: string;
  percentage: number;
  spent: number;
  total: number;
  alertLevel: 'warning' | 'critical' | 'exceeded';
  message: string;
}

class BudgetMonitoringServiceClass {
  private lastCheckedTimestamp: number = 0;
  private alertCooldown: Map<string, number> = new Map(); // Prevent duplicate alerts
  private readonly COOLDOWN_PERIOD = 3600000; // 1 hour in milliseconds

  /**
   * Check all budgets and send notifications if thresholds are exceeded
   */
  async checkBudgets(budgets: Budget[], transactions: Transaction[]): Promise<BudgetAlert[]> {
    const alerts: BudgetAlert[] = [];
    const now = Date.now();

    // Only check once every 5 minutes to avoid spam
    if (now - this.lastCheckedTimestamp < 300000) {
      return alerts;
    }

    this.lastCheckedTimestamp = now;

    for (const budget of budgets) {
      if (!budget.isActive || !budget.notifications) continue;

      const alert = await this.checkSingleBudget(budget, transactions);
      if (alert) {
        alerts.push(alert);
        
        // Send notification if not in cooldown
        const cooldownKey = `${budget.id}_${alert.alertLevel}`;
        const lastAlert = this.alertCooldown.get(cooldownKey) || 0;
        
        if (now - lastAlert > this.COOLDOWN_PERIOD) {
          await this.sendBudgetNotification(alert);
          this.alertCooldown.set(cooldownKey, now);
        }
      }
    }

    return alerts;
  }

  /**
   * Check a single budget and return alert if threshold exceeded
   */
  private async checkSingleBudget(budget: Budget, transactions: Transaction[]): Promise<BudgetAlert | null> {
    const spent = this.calculateSpentAmount(budget, transactions);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const threshold = budget.alertThreshold || 80;

    let alertLevel: 'warning' | 'critical' | 'exceeded' | null = null;
    let message = '';

    if (percentage >= 100) {
      alertLevel = 'exceeded';
      message = `You've exceeded your ${budget.category} budget! Spent ₹${spent.toLocaleString('en-IN')} of ₹${budget.amount.toLocaleString('en-IN')}`;
    } else if (percentage >= threshold + 10) {
      alertLevel = 'critical';
      message = `Critical: ${Math.round(percentage)}% of your ${budget.category} budget used (₹${spent.toLocaleString('en-IN')} of ₹${budget.amount.toLocaleString('en-IN')})`;
    } else if (percentage >= threshold) {
      alertLevel = 'warning';
      message = `Warning: ${Math.round(percentage)}% of your ${budget.category} budget used (₹${spent.toLocaleString('en-IN')} of ₹${budget.amount.toLocaleString('en-IN')})`;
    }

    if (alertLevel) {
      return {
        budgetId: budget.id || '',
        category: budget.category,
        percentage: Math.round(percentage),
        spent,
        total: budget.amount,
        alertLevel,
        message,
      };
    }

    return null;
  }

  /**
   * Calculate spent amount for a budget based on transactions
   */
  private calculateSpentAmount(budget: Budget, transactions: Transaction[]): number {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    return transactions
      .filter(transaction => {
        // Match category
        const expenseCategory = transaction.category?.toLowerCase() || '';
        const budgetCategory = budget.category?.toLowerCase() || '';
        const categoryMatch = expenseCategory === budgetCategory ||
                             expenseCategory.includes(budgetCategory) ||
                             budgetCategory.includes(expenseCategory);
        
        // Check if transaction is in current period and is an expense
        const isCurrentMonth = transaction.date && transaction.date.startsWith(currentMonth);
        const isExpense = transaction.type === 'expense';
        
        return categoryMatch && isCurrentMonth && isExpense;
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  /**
   * Send notification based on alert level
   */
  private async sendBudgetNotification(alert: BudgetAlert): Promise<void> {
    try {
      const emoji = alert.alertLevel === 'exceeded' ? '🚨' : 
                    alert.alertLevel === 'critical' ? '⚠️' : '📊';
      
      const title = `${emoji} Budget Alert: ${alert.category}`;
      
      await NotificationService.sendBudgetAlert(
        alert.category,
        alert.percentage,
        alert.spent,
        alert.total,
        alert.alertLevel
      );
      
      console.log(`✅ Budget notification sent: ${title}`);
    } catch (error) {
      console.error('❌ Failed to send budget notification:', error);
    }
  }

  /**
   * Check if a specific transaction would trigger a budget alert
   */
  async checkTransactionAgainstBudgets(
    transaction: Transaction,
    budgets: Budget[],
    allTransactions: Transaction[]
  ): Promise<BudgetAlert[]> {
    const alerts: BudgetAlert[] = [];

    // Only check for expense transactions
    if (transaction.type !== 'expense') return alerts;

    // Find matching budgets
    const matchingBudgets = budgets.filter(budget => {
      const expenseCategory = transaction.category?.toLowerCase() || '';
      const budgetCategory = budget.category?.toLowerCase() || '';
      
      return budget.isActive &&
             budget.notifications &&
             (expenseCategory === budgetCategory ||
              expenseCategory.includes(budgetCategory) ||
              budgetCategory.includes(expenseCategory));
    });

    // Check each matching budget
    for (const budget of matchingBudgets) {
      const alert = await this.checkSingleBudget(budget, allTransactions);
      if (alert) {
        alerts.push(alert);
        await this.sendBudgetNotification(alert);
      }
    }

    return alerts;
  }

  /**
   * Get budget status summary for all budgets
   */
  async getBudgetStatusSummary(budgets: Budget[], transactions: Transaction[]): Promise<{
    total: number;
    onTrack: number;
    warning: number;
    critical: number;
    exceeded: number;
  }> {
    const summary = {
      total: budgets.filter(b => b.isActive).length,
      onTrack: 0,
      warning: 0,
      critical: 0,
      exceeded: 0,
    };

    for (const budget of budgets) {
      if (!budget.isActive) continue;

      const spent = this.calculateSpentAmount(budget, transactions);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const threshold = budget.alertThreshold || 80;

      if (percentage >= 100) {
        summary.exceeded++;
      } else if (percentage >= threshold + 10) {
        summary.critical++;
      } else if (percentage >= threshold) {
        summary.warning++;
      } else {
        summary.onTrack++;
      }
    }

    return summary;
  }

  /**
   * Clear alert cooldowns (useful for testing or manual refresh)
   */
  clearAlertCooldowns(): void {
    this.alertCooldown.clear();
    console.log('✅ Alert cooldowns cleared');
  }

  /**
   * Schedule daily budget check notification
   */
  async scheduleDailyBudgetCheck(): Promise<string> {
    return NotificationService.scheduleDailyBudgetCheck();
  }
}

const BudgetMonitoringService = new BudgetMonitoringServiceClass();
export default BudgetMonitoringService;
