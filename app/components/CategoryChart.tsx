'use client';

import { Card, Title, Select, SelectItem } from '@tremor/react';
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

  // Convert to array and sort by amount
  const chartData = Object.keys(categoryMap).map(name => ({
    name,
    amount: parseFloat(categoryMap[name].toFixed(2)),
  })).sort((a, b) => b.amount - a.amount);

  // Calculate bubble sizes
  const maxAmount = Math.max(...chartData.map(d => d.amount), 1);
  const minSize = 60;
  const maxSize = 150;

  const getBubbleSize = (amount: number) => {
    return minSize + (amount / maxAmount) * (maxSize - minSize);
  };

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

      {/* Bubble Chart Visualization */}
      <div className="bg-slate-50 rounded-lg p-12 min-h-[300px] flex items-center justify-center">
        {chartData.length > 0 ? (
          <div className="flex flex-wrap gap-8 justify-center items-center max-w-5xl">
            {chartData.map((item) => {
              const size = getBubbleSize(item.amount);
              return (
                <div
                  key={item.name}
                  className="relative flex flex-col items-center justify-center"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                  }}
                >
                  <div
                    className="w-full h-full rounded-full bg-black flex items-center justify-center relative group cursor-pointer hover:opacity-80 transition-opacity"
                    title={`${item.name}: £${item.amount.toFixed(2)}`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-3 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      £{item.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="absolute -bottom-8 text-center text-sm font-medium whitespace-nowrap text-slate-700">
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-500 text-center py-12">
            No spending data for selected month
          </div>
        )}
      </div>

      {/* Optional: Summary list below */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {chartData.map((item) => (
          <div key={item.name} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">{item.name}</span>
            <span className="text-sm font-bold text-slate-900">£{item.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}