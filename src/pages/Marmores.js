// src/pages/Marmores.js
import React, { useState, useEffect, useCallback } from 'react';
import ApiClient from '../components/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

function Marmores() {
  const [itensEstoqueMarmores, setItensEstoqueMarmores] = useState([]);
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  // REMOVIDO: const [tipo, setTipo] = useState('Mármore');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const unidadesDeMedida = ['m²', 'm linear', 'peça', 'kg', 'unidade'];

  const fetchEstoqueMarmores = useCallback(async () => {
    try {
      setError('');
      const response = await ApiClient.estoque.getAll();
      // Agora esta página listará TODOS os itens do estoque, pois 'tipo' foi removido.
      // Se você quiser filtrar, precisará de uma nova lógica (ex: um campo 'categoria' no backend)
      setItensEstoqueMarmores(response.data);
    } catch (error) {
      console.error('Erro ao buscar itens de estoque:', error.response ? error.response.data : error);
      setError('Erro ao buscar itens de estoque.');
    }
  }, []);

  useEffect(() => {
    fetchEstoqueMarmores();
  }, [fetchEstoqueMarmores]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validação de campos obrigatórios - 'tipo' foi removido
    if (!nome || !quantidade || !precoUnitario || !unidadeMedida) {
      setError('Por favor, preencha todos os campos obrigatórios (Nome, Quantidade, Preço Unitário, Unidade de Medida).');
      return;
    }

    const itemData = {
      nome,
      quantidade: parseFloat(quantidade),
      unidade_medida: unidadeMedida,
      preco_unitario: parseFloat(precoUnitario),
      // REMOVIDO: tipo,
    };

    try {
      if (editId) {
        await ApiClient.estoque.update(editId, itemData);
        alert('Item de estoque atualizado com sucesso!');
      } else {
        await ApiClient.estoque.create(itemData);
        alert('Item de estoque adicionado com sucesso!');
      }
      resetForm();
      fetchEstoqueMarmores();
    } catch (error) {
      console.error('Erro ao salvar item de estoque:', error);
      setError('Erro ao salvar item de estoque: ' + (error.response?.data?.erro || error.message));
      alert('Erro ao salvar item de estoque: ' + (error.response?.data?.erro || error.message));
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setNome(item.nome);
    setQuantidade(item.quantidade);
    setPrecoUnitario(item.preco_unitario);
    setUnidadeMedida(item.unidade_medida);
    // REMOVIDO: setTipo(item.tipo);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este item de estoque?')) {
      try {
        await ApiClient.estoque.delete(id);
        alert('Item de estoque excluído com sucesso!');
        fetchEstoqueMarmores();
      } catch (error) {
        console.error('Erro ao excluir item de estoque:', error.response ? error.response.data : error);
        setError('Erro ao excluir item de estoque: ' + (error.response?.data?.erro || error.message));
        alert('Erro ao excluir item de estoque: ' + (error.response?.data?.erro || error.message));
      }
    }
  };

  const resetForm = () => {
    setEditId(null);
    setNome('');
    setQuantidade('');
    setPrecoUnitario('');
    setUnidadeMedida('');
    // REMOVIDO: setTipo('Mármore');
    setError('');
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gerenciamento de Estoque</h2> {/* Nome da página ajustado */}
      <div className="row">
        <div className="col-md-4">
          <div className="card p-4 shadow-lg mb-4">
            <h4>{editId ? 'Editar Item' : 'Adicionar Novo Marmore'}</h4> {/* Título ajustado */}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="nome" className="form-label">Nome do Marmore:</label> {/* Label ajustado */}
                <input
                  type="text"
                  id="nome"
                  className="form-control"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="quantidade" className="form-label">Quantidade:</label>
                <input
                  type="number"
                  id="quantidade"
                  className="form-control"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="unidadeMedida" className="form-label">Unidade de Medida:</label>
                <select
                  id="unidadeMedida"
                  className="form-select"
                  value={unidadeMedida}
                  onChange={(e) => setUnidadeMedida(e.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {unidadesDeMedida.map((unidade) => (
                    <option key={unidade} value={unidade}>{unidade}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="precoUnitario" className="form-label">Preço Unitário (R$):</label>
                <input
                  type="number"
                  id="precoUnitario"
                  className="form-control"
                  value={precoUnitario}
                  onChange={(e) => setPrecoUnitario(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              {/* REMOVIDO: Campo de Tipo */}
              <button type="submit" className="btn btn-primary me-2">
                {editId ? 'Atualizar' : 'Adicionar'} Item
              </button>
              {editId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar Edição
                </button>
              )}
            </form>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card p-4 shadow-lg">
            <h4>Lista de Itens em Estoque</h4> {/* Título ajustado */}
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Quantidade</th>
                  <th>Unidade</th>
                  <th>Preço (R$)</th>
                  {/* REMOVIDO: <th>Tipo</th> */}
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensEstoqueMarmores.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.quantidade}</td>
                    <td>{item.unidade_medida}</td>
                    <td>R$ {typeof item.preco_unitario === 'number' ? item.preco_unitario.toFixed(2) : 'N/A'}</td>
                    {/* REMOVIDO: <td>{item.tipo}</td> */}
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(item)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(item.id)}
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