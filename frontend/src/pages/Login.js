// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../components/api';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(''); // Estado para armazenar a mensagem de erro
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(''); // Limpa qualquer erro anterior

    try {
      const response = await ApiClient.auth.login({ email, senha });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      navigate('/orcamentos');
    } catch (err) {
      console.error('Erro de login:', err);
      // Define a mensagem de erro a partir da resposta do backend
      setErro(err.response?.data?.erro || 'Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  const handleCadastro = () => {
    navigate('/cadastro');
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        <div className='mb-3'>
          <label htmlFor="email" className='form-label'>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div className='mb-3'>
          <label htmlFor="senha" className='form-label'>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            required
          />
        </div>
        {erro && <p className="error-message">{erro}</p>} {/* Exibe a mensagem de erro aqui */}
        <button type="submit">Entrar</button>
        <button onClick={handleCadastro}>Criar Conta</button>
      </form>
    </div>
  );
}

export default Login;