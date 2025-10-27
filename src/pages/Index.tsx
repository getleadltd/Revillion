import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trackCTAClick } from "@/lib/analytics";
import { Globe, DollarSign, Users, Menu, X, Star, TrendingUp, Shield, Link, BarChart3, Zap, Share2, MessageCircle, Instagram, Twitter, Clock, HelpCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { SEOHead } from "@/components/SEOHead";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import revillionLogo from "@/assets/revillion-logo.png?format=webp&quality=85&w=170";
import bassbetLogo from "@/assets/Bassbet-partner.png?partner";
import rabonaLogo from "@/assets/Rabona-partner.png?partner";
import spinitLogo from "@/assets/Spinit-partner.png?partner";
import onlyspinsLogo from "@/assets/Onlyspins-partner.png?partner";
import bet22Logo from "@/assets/22bet-partner-3.png?partner";
import azurslotLogo from "@/assets/azurslot-partner.png?partner";
import safecasinoLogo from "@/assets/safecasino-partner.png?partner";
import robocatLogo from "@/assets/robocat-partner.png?partner";
import betlabelLogo from "@/assets/betlabel-partner.png?partner";
import cazeusLogo from "@/assets/cazeus-partner.png?partner";
import burancasinoLogo from "@/assets/burancasino-partner.png?partner";
import casiniaLogo from "@/assets/casinia-partner.png?partner";
import librabetLogo from "@/assets/librabet-partner.png?partner";
import nominiLogo from "@/assets/nomini-partner.png?partner";
import tikitakaLogo from "@/assets/tikitaka-partner.png?partner";
import spinangaLogo from "@/assets/spinanga-partner.png?partner";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead />
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <img 
              src={revillionLogo} 
              alt="Revillion Logo" 
              width="170"
              height="48"
              className="h-12 w-auto"
            />
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <button 
                onClick={() => scrollToSection('hero')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                {t('nav.home')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('why-join')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                {t('nav.whyJoin')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('tools')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                {t('nav.tools')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('offers')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                {t('nav.offers')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
              >
                {t('nav.faq')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <LanguageSwitcher />
            </nav>

            {/* Mobile: Language Switcher + Menu Button */}
            <div className="flex md:hidden items-center gap-3">
              <LanguageSwitcher />
              <button 
                className="text-gray-800 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav id="mobile-navigation" className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('hero')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  {t('nav.home')}
                </button>
                <button 
                  onClick={() => scrollToSection('why-join')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  {t('nav.whyJoin')}
                </button>
                <button 
                  onClick={() => scrollToSection('tools')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  {t('nav.tools')}
                </button>
                <button 
                  onClick={() => scrollToSection('offers')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  {t('nav.offers')}
                </button>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                >
                  {t('nav.faq')}
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main>
        {/* Hero Section */}
      <section id="hero" className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-16 md:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,89,6,0.1)_0%,transparent_50%)]"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-6 py-2 mb-6 md:mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-orange-500 mr-2" />
            <span className="text-orange-400 font-medium">{t('hero.badge')}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 animate-fade-in leading-tight">
            {t('hero.title').split('Revillion')[0]}<span className="text-transparent bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text">{t('hero.titleHighlight')}</span>
            <br />{t('hero.title').split('Revillion')[1]}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto animate-fade-in leading-relaxed">
            {t('hero.description')}{' '}
            <span className="text-orange-400 font-bold">{t('hero.descriptionHighlight')}</span> {t('hero.descriptionEnd')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <a 
              href="https://dashboard.revillion.com/en/registration"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick('hero_section')}
              className="inline-block"
            >
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25">
                {t('hero.cta')}
                <TrendingUp className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <Button 
              onClick={() => scrollToSection('why-join')}
              variant="outline"
              className="border-2 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 bg-transparent"
            >
              {t('hero.learnMore')}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 md:py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text mb-2">
                $10M+
              </div>
              <p className="text-gray-600 font-semibold">{t('stats.paid')}</p>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text mb-2">
                800
              </div>
              <p className="text-gray-600 font-semibold">{t('stats.affiliates')}</p>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text mb-2">
                40+
              </div>
              <p className="text-gray-600 font-semibold">{t('stats.markets')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Casino Partners Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-600 font-semibold text-sm">{t('partners.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
              {t('partners.title')} <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">{t('partners.titleHighlight')}</span> {t('partners.titleEnd')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('partners.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {/* BassBet */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={bassbetLogo} 
                    alt="BassBet - Licensed iGaming Partner Casino" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Rabona */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={rabonaLogo} 
                    alt="Rabona - Premium Online Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Spinit */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={spinitLogo} 
                    alt="Spinit - Licensed Casino Affiliate Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Only spins */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={onlyspinsLogo} 
                    alt="OnlySpins - Trusted iGaming Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* 22Bet */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={bet22Logo} 
                    alt="22Bet - Global Casino & Sports Betting Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Azurslot */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={azurslotLogo} 
                    alt="Azurslot - Premium Slot Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* SafeCasino */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={safecasinoLogo} 
                    alt="SafeCasino - Secure Licensed iGaming Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Robocat */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={robocatLogo} 
                    alt="Robocat - Innovative Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Betlabel */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={betlabelLogo} 
                    alt="Betlabel - Licensed Betting Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Cazeus */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={cazeusLogo} 
                    alt="Cazeus - Premium iGaming Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* BuranCasino */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={burancasinoLogo} 
                    alt="Buran Casino - Trusted Online Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Casinia */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={casiniaLogo} 
                    alt="Casinia - Licensed Casino Affiliate Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Librabet */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={librabetLogo} 
                    alt="Librabet - Premium Betting & Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Nomini */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={nominiLogo} 
                    alt="Nomini - Trusted iGaming Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Tikitaka */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={tikitakaLogo} 
                    alt="Tikitaka - Licensed Sports & Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Spinanga */}
            <div className="group">
              <div className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img 
                    src={spinangaLogo} 
                    alt="Spinanga - Premium Online Casino Partner" 
                    width="150"
                    height="67"
                    className="h-16 w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center bg-green-500/10 border border-green-500/20 rounded-full px-6 py-3 mb-6">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-700 font-semibold">{t('partners.licensed')}</span>
            </div>
            <p className="text-gray-600 max-w-3xl mx-auto">
              {t('partners.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section id="why-join" className="py-12 md:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-20">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-600 font-semibold text-sm">{t('whyJoin.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              {t('whyJoin.title')} <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">{t('whyJoin.titleHighlight')}</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('whyJoin.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-orange-100 to-orange-200 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-10 h-10 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{t('whyJoin.globalOffers.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {t('whyJoin.globalOffers.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-10 h-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{t('whyJoin.highCommissions.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {t('whyJoin.highCommissions.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{t('whyJoin.dedicatedSupport.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {t('whyJoin.dedicatedSupport.description')}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Tools & Features Section */}
      <section id="tools" className="py-12 md:py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-20">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-600 font-semibold text-sm">{t('tools.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              {t('tools.title')} <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">{t('tools.titleHighlight')}</span> {t('tools.titleEnd')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('tools.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Link className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">{t('tools.smartUrls.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  {t('tools.smartUrls.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">{t('tools.analytics.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  {t('tools.analytics.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">{t('tools.postback.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  {t('tools.postback.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-red-100 to-red-200 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">{t('tools.tracking.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  {t('tools.tracking.description')}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Real-Time Dashboard Preview */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2">
              <span className="text-orange-400 font-semibold text-sm">{t('dashboard.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
              {t('dashboard.title')} <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">{t('dashboard.titleHighlight')}</span> {t('dashboard.titleEnd')}
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-orange-500/20 rounded-3xl p-8 mb-8">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-orange-400 mb-2">1,247</div>
                  <div className="text-gray-300 text-sm font-semibold">{t('dashboard.liveClicks')}</div>
                  <div className="flex items-center justify-center mt-2">
                    <Clock className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-xs">{t('dashboard.realtime')}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-green-400 mb-2">89</div>
                  <div className="text-gray-300 text-sm font-semibold">{t('dashboard.registrations')}</div>
                  <div className="flex items-center justify-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-xs">+12% {t('dashboard.today')}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-blue-400 mb-2">34</div>
                  <div className="text-gray-300 text-sm font-semibold">{t('dashboard.deposits')}</div>
                  <div className="flex items-center justify-center mt-2">
                    <DollarSign className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-xs">{t('dashboard.earned')}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-400 font-semibold text-sm">{t('dashboard.realtimeUpdate')}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a 
                href="https://dashboard.revillion.com/en/registration"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCTAClick('dashboard_section')}
                className="inline-block"
              >
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl">
                  {t('dashboard.accessButton')}
                  <BarChart3 className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="py-12 md:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-600 font-semibold text-sm">{t('offers.badge')}</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
              {t('offers.title')} <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">{t('offers.titleHighlight')}</span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              {t('offers.subtitle')}
            </p>
            
            <div className="bg-gradient-to-br from-orange-500/5 to-orange-600/5 border border-orange-500/20 rounded-3xl p-10 mb-8 md:mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center justify-center">
                <Shield className="w-8 h-8 text-orange-500 mr-3" />
                {t('offers.marketsTitle')}
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    {t('offers.markets.europe')}
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    {t('offers.markets.latam')}
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    {t('offers.markets.asiaPacific')}
                  </li>
                </ul>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    {t('offers.markets.northAmerica')}
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    {t('offers.markets.africa')}
                  </li>
                  <li className="flex items-center text-gray-700 text-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-4"></div>
                    {t('offers.markets.moreMarkets')}
                  </li>
                </ul>
              </div>
            </div>
            
            <a 
              href="https://dashboard.revillion.com/en/registration"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick('offers_section')}
              className="inline-block"
            >
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl">
                {t('offers.exploreButton')}
                <Globe className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Social Media Ready Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-gray-50 to-white">        
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-600 font-semibold text-sm">{t('socialMedia.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-gray-900">
              {t('socialMedia.title')} <span className="text-transparent bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text">{t('socialMedia.titleHighlight')}</span> {t('socialMedia.titleEnd')}
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              {t('socialMedia.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8 md:mb-12">
            <Card className="bg-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{t('socialMedia.telegram.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {t('socialMedia.telegram.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-500"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Twitter className="w-10 h-10 text-blue-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{t('socialMedia.twitter.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {t('socialMedia.twitter.description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-400"></div>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-br from-pink-50 to-orange-50 p-6 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Instagram className="w-10 h-10 text-pink-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{t('socialMedia.instagram.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {t('socialMedia.instagram.description')}
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-br from-orange-500/5 to-orange-600/5 border border-orange-500/20 rounded-3xl p-10 mb-8 md:mb-12 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center justify-center">
              <Share2 className="w-8 h-8 text-orange-500 mr-3" />
              {t('socialMedia.urlExamplesTitle')}
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-orange-500 font-mono text-lg mb-2 font-bold">rev.ly/casino-win</div>
                <div className="text-gray-600 text-sm">{t('socialMedia.urlExample1')}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-orange-500 font-mono text-lg mb-2 font-bold">rev.ly/slots-bonus</div>
                <div className="text-gray-600 text-sm">{t('socialMedia.urlExample2')}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-orange-500 font-mono text-lg mb-2 font-bold">rev.ly/mega-jackpot</div>
                <div className="text-gray-600 text-sm">{t('socialMedia.urlExample3')}</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a 
              href="https://dashboard.revillion.com/en/registration"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick('social_media_section')}
              className="inline-block"
            >
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl">
                {t('socialMedia.getUrlsButton')}
                <Share2 className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-black py-20 md:py-32 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            {t('finalCta.title')}
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('finalCta.subtitle')}
          </p>
          
          {/* Stats or benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">16+</div>
              <div className="text-white/80">{t('finalCta.stat1')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">{t('finalCta.stat2Value')}</div>
              <div className="text-white/80">{t('finalCta.stat2')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/80">{t('finalCta.stat3')}</div>
            </div>
          </div>
          
          {/* Main CTA */}
          <a 
            href="https://dashboard.revillion.com/en/registration"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCTAClick('final_cta_section')}
            className="inline-block"
          >
            <Button className="bg-white text-orange-600 hover:bg-gray-100 font-bold py-6 px-12 text-xl rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-white/25">
              {t('finalCta.button')}
              <TrendingUp className="ml-3 w-6 h-6" />
            </Button>
          </a>
          
          <p className="text-white/70 text-sm mt-6">
            {t('finalCta.footer')}
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <HelpCircle className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-orange-600 font-semibold text-sm">{t('faq.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
              {t('faq.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-white rounded-xl shadow-md border border-gray-100 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                  {t('faq.q1.question')}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {t('faq.q1.answer')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white rounded-xl shadow-md border border-gray-100 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                  {t('faq.q2.question')}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {t('faq.q2.answer')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white rounded-xl shadow-md border border-gray-100 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                  {t('faq.q3.question')}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {t('faq.q3.answer')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white rounded-xl shadow-md border border-gray-100 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                  {t('faq.q4.question')}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {t('faq.q4.answer')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white rounded-xl shadow-md border border-gray-100 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                  {t('faq.q5.question')}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {t('faq.q5.answer')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-black to-gray-900 text-white py-6 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <img 
            src={revillionLogo} 
            alt="Revillion Logo" 
            className="h-12 w-auto mx-auto mb-6"
          />
          <p className="text-gray-400 text-lg">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
