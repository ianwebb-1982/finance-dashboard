'use client';

import { useState } from 'react';
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, TextInput } from '@tremor/react';
import { Search } from 'lucide-react';

// Available categories
const CATEGORIES = [
  'Groceries',
  'Transport', 
  'Bills',
  'Entertainment',
  'Shopping',
  'Dining',
  'Income',
  'Unclear',
  'Uncategorized'
];

export default function TransactionsTable({
  transactions,
}: {
  transactions: any[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localTransactions, setLocalTransactions] = useState(transactions);

  // Filter transactions based on search
  const filteredTransactions = localTransactions.filter(t => {
    const searchLower = searchQuery.toLowerCase();
    return (
      t.description?.toLowerCase().includes(searchLower) ||
      t.merchant_name?.toLowerCase().includes(searchLower) ||
      t.category?.toLowerCase().includes(searchLower)
    );
  });

  // Handle category change
  const handleCategoryChange = async (transactionId: string, newCategory: string) => {
    try {
      // Update locally first for immediate UI feedback
      setLocalTransactions(prev => 
        prev.map(t => 
          (t.truelayer_id || t.id) === transactionId 
            ? { ...t, category: newCategory }
            : t
        )
      );

      // Call API to update in Supabase
      const response = await fetch('/api/update-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactionId, 
          category: newCategory 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      setEditingId(null);
    } catch (error) {
      console.error('Error updating category:', error);
      // Revert on error
      setLocalTransactions(transactions);
      alert('Failed to update category. Please try again.');
    }
  };

  return (
    <Card className="mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Title>Recent Activity</Title>
        
        {/* Search box */}
        <TextInput
          icon={Search}
          placeholder="Search transactions..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="max-w-sm"
        />
      </div>

      {filteredTransactions.length > 0 ? (
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
            {filteredTransactions.slice(0, 50).map((item) => {
              const txId = item.truelayer_id || item.id;
              const isEditing = editingId === txId;

              return (
                <TableRow key={txId}>
                  <TableCell>{new Date(item.date).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {item.description}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <select
                        value={item.category || 'Uncategorized'}
                        onChange={(e) => handleCategoryChange(txId, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                        className="px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge 
                        color={item.is_income ? "emerald" : "indigo"}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => setEditingId(txId)}
                      >
                        {item.category || "Uncategorized"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={`font-bold ${item.is_income ? "text-emerald-600" : "text-slate-700"}`}>
                    {item.is_income ? "+" : "-"}£{Math.abs(Number(item.amount)).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-slate-500 text-center py-12">
          {searchQuery ? 'No transactions match your search' : 'No transactions for selected month'}
        </div>
      )}

      {searchQuery && (
        <p className="text-sm text-slate-500 mt-4">
          Showing {filteredTransactions.length} of {localTransactions.length} transactions
        </p>
      )}
    </Card>
  );
}