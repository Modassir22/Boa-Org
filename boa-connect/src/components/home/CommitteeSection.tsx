import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/utils';

export function CommitteeSection() {
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCommitteeMembers();
  }, []);

  const loadCommitteeMembers = async () => {
    try {
      
      const response = await fetch(`${API_BASE_URL}/api/committee-members?page_type=home`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText.substring(0, 500));
        
        // If we get HTML instead of JSON, the API server might be down
        if (errorText.includes('<!doctype') || errorText.includes('<html')) {
          console.error('API server returned HTML instead of JSON - server might be down or misconfigured');
          setCommitteeMembers([]); // Set empty array as fallback
          return;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText.substring(0, 200));
        
        // If we get HTML, set empty array as fallback
        if (responseText.includes('<!doctype') || responseText.includes('<html')) {
          console.error('API server returned HTML - using empty fallback');
          setCommitteeMembers([]);
          return;
        }
        
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      if (data.success) {
        setCommitteeMembers(data.members || []);
      } else {
        console.error('API returned success: false');
        setCommitteeMembers([]);
      }
    } catch (error) {
      console.error('Failed to load committee members:', error);
      // Set empty array as fallback to prevent UI crashes
      setCommitteeMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-card">
        <div className="container flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  if (committeeMembers.length === 0) {
    return null;
  }

  return (
    <section className="gov-section-gray">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="gov-section-title p-2 bg-[#09638E] text-white">
            Our Committee
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {committeeMembers.map((member) => (
            <div key={member.id} className="text-center gov-card p-3 sm:p-4 lg:p-6 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
              {member.image_url ? (
                <img 
                  src={member.image_url} 
                  alt={member.name}
                  className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded-full mx-auto mb-2 sm:mb-3 lg:mb-4 object-cover object-center border-2 sm:border-3 lg:border-4 border-[#0B3C5D] transition-transform duration-300 ease-in-out hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded-full mx-auto mb-2 sm:mb-3 lg:mb-4 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl font-semibold text-white border-2 sm:border-3 lg:border-4 border-[#0B3C5D] transition-transform duration-300 ease-in-out hover:scale-105 ${member.image_url ? 'hidden' : ''}`} style={{background: '#0B3C5D'}}>
                {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <h3 className="font-semibold text-xs sm:text-sm lg:text-base leading-tight mb-1 sm:mb-2" style={{color: '#1F2933'}}>{member.name}</h3>
              <p className="font-medium text-xs sm:text-sm" style={{color: '#0B3C5D'}}>{member.profession}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
