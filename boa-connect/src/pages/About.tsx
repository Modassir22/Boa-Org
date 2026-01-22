import { Award, Scale, Building } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';

export default function About() {
  const [certification, setCertification] = useState<any>(null);
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([]);

  useEffect(() => {
    loadCertification();
    loadCommitteeMembers();
  }, []);

  const loadCertification = async () => {
    try {
      const response = await fetch('/api/certification');
      const data = await response.json();
      if (data.success && data.certification) {
        setCertification(data.certification);
      }
    } catch (error) {
      console.error('Failed to load certification:', error);
    }
  };

  const loadCommitteeMembers = async () => {
    try {
      const response = await fetch('/api/committee-members?page_type=about');
      const data = await response.json();
      if (data.success) {
        setCommitteeMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to load committee members:', error);
    }
  };

  return (
    <Layout>
      <div style={{ opacity: 1, visibility: 'visible' }}>
        {/* Hero Section */}
        <section className="bg-white py-20 border-b border-gray-200" style={{ opacity: 1, visibility: 'visible' }}>
          <div className="container mx-auto px-4 max-w-4xl" style={{ opacity: 1, visibility: 'visible' }}>
            <div className="text-center" style={{ opacity: 1, visibility: 'visible' }}>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900" style={{ fontFamily: 'Noto Sans, sans-serif', opacity: 1, visibility: 'visible' }}>
                About Bihar Ophthalmic Association
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto" style={{ opacity: 1, visibility: 'visible' }}>
                A Government-recognized medical association serving the ophthalmology community of Bihar since 1975
              </p>
            </div>
          </div>
        </section>

        {/* BOA Details Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="section-enter">
              <h2 className="p-2 bg-[#0B3C5D] text-white text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                About BOA
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                  The Bihar Ophthalmic Association (BOA) was established in 1975 as a professional medical association
                  to serve the ophthalmology community across the state of Bihar. Operating under the jurisdiction of
                  the Government of Bihar, BOA functions as the official representative body for ophthalmologists and
                  eye care professionals in the region.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                  The association serves all 38 districts of Bihar, providing professional development opportunities,
                  continuing medical education, and advocacy for improved eye care services throughout the state.
                  BOA operates in accordance with medical ethics and professional standards as prescribed by the
                  Medical Council of India and relevant regulatory authorities.
                </p>
                <p className="text-gray-700 leading-relaxed text-lg">
                  As a registered society under the Societies Registration Act, 1860, BOA maintains transparency
                  in its operations and adheres to all statutory requirements for professional medical associations
                  in India.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Certification Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12 ">
              <h2 className="p-2 bg-[#0B3C5D] text-white text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                Certification & Registration
              </h2>
              <div className="h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
            </div>

            {certification ? (
              <div className="bg-white rounded-xl shadow-lg  border border-gray-200 overflow-hidden">
                {/* Certification Image */}
                {certification.certificate_image_url && (
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <img
                      src={certification.certificate_image_url}
                      alt="BOA Certification"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                )}

                {/* Certification Details */}
                <div className="p-8">
                  {/* Organization Name */}
                  {certification.organization_name && (
                    <div className="mb-6 text-center">
                      <h3 className="text-2xl font-bold text-gray-900">{certification.organization_name}</h3>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Registration Number */}
                      {certification.registration_number && (
                        <div className="flex items-start gap-3">
                          <Scale className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Registration Number</h4>
                            <p className="text-gray-600">{certification.registration_number}</p>
                          </div>
                        </div>
                      )}

                      {/* Certificate Number */}
                      {certification.certificate_number && (
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Certificate Number</h4>
                            <p className="text-gray-600">{certification.certificate_number}</p>
                          </div>
                        </div>
                      )}

                      {/* Registration Act */}
                      {certification.registration_act && (
                        <div className="flex items-start gap-3">
                          <Scale className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Registration Act</h4>
                            <p className="text-gray-600">{certification.registration_act}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Registration Date */}
                      {certification.registration_date && (
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Registration Date</h4>
                            <p className="text-gray-600">{new Date(certification.registration_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                      )}

                      {/* Registered Office */}
                      {certification.registered_office && (
                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Registered Office</h4>
                            <p className="text-gray-600 whitespace-pre-line">{certification.registered_office}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12 bg-white rounded-xl border border-gray-200">
                <p>Certification information will be displayed here</p>
              </div>
            )}
          </div>
        </section>

        {/* Committee Members Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="section-enter">
              <div className="text-center mb-12">
                <h2 className="p-2 bg-[#0B3C5D] text-white text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                  Executive Committee Members
                </h2>
                <div className="h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
              </div>

              {committeeMembers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {committeeMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow section-enter"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="relative mb-4">
                        <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-blue-300 bg-white shadow-md">
                          {member.image_url ? (
                            <img
                              src={member.image_url}
                              alt={member.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar');
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`fallback-avatar h-full w-full flex items-center justify-center bg-blue-50 text-blue-600 ${member.image_url ? 'hidden' : ''}`}>
                            <span className="text-xl font-bold">
                              {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">
                        {member.name}
                      </h4>
                      <p className="text-xs text-blue-600 font-semibold">
                        {member.profession}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <p>No committee members found</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
