import { Outlet, RouterProvider, createBrowserRouter } from "react-router";
import { Navigate } from "react-router-dom";
import  AuthLayout  from '../App'
import Login  from '../features/auth/Login'
import Sidebar from "../shared/components/Sidebar";
import Dashboard from "../features/dashboard/Dashboard";
import ProjectViewers from "../features/projects/ProjectViewers";

import { useAuth } from "../shared/hooks/useAuth";
import UserManagement from "../features/users/UserManagement";
import project from "../features/projects/project";

function ProtectedPath(){
    const {user, loading} = useAuth()

    if (loading) return null;

    if(!user){
        return <Navigate to="/auth/login" replace />
    }
    return <Outlet />
}

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      {
        path: "auth",
        Component: AuthLayout,
        children: [
          { path: "login", Component: Login },
        ],
      },
      {
        element: <ProtectedPath />,
        children: [
          {
            path: "menu",
            Component: Sidebar,
            children: [
              { path: "dashboard", Component: Dashboard },
              { path: "project", Component: project },
              { path: "usuarios", Component: UserManagement},
            ],
          }
        ]
      }
    ]
  }
])


function App() {
  return <RouterProvider router={router} />;
}

export default App;