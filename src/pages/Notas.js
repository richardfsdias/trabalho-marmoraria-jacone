// src/pages/Notas.js
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

// Dados fictícios (substituir pelo backend quando disponível)
const materiais = [
  { id: 1, nome: 'Verde Ubatuba', metros: 400, preco: 250 },
  { id: 2, nome: 'Preto São Gabriel', metros: 600, preco: 280 },
  { id: 3, nome: 'Branco Prime', metros: 1200, preco: 350 },
  { id: 4, nome: 'Amarelo Icaraí', metros: 550, preco: 300 },
  { id: 5, nome: 'Cinza Corumbar', metros: 380, preco: 220 },
  { id: 6, nome: 'Cinza Ocre', metros: 400, preco: 240 },
  { id: 7, nome: 'Preto Via Láctea', metros: 770, preco: 400 },
  { id: 8, nome: 'Branco Itaúnas', metros: 900, preco: 370 },
  { id: 9, nome: 'Ornamental', metros: 600, preco: 310 },
  { id: 10, nome: 'Bege Bahia', metros: 700, preco: 330 },
];

const clientes = [
  { id: 1, nome: 'João Silva' },
  { id: 2, nome: 'Maria Oliveira' },
];

function Notas() {
  const [material, setMaterial] = useState('');
  const [metrosDisponiveis, setMetrosDisponiveis] = useState(0);
  const [quantidade, setQuantidade] = useState('');
  const [preco, setPreco] = useState('');
  const [cliente, setCliente] = useState('');
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(null);
  const [notas, setNotas] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState('');

  const [sugestoesClientes, setSugestoesClientes] = useState([]);
  const [sugestoesMateriais, setSugestoesMateriais] = useState([]);

  const handleClienteInput = (e) => {
    const valor = e.target.value;
    setCliente(valor);
    if (valor) {
      const sugestoes = clientes
        .filter((c) => c.nome.toLowerCase().includes(valor.toLowerCase()))
        .map((c) => c.nome);
      setSugestoesClientes(sugestoes);
    } else {
      setSugestoesClientes([]);
    }
  };

  const handleSelecionarCliente = (nome) => {
    setCliente(nome);
    setSugestoesClientes([]);
  };

  const handleMaterialInput = (e) => {
    const valor = e.target.value;
    setMaterial(valor);
    const mat = materiais.find((m) => m.nome === valor);
    setMetrosDisponiveis(mat ? mat.metros : 0);
    setPreco(mat ? mat.preco : '');
    if (valor) {
      const sugestoes = materiais
        .filter((m) => m.nome.toLowerCase().includes(valor.toLowerCase()))
        .map((m) => m.nome);
      setSugestoesMateriais(sugestoes);
    } else {
      setSugestoesMateriais([]);
    }
  };

  const handleSelecionarMaterial = (nome) => {
    setMaterial(nome);
    const mat = materiais.find((m) => m.nome === nome);
    setMetrosDisponiveis(mat ? mat.metros : 0);
    setPreco(mat ? mat.preco : '');
    setSugestoesMateriais([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qtd = parseFloat(quantidade);
    const precoFloat = parseFloat(preco);

    if (!cliente || isNaN(qtd) || isNaN(precoFloat)) {
      setErro('Preencha todos os campos corretamente.');
      return;
    }

    if (qtd > metrosDisponiveis) {
      setErro('Quantidade solicitada excede o estoque disponível.');
      return;
    }

    const total = qtd * precoFloat;

    if (editando) {
      setNotas(
        notas.map((n) =>
          n.id === editando.id
            ? { ...n, cliente, material, quantidade: qtd, preco: precoFloat, total }
            : n
        )
      );
      setEditando(null);
    } else {
      const novaNota = {
        id: notas.length + 1,
        cliente,
        material,
        quantidade: qtd,
        preco: precoFloat,
        total,
      };
      setNotas([...notas, novaNota]);
    }

    setErro('');
    setQuantidade('');
    setMaterial('');
    setPreco('');
    setMetrosDisponiveis(0);
    setCliente('');
    setSugestoesClientes([]);
    setSugestoesMateriais([]);
  };

  const handleEditar = (nota) => {
    setEditando(nota);
    setCliente(nota.cliente);
    setMaterial(nota.material);
    setQuantidade(nota.quantidade);
    setPreco(nota.preco);
    const mat = materiais.find((m) => m.nome === nota.material);
    setMetrosDisponiveis(mat ? mat.metros : 0);
    setSugestoesClientes([]);
    setSugestoesMateriais([]);
  };

  const handleExcluir = (id) => {
    setNotas(notas.filter((nota) => nota.id !== id));
  };

  const notasFiltradas = notas.filter((n) =>
    n.cliente.toLowerCase().includes(filtroCliente.toLowerCase())
  );

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Gerenciar Notas</h1>
      <div className="row">
        <div className="col-12 col-md-6 mb-3">
          <form onSubmit={handleSubmit} className="card p-4 shadow-lg">
            <div className="mb-3 position-relative">
              <label className="form-label">Cliente</label>
              <input
                type="text"
                className="form-control"
                value={cliente}
                onChange={handleClienteInput}
                placeholder="Digite o nome do cliente"
                required
              />
              {sugestoesClientes.length > 0 && (
                <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
                  {sugestoesClientes.map((sugestao, index) => (
                    <li
                      key={index}
                      className="list-group-item"
                      onClick={() => handleSelecionarCliente(sugestao)}
                      style={{ cursor: 'pointer' }}
                    >
                      {sugestao}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-3 position-relative">
              <label className="form-label">Material</label>
              <input
                type="text"
                className="form-control"
                value={material}
                onChange={handleMaterialInput}
                placeholder="Digite o nome do material"
                required
              />
              {sugestoesMateriais.length > 0 && (
                <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
                  {sugestoesMateriais.map((sugestao, index) => (
                    <li
                      key={index}
                      className="list-group-item"
                      onClick={() => handleSelecionarMaterial(sugestao)}
                      style={{ cursor: 'pointer' }}
                    >
                      {sugestao}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Quantidade (m²)</label>
              <input
                type="number"
                className="form-control"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Preço por m² (R$)</label>
              <input
                type="number"
                className="form-control"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              {editando ? 'Salvar Alterações' : 'Criar Nota'}
            </button>
            {editando && (
              <button
                type="button"
                className="btn btn-secondary mt-2 w-100"
                onClick={() => {
                  setEditando(null);
                  setQuantidade('');
                  setMaterial('');
                  setPreco('');
                  setMetrosDisponiveis(0);
                  setCliente('');
                  setSugestoesClientes([]);
                  setSugestoesMateriais([]);
                }}
              >
                Cancelar Edição
              </button>
            )}
            {erro && (
              <div className="alert alert-warning mt-3" role="alert">
                {erro}
              </div>
            )}
          </form>
        </div>
        <div className="col-12 col-md-6 mb-3">
          <div className="card p-4 shadow-lg bg-light">
            <h4>Lista de Notas</h4>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por cliente"
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
              />
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Material</th>
                    <th>Quantidade (m²)</th>
                    <th>Preço (R$/m²)</th>
                    <th>Total</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {notasFiltradas.map((nota) => (
                    <tr key={nota.id}>
                      <td>{nota.cliente}</td>
                      <td>{nota.material}</td>
                      <td>{nota.quantidade}</td>
                      <td>R$ {nota.preco.toFixed(2)}</td>
                      <td>R$ {nota.total.toFixed(2)}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEditar(nota)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleExcluir(nota.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <strong>Total Acumulado:</strong> R${' '}
              {notasFiltradas.reduce((sum, nota) => sum + nota.total, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notas;