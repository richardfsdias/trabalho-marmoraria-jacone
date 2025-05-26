// src/pages/Clientes.js
import React, { useState } from 'react';

function Clientes() {
  const [clientes, setClientes] = useState([
    { id: 1, nome: 'João Silva', cpf: '123.456.789-00', telefone: '(11) 99999-9999' },
    { id: 2, nome: 'Maria Oliveira', cpf: '987.654.321-00', telefone: '(21) 88888-8888' },
  ]);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [editId, setEditId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      // Editar cliente
      setClientes(
        clientes.map((cliente) =>
          cliente.id === editId ? { ...cliente, nome, cpf, telefone } : cliente
        )
      );
      setEditId(null);
    } else {
      // Adicionar cliente
      const novoCliente = {
        id: clientes.length + 1,
        nome,
        cpf,
        telefone,
      };
      setClientes([...clientes, novoCliente]);
    }
    // Limpar formulário
    setNome('');
    setCpf('');
    setTelefone('');
  };

  const handleEdit = (cliente) => {
    setNome(cliente.nome);
    setCpf(cliente.cpf);
    setTelefone(cliente.telefone);
    setEditId(cliente.id);
  };

  const handleDelete = (id) => {
    setClientes(clientes.filter((cliente) => cliente.id !== id));
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Gerenciar Clientes</h2>
      <div className="row">
        <div className="col-md-4">
          <div className="card p-4 shadow-lg">
            <h4>{editId ? 'Editar Cliente' : 'Adicionar Cliente'}</h4>
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
                <label className="form-label">CPF</label>
                <input
                  type="text"
                  className="form-control"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Telefone</label>
                <input
                  type="text"
                  className="form-control"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
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
                    setCpf('');
                    setTelefone('');
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
            <h4>Lista de Clientes</h4>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Telefone</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.cpf}</td>
                    <td>{cliente.telefone}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(cliente)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(cliente.id)}
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

export default Clientes;