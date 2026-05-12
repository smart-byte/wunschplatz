import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import ProjectsPage from '@/pages/ProjectsPage';
import StudentsPage from '@/pages/StudentsPage';
import OptimizePage from '@/pages/OptimizePage';
import DistributionPage from '@/pages/DistributionPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'optimize', element: <OptimizePage /> },
      { path: 'distribution', element: <DistributionPage /> },
    ],
  },
]);
