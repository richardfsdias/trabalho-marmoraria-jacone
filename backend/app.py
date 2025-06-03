# -*- coding: utf-8 -*-
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, decode_token
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate
import os
from dotenv import load_dotenv
from sqlalchemy import Enum
from sqlalchemy.exc import IntegrityError
import re
# from mangum import Mangum

# Inicializa o Flask
app = Flask(__name__)

# Configuração do CORS
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
}})

# Configuração do MySQL via variáveis de ambiente
load_dotenv()
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL',
                                                'mysql+pymysql://root:admin@127.0.0.1/marmorariateste?charset=utf8mb4')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa o banco de dados
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Configuração do JWT
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key')
jwt = JWTManager(app)

# --- VERIFIQUE ESTAS CONFIGURAÇÕES JWT CRÍTICAS ---
@jwt.user_identity_loader
def user_identity_lookup(user_id):
    """
    Esta função é chamada quando um token é criado (create_access_token).
    Ela define qual valor será usado como 'subject' no token JWT.
    Garantimos que seja uma string.
    """
    print(f"DEBUG JWT - user_identity_lookup: Recebido user_id={user_id}, Tipo={type(user_id)}")
    return str(user_id) # Garante que o ID do usuário (que é um int) é convertido para string

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    """
    Esta função é chamada quando jwt_required() é usado para verificar um token.
    Ela recebe os dados do token (incluindo o 'sub' que definimos) e deve retornar o objeto do usuário.
    """
    identity = jwt_data["sub"]
    print(f"DEBUG JWT - user_lookup_callback: Subject do token={identity}, Tipo={type(identity)}")
    # Converte a identidade de volta para o tipo esperado (int para IDs de banco de dados)
    try:
        user_id = int(identity)
        user = Funcionarios.query.get(user_id)
        print(f"DEBUG JWT - user_lookup_callback: Usuário encontrado: {user.email if user else 'Nenhum'}")
        return user
    except ValueError:
        print(f"DEBUG JWT - user_lookup_callback: Erro de conversão de identidade: '{identity}' não é um inteiro.")
        return None
# --- FIM DAS NOVAS CONFIGURAÇÕES JWT ---


# Modelos do Banco de Dados (Certifique-se de que a coluna 'telefone' em Clientes é VARCHAR(15))
class Marmores(db.Model):
    __tablename__ = 'marmores'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(100), nullable=False)
    preco_m2 = db.Column(db.Numeric(10, 2), nullable=False)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False, default=0.0)

    def serialize(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'preco_m2': float(self.preco_m2),
            'quantidade': float(self.quantidade)
        }

class Funcionarios(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False)

    def __repr__(self):
        return f'<Funcionario {self.nome}>'

    def set_password(self, password):
        self.senha_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.senha_hash, password)

    def serialize(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'cpf': self.cpf
        }

class Clientes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    telefone = db.Column(db.String(15), nullable=False) # <--- GARANTA QUE ESTÁ COM TAMANHO 15
    data_cadastro = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())

    def __repr__(self):
        return f'<Cliente {self.nome}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'telefone': self.telefone,
            'data_cadastro': self.data_cadastro.isoformat() if self.data_cadastro else None
        }

    # Adicionar serialize para consistência com outras rotas, se necessário
    def serialize(self):
        return self.to_dict()

