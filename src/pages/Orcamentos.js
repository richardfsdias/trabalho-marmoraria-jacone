// src/pages/Orcamentos.js
import React, { useState, useEffect, useCallback } from 'react';
import ApiClient from '../components/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiais, setMateriais] = useState([]);

  const [editId, setEditId] = useState(null);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itensOrcamento, setItensOrcamento] = useState([]);

  const [materialSelecionadoCalc, setMaterialSelecionadoCalc] = useState('');
  const [quantidadeCalc, setQuantidadeCalc] = useState('');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatarData = (dataString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dataString).toLocaleDateString('pt-BR', options);
  };

  const fetchOrcamentos = useCallback(async () => {
    try {
      const response = await ApiClient.orcamentos.getAll();
      setOrcamentos(response.data);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error.response ? error.response.data : error);
      alert('Erro ao buscar orçamentos.');
    }
  }, []);

  const fetchClientes = useCallback(async () => {
    try {
      const response = await ApiClient.clientes.getAll();
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error.response ? error.response.data : error);
      alert('Erro ao buscar clientes.');
    }
  }, []);

  const fetchMateriais = useCallback(async () => {
    try {
      const response = await ApiClient.estoque.getAll();
      // REMOVIDO: Filtragem por tipo. Agora todos os itens do estoque são considerados "materiais"
      setMateriais(response.data);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error.response ? error.response.data : error);
      alert('Erro ao buscar materiais.');
    }
  }, []);

  useEffect(() => {
    fetchOrcamentos();
    fetchClientes();
    fetchMateriais();
  }, [fetchOrcamentos, fetchClientes, fetchMateriais]);

  const handleAddItem = () => {
    if (!materialSelecionadoCalc || !quantidadeCalc) {
      alert('Selecione um material e insira a quantidade.');
      return;
    }

    const material = materiais.find(m => String(m.id) === String(materialSelecionadoCalc));
    if (!material) {
      alert('Material selecionado não encontrado.');
      return;
    }

    const quantidadeFloat = parseFloat(quantidadeCalc);
    if (isNaN(quantidadeFloat) || quantidadeFloat <= 0) {
      alert('Quantidade inválida. Insira um número positivo.');
      return;
    }

    const precoUnitario = material.preco_unitario || 0;
    const precoTotalItem = precoUnitario * quantidadeFloat;

    const itemExistenteIndex = itensOrcamento.findIndex(item => item.item_estoque_id === material.id);

    if (itemExistenteIndex !== -1) {
      const updatedItens = [...itensOrcamento];
      updatedItens[itemExistenteIndex].quantidade += quantidadeFloat;
      updatedItens[itemExistenteIndex].total_item_calculado += precoTotalItem;
      setItensOrcamento(updatedItens);
    } else {
      setItensOrcamento([
        ...itensOrcamento,
        {
          item_estoque_id: material.id,
          nome_item: material.nome,
          unidade_medida: material.unidade_medida,
          quantidade: quantidadeFloat,
          preco_unitario_no_orcamento: precoUnitario,
          total_item_calculado: precoTotalItem,
        },
      ]);
    }

    setMaterialSelecionadoCalc('');
    setQuantidadeCalc('');
  };

  const handleRemoveItem = (index) => {
    const updatedItens = [...itensOrcamento];
    updatedItens.splice(index, 1);
    setItensOrcamento(updatedItens);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clienteSelecionadoId || itensOrcamento.length === 0) {
      alert('Selecione um cliente e adicione pelo menos um item ao orçamento.');
      return;
    }

    const total_orcamento_calculado = itensOrcamento.reduce((sum, item) => sum + item.total_item_calculado, 0);

    const orcamentoData = {
      cliente_id: clienteSelecionadoId,
      observacoes: observacoes,
      total_orcamento: total_orcamento_calculado,
      itens: itensOrcamento.map(item => ({
        item_estoque_id: item.item_estoque_id,
        quantidade: item.quantidade,
        preco_unitario_no_orcamento: item.preco_unitario_no_orcamento,
      })),
    };

    try {
      if (editId) {
        await ApiClient.orcamentos.update(editId, orcamentoData);
        alert('Orçamento atualizado com sucesso!');
      } else {
        await ApiClient.orcamentos.create(orcamentoData);
        alert('Orçamento criado com sucesso!');
      }
      resetForm();
      fetchOrcamentos();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error.response ? error.response.data : error);
      alert('Erro ao salvar orçamento: ' + (error.response?.data?.erro || error.message));
    }
  };

  const handleEdit = (orcamento) => {
    setEditId(orcamento.id);
    setClienteSelecionadoId(orcamento.cliente_id);
    setObservacoes(orcamento.observacoes);
    setItensOrcamento(orcamento.itens.map(item => ({
      ...item,
      total_item_calculado: item.quantidade * item.preco_unitario_no_orcamento,
    })));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await ApiClient.orcamentos.delete(id);
        alert('Orçamento excluído com sucesso!');
        fetchOrcamentos();
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error.response ? error.response.data : error);
        alert('Erro ao excluir orçamento: ' + (error.response?.data?.erro || error.message));
      }
    }
  };

  const handleAprovar = async (orcamento) => {
    if (orcamento.status === 'Aprovado') {
      alert('Este orçamento já está aprovado.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja APROVAR o orçamento #${orcamento.id}? Isso registrará as saídas no estoque.`)) {
      try {
        await ApiClient.orcamentos.updateStatus(orcamento.id, 'Aprovado');
        alert('Orçamento aprovado e estoque atualizado com sucesso!');
        fetchOrcamentos();
      } catch (error) {
        console.error('Erro ao aprovar orçamento:', error.response ? error.response.data : error);
        alert('Erro ao aprovar orçamento: ' + (error.response?.data?.erro || error.message));
      }
    }
  };

  const handleRejeitar = async (id) => {
    if (window.confirm('Tem certeza que deseja REJEITAR este orçamento?')) {
      try {
        await ApiClient.orcamentos.updateStatus(id, 'Rejeitado');
        alert('Orçamento rejeitado com sucesso!');
        fetchOrcamentos();
      } catch (error) {
        console.error('Erro ao rejeitar orçamento:', error.response ? error.response.data : error);
        alert('Erro ao rejeitar orçamento: ' + (error.response?.data?.erro || error.message));
      }
    }
  };

  const resetForm = () => {
    setEditId(null);
    setClienteSelecionadoId('');
    setObservacoes('');
    setItensOrcamento([]);
    setMaterialSelecionadoCalc('');
    setQuantidadeCalc('');
  };

  const orcamentosFiltrados = orcamentos;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gerenciamento de Orçamentos</h2>
      <div className="row">
        <div className="col-md-4">
          <div className="card p-4 shadow-lg mb-4">
            <h4>{editId ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="cliente" className="form-label">Cliente:</label>
                <select
                  id="cliente"
                  className="form-select"
                  value={clienteSelecionadoId}
                  onChange={(e) => setClienteSelecionadoId(e.target.value)}
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="observacoes" className="form-label">Observações:</label>
                <textarea
                  id="observacoes"
                  className="form-control"
                  rows="3"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                ></textarea>
              </div>

              <h5 className="mt-4">Adicionar Itens</h5>
              <div className="mb-3">
                <label htmlFor="materialCalc" className="form-label">Material:</label>
                <select
                  id="materialCalc"
                  className="form-select"
                  value={materialSelecionadoCalc}
                  onChange={(e) => setMaterialSelecionadoCalc(e.target.value)}
                >
                  <option value="">Selecione um material</option>
                  {materiais.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.nome} ({material.unidade_medida}) - R$ {typeof material.preco_unitario === 'number' ? material.preco_unitario.toFixed(2) : 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="quantidadeCalc" className="form-label">Quantidade:</label>
                <input
                  type="number"
                  id="quantidadeCalc"
                  className="form-control"
                  value={quantidadeCalc}
                  onChange={(e) => setQuantidadeCalc(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <button
                type="button"
                className="btn btn-info btn-sm mb-3"
                onClick={handleAddItem}
              >
                Adicionar Item
              </button>

              {itensOrcamento.length > 0 && (
                <div className="mt-3">
                  <h6>Itens do Orçamento:</h6>
                  <ul className="list-group list-group-flush">
                    {itensOrcamento.map((item, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.nome_item} - {item.quantidade} {item.unidade_medida} @ {formatCurrency(item.preco_unitario_no_orcamento)} = {formatCurrency(item.total_item_calculado)}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm ms-2"
                          onClick={() => handleRemoveItem(index)}
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="fw-bold mt-2">
                    Total dos Itens: {formatCurrency(itensOrcamento.reduce((sum, item) => sum + item.total_item_calculado, 0))}
                  </p>
                </div>
              )}

              <button type="submit" className="btn btn-primary mt-3 me-2">
                {editId ? 'Atualizar Orçamento' : 'Criar Orçamento'}
              </button>
              {editId && (
                <button
                  type="button"
                  className="btn btn-secondary mt-3"
                  onClick={resetForm}
                >
                  Cancelar Edição
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card p-4 shadow-lg">
            <h4>Lista de Orçamentos</h4>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentosFiltrados.map((orcamento) => (
                  <tr key={orcamento.id}>
                    <td>{orcamento.id}</td>
                    <td>{orcamento.nome_cliente}</td>
                    <td>{formatarData(orcamento.data_criacao)}</td>
                    <td>{formatCurrency(orcamento.total_orcamento)}</td>
                    <td><span className={`badge ${
                      orcamento.status === 'Aprovado' ? 'bg-success' :
                      orcamento.status === 'Rejeitado' ? 'bg-danger' : 'bg-warning text-dark'
                    }`}>{orcamento.status}</span></td>
                    <td>
                      <div className="d-flex">
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => handleEdit(orcamento)}
                        >
                          Editar
                        </button>
                        {orcamento.status === 'Pendente' && (
                          <>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleAprovar(orcamento)}
                            >
                              Aprovar
                            </button>
                            <button
                              className="btn btn-sm btn-secondary me-2"
                              onClick={() => handleRejeitar(orcamento.id)}
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(orcamento.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fw-bold mt-3">
              Total Acumulado (Aprovados):{' '}
              {formatCurrency(
                orcamentosFiltrados
                  .filter((o) => o.status === 'Aprovado')
                  .reduce((sum, o) => sum + o.total_orcamento, 0)
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orcamentos;