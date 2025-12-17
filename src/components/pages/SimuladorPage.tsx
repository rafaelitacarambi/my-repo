import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SimuladorPage() {
  const [propertyValue, setPropertyValue] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [months, setMonths] = useState('360');
  const [interestRate, setInterestRate] = useState('9.5');
  const [result, setResult] = useState<{
    monthlyPayment: number;
    totalAmount: number;
    totalInterest: number;
  } | null>(null);

  const calculateFinancing = () => {
    const value = parseFloat(propertyValue.replace(/\D/g, ''));
    const down = parseFloat(downPayment.replace(/\D/g, ''));
    const term = parseInt(months);
    const rate = parseFloat(interestRate) / 100 / 12;

    if (!value || !down || !term || !rate) return;

    const financedAmount = value - down;
    const monthlyPayment = financedAmount * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    const totalAmount = monthlyPayment * term;
    const totalInterest = totalAmount - financedAmount;

    setResult({
      monthlyPayment,
      totalAmount,
      totalInterest,
    });
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(numbers) / 100);
    return formatted;
  };

  const handleCurrencyInput = (value: string, setter: (val: string) => void) => {
    const formatted = formatCurrency(value);
    setter(formatted);
  };

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-secondary/10 to-brandaccent/5 py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calculator className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h1 className="font-heading text-5xl lg:text-6xl text-secondary mb-6">
              Simulador de Financiamento
            </h1>
            <p className="font-paragraph text-lg text-dark-gray max-w-2xl mx-auto">
              Calcule as parcelas do seu financiamento imobiliário com as condições da Caixa Econômica Federal
            </p>
          </motion.div>
        </div>
      </section>

      {/* Simulator Section */}
      <section className="w-full py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-light-gray rounded-2xl p-8 border border-border-gray"
            >
              <h2 className="font-heading text-2xl text-secondary mb-8 font-semibold">
                Dados do Financiamento
              </h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="propertyValue" className="font-paragraph text-base text-primary-foreground mb-2 block">
                    Valor do Imóvel
                  </Label>
                  <Input
                    id="propertyValue"
                    type="text"
                    value={propertyValue}
                    onChange={(e) => handleCurrencyInput(e.target.value, setPropertyValue)}
                    placeholder="R$ 0,00"
                    className="h-12 bg-primary border-border-gray text-primary-foreground placeholder:text-dark-gray rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="downPayment" className="font-paragraph text-base text-primary-foreground mb-2 block">
                    Valor de Entrada
                  </Label>
                  <Input
                    id="downPayment"
                    type="text"
                    value={downPayment}
                    onChange={(e) => handleCurrencyInput(e.target.value, setDownPayment)}
                    placeholder="R$ 0,00"
                    className="h-12 bg-primary border-border-gray text-primary-foreground placeholder:text-dark-gray rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="months" className="font-paragraph text-base text-primary-foreground mb-2 block">
                    Prazo (meses)
                  </Label>
                  <Select value={months} onValueChange={setMonths}>
                    <SelectTrigger className="h-12 bg-primary border-border-gray text-primary-foreground rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="120">120 meses (10 anos)</SelectItem>
                      <SelectItem value="180">180 meses (15 anos)</SelectItem>
                      <SelectItem value="240">240 meses (20 anos)</SelectItem>
                      <SelectItem value="300">300 meses (25 anos)</SelectItem>
                      <SelectItem value="360">360 meses (30 anos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="interestRate" className="font-paragraph text-base text-primary-foreground mb-2 block">
                    Taxa de Juros (% ao ano)
                  </Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="h-12 bg-primary border-border-gray text-primary-foreground placeholder:text-dark-gray rounded-lg"
                  />
                  <p className="font-paragraph text-sm text-dark-gray mt-2">
                    Taxa média Caixa: 9,5% a.a. (sujeita a alteração)
                  </p>
                </div>

                <Button
                  onClick={calculateFinancing}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-paragraph font-semibold h-14 rounded-lg text-base"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Calcular Financiamento
                </Button>
              </div>
            </motion.div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {result ? (
                <>
                  <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl p-8 border border-secondary/30">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="w-8 h-8 text-secondary" />
                      <h3 className="font-heading text-xl text-primary-foreground font-semibold">
                        Parcela Mensal
                      </h3>
                    </div>
                    <p className="font-heading text-5xl text-secondary font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(result.monthlyPayment)}
                    </p>
                  </div>

                  <div className="bg-light-gray rounded-2xl p-8 border border-border-gray">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                      <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                        Valor Total
                      </h3>
                    </div>
                    <p className="font-heading text-3xl text-primary-foreground font-bold mb-2">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(result.totalAmount)}
                    </p>
                    <p className="font-paragraph text-sm text-dark-gray">
                      Total a pagar ao final do financiamento
                    </p>
                  </div>

                  <div className="bg-light-gray rounded-2xl p-8 border border-border-gray">
                    <div className="flex items-center gap-3 mb-6">
                      <Calendar className="w-6 h-6 text-secondary" />
                      <h3 className="font-heading text-lg text-primary-foreground font-semibold">
                        Total de Juros
                      </h3>
                    </div>
                    <p className="font-heading text-3xl text-primary-foreground font-bold mb-2">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(result.totalInterest)}
                    </p>
                    <p className="font-paragraph text-sm text-dark-gray">
                      Juros pagos durante o financiamento
                    </p>
                  </div>

                  <div className="bg-light-gray rounded-2xl p-6 border border-border-gray">
                    <p className="font-paragraph text-sm text-primary-foreground/80 leading-relaxed">
                      <strong className="text-secondary">Importante:</strong> Esta é uma simulação aproximada. Os valores reais podem variar de acordo com a análise de crédito, taxas vigentes e condições específicas da Caixa Econômica Federal.
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-light-gray rounded-2xl p-12 border border-border-gray text-center h-full flex flex-col items-center justify-center">
                  <Calculator className="w-16 h-16 text-primary-foreground/30 mb-4" />
                  <h3 className="font-heading text-2xl text-primary-foreground mb-2">
                    Preencha os Dados
                  </h3>
                  <p className="font-paragraph text-base text-dark-gray">
                    Complete o formulário ao lado e clique em calcular para ver os resultados da simulação
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="w-full bg-light-gray/50 py-16 border-t border-border-gray">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="font-heading text-3xl text-secondary mb-8 text-center font-semibold">
              Como Funciona o Financiamento Caixa
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-primary rounded-xl p-6 border border-border-gray">
                <h3 className="font-heading text-lg text-primary-foreground mb-3 font-semibold">
                  Entrada Mínima
                </h3>
                <p className="font-paragraph text-base text-dark-gray leading-relaxed">
                  A Caixa exige entrada mínima de 20% do valor do imóvel para financiamento habitacional.
                </p>
              </div>
              <div className="bg-primary rounded-xl p-6 border border-border-gray">
                <h3 className="font-heading text-lg text-primary-foreground mb-3 font-semibold">
                  Prazo Máximo
                </h3>
                <p className="font-paragraph text-base text-dark-gray leading-relaxed">
                  O prazo máximo de financiamento é de 30 anos (360 meses), podendo variar conforme análise.
                </p>
              </div>
              <div className="bg-primary rounded-xl p-6 border border-border-gray">
                <h3 className="font-heading text-lg text-primary-foreground mb-3 font-semibold">
                  Taxas de Juros
                </h3>
                <p className="font-paragraph text-base text-dark-gray leading-relaxed">
                  As taxas variam conforme o tipo de imóvel, renda e relacionamento com o banco.
                </p>
              </div>
              <div className="bg-primary rounded-xl p-6 border border-border-gray">
                <h3 className="font-heading text-lg text-primary-foreground mb-3 font-semibold">
                  Documentação
                </h3>
                <p className="font-paragraph text-base text-dark-gray leading-relaxed">
                  Documentos pessoais, comprovantes de renda e documentação do imóvel são necessários.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
