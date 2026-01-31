import { useState, useEffect } from 'react';
import { Calendar, Clock, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  status: 'active' | 'inactive';
}

interface GalleryImage {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  created_at: string;
}

export function NewsGallerySection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load news and gallery data in parallel - ONLY 3 items each
      const [newsResponse, galleryResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/news?limit=3`),
        fetch(`${API_BASE_URL}/api/gallery-images?limit=3`)
      ]);

      const newsData = await newsResponse.json();
      const galleryData = await galleryResponse.json();

      if (newsData.success) {
        // Ensure only 3 news items maximum
        const limitedNews = (newsData.news || []).slice(0, 3);
        setNews(limitedNews);
      }

      if (galleryData.success) {
        // Ensure only 3 gallery images maximum
        const limitedImages = (galleryData.images || []).slice(0, 3);
        setGalleryImages(limitedImages);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
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

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* News Section */}
      {news.length > 0 && (
        <section className="gov-section">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="gov-section-title p-2 bg-[#09638E] text-white flex items-center justify-center gap-2">
                
                Media Coverage
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {news.slice(0, 3).map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                  <div className="aspect-video overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/400/250';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <Eye className="h-12 w-12 text-blue-500" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        News
                      </Badge>
                      <div className="flex items-center text-xs text-gray-500 gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(item.created_at)}
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {truncateContent(item.content)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.created_at)}
                      </div>
                      
                      <Link to="/news" className="text-xs text-primary hover:text-primary/80 font-medium">
                        Read More →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link to="/news">
                <Button className="bg-[#09637E] hover:bg-[#088395] text-white">
                  See More News
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section className="gov-section bg-gradient-to-br from-[#EBF4F6] via-white to-[#7AB2B2]/20">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="gov-section-title p-2 bg-[#09638E] text-white flex items-center justify-center gap-2">
                Gallery Highlights
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {galleryImages.slice(0, 3).map((image) => (
                <div key={image.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300 group cursor-pointer overflow-hidden" style={{ borderRadius: '0.5rem' }}>
                  {/* Image container with no spacing - using absolute positioning */}
                  <div className="w-full aspect-square relative overflow-hidden" style={{ margin: 0, padding: 0, display: 'block', lineHeight: 0, fontSize: 0 }}>
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ 
                        top: 0,
                        left: 0,
                        margin: 0, 
                        padding: 0,
                        display: 'block',
                        verticalAlign: 'top',
                        borderTopLeftRadius: '0.5rem',
                        borderTopRightRadius: '0.5rem',
                        borderBottomLeftRadius: '0px',
                        borderBottomRightRadius: '0px'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/400/400';
                      }}
                    />
                  </div>

                  {/* Content section */}
                  <div className="p-4">
                    <h4 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {image.title}
                    </h4>
                    
                    {image.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {truncateContent(image.description, 80)}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(image.created_at)}
                      </div>
                      
                      <Link to="/gallery" className="text-xs text-primary hover:text-primary/80 font-medium">
                        View Gallery →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link to="/gallery">
                <Button className="bg-[#09637E] hover:bg-[#088395] text-white">
                  See More Gallery
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}