
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Trophy, Users, DollarSign, Play, ArrowRight, Shield, Zap, Clock } from "lucide-react";

const Index = () => {
  const casinos = [
    { name: "365BET", logo: "/placeholder.svg", rating: 4.8, bonus: "100% fino a €500" },
    { name: "22BET", logo: "/placeholder.svg", rating: 4.7, bonus: "100% fino a €300" },
    { name: "BET LABEL", logo: "/placeholder.svg", rating: 4.6, bonus: "50 Free Spins" },
  ];

  const features = [
    { icon: Shield, title: "Sicuro e Affidabile", description: "Tutti i nostri partner sono licenziati e regolamentati" },
    { icon: Zap, title: "Bonus Esclusivi", description: "Offerte speciali disponibili solo attraverso il nostro sito" },
    { icon: Clock, title: "Supporto 24/7", description: "Il nostro team è sempre pronto ad aiutarti" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold text-brand-orange">REVILLION</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-brand-orange transition-colors">Casino</a>
            <a href="#" className="text-gray-300 hover:text-brand-orange transition-colors">Sport</a>
            <a href="#" className="text-gray-300 hover:text-brand-orange transition-colors">Live</a>
            <a href="#" className="text-gray-300 hover:text-brand-orange transition-colors">Promozioni</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white">
              Accedi
            </Button>
            <Button className="bg-brand-orange hover:bg-brand-orange-dark text-white">
              Registrati
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-brand-orange-lighter/20 text-brand-orange border-brand-orange/30">
            🎰 Nuovi Giochi Ogni Settimana
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Il Miglior Casino
            <br />
            <span className="bg-gradient-to-r from-brand-orange to-brand-orange-light bg-clip-text text-transparent">
              Online d'Italia
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Scopri migliaia di giochi, bonus esclusivi e vincite incredibili. 
            La tua fortuna ti aspetta!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
            <Button size="lg" className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 text-lg">
              <Play className="mr-2 h-5 w-5" />
              Gioca Ora
            </Button>
            <Button size="lg" variant="outline" className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white px-8 py-4 text-lg">
              Scopri i Bonus
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-orange mb-2">$10M+</div>
              <div className="text-gray-300">Vincite Erogate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-orange mb-2">800+</div>
              <div className="text-gray-300">Giochi Disponibili</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-orange mb-2">40+</div>
              <div className="text-gray-300">Provider Premium</div>
            </div>
          </div>
        </div>
      </section>

      {/* Casino Section */}
      <section className="px-6 py-16 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Casino Raccomandati
            </h2>
            <p className="text-gray-300 text-lg">
              I migliori casino online selezionati dal nostro team di esperti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {casinos.map((casino, index) => (
              <Card key={index} className="bg-slate-700/50 border-slate-600 hover:border-brand-orange/50 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white rounded-lg p-3 w-16 h-16 flex items-center justify-center border-2 border-red-500 group-hover:border-brand-orange transition-colors">
                      <img
                        src={casino.logo}
                        alt={`${casino.name} logo`}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          console.info(`Error loading ${casino.name} logo`);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-brand-orange font-bold text-sm">${casino.name.substring(0, 3)}</span>`;
                          }
                        }}
                      />
                    </div>
                    <Badge className="bg-brand-orange-lighter/20 text-brand-orange border-brand-orange/30">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {casino.rating}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{casino.name}</h3>
                  <p className="text-brand-orange-light font-semibold mb-4">{casino.bonus}</p>
                  <Button className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white">
                    Gioca Ora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Perché Scegliere Noi
            </h2>
            <p className="text-gray-300 text-lg">
              Esperienza di gioco sicura, divertente e redditizia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-orange/30 transition-colors">
                  <feature.icon className="w-8 h-8 text-brand-orange" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-gradient-to-r from-brand-orange-dark to-brand-orange">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronto a Vincere?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Unisciti a migliaia di giocatori che hanno già scelto la vittoria
          </p>
          <Button size="lg" className="bg-white text-brand-orange hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
            <DollarSign className="mr-2 h-5 w-5" />
            Inizia a Giocare
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <span className="text-xl font-bold text-brand-orange">REVILLION</span>
              </div>
              <p className="text-gray-400">
                Il tuo casino online di fiducia dal 2020
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Giochi</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-brand-orange transition-colors">Slot Machine</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Blackjack</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Roulette</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Poker</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Supporto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-brand-orange transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Live Chat</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Email</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Telefono</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legale</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-brand-orange transition-colors">Termini e Condizioni</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Gioco Responsabile</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Licenze</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Revillion. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
