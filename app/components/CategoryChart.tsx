'use client';

import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { useRouter } from 'next/navigation';

export default function CategoryChart({
  transactions,
  months,
  selectedMonth,
}: {
  transactions: any[];
  months: string[];
  selectedMonth: string;
}) {
  const router = useRouter();

  // Filter out income and zero amounts
  const filteredData = transactions.filter(t =>
    !t.is_income &&
    Number(t.amount) !== 0
  );

  // Group by category
  const categoryMap = filteredData.reduce((acc: { [key: string]: number }, curr) => {
    const catName = curr.category && curr.category.trim() !== "" ? curr.category : 'Unclear';
    const amount = Math.abs(Number(curr.amount));
    acc[catName] = (acc[catName] || 0) + amount;
    return acc;
  }, {});

  // Convert to array and sort by amount (highest first)
  const chartData = Object.keys(categoryMap).map(name => ({
    name,
    amount: parseFloat(categoryMap[name].toFixed(2)),
  })).sort((a, b) => b.amount - a.amount);

  // Calculate total spending
  const totalSpending = chartData.reduce((sum, cat) => sum + cat.amount, 0);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    router.push(`/?month=${newMonth}`);
  };

  return (
    <Card className="mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Title>Spending Breakdown</Title>

        {/* Month selector */}
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          className="px-4 py-2 border-2 border-blue-500 rounded-lg bg-white text-slate-700 font-medium cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Category Table */}
      {chartData.length > 0 ? (
        <Table className="mt-5">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell className="text-right">Amount</TableHeaderCell>
              <TableHeaderCell className="text-right">% of Total</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chartData.map((item) => {
              const percentage = (item.amount / totalSpending) * 100;
              return (
                <TableRow key={item.name}>
                  <TableCell className="font-medium text-slate-700">{item.name}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    £{item.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Total row */}
            <TableRow className="border-t-2 border-slate-300 font-bold">
              <TableCell className="text-slate-900">Total</TableCell>
              <TableCell className="text-right text-slate-900">
                £{totalSpending.toFixed(2)}
              </TableCell>
              <TableCell className="text-right text-slate-900">
                100%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="text-slate-500 text-center py-12">
          No spending data for selected month
        </div>
      )}
    </Card>
  );
}
