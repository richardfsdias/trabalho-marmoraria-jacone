// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/orcamentos">
          Marmoraria
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse" // Bootstrap usa isso pra colapsar o menu
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/orcamentos">
                Orçamentos
              </Link>
            </li>
            {/* <li className="nav-item">
              <Link className="nav-link" to="/notas">
                Notas
              </Link>
            </li> */}
            <li className="nav-item">
              <Link className="nav-link" to="/clientes">
                Clientes
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/marmores">
                Mármores
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/movimentacoes">
                Movimentações
              </Link>
            </li>
          </ul>
          <button className="btn btn-outline-light" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;