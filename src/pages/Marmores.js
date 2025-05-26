// src/pages/Marmores.js
import React, { useState } from 'react';

function Marmores() {
  const [marmores, setMarmores] = useState([
    { id: 1, nome: 'Verde Ubatuba', metros: 400, preco: 250 },
    { id: 2, nome: 'Preto São Gabriel', metros: 600, preco: 280 },
  ]);
  const [nome, setNome] = useState('');
  const [metros, setMetros] = useState('');
  const [preco, setPreco] = useState('');
  const [editId, setEditId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      setMarmores(
        marmores.map((m) =>
          m.id === editId ? { ...m, nome, metros: parseFloat(metros), preco: parseFloat(preco) } : m
        )
      );
      setEditId(null);
    } else {
      const novoMarmore = {
        id: marmores.length + 1,
        nome,
        metros: parseFloat(metros),
        preco: parseFloat(preco),
      };
      setMarmores([...marmores, novoMarmore]);
    }
    setNome('');
    setMetros('');
    setPreco('');
  };

  const handleEdit = (marmore) => {
    setNome(marmore.nome);
    setMetros(marmore.metros);
    setPreco(marmore.preco);
    setEditId(marmore.id);
  };

  const handleDelete = (id) => {
    setMarmores(marmores.filter((m) => m.id !== id));
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Gerenciar Mármores</h2>
      <div className="row">
        <div className="col-md-4">
          <div className="card p-4 shadow-lg">
            <h4>{editId ? 'Editar Mármore' : 'Adicionar Mármore'}</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  className="form-control"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Metros Disponíveis (m²)</label>
                <input
                  type="number"
                  className="form-control"
                  value={metros}
                  onChange={(e) => setMetros(e.target.value)}
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
                {editId ? 'Salvar' : 'Adicionar'}
              </button>
              {editId && (
                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={() => {
                    setNome('');
                    setMetros('');
                    setPreco('');
                    setEditId(null);
                  }}
                >
                  Cancelar
                </button>
              )}
            </form>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card p-4 shadow-lg">
            <h4>Lista de Mármores</h4>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Metros (m²)</th>
                  <th>Preço (R$/m²)</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {marmores.map((marmore) => (
                  <tr key={marmore.id}>
                    <td>{marmore.nome}</td>
                    <td>{marmore.metros}</td>
                    <td>R$ {marmore.preco.toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(marmore)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(marmore.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Marmores;