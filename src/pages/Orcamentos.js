// src/pages/Orcamentos.js
import React, { useState, useEffect } from 'react';
import ApiClient from '../components/api'; // Certifique-se de que o caminho está correto
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css'; // Seu CSS customizado

function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]); // Lista de orçamentos carregados do backend
  const [clientes, setClientes] = useState([]);     // Lista de clientes para o dropdown
  const [materiais, setMateriais] = useState([]);   // Lista de materiais para a calculadora

  // Estados para o formulário de criação/edição de orçamento
  const [editId, setEditId] = useState(null); // ID do orçamento sendo editado (null para novo)
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itensOrcamento, setItensOrcamento] = useState([]); // Itens adicionados ao orçamento atual

  // Estados para a calculadora de itens
  const [materialSelecionadoCalc, setMaterialSelecionadoCalc] = useState('');
  const [quantidadeCalc, setQuantidadeCalc] = useState('');

  // --- Funções de Formatação (Mantidas) ---
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Certifique-se de que o formato da data do backend é compatível.
    // Se o backend retornar 'YYYY-MM-DDTHH:MM:SS.sssZ', Date() funcionará.
    // Se for apenas 'YYYY-MM-DD', talvez precise de new Date(dateString + 'T00:00:00')
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  // --- Funções para Carregar Dados da API (Novas) ---
  const fetchOrcamentos = async () => {
    try {
      const response = await ApiClient.orcamentos.getAll();
      setOrcamentos(response.data);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error.response ? error.response.data : error);
      alert('Erro ao buscar orçamentos.');
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await ApiClient.clientes.getAll();
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error.response ? error.response.data : error);
      alert('Erro ao buscar clientes para o formulário.');
    }
  };

  const fetchMateriais = async () => {
    try {
      const response = await ApiClient.estoque.getAll(); // Supondo que 'estoque' é sua rota para materiais
      setMateriais(response.data);
    } catch (error) {
      console.error('Erro ao buscar materiais do estoque:', error.response ? error.response.data : error);
      alert('Erro ao buscar materiais do estoque.');
    }
  };

  // --- Efeito para Carregar Dados ao Iniciar o Componente (Nova) ---
  useEffect(() => {
    fetchOrcamentos();
    fetchClientes();
    fetchMateriais();
  }, []); // Array de dependências vazio para rodar apenas na montagem

  // --- Lógica da Calculadora e Itens do Orçamento (Adaptada para API) ---
  const handleAddItem = () => {
    if (!materialSelecionadoCalc || quantidadeCalc <= 0) {
      alert('Selecione um material e insira uma quantidade válida.');
      return;
    }

    const materialExistente = materiais.find(
      (m) => String(m.id) === String(materialSelecionadoCalc)
    );

    if (!materialExistente) {
      alert('Material selecionado não encontrado.');
      return;
    }

    const newItem = {
      material_id: materialExistente.id,
      nome_material: materialExistente.nome_item, // Usar nome_item do estoque
      quantidade: parseFloat(quantidadeCalc),
      preco_unitario_no_orcamento: materialExistente.preco_unitario, // Captura o preço no momento do orçamento
      total_item: parseFloat(quantidadeCalc) * materialExistente.preco_unitario,
    };

    // Verifica se o item já existe na lista de itens do orçamento
    const itemJaAdicionado = itensOrcamento.find(
      (item) => item.material_id === newItem.material_id
    );

    if (itemJaAdicionado) {
      // Se existir, atualiza a quantidade e o total
      setItensOrcamento(
        itensOrcamento.map((item) =>
          item.material_id === newItem.material_id
            ? {
                ...item,
                quantidade: item.quantidade + newItem.quantidade,
                total_item: item.total_item + newItem.total_item,
              }
            : item
        )
      );
    } else {
      // Caso contrário, adiciona um novo item
      setItensOrcamento([...itensOrcamento, newItem]);
    }

    // Limpa a calculadora
    setMaterialSelecionadoCalc('');
    setQuantidadeCalc('');
  };

  const handleRemoveItem = (materialId) => {
    setItensOrcamento(itensOrcamento.filter((item) => item.material_id !== materialId));
  };

  const calcularTotalGeral = () => {
    return itensOrcamento.reduce((total, item) => total + item.total_item, 0);
  };

  // --- Lógica de Submissão do Formulário (Criar/Editar) (Nova) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clienteSelecionadoId || itensOrcamento.length === 0) {
      alert('Selecione um cliente e adicione pelo menos um item ao orçamento.');
      return;
    }

    const orcamentoData = {
      cliente_id: parseInt(clienteSelecionadoId),
      observacoes,
      itens: itensOrcamento.map(item => ({
        material_id: item.material_id,
        quantidade: item.quantidade,
      })),
      // O total_orcamento será calculado no backend, não precisa enviar aqui
    };

    try {
      if (editId) {
        // Atualizar orçamento existente
        await ApiClient.orcamentos.update(editId, orcamentoData);
        alert('Orçamento atualizado com sucesso!');
      } else {
        // Criar novo orçamento
        await ApiClient.orcamentos.create(orcamentoData);
        alert('Orçamento criado com sucesso!');
      }
      fetchOrcamentos(); // Recarregar a lista de orçamentos após sucesso
      handleClearForm(); // Limpar o formulário
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error.response ? error.response.data : error);
      alert('Erro ao salvar orçamento: ' + (error.response?.data?.erro || 'Erro desconhecido.'));
    }
  };

  // --- Lógica de Edição (Nova) ---
  const handleEdit = (orcamento) => {
    if (orcamento.status !== 'Pendente') {
        alert('Não é possível editar orçamentos com status diferente de Pendente.');
        return;
    }
    setEditId(orcamento.id);
    setClienteSelecionadoId(orcamento.cliente_id);
    setObservacoes(orcamento.observacoes || '');
    // Mapear itens do orçamento para o formato do estado local, incluindo nome do material
    const itensComNomeMaterial = orcamento.itens.map(item => ({
        ...item,
        // Encontra o nome do material na lista de materiais carregados
        nome_material: materiais.find(m => m.id === item.material_id)?.nome_item || 'Material Desconhecido'
    }));
    setItensOrcamento(itensComNomeMaterial);
    // Rola a página para o topo para que o usuário veja o formulário preenchido
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Lógica de Exclusão (Nova) ---
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await ApiClient.orcamentos.delete(id);
        alert('Orçamento excluído com sucesso!');
        fetchOrcamentos(); // Recarregar a lista
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error.response ? error.response.data : error);
        alert('Erro ao excluir orçamento: ' + (error.response?.data?.erro || 'Erro desconhecido.'));
      }
    }
  };

  // --- Lógica de Aprovação/Rejeição (Nova) ---
  const handleAprovar = async (orcamento) => {
    if (orcamento.status === 'Aprovado') {
        alert('Este orçamento já está aprovado.');
        return;
    }
    if (window.confirm('Tem certeza que deseja APROVAR este orçamento?')) {
      try {
        await ApiClient.orcamentos.updateStatus(orcamento.id, 'Aprovado');
        alert('Orçamento aprovado com sucesso!');
        fetchOrcamentos(); // Recarregar a lista
      } catch (error) {
        console.error('Erro ao aprovar orçamento:', error.response ? error.response.data : error);
        alert('Erro ao aprovar orçamento: ' + (error.response?.data?.erro || 'Erro desconhecido.'));
      }
    }
  };

  const handleRejeitar = async (id) => {
    if (window.confirm('Tem certeza que deseja REJEITAR este orçamento?')) {
      try {
        await ApiClient.orcamentos.updateStatus(id, 'Rejeitado');
        alert('Orçamento rejeitado com sucesso!');
        fetchOrcamentos(); // Recarregar a lista
      } catch (error) {
        console.error('Erro ao rejeitar orçamento:', error.response ? error.response.data : error);
        alert('Erro ao rejeitar orçamento: ' + (error.response?.data?.erro || 'Erro desconhecido.'));
      }
    }
  };

  // --- Limpar Formulário (Nova) ---
  const handleClearForm = () => {
    setEditId(null);
    setClienteSelecionadoId('');
    setObservacoes('');
    setItensOrcamento([]);
    setMaterialSelecionadoCalc('');
    setQuantidadeCalc('');
  };

  // Usando orçamentos direto para o total, sem filtro por enquanto
  const orcamentosFiltrados = orcamentos;

  // --- Estrutura JSX (Mesma que a sua original, apenas com dados dinâmicos) ---
  return (
    <div className="container mt-5">
      <h2 className="mb-4">Gerenciamento de Orçamentos</h2>
      <div className="row">
        {/* Coluna do Formulário (Esquerda) */}
        <div className="col-md-4">
          <div className="card p-4 shadow-lg mb-4">
            <h4>{editId ? 'Editar Orçamento' : 'Novo Orçamento'}</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="cliente" className="form-label">
                  Cliente:
                </label>
                <select
                  className="form-control"
                  id="cliente"
                  value={clienteSelecionadoId}
                  onChange={(e) => setClienteSelecionadoId(e.target.value)}
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="observacoes" className="form-label">
                  Observações:
                </label>
                <textarea
                  className="form-control"
                  id="observacoes"
                  rows="3"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                ></textarea>
              </div>

              <h5>Itens do Orçamento:</h5>
              {itensOrcamento.length === 0 ? (
                <p>Nenhum item adicionado ao orçamento.</p>
              ) : (
                <ul className="list-group mb-3">
                  {itensOrcamento.map((item) => (
                    <li
                      key={item.material_id} // Use material_id como chave, é mais estável
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      {item.nome_material} - {item.quantidade} m² (
                      {formatCurrency(item.total_item)})
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveItem(item.material_id)}
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="fw-bold">
                Total do Orçamento: {formatCurrency(calcularTotalGeral())}
              </p>

              <hr />
              <h5>Adicionar Materiais:</h5>
              <div className="mb-3">
                <label htmlFor="materialCalc" className="form-label">
                  Material:
                </label>
                <select
                  className="form-control"
                  id="materialCalc"
                  value={materialSelecionadoCalc}
                  onChange={(e) => setMaterialSelecionadoCalc(e.target.value)}
                >
                  <option value="">Selecione um material</option>
                  {materiais.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.nome_item} ({material.unidade_media} - {formatCurrency(material.preco_unitario)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="quantidadeCalc" className="form-label">
                  Quantidade ({materiais.find(m => String(m.id) === materialSelecionadoCalc)?.unidade_media || 'm²'}):
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="quantidadeCalc"
                  value={quantidadeCalc}
                  onChange={(e) => setQuantidadeCalc(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <button
                type="button"
                className="btn btn-info mb-3 w-100"
                onClick={handleAddItem}
              >
                Adicionar Material
              </button>

              <button type="submit" className="btn btn-primary w-100 mt-3">
                {editId ? 'Atualizar Orçamento' : 'Criar Orçamento'}
              </button>
              {editId && (
                <button
                  type="button"
                  className="btn btn-secondary w-100 mt-2"
                  onClick={handleClearForm}
                >
                  Cancelar Edição
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Coluna da Tabela de Orçamentos (Direita) */}
        <div className="col-md-8">
          <div className="card p-4 shadow-lg">
            <h4>Lista de Orçamentos</h4>
            <table className="table table-striped">
              <thead>
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
                {orcamentosFiltrados.map((orcamento) => (
                  <tr key={orcamento.id}>
                    <td>{orcamento.id}</td>
                    <td>{orcamento.cliente_nome}</td> {/* Usar cliente_nome do serialize */}
                    <td>{formatDate(orcamento.data_criacao)}</td>
                    <td>{formatCurrency(orcamento.total_orcamento)}</td> {/* Usar total_orcamento */}
                    <td>
                      <span
                        className={`badge ${
                          orcamento.status === 'Aprovado'
                            ? 'bg-success'
                            : orcamento.status === 'Rejeitado'
                            ? 'bg-danger'
                            : 'bg-warning text-dark'
                        }`}
                      >
                        {orcamento.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex flex-column flex-md-row gap-2">
                        {orcamento.status === 'Pendente' && (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleEdit(orcamento)}
                          >
                            Editar
                          </button>
                        )}
                        {orcamento.status === 'Pendente' && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleAprovar(orcamento)}
                            >
                              Aprovar
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
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