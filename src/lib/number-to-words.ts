/**
 * Utilitário para converter números para extenso em Português.
 */
export class NumberToWords {
    private static units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    private static tens = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    private static teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    private static hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    static convert(n: number): string {
        if (n === 0) return 'zero';
        if (n === 100) return 'cem';

        let words = '';

        if (n >= 1000) {
            const thousands = Math.floor(n / 1000);
            words += (thousands === 1 ? 'mil' : this.convert(thousands) + ' mil');
            n %= 1000;
            if (n > 0) words += ' ' + (n < 100 || n % 100 === 0 ? 'e ' : '');
        }

        if (n >= 100) {
            words += this.hundreds[Math.floor(n / 100)];
            n %= 100;
            if (n > 0) words += ' e ';
        }

        if (n >= 20) {
            words += this.tens[Math.floor(n / 10)];
            n %= 10;
            if (n > 0) words += ' e ' + this.units[n];
        } else if (n >= 10) {
            words += this.teens[n - 10];
        } else if (n > 0) {
            words += this.units[n];
        }

        return words.trim();
    }

    static convertCurrency(value: number): string {
        const integerPart = Math.floor(value);
        const decimalPart = Math.round((value - integerPart) * 100);

        let result = this.convert(integerPart);
        result += integerPart === 1 ? ' real' : ' reais';

        if (decimalPart > 0) {
            result += ' e ' + this.convert(decimalPart);
            result += decimalPart === 1 ? ' centavo' : ' centavos';
        }

        return result;
    }
}
