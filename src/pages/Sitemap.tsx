import { useEffect } from 'react';

const Sitemap = () => {
  useEffect(() => {
    // Redirect directly to the edge function that serves the sitemap
    window.location.replace(
      'https://pvxndzwaposcttrwkwgd.supabase.co/functions/v1/generate-sitemap'
    );
  }, []);

  return null;
};

export default Sitemap;
