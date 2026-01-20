import { createClient } from '@supabase/supabase-js';
import { Card, Title } from '@tremor/react';
import CategoryChart from './components/CategoryChart';
import TransactionsTable from './components/TransactionsTable';
import { Suspense } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  if (!supabase) {
    return (
      <main className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <Title>Database Connection Pending</Title>
          <p className="text-slate-500 mt-2">Please ensure your Supabase Environment Variables are set in Vercel.</p>
        </Card>
      </main>
    );
  }

  // Await searchParams in Next.js 15+
  const params = await searchParams;
  const selectedMonth = params?.month || '';

  // Fetch all transactions
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error("Supabase Error:", error);
    return (
      <main className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <Title>Error Loading Data</Title>
          <p className="text-slate-500 mt-2">{error.message}</p>
        </Card>
      </main>
    );
  }

  const allTx = transactions || [];

  // Extract unique months from transactions
  const months = Array.from(new Set(allTx.map(t => String(t.date).substring(0, 7))))
    .sort()
    .reverse();

  // Determine active month
  const activeMonth = selectedMonth || months[0] || '';

  // Filter transactions by selected month
  const monthTx = activeMonth
    ? allTx.filter(t => String(t.date).startsWith(activeMonth))
    : allTx;

  // Calculate income and expenses
  const totalIncome = monthTx
    .filter(t => t.is_income)
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

  const totalExpenses = monthTx
    .filter(t => !t.is_income)
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Title className="text-2xl font-bold mb-8 text-slate-800">Finance Dashboard</Title>

        {/* Summary Cards - Now with 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card decoration="top" decorationColor="emerald">
            <p className="text-slate-500 text-sm font-medium">Total Income</p>
            <p className="text-3xl font-bold text-emerald-600">
              £{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>
          
          <Card decoration="top" decorationColor="red">
            <p className="text-slate-500 text-sm font-medium">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600">
              £{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card decoration="top" decorationColor={netBalance >= 0 ? "emerald" : "red"}>
            <p className="text-slate-500 text-sm font-medium">Net Balance</p>
            <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netBalance >= 0 ? '+' : ''}£{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </Card>

          <Card decoration="top" decorationColor="indigo">
            <p className="text-slate-500 text-sm font-medium">Savings Rate</p>
            <p className="text-3xl font-bold text-slate-700">
              {savingsRate.toFixed(1)}%
            </p>
          </Card>
        </div>

        {/* Income vs Expenses Comparison Chart */}
        <Card className="mb-8">
          <Title>Income vs Expenses</Title>
          <div className="mt-6">
            {/* Visual bar comparison */}
            <div className="space-y-4">
              {/* Income Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Income</span>
                  <span className="text-sm font-bold text-emerald-600">
                    £{totalIncome.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-8 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full flex items-center justify-end pr-3 text-white text-sm font-medium transition-all duration-500"
                    style={{ width: `${totalIncome > 0 ? 100 : 0}%` }}
                  >
                    {totalIncome > 0 && '100%'}
                  </div>
                </div>
              </div>

              {/* Expenses Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Expenses</span>
                  <span className="text-sm font-bold text-red-600">
                    £{totalExpenses.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-8 overflow-hidden">
                  <div 
                    className="bg-red-500 h-full flex items-center justify-end pr-3 text-white text-sm font-medium transition-all duration-500"
                    style={{ width: `${totalIncome > 0 ? (totalExpenses / totalIncome * 100) : 0}%` }}
                  >
                    {totalIncome > 0 && `${((totalExpenses / totalIncome) * 100).toFixed(0)}%`}
                  </div>
                </div>
              </div>

              {/* Net Balance Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Net Balance</span>
                  <span className={`text-sm font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {netBalance >= 0 ? '+' : ''}£{netBalance.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-8 overflow-hidden">
                  <div 
                    className={`${netBalance >= 0 ? 'bg-emerald-500' : 'bg-red-500'} h-full flex items-center justify-end pr-3 text-white text-sm font-medium transition-all duration-500`}
                    style={{ width: `${totalIncome > 0 ? Math.abs(netBalance / totalIncome * 100) : 0}%` }}
                  >
                    {totalIncome > 0 && netBalance !== 0 && `${Math.abs((netBalance / totalIncome) * 100).toFixed(0)}%`}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary text */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                {netBalance >= 0 ? (
                  <>You saved <span className="font-bold text-emerald-600">£{netBalance.toFixed(2)}</span> this month ({savingsRate.toFixed(1)}% of your income).</>
                ) : (
                  <>You spent <span className="font-bold text-red-600">£{Math.abs(netBalance).toFixed(2)}</span> more than you earned this month.</>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Category Chart with Month Selector */}
        <Suspense
          fallback={
            <Card className="mt-8">
              <Title>Spending Breakdown</Title>
              <p className="text-slate-500 mt-2">Loading…</p>
            </Card>
          }
        >
          <CategoryChart
            transactions={monthTx}
            months={months}
            selectedMonth={activeMonth}
          />
        </Suspense>

        {/* Recent Activity Table with Search & Edit */}
        <TransactionsTable transactions={monthTx} />
      </div>
    </main>
  );
}