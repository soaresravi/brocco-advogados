import { PieChart, Pie, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { useState, useEffect } from 'react';

const COLORS = ['#131a53', '#1f2e8f', '#2d43ce', '#556bff', '#819aff', '#a8b9ff', '#d0d9ff', '#1a3a5c', '#2036c8', '#4a6fff'];

const renderActiveShape = (props) => {
    
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={4} />
    );

};

function GraficoRosca({ data, title, isMobile }) {

    const [key, setKey] = useState(0);

    useEffect(() => {

        const timeout = setTimeout(() => {
            setKey(prev => prev + 1);
        }, 200);

        return () => clearTimeout(timeout);

    }, []);

    if (!data || Object.keys(data).length === 0) {
        return <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: '#94a3b8' }}> Sem dados para exibir </div>;
    }

    const chartData = Object.entries(data).map(([label, value], index) => ({
        label: label,
        value: typeof value === 'object' ? value.quantidade : value,
        percentual: typeof value === 'object' ? value.percentual : 0,
        fill: COLORS[index % COLORS.length],
    }));

    const legendItems = chartData.map((item) => ({
        label: item.label,
        color: item.fill,
    }));

    return (
    
    <div style={{ width: isMobile ? 319 : '100%', height: isMobile ? 200 : 270 }}>
    
        <h4 style={{ textAlign: 'center', marginBottom: 8, fontSize: isMobile ? 12 : 14, color: '#1e293b' }}>{title}</h4>
        
        <div style={{ height: isMobile ? 150 : 220 }}>
            
            <ResponsiveContainer key={key}>
                
                <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={isMobile ? 15 : 40} outerRadius={isMobile ? 45 : 80} paddingAngle={3} dataKey="value" nameKey="label" label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`} labelLine={false} shape={renderActiveShape} />
                    <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentual}%)`, name]} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
            
            </ResponsiveContainer>
        
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 8 : 16, flexWrap: 'wrap', marginTop: isMobile ? 8 : 0 }}>
            
            {legendItems.map((item) => (
            
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, backgroundColor: item.color, borderRadius: 2 }} />
                    <span style={{ fontSize: isMobile ? 9 : 11, color: '#475569' }}>{item.label}</span>
                </div>

            ))}

        </div>
        
    </div>
    );
}

export default GraficoRosca;