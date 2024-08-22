import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function MonthlyTrend({ monthly }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={monthly}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2456d6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2456d6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#2456d6"
            fill="url(#trend-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
