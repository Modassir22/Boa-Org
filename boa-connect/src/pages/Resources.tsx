import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Download,
  Search,
  BookOpen,
  FileSpreadsheet,
  Presentation,
  Link as LinkIcon,
  Calendar,
  Award
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';

export default function Resources() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: 'all', label: 'All Resources', icon: FileText },
    { id: 'guidelines', label: 'Clinical Guidelines', icon: BookOpen },
    { id: 'forms', label: 'Forms & Templates', icon: FileSpreadsheet },
    { id: 'presentations', label: 'Presentations', icon: Presentation },
    { id: 'publications', label: 'Publications', icon: Award }
  ];

  useEffect(() => {
    loadResources();
  }, [activeTab]);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/resources?category=${activeTab}`);
      const data = await response.json();
      if (data.success) {
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (resourceId: number, fileUrl: string) => {
    try {
      // Increment download count
      await fetch(`${API_BASE_URL}/api/resources/${resourceId}/download`, {
        method: 'POST'
      });

      // Open file in new tab
      window.open(fileUrl, '_blank');

      // Reload resources to update count
      loadResources();
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const usefulLinks = [
    {
      title: 'All India Ophthalmological Society',
      url: 'https://aios.org',
      description: 'National ophthalmic association'
    },
    {
      title: 'National Programme for Control of Blindness',
      url: 'https://npcbvi.gov.in',
      description: 'Government initiative for eye care'
    },
    {
      title: 'Indian Journal of Ophthalmic Care',
      url: 'https://www.ijo.in',
      description: 'Leading ophthalmic journal'
    },
    {
      title: 'Medical Council of India',
      url: 'https://www.nmc.org.in',
      description: 'Medical registration and guidelines'
    }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16" style={{ background: '#F9FAFB' }}>
        <div className="container text-center max-w-3xl mx-auto">
          <div className="gov-badge-accent mb-4">
            <FileText className="h-4 w-4 mr-2 inline" />
            Knowledge Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4" style={{ color: '#1F2933' }}>
            Resources & Downloads
          </h1>
          <p className="text-lg" style={{ color: '#616E7C' }}>
            Access clinical guidelines, forms, presentations, and publications
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 bg-white border-b">
        <div className="container max-w-4xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: '#616E7C' }} />
            <Input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-6 sticky top-16 z-10 border-b" style={{ background: '#F9FAFB' }}>
        <div className="container">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium whitespace-nowrap transition-colors ${activeTab === category.id
                      ? 'text-white'
                      : 'bg-white hover:bg-gray-50'
                    }`}
                  style={activeTab === category.id ? { background: '#0B3C5D' } : { color: '#616E7C' }}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-16 bg-white">
        <div className="container">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#0B3C5D' }}></div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" style={{ color: '#616E7C' }} />
              <p className="text-lg" style={{ color: '#616E7C' }}>No resources found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="gov-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#E3F2FD' }}>
                        <FileText className="h-6 w-6" style={{ color: '#0B3C5D' }} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold px-2 py-1 rounded" style={{ background: '#E3F2FD', color: '#0B3C5D' }}>
                          {resource.file_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-2 line-clamp-2" style={{ color: '#1F2933' }}>
                    {resource.title}
                  </h3>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: '#616E7C' }}>
                    {resource.description}
                  </p>

                  <div className="flex items-center justify-between text-xs mb-4" style={{ color: '#616E7C' }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(resource.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span>{resource.file_size}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#616E7C' }}>
                      {resource.downloads_count} downloads
                    </span>
                    <button
                      className="gov-button-primary text-sm px-4 py-2"
                      onClick={() => handleDownload(resource.id, resource.file_url)}
                    >
                      <Download className="h-4 w-4 mr-2 inline" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Useful Links */}
      <section className="py-16" style={{ background: '#F9FAFB' }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4" style={{ color: '#1F2933' }}>Useful Links</h2>
            <p style={{ color: '#616E7C' }}>
              Important external resources for ophthalmologists
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {usefulLinks.map((link, index) => (
              <div key={index} className="gov-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E3F2FD' }}>
                    <LinkIcon className="h-6 w-6" style={{ color: '#0B3C5D' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: '#1F2933' }}>{link.title}</h3>
                    <p className="text-sm mb-3" style={{ color: '#616E7C' }}>{link.description}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                      style={{ color: '#0B3C5D' }}
                    >
                      Visit Website →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-semibold mb-4" style={{ color: '#1F2933' }}>Need More Resources?</h2>
          <p className="mb-8" style={{ color: '#616E7C' }}>
            Members have access to exclusive resources and materials. Join BOA today to unlock premium content.
          </p>
          <button className="gov-button-primary text-lg px-6 py-3">
            Become a Member
          </button>
        </div>
      </section>
    </Layout>
  );
}
