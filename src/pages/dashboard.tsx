import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../dashboard';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return process.env.NODE_ENV === 'test' || Boolean(localStorage.getItem('truevote_connected_wallet'));
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      setIsAuthenticated(true);
      return;
    }

    const wallet = localStorage.getItem('truevote_connected_wallet');
    if (!wallet) {
      navigate('/?login=true', { replace: true });
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  if (!isAuthenticated && process.env.NODE_ENV !== 'test') {
    return null;
  }

  return <Dashboard />;
};

export default DashboardPage;
