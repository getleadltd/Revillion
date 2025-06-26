
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, DollarSign, Users, Menu, X } from "lucide-react";

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
    alert('Thank you for your interest! We will contact you within 24 hours to discuss partnership opportunities.');
    setFormData({ fullName: '', email: '', website: '', message: '' });
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-900">
              REVILLION
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => scrollToSection('hero')}
                className="text-gray-700 hover:text-blue-900 transition-colors font-medium"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('why-join')}
                className="text-gray-700 hover:text-blue-900 transition-colors font-medium"
              >
                Why Join
              </button>
              <button 
                onClick={() => scrollToSection('offers')}
                className="text-gray-700 hover:text-blue-900 transition-colors font-medium"
              >
                Offers
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-700 hover:text-blue-900 transition-colors font-medium"
              >
                Contact
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('hero')}
                  className="text-gray-700 hover:text-blue-900 transition-colors font-medium text-left"
                >
                  Home
                </button>
                <button 
                  onClick={() => scrollToSection('why-join')}
                  className="text-gray-700 hover:text-blue-900 transition-colors font-medium text-left"
                >
                  Why Join
                </button>
                <button 
                  onClick={() => scrollToSection('offers')}
                  className="text-gray-700 hover:text-blue-900 transition-colors font-medium text-left"
                >
                  Offers
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-700 hover:text-blue-900 transition-colors font-medium text-left"
                >
                  Contact
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Join Revillion Affiliate Network
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto animate-fade-in">
            Partner with the leading iGaming affiliate network and earn high CPA commissions 
            promoting premium casino offers across global markets
          </p>
          <Button 
            onClick={() => scrollToSection('contact')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 text-lg rounded-lg transition-all duration-300 transform hover:scale-105 animate-fade-in"
          >
            Become an Affiliate
          </Button>
        </div>
      </section>

      {/* Why Join Section */}
      <section id="why-join" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Revillion?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of successful affiliates who trust Revillion for maximum revenue potential
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="mx-auto bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-blue-900" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Global Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Access premium casino and iGaming offers across multiple GEOs with high conversion rates 
                  and competitive payouts in every major market worldwide.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="mx-auto bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-green-700" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">High CPA Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Earn industry-leading CPA commissions on First-Time Deposits with transparent tracking, 
                  weekly payments, and no hidden fees or deductions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="mx-auto bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-purple-700" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Dedicated Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Get personalized support from our experienced affiliate managers who help optimize 
                  your campaigns and maximize your earning potential 24/7.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Premium iGaming Offers
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Promote the best casino and iGaming brands across multiple GEOs with our extensive 
              portfolio of high-converting offers. From slots and table games to live dealer experiences, 
              we provide access to top-tier operators with proven track records.
            </p>
            <div className="bg-blue-50 p-8 rounded-lg mb-8">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Available Markets Include:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Europe (UK, Germany, Sweden, Norway)
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Latin America (Brazil, Mexico, Chile)
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Asia-Pacific (Japan, India, Australia)
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    North America (US, Canada)
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Africa (South Africa, Nigeria, Kenya)
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    And many more emerging markets
                  </li>
                </ul>
              </div>
            </div>
            <Button 
              onClick={() => scrollToSection('contact')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 text-lg rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Explore Our Offers
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-600">
                Contact us today and start earning with Revillion's premium affiliate program
              </p>
            </div>

            <Card className="shadow-lg">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      Website/Traffic Source *
                    </label>
                    <Input
                      id="website"
                      type="url"
                      required
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full"
                      placeholder="https://your-website.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full"
                      rows={4}
                      placeholder="Tell us about your traffic sources and experience with affiliate marketing..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 text-lg rounded-lg transition-all duration-300"
                  >
                    Submit Application
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-bold mb-4">REVILLION</div>
          <p className="text-blue-200">
            © 2025 Revillion. All rights reserved. Professional iGaming Affiliate Network.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
