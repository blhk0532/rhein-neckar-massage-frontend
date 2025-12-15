import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Heart, ArrowLeft, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Resend } from 'resend';

interface Girl {
  name: string;
  specialties: string[];
  available: boolean;
}

interface Service {
  name: string;
  duration: string;
  price: string;
}

const Buchen = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const selectedGirl = searchParams.get('girl');
  
  const [bookingData, setBookingData] = useState({
    girl: selectedGirl || '',
    service: '',
    date: '',
    time: '',
    duration: '',
    name: '',
    phone: '',
    email: '',
    message: '',
    specialRequests: ''
  });

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [girls, setGirls] = useState<Girl[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active profiles and angebots from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch active profiles
        const profilesResponse = await fetch(`${import.meta.env.VITE_API_BASE}/profiles`);
        if (profilesResponse.ok) {
          const profilesData = await profilesResponse.json();
          const profilesList = profilesData.data || [];
          
          setGirls(profilesList.map((p: { name: string; services?: string | string[]; massages?: string | string[]; active?: boolean }) => {
            // Parse services and massages if they are JSON strings
            let servicesList: string[] = [];
            let massagesList: string[] = [];
            
            if (typeof p.services === 'string') {
              try {
                servicesList = JSON.parse(p.services);
              } catch {
                servicesList = [];
              }
            } else if (Array.isArray(p.services)) {
              servicesList = p.services;
            }
            
            if (typeof p.massages === 'string') {
              try {
                massagesList = JSON.parse(p.massages);
              } catch {
                massagesList = [];
              }
            } else if (Array.isArray(p.massages)) {
              massagesList = p.massages;
            }
            
            return {
              name: p.name,
              specialties: [...servicesList, ...massagesList].slice(0, 3), // Show first 3 specialties
              available: p.active !== false
            };
          }));
        }

        // Fetch active angebots (API filters is_active=1 by default)
        const angebotResponse = await fetch(`${import.meta.env.VITE_API_BASE}/angebots?active_only=1`);
        if (angebotResponse.ok) {
          const angebotData = await angebotResponse.json();
          const angebotList = angebotData.data || [];
          
          // Filter to only show active angebots
          setServices(angebotList
            .filter((a: { is_active?: boolean }) => a.is_active !== false)
            .map((a: { title: string; duration_minutes?: number; price?: number }) => ({
              name: a.title,
              duration: a.duration_minutes ? `${a.duration_minutes} Min` : '',
              price: a.price ? `${a.price}€` : ''
            })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set default fallback data
        setGirls([]);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const timeSlots = [
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", 
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
  ];

  useEffect(() => {
    if (selectedGirl) {
      setBookingData(prev => ({ ...prev, girl: selectedGirl }));
    }
  }, [selectedGirl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send to backend API
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t('buchen.error.retry'));
      }

      // Send email via Resend (frontend)
      try {
        const resend = new Resend('re_KRQhidF1_DdC7Rg5B6D2BGgexr4iqy1yz');
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Neue Buchungsanfrage (Frontend)</h1>
            
            <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">Kundendaten:</h2>
              <p><strong>Name:</strong> ${bookingData.name}</p>
              <p><strong>E-Mail:</strong> ${bookingData.email}</p>
              <p><strong>Telefon:</strong> ${bookingData.phone}</p>
            </div>

            <div style="background: #f0f9ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">Buchungsdetails:</h2>
              <p><strong>Masseurin:</strong> ${bookingData.girl || 'Nicht angegeben'}</p>
              <p><strong>Service:</strong> ${bookingData.service}</p>
              <p><strong>Datum:</strong> ${bookingData.date}</p>
              <p><strong>Uhrzeit:</strong> ${bookingData.time}</p>
              <p><strong>Dauer:</strong> ${bookingData.duration || 'Nicht angegeben'}</p>
            </div>

            ${bookingData.message ? `
            <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">Nachricht:</h2>
              <p style="white-space: pre-wrap;">${bookingData.message}</p>
            </div>
            ` : ''}

            ${bookingData.specialRequests ? `
            <div style="background: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">Spezielle Wünsche:</h2>
              <p style="white-space: pre-wrap;">${bookingData.specialRequests}</p>
            </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 12px;">
                Diese E-Mail wurde automatisch vom Frontend gesendet.
              </p>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: 'Buchungsanfrage <noreply@rhein-neckar-massage.de>',
          to: ['Info@Rhein-Neckar-Massage.de'],
          subject: 'Neue Buchungsanfrage - Rhein Neckar Massage (Frontend)',
          html: emailHtml,
        });

        console.log('Frontend email sent successfully');
      } catch (emailError) {
        console.error('Frontend email failed:', emailError);
        // Don't fail the whole submission if email fails
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(t('buchen.error.submit') + ' ' + (error instanceof Error ? error.message : t('buchen.error.retry')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (isSubmitted) {
    return (
      <div className="pt-0">
        <section className="py-20 bg-gradient-to-br from-gray-900 via-purple-900/20 to-rose-900/20 min-h-screen flex items-center">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gray-900 border border-rose-900/30 rounded-xl p-12">
              <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">{t('buchen.success.title')}</h1>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('buchen.success.message')}
              </p>
              <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <h3 className="text-white font-semibold mb-2">{t('buchen.success.details')}</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong>{t('buchen.success.girl')}</strong> {bookingData.girl}</p>
                  <p><strong>{t('buchen.success.service')}</strong> {bookingData.service}</p>
                  <p><strong>{t('buchen.success.date')}</strong> {bookingData.date}</p>
                  <p><strong>{t('buchen.success.time')}</strong> {bookingData.time}</p>
                </div>
              </div>
              <Link 
                to="/" 
                className="bg-rose-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-rose-700 transition-colors inline-block"
              >
                {t('buchen.success.back_home')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-0">
      <section className="py-20 bg-gradient-to-br from-gray-900 via-purple-900/20 to-rose-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center text-rose-400 hover:text-rose-300 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('buchen.back_home')}
            </Link>
            <h1 className="text-4xl font-bold text-white mb-4">{t('buchen.title')}</h1>
            <p className="text-xl text-gray-300">
              {t('buchen.description')}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= stepNum 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNum ? 'bg-rose-600' : 'bg-gray-700'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-rose-900/30 rounded-xl p-8">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-300">{t('common.loading') || 'Laden...'}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Step 1: Service Selection */}
                {step === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">{t('buchen.step1.title')}</h2>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <label
                          htmlFor="girl-select"
                          className="block text-sm font-medium text-gray-300 mb-3"
                        >
                          {t('buchen.step1.girl_label')}
                        </label>
                        <select
                          id="girl-select"
                          name="girl"
                          value={bookingData.girl}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-gray-700 text-white"
                          required
                        >
                          <option value="">{t('buchen.select.placeholder')}</option>
                          {girls.filter(girl => girl.available).map((girl, idx) => (
                            <option key={idx} value={girl.name}>
                              {girl.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="service-select"
                          className="block text-sm font-medium text-gray-300 mb-3"
                        >
                          {t('buchen.step1.service_label')}
                        </label>
                        <select
                          id="service-select"
                          name="service"
                          value={bookingData.service}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-gray-700 text-white"
                          required
                        >
                          <option value="">{t('buchen.select.placeholder')}</option>
                          {services.map((service, idx) => (
                            <option key={idx} value={service.name}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!bookingData.girl || !bookingData.service}
                      className="bg-rose-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-rose-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {t('buchen.button.next')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Date & Time */}
              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">{t('buchen.step2.title')}</h2>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        {t('buchen.step2.date_label')}
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={bookingData.date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-gray-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        {t('buchen.step2.time_label')}
                      </label>
                      <select
                        name="time"
                        value={bookingData.time}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-gray-700 text-white"
                        required
                      >
                        <option value="">{t('buchen.select.placeholder')}</option>
                        {timeSlots.map((time, idx) => (
                          <option key={idx} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      {t('buchen.step2.requests_label')}
                    </label>
                    <textarea
                      rows={3}
                      name="specialRequests"
                      value={bookingData.specialRequests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all resize-none bg-gray-700 text-white"
                      placeholder={t('buchen.step2.requests_placeholder')}
                    />
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="border border-rose-600 text-rose-400 px-8 py-3 rounded-lg font-semibold hover:bg-rose-600 hover:text-white transition-colors"
                    >
                      {t('buchen.button.back')}
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!bookingData.date || !bookingData.time}
                      className="bg-rose-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-rose-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {t('buchen.button.next')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Contact Information */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">{t('buchen.step3.title')}</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('buchen.step3.name_label')}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={bookingData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-gray-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('buchen.step3.phone_label')}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={bookingData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-gray-700 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('buchen.step3.email_label')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={bookingData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-gray-700 text-white"
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('buchen.step3.message_label')}
                    </label>
                    <textarea
                      rows={4}
                      name="message"
                      value={bookingData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all resize-none bg-gray-700 text-white"
                      placeholder={t('buchen.step3.message_placeholder')}
                    />
                  </div>

                  <div className="mt-6 bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">{t('buchen.step3.summary_title')}</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p><strong>{t('buchen.step3.summary_girl')}</strong> {bookingData.girl}</p>
                      <p><strong>{t('buchen.step3.summary_service')}</strong> {bookingData.service}</p>
                      <p><strong>{t('buchen.step3.summary_date')}</strong> {bookingData.date}</p>
                      <p><strong>{t('buchen.step3.summary_time')}</strong> {bookingData.time}</p>
                    </div>
                  </div>

                  <div className="mt-6 bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {t('buchen.step3.disclaimer')}
                    </p>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="border border-rose-600 text-rose-400 px-8 py-3 rounded-lg font-semibold hover:bg-rose-600 hover:text-white transition-colors"
                    >
                      {t('buchen.button.back')}
                    </button>
                    <button
                      type="submit"
                      disabled={!bookingData.name || !bookingData.phone || isSubmitting}
                      className="bg-rose-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-rose-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {t('buchen.button.submitting')}
                        </>
                      ) : (
                        <>
                          <Heart className="w-5 h-5 mr-2" />
                          {t('buchen.button.submit')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Buchen;
