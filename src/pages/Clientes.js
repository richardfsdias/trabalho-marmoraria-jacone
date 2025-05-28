// src/pages/Clientes.js
import React, { useState } from 'react';
import ApiClient from '../components/api'; // <<-- Certifique-se que este caminho está correto. Se 'api.js' está na mesma pasta, use './api'. Se está em 'src/utils/api.js', use '../utils/api'.

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchClientes = async () => {
    try {
      const response = await ApiClient.clientes.getAll();
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error.response ? error.response.data : error);
      alert('Erro ao buscar clientes.');
    }
  };

  React.useEffect(() => {
    fetchClientes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedCpf = cpf.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (cleanedCpf.length !== 11) {
      alert('CPF deve conter exatamente 11 dígitos.');
      return;
    }

    const cleanedTelefone = telefone.replace(/\D/g, ''); // Remove tudo que não é dígito
    // Para ser compatível com um backend que aceita 8 a 11 dígitos,
    // podemos enviar o número limpo. A validação de comprimento mais precisa
    // pode ser feita no backend, ou aqui se houver uma regra mais estrita (ex: apenas 9 ou 11).
    if (cleanedTelefone.length < 8 || cleanedTelefone.length > 11) {
        alert('Telefone inválido. Deve conter entre 8 e 11 dígitos numéricos.');
        return;
    }

    const clienteData = {
      nome,
      cpf: cleanedCpf,
      telefone: cleanedTelefone, // Envia o número limpo e sem o slice(-9)
    };

    try {
      if (editId) {
        await ApiClient.clientes.update(editId, clienteData);
        alert('Cliente atualizado com sucesso!');
      } else {
        await ApiClient.clientes.create(clienteData);
        alert('Cliente adicionado com sucesso!');
      }
      setNome('');
      setCpf('');
      setTelefone('');
      setEditId(null);
      fetchClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error.response ? error.response.data : error);
      const errorMessage = error.response && error.response.data && error.response.data.erro
        ? error.response.data.erro
        : 'Erro ao salvar cliente. Verifique o console para mais detalhes.';
      alert(errorMessage);
    }
  };

  const handleEdit = (cliente) => {
    setNome(cliente.nome);
    // Assegura que o CPF e telefone sejam formatados para exibição
    setCpf(formatCpf(cliente.cpf));
    setTelefone(formatTelefone(cliente.telefone));
    setEditId(cliente.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await ApiClient.clientes.delete(id);
        alert('Cliente excluído com sucesso!');
        fetchClientes();
      } catch (error) {
        console.error('Erro ao excluir cliente:', error.response ? error.response.data : error);
        alert('Erro ao excluir cliente.');
      }
    }
  };

  const formatCpf = (value) => {
    if (!value) return '';
    value = String(value).replace(/\D/g, ''); // Garante que é string antes de replace
    if (value.length > 9) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      return value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      return value.replace(/(\d{3})(\d{3})/, '$1.$2');
    }
    return value;
  };

  const formatTelefone = (value) => {
    if (!value) return '';
    value = String(value).replace(/\D/g, ''); // Garante que é string antes de replace
    if (value.length === 11) { // Ex: (XX) XXXXX-XXXX
      return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length === 10) { // Ex: (XX) XXXX-XXXX
      return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (value.length === 9) { // Ex: XXXXX-XXXX (sem DDD)
      return value.replace(/(\d{5})(\d{4})/, '$1-$2');
    } else if (value.length === 8) { // Ex: XXXX-XXXX (sem DDD e com 8 dígitos)
        return value.replace(/(\d{4})(\d{4})/, '$1-$2');
    }
    return value;
  };

  const handleCpfChange = (e) => {
    const value = e.target.value;
    setCpf(formatCpf(value));
  };

  const handleTelefoneChange = (e) => {
    const value = e.target.value;
    setTelefone(formatTelefone(value));
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
                  onChange={handleCpfChange}
                  maxLength="14" // Para 999.999.999-99
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Telefone</label>
                <input
                  type="text"
                  className="form-control"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  maxLength="15" // Ex: (99) 99999-9999
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
                    <td>{formatCpf(cliente.cpf)}</td>
                    <td>{formatTelefone(cliente.telefone)}</td>
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