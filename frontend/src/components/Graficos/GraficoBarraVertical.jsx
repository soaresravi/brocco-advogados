import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Rectangle } from 'recharts';
import { useState, useEffect } from 'react';

const COLORS = ['#131a53', '#1f2e8f', '#2d43ce', '#556bff', '#819aff', '#a8b9ff', '#d0d9ff', '#1a3a5c', '#2036c8', '#4a6fff'];

const CustomBar = (props) => {

    const {x, y, width, height, index } = props;
    const barWidth = 30;
    const adjustedX = x + (width - barWidth) / 2;

    return (
        <Rectangle x={adjustedX} y={y} width={barWidth} height={height} fill={COLORS[index % COLORS.length]} radius={[8, 8, 0, 0]} />
    );

};

function GraficoBarraVertical({ data, title, isMobile }) {

    const [key, setKey] = useState(0);

    useEffect(() => {

        const timeout = setTimeout(() => {
            setKey(prev => prev + 1);
        }, 200);

        return () => clearTimeout(timeout);

    }, []);

    if (!data || Object.keys(data).length === 0) {
        return <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: '#94a3b8' }}>Sem dados para exibir</div>;
    }

    const chartData = Object.entries(data).map(([label, value], index) => ({
        label: label,
        value: typeof value === 'object' ? value.quantidade : value,
        color: COLORS[index % COLORS.length],
    }));

    const legendItems = chartData.map((item) => ({
        label: item.label,
        color: item.color,
    }));

    return (
    
    <div style={{ width: '100%', height: isMobile ? 280 : 300 }}>
        
        <h4 style={{ textAlign: 'center', marginBottom: 8, fontSize: isMobile ? 12 : 14, color: '#1e293b' }}>{title}</h4>
            
        <div style={{ height: isMobile ? 200 : 300 }}>

            <ResponsiveContainer key={key}>
                
                <BarChart data={chartData} margin={{ top: 20, right: isMobile ? 10 : 30, left: isMobile ? 10 : 20, bottom: isMobile ? 40 : 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" angle={-45} textAnchor="end" height={isMobile ? 40 : 60} tick={{ fontSize: isMobile ? 8 : 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: isMobile ? 9 : 11, fill: '#64748b' }} />
                    <Tooltip formatter={(value) => [`${value}`, 'Quantidade']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" shape={<CustomBar />} />
                </BarChart>

            </ResponsiveContainer>
        
        </div>
            
        <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 8 : 16, flexWrap: 'wrap', marginTop: isMobile ? -40 : -60 }}>

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

export default GraficoBarraVertical;