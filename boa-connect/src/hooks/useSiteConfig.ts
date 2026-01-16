import { useState, useEffect } from 'react';
import axios from 'axios';

interface SiteConfig {
  favicon_url: string;
  logo_url: string;
  hero_circle_image_url: string;
  site_title: string;
  site_description: string;
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>({
    favicon_url: '',
    logo_url: '',
    hero_circle_image_url: '',
    site_title: 'Bihar Ophthalmic Association',
    site_description: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/site-config');
      if (response.data.success && response.data.config) {
        const loadedConfig = response.data.config;
        setConfig(loadedConfig);
        
        // Update favicon dynamically
        if (loadedConfig.favicon_url) {
          const favicon = document.getElementById('favicon') as HTMLLinkElement;
          if (favicon) {
            favicon.href = loadedConfig.favicon_url;
          }
        }
        
        // Update page title
        if (loadedConfig.site_title) {
          document.title = loadedConfig.site_title;
        }
      }
    } catch (error) {
      console.error('Failed to load site config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { config, isLoading };
}
