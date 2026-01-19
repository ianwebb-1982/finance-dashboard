import { createClient } from '@supabase/supabase-js';
import { Card, Title, Table, TableRow, TableCell, TableHead, TableHeaderCell, TableBody, Badge } from '@tremor/react';
import CategoryChart from './components/CategoryChart';
import { Suspense } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default async function Dashboard({
  searchParams,
}: {
  searchParams?: { month?: string };
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

  const selectedMonth = searchParams?.month || '';

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) console.error("Supabase Error:", error);

  const allTx = transactions || [];

  const months = Array.from(new Set(allTx.map(t => String(t.date).substring(0, 7))))
    .sort()
    .reverse();

  const activeMonth = selectedMonth || months[0] || '';

  const monthTx = activeMonth
    ? allTx.filter(t => String(t.date).startsWith(activeMonth))
    : allTx;

  const totalSpent = monthTx
    .filter(t => !t.is_income)
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount)), 0);

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Title className="text-2xl font-bold mb-8 text-slate-800">Finance Dashboard</Title>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card decoration="top" decorationColor="indigo">
            <p className="text-slate-500 text-sm font-medium">Total Transactions</p>
            <p className="text-3xl font-bold text-slate-700">{monthTx.length}</p>
          </Card>
          <Card decoration="top" decorationColor="red">
            <p className="text-slate-500 text-sm font-medium">Total Spending</p>
            <p className="text-3xl font-bold text-slate-700">
              £{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Pass months + activeMonth so chart can drive the URL */}
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

        <Card className="mt-8">
          <Title>Recent Activity</Title>
          <Table className="mt-5">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthTx.map((item) => (
                <TableRow key={item.truelayer_id || item.id}>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-slate-700">{item.description}</TableCell>
                  <TableCell>
                    <Badge color={item.is_income ? "emerald" : "indigo"}>
                      {item.category || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-bold ${item.is_income ? "text-emerald-600" : "text-slate-700"}`}>
                    {item.is_income ? "+" : "-"}£{Math.abs(Number(item.amount)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </main>
  );
}
