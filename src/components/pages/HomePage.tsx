// HPI 1.6-V
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { 
  Building2, 
  Calculator, 
  Users, 
  TrendingUp, 
  Home, 
  Key, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  MapPin,
  BadgePercent,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BaseCrudService } from '@/integrations';
import { Imveis } from '@/entities';

// --- Utility Components for Motion & Layout ---

// Scroll Reveal Component (Intersection Observer)
const ScrollReveal = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('is-visible');
        observer.unobserve(element);
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-out opacity-0 translate-y-12 motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <style>{`
        .is-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
      {children}
    </div>
  );
};

// Parallax Image Component
const ParallaxImage = ({ src, alt, className, speed = 0.5 }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="w-full h-[120%] -mt-[10%]">
        <Image
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          width={1600}
        />
      </motion.div>
    </div>
  );
};

// Sticky Section Component
const StickySection = ({ title, subtitle, children }) => {
  return (
    <section className="relative w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-24 lg:py-32">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        <div className="lg:w-1/3">
          <div className="sticky top-32">
            <ScrollReveal>
              <h2 className="font-heading text-4xl lg:text-6xl text-secondary mb-6 leading-tight">
                {title}
              </h2>
              <p className="font-paragraph text-lg text-primary-foreground/80 leading-relaxed mb-8">
                {subtitle}
              </p>
              <div className="h-1 w-24 bg-brandaccent rounded-full" />
            </ScrollReveal>
          </div>
        </div>
        <div className="lg:w-2/3 space-y-12 lg:space-y-24">
          {children}
        </div>
      </div>
    </section>
  );
};

// --- Main Page Component ---

export default function HomePage() {
  // 1. Data Fidelity Protocol: Identify & Canonize
  const [featuredProperties, setFeaturedProperties] = useState<Imveis[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Data Fidelity Protocol: Preserve Logic
  useEffect(() => {
    const loadFeaturedProperties = async () => {
      try {
        const { items } = await BaseCrudService.getAll<Imveis>('imoveis');
        setFeaturedProperties(items.slice(0, 3)); // Utilizing the canonical source
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProperties();
  }, []);

  // Mouse move effect for hero
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    mouseX.set(clientX);
    mouseY.set(clientY);
  };

  return (
    <div className="min-h-screen bg-primary text-foreground overflow-x-clip selection:bg-brandaccent selection:text-white" onMouseMove={handleMouseMove}>
      <Header />

      {/* --- HERO SECTION --- */}
      {/* Replicating the structure of the inspiration image: Left aligned text, Right aligned abstract motif */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-gradient-to-b from-brandaccent/10 to-transparent rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-gradient-to-t from-secondary/5 to-transparent rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4" />
        </div>

        <div className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Typography & Action */}
          <div className="space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
                <span className="font-heading text-sm tracking-widest uppercase text-secondary">Especialistas Caixa</span>
              </div>
              
              <h1 className="font-heading text-6xl lg:text-8xl font-bold leading-[0.95] tracking-tight text-white mb-8">
                O Futuro do <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-brandaccent">
                  Seu Patrimônio
                </span>
              </h1>
              
              <p className="font-paragraph text-xl text-primary-foreground/70 max-w-lg leading-relaxed border-l-2 border-brandaccent/30 pl-6">
                Conectamos você às melhores oportunidades imobiliárias com a segurança e facilidade do financiamento Caixa.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/imoveis">
                <Button className="h-16 px-10 bg-secondary text-primary hover:bg-white hover:text-primary text-lg font-heading font-bold rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(185,229,79,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                  Explorar Imóveis
                </Button>
              </Link>
              <Link to="/simulador">
                <Button variant="outline" className="h-16 px-10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/40 text-lg font-heading font-bold rounded-full backdrop-blur-sm transition-all duration-300">
                  Simular Agora
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right: Abstract Geometric Motif (The "Eye" from inspiration) */}
          <div className="relative h-[600px] hidden lg:flex items-center justify-center perspective-1000">
            {/* Concentric Circles / Radar Effect */}
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-[1px]"
                style={{
                  width: `${i * 140}px`,
                  height: `${i * 140}px`,
                  zIndex: 10 - i,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3],
                  rotate: i % 2 === 0 ? 360 : -360,
                }}
                transition={{
                  duration: 15 + i * 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
            
            {/* Central Focus Element */}
            <motion.div 
              className="relative z-20 w-64 h-64 rounded-full bg-gradient-to-br from-brandaccent to-secondary p-1 shadow-[0_0_100px_rgba(107,93,211,0.4)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <div className="w-full h-full rounded-full bg-primary flex items-center justify-center overflow-hidden relative">
                <Image 
                  src="https://static.wixstatic.com/media/9b23b4_389dd5b071f347f5abc678757ab04e8f~mv2.png?originWidth=576&originHeight=576"
                  alt="Abstract architectural detail"
                  className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                  width={400}
                />
                <Home className="absolute w-24 h-24 text-white drop-shadow-lg" strokeWidth={1} />
              </div>
            </motion.div>

            {/* Floating Cards */}
            <motion.div
              className="absolute top-1/4 right-10 z-30 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-xl"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                <BadgePercent size={20} />
              </div>
              <div>
                <p className="text-xs text-white/60 font-paragraph">Taxas a partir de</p>
                <p className="text-lg font-bold text-white font-heading">TR + 6.5% a.a.</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute bottom-1/4 left-0 z-30 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-xl"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="w-10 h-10 rounded-full bg-brandaccent flex items-center justify-center text-white">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-white/60 font-paragraph">Aprovação</p>
                <p className="text-lg font-bold text-white font-heading">Simplificada</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- STATS TICKER --- */}
      <div className="w-full border-y border-white/10 bg-primary/50 backdrop-blur-sm">
        <div className="max-w-[120rem] mx-auto">
          <div className="flex overflow-hidden py-8 group">
            <div className="flex animate-marquee whitespace-nowrap gap-24 px-12">
              {[
                { label: "Anos de Experiência", value: "15+" },
                { label: "Famílias Atendidas", value: "2.5k" },
                { label: "Volume Negociado", value: "R$ 150mi" },
                { label: "Imóveis Disponíveis", value: "400+" },
                { label: "Aprovação Caixa", value: "98%" },
                { label: "Anos de Experiência", value: "15+" },
                { label: "Famílias Atendidas", value: "2.5k" },
                { label: "Volume Negociado", value: "R$ 150mi" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-3xl font-heading font-bold text-secondary">{stat.value}</span>
                  <span className="text-sm font-paragraph text-white uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- STICKY SERVICES SECTION --- */}
      <StickySection 
        title="Soluções Completas" 
        subtitle="Uma abordagem 360º para garantir que seu investimento seja seguro, rentável e sem burocracia."
      >
        {/* Card 1 */}
        <ScrollReveal className="w-full">
          <div className="group relative w-full bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-8 lg:p-12 overflow-hidden hover:border-secondary/50 transition-colors duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-secondary/20 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-4">Simulação & Financiamento</h3>
                <p className="text-primary-foreground/70 font-paragraph text-lg leading-relaxed mb-6">
                  Como correspondentes Caixa, oferecemos acesso direto às melhores taxas do mercado. Realizamos toda a análise de crédito e aprovação sem que você precise ir ao banco.
                </p>
                <Link to="/simulador" className="inline-flex items-center text-secondary font-bold hover:text-white transition-colors group-hover:translate-x-2 duration-300">
                  Simular agora <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Card 2 */}
        <ScrollReveal className="w-full" delay={100}>
          <div className="group relative w-full bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-8 lg:p-12 overflow-hidden hover:border-brandaccent/50 transition-colors duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brandaccent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-brandaccent/20 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
              <div className="w-16 h-16 rounded-2xl bg-brandaccent flex items-center justify-center shrink-0">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-4">Curadoria de Imóveis</h3>
                <p className="text-primary-foreground/70 font-paragraph text-lg leading-relaxed mb-6">
                  Não apenas listamos imóveis; selecionamos oportunidades. Nossa equipe avalia documentação, estado de conservação e potencial de valorização de cada propriedade.
                </p>
                <Link to="/imoveis" className="inline-flex items-center text-brandaccent font-bold hover:text-white transition-colors group-hover:translate-x-2 duration-300">
                  Ver catálogo <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Card 3 */}
        <ScrollReveal className="w-full" delay={200}>
          <div className="group relative w-full bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-8 lg:p-12 overflow-hidden hover:border-white/30 transition-colors duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl lg:text-3xl font-heading font-bold text-white mb-4">Assessoria Jurídica</h3>
                <p className="text-primary-foreground/70 font-paragraph text-lg leading-relaxed mb-6">
                  Segurança jurídica total. Nossa equipe interna cuida de todas as certidões, contratos e registros, garantindo uma transação limpa e sem surpresas.
                </p>
                <Link to="/contato" className="inline-flex items-center text-white font-bold hover:text-secondary transition-colors group-hover:translate-x-2 duration-300">
                  Falar com consultor <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </StickySection>

      {/* --- FEATURED PROPERTIES (Data Fidelity) --- */}
      <section className="w-full py-24 bg-primary relative">
        {/* Decorative Background Line */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <ScrollReveal>
              <h2 className="font-heading text-4xl lg:text-5xl text-white mb-4">
                Oportunidades <span className="text-secondary">Exclusivas</span>
              </h2>
              <p className="font-paragraph text-lg text-primary-foreground/60 max-w-xl">
                Uma seleção criteriosa dos melhores imóveis disponíveis para venda e financiamento imediato.
              </p>
            </ScrollReveal>
            
            <ScrollReveal delay={100}>
              <Link to="/imoveis">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-primary rounded-full px-8 h-12 font-heading">
                  Ver todo o portfólio
                </Button>
              </Link>
            </ScrollReveal>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 rounded-3xl h-[500px] animate-pulse border border-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property, index) => (
                <ScrollReveal key={property._id} delay={index * 100}>
                  <Link to={`/imoveis/${property._id}`} className="group block h-full">
                    <div className="relative h-full bg-white/5 rounded-3xl overflow-hidden border border-white/10 hover:border-secondary/50 transition-all duration-500 hover:-translate-y-2">
                      {/* Image Container */}
                      <div className="relative h-[300px] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-60 z-10" />
                        <div className="absolute top-4 right-4 z-20 bg-primary/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                          <span className="text-secondary font-bold font-heading">
                            {property.transactionType || 'Venda'}
                          </span>
                        </div>
                        {property.propertyImages ? (
                          <Image
                            src={property.propertyImages}
                            alt={property.propertyName || 'Imóvel'}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            width={600}
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Home className="w-16 h-16 text-white/20" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-8 relative z-20 -mt-12">
                        <div className="bg-primary border border-white/10 p-6 rounded-2xl shadow-xl group-hover:shadow-secondary/10 transition-shadow duration-500">
                          <h3 className="font-heading text-xl text-white font-bold mb-2 line-clamp-1">
                            {property.propertyName}
                          </h3>
                          <div className="flex items-center text-primary-foreground/60 mb-4 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="line-clamp-1">{property.address}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/10 mb-4">
                            <div className="text-center">
                              <p className="text-xs text-primary-foreground/50 uppercase tracking-wider mb-1">Área</p>
                              <p className="font-bold text-white">{property.area}m²</p>
                            </div>
                            <div className="text-center border-l border-white/10">
                              <p className="text-xs text-primary-foreground/50 uppercase tracking-wider mb-1">Quartos</p>
                              <p className="font-bold text-white">{property.bedrooms}</p>
                            </div>
                            <div className="text-center border-l border-white/10">
                              <p className="text-xs text-primary-foreground/50 uppercase tracking-wider mb-1">Banheiros</p>
                              <p className="font-bold text-white">{property.bathrooms}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-primary-foreground/50 mb-1">Valor</p>
                              <p className="text-2xl font-heading font-bold text-secondary">
                                {property.price ? `R$ ${property.price.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                              </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary group-hover:text-primary transition-colors duration-300">
                              <ArrowRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- PARALLAX BREAK SECTION --- */}
      <section className="relative w-full h-[80vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <ParallaxImage 
            src="https://static.wixstatic.com/media/9b23b4_ec68d604df694bbcbb1e346fd328c752~mv2.png?originWidth=1024&originHeight=576"
            alt="Modern living room interior"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-primary/50" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <div className="inline-block px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md mb-8">
              <span className="text-secondary font-bold tracking-wider uppercase text-sm">Simulador Caixa</span>
            </div>
            <h2 className="font-heading text-5xl lg:text-7xl text-white font-bold mb-8 leading-tight">
              Quanto custa o seu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-white">novo começo?</span>
            </h2>
            <p className="font-paragraph text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Utilize nosso simulador integrado com a Caixa Econômica Federal e descubra em segundos as condições reais para o seu perfil.
            </p>
            <Link to="/simulador">
              <Button className="h-16 px-12 bg-brandaccent hover:bg-brandaccent/90 text-white text-lg font-bold rounded-full shadow-2xl shadow-brandaccent/30 transition-all hover:scale-105">
                Fazer Simulação Gratuita
              </Button>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* --- PROCESS STEPS (Horizontal Flow) --- */}
      <section className="w-full py-24 lg:py-32 bg-primary">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="font-heading text-4xl lg:text-5xl text-white mb-6">Jornada Simplificada</h2>
            <p className="text-primary-foreground/60 text-lg">Do primeiro clique até a entrega das chaves</p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2 hidden lg:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { icon: Search, title: "Escolha", desc: "Navegue pelo nosso portfólio curado." },
                { icon: Calculator, title: "Simulação", desc: "Aprovação de crédito rápida e online." },
                { icon: ShieldCheck, title: "Análise", desc: "Verificação jurídica completa do imóvel." },
                { icon: Key, title: "Chaves", desc: "Assinatura do contrato e posse." },
              ].map((step, i) => (
                <ScrollReveal key={i} delay={i * 150} className="relative bg-primary">
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 rounded-full bg-primary border border-white/10 flex items-center justify-center mb-6 relative z-10 group-hover:border-secondary transition-colors duration-300 shadow-lg shadow-black/20">
                      <step.icon className="w-8 h-8 text-white group-hover:text-secondary transition-colors" />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-primary-foreground/60 font-paragraph">{step.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="w-full py-24 bg-gradient-to-b from-primary to-[#092b35] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <ScrollReveal>
            <h2 className="font-heading text-5xl lg:text-6xl text-white font-bold mb-8">
              Pronto para dar o próximo passo?
            </h2>
            <p className="font-paragraph text-xl text-primary-foreground/70 mb-12 max-w-2xl mx-auto">
              Nossa equipe de corretores especialistas está pronta para apresentar as melhores opções para o seu momento de vida.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/contato">
                <Button className="h-14 px-10 bg-white text-primary hover:bg-secondary hover:text-primary font-bold text-lg rounded-full w-full sm:w-auto transition-colors">
                  Falar com Especialista
                </Button>
              </Link>
              <Link to="/corretores">
                <Button variant="outline" className="h-14 px-10 border-white/20 text-white hover:bg-white/10 font-bold text-lg rounded-full w-full sm:w-auto">
                  Conhecer Equipe
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
      
      {/* Global Styles for Custom Animations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}