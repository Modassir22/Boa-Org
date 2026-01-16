import { useState, useEffect } from 'react';
import { Image, Video, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function GallerySection() {
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/gallery?limit=6');
      const data = await response.json();
      if (data.success) {
        setGalleryItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setIsLoading(false);
    }
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

  if (galleryItems.length === 0) {
    return null;
  }

  return (
    <section className="gov-section">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="gov-section-title">Gallery</h2>
          <p className="gov-section-subtitle">
            Moments from our seminars, conferences, and community outreach programs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <div key={index} className="gov-card overflow-hidden">
              <div className="p-0">
                <div className="relative aspect-video overflow-hidden">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center" style={{background: '#F9FAFB'}}>
                      <Video className="h-12 w-12" style={{color: '#9CA3AF'}} />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent ml-1" style={{borderLeft: '12px solid #0B3C5D'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {item.type === 'image' ? (
                      <div className="bg-white rounded-full p-2">
                        <Image className="h-4 w-4" style={{color: '#0B3C5D'}} />
                      </div>
                    ) : (
                      <div className="bg-white rounded-full p-2">
                        <Video className="h-4 w-4" style={{color: '#0B3C5D'}} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1" style={{color: '#1F2933'}}>{item.title}</h3>
                  <p className="text-sm" style={{color: '#616E7C'}}>{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/gallery">
            <button className="bg-white border-2 px-5 py-2.5 rounded font-medium hover:bg-gray-50 transition-colors" style={{color: '#0B3C5D', borderColor: '#0B3C5D'}}>
              View Full Gallery
              <ExternalLink className="ml-2 h-4 w-4 inline" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
