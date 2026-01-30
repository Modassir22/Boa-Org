import { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { API_BASE_URL } from '@/lib/utils';

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gallery`);
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

  const filteredItems = filter === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.type === filter);

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
      <div className="py-12 px-4">
        <div className="container">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Gallery
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore moments from our seminars, conferences, and community outreach programs
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
                filter === 'image'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Photos
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
                filter === 'video'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Video className="h-4 w-4" />
              Videos
            </button>
          </div>

          {/* Gallery Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <Card 
                  key={index} 
                  className="overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video overflow-hidden">
                      {item.type === 'image' ? (
                        <img 
                          src={item.url} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="relative w-full h-full bg-muted flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-primary border-b-8 border-b-transparent ml-1"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {item.type === 'image' ? (
                          <div className="bg-white/90 rounded-full p-2">
                            <ImageIcon className="h-4 w-4 text-primary" />
                          </div>
                        ) : (
                          <div className="bg-white/90 rounded-full p-2">
                            <Video className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedItem && (
            <div className="relative">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              {selectedItem.type === 'image' ? (
                <img 
                  src={selectedItem.url} 
                  alt={selectedItem.title}
                  className="w-full h-auto"
                />
              ) : (
                <div className="aspect-video bg-black flex items-center justify-center">
                  <Video className="h-16 w-16 text-white/50" />
                  <p className="text-white/70 ml-4">Video player coming soon</p>
                </div>
              )}
              <div className="p-6 bg-background">
                <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                <p className="text-muted-foreground">{selectedItem.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
