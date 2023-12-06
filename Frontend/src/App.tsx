import React from 'react';
import { createBrowserRouter, RouterProvider, Route } from 'react-router-dom';
import ViewSchedule from './views/ViewSchedule';
import SelectScheduleFirstWeek from './views/SelectScheduleFirstWeek';
import SelectScheduleSecondWeek from './views/SelectScheduleSecondWeek';
import NotFound from './boundaries/NotFound';
import './style.css';
import { SubjectProvider } from './context/ScheduleContext';

// Create a router instance
const router = createBrowserRouter([
  {
    path: '/home/schedule',
    element: <ViewSchedule />,
  },
  {
    path: '/',
    element: <SelectScheduleFirstWeek />,
  },
  {
    path: '/home/select/week2',
    element: <SelectScheduleSecondWeek />,
  },
  {
    path: '*', // Catch-all route
    element: <NotFound />,
  },
]);

export const App = () => {
  return (
    <SubjectProvider>
      <RouterProvider router={router} />
    </SubjectProvider>
  );
};
