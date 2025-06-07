// src/pages/Calculadora.js
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

const materiais = [
  { nome: 'Verde Ubatuba', metros: 400, preco: 250 },
  { nome: 'Preto São Gabriel', metros: 600, preco: 280 },
  { nome: 'Branco Prime', metros: 1200, preco: 350 },
  { nome: 'Amarelo Icaraí', metros: 550, preco: 300 },
  { nome: 'Cinza Corumbar', metros: 380, preco: 220 },
  { nome: 'Cinza Ocre', metros: 400, preco: 240 },
  { nome: 'Preto Via Láctea', metros: 770, preco: 400 },
  { nome: 'Branco Itaúnas', metros: 900, preco: 370 },
  { nome: 'Ornamental', metros: 600, preco: 310 },
  { nome: 'Bege Bahia', metros: 700, preco: 330 },
];

function Calculadora() {
  const [material, setMaterial] = useState('');
  const [metrosDisponiveis, setMetrosDisponiveis] = useState(0);
  const [quantidade, setQuantidade] = useState('');
  const [preco, setPreco] = useState('');
  const [total, setTotal] = useState(0);
  const [acumulado, setAcumulado] = useState(0);
  const [erroEstoque, setErroEstoque] = useState('');

  const handleMaterialChange = (e) => {
    const nome = e.target.value;
    setMaterial(nome);
    const mat = materiais.find((m) => m.nome === nome);
    setMetrosDisponiveis(mat ? mat.metros : 0);
    setPreco(mat ? mat.preco : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qtd = parseFloat(quantidade);
    const precoFloat = parseFloat(preco);

    if (isNaN(qtd) || isNaN(precoFloat)) {
      setErroEstoque('Preencha todos os campos corretamente.');
      return;
    }

    if (qtd > metrosDisponiveis) {
      setErroEstoque('Quantidade solicitada excede o estoque disponível.');
      return;
    }

    const subtotal = qtd * precoFloat;
    setTotal(subtotal);
    setAcumulado(acumulado + subtotal);
    setErroEstoque('');
  };

  const handleZerar = () => {
    setTotal(0);
    setAcumulado(0);
    setQuantidade('');
    setPreco('');
    setMaterial('');
    setMetrosDisponiveis(0);
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Sistema da Marmoraria</h1>
      <div className="row">
        <div className="col-md-6">
          <form onSubmit={handleSubmit} className="card p-4 shadow-lg">
            <div className="mb-3">
              <label className="form-label">Material</label>
              <select
                className="form-select"
                value={material}
                onChange={handleMaterialChange}
                required
              >
                <option value="">Selecione um material</option>
                {materiais.map((mat, index) => (
                  <option key={index} value={mat.nome}>
                    {mat.nome} - {mat.metros}m² disponíveis
                  </option>
                ))}
              </select>
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
            <button type="submit" className="btn btn-primary">
              Calcular Total
            </button>
            {erroEstoque && (
              <div className="alert alert-warning mt-3" role="alert">
                {erroEstoque}
              </div>
            )}
            <button
              type="button"
              className="btn btn-danger ms-2"
              onClick={handleZerar}
            >
              Zerar Tudo
            </button>
          </form>
        </div>
        <div className="col-md-6">
          <div className="card p-4 shadow-lg bg-light">
            <h4>Resultado</h4>
            <p>
              <strong>Total atual:</strong> R$ {total.toFixed(2)}
            </p>
            <p>
              <strong>Valor acumulado:</strong> R$ {acumulado.toFixed(2)}
            </p>
            <p>
              <strong>Material selecionado:</strong> {material || 'Nenhum'}
            </p>
            <p>
              <strong>Estoque disponível:</strong> {metrosDisponiveis}m²
            </p>
            <p>
              <strong>Preço por m²:</strong> R$ {preco}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calculadora;