class Pedidos(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    tipo_marmore = db.Column(db.String(100), nullable=False)
    metragem = db.Column(db.Numeric(10, 2), nullable=False)
    preco_total = db.Column(db.Numeric(10, 2), nullable=False)
    data_pedido = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    status = db.Column(db.Enum('Pendente', 'Aprovado', 'Rejeitado', 'Concluído'), server_default='Pendente')

    cliente = db.relationship('Clientes', backref=db.backref('pedidos', lazy=True))

    def serialize(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'nome_cliente': self.cliente.nome, # Adicionado nome do cliente
            'tipo_marmore': self.tipo_marmore,
            'metragem': float(self.metragem),
            'preco_total': float(self.preco_total),
            'data_pedido': self.data_pedido.isoformat(),
            'status': self.status
        }

class Pagamentos(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=False)
    valor = db.Column(db.Numeric(10, 2), nullable=False)
    data_pagamento = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    metodo_pagamento = db.Column(db.String(50), nullable=False)

    pedido = db.relationship('Pedidos', backref=db.backref('pagamentos', lazy=True))

    def serialize(self):
        return {
            'id': self.id,
            'pedido_id': self.pedido_id,
            'valor': float(self.valor),
            'data_pagamento': self.data_pagamento.isoformat(),
            'metodo_pagamento': self.metodo_pagamento
        }

class Entregas(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=False)
    data_entrega = db.Column(db.Date, nullable=False)
    endereco_entrega = db.Column(db.String(200), nullable=False)
    status = db.Column(db.Enum('Pendente', 'Em Rota', 'Entregue', 'Atrasado'), server_default='Pendente')

    pedido = db.relationship('Pedidos', backref=db.backref('entregas', lazy=True))

    def serialize(self):
        return {
            'id': self.id,
            'pedido_id': self.pedido_id,
            'data_entrega': self.data_entrega.isoformat(),
            'endereco_entrega': self.endereco_entrega,
            'status': self.status
        }

class Estoque(db.Model):
    __tablename__ = 'estoque'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    quantidade = db.Column(db.Float, nullable=False)
    unidade_medida = db.Column(db.String(20), nullable=False)
    preco_unitario = db.Column(db.Float, nullable=False)
    # tipo = db.Column(db.String(50), nullable=True) # REMOVA OU COMENTE ESTA LINHA
    data_cadastro = db.Column(db.DateTime, default=db.func.current_timestamp())
    data_atualizacao = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def serialize(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'quantidade': float(self.quantidade),
            'unidade_medida': self.unidade_medida,
            'preco_unitario': float(self.preco_unitario),
            # 'tipo': self.tipo, # REMOVA OU COMENTE ESTA LINHA
            'data_cadastro': self.data_cadastro.isoformat(),
            'data_atualizacao': self.data_atualizacao.isoformat()
        }

class Movimentacoes_Estoque(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('estoque.id'), nullable=False)
    tipo_movimentacao = db.Column(db.Enum('Entrada', 'Saída'), nullable=False)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    data_movimentacao = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    observacoes = db.Column(db.String(255))

    item = db.relationship('Estoque', backref=db.backref('movimentacoes', lazy=True))

    def serialize(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'nome_item': self.item.nome_item, # Adicionado nome do item
            'tipo_movimentacao': self.tipo_movimentacao,
            'quantidade': float(self.quantidade),
            'data_movimentacao': self.data_movimentacao.isoformat(),
            'observacoes': self.observacoes
        }
    
class Orcamentos(db.Model):
    __tablename__ = 'orcamentos'
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    data_criacao = db.Column(db.DateTime, default=db.func.current_timestamp())
    data_atualizacao = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    total_orcamento = db.Column(db.Float, nullable=False)
    observacoes = db.Column(db.String(500))
    status = db.Column(Enum('Pendente', 'Aprovado', 'Rejeitado', name='orcamento_status'), default='Pendente')

    # Relacionamento com Cliente
    cliente = db.relationship('Clientes', backref='orcamentos_rel')
    # Relacionamento com ItensOrcamento
    itens = db.relationship('ItensOrcamento', backref='orcamento', cascade='all, delete-orphan', lazy=True) # Adicionado

    def serialize(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'nome_cliente': self.cliente.nome, # Adicionado para facilitar no frontend
            'data_criacao': self.data_criacao.isoformat(),
            'data_atualizacao': self.data_atualizacao.isoformat(),
            'total_orcamento': float(self.total_orcamento), # Garante que é float para JSON
            'observacoes': self.observacoes,
            'status': self.status,
            'itens': [item.serialize() for item in self.itens] # Inclui os itens do orçamento
        }

class ItensOrcamento(db.Model):
    __tablename__ = 'itens_orcamento'
    id = db.Column(db.Integer, primary_key=True)
    orcamento_id = db.Column(db.Integer, db.ForeignKey('orcamentos.id'), nullable=False)
    item_estoque_id = db.Column(db.Integer, db.ForeignKey('estoque.id'), nullable=False)
    quantidade = db.Column(db.Float, nullable=False)
    preco_unitario_no_orcamento = db.Column(db.Float, nullable=False) # Preço do item no momento da criação do orçamento

    # Relacionamento com Estoque para obter o nome do item
    item_estoque = db.relationship('Estoque', backref='itens_orcamento_rel')

    def serialize(self):
        return {
            'id': self.id,
            'orcamento_id': self.orcamento_id,
            'item_estoque_id': self.item_estoque_id,
            # Garanta que self.item_estoque existe e tem 'nome' e 'unidade_medida'
            'nome_item': self.item_estoque.nome, # <-- Aqui o erro estava acontecendo
            'unidade_medida': self.item_estoque.unidade_medida, # <-- E aqui
            'quantidade': self.quantidade,
            'preco_unitario_no_orcamento': float(self.preco_unitario_no_orcamento)
        }
    


# Rotas da API
@app.route('/login', methods=['POST'])
def login():
    email = request.json.get('email', None)
    senha = request.json.get('senha', None)

    funcionario = Funcionarios.query.filter_by(email=email).first()

    if not funcionario or not funcionario.check_password(senha):
        return jsonify({"erro": "Email ou senha inválidos"}), 401

    access_token = create_access_token(identity=funcionario.id)
    print(f"DEBUG FLASK - Token de acesso criado para o funcionário ID: {funcionario.id}")
    return jsonify(access_token=access_token), 200

# Adicionar um novo funcionário
@app.route('/funcionarios/cadastro', methods=['POST'])
def add_funcionario():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    cpf = data.get('cpf')

    if not all([nome, email, senha, cpf]):
        return jsonify({"erro": "Todos os campos (nome, email, senha, cpf) são obrigatórios."}), 400

    # Validação de formato de email básico
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"erro": "Formato de email inválido."}), 400

    # Validação de força de senha (mínimo 8 caracteres, maiúscula, minúscula, número, especial)
    if len(senha) < 8:
        return jsonify({"erro": "A senha deve ter pelo menos 8 caracteres."}), 400
    if not re.search(r'[A-Z]', senha):
        return jsonify({"erro": "A senha deve conter pelo menos uma letra maiúscula."}), 400
    if not re.search(r'[a-z]', senha):
        return jsonify({"erro": "A senha deve conter pelo menos uma letra minúscula."}), 400
    if not re.search(r'[0-9]', senha):
        return jsonify({"erro": "A senha deve conter pelo menos um número."}), 400
    if not re.search(r'[!@#$%^&*(),.?":{}|<>\-_+]', senha): # Adicionei '_' '+' '-'
        return jsonify({"erro": "A senha deve conter pelo menos um caractere especial (!@#$%^&*(),.?:{}|<>_+-)."}), 400


    try:
        # Verifica se o email ou CPF já existem antes de tentar adicionar
        if Funcionarios.query.filter_by(email=email).first():
            return jsonify({"erro": "Este email já está cadastrado."}), 409 # Conflict
        cleaned_cpf = re.sub(r'\D', '', cpf)
        if Funcionarios.query.filter_by(cpf=cleaned_cpf).first():
            return jsonify({"erro": "Este CPF já está cadastrado."}), 409 # Conflict
        if len(cleaned_cpf) != 11:
            return jsonify({"erro": "CPF deve conter exatamente 11 dígitos numéricos."}), 400


        novo_funcionario = Funcionarios(nome=nome, email=email, cpf=cleaned_cpf)
        novo_funcionario.set_password(senha)
        db.session.add(novo_funcionario)
        db.session.commit()
        return jsonify({"message": "Funcionário cadastrado com sucesso!"}), 201
    except IntegrityError as e:
        db.session.rollback()
        # Captura erros de duplicidade que podem passar pela verificação inicial (race condition)
        if "Duplicate entry" in str(e):
            if "email" in str(e):
                return jsonify({"erro": "Este email já está cadastrado."}), 409
            elif "cpf" in str(e):
                return jsonify({"erro": "Este CPF já está cadastrado."}), 409
        return jsonify({"erro": "Erro ao cadastrar funcionário. Verifique os dados."}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

# Rotas para Clientes
@app.route('/clientes', methods=['GET'])
@jwt_required()
def get_clientes():
    try:
        current_user_id = get_jwt_identity()
        print(f"DEBUG FLASK - GET Clientes: Cliente ID atual: {current_user_id}")

        clientes = Clientes.query.all()
        serialized_clientes = [cliente.to_dict() for cliente in clientes] # Usar to_dict para consistência
        return jsonify(serialized_clientes), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao listar clientes: {str(e)}"}), 500

@app.route('/clientes/<int:id>', methods=['GET'])
@jwt_required()
def get_cliente(id):
    try:
        cliente = Clientes.query.get(id)
        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404
        return jsonify(cliente.to_dict()), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/clientes', methods=['POST'])
@jwt_required()
def add_cliente():
    current_user_id = get_jwt_identity()
    print(f"DEBUG FLASK - POST Clientes: Cliente ID atual: {current_user_id}")

    try:
        data = request.get_json()
        print(f"DEBUG FLASK - Dados recebidos para adicionar cliente: {data}")

        nome = data.get('nome')
        cpf = data.get('cpf')
        telefone = data.get('telefone')

        # 1. Validação de campos obrigatórios
        if not all([nome, cpf, telefone]):
            print("DEBUG FLASK - Erro: Campos obrigatórios ausentes.")
            return jsonify({"erro": "Nome, CPF e Telefone são obrigatórios."}), 400

        # 2. Limpeza e validação do CPF
        cleaned_cpf = re.sub(r'\D', '', cpf)
        print(f"DEBUG FLASK - CPF limpo: {cleaned_cpf}")
        if len(cleaned_cpf) != 11:
            print("DEBUG FLASK - Erro: CPF deve conter exatamente 11 dígitos.")
            return jsonify({"erro": "CPF deve conter exatamente 11 dígitos."}), 400

        # 3. Limpeza e validação do Telefone
        cleaned_telefone = re.sub(r'\D', '', telefone)
        print(f"DEBUG FLASK - Telefone limpo: {cleaned_telefone}")
        # Aumentei a faixa de validação para permitir números com e sem DDD (8 a 11 dígitos)
        if not (8 <= len(cleaned_telefone) <= 11):
            print("DEBUG FLASK - Erro: Telefone deve conter entre 8 e 11 dígitos numéricos.")
            return jsonify({"erro": "Telefone deve conter entre 8 e 11 dígitos numéricos."}), 400

        # Verifica se o CPF já existe
        cliente_existente = Clientes.query.filter_by(cpf=cleaned_cpf).first()
        if cliente_existente:
            print("DEBUG FLASK - Erro: CPF já cadastrado.")
            return jsonify({"erro": "CPF já cadastrado."}), 409 # Conflict

        novo_cliente = Clientes(nome=nome, cpf=cleaned_cpf, telefone=cleaned_telefone)
        db.session.add(novo_cliente)
        db.session.commit()
        print("DEBUG FLASK - Cliente adicionado com sucesso.")
        return jsonify(novo_cliente.to_dict()), 201
    except IntegrityError as e:
        db.session.rollback()
        if "Duplicate entry" in str(e) and "cpf" in str(e):
             print(f"DEBUG FLASK - Erro de integridade: CPF duplicado. {str(e)}")
             return jsonify({"erro": "CPF já cadastrado."}), 409
        print(f"DEBUG FLASK - Erro de integridade desconhecido: {str(e)}")
        return jsonify({"erro": "Erro de integridade no banco de dados."}), 500
    except Exception as e:
        db.session.rollback()
        print(f"DEBUG FLASK - Erro interno do servidor ao adicionar cliente: {str(e)}")
        return jsonify({"erro": f"Erro interno do servidor: {str(e)}"}), 500

@app.route('/clientes/<int:id>', methods=['PUT'])
@jwt_required()
def update_cliente(id):
    current_user_id = get_jwt_identity()
    print(f"DEBUG FLASK - PUT Clientes: Cliente ID atual: {current_user_id}")
    try:
        cliente = Clientes.query.get(id)
        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404

        data = request.get_json()
        print(f"DEBUG FLASK - Dados recebidos para atualizar cliente (ID: {id}): {data}")

        nome = data.get('nome', cliente.nome)
        cpf = data.get('cpf', cliente.cpf)
        telefone = data.get('telefone', cliente.telefone)

        # 1. Limpeza e validação do CPF
        cleaned_cpf = re.sub(r'\D', '', cpf)
        print(f"DEBUG FLASK - CPF limpo (PUT): {cleaned_cpf}")
        if len(cleaned_cpf) != 11:
            print("DEBUG FLASK - Erro (PUT): CPF deve conter exatamente 11 dígitos.")
            return jsonify({"erro": "CPF deve conter exatamente 11 dígitos."}), 400

        # 2. Limpeza e validação do Telefone
        cleaned_telefone = re.sub(r'\D', '', telefone)
        print(f"DEBUG FLASK - Telefone limpo (PUT): {cleaned_telefone}")
        if not (8 <= len(cleaned_telefone) <= 11):
            print("DEBUG FLASK - Erro (PUT): Telefone deve conter entre 8 e 11 dígitos numéricos.")
            return jsonify({"erro": "Telefone deve conter entre 8 e 11 dígitos numéricos."}), 400

        # Verifica se o CPF foi alterado e se o novo CPF já existe
        if cleaned_cpf != cliente.cpf:
            cliente_existente = Clientes.query.filter_by(cpf=cleaned_cpf).first()
            if cliente_existente and cliente_existente.id != id: # Garante que não é o próprio cliente
                print("DEBUG FLASK - Erro (PUT): Novo CPF já cadastrado para outro cliente.")
                return jsonify({"erro": "CPF já cadastrado para outro cliente."}), 409

        cliente.nome = nome
        cliente.cpf = cleaned_cpf
        cliente.telefone = cleaned_telefone
        db.session.commit()
        print("DEBUG FLASK - Cliente atualizado com sucesso (PUT).")
        return jsonify(cliente.to_dict()), 200
    except IntegrityError as e:
        db.session.rollback()
        if "Duplicate entry" in str(e) and "cpf" in str(e):
             print(f"DEBUG FLASK - Erro de integridade (PUT): CPF duplicado. {str(e)}")
             return jsonify({"erro": "CPF já cadastrado."}), 409
        print(f"DEBUG FLASK - Erro de integridade desconhecido (PUT): {str(e)}")
        return jsonify({"erro": "Erro de integridade no banco de dados."}), 500
    except Exception as e:
        db.session.rollback()
        print(f"DEBUG FLASK - Erro interno do servidor ao atualizar cliente (PUT): {str(e)}")
        return jsonify({"erro": f"Erro interno do servidor: {str(e)}"}), 500

@app.route('/clientes/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_cliente(id):
    current_user_id = get_jwt_identity()
    print(f"DEBUG FLASK - DELETE Clientes: Cliente ID atual: {current_user_id}")
    try:
        cliente = Clientes.query.get(id)
        if not cliente:
            return jsonify({"erro": "Cliente não encontrado"}), 404
        db.session.delete(cliente)
        db.session.commit()
        return jsonify({"message": "Cliente excluído com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

# Rotas para Marmores (não alteradas)
@app.route('/marmores', methods=['GET'])
@jwt_required()
def get_marmores():
    try:
        marmores = Marmores.query.all()
        return jsonify([marmore.serialize() for marmore in marmores]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/marmores', methods=['POST'])
@jwt_required()
def add_marmore():
    data = request.get_json()
    nome = data.get('nome')
    preco_m2 = data.get('preco_m2')
    quantidade = data.get('quantidade')

    if not all([nome, preco_m2 is not None, quantidade is not None]):
        return jsonify({"erro": "Nome, preco_m2 e quantidade são obrigatórios."}), 400

    try:
        novo_marmore = Marmores(nome=nome, preco_m2=float(preco_m2), quantidade=float(quantidade))
        db.session.add(novo_marmore)
        db.session.commit()
        return jsonify(novo_marmore.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/marmores/<int:id>', methods=['PUT'])
@jwt_required()
def update_marmore(id):
    try:
        marmore = Marmores.query.get(id)
        if not marmore:
            return jsonify({"erro": "Mármore não encontrado"}), 404

        data = request.get_json()
        marmore.nome = data.get('nome', marmore.nome)
        marmore.preco_m2 = float(data.get('preco_m2', marmore.preco_m2))
        marmore.quantidade = float(data.get('quantidade', marmore.quantidade))
        db.session.commit()
        return jsonify(marmore.serialize()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/marmores/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_marmore(id):
    try:
        marmore = Marmores.query.get(id)
        if not marmore:
            return jsonify({"erro": "Mármore não encontrado"}), 404
        db.session.delete(marmore)
        db.session.commit()
        return jsonify({"message": "Mármore excluído com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500


# Rotas para Orçamentos (Pedidos)
@app.route('/orcamentos', methods=['GET'])
@jwt_required()
def get_orcamentos():
    try:
        orcamentos = Orcamentos.query.all()
        return jsonify([orcamento.serialize() for orcamento in orcamentos]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/orcamentos/<int:id>', methods=['GET'])
@jwt_required()
def get_orcamento(id):
    try:
        orcamento = Orcamentos.query.get(id)
        if not orcamento:
            return jsonify({"erro": "Orçamento não encontrado."}), 404
        return jsonify(orcamento.serialize()), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/orcamentos', methods=['POST'])
@jwt_required()
def create_orcamento():
    data = request.get_json()
    cliente_id = data.get('cliente_id')
    observacoes = data.get('observacoes')
    itens_orcamento_data = data.get('itens', []) # Lista de dicionários para os itens

    if not cliente_id or not itens_orcamento_data:
        return jsonify({"erro": "Cliente e itens do orçamento são obrigatórios."}), 400

    try:
        # Verifica se o cliente existe
        cliente = Clientes.query.get(cliente_id)
        if not cliente:
            return jsonify({"erro": "Cliente não encontrado."}), 404

        total_orcamento_calculado = 0
        novos_itens_orcamento = []

        for item_data in itens_orcamento_data:
            item_estoque_id = item_data.get('item_estoque_id')
            quantidade = item_data.get('quantidade')
            preco_unitario = item_data.get('preco_unitario_no_orcamento') # Recebe o preço calculado do frontend

            if not item_estoque_id or not quantidade or not preco_unitario:
                db.session.rollback()
                return jsonify({"erro": "Todos os itens do orçamento devem ter item_estoque_id, quantidade e preco_unitario_no_orcamento."}), 400

            # Verifica se o item de estoque existe
            item_estoque = Estoque.query.get(item_estoque_id)
            if not item_estoque:
                db.session.rollback()
                return jsonify({"erro": f"Item de estoque com ID {item_estoque_id} não encontrado."}), 404

            # O preço unitário já vem do frontend, que deve tê-lo obtido do estoque no momento da adição do item
            # Aqui, apenas o utilizamos para o cálculo do total e para armazenar
            total_item = float(quantidade) * float(preco_unitario)
            total_orcamento_calculado += total_item

            novo_item = ItensOrcamento(
                item_estoque_id=item_estoque_id,
                quantidade=float(quantidade),
                preco_unitario_no_orcamento=float(preco_unitario)
            )
            novos_itens_orcamento.append(novo_item)

        nova_orcamento = Orcamentos(
            cliente_id=cliente_id,
            observacoes=observacoes,
            total_orcamento=total_orcamento_calculado,
            itens=novos_itens_orcamento # Adiciona os itens ao orçamento
        )

        db.session.add(nova_orcamento)
        db.session.commit()
        return jsonify(nova_orcamento.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/orcamentos/<int:id>', methods=['PUT'])
@jwt_required()
def update_orcamento(id):
    orcamento = Orcamentos.query.get(id)
    if not orcamento:
        return jsonify({"erro": "Orçamento não encontrado."}), 404

    data = request.get_json()
    cliente_id = data.get('cliente_id')
    observacoes = data.get('observacoes')
    status = data.get('status')
    itens_orcamento_data = data.get('itens', [])

    try:
        if cliente_id:
            cliente = Clientes.query.get(cliente_id)
            if not cliente:
                return jsonify({"erro": "Cliente não encontrado."}), 404
            orcamento.cliente_id = cliente_id
        if observacoes is not None:
            orcamento.observacoes = observacoes
        if status:
            if status not in ['Pendente', 'Aprovado', 'Rejeitado']:
                return jsonify({"erro": "Status inválido. Use 'Pendente', 'Aprovado' ou 'Rejeitado'."}), 400
            orcamento.status = status

        # Atualiza os itens do orçamento
        if itens_orcamento_data is not None:
            # Remove itens antigos
            for item in orcamento.itens:
                db.session.delete(item)
            db.session.flush() # Garante que os itens deletados são removidos da sessão

            total_orcamento_recalculado = 0
            novos_itens_orcamento = []

            for item_data in itens_orcamento_data:
                item_estoque_id = item_data.get('item_estoque_id')
                quantidade = item_data.get('quantidade')
                preco_unitario = item_data.get('preco_unitario_no_orcamento')

                if not item_estoque_id or not quantidade or not preco_unitario:
                    db.session.rollback()
                    return jsonify({"erro": "Todos os itens do orçamento devem ter item_estoque_id, quantidade e preco_unitario_no_orcamento."}), 400

                item_estoque = Estoque.query.get(item_estoque_id)
                if not item_estoque:
                    db.session.rollback()
                    return jsonify({"erro": f"Item de estoque com ID {item_estoque_id} não encontrado."}), 404

                total_item = float(quantidade) * float(preco_unitario)
                total_orcamento_recalculado += total_item

                novo_item = ItensOrcamento(
                    item_estoque_id=item_estoque_id,
                    quantidade=float(quantidade),
                    preco_unitario_no_orcamento=float(preco_unitario),
                    orcamento=orcamento # Associa ao orçamento existente
                )
                novos_itens_orcamento.append(novo_item)

            orcamento.itens = novos_itens_orcamento
            orcamento.total_orcamento = total_orcamento_recalculado

        db.session.commit()
        return jsonify(orcamento.serialize()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/orcamentos/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_orcamento(id):
    try:
        orcamento = Orcamentos.query.get(id)
        if not orcamento:
            return jsonify({"erro": "Orçamento não encontrado."}), 404

        db.session.delete(orcamento) # O cascade 'all, delete-orphan' cuidará dos ItensOrcamento
        db.session.commit()
        return jsonify({"mensagem": "Orçamento excluído com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/orcamentos/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_orcamento_status(id):
    orcamento = Orcamentos.query.get(id)
    if not orcamento:
        return jsonify({"erro": "Orçamento não encontrado."}), 404

    data = request.get_json()
    status = data.get('status')

    if not status:
        return jsonify({"erro": "Status é obrigatório."}), 400

    if status not in ['Pendente', 'Aprovado', 'Rejeitado']:
        return jsonify({"erro": "Status inválido. Use 'Pendente', 'Aprovado' ou 'Rejeitado'."}), 400

    try:
        # Lógica para movimentação de estoque APENAS se o status mudar para 'Aprovado'
        if status == 'Aprovado' and orcamento.status != 'Aprovado':
            for item_orcamento in orcamento.itens:
                item_estoque = Estoque.query.get(item_orcamento.item_estoque_id)
                if not item_estoque:
                    db.session.rollback()
                    return jsonify({"erro": f"Item de estoque {item_orcamento.item_estoque_id} não encontrado para movimentação."}), 404

                if item_estoque.quantidade < item_orcamento.quantidade:
                    db.session.rollback()
                    return jsonify({"erro": f"Quantidade insuficiente em estoque para o item '{item_estoque.nome}'. Disponível: {item_estoque.quantidade}, Necessário: {item_orcamento.quantidade}"}), 400

                # Cria uma movimentação de saída
                nova_movimentacao = Movimentacoes_Estoque(
                    item_id=item_estoque.id,
                    tipo_movimentacao='Saída',
                    quantidade=item_orcamento.quantidade,
                    observacoes=f"Saída por aprovação do Orçamento #{orcamento.id}"
                )
                db.session.add(nova_movimentacao)

                # Atualiza a quantidade do item no estoque
                item_estoque.quantidade -= item_orcamento.quantidade
                item_estoque.data_atualizacao = db.func.current_timestamp()

        # Se o status mudar de Aprovado para outro (ex: Rejeitado ou Pendente), reverter o estoque?
        # Esta é uma decisão de negócio. Por simplicidade, não faremos a reversão automática aqui.
        # Caso precise, você pode adicionar a lógica de "Entrada" reversa aqui.

        orcamento.status = status
        db.session.commit()
        return jsonify(orcamento.serialize()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500


@app.route('/estoque', methods=['GET'])
@jwt_required()
def listar_estoque():
    try:
        estoque_items = Estoque.query.all()
        return jsonify([item.serialize() for item in estoque_items]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/estoque', methods=['POST'])
@jwt_required()
def add_estoque_item():
    data = request.get_json()
    # Certifique-se de que todos os campos obrigatórios estão presentes
    if not all(k in data for k in ['nome', 'quantidade', 'unidade_medida', 'preco_unitario']):
        return jsonify({'erro': 'Nome, quantidade, unidade de medida e preço unitário são obrigatórios.'}), 400

    try:
        novo_item = Estoque(
            nome=data['nome'],
            quantidade=float(data['quantidade']),
            unidade_medida=data['unidade_medida'],
            preco_unitario=float(data['preco_unitario']),
            # tipo=data.get('tipo', None) # REMOVA OU COMENTE ESTA LINHA
        )
        db.session.add(novo_item)
        db.session.commit()
        return jsonify(novo_item.serialize()), 201
    except ValueError:
        db.session.rollback()
        return jsonify({'erro': 'Quantidade ou preço unitário inválidos.'}), 400
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro de integridade: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


# Rota para atualizar um item do estoque
@app.route('/estoque/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_estoque_item(item_id):
    item = Estoque.query.get_or_404(item_id)
    data = request.get_json()

    try:
        item.nome = data.get('nome', item.nome)
        item.quantidade = float(data.get('quantidade', item.quantidade))
        item.unidade_medida = data.get('unidade_medida', item.unidade_medida)
        item.preco_unitario = float(data.get('preco_unitario', item.preco_unitario))
        # item.tipo = data.get('tipo', item.tipo) # REMOVA OU COMENTE ESTA LINHA
        item.data_atualizacao = db.func.current_timestamp()

        db.session.commit()
        return jsonify(item.serialize()), 200
    except ValueError:
        db.session.rollback()
        return jsonify({'erro': 'Quantidade ou preço unitário inválidos.'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500

@app.route('/estoque/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_estoque_item(id):
    try:
        item = Estoque.query.get(id)
        if not item:
            return jsonify({"erro": "Item de estoque não encontrado"}), 404
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Item de estoque excluído com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/movimentacoes_estoque', methods=['GET'])
@jwt_required()
def get_movimentacoes_estoque():
    try:
        movimentacoes = Movimentacoes_Estoque.query.all()
        return jsonify([mov.serialize() for mov in movimentacoes]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/movimentacoes_estoque', methods=['POST'])
@jwt_required()
def add_movimentacao_estoque():
    data = request.get_json()
    item_id = data.get('item_id')
    tipo_movimentacao = data.get('tipo_movimentacao')
    quantidade = data.get('quantidade')
    observacoes = data.get('observacoes')

    if not all([item_id, tipo_movimentacao, quantidade is not None]):
        return jsonify({"erro": "Item, tipo de movimentação e quantidade são obrigatórios."}), 400
    try:
        item_estoque = Estoque.query.get(item_id)
        if not item_estoque:
            return jsonify({"erro": "Item de estoque não encontrado."}), 404

        if tipo_movimentacao == 'Saída' and float(quantidade) > float(item_estoque.quantidade):
            return jsonify({"erro": "Quantidade em estoque insuficiente para esta saída."}), 400

        nova_movimentacao = Movimentacoes_Estoque(
            item_id=item_id,
            tipo_movimentacao=tipo_movimentacao,
            quantidade=float(quantidade),
            observacoes=observacoes
        )
        db.session.add(nova_movimentacao)

        if tipo_movimentacao == 'Entrada':
            item_estoque.quantidade += float(quantidade)
        elif tipo_movimentacao == 'Saída':
            item_estoque.quantidade -= float(quantidade)

        item_estoque.data_atualizacao = db.func.current_timestamp() # Atualiza data de modificação do item
        db.session.commit()
        return jsonify(nova_movimentacao.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500


# Handler para o AWS Lambda
# handler = Mangum(app)

if __name__ == '__main__':
    # Cria as tabelas se elas não existirem
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)