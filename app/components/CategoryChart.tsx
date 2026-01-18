'use client';

import { useState } from 'react';
import { Card, Title, DonutChart, Select, SelectItem, Legend } from '@tremor/react';

export default function CategoryChart({ transactions }: { transactions: any[] }) {
  const months = Array.from(new Set(transactions.map(t => t.date.substring(0, 7)))).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(months[0] || '');

  // 1. Filter: Remove income and only show the selected month
  const filteredData = transactions.filter(t => 
    t.date.startsWith(selectedMonth) && 
    !t.is_income && 
    Number(t.amount) !== 0
  );

  // 2. Grouping Logic: Ensure every transaction has a category name
  const categoryMap = filteredData.reduce((acc: { [key: string]: number }, curr) => {
    // If category is null or empty, label it 'Other'
    const catName = curr.category && curr.category.trim() !== "" ? curr.category : 'Other';
    const amount = Math.abs(Number(curr.amount));
    
    acc[catName] = (acc[catName] || 0) + amount;
    return acc;
  }, {});

  // 3. Transform into the array format Tremor needs
  const chartData = Object.keys(categoryMap).map(name => ({
    name: name,
    amount: parseFloat(categoryMap[name].toFixed(2)),
  })).sort((a, b) => b.amount - a.amount); // Sort largest spending first

  return (
    <Card className="mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Title>Spending Breakdown</Title>
        <Select value={selectedMonth} onValueChange={setSelectedMonth} className="max-w-xs">
          {months.map(m => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </Select>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-around gap-8 mt-6">
        <DonutChart
          data={chartData}
          category="amount"
          index="name"
          valueFormatter={(number) => `£${Intl.NumberFormat('en').format(number)}`}
          colors={["indigo", "violet", "fuchsia", "emerald", "amber", "rose", "cyan", "orange"]}
          className="h-72"
        />
        {/* Adding a Legend helps identify slices if they are small */}
        <Legend
          categories={chartData.map(d => d.name)}
          colors={["indigo", "violet", "fuchsia", "emerald", "amber", "rose", "cyan", "orange"]}
          className="max-w-xs"
        />
      </div>
    </Card>
  );
}