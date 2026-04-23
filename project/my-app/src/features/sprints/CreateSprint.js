import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';
import './CreateSprint.css'; 


export default function CreateSprint({ onClose }) {

  const [form, setForm] = useState({ nombre: '', fecha_inicio: '', estado: 'planned', fecha_final: '', SP: '' });

  const { id } = useParams();

  async function create_sprint() {
    await api.post(`/sprints-consult/${id}/create-sprint`, form)
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="side-panel side-panel--open">
        <div className="side-panel__header">
          <h2>Nuevo sprint</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="side-panel__body">
          <label>
            Nombre
            <input  
              type="text" placeholder="Sprint 4..."  
              name="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}/>
          </label>
          <label>
            Estado
            <select
              name="estado"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
            </select>
          </label>
          <label>
            Fecha inicio
            <input 
              type="date" 
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            />
          </label>
          <label>
            Fecha fin
            <input 
              type="date" 
              name="fecha_final"
              value={form.fecha_final}
              onChange={(e) => setForm({ ...form, fecha_final: e.target.value })}
              />
          </label>
          <label>
            SP aproximado
            <input 
              type="number"
              name="SP"
              value={form.SP}
              onChange={(e) => setForm({ ...form, SP: e.target.value })}
              />
          </label>
        </div>

        <button className="side-panel__submit" onClick={create_sprint}>
          Crear sprint
        </button>
      </aside>
    </>
  );
}