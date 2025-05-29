// src/pages/Marmores.js
import React, { useState, useEffect, useCallback } from 'react'; // Adicionados useEffect e useCallback
import ApiClient from '../components/api'; // Supondo que api.js esteja em src/services/

function Marmores() {
  const [marmores, setMarmores] = useState([]); // Inicializa como vazio, será buscado
  const [nome, setNome] = useState('');
  const [metros, setMetros] = useState(''); // Corresponde a 'quantidade' no backend
  const [preco, setPreco] = useState('');   // Corresponde a 'preco_m2' no backend
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(''); // Para exibir erros

  // Função para buscar mármores do backend
  const fetchMarmores = useCallback(async () => {
    try {
      setError('');
      const response = await ApiClient.marmores.getAll();
      // Mapeia campos do backend (quantidade, preco_m2) para campos do estado do frontend (metros, preco)
      const fetchedMarmores = response.data.map(m => ({
        id: m.id,
        nome: m.nome,
        metros: m.quantidade, // Mapeia 'quantidade' para 'metros'
        preco: m.preco_m2      // Mapeia 'preco_m2' para 'preco'
      }));
      setMarmores(fetchedMarmores);
    } catch (err) {
      console.error("Erro ao buscar mármores:", err);
      setError(err.response?.data?.erro || "Não foi possível buscar os mármores. Verifique sua conexão ou token de login.");
      if (err.response?.status === 401 || err.response?.status === 422) { // 422 é Unprocessable Entity, comum com JWT se o token estiver malformado ou expirado de certas maneiras
         // Tratar acesso não autorizado, ex: redirecionar para login ou mostrar mensagem específica
         // Por enquanto, apenas registrar o erro está bom conforme a estrutura original.
         console.error("Erro de autenticação ou token inválido ao buscar mármores.");
      }
    }
  }, []);

  // Buscar mármores na montagem do componente
  useEffect(() => {
    fetchMarmores();
  }, [fetchMarmores]);

  const clearForm = () => {
    setNome('');
    setMetros('');
    setPreco('');
    setEditId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Prepara dados com nomes de campos do backend
    const marmoreData = {
      nome,
      quantidade: parseFloat(metros), // Backend espera 'quantidade'
      preco_m2: parseFloat(preco)     // Backend espera 'preco_m2'
    };

    try {
      if (editId) {
        // Atualiza mármore existente
        const response = await ApiClient.marmores.update(editId, marmoreData);
        // Mapeia resposta do backend de volta para campos do frontend para atualização do estado local
        const updatedMarmore = {
            id: response.data.id,
            nome: response.data.nome,
            metros: response.data.quantidade,
            preco: response.data.preco_m2
        };
        setMarmores(
          marmores.map((m) => (m.id === editId ? updatedMarmore : m))
        );
      } else {
        // Adiciona novo mármore
        const response = await ApiClient.marmores.create(marmoreData);
        // Mapeia resposta do backend de volta para campos do frontend para atualização do estado local
         const novoMarmoreBackend = {
            id: response.data.id,
            nome: response.data.nome,
            metros: response.data.quantidade,
            preco: response.data.preco_m2
        };
        setMarmores([...marmores, novoMarmoreBackend]);
      }
      clearForm();
    } catch (err) {
      console.error("Erro ao salvar mármore:", err);
      setError(err.response?.data?.erro || "Erro ao salvar mármore.");
    }
  };

  const handleEdit = (marmore) => {
    setNome(marmore.nome);
    setMetros(marmore.metros); // Usa o campo 'metros' do estado local
    setPreco(marmore.preco);   // Usa o campo 'preco' do estado local
    setEditId(marmore.id);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este mármore?")) {
      try {
        setError('');
        await ApiClient.marmores.delete(id);
        setMarmores(marmores.filter((m) => m.id !== id));
      } catch (err) {
        console.error("Erro ao excluir mármore:", err);
        setError(err.response?.data?.erro || "Erro ao excluir mármore.");
      }
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Gerenciar Mármores</h2>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
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
                <label className="form-label">Quantidade Disponível (m²)</label> {/* Rótulo Atualizado */}
                <input
                  type="number"
                  step="0.01" // Permitir decimais
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
                  step="0.01" // Permitir decimais
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
                  onClick={clearForm}
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
                  <th>Quantidade (m²)</th> {/* Rótulo Atualizado */}
                  <th>Preço (R$/m²)</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {marmores.map((marmore) => (
                  <tr key={marmore.id}>
                    <td>{marmore.nome}</td>
                    <td>{marmore.metros}</td> {/* Exibindo estado local 'metros' */}
                    <td>R$ {typeof marmore.preco === 'number' ? marmore.preco.toFixed(2) : 'N/A'}</td> {/* Exibindo estado local 'preco' */}
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