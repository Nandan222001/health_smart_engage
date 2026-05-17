import { useState, useEffect } from 'react';
import { siteService } from '../services/siteService';

export const useSites = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const data = await siteService.getSites();
        setSites(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  return { sites, loading };
};
