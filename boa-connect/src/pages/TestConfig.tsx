import { useSiteConfig } from '@/hooks/useSiteConfig';

export default function TestConfig() {
  const { config, isLoading } = useSiteConfig();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Site Configuration Test</h1>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Favicon URL:</h2>
          <p className="text-sm break-all">{config.favicon_url || 'Not set'}</p>
          {config.favicon_url && (
            <img src={config.favicon_url} alt="Favicon" className="mt-2 w-8 h-8" />
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Logo URL:</h2>
          <p className="text-sm break-all">{config.logo_url || 'Not set'}</p>
          {config.logo_url && (
            <img src={config.logo_url} alt="Logo" className="mt-2 h-16" />
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Hero Circle Image URL:</h2>
          <p className="text-sm break-all">{config.hero_circle_image_url || 'Not set'}</p>
          {config.hero_circle_image_url && (
            <img src={config.hero_circle_image_url} alt="Hero" className="mt-2 w-32 h-32 rounded-full object-cover" />
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Site Title:</h2>
          <p className="text-sm">{config.site_title}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Site Description:</h2>
          <p className="text-sm">{config.site_description}</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
}
