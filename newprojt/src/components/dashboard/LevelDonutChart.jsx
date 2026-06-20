import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';

const data = [
  { name: 'Maternelle', value: 120, color: '#6366f1' },
  { name: 'Primaire', value: 350, color: '#3b82f6' },
  { name: 'Collège', value: 280, color: '#8b5cf6' },
  { name: 'Lycée', value: 150, color: '#ec4899' },
];

export default function LevelDonutChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{
              fontSize: 12,
              fontWeight: 500,
              color: 'hsl(var(--muted-foreground))',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
