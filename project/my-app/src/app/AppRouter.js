import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../shared/context/AuthContext';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import PublicOnlyRoute from '../shared/components/PublicOnlyRoute';
import AppLayout from '../shared/components/AppLayout';

import LoginPage      from '../features/auth/LoginPage';
import HomePage       from '../features/dashboard/HomePage';
import ProjectsPage   from '../features/projects/ProjectsPage';
import CreateProjectPage from '../features/projects/CreateProjectPage';
import UsersPage      from '../features/users/UsersPage';
import AuditPage      from '../features/audit/AuditPage';
import LeaderboardPage from '../features/leaderboard/LeaderboardPage';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* /login — redirect away if already logged in */}
                    <Route
                        path="/login"
                        element={
                            <PublicOnlyRoute>
                                <LoginPage />
                            </PublicOnlyRoute>
                        }
                    />

                    {/* All app routes share the AppLayout (Sidebar + Outlet) */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/projects" replace />} />
                        <Route path="/home"     element={<HomePage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route
                            path="/projects/new"
                            element={
                                <ProtectedRoute roles={['pm','admin']}>
                                    <CreateProjectPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/users"
                            element={
                                <ProtectedRoute roles={['pm','admin']}>
                                    <UsersPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/audit"       element={<AuditPage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/projects" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}