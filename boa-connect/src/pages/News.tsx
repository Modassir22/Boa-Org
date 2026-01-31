import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Eye, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  status: 'active' | 'inactive';
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/news`);
      const data = await response.json();
      
      if (data.success) {
        setNews(data.news || []);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Compact Hero Section */}
        <div className="relative py-5 px-4 overflow-hidden hero-enhanced">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-accent/3"></div>
          <div className="relative container mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 hero-badge text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <Eye className="h-4 w-4" />
                Latest Updates
              </div>
              
              <h1 className="hero-title text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                News & <span className="text-primary">Updates</span>
              </h1>
              
              <p className="hero-subtitle text-lg md:text-xl text-gray-600 leading-relaxed mb-6 max-w-2xl mx-auto">
                Stay informed with the latest news and updates from Ophthalmic Association Of Bihar.
              </p>
            </div>
          </div>
          
          {/* Subtle Decorative Elements */}
          <div className="absolute top-10 left-10 w-16 h-16 bg-primary/5 rounded-full blur-xl hero-decorative"></div>
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-accent/5 rounded-full blur-xl hero-decorative" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 pb-12">

        {/* News List - Optimized Layout */}
        {news.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No News Available</h3>
            <p className="text-gray-500">Check back later for the latest updates and announcements.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col lg:flex-row min-h-[200px]">
                  {/* Image Section - Left (60% on large screens) */}
                  <div className="news-image-section lg:w-3/5">
                    {item.image_url ? (
                      <div 
                        className="aspect-video lg:aspect-[4/3] w-full cursor-pointer overflow-hidden h-full"
                        onClick={() => setSelectedNews(item)}
                      >
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full hover:scale-105 transition-transform duration-300"
                          style={{ 
                            objectFit: 'contain', 
                            objectPosition: 'center',
                            minHeight: '200px',
                            backgroundColor: '#f8f9fa'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/400/300';
                          }}
                        />
                      </div>
                    ) : (
                      <div 
                        className="aspect-video lg:aspect-[4/3] w-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center cursor-pointer h-full"
                        onClick={() => setSelectedNews(item)}
                      >
                        <Eye className="h-12 w-12 text-blue-500" />
                      </div>
                    )}
                  </div>

                  {/* Content Section - Right (40% on large screens) */}
                  <div className="news-content-section lg:w-2/5 flex">
                    <CardContent className="p-6 flex flex-col justify-between w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            News
                          </Badge>
                          <div className="flex items-center text-xs text-gray-500 gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(item.created_at)}
                          </div>
                        </div>
                        
                        <h2 
                          className="text-xl lg:text-2xl font-bold mb-3 leading-tight hover:text-primary transition-colors cursor-pointer line-clamp-2"
                          onClick={() => setSelectedNews(item)}
                        >
                          {item.title}
                        </h2>
                        
                        <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                          {truncateContent(item.content)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(item.created_at)}
                        </div>
                        
                        <button
                          onClick={() => setSelectedNews(item)}
                          className="text-primary hover:text-primary/80 font-medium text-sm transition-colors whitespace-nowrap"
                        >
                          Read More →
                        </button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* News Detail Modal */}
        <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedNews && (
              <div>
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">News</Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(selectedNews.created_at)}
                    </span>
                  </div>
                  <DialogTitle className="text-2xl font-bold leading-tight">
                    {selectedNews.title}
                  </DialogTitle>
                </DialogHeader>
                
                {selectedNews.image_url && (
                  <div className="mb-6 bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={selectedNews.image_url}
                      alt={selectedNews.title}
                      className="w-full max-h-96 object-contain rounded-lg"
                      style={{ 
                        objectFit: 'contain', 
                        objectPosition: 'center',
                        backgroundColor: '#f8f9fa',
                        minHeight: '200px'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/600/400';
                      }}
                    />
                  </div>
                )}
                
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedNews.content}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
}