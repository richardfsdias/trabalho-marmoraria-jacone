# Sistema de Marmoraria

## 📋 Descrição
Este é um sistema web desenvolvido para gerenciar as operações de uma marmoraria, como controle de estoque de mármores, cadastro de clientes, emissão de notas de venda e registro de movimentações (entradas e saídas de materiais). O projeto foi criado como parte de um trabalho acadêmico para a disciplina [NOME DA DISCIPLINA] do curso [NOME DO CURSO] na [NOME DA INSTITUIÇÃO].

O sistema permite:
- Autenticar usuários com login (em desenvolvimento, aguardando integração com backend).
- Gerenciar clientes (adicionar, editar, excluir e listar).
- Gerenciar mármores (adicionar, editar, excluir e listar com estoque e preço).
- Criar notas de venda com cálculo automático de preço (quantidade × preço por m²).
- Registrar movimentações de estoque (entradas e saídas).
- Exibir dados em tabelas organizadas com interface amigável.

## 🎯 Objetivos
O objetivo do projeto é desenvolver uma aplicação web que simule o gerenciamento de uma marmoraria, aplicando conceitos de:
- Desenvolvimento front-end com React.
- Integração com APIs REST (em desenvolvimento).
- Design de interfaces responsivas com Bootstrap.
- Gerenciamento de estado e navegação em aplicações web.
- Boas práticas de desenvolvimento (organização de código, modularidade).

## 🛠 Tecnologias Utilizadas
- **Front-end**:
  - React.js (para construção da interface e gerenciamento de estado).
  - React Router (para navegação entre páginas).
  - Bootstrap (para estilização e responsividade).
  - Axios (para chamadas HTTP ao backend, em desenvolvimento).
- **Outras ferramentas**:
  - Git/GitHub (controle de versão).
  - Node.js e npm (gerenciamento de dependências).
- **Backend** (em desenvolvimento por outro integrante):
  - APIs RESTful (aguardando endpoints para integração).
  - Banco de dados (a definir, ex.: MySQL, MongoDB).

## 📂 Estrutura do Projeto
- `src/pages/`: Contém as páginas do sistema (Login, Notas, Clientes, Mármores, Movimentações).
- `src/components/`: Componentes reutilizáveis (ex.: Navbar).
- `src/services/`: Configuração para chamadas ao backend (Axios).
- `src/App.js`: Componente principal com rotas.
- `src/App.css`: Estilos globais (fundo de mármore, cartões, etc.).

## 🚀 Como Executar o Projeto
Siga os passos abaixo para rodar o sistema localmente:

### Pré-requisitos
- Node.js (versão 16 ou superior) instalado.
- Git instalado.
- Um editor de código (ex.: VS Code).

### Passos
1. **Clone o repositório**:
   ```bash
   git clone https://github.com/[SEU_USUARIO]/[NOME_DO_REPOSITORIO].git
   cd [NOME_DO_REPOSITORIO]
