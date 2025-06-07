import React, { useState, useEffect, useCallback } from 'react';
import ApiClient from '../components/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css'; // Seu CSS customizado

function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiais, setMateriais] = useState([]);

  // Estados para o formulário de criação/edição de orçamento
  const [editId, setEditId] = useState(null); // ID do orçamento sendo editado
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itensOrcamento, setItensOrcamento] = useState([]); // Itens do orçamento atual (para formulário)
  const [statusOrcamento, setStatusOrcamento] = useState('Pendente'); // Novo estado para status

  // Estados para o formulário de adição de item ao orçamento
  const [materialSelecionadoCalc, setMaterialSelecionadoCalc] = useState('');
  const [quantidadeCalc, setQuantidadeCalc] = useState('');
  const [editandoItemOrcamentoId, setEditandoItemOrcamentoId] = useState(null); // ID temporário do item sendo editado na lista de itens

  // Estados para filtros
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroClienteId, setFiltroClienteId] = useState('');

  // Estado para exibir detalhes de um orçamento (o novo bloco)
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null);

  const [error, setError] = useState('');

  // Funções de formatação
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dataString).toLocaleDateString('pt-BR', options);
  };

  // Funções para buscar dados do backend
  const fetchOrcamentos = useCallback(async () => {
    try {
      setError('');
      const response = await ApiClient.orcamentos.getAll();
      setOrcamentos(response.data);
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err.response ? err.response.data : err);
      setError('Erro ao buscar orçamentos.');
    }
  }, []);

  const fetchClientes = useCallback(async () => {
    try {
      setError('');
      const response = await ApiClient.clientes.getAll();
      setClientes(response.data);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err.response ? err.response.data : err);
      setError('Erro ao buscar clientes.');
    }
  }, []);

  const fetchMateriais = useCallback(async () => {
    try {
      setError('');
      const response = await ApiClient.estoque.getAll(); // Assume que /estoque retorna todos os materiais/mármores
      setMateriais(response.data);
    } catch (err) {
      console.error('Erro ao buscar materiais:', err.response ? err.response.data : err);
      setError('Erro ao buscar materiais.');
    }
  }, []);

  // useEffect para carregar dados iniciais
  useEffect(() => {
    fetchOrcamentos();
    fetchClientes();
    fetchMateriais();
  }, [fetchOrcamentos, fetchClientes, fetchMateriais]);

  // Função para adicionar/atualizar item no array de itens do orçamento (no formulário)
  const handleAdicionarItemOrcamento = useCallback(() => {
    if (!materialSelecionadoCalc || !quantidadeCalc || parseFloat(quantidadeCalc) <= 0) {
      alert('Selecione um material e insira uma quantidade válida.');
      return;
    }

    const materialDetalhes = materiais.find(m => m.id === parseInt(materialSelecionadoCalc));
    if (!materialDetalhes) {
      alert('Material não encontrado.');
      return;
    }

    const quantidadeFloat = parseFloat(quantidadeCalc);
    const precoUnitario = parseFloat(materialDetalhes.preco_unitario);
    let subtotalCalculado;
    let logCalculoStr = '';

    // Lógica de cálculo e geração do log (adapte conforme seus cálculos reais)
    if (materialDetalhes.unidade_medida === 'm²') {
      subtotalCalculado = quantidadeFloat * precoUnitario;
      logCalculoStr = `Cálculo (m²): ${quantidadeFloat} m² * ${formatCurrency(precoUnitario)}/m² = ${formatCurrency(subtotalCalculado)}`;
    } else if (materialDetalhes.unidade_medida === 'm linear') {
      subtotalCalculado = quantidadeFloat * precoUnitario;
      logCalculoStr = `Cálculo (m linear): ${quantidadeFloat} m linear * ${formatCurrency(precoUnitario)}/m linear = ${formatCurrency(subtotalCalculado)}`;
    } else if (materialDetalhes.unidade_medida === 'peça') {
      subtotalCalculado = quantidadeFloat * precoUnitario;
      logCalculoStr = `Cálculo (peça): ${quantidadeFloat} peça(s) * ${formatCurrency(precoUnitario)}/peça = ${formatCurrency(subtotalCalculado)}`;
    } else if (materialDetalhes.unidade_medida === 'kg') {
        subtotalCalculado = quantidadeFloat * precoUnitario;
        logCalculoStr = `Cálculo (kg): ${quantidadeFloat} kg * ${formatCurrency(precoUnitario)}/kg = ${formatCurrency(subtotalCalculado)}`;
    }
    else {
      // Cálculo padrão para "unidade" ou outros
      subtotalCalculado = quantidadeFloat * precoUnitario;
      logCalculoStr = `Cálculo (unidade): ${quantidadeFloat} unidades * ${formatCurrency(precoUnitario)}/unidade = ${formatCurrency(subtotalCalculado)}`;
    }

    const novoItem = {
      item_estoque_id: materialDetalhes.id,
      nome_item: materialDetalhes.nome,
      quantidade: quantidadeFloat,
      unidade_medida: materialDetalhes.unidade_medida,
      preco_unitario_praticado: precoUnitario,
      subtotal: subtotalCalculado,
      log_calculo: logCalculoStr // O log de cálculo!
    };

    if (editandoItemOrcamentoId !== null) {
      setItensOrcamento(prevItens =>
        prevItens.map(item =>
          item.id === editandoItemOrcamentoId ? { ...novoItem, id: item.id } : item
        )
      );
      setEditandoItemOrcamentoId(null);
    } else {
      setItensOrcamento(prevItens => [...prevItens, { ...novoItem, id: Date.now() }]); // ID temporário para React key
    }

    // Resetar campos de adição de item
    setMaterialSelecionadoCalc('');
    setQuantidadeCalc('');
  }, [materialSelecionadoCalc, quantidadeCalc, materiais, editandoItemOrcamentoId, formatCurrency]);

  const handleRemoverItemOrcamento = useCallback((idToRemove) => {
    setItensOrcamento(prevItens => prevItens.filter(item => item.id !== idToRemove));
  }, []);

  const handleEditarItemOrcamento = useCallback((itemToEdit) => {
    setMaterialSelecionadoCalc(itemToEdit.item_estoque_id.toString());
    setQuantidadeCalc(itemToEdit.quantidade.toString());
    setEditandoItemOrcamentoId(itemToEdit.id);
  }, []);

   const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!clienteSelecionadoId || itensOrcamento.length === 0) {
      setError('Selecione um cliente e adicione pelo menos um item ao orçamento.');
      return;
    }

    // Mapeia os itens do orçamento para o formato esperado pelo backend
    const itensParaEnvio = itensOrcamento.map(item => ({
        id: item.id, // Envie o ID do item se for uma atualização de item existente
        item_estoque_id: item.item_estoque_id,
        quantidade: parseFloat(item.quantidade), // Garanta que é número
        preco_unitario_praticado: parseFloat(item.preco_unitario_praticado), // Garanta que é número
        subtotal: parseFloat(item.subtotal), // Garanta que é número
        log_calculo: item.log_calculo || '' // Garanta que seja string ou string vazia, não null/undefined
    }));


    const orcamentoData = {
      cliente_id: parseInt(clienteSelecionadoId),
      observacoes,
      itens: itensParaEnvio, // Use a versão mapeada
    };

    try {
      if (editId) {
        // Se estamos EDITANDO, ADICIONE o status ao objeto orcamentoData
        orcamentoData.status = statusOrcamento; // <--- MANTENHA ESTA LINHA AQUI
        await ApiClient.orcamentos.update(editId, orcamentoData);
        alert('Orçamento atualizado com sucesso!');
      } else {
        // Se estamos CRIANDO, NÃO ADICIONE o status. O backend usará o padrão.
        await ApiClient.orcamentos.create(orcamentoData);
        alert('Orçamento criado com sucesso!');
      }
      resetForm();
      fetchOrcamentos(); // Recarrega a lista
    } catch (err) {
      console.error('Erro ao salvar orçamento:', err.response ? err.response.data : err);
      // Exibe a mensagem de erro do backend se disponível
      setError(err.response?.data?.erro || 'Erro ao salvar orçamento: Verifique os dados informados.');
    }
  };

  // Função para pré-popular o formulário para edição
  const handleEdit = useCallback((orcamento) => {
    setEditId(orcamento.id);
    setClienteSelecionadoId(orcamento.cliente_id.toString());
    setObservacoes(orcamento.observacoes || '');
    setItensOrcamento(
      orcamento.itens.map(item => ({
        ...item,
        id: item.id || Date.now() + Math.random(), // Garante um ID único para o React
      }))
    );
    setStatusOrcamento(orcamento.status); // Preenche o status
    setOrcamentoSelecionado(null); // Fecha detalhes se estiverem abertos
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo
  }, []);


  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await ApiClient.orcamentos.delete(id);
        alert('Orçamento excluído com sucesso!');
        fetchOrcamentos();
        setOrcamentoSelecionado(null); // Fecha detalhes se o orçamento selecionado for o excluído
      } catch (err) {
        console.error('Erro ao excluir orçamento:', err.response ? err.response.data : err);
        setError(err.response?.data?.erro || 'Erro ao excluir orçamento.');
      }
    }
  }, [fetchOrcamentos]);

  const handleAprovar = useCallback(async (orcamento) => {
    if (window.confirm(`Tem certeza que deseja APROVAR o orçamento #${orcamento.id}?`)) {
      try {
        await ApiClient.orcamentos.updateStatus(orcamento.id, 'Aprovado');
        alert(`Orçamento #${orcamento.id} aprovado com sucesso!`);
        fetchOrcamentos();
      } catch (err) {
        console.error('Erro ao aprovar orçamento:', err.response ? err.response.data : err);
        setError(err.response?.data?.erro || 'Erro ao aprovar orçamento.');
      }
    }
  }, [fetchOrcamentos]);

  const handleRejeitar = useCallback(async (id) => {
    if (window.confirm(`Tem certeza que deseja REJEITAR o orçamento #${id}?`)) {
      try {
        await ApiClient.orcamentos.updateStatus(id, 'Rejeitado');
        alert(`Orçamento #${id} rejeitado com sucesso!`);
        fetchOrcamentos();
      } catch (err) {
        console.error('Erro ao rejeitar orçamento:', err.response ? err.response.data : err);
        setError(err.response?.data?.erro || 'Erro ao rejeitar orçamento.');
      }
    }
  }, [fetchOrcamentos]);

  // Função para resetar o formulário
  const resetForm = useCallback(() => {
    setEditId(null);
    setClienteSelecionadoId('');
    setObservacoes('');
    setItensOrcamento([]);
    setMaterialSelecionadoCalc('');
    setQuantidadeCalc('');
    setEditandoItemOrcamentoId(null);
    setStatusOrcamento('Pendente');
    setError('');
  }, []);

  // Filtra orçamentos com base nos estados de filtro
  const orcamentosFiltrados = orcamentos.filter(orcamento => {
    const statusMatch = filtroStatus ? orcamento.status === filtroStatus : true;
    const clienteMatch = filtroClienteId ? orcamento.cliente_id === parseInt(filtroClienteId) : true;
    return statusMatch && clienteMatch;
  });

  // Função para carregar os detalhes de um orçamento (para o bloco de detalhes)
  const handleVerDetalhesOrcamento = useCallback(async (orcamentoId) => {
    try {
      setError('');
      const response = await ApiClient.orcamentos.getById(orcamentoId);
      setOrcamentoSelecionado(response.data);
    } catch (err) {
      console.error('Erro ao buscar detalhes do orçamento:', err.response ? err.response.data : err);
      setError('Erro ao buscar detalhes do orçamento.');
    }
  }, []);


  return (
    <div className="container mt-4">
      <div className="row">
        {/* Formulário de Criação/Edição de Orçamento */}
        <div className="col-md-5">
          <div className="card p-4 shadow-lg mb-4">
            <h4>{editId ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</h4>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="cliente" className="form-label">Cliente</label>
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

              {/* Formulário para adicionar itens ao orçamento */}
              <div className="card p-3 mb-3 bg-light">
                <h6>Adicionar Item ao Orçamento</h6>
                <div className="mb-3">
                  <label htmlFor="materialCalc" className="form-label">Material</label>
                  <select
                    id="materialCalc"
                    className="form-select"
                    value={materialSelecionadoCalc}
                    onChange={(e) => setMaterialSelecionadoCalc(e.target.value)}
                  >
                    <option value="">Selecione um material</option>
                    {materiais.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.nome} ({material.unidade_medida}) - {formatCurrency(material.preco_unitario)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="quantidadeCalc" className="form-label">Quantidade</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="quantidadeCalc"
                    value={quantidadeCalc}
                    onChange={(e) => setQuantidadeCalc(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleAdicionarItemOrcamento}
                >
                  {editandoItemOrcamentoId ? 'Atualizar Item' : 'Adicionar Item'}
                </button>
              </div>

              {/* Lista de itens já adicionados ao orçamento */}
              {itensOrcamento.length > 0 && (
                <div className="mb-3">
                  <h6>Itens Adicionados:</h6>
                  <ul className="list-group">
                    {itensOrcamento.map(item => (
                      <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                        {item.nome_item} - {item.quantidade} {item.unidade_medida} - {formatCurrency(item.subtotal)}
                        <div>
                          <button
                            type="button"
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEditarItemOrcamento(item)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoverItemOrcamento(item.id)}
                          >
                            Remover
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="fw-bold mt-2 text-end">
                    Total Parcial: {formatCurrency(itensOrcamento.reduce((sum, item) => sum + item.subtotal, 0))}
                  </p>
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="observacoes" className="form-label">Observações</label>
                <textarea
                  id="observacoes"
                  className="form-control"
                  rows="3"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                ></textarea>
              </div>

              {editId && ( // Mostra o campo de status apenas ao editar
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    id="status"
                    className="form-select"
                    value={statusOrcamento}
                    onChange={(e) => setStatusOrcamento(e.target.value)}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Rejeitado">Rejeitado</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-100">
                {editId ? 'Atualizar Orçamento' : 'Criar Orçamento'}
              </button>
              {editId && (
                <button
                  type="button"
                  className="btn btn-secondary w-100 mt-2"
                  onClick={resetForm}
                >
                  Cancelar Edição
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Lista de Orçamentos */}
        <div className="col-md-7">
          <div className="card p-4 shadow-lg">
            <h4>Lista de Orçamentos</h4>
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Filtros */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="filtroStatus" className="form-label visually-hidden">Filtrar por Status</label>
                <select
                  id="filtroStatus"
                  className="form-select"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <option value="">Todos os Status</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Rejeitado">Rejeitado</option>
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="filtroCliente" className="form-label visually-hidden">Filtrar por Cliente</label>
                <select
                  id="filtroCliente"
                  className="form-select"
                  value={filtroClienteId}
                  onChange={(e) => setFiltroClienteId(e.target.value)}
                >
                  <option value="">Todos os Clientes</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table className="table table-striped table-hover">
              <thead className="table-dark sticky-top">
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Data Criação</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentosFiltrados.length > 0 ? (
                  orcamentosFiltrados.map((orcamento) => (
                    <tr key={orcamento.id}>
                      <td>{orcamento.id}</td>
                      <td>{orcamento.cliente_nome || 'N/A'}</td>
                      <td>{formatarData(orcamento.data_criacao)}</td>
                      <td>{formatCurrency(orcamento.total_orcamento)}</td>
                      <td>
                        <span className={`badge bg-${
                          orcamento.status === 'Aprovado' ? 'success' :
                          orcamento.status === 'Rejeitado' ? 'danger' : 'warning'
                        }`}>
                          {orcamento.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                            <button
                                className="btn btn-sm btn-info me-2"
                                onClick={() => handleVerDetalhesOrcamento(orcamento.id)}
                            >
                                Detalhes
                            </button>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">Nenhum orçamento encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
            <p className="fw-bold mt-3">
              Total Acumulado (Aprovados):{' '}
              {formatCurrency(
                orcamentosFiltrados
                  .filter((o) => o.status === 'Aprovado')
                  .reduce((sum, o) => sum + o.total_orcamento, 0)
              )}
            </p>
          </div>

          {/* BLOCÃO DE DETALHES DO ORÇAMENTO (com Log de Cálculo) */}
          {orcamentoSelecionado && (
            <div className="card mt-4 p-4 shadow-lg">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Detalhes do Orçamento #{orcamentoSelecionado.id}</h5>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setOrcamentoSelecionado(null)}>
                        Fechar Detalhes
                    </button>
                </div>
                <p><strong>Cliente:</strong> {orcamentoSelecionado.cliente_nome}</p>
                <p><strong>Data de Criação:</strong> {formatarData(orcamentoSelecionado.data_criacao)}</p>
                <p><strong>Última Atualização:</strong> {formatarData(orcamentoSelecionado.data_atualizacao)}</p>
                <p><strong>Status:</strong> <span className={`badge bg-${
                    orcamentoSelecionado.status === 'Aprovado' ? 'success' :
                    orcamentoSelecionado.status === 'Rejeitado' ? 'danger' : 'warning'
                }`}>{orcamentoSelecionado.status}</span></p>
                {orcamentoSelecionado.observacoes && <p><strong>Observações:</strong> {orcamentoSelecionado.observacoes}</p>}

                <h6 className="mt-4">Itens do Orçamento:</h6>
                <div className="table-responsive">
                    <table className="table table-sm table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qtd.</th>
                                <th>Un. Med.</th>
                                <th>Preço Unit.</th>
                                <th>Subtotal</th>
                                <th>Log de Cálculo</th> {/* <--- NOVA COLUNA */}
                            </tr>
                        </thead>
                        <tbody>
                            {orcamentoSelecionado.itens.map(item => (
                                <tr key={item.id}>
                                    <td>{item.nome_item}</td>
                                    <td>{item.quantidade}</td>
                                    <td>{item.unidade_medida}</td>
                                    <td>{formatCurrency(item.preco_unitario_praticado)}</td>
                                    <td>{formatCurrency(item.subtotal)}</td>
                                    <td>
                                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8em', backgroundColor: '#f8f9fa', padding: '5px', borderRadius: '3px', margin: 0 }}>
                                            {item.log_calculo || 'N/A'}
                                        </pre>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="fw-bold mt-3 text-end">
                    Total do Orçamento: {formatCurrency(orcamentoSelecionado.total_orcamento)}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Orcamentos;