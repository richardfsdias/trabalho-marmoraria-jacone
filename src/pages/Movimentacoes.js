// src/pages/Movimentacoes.js
import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import ApiClient from '../components/api'; // Ajuste o caminho se necessário

function Movimentacoes() {
  // Estado para o nome do item de estoque (o que o usuário digita)
  const [nomeItemInput, setNomeItemInput] = useState('');
  // Estado para o ID do item de estoque selecionado
  const [selectedItemId, setSelectedItemId] = useState(null);
  // Estado para a quantidade disponível do item selecionado
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState(0);
  // Estado para a quantidade da movimentação
  const [quantidadeMovimentacao, setQuantidadeMovimentacao] = useState('');
  // Estado para o tipo de movimentação (Entrada/Saída)
  const [tipoMovimentacao, setTipoMovimentacao] = useState('Entrada'); // Valor padrão do backend para status de Pedidos é 'Pendente' (Enum no backend)
  // Estado para a lista de movimentações registradas (do backend)
  const [movimentacoesList, setMovimentacoesList] = useState([]);
  // Estado para mensagens de erro
  const [erro, setErro] = useState('');
  // Estado para a lista de todos os itens de estoque (para sugestões e busca)
  const [itensEstoque, setItensEstoque] = useState([]);
  // Estado para as sugestões de itens de estoque
  const [sugestoesItens, setSugestoesItens] = useState([]);

  // Função para buscar todos os itens de estoque
  const fetchItensEstoque = useCallback(async () => {
    try {
      const response = await ApiClient.estoque.getAll();
      // Backend retorna: id, nome_item, tipo, quantidade, unidade_medida, preco_unitario
      // Vamos usar: id, nome_item, quantidade
      setItensEstoque(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar itens de estoque:", err);
      setErro(err.response?.data?.erro || "Falha ao buscar itens de estoque.");
    }
  }, []);

  // Função para buscar todas as movimentações de estoque
  const fetchMovimentacoes = useCallback(async () => {
    try {
      const response = await ApiClient.estoque.getAllMovimentacoes();
      // Backend retorna: id, item_id, nome_item, tipo_movimentacao, quantidade, data_movimentacao, observacoes
      setMovimentacoesList(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar movimentações:", err);
      setErro(err.response?.data?.erro || "Falha ao buscar movimentações.");
    }
  }, []);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchItensEstoque();
    fetchMovimentacoes();
  }, [fetchItensEstoque, fetchMovimentacoes]);

  // Manipula a entrada no campo de nome do item
  const handleNomeItemInput = (e) => {
    const valor = e.target.value;
    setNomeItemInput(valor);
    setSelectedItemId(null); // Reseta o ID selecionado se o usuário está digitando
    setQuantidadeDisponivel(0); // Reseta a quantidade disponível

    if (valor) {
      const sugestoes = itensEstoque
        .filter((item) => item.nome_item.toLowerCase().includes(valor.toLowerCase()))
        .slice(0, 10); // Limita o número de sugestões
      setSugestoesItens(sugestoes);
    } else {
      setSugestoesItens([]);
    }
  };

  // Manipula a seleção de um item da lista de sugestões
  const handleSelecionarItem = (item) => {
    setNomeItemInput(item.nome_item); // Preenche o input com o nome do item
    setSelectedItemId(item.id);        // Guarda o ID do item
    setQuantidadeDisponivel(item.quantidade); // Atualiza a quantidade disponível
    setSugestoesItens([]);             // Limpa as sugestões
  };

  const clearForm = () => {
    setNomeItemInput('');
    setSelectedItemId(null);
    setQuantidadeDisponivel(0);
    setQuantidadeMovimentacao('');
    setTipoMovimentacao('Entrada'); // Valor padrão do backend para status de Pedidos é 'Pendente'
    setSugestoesItens([]);
    setErro('');
  };

  // Manipula o envio do formulário de movimentação
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    const qtdMov = parseFloat(quantidadeMovimentacao);

    if (!selectedItemId) {
      setErro('Por favor, selecione um item da lista.');
      return;
    }
    if (isNaN(qtdMov) || qtdMov <= 0) {
      setErro('A quantidade da movimentação deve ser um número positivo.');
      return;
    }

    const itemSelecionado = itensEstoque.find(item => item.id === selectedItemId);
    if (!itemSelecionado) { // Checagem de segurança
        setErro('Item selecionado não encontrado na lista de estoque.');
        return;
    }
    
    if (tipoMovimentacao === 'Saída' && qtdMov > parseFloat(itemSelecionado.quantidade)) { // O backend valida se a quantidade em estoque é suficiente para saída
      setErro('Quantidade de saída excede o estoque disponível.');
      return;
    }

    const movimentacaoData = {
      item_id: selectedItemId,
      tipo_movimentacao: tipoMovimentacao, // 'Entrada' ou 'Saída' (Enum no backend)
      quantidade: qtdMov,
      // observacoes: "Opcional" // Pode adicionar um campo para isso se quiser
    };

    try {
      await ApiClient.estoque.createMovimentacao(movimentacaoData);
      // Após sucesso, limpar formulário e recarregar dados
      clearForm();
      fetchItensEstoque();  // Recarrega itens para atualizar quantidade disponível
      fetchMovimentacoes(); // Recarrega a lista de movimentações
    } catch (err) {
      console.error("Erro ao registrar movimentação:", err);
      setErro(err.response?.data?.erro || "Falha ao registrar movimentação.");
    }
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Gerenciar Movimentações de Estoque</h1>
      {erro && (
        <div className="alert alert-danger mt-3" role="alert">
          {erro}
        </div>
      )}
      <div className="row">
        <div className="col-12 col-md-6 mb-3">
          <form onSubmit={handleSubmit} className="card p-4 shadow-lg">
            <div className="mb-3 position-relative">
              <label className="form-label">Item do Estoque (ex: Mármore, Cimento)</label>
              <input
                type="text"
                className="form-control"
                value={nomeItemInput}
                onChange={handleNomeItemInput}
                placeholder="Digite o nome do item"
                required
              />
              {sugestoesItens.length > 0 && (
                <ul className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                  {sugestoesItens.map((sugestao) => (
                    <li
                      key={sugestao.id}
                      className="list-group-item list-group-item-action"
                      onClick={() => handleSelecionarItem(sugestao)}
                      style={{ cursor: 'pointer' }}
                    >
                      {sugestao.nome_item} ({sugestao.quantidade} {sugestao.unidade_medida || 'unid.'}) {/* 'unidade_medida' vem do backend */}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Quantidade Disponível</label>
              <input
                type="text"
                className="form-control"
                value={`${quantidadeDisponivel} ${itensEstoque.find(i => i.id === selectedItemId)?.unidade_medida || ''}`} /* 'unidade_medida' vem do backend */
                readOnly
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Quantidade da Movimentação</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={quantidadeMovimentacao}
                onChange={(e) => setQuantidadeMovimentacao(e.target.value)}
                placeholder="Ex: 10.5"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Tipo de Movimentação</label>
              <select
                className="form-select"
                value={tipoMovimentacao}
                onChange={(e) => setTipoMovimentacao(e.target.value)}
              >
                <option value="Entrada">Entrada</option>
                <option value="Saída">Saída</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Registrar Movimentação
            </button>
          </form>
        </div>
        <div className="col-12 col-md-6 mb-3">
          <div className="card p-4 shadow-lg bg-light">
            <h4>Lista de Movimentações Recentes</h4>
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table table-striped table-hover">
                <thead className="table-dark sticky-top">
                  <tr>
                    <th>Item</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Data</th>
                    {/* <th>Observações</th> */}
                  </tr>
                </thead>
                <tbody>
                  {movimentacoesList.length > 0 ? (
                    movimentacoesList.map((mov) => (
                      <tr key={mov.id}>
                        <td>{mov.nome_item}</td> {/* 'nome_item' é incluído na serialização de Movimentacoes_Estoque */}
                        <td>{mov.tipo_movimentacao}</td>
                        <td>{mov.quantidade}</td>
                        <td>{new Date(mov.data_movimentacao).toLocaleDateString()}</td> {/* 'data_movimentacao' vem do backend */}
                        {/* <td>{mov.observacoes}</td> */} {/* 'observacoes' vem do backend */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                        <td colSpan="4" className="text-center">Nenhuma movimentação registrada.</td>
                    </tr>
                  )}
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