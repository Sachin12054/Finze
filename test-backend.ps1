# PowerShell script to test AI Insights backend
Write-Host "🧪 Testing AI Insights Backend..." -ForegroundColor Green

# Test health endpoint
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8001/api/health" -Method Get
    Write-Host "   ✅ Status: Healthy" -ForegroundColor Green
    Write-Host "   Services:" -ForegroundColor Cyan
    $health.services.PSObject.Properties | ForEach-Object {
        Write-Host "     - $($_.Name): $($_.Value.status)" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test with common user IDs that might have data
$testUserIds = @("test_user", "user1", "admin", "demo_user", "default_user")

foreach ($userId in $testUserIds) {
    Write-Host "`n2. Testing User ID: $userId" -ForegroundColor Yellow
    
    # Test expenses endpoint
    try {
        $expenses = Invoke-RestMethod -Uri "http://localhost:8001/api/expenses/$userId" -Method Get
        if ($expenses -and $expenses.Length -gt 0) {
            Write-Host "   ✅ Found $($expenses.Length) expenses!" -ForegroundColor Green
            Write-Host "   Sample expense: $($expenses[0].description) - ₹$($expenses[0].amount)" -ForegroundColor Cyan
            
            # Test AI insights for this user
            $insights = Invoke-RestMethod -Uri "http://localhost:8001/api/ai-insights/$userId?period=month" -Method Get
            if ($insights.data.financial_health.total_spending -gt 0) {
                Write-Host "   🎉 REAL DATA FOUND!" -ForegroundColor Green
                Write-Host "   Total Spending: ₹$($insights.data.financial_health.total_spending)" -ForegroundColor Cyan
                Write-Host "   Transactions: $($insights.data.financial_health.transaction_count)" -ForegroundColor Cyan
                Write-Host "   Categories: $($insights.data.category_analysis.PSObject.Properties.Count)" -ForegroundColor Cyan
                break
            }
        } else {
            Write-Host "   ⚪ No expenses found for $userId" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ❌ Error testing $userId : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ Testing completed!" -ForegroundColor Green