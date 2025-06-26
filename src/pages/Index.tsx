import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, DollarSign, Users, Menu, X, Star, TrendingUp, Shield, Link, BarChart3, Zap, Share2, MessageCircle, Instagram, Twitter, Clock } from "lucide-react";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    website: '',
    trafficSource: '',
    geoInterest: '',
    contact: '',
    socialPlatforms: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your interest! We will contact you within 24 hours to discuss partnership opportunities.');
    setFormData({ 
      fullName: '', 
      email: '', 
      website: '', 
      trafficSource: '',
      geoInterest: '',
      contact: '',
      socialPlatforms: '',
      message: '' 
    });
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-3xl font-black text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">
              REVILLION
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => scrollToSection('hero')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('why-join')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                Why Join
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('tools')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                Tools
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('offers')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                Offers
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-800 hover:text-orange-500 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('hero')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  Home
                </button>
                <button 
                  onClick={() => scrollToSection('why-join')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  Why Join
                </button>
                <button 
                  onClick={() => scrollToSection('tools')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  Tools
                </button>
                <button 
                  onClick={() => scrollToSection('offers')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  Offers
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  Contact
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,89,6,0.1)_0%,transparent_50%)]"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-6 py-2 mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-orange-500 mr-2" />
            <span className="text-orange-400 font-medium">#1 iGaming Affiliate Network</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 animate-fade-in leading-tight">
            Join <span className="text-transparent bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text">Revillion</span>
            <br />Affiliate Network
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto animate-fade-in leading-relaxed">
            Partner with the leading iGaming affiliate network and earn 
            <span className="text-orange-400 font-bold"> high CPA commissions</span> promoting 
            premium casino offers across global markets
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button 
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25"
            >
              Become an Affiliate
              <TrendingUp className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              onClick={() => scrollToSection('why-join')}
              variant="outline"
              className="border-2 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 bg-transparent"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text mb-2">
                $10M+
              </div>
              <p className="text-gray-600 font-semibold">Paid to Affiliates</p>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text mb-2">
                800
              </div>
              <p className="text-gray-600 font-semibold">Active Affiliates</p>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text mb-2">
                40+
              </div>
              <p className="text-gray-600 font-semibold">Global Markets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section id="why-join" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-600 font-semibold text-sm">WHY CHOOSE US</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Why Choose <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">Revillion</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join thousands of successful affiliates who trust Revillion for maximum revenue potential
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-orange-100 to-orange-200 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-10 h-10 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">Global Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Access premium casino and iGaming offers across multiple GEOs with high conversion rates 
                  and competitive payouts in every major market worldwide.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-10 h-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">High CPA Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Earn industry-leading CPA commissions on First-Time Deposits with transparent tracking 
                  and no hidden fees or deductions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">Dedicated Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Get personalized support from our experienced affiliate managers who help optimize 
                  your campaigns and maximize your earning potential 24/7.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Tools & Features Section */}
      <section id="tools" className="py-24 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-600 font-semibold text-sm">ADVANCED TOOLS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Powerful <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">Tools</span> & Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Advanced tracking tools and real-time analytics to maximize your affiliate success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Link className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">Smart Short URLs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  Custom short URLs that make sharing on social platforms easier and improve content memorability across Telegram, Twitter & Instagram.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  Advanced dashboard with real-time data tracking via postback system. Monitor registrations, deposits, and conversions instantly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">Instant Postback</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  Near real-time postback system delivers conversion data instantly, allowing you to optimize campaigns and track performance immediately.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-red-100 to-red-200 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">Advanced Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  Comprehensive tracking system monitors every step from registration to deposit, providing detailed insights for campaign optimization.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Real-Time Dashboard Preview */}
      <section className="py-24 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-400 font-semibold text-sm">LIVE DASHBOARD</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
              See Your <span className="text-transparent bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text">Performance</span> Live
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Monitor your campaigns with our advanced dashboard featuring real-time metrics, 
              instant postback data, and comprehensive analytics.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-orange-500/20 rounded-3xl p-8 mb-8">
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-orange-400 mb-2">1,247</div>
                  <div className="text-gray-300 text-sm font-semibold">Live Clicks</div>
                  <div className="flex items-center justify-center mt-2">
                    <Clock className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-xs">Real-time</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-green-400 mb-2">89</div>
                  <div className="text-gray-300 text-sm font-semibold">Registrations</div>
                  <div className="flex items-center justify-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-xs">+12% today</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-blue-400 mb-2">34</div>
                  <div className="text-gray-300 text-sm font-semibold">Deposits</div>
                  <div className="flex items-center justify-center mt-2">
                    <DollarSign className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-xs">$2,840 earned</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-purple-400 mb-2">7.2%</div>
                  <div className="text-gray-300 text-sm font-semibold">Conversion Rate</div>
                  <div className="flex items-center justify-center mt-2">
                    <BarChart3 className="w-4 h-4 text-orange-400 mr-1" />
                    <span className="text-orange-400 text-xs">Above avg</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-400 font-semibold text-sm">Data updated via postback in real-time</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={() => scrollToSection('contact')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                Access Your Dashboard
                <BarChart3 className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-600 font-semibold text-sm">PREMIUM OFFERS</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
              Premium <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">iGaming</span> Offers
            </h2>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Promote the best casino and iGaming brands across multiple GEOs with our extensive 
              portfolio of high-converting offers. From slots and table games to live dealer experiences, 
              we provide access to top-tier operators with proven track records.
            </p>
            
            <div className="bg-gradient-to-br from-orange-500/5 to-orange-600/5 border border-orange-500/20 rounded-3xl p-10 mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center justify-center">
                <Shield className="w-8 h-8 text-orange-500 mr-3" />
                Available Markets Include:
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    Europe (UK, Germany, Sweden, Norway)
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    Latin America (Brazil, Mexico, Chile)
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    Asia-Pacific (Japan, India, Australia)
                  </li>
                </ul>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    North America (US, Canada)
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    Africa (South Africa, Nigeria, Kenya)
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    And many more emerging markets
                  </li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Explore Our Offers
              <Globe className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Social Media Ready Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">        
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-600 font-semibold text-sm">SOCIAL MEDIA OPTIMIZED</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-gray-900">
              Perfect for <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">Social Media</span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Our smart short URLs and content tools are specifically designed for social media success 
              across all major platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">Telegram Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Short, memorable URLs perfect for Telegram channels and groups. Easy sharing with instant 
                  tracking and analytics for your community engagement.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-500"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Twitter className="w-10 h-10 text-blue-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">Twitter Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Character-efficient short links that leave more room for engaging content. Track clicks, 
                  engagement, and conversions from your Twitter campaigns effortlessly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-400"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-pink-50 to-orange-50 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Instagram className="w-10 h-10 text-pink-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">Instagram Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Clean, professional short URLs perfect for Instagram bio links and stories. 
                  Improve memorability and drive more traffic from your visual content.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-br from-orange-500/5 to-orange-600/5 border border-orange-500/20 rounded-3xl p-10 mb-12 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center justify-center">
              <Share2 className="w-8 h-8 text-orange-500 mr-3" />
              Short URL Examples:
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-orange-500 font-mono text-lg mb-2 font-bold">rev.ly/casino-win</div>
                <div className="text-gray-600 text-sm">Perfect for social posts</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-orange-500 font-mono text-lg mb-2 font-bold">rev.ly/slots-bonus</div>
                <div className="text-gray-600 text-sm">Easy to remember</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-orange-500 font-mono text-lg mb-2 font-bold">rev.ly/mega-jackpot</div>
                <div className="text-gray-600 text-sm">Branded and clean</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Get Your Short URLs
              <Share2 className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
                <span className="text-orange-600 font-semibold text-sm">GET STARTED</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Ready to Get <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">Started</span>?
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Contact us today and start earning with Revillion's premium affiliate program
              </p>
            </div>

            <Card className="shadow-2xl border-0 bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardContent className="p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-bold text-gray-800 mb-3">
                        Full Name *
                      </label>
                      <Input
                        id="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full h-12 border-2 border-gray-200 focus:border-orange-500 rounded-lg text-lg"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-3">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full h-12 border-2 border-gray-200 focus:border-orange-500 rounded-lg text-lg"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="website" className="block text-sm font-bold text-gray-800 mb-3">
                        Website/Traffic Source *
                      </label>
                      <Input
                        id="website"
                        type="url"
                        required
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        className="w-full h-12 border-2 border-gray-200 focus:border-orange-500 rounded-lg text-lg"
                        placeholder="https://your-website.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="trafficSource" className="block text-sm font-bold text-gray-800 mb-3">
                        Primary Traffic Source *
                      </label>
                      <Input
                        id="trafficSource"
                        type="text"
                        required
                        value={formData.trafficSource}
                        onChange={(e) => setFormData({...formData, trafficSource: e.target.value})}
                        className="w-full h-12 border-2 border-gray-200 focus:border-orange-500 rounded-lg text-lg"
                        placeholder="Social Media, PPC, Email, SEO, etc."
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="geoInterest" className="block text-sm font-bold text-gray-800 mb-3">
                        GEOs of Interest
                      </label>
                      <Input
                        id="geoInterest"
                        type="text"
                        value={formData.geoInterest}
                        onChange={(e) => setFormData({...formData, geoInterest: e.target.value})}
                        className="w-full h-12 border-2 border-gray-200 focus:border-orange-500 rounded-lg text-lg"
                        placeholder="UK, Germany, Brazil, etc."
                      />
                    </div>

                    <div>
                      <label htmlFor="contact" className="block text-sm font-bold text-gray-800 mb-3">
                        Telegram/Phone Contact
                      </label>
                      <Input
                        id="contact"
                        type="text"
                        value={formData.contact}
                        onChange={(e) => setFormData({...formData, contact: e.target.value})}
                        className="w-full h-12 border-2 border-gray-200 focus:border-orange-500 rounded-lg text-lg"
                        placeholder="Telegram: @username or Phone: +1234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="socialPlatforms" className="block text-sm font-bold text-gray-800 mb-3">
                      Social Media Platforms Used
                    </label>
                    <Input
                      id="socialPlatforms"
                      type="text"
                      value={formData.socialPlatforms}
                      onChange={(e) => setFormData({...formData, socialPlatforms: e.target.value})}
                      className="w-full h-12 border-2 border-gray-200 focus:border-orange-500 rounded-lg text-lg"
                      placeholder="Telegram, Twitter, Instagram, TikTok, etc."
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-bold text-gray-800 mb-3">
                      Additional Information
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-lg text-lg"
                      rows={5}
                      placeholder="Tell us about your experience with affiliate marketing, preferred commission structure, or any specific requirements..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 text-lg rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-xl"
                  >
                    Submit Application
                    <Star className="ml-2 w-5 h-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-black to-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-3xl font-black mb-6 text-transparent bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text">
            REVILLION
          </div>
          <p className="text-gray-400 text-lg">
            © 2025 Revillion. All rights reserved. Professional iGaming Affiliate Network.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
