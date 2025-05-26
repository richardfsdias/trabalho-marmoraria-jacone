// src/pages/Movimentacoes.js
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

// Dados fictícios (substituir pelo backend quando disponível)
const marmores = [
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

function Movimentacoes() {
  const [marmore, setMarmore] = useState('');
  const [metrosDisponiveis, setMetrosDisponiveis] = useState(0);
  const [quantidade, setQuantidade] = useState('');
  const [tipo, setTipo] = useState('Entrada');
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [erro, setErro] = useState('');

  // Estado para sugestões de mármores
  const [sugestoesMarmores, setSugestoesMarmores] = useState([]);

  // Filtra sugestões de mármores
  const handleMarmoreInput = (e) => {
    const valor = e.target.value;
    setMarmore(valor);
    const mat = marmores.find((m) => m.nome === valor);
    setMetrosDisponiveis(mat ? mat.metros : 0);
    if (valor) {
      const sugestoes = marmores
        .filter((m) => m.nome.toLowerCase().includes(valor.toLowerCase()))
        .map((m) => m.nome);
      setSugestoesMarmores(sugestoes);
    } else {
      setSugestoesMarmores([]);
    }
  };

  // Seleciona mármore da sugestão
  const handleSelecionarMarmore = (nome) => {
    setMarmore(nome);
    const mat = marmores.find((m) => m.nome === nome);
    setMetrosDisponiveis(mat ? mat.metros : 0);
    setSugestoesMarmores([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qtd = parseFloat(quantidade);

    if (!marmore || isNaN(qtd) || qtd <= 0) {
      setErro('Preencha todos os campos corretamente.');
      return;
    }

    const marmoreSelecionado = marmores.find((m) => m.nome === marmore);
    if (!marmoreSelecionado) {
      setErro('Mármore não encontrado.');
      return;
    }

    let novaQuantidade = marmoreSelecionado.metros;
    if (tipo === 'Entrada') {
      novaQuantidade += qtd;
    } else {
      if (qtd > marmoreSelecionado.metros) {
        setErro('Quantidade de saída excede o estoque disponível.');
        return;
      }
      novaQuantidade -= qtd;
    }

    marmores.find((m) => m.nome === marmore).metros = novaQuantidade;
    setMetrosDisponiveis(novaQuantidade);

    const novaMovimentacao = {
      id: movimentacoes.length + 1,
      marmore,
      tipo,
      quantidade: qtd,
      data: new Date().toLocaleDateString(),
    };

    setMovimentacoes([...movimentacoes, novaMovimentacao]);
    setErro('');
    setQuantidade('');
    setMarmore('');
    setMetrosDisponiveis(0);
    setTipo('Entrada');
    setSugestoesMarmores([]);
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Gerenciar Movimentações</h1>
      <div className="row">
        <div className="col-12 col-md-6 mb-3">
          <form onSubmit={handleSubmit} className="card p-4 shadow-lg">
            <div className="mb-3 position-relative">
              <label className="form-label">Mármore</label>
              <input
                type="text"
                className="form-control"
                value={marmore}
                onChange={handleMarmoreInput}
                placeholder="Digite o nome do mármore"
                required
              />
              {sugestoesMarmores.length > 0 && (
                <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
                  {sugestoesMarmores.map((sugestao, index) => (
                    <li
                      key={index}
                      className="list-group-item"
                      onClick={() => handleSelecionarMarmore(sugestao)}
                      style={{ cursor: 'pointer' }}
                    >
                      {sugestao}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Metros Disponíveis (m²)</label>
              <input
                type="text"
                className="form-control"
                value={metrosDisponiveis}
                readOnly
              />
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
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="Entrada">Entrada</option>
                <option value="Saída">Saída</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Registrar Movimentação
            </button>
            {erro && (
              <div className="alert alert-warning mt-3" role="alert">
                {erro}
              </div>
            )}
          </form>
        </div>
        <div className="col-12 col-md-6 mb-3">
          <div className="card p-4 shadow-lg bg-light">
            <h4>Lista de Movimentações</h4>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Mármore</th>
                    <th>Tipo</th>
                    <th>Quantidade (m²)</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map((mov) => (
                    <tr key={mov.id}>
                      <td>{mov.marmore}</td>
                      <td>{mov.tipo}</td>
                      <td>{mov.quantidade}</td>
                      <td>{mov.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Movimentacoes;