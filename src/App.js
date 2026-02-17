import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { lazyWithPreload } from './utils/lazyWithPreload';
import { ProtectedRoute } from './components/layout';
import './styles/global.css';

const Login = lazyWithPreload(() => import('./pages/auth/Login'));
const Register = lazyWithPreload(() => import('./pages/auth/Register'));
const ForgotPassword = lazyWithPreload(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazyWithPreload(() => import('./pages/auth/ResetPassword'));

const Dashboard = lazyWithPreload(() => import('./pages/dashboard/DashboardProjects'));
const AdminDashboard = lazyWithPreload(() => import('./pages/dashboard/AdminDashboard'));

const Projects = lazyWithPreload(() => import('./pages/projects/Projects'));
const AddProject = lazyWithPreload(() => import('./pages/projects/AddProject'));
const ProjectDetails = lazyWithPreload(() => import('./pages/projects/ProjectDetails'));
const EditProject = lazyWithPreload(() => import('./pages/projects/EditProject'));
const Delivered = lazyWithPreload(() => import('./pages/projects/Delivered'));

const RouteFallback = () => {
  return <div style={{ minHeight: 1 }} />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <React.Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects" 
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/new" 
                element={
                  <ProtectedRoute>
                    <AddProject />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id" 
                element={
                  <ProtectedRoute>
                    <ProjectDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/edit" 
                element={
                  <ProtectedRoute>
                    <EditProject />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/delivered"
                element={
                  <ProtectedRoute>
                    <Delivered />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </React.Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
