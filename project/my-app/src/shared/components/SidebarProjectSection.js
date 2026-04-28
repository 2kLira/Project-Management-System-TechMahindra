import { NavLink } from 'react-router-dom';
import { ICONS, PROJECT_NAV_ITEMS } from './Sidebar.constants';

/**
 * Sección contextual del sidebar cuando el usuario está dentro de un proyecto.
 * Filtra los items según el rol del usuario para garantizar que cada rol
 * solo vea las rutas a las que realmente tiene acceso (espeja AppRouter).
 *
 * Props:
 *   projectId      – id del proyecto (string desde useParams)
 *   projectLabel   – nombre del proyecto para el encabezado
 *   projectState   – objeto a pasar como `state` en cada NavLink
 *   role           – rol del usuario autenticado ('viewer' | 'pm' | 'admin')
 *   menuClass      – función de clase para NavLink ({ isActive }) => string
 */
export default function SidebarProjectSection({
    projectId,
    projectLabel,
    projectState,
    role,
    menuClass,
}) {
    // Filtra items: sin `roles` → visible para todos; con `roles` → solo si aplica
    const items = PROJECT_NAV_ITEMS.filter(
        item => !item.roles || item.roles.includes(role)
    );

    return (
        <div className="sb-section">
            <div className="sb-section-label">{projectLabel}</div>

            {items.map(item => (
                <NavLink
                    key={item.suffix}
                    to={`/projects/${projectId}/${item.suffix}`}
                    state={projectState}
                    className={menuClass}
                >
                    <span className="sb-icon">{ICONS[item.icon]}</span>
                    {item.label}
                </NavLink>
            ))}
        </div>
    );
}