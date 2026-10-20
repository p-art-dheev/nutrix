import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/** Horizontal bar chart of the grams of each recommended food (used by both problems). */
export const QuantityChart: React.FC<{ foods: { id: number; food: string; quantity: number }[] }> = ({ foods }) => (
  <div className="opt-chart">
    <h3 className="opt-form-title">Quantity per food (g)</h3>
    <ResponsiveContainer width="100%" height={Math.max(160, foods.length * 36)}>
      <BarChart data={foods} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="food" width={160} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString()} g`, 'Quantity']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
        />
        <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
