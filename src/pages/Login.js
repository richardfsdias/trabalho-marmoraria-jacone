import React, { useState } from 'react';
import axios from 'axios'; // Adicionando o Axios
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import './Login.css'; // Seu estilo, se tiver

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', {
        email,
        senha,
      }, {
        headers: { 'Content-Type': 'application/json' }, // Mantendo o header
      });
      if (response.status === 200) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Email ou senha inválidos!');
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
          <label for="email" className='form-label'>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
        />
      </div>
      <div className='mb-3'>
        <label for="senha" className='form-label'>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          required
        />
      </div>
        <button type="submit">Entrar</button>

      <button onClick={handleCadastro}>Criar Conta</button>
      </form>
    </div>
  );
}

export default Login;