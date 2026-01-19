'use client';

import { Card, Title, DonutChart, Select, SelectItem, Legend } from '@tremor/react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const params = useSearchParams();

  const filteredData = transactions.filter(t =>
    !t.is_income &&
    Number(t.amount) !== 0
  );

  const categoryMap = filteredData.reduce((acc: { [key: string]: number }, curr) => {
    const catName = curr.category && curr.category.trim() !== "" ? curr.category : 'Other';
    const amount = Math.abs(Number(curr.amount));
    acc[catName] = (acc[catName] || 0) + amount;
    return acc;
  }, {});

  const chartData = Object.keys(categoryMap).map(name => ({
    name,
    amount: parseFloat(categoryMap[name].toFixed(2)),
  })).sort((a, b) => b.amount - a.amount);

  return (
    <Card className="mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Title>Spending Breakdown</Title>

        <Select
          value={selectedMonth}
          onValueChange={(m) => {
            const next = new URLSearchParams(params.toString());
            next.set('month', m);
            router.push(`/?${next.toString()}`);
          }}
          className="max-w-xs"
        >
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
          className="h-72"
        />
        <Legend
          categories={chartData.map(d => d.name)}
          className="max-w-xs"
        />
      </div>
    </Card>
  );
}
