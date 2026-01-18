'use client'; // This allows the dropdown to be interactive

import { useState } from 'react';
import { Card, Title, DonutChart, Select, SelectItem } from '@tremor/react';

export default function CategoryChart({ transactions }: { transactions: any[] }) {
  // 1. Get unique months from your data for the dropdown
  const months = Array.from(new Set(transactions.map(t => t.date.substring(0, 7)))).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(months[0] || '');

  // 2. Filter data based on selection
  const filteredData = transactions.filter(t => t.date.startsWith(selectedMonth) && !t.is_income);

  // 3. Group by category
  const categoryTotals = filteredData.reduce((acc: any, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const chartData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    amount: Math.abs(categoryTotals[cat]),
  }));

  return (
    <Card className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <Title>Spending by Category</Title>
        <Select value={selectedMonth} onValueChange={setSelectedMonth} className="max-w-xs">
          {months.map(m => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </Select>
      </div>
      <DonutChart
        data={chartData}
        category="amount"
        index="name"
        valueFormatter={(number) => `£${Intl.NumberFormat('en').format(number)}`}
        colors={["indigo", "violet", "fuchsia", "emerald", "amber", "rose"]}
        className="h-80 mt-6"
      />
    </Card>
  );
}