import React, { useState } from 'react';
import axios from 'axios'; // Adicionando o Axios
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

function Cadastro() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        if (!nome || !email || !senha || !confirmarSenha) {
            setErro('Todos os campos são obrigatórios.');
            return;
        }

        const uppercaseRegex = /[A-Z]/;
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

        if (!uppercaseRegex.test(senha)) {
            setErro('A senha deve conter pelo menos uma letra maiúscula.');
            return;
        }

        if (!specialCharRegex.test(senha)) {
            setErro('A senha deve conter pelo menos um caractere especial.');
            return;
        }

        if (senha !== confirmarSenha) {
            setErro('As senhas não coincidem.');
            return;
        }

        // Substituí a simulação por chamada ao backend com Axios
        try {
            const response = await axios.post('http://localhost:5000/cadastro', {
                nome,
                email,
                senha,
            }, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.status === 201) {
                navigate('/login');
            }
        } catch (error) {
            console.error('Erro no cadastro:', error);
            const errorMsg = error.response?.data?.erro || 'Erro ao cadastrar. Tente novamente!';
            setErro(errorMsg);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 className="text-center mb-4">Cadastro</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="nome" className="form-label">Nome</label>
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
                        <label htmlFor="senha" className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-control"
                            id="senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                        <small className="form-text text-muted">
                            A senha deve conter pelo menos uma letra maiúscula e um caractere especial.
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
            </div>
        </div>
    );
}

export default Cadastro;