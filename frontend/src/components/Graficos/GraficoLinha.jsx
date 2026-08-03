import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function GraficoLinha({ data, title, ano, isMobile }) {

    if (!data || Object.keys(data).length === 0) {
        return <div style={{ textAlign: 'center', padding: 40, fontSize: 12, color: '#94a3b8' }}>Sem dados para exibir</div>;
    }

    const chartData = meses.map((mes, index) => ({
        mes,
        quantidade: data[index + 1] || 0,
    }));

    return (
    
    <div style={{ width: '100%', height: isMobile ? 250 : 350 }}>
    
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: '#1e293b' }}>{title}</h4>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Ano: {ano}</span>
        </div>
        
        <ResponsiveContainer>
            
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="quantidade" name="Quantidade" stroke="#1f2e8f" strokeWidth={2} dot={{ fill: '#131a53', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#2d43ce' }} />
            </LineChart>

        </ResponsiveContainer>
        
    </div>
    );
}