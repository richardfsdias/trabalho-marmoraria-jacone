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
                                                  'mysql+pymysql://root:JulietaeLana1@127.0.0.1/marmoraria?charset=utf8mb4')
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
    id = db.Column(db.Integer, primary_key=True)
    nome_item = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    unidade_medida = db.Column(db.String(20), nullable=False) # Corrigido de 'unidade_media'
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    data_atualizacao = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())

    def serialize(self):
        return {
            'id': self.id,
            'nome_item': self.nome_item,
            'tipo': self.tipo,
            'quantidade': float(self.quantidade),
            'unidade_medida': self.unidade_medida,
            'preco_unitario': float(self.preco_unitario),
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
        orcamentos = Pedidos.query.all()
        return jsonify([orcamento.serialize() for orcamento in orcamentos]), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/orcamentos/<int:id>', methods=['GET'])
@jwt_required()
def get_orcamento(id):
    try:
        orcamento = Pedidos.query.get(id)
        if not orcamento:
            return jsonify({"erro": "Orçamento não encontrado"}), 404
        return jsonify(orcamento.serialize()), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/orcamentos', methods=['POST'])
@jwt_required()
def add_orcamento():
    data = request.get_json()
    cliente_id = data.get('cliente_id')
    tipo_marmore_nome = data.get('tipo_marmore') # Nome do mármore
    metragem = data.get('metragem')
    status = data.get('status', 'Pendente') # Default status

    if not all([cliente_id, tipo_marmore_nome, metragem is not None]):
        return jsonify({"erro": "Cliente, tipo de mármore e metragem são obrigatórios."}), 400

    try:
        marmore = Marmores.query.filter_by(nome=tipo_marmore_nome).first()
        if not marmore:
            return jsonify({"erro": "Tipo de mármore não encontrado no estoque."}), 404

        preco_total = float(marmore.preco_m2) * float(metragem)

        novo_orcamento = Pedidos(
            cliente_id=cliente_id,
            tipo_marmore=tipo_marmore_nome,
            metragem=float(metragem),
            preco_total=preco_total,
            status=status
        )
        db.session.add(novo_orcamento)
        db.session.commit()
        return jsonify(novo_orcamento.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/orcamentos/<int:id>', methods=['PUT'])
@jwt_required()
def update_orcamento(id):
    try:
        orcamento = Pedidos.query.get(id)
        if not orcamento:
            return jsonify({"erro": "Orçamento não encontrado"}), 404

        data = request.get_json()
        orcamento.cliente_id = data.get('cliente_id', orcamento.cliente_id)
        orcamento.tipo_marmore = data.get('tipo_marmore', orcamento.tipo_marmore)
        orcamento.metragem = float(data.get('metragem', orcamento.metragem))
        orcamento.status = data.get('status', orcamento.status)

        # Recalcular preco_total se metragem ou tipo_marmore mudar
        if 'metragem' in data or 'tipo_marmore' in data:
            marmore = Marmores.query.filter_by(nome=orcamento.tipo_marmore).first()
            if marmore:
                orcamento.preco_total = float(marmore.preco_m2) * orcamento.metragem
            else:
                return jsonify({"erro": "Tipo de mármore não encontrado para recalcular preço."}), 404

        db.session.commit()
        return jsonify(orcamento.serialize()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/orcamentos/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_orcamento_status(id):
    try:
        orcamento = Pedidos.query.get(id)
        if not orcamento:
            return jsonify({"erro": "Orçamento não encontrado"}), 404

        data = request.get_json()
        novo_status = data.get('status')
        if not novo_status:
            return jsonify({"erro": "Status é obrigatório."}), 400

        # Valide se o novo status é um dos valores permitidos no Enum
        if novo_status not in ['Pendente', 'Aprovado', 'Rejeitado', 'Concluído']:
            return jsonify({"erro": "Status inválido."}), 400

        orcamento.status = novo_status
        db.session.commit()
        return jsonify(orcamento.serialize()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500


@app.route('/orcamentos/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_orcamento(id):
    try:
        orcamento = Pedidos.query.get(id)
        if not orcamento:
            return jsonify({"erro": "Orçamento não encontrado"}), 404
        db.session.delete(orcamento)
        db.session.commit()
        return jsonify({"message": "Orçamento excluído com sucesso"}), 200
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
    nome_item = data.get('nome_item')
    tipo = data.get('tipo')
    quantidade = data.get('quantidade')
    unidade_medida = data.get('unidade_medida') # Corrigido para unidade_medida
    preco_unitario = data.get('preco_unitario')

    if not all([nome_item, tipo, quantidade is not None, unidade_medida, preco_unitario is not None]):
        return jsonify({"erro": "Todos os campos são obrigatórios."}), 400
    try:
        novo_item = Estoque(
            nome_item=nome_item,
            tipo=tipo,
            quantidade=float(quantidade),
            unidade_medida=unidade_medida,
            preco_unitario=float(preco_unitario)
        )
        db.session.add(novo_item)
        db.session.commit()
        return jsonify(novo_item.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/estoque/<int:id>', methods=['PUT'])
@jwt_required()
def update_estoque_item(id):
    try:
        item = Estoque.query.get(id)
        if not item:
            return jsonify({"erro": "Item de estoque não encontrado"}), 404
        data = request.get_json()
        item.nome_item = data.get('nome_item', item.nome_item)
        item.tipo = data.get('tipo', item.tipo)
        item.quantidade = float(data.get('quantidade', item.quantidade))
        item.unidade_medida = data.get('unidade_medida', item.unidade_medida) # Corrigido
        item.preco_unitario = float(data.get('preco_unitario', item.preco_unitario))
        item.data_atualizacao = db.func.current_timestamp() # Atualiza data de modificação
        db.session.commit()
        return jsonify(item.serialize()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

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