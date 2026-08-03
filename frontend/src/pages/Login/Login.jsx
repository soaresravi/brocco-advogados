import { useState } from 'react';
import { Form, Input, Button, Card, Row, Col, notification } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

import api from '../../api/api';
import './Login.css';

function Login({ onLogin }) {

    const [loading, setLoading] = useState(false);

    const showNotification = (type, message) => {

        notification[type]({
            title: null,
            description: message,
            placement: 'bottomRight',
            duration: 10,
            showProgress: true,
            pauseOnHover: false,
            closable: true,
        });

    };

    const handleLogin = async (values) => {

        setLoading(true);

        try {

            const response = await api.post('/auth/login', {
                email: values.email,
                senha: values.password,
            });

            localStorage.setItem('token', response.data.token);

            localStorage.setItem('user', JSON.stringify({
                id: response.data.id,
                nome: response.data.nome,
                email: response.data.email,
                permissao: response.data.permissao,
                nomeEscritorio: response.data.nomeEscritorio,
            }));

            showNotification('success', 'Login realizado! Bem-vindo(a) de volta!');
            onLogin(true);

        } catch (error) {
            const msg = error.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.';
            showNotification('error', msg);
        } finally {
            setLoading(false);
        }

    };

    return (
    
    <div className="login-container">  
        <div className="login-overlay">
        
            <Row justify="center" align="middle" style={{ minHeight: '100vh', width: '100%' }}>
        
                <Col xs={22} sm={18} md={14} lg={10} xl={8} xxl={6}>
        
                    <Card className="login-card" variant={false}>
                        
                        <div className="login-avatar">
                            
                            <div className="avatar-circle">
                                <UserOutlined style={{ fontSize: 48, color: '#fff' }} />
                            </div>
                        
                        </div>

                        <Form onFinish={handleLogin} layout="vertical" className="login-form">
                            
                            <Form.Item name="email" rules={[ { required: true, message: 'E-mail é obrigatório' }, { type: 'email', message: 'E-mail inválido' } ]}>
                                <Input prefix={<MailOutlined className="input-icon" />} placeholder="E-mail" size="large" className="login-input" />
                            </Form.Item>

                            <Form.Item name="password" rules={[{ required: true, message: 'Senha é obrigatória' }]}>
                                <Input.Password prefix={<LockOutlined className="input-icon" />} placeholder="Senha" size="large" className="login-input" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading} block size="large" className="login-button"> Entrar </Button>
                            </Form.Item>

                        </Form>
                        
                    </Card>
                </Col>
            </Row>
        </div>
    </div>
    );
}

export default Login;