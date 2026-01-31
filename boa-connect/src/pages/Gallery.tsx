import { useState, useEffect } from 'react';
import { Image as ImageIcon, X, Calendar } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { API_BASE_URL } from '@/lib/utils';

interface GalleryImage {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  created_at: string;
}

export default function Gallery() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    loadGalleryImages();
  }, []);

  const loadGalleryImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gallery-images`);
      const data = await response.json();
      if (data.success) {
        setGalleryImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
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

  // Optimized Bento Grid Layout Classes - No empty spaces
  const getBentoClass = (index: number) => {
    // More balanced pattern to avoid empty spaces
    const patterns = [
      'col-span-2 row-span-1', // Wide
      'col-span-1 row-span-1', // Small
      'col-span-1 row-span-1', // Small
      'col-span-1 row-span-2', // Tall
      'col-span-2 row-span-1', // Wide
      'col-span-1 row-span-1', // Small
      'col-span-1 row-span-1', // Small
      'col-span-2 row-span-1', // Wide
    ];
    return patterns[index % patterns.length];
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
      <div className="bg-gradient-to-br from-slate-50 via-white to-purple-50">
        {/* Compact Hero Section */}
        <div className="relative py-5 px-4 overflow-hidden hero-enhanced">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-purple-500/3"></div>
          <div className="relative container mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 hero-badge text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <ImageIcon className="h-4 w-4" />
                Visual Journey
              </div>
              
              <h1 className="hero-title text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Our <span className="text-primary">Gallery</span>
              </h1>
              
              <p className="hero-subtitle text-lg md:text-xl text-gray-600 leading-relaxed mb-6 max-w-2xl mx-auto">
                Explore memorable moments from our seminars, conferences, and community programs.
              </p>
              
           
            </div>
          </div>
          
          {/* Subtle Decorative Elements */}
          <div className="absolute top-10 left-10 w-16 h-16 bg-primary/5 rounded-full blur-xl hero-decorative"></div>
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-purple-500/5 rounded-full blur-xl hero-decorative" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 pb-12">

          {/* Optimized Gallery Grid */}
          {galleryImages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Images Available</h3>
              <p className="text-muted-foreground">Check back later for new gallery images.</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Single Column */}
              <div className="block sm:hidden">
                <div className="grid grid-cols-1 gap-4">
                  {galleryImages.map((image) => (
                    <div
                      key={image.id}
                      className="aspect-square group cursor-pointer overflow-hidden rounded-xl bg-gray-100 hover:shadow-xl transition-all duration-300 relative"
                      style={{ backgroundColor: '#f8f9fa' }}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/400/400';
                        }}
                      />
                      
                      {/* Overlay with title */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                            {image.title}
                          </h3>
                          {image.description && (
                            <p className="text-white/80 text-xs line-clamp-1">
                              {image.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <ImageIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop/Tablet View - Bento Grid */}
              <div className="hidden sm:block">
                {galleryImages.length <= 6 ? (
                  // Simple grid for fewer images
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryImages.map((image) => (
                      <div
                        key={image.id}
                        className="aspect-square group cursor-pointer overflow-hidden rounded-xl bg-gray-100 hover:shadow-xl transition-all duration-300 relative"
                        style={{ backgroundColor: '#f8f9fa' }}
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image.image_url}
                          alt={image.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/400/400';
                          }}
                        />
                        
                        {/* Overlay with title */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 mb-1">
                              {image.title}
                            </h3>
                            {image.description && (
                              <p className="text-white/80 text-xs line-clamp-1">
                                {image.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <ImageIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Bento grid for more images
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[200px] gap-3">
                    {galleryImages.map((image, index) => (
                      <div
                        key={image.id}
                        className={`${getBentoClass(index)} group cursor-pointer overflow-hidden rounded-xl bg-gray-100 hover:shadow-xl transition-all duration-300 relative`}
                        style={{ backgroundColor: '#f8f9fa' }}
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image.image_url}
                          alt={image.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/400/400';
                          }}
                        />
                        
                        {/* Overlay with title */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 mb-1">
                              {image.title}
                            </h3>
                            {image.description && (
                              <p className="text-white/80 text-xs line-clamp-1">
                                {image.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <ImageIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Image Modal */}
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-5xl p-0 bg-black/95">
              {selectedImage && (
                <div className="relative">
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  
                  <div className="flex flex-col lg:flex-row">
                    {/* Image */}
                    <div className="lg:w-3/4 bg-gray-50 flex items-center justify-center">
                      <img
                        src={selectedImage.image_url}
                        alt={selectedImage.title}
                        className="w-full max-h-[80vh] object-contain"
                        style={{ 
                          objectFit: 'contain', 
                          objectPosition: 'center',
                          backgroundColor: '#f8f9fa'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/800/600';
                        }}
                      />
                    </div>
                    
                    {/* Details */}
                    <div className="lg:w-1/4 p-6 bg-white">
                      <h2 className="text-xl font-bold mb-3 text-gray-900">
                        {selectedImage.title}
                      </h2>
                      
                      {selectedImage.description && (
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {selectedImage.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(selectedImage.created_at)}
                      </div>
                    </div>
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