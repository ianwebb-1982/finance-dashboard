import { createClient } from '@supabase/supabase-js';
import { Card, Title, Table, TableRow, TableCell, TableHead, TableHeaderCell, TableBody, Badge } from '@tremor/react';

// Initialize Supabase
// 1. Fetch the keys safely without the "!"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 2. Initialize only if keys exist. This prevents the "required" crash during build.
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export default function Home() {
  // 3. Add this check so the page doesn't try to run queries if supabase is null
  if (!supabase) {
    return <div className="p-8">Connecting to database...</div>;
  }

  // ... rest of your existing return () code ...
}
export default async function Dashboard() {
  // Fetch transactions from your Supabase table
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  // Calculation for total spent
  const totalSpent = transactions?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Title className="text-2xl font-bold mb-8 text-slate-800">Finance Dashboard</Title>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card decoration="top" decorationColor="indigo">
            <p className="text-slate-500 text-sm font-medium">Total Transactions</p>
            <p className="text-3xl font-bold text-slate-700">{transactions?.length || 0}</p>
          </Card>
          <Card decoration="top" decorationColor="red">
            <p className="text-slate-500 text-sm font-medium">Total Spending (Mock)</p>
            <p className="text-3xl font-bold text-slate-700">£{totalSpent.toLocaleString()}</p>
          </Card>
        </div>

        <Card>
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
              {transactions?.map((item) => (
                <TableRow key={item.truelayer_id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell className="font-medium text-slate-700">{item.description}</TableCell>
                  <TableCell>
                    <Badge color={item.is_income ? "emerald" : "indigo"}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-bold ${item.is_income ? "text-emerald-600" : "text-slate-700"}`}>
                    {item.is_income ? "+" : "-"}£{item.amount}
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