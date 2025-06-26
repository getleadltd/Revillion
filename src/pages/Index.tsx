
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, DollarSign, Users, Menu, X, TrendingUp, Award, Shield } from "lucide-react";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    website: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Grazie per il tuo interesse! Ti contatteremo entro 24 ore per discutere le opportunità di partnership.');
    setFormData({ fullName: '', email: '', website: '', message: '' });
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black shadow-2xl sticky top-0 z-50 border-b-4 border-[#ff5906]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="text-3xl font-black text-[#ff5906] tracking-wider">
              REVILLION
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-10">
              <button 
                onClick={() => scrollToSection('hero')}
                className="text-white hover:text-[#ff5906] transition-all duration-300 font-semibold text-lg relative group"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff5906] group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => scrollToSection('why-join')}
                className="text-white hover:text-[#ff5906] transition-all duration-300 font-semibold text-lg relative group"
              >
                Perché Unirsi
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff5906] group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => scrollToSection('offers')}
                className="text-white hover:text-[#ff5906] transition-all duration-300 font-semibold text-lg relative group"
              >
                Offerte
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff5906] group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-white hover:text-[#ff5906] transition-all duration-300 font-semibold text-lg relative group"
              >
                Contatti
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff5906] group-hover:w-full transition-all duration-300"></span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white hover:text-[#ff5906] transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-6 pb-6 border-t border-gray-700 pt-6">
              <div className="flex flex-col space-y-6">
                <button 
                  onClick={() => scrollToSection('hero')}
                  className="text-white hover:text-[#ff5906] transition-colors font-semibold text-lg text-left"
                >
                  Home
                </button>
                <button 
                  onClick={() => scrollToSection('why-join')}
                  className="text-white hover:text-[#ff5906] transition-colors font-semibold text-lg text-left"
                >
                  Perché Unirsi
                </button>
                <button 
                  onClick={() => scrollToSection('offers')}
                  className="text-white hover:text-[#ff5906] transition-colors font-semibold text-lg text-left"
                >
                  Offerte
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-white hover:text-[#ff5906] transition-colors font-semibold text-lg text-left"
                >
                  Contatti
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ff5906" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              Unisciti alla Rete di Affiliazione
              <span className="block text-[#ff5906] mt-4">REVILLION</span>
            </h1>
            <p className="text-xl md:text-3xl mb-12 text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Collabora con la rete di affiliazione iGaming leader e guadagna 
              <span className="text-[#ff5906] font-bold"> commissioni CPA elevate</span> 
              promuovendo offerte di casinò premium nei mercati globali
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                onClick={() => scrollToSection('contact')}
                className="bg-[#ff5906] hover:bg-[#e54d05] text-white font-bold py-6 px-12 text-xl rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-[#ff5906]/50 border-2 border-[#ff5906]"
              >
                <TrendingUp className="mr-3" size={24} />
                Diventa un Affiliato
              </Button>
              <Button 
                onClick={() => scrollToSection('why-join')}
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-bold py-6 px-12 text-xl rounded-full transition-all duration-300 transform hover:scale-105"
              >
                Scopri di Più
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Why Join Section */}
      <section id="why-join" className="py-24 bg-white relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff5906] to-transparent"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-black mb-6">
              Perché Scegliere 
              <span className="text-[#ff5906]"> REVILLION</span>?
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Unisciti a migliaia di affiliati di successo che si fidano di Revillion per massimizzare il potenziale di guadagno
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <Card className="text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white border-2 border-transparent hover:border-[#ff5906] group">
              <CardHeader className="pb-8">
                <div className="mx-auto bg-gradient-to-br from-[#ff5906] to-[#e54d05] p-6 rounded-full w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-black group-hover:text-[#ff5906] transition-colors">Offerte Globali</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Accedi a offerte premium di casinò e iGaming in più GEO con alti tassi di conversione 
                  e pagamenti competitivi in ogni mercato principale mondiale.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white border-2 border-transparent hover:border-[#ff5906] group">
              <CardHeader className="pb-8">
                <div className="mx-auto bg-gradient-to-br from-[#ff5906] to-[#e54d05] p-6 rounded-full w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-black group-hover:text-[#ff5906] transition-colors">Commissioni CPA Elevate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Guadagna commissioni CPA leader del settore sui Primi Depositi con tracking trasparente, 
                  pagamenti settimanali e nessuna commissione nascosta.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white border-2 border-transparent hover:border-[#ff5906] group">
              <CardHeader className="pb-8">
                <div className="mx-auto bg-gradient-to-br from-[#ff5906] to-[#e54d05] p-6 rounded-full w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-black group-hover:text-[#ff5906] transition-colors">Supporto Dedicato</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Ricevi supporto personalizzato dai nostri affiliate manager esperti che ti aiutano a ottimizzare 
                  le tue campagne e massimizzare il tuo potenziale di guadagno 24/7.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="py-24 bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ff5906" fill-opacity="0.05"%3E%3Cpath d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z"/%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-8">
              Offerte Premium 
              <span className="text-[#ff5906]"> iGaming</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
              Promuovi i migliori brand di casinò e iGaming in più GEO con il nostro ampio 
              portfolio di offerte ad alta conversione. Da slot e giochi da tavolo a esperienze live dealer, 
              forniamo accesso a operatori di primo livello con track record comprovati.
            </p>
            
            <div className="bg-gradient-to-r from-[#ff5906]/20 to-[#e54d05]/20 backdrop-blur-sm p-10 rounded-3xl mb-12 border border-[#ff5906]/30 shadow-2xl">
              <h3 className="text-3xl font-bold text-[#ff5906] mb-8 flex items-center justify-center">
                <Award className="mr-4" size={32} />
                Mercati Disponibili Includono:
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                <ul className="space-y-4">
                  <li className="flex items-center text-white text-lg">
                    <span className="w-3 h-3 bg-[#ff5906] rounded-full mr-4 animate-pulse"></span>
                    Europa (UK, Germania, Svezia, Norvegia)
                  </li>
                  <li className="flex items-center text-white text-lg">
                    <span className="w-3 h-3 bg-[#ff5906] rounded-full mr-4 animate-pulse"></span>
                    America Latina (Brasile, Messico, Cile)
                  </li>
                </ul>
                <ul className="space-y-4">
                  <li className="flex items-center text-white text-lg">
                    <span className="w-3 h-3 bg-[#ff5906] rounded-full mr-4 animate-pulse"></span>
                    Asia-Pacifico (Giappone, India, Australia)
                  </li>
                  <li className="flex items-center text-white text-lg">
                    <span className="w-3 h-3 bg-[#ff5906] rounded-full mr-4 animate-pulse"></span>
                    Nord America (USA, Canada)
                  </li>
                </ul>
                <ul className="space-y-4">
                  <li className="flex items-center text-white text-lg">
                    <span className="w-3 h-3 bg-[#ff5906] rounded-full mr-4 animate-pulse"></span>
                    Africa (Sud Africa, Nigeria, Kenya)
                  </li>
                  <li className="flex items-center text-white text-lg">
                    <span className="w-3 h-3 bg-[#ff5906] rounded-full mr-4 animate-pulse"></span>
                    E molti altri mercati emergenti
                  </li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={() => scrollToSection('contact')}
              className="bg-[#ff5906] hover:bg-[#e54d05] text-white font-bold py-6 px-12 text-xl rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-[#ff5906]/50"
            >
              <Shield className="mr-3" size={24} />
              Esplora le Nostre Offerte
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-24 bg-white relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff5906] to-transparent"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black text-black mb-6">
                Pronto per 
                <span className="text-[#ff5906]"> Iniziare</span>?
              </h2>
              <p className="text-2xl text-gray-600 leading-relaxed">
                Contattaci oggi e inizia a guadagnare con il programma di affiliazione premium di Revillion
              </p>
            </div>

            <Card className="shadow-2xl border-2 border-gray-100 hover:border-[#ff5906] transition-all duration-300">
              <CardContent className="p-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label htmlFor="fullName" className="block text-lg font-semibold text-black mb-3">
                      Nome Completo *
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full h-14 text-lg border-2 border-gray-200 focus:border-[#ff5906] transition-colors rounded-lg"
                      placeholder="Inserisci il tuo nome completo"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-lg font-semibold text-black mb-3">
                      Indirizzo Email *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full h-14 text-lg border-2 border-gray-200 focus:border-[#ff5906] transition-colors rounded-lg"
                      placeholder="Inserisci il tuo indirizzo email"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-lg font-semibold text-black mb-3">
                      Sito Web/Fonte di Traffico *
                    </label>
                    <Input
                      id="website"
                      type="url"
                      required
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full h-14 text-lg border-2 border-gray-200 focus:border-[#ff5906] transition-colors rounded-lg"
                      placeholder="https://il-tuo-sito.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-lg font-semibold text-black mb-3">
                      Messaggio
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full text-lg border-2 border-gray-200 focus:border-[#ff5906] transition-colors rounded-lg"
                      rows={6}
                      placeholder="Raccontaci delle tue fonti di traffico e della tua esperienza con l'affiliate marketing..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#ff5906] hover:bg-[#e54d05] text-white font-bold py-6 text-xl rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl"
                  >
                    Invia Candidatura
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t-4 border-[#ff5906]">
        <div className="container mx-auto px-4 text-center">
          <div className="text-3xl font-black mb-6 text-[#ff5906]">REVILLION</div>
          <p className="text-gray-400 text-lg">
            © 2025 Revillion. Tutti i diritti riservati. Rete di Affiliazione iGaming Professionale.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
