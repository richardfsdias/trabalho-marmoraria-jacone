// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
// import Notas from './pages/Notas';
import Clientes from './pages/Clientes';
import Marmores from './pages/Marmores';
import Movimentacoes from './pages/Movimentacoes';
import Orcamentos from './pages/Orcamentos';
import Cadastro from './pages/Cadastro';

function App() {
  return (
    <Router>
      <div className="container-fluid p-0">
        <Navbar />
        <Routes>
          <Route path="/cadastro" element={<Cadastro />}/>
          <Route path="/login" element={<Login />} />
          <Route
            path="/orcamentos"
            element={
              <ProtectedRoute>
                <Orcamentos />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/notas"
            element={
              <ProtectedRoute>
                <Notas />
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marmores"
            element={
              <ProtectedRoute>
                <Marmores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movimentacoes"
            element={
              <ProtectedRoute>
                <Movimentacoes />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;