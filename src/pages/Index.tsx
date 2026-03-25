import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/components/SplashScreen';
import Dashboard from '@/pages/Dashboard';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (!showSplash && !loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [showSplash, loading, user, navigate]);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Dashboard />;
};

export default Index;
