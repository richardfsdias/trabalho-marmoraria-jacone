import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../components/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

function Cadastro() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [cpf, setCpf] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const formatCpf = (value) => {
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.slice(0, 11);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        if (!nome || !email || !senha || !confirmarSenha || !cpf) {
            setErro('Todos os campos são obrigatórios.');
            return;
        }

        const uppercaseRegex = /[A-Z]/;
        const lowercaseRegex = /[a-z]/;
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_+\-]/;
        const numberRegex = /[0-9]/;

        // >>> CORREÇÃO 3: Alterado o comprimento mínimo da senha de 6 para 8. <<<
        // E ajustada a mensagem de erro para refletir a nova regra.
        if (
            senha.length < 8 ||
            !uppercaseRegex.test(senha) ||
            !lowercaseRegex.test(senha) ||
            !specialCharRegex.test(senha) ||
            !numberRegex.test(senha)
        ) {
            setErro('A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial (ex: !@#$_-).');
            return;
        }

        if (senha !== confirmarSenha) {
            setErro('As senhas não coincidem.');
            return;
        }

        const cpfLimpo = cpf.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) {
            setErro('O CPF deve conter exatamente 11 dígitos.');
            return;
        }

        try {
            const userData = { nome, email, senha, cpf: cpfLimpo };
            await ApiClient.auth.cadastro(userData);
            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            navigate('/login');
        } catch (err) {
            console.error('Erro no cadastro:', err);
            setErro(err.response?.data?.erro || 'Erro ao realizar cadastro. Tente novamente mais tarde.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 className="text-center mb-4">Cadastro de Funcionário</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="nome" className="form-label">Nome Completo</label>
                        <input
                            type="text"
                            className="form-control"
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="cpf" className="form-label">CPF</label>
                        <input
                            type="text"
                            className="form-control"
                            id="cpf"
                            value={cpf}
                            onChange={(e) => setCpf(formatCpf(e.target.value))} // Usando a função para formatar
                            placeholder="000.000.000-00"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="senha" className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-control"
                            id="senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                         {/* Mensagem de ajuda atualizada */}
                        <small className="form-text text-muted">
                            Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial.
                        </small>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="confirmarSenha" className="form-label">Confirmar Senha</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirmarSenha"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Cadastrar</button>
                    {erro && (
                        <div className="alert alert-danger mt-3" role="alert">
                            {erro}
                        </div>
                    )}
                </form>
                <div className="text-center mt-3">
                    <button className="btn btn-link" onClick={() => navigate('/login')}>
                        Já tem uma conta? Faça login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Cadastro;