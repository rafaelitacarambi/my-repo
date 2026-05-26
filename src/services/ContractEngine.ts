import { NumberToWords } from '../lib/number-to-words';

/**
 * Motor de Contratos R Sales Imóveis
 * Responsável por processar templates e gerar o conteúdo final.
 */

export interface ContractData {
    [key: string]: any;
}

export class ContractEngine {
    /**
     * Processa o template substituindo placeholders e avaliando condicionais.
     * 
     * Placeholder: {{CHAVE}}
     * Condicional: [[IF CHAVE]] ... [[ELSE]] ... [[ENDIF]]
     */
    static processTemplate(template: string, data: ContractData): string {
        let content = template;

        // 1. Processar Condicionais [[IF key]] ... [[ENDIF]]
        const conditionalRegex = /\[\[IF\s+(!?\w+)]]([\s\S]*?)(?:\[\[ELSE]]([\s\S]*?))?\[\[ENDIF]]/g;

        content = content.replace(conditionalRegex, (match, key, thenBlock, elseBlock) => {
            let isNegative = key.startsWith('!');
            let cleanKey = isNegative ? key.substring(1) : key;

            // Suporte para chaves aninhadas (ex: OPCIONAIS.SUBLOCACAO)
            const keys = cleanKey.split('.');
            let value = data;
            for (const k of keys) {
                value = value?.[k];
            }

            let conditionMet = !!value;
            if (isNegative) conditionMet = !conditionMet;

            return conditionMet ? thenBlock : (elseBlock || '');
        });

        // 2. Processar Placeholders {{CHAVE}}
        const placeholderRegex = /\{\{([\w.]+)\}\}/g;
        content = content.replace(placeholderRegex, (match, key) => {
            const keys = key.split('.');
            let value = data;
            for (const k of keys) {
                value = value?.[k];
            }

            if (value !== undefined && value !== null) {
                return value.toString();
            }
            return match;
        });

        // 3. Pós-processamento inteligente de gênero e número para corrigir templates com termos estáticos/hardcoded
        content = this.replaceRoleInText(content, data.LOCADORA_LABEL || data.LOCADORES_LABEL, 'LOCADOR', 'LOCADORES', 'LOCADORA', 'LOCADORAS');
        content = this.replaceRoleInText(content, data.LOCATARIOS_LABEL || data.LOCATARIO_LABEL, 'LOCATÁRIO', 'LOCATÁRIOS', 'LOCATÁRIA', 'LOCATÁRIAS');
        content = this.replaceRoleInText(content, data.VENDEDORES_LABEL || data.VENDEDOR_LABEL, 'VENDEDOR', 'VENDEDORES', 'VENDEDORA', 'VENDEDORAS');
        content = this.replaceRoleInText(content, data.COMPRADORES_LABEL || data.COMPRADOR_LABEL, 'COMPRADOR', 'COMPRADORES', 'COMPRADORA', 'COMPRADORAS');

        return content;
    }

    /**
     * Helper avançado para pós-processamento gramatical de papéis e preposições (à, da, pela, o, a, etc.)
     */
    static replaceRoleInText(
        content: string, 
        label: string, 
        ms: string, // "LOCADOR"
        mp: string, // "LOCADORES"
        fs: string, // "LOCADORA"
        fp: string  // "LOCADORAS"
    ): string {
        if (!label) return content;

        // Determinar qual é o label de destino com base no resolvido pelo motor
        let target = '';
        if (label.includes(mp)) target = mp;
        else if (label.includes(fp)) target = fp;
        else if (label.includes(fs)) target = fs;
        else if (label.includes(ms)) target = ms;
        else return content;

        const isPlural = target === mp || target === fp;
        const isFeminine = target === fs || target === fp;

        const pre = '(?<![a-zA-Z0-9À-ÿ_])';
        const post = '(?![a-zA-Z0-9À-ÿ_])';

        // Helper interno que cuida de preposições contraídas e artigos no singular
        const replaceHelper = (txt: string) => {
            if (isPlural && !isFeminine) {
                return txt
                    .replace(new RegExp(`${pre}(A|O)\\s+(${fs}|${ms})${post}`, 'g'), `OS ${mp}`)
                    .replace(new RegExp(`${pre}(a|o)\\s+(${fs}|${ms})${post}`, 'g'), `os ${mp}`)
                    .replace(new RegExp(`${pre}(À|AO)\\s+(${fs}|${ms})${post}`, 'g'), `AOS ${mp}`)
                    .replace(new RegExp(`${pre}(à|ao)\\s+(${fs}|${ms})${post}`, 'g'), `aos ${mp}`)
                    .replace(new RegExp(`${pre}(DA|DO)\\s+(${fs}|${ms})${post}`, 'g'), `DOS ${mp}`)
                    .replace(new RegExp(`${pre}(da|do)\\s+(${fs}|${ms})${post}`, 'g'), `dos ${mp}`)
                    .replace(new RegExp(`${pre}(PELA|PELO)\\s+(${fs}|${ms})${post}`, 'g'), `PELOS ${mp}`)
                    .replace(new RegExp(`${pre}(pela|pelo)\\s+(${fs}|${ms})${post}`, 'g'), `pelos ${mp}`)
                    .replace(new RegExp(`${pre}(${fs}|${ms})${post}`, 'g'), mp)
                    .replace(new RegExp(`${pre}(${fs.toLowerCase()}|${ms.toLowerCase()})${post}`, 'g'), mp.toLowerCase());
            }
            if (isPlural && isFeminine) {
                return txt
                    .replace(new RegExp(`${pre}(A|O)\\s+(${fs}|${ms})${post}`, 'g'), `AS ${fp}`)
                    .replace(new RegExp(`${pre}(a|o)\\s+(${fs}|${ms})${post}`, 'g'), `as ${fp}`)
                    .replace(new RegExp(`${pre}(À|AO)\\s+(${fs}|${ms})${post}`, 'g'), `ÀS ${fp}`)
                    .replace(new RegExp(`${pre}(à|ao)\\s+(${fs}|${ms})${post}`, 'g'), `às ${fp}`)
                    .replace(new RegExp(`${pre}(DA|DO)\\s+(${fs}|${ms})${post}`, 'g'), `DAS ${fp}`)
                    .replace(new RegExp(`${pre}(da|do)\\s+(${fs}|${ms})${post}`, 'g'), `das ${fp}`)
                    .replace(new RegExp(`${pre}(PELA|PELO)\\s+(${fs}|${ms})${post}`, 'g'), `PELAS ${fp}`)
                    .replace(new RegExp(`${pre}(pela|pelo)\\s+(${fs}|${ms})${post}`, 'g'), `pelas ${fp}`)
                    .replace(new RegExp(`${pre}(${fs}|${ms})${post}`, 'g'), fp)
                    .replace(new RegExp(`${pre}(${fs.toLowerCase()}|${ms.toLowerCase()})${post}`, 'g'), fp.toLowerCase());
            }
            if (!isPlural && !isFeminine) {
                return txt
                    .replace(new RegExp(`${pre}(A|O)\\s+(${fs}|${ms})${post}`, 'g'), `O ${ms}`)
                    .replace(new RegExp(`${pre}(a|o)\\s+(${fs}|${ms})${post}`, 'g'), `o ${ms}`)
                    .replace(new RegExp(`${pre}(À|AO)\\s+(${fs}|${ms})${post}`, 'g'), `AO ${ms}`)
                    .replace(new RegExp(`${pre}(à|ao)\\s+(${fs}|${ms})${post}`, 'g'), `ao ${ms}`)
                    .replace(new RegExp(`${pre}(DA|DO)\\s+(${fs}|${ms})${post}`, 'g'), `DO ${ms}`)
                    .replace(new RegExp(`${pre}(da|do)\\s+(${fs}|${ms})${post}`, 'g'), `do ${ms}`)
                    .replace(new RegExp(`${pre}(PELA|PELO)\\s+(${fs}|${ms})${post}`, 'g'), `PELO ${ms}`)
                    .replace(new RegExp(`${pre}(pela|pelo)\\s+(${fs}|${ms})${post}`, 'g'), `pelo ${ms}`)
                    .replace(new RegExp(`${pre}(${fs}|${ms})${post}`, 'g'), ms)
                    .replace(new RegExp(`${pre}(${fs.toLowerCase()}|${ms.toLowerCase()})${post}`, 'g'), ms.toLowerCase());
            }
            if (!isPlural && isFeminine) {
                return txt
                    .replace(new RegExp(`${pre}(A|O)\\s+(${fs}|${ms})${post}`, 'g'), `A ${fs}`)
                    .replace(new RegExp(`${pre}(a|o)\\s+(${fs}|${ms})${post}`, 'g'), `a ${fs}`)
                    .replace(new RegExp(`${pre}(À|AO)\\s+(${fs}|${ms})${post}`, 'g'), `À ${fs}`)
                    .replace(new RegExp(`${pre}(à|ao)\\s+(${fs}|${ms})${post}`, 'g'), `à ${fs}`)
                    .replace(new RegExp(`${pre}(DA|DO)\\s+(${fs}|${ms})${post}`, 'g'), `DA ${fs}`)
                    .replace(new RegExp(`${pre}(da|do)\\s+(${fs}|${ms})${post}`, 'g'), `da ${fs}`)
                    .replace(new RegExp(`${pre}(PELA|PELO)\\s+(${fs}|${ms})${post}`, 'g'), `PELA ${fs}`)
                    .replace(new RegExp(`${pre}(pela|pelo)\\s+(${fs}|${ms})${post}`, 'g'), `pela ${fs}`)
                    .replace(new RegExp(`${pre}(${fs}|${ms})${post}`, 'g'), fs)
                    .replace(new RegExp(`${pre}(${fs.toLowerCase()}|${ms.toLowerCase()})${post}`, 'g'), fs.toLowerCase());
            }
            return txt;
        };

        // --- 1. NORMALIZAÇÃO DE RÓTULOS ESTÁTICOS ---
        let processed = content;

        // Tratar "LOCADOR(a)", "do(a) LOCADOR(a)" e "LOCADOR/Vendedor" antes de qualquer outra coisa
        if (ms === 'LOCADOR') {
            const locadorVar = isPlural 
                ? (isFeminine ? 'LOCADORAS' : 'LOCADORES') 
                : (isFeminine ? 'LOCADORA' : 'LOCADOR');
            
            const doLocadorVar = isPlural 
                ? (isFeminine ? 'das LOCADORAS' : 'dos LOCADORES') 
                : (isFeminine ? 'da LOCADORA' : 'do LOCADOR');

            processed = processed
                .replace(new RegExp(`${pre}do\\(a\\)\\s+LOCADOR\\(a\\)${post}`, 'gi'), doLocadorVar)
                .replace(new RegExp(`${pre}do\\(a\\)\\s+LOCADOR\\/Vendedor${post}`, 'gi'), isPlural ? (isFeminine ? 'das LOCADORAS/VENDEDORAS' : 'dos LOCADORES/VENDEDORES') : (isFeminine ? 'da LOCADORA/VENDEDORA' : 'do LOCADOR/VENDEDOR'))
                .replace(new RegExp(`${pre}LOCADOR\\/Vendedor${post}`, 'gi'), isPlural ? (isFeminine ? 'LOCADORAS/VENDEDORAS' : 'LOCADORES/VENDEDORES') : (isFeminine ? 'LOCADORA/VENDEDORA' : 'LOCADOR/VENDEDOR'));
        }

        // Limpar rótulos estáticos com parênteses, ex: "LOCATÁRIO(S)" ou "LOCADOR(A)"
        const staticLabelPattern = new RegExp(`${pre}${ms}\\(S\\)|${ms}\\(A\\)|${ms}\\(A\\)\\(S\\)|${ms}\\(A\\)\\(ES\\)${post}`, 'gi');
        processed = processed.replace(staticLabelPattern, () => {
            if (isPlural) {
                return isFeminine ? fp : mp;
            } else {
                return isFeminine ? fs : ms;
            }
        });

        // --- 2. SUBSTITUIÇÃO DE PROMITENTES ---
        const replacePromitente = (txt: string) => {
            const regex = new RegExp(
                `${pre}(O\\(s\\)|Os?|As?|DO\\(S\\)|Do?s?|Da?s?|AO\\(S\\)|Ao?s?|Às?|PELO\\(S\\)|Pelo?s?|Pela?s?)\\s+(PROMITENTE\\(S\\)|PROMITENTES?|promitentes?)\\s+(${ms}\\(ES\\)|${ms}|${mp}|${fs}|${fp}|${ms.toLowerCase()}|${mp.toLowerCase()}|${fs.toLowerCase()}|${fp.toLowerCase()})${post}`,
                'g'
            );

            return txt.replace(regex, (match, prep, prom, roleWord) => {
                let p = prep.toLowerCase();
                let resPrep = prep;
                
                if (isPlural) {
                    if (isFeminine) {
                        if (p.startsWith('o(s)') || p === 'o' || p === 'os' || p === 'a' || p === 'as') resPrep = prep.toUpperCase() === prep ? 'AS' : (prep[0] === prep[0].toUpperCase() ? 'As' : 'as');
                        else if (p.startsWith('do(s)') || p === 'do' || p === 'dos' || p === 'da' || p === 'das') resPrep = prep.toUpperCase() === prep ? 'DAS' : (prep[0] === prep[0].toUpperCase() ? 'Das' : 'das');
                        else if (p.startsWith('ao(s)') || p === 'ao' || p === 'aos' || p === 'à' || p === 'às') resPrep = prep.toUpperCase() === prep ? 'ÀS' : (prep[0] === prep[0].toUpperCase() ? 'Às' : 'às');
                        else if (p.startsWith('pelo(s)') || p === 'pelo' || p === 'pelos' || p === 'pela' || p === 'pelas') resPrep = prep.toUpperCase() === prep ? 'PELAS' : (prep[0] === prep[0].toUpperCase() ? 'Pelas' : 'pelas');
                    } else {
                        if (p.startsWith('o(s)') || p === 'o' || p === 'os' || p === 'a' || p === 'as') resPrep = prep.toUpperCase() === prep ? 'OS' : (prep[0] === prep[0].toUpperCase() ? 'Os' : 'os');
                        else if (p.startsWith('do(s)') || p === 'do' || p === 'dos' || p === 'da' || p === 'das') resPrep = prep.toUpperCase() === prep ? 'DOS' : (prep[0] === prep[0].toUpperCase() ? 'Dos' : 'dos');
                        else if (p.startsWith('ao(s)') || p === 'ao' || p === 'aos' || p === 'à' || p === 'às') resPrep = prep.toUpperCase() === prep ? 'AOS' : (prep[0] === prep[0].toUpperCase() ? 'Aos' : 'aos');
                        else if (p.startsWith('pelo(s)') || p === 'pelo' || p === 'pelos' || p === 'pela' || p === 'pelas') resPrep = prep.toUpperCase() === prep ? 'PELOS' : (prep[0] === prep[0].toUpperCase() ? 'Pelos' : 'pelos');
                    }
                } else {
                    if (isFeminine) {
                        if (p.startsWith('o(s)') || p === 'o' || p === 'os' || p === 'a' || p === 'as') resPrep = prep.toUpperCase() === prep ? 'A' : (prep[0] === prep[0].toUpperCase() ? 'A' : 'a');
                        else if (p.startsWith('do(s)') || p === 'do' || p === 'dos' || p === 'da' || p === 'das') resPrep = prep.toUpperCase() === prep ? 'DA' : (prep[0] === prep[0].toUpperCase() ? 'Da' : 'da');
                        else if (p.startsWith('ao(s)') || p === 'ao' || p === 'aos' || p === 'à' || p === 'às') resPrep = prep.toUpperCase() === prep ? 'À' : (prep[0] === prep[0].toUpperCase() ? 'À' : 'à');
                        else if (p.startsWith('pelo(s)') || p === 'pelo' || p === 'pelos' || p === 'pela' || p === 'pelas') resPrep = prep.toUpperCase() === prep ? 'PELA' : (prep[0] === prep[0].toUpperCase() ? 'Pela' : 'pela');
                    } else {
                        if (p.startsWith('o(s)') || p === 'o' || p === 'os' || p === 'a' || p === 'as') resPrep = prep.toUpperCase() === prep ? 'O' : (prep[0] === prep[0].toUpperCase() ? 'O' : 'o');
                        else if (p.startsWith('do(s)') || p === 'do' || p === 'dos' || p === 'da' || p === 'das') resPrep = prep.toUpperCase() === prep ? 'DO' : (prep[0] === prep[0].toUpperCase() ? 'Do' : 'do');
                        else if (p.startsWith('ao(s)') || p === 'ao' || p === 'aos' || p === 'à' || p === 'às') resPrep = prep.toUpperCase() === prep ? 'AO' : (prep[0] === prep[0].toUpperCase() ? 'Ao' : 'ao');
                        else if (p.startsWith('pelo(s)') || p === 'pelo' || p === 'pelos' || p === 'pela' || p === 'pelas') resPrep = prep.toUpperCase() === prep ? 'PELO' : (prep[0] === prep[0].toUpperCase() ? 'Pelo' : 'pelo');
                    }
                }

                let promWord = prom;
                if (prom.toUpperCase() === prom) {
                    promWord = isPlural ? 'PROMITENTES' : 'PROMITENTE';
                } else if (prom[0] === prom[0].toUpperCase()) {
                    promWord = isPlural ? 'Promitentes' : 'Promitente';
                } else {
                    promWord = isPlural ? 'promitentes' : 'promitente';
                }

                let resRole = '';
                if (roleWord.toUpperCase() === roleWord) {
                    resRole = isPlural ? (isFeminine ? fp : mp) : (isFeminine ? fs : ms);
                } else {
                    resRole = isPlural ? (isFeminine ? fp.toLowerCase() : mp.toLowerCase()) : (isFeminine ? fs.toLowerCase() : ms.toLowerCase());
                }

                return `${resPrep} ${promWord} ${resRole}`;
            });
        };

        const replaceStandalonePromitente = (txt: string) => {
            const regex = new RegExp(
                `${pre}(PROMITENTE\\(S\\)|PROMITENTES?|promitentes?)\\s+(${ms}\\(ES\\)|${ms}|${mp}|${fs}|${fp}|${ms.toLowerCase()}|${mp.toLowerCase()}|${fs.toLowerCase()}|${fp.toLowerCase()})${post}`,
                'g'
            );
            return txt.replace(regex, (match, prom, roleWord) => {
                let promWord = prom;
                if (prom.toUpperCase() === prom) {
                    promWord = isPlural ? 'PROMITENTES' : 'PROMITENTE';
                } else if (prom[0] === prom[0].toUpperCase()) {
                    promWord = isPlural ? 'Promitentes' : 'Promitente';
                } else {
                    promWord = isPlural ? 'promitentes' : 'promitente';
                }

                let resRole = '';
                if (roleWord.toUpperCase() === roleWord) {
                    resRole = isPlural ? (isFeminine ? fp : mp) : (isFeminine ? fs : ms);
                } else {
                    resRole = isPlural ? (isFeminine ? fp.toLowerCase() : mp.toLowerCase()) : (isFeminine ? fs.toLowerCase() : ms.toLowerCase());
                }

                return `${promWord} ${resRole}`;
            });
        };

        processed = replacePromitente(processed);
        processed = replaceStandalonePromitente(processed);

        // --- 3. INFLEXÃO GRAMATICAL DE ACORDO DE GÊNERO E NÚMERO (VERBOS E ADJETIVOS) ---
        const singularToPluralMap: Record<string, string> = {
            'devera': 'deverão',
            'deverá': 'deverão',
            'compromete-se': 'comprometem-se',
            'compromete': 'comprometem',
            'obriga-se': 'obrigam-se',
            'obriga': 'obrigam',
            'sera': 'serão',
            'será': 'serão',
            'tera': 'terão',
            'terá': 'terão',
            'tenha': 'tenham',
            'declare': 'declarem',
            'atesta': 'atestam',
            'assume': 'assumem',
            'restituirá': 'restituirão',
            'pagará': 'pagarão',
            'efetuará': 'efetuarão',
            'apresentará': 'apresentarão',
            'arcará': 'arcarão',
            'responsabiliza': 'responsabilizam',
            'deve': 'devem',
            'poderá': 'poderão',
            'pode': 'podem',
            'está': 'estão',
            'fica': 'ficam',
            'é': 'são',
            'cometer': 'cometerem',
            'efetuou': 'efetuaram',
            'recebeu': 'receberam',
            'pretenda': 'pretendam',
            'desejar': 'desejarem',
            
            'responsável': 'responsáveis',
            'adimplente': 'adimplentes',
            'interessado': 'interessados',
            'qualificado': 'qualificados',
            'destinado': 'destinados',
            'vacinado': 'vacinados',
            'autorizado': 'autorizados',
            'obrigado': 'obrigados',
            'proibido': 'proibidos',
            
            'responsavel': 'responsáveis',
            'interessada': 'interessadas',
            'qualificada': 'qualificadas',
            'destinada': 'destinadas',
            'vacinada': 'vacinadas',
            'autorizada': 'autorizadas',
            'obrigada': 'obrigadas',
            'proibida': 'proibidas',
        };

        const pluralToSingularMap: Record<string, string> = {};
        for (const [sing, plur] of Object.entries(singularToPluralMap)) {
            pluralToSingularMap[plur] = sing;
        }
        pluralToSingularMap['responsáveis'] = 'responsável';
        pluralToSingularMap['adimplentes'] = 'adimplente';

        const inflectWord = (w: string): string => {
            const lower = w.toLowerCase();
            let res = w;
            
            if (isPlural) {
                if (singularToPluralMap[lower]) {
                    const mapped = singularToPluralMap[lower];
                    res = w === w.toUpperCase() ? mapped.toUpperCase() : (w[0] === w[0].toUpperCase() ? mapped[0].toUpperCase() + mapped.slice(1) : mapped);
                }
            } else {
                if (pluralToSingularMap[lower]) {
                    const mapped = pluralToSingularMap[lower];
                    res = w === w.toUpperCase() ? mapped.toUpperCase() : (w[0] === w[0].toUpperCase() ? mapped[0].toUpperCase() + mapped.slice(1) : mapped);
                }
            }
            
            const currentLower = res.toLowerCase();
            if (isFeminine) {
                const femMap: Record<string, string> = {
                    'interessado': 'interessada',
                    'interessados': 'interessadas',
                    'qualificado': 'qualificada',
                    'qualificados': 'qualificadas',
                    'destinado': 'destinada',
                    'destinados': 'destinadas',
                    'vacinado': 'vacinada',
                    'vacinados': 'vacinadas',
                    'autorizado': 'autorizada',
                    'autorizados': 'autorizadas',
                    'obrigado': 'obrigada',
                    'obrigados': 'obrigadas',
                    'proibido': 'proibida',
                    'proibidos': 'proibidas',
                };
                if (femMap[currentLower]) {
                    const mapped = femMap[currentLower];
                    res = res === res.toUpperCase() ? mapped.toUpperCase() : (res[0] === res[0].toUpperCase() ? mapped[0].toUpperCase() + mapped.slice(1) : mapped);
                }
            } else {
                const mascMap: Record<string, string> = {
                    'interessada': 'interessado',
                    'interessadas': 'interessados',
                    'qualificada': 'qualificado',
                    'qualificadas': 'qualificados',
                    'destinada': 'destinado',
                    'destinadas': 'destinados',
                    'vacinada': 'vacinado',
                    'vacinadas': 'vacinados',
                    'autorizada': 'autorizado',
                    'autorizadas': 'autorizados',
                    'obrigada': 'obrigado',
                    'obrigadas': 'obrigados',
                    'proibida': 'proibido',
                    'proibidas': 'proibidos',
                };
                if (mascMap[currentLower]) {
                    const mapped = mascMap[currentLower];
                    res = res === res.toUpperCase() ? mapped.toUpperCase() : (res[0] === res[0].toUpperCase() ? mapped[0].toUpperCase() + mapped.slice(1) : mapped);
                }
            }
            
            return res;
        };

        const rolesList = [ms, mp, fs, fp].sort((a, b) => b.length - a.length);
        const rolesPatternStr = rolesList.map(r => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

        // Processar palavras que vêm DEPOIS do papel (sufixos)
        const suffixRegex = new RegExp(
            `(${pre})(?:${rolesPatternStr})(${post}\\s+[^.!?<>\n]{1,80})`,
            'gi'
        );

        processed = processed.replace(suffixRegex, (match, prefixBound, textAfter) => {
            const words = textAfter.split(/([a-zA-ZÀ-ÿ-]+)/g);
            const inflectedWords = words.map(part => {
                if (/^[a-zA-ZÀ-ÿ-]+$/.test(part)) {
                    return inflectWord(part);
                }
                return part;
            });
            const matchedRole = match.substring(0, match.length - textAfter.length);
            return matchedRole + inflectedWords.join('');
        });

        // Processar palavras que vêm ANTES do papel (prefixos)
        const prefixRegex = new RegExp(
            `([^.!?<>\n]{1,80})(${pre})(?:${rolesPatternStr})(${post})`,
            'gi'
        );

        processed = processed.replace(prefixRegex, (match, textBefore, prefixBound, roleMatched) => {
            const words = textBefore.split(/([a-zA-ZÀ-ÿ-]+)/g);
            const inflectedWords = words.map(part => {
                if (/^[a-zA-ZÀ-ÿ-]+$/.test(part)) {
                    return inflectWord(part);
                }
                return part;
            });
            return inflectedWords.join('') + prefixBound + match.substring(textBefore.length + prefixBound.length);
        });

        // --- 4. SUBSTITUIÇÕES DE DE/A/PARA E DO PAPEL ---
        // 1. Mapear ocorrências plurais do template para o destino resolvido (Ex: "OS LOCATÁRIOS" -> "O LOCATÁRIO" ou "AS LOCATÁRIAS")
        processed = processed
            .replace(new RegExp(`${pre}OS\\s+${mp}${post}`, 'g'), isPlural ? (isFeminine ? `AS ${fp}` : `OS ${mp}`) : (isFeminine ? `A ${fs}` : `O ${ms}`))
            .replace(new RegExp(`${pre}Os\\s+${mp}${post}`, 'g'), isPlural ? (isFeminine ? `AS ${fp}` : `OS ${mp}`) : (isFeminine ? `A ${fs}` : `O ${ms}`))
            .replace(new RegExp(`${pre}os\\s+${mp}${post}`, 'g'), isPlural ? (isFeminine ? `as ${fp}` : `os ${mp}`) : (isFeminine ? `a ${fs}` : `o ${ms}`))
            .replace(new RegExp(`${pre}AOS\\s+${mp}${post}`, 'g'), isPlural ? (isFeminine ? `ÀS ${fp}` : `AOS ${mp}`) : (isFeminine ? `À ${fs}` : `AO ${ms}`))
            .replace(new RegExp(`${pre}aos\\s+${mp}${post}`, 'g'), isPlural ? (isFeminine ? `às ${fp}` : `aos ${mp}`) : (isFeminine ? `à ${fs}` : `ao ${ms}`))
            .replace(new RegExp(`${pre}DOS\\s+${mp}${post}`, 'g'), isPlural ? (isFeminine ? `DAS ${fp}` : `DOS ${mp}`) : (isFeminine ? `DA ${fs}` : `DO ${ms}`))
            .replace(new RegExp(`${pre}dos\\s+${mp}${post}`, 'g'), isPlural ? (isFeminine ? `das ${fp}` : `dos ${mp}`) : (isFeminine ? `da ${fs}` : `do ${ms}`))
            .replace(new RegExp(`${pre}PELOS\\s+${mp}${post}`, 'g'), isPlural ? (isFeminine ? `PELAS ${fp}` : `PELOS ${mp}`) : (isFeminine ? `PELA ${fs}` : `PELO ${ms}`))
            .replace(new RegExp(`${pre}pelos\\s+${mp}${post}`, 'g'), isPlural ? (isFeminine ? `pelas ${fp}` : `pelos ${mp}`) : (isFeminine ? `pela ${fs}` : `pelo ${ms}`))
            .replace(new RegExp(`${pre}${mp}${post}`, 'g'), isPlural ? (isFeminine ? fp : mp) : (isFeminine ? fs : ms))
            .replace(new RegExp(`${pre}${mp.toLowerCase()}${post}`, 'g'), isPlural ? (isFeminine ? fp.toLowerCase() : mp.toLowerCase()) : (isFeminine ? fs.toLowerCase() : ms.toLowerCase()));

        // 2. Mapear ocorrências singulares do template (Ex: "A LOCADORA" -> "O LOCADOR" ou "OS LOCADORES")
        processed = replaceHelper(processed);

        return processed;
    }

    static mapEntitiesToData(atendimento: any, clientes: any[], imovel: any, extraData: any, contractType?: string): ContractData {
        console.log(`[ContractEngine] Mapeando entidades para Atendimento: ${atendimento?._id}`);
        console.log(`[ContractEngine] Payload extraData (formData):`, {
            locadores: extraData?.LOCADORES_IDS?.length,
            locatarios: extraData?.LOCATARIOS_IDS?.length,
            vendedores: extraData?.VENDEDORES_IDS?.length,
            compradores: extraData?.COMPRADORES_IDS?.length,
            valorAluguel: extraData?.VALOR_ALUGUEL,
            garantia: extraData?.GARANTIA
        });

        // Helper para formatação de moeda brasileira BRL
        const formatBRL = (value: any): string => {
            if (value === undefined || value === null || value === '') return '0,00';
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num)) return '0,00';
            return new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
        };

        // Helper para formatação de CPF
        const formatCPF = (val: string): string => {
            if (!val) return '';
            const cleaned = val.replace(/\D/g, '');
            if (cleaned.length !== 11) return val;
            return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
        };

        const data: ContractData = {
            // Primeiro carregamos os dados brutos do formulário (que podem conter lixo de rascunhos antigos)
            ...extraData,

            // Atendimento & Global (Dados mestre que devem sobrepor o formulário)
            ATENDIMENTO_ID: atendimento?._id || '',
            PASTA_INTERNA: atendimento?.pastaInterna || '',
            CIDADE_ASSINATURA: 'Poá', // Default for this client
            DATA_ASSINATURA: new Date().toLocaleDateString('pt-BR'),
            DATA_VISTORIA: extraData?.DATA_VISTORIA ? new Date(extraData.DATA_VISTORIA + 'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
            DATA_ENTREGA_CHAVES: extraData?.DATA_ENTREGA_CHAVES ? new Date(extraData.DATA_ENTREGA_CHAVES + 'T12:00:00').toLocaleDateString('pt-BR') : '',
            DATA_HOJE: new Date().toLocaleDateString('pt-BR'),
            DIA_HOJE: new Date().getDate(),
            MES_HOJE_EXTENSO: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date()),
            ANO_HOJE: new Date().getFullYear(),
            LOGO_RSALES: 'https://static.wixstatic.com/media/9b23b4_8b5ff4d697054133a09457af0365ebeb~mv2.png',

            // Imóvel (priorizando os dados editados no wizard/extraData)
            IMOVEL_TIPO: extraData?.IMOVEL_TIPO || imovel?.tipoImovel || 'Apartamento',
            IMOVEL_NUMERO: extraData?.IMOVEL_NUMERO || imovel?.numero || '',
            IMOVEL_TORRE: extraData?.IMOVEL_TORRE || (imovel as any)?.torre || '',
            IMOVEL_CONDOMINIO_NOME: extraData?.IMOVEL_CONDOMINIO_NOME || imovel?.nomeCondominio || '',
            IMOVEL_ENDERECO_COMPLETO: extraData?.IMOVEL_ENDERECO_COMPLETO || 
                (extraData?.IMOVEL_LOGRADOURO || imovel ? 
                    `${extraData?.IMOVEL_LOGRADOURO || imovel?.logradouro || ''}, ${extraData?.IMOVEL_NUMERO || imovel?.numero || ''}${extraData?.IMOVEL_COMPLEMENTO || imovel?.complemento ? ' - ' + (extraData?.IMOVEL_COMPLEMENTO || imovel?.complemento) : ''}, ${extraData?.IMOVEL_BAIRRO || imovel?.bairro || ''}, ${extraData?.IMOVEL_CIDADE || imovel?.cidade || ''}-${extraData?.IMOVEL_ESTADO || imovel?.estado || imovel?.uf || ''}` 
                    : ''),
            IMOVEL_CEP: extraData?.IMOVEL_CEP || imovel?.cep || '',
            IMOVEL_VAGAS_GARAGEM: extraData?.IMOVEL_VAGAS_GARAGEM !== undefined ? extraData.IMOVEL_VAGAS_GARAGEM : (imovel?.vagas || 0),
            MATRICULA: extraData?.MATRICULA || (imovel as any)?.matricula || '',
            IMOVEL_CIDADE: extraData?.IMOVEL_CIDADE || imovel?.cidade || 'Poá',
            IMOVEL_ESTADO: extraData?.IMOVEL_ESTADO || imovel?.estado || imovel?.uf || 'SP',

            // Condições
            FINALIDADE: imovel?.finalidade || 'Residencial',
            PRAZO_MESES: extraData?.PRAZO_MESES || '30',
            PRAZO_MESES_EXTENSO: extraData?.PRAZO_MESES ? NumberToWords.convertCurrency(parseFloat(extraData.PRAZO_MESES)).replace('reais', '').trim() : 'trinta',
            DATA_INICIO_PREVISTA: extraData?.DATA_INICIO_PREVISTA || '',
            DATA_ENTREGA_CHAVES_OBS: extraData?.DATA_ENTREGA_CHAVES_OBS || '',
            
            // Valores formatados com extenso
            VALOR_ALUGUEL: formatBRL(extraData?.VALOR_ALUGUEL || 0),
            VALOR_ALUGUEL_EXTENSO: extraData?.VALOR_ALUGUEL ? NumberToWords.convertCurrency(parseFloat(extraData.VALOR_ALUGUEL)) : '',
            DATA_VENCIMENTO: extraData?.DATA_VENCIMENTO || '10',
            
            CONDOMINIO_VALOR: formatBRL(extraData?.VALOR_CONDOMINIO !== undefined ? extraData.VALOR_CONDOMINIO : (imovel?.valorCondominio || 0)),
            CONDOMINIO_VALOR_EXTENSO: (extraData?.VALOR_CONDOMINIO || imovel?.valorCondominio) ? NumberToWords.convertCurrency(parseFloat(extraData?.VALOR_CONDOMINIO || imovel?.valorCondominio)) : '',
            
            IPTU_VALOR: formatBRL(extraData?.VALOR_IPTU !== undefined ? extraData.VALOR_IPTU : (imovel?.valorIPTU || 0)),
            IPTU_VALOR_EXTENSO: (extraData?.VALOR_IPTU || imovel?.valorIPTU) ? NumberToWords.convertCurrency(parseFloat(extraData?.VALOR_IPTU || imovel?.valorIPTU)) : '',
            
            REAJUSTE_INDICE: extraData?.REAJUSTE_INDICE || 'IGP-M (FGV)',
            MULTA_RESCISAO_ALUGUEIS: extraData?.MULTA_RESCISAO_ALUGUEIS || '3',
            
            CAUCAO_VALOR: formatBRL(extraData?.CAUCAO_VALOR || 0),
            CAUCAO_VALOR_EXTENSO: extraData?.CAUCAO_VALOR ? NumberToWords.convertCurrency(parseFloat(extraData.CAUCAO_VALOR)) : '',

            VALOR_TOTAL: formatBRL(extraData?.VALOR_TOTAL || 0),
            VALOR_TOTAL_EXTENSO: extraData?.VALOR_TOTAL ? NumberToWords.convertCurrency(parseFloat(extraData.VALOR_TOTAL)) : '',

            VALOR_ENTRADA: formatBRL(extraData?.VALOR_ENTRADA || 0),
            VALOR_ENTRADA_EXTENSO: extraData?.VALOR_ENTRADA ? NumberToWords.convertCurrency(parseFloat(extraData.VALOR_ENTRADA)) : '',

            // Dados Caução
            CAUCAO_BANCO: extraData?.CAUCAO_BANCO || '',
            CAUCAO_BANCO_CODIGO: extraData?.CAUCAO_BANCO_CODIGO || '',
            CAUCAO_TITULAR: extraData?.CAUCAO_TITULAR || '',
            CAUCAO_CPF: extraData?.CAUCAO_CPF || '',
            CAUCAO_AGENCIA: extraData?.CAUCAO_AGENCIA || '',
            CAUCAO_CONTA: extraData?.CAUCAO_CONTA || '',

            // Testemunhas
            TESTEMUNHA_1_NOME: extraData?.TESTEMUNHA_1_NOME || '',
            TESTEMUNHA_1_CPF: extraData?.TESTEMUNHA_1_CPF || '',
            TESTEMUNHA_2_NOME: extraData?.TESTEMUNHA_2_NOME || '',
            TESTEMUNHA_2_CPF: extraData?.TESTEMUNHA_2_CPF || '',

            LAUDO_FOTOS_HTML: (() => {
                if (!extraData?.LAUDO_FOTOS || extraData.LAUDO_FOTOS.length === 0) return '';
                let html = '<div style="margin-top: 40px;">';
                html += '<h3 style="font-size: 14px; color: #000; font-weight: bold; margin-bottom: 10px;">Relação de Fotos</h3>';
                const desc = contractType === 'VistoriaSaida'
                    ? 'Abaixo segue uma relação de fotos que ilustram o estado final do imóvel, dos ambientes mencionados e de outros itens, servindo como referência para a vistoria de desocupação.'
                    : 'Abaixo segue uma relação de fotos que ilustram o estado atual do imóvel, dos ambientes mencionados e de outros itens que foram deixados no imóvel, servindo como referência para a vistoria inicial.';
                html += `<p style="font-size: 12px; margin-bottom: 20px;">${desc}</p>`;
                
                const fotos = extraData.LAUDO_FOTOS;
                
                for (let chunkStart = 0; chunkStart < fotos.length; chunkStart += 4) {
                    const chunk = fotos.slice(chunkStart, chunkStart + 4);
                    
                    html += '<div style="page-break-inside: avoid; margin-bottom: 20px;">';
                    html += '<table style="width: 100%; border-collapse: separate; border-spacing: 15px 15px; table-layout: fixed;">';
                    for (let i = 0; i < chunk.length; i += 2) {
                        html += '<tr>';
                        html += `<td style="width: 50%; padding: 5px; border: 1px solid #ddd; text-align: center; vertical-align: middle;"><img src="${chunk[i]}" style="width: 100%; height: auto; max-height: 250px; object-fit: contain;" /></td>`;
                        if (i + 1 < chunk.length) {
                            html += `<td style="width: 50%; padding: 5px; border: 1px solid #ddd; text-align: center; vertical-align: middle;"><img src="${chunk[i+1]}" style="width: 100%; height: auto; max-height: 250px; object-fit: contain;" /></td>`;
                        } else {
                            html += '<td style="width: 50%;"></td>';
                        }
                        html += '</tr>';
                    }
                    html += '</table></div>';
                    
                    if (chunkStart + 4 < fotos.length) {
                        html += '<div style="page-break-after: always;"></div>';
                    }
                }
                html += '</div>';
                return html;
            })(),

            // Variáveis Booleanas de Exclusão (Evitar múltiplas garantias no DOC)
            GARANTIA_CAUCAO: extraData?.GARANTIA === 'Caucao',
            GARANTIA_FIADOR: extraData?.GARANTIA === 'Fiador',
            GARANTIA_SEGURO_FIANCA: extraData?.GARANTIA === 'SeguroFianca',
            GARANTIA_NENHUMA: extraData?.GARANTIA === 'SemGarantia',
            PRAZO_IGUAL_SUPERIOR_30: parseInt(extraData?.PRAZO_MESES || '0') >= 30,

            // Seguros e Financiamento
            SEGURO_FIANCA_NOME: extraData?.SEGURO_FIANCA_NOME || '',
            SEGURO_FIANCA_CNPJ: extraData?.SEGURO_FIANCA_CNPJ || '',
            SEGURO_FIANCA_APOLICE: extraData?.SEGURO_FIANCA_APOLICE || '',
            MODALIDADE_VENDA_FINANCIADA: extraData?.MODALIDADE_VENDA === 'Financiada',
            MODALIDADE_VENDA_AVISTA: extraData?.MODALIDADE_VENDA === 'AVista',
            FINANCIAMENTO_BANCO: extraData?.FINANCIAMENTO_BANCO || '',
            FINANCIAMENTO_VALOR: formatBRL(extraData?.FINANCIAMENTO_VALOR || 0),
            FINANCIAMENTO_VALOR_EXTENSO: extraData?.FINANCIAMENTO_VALOR ? NumberToWords.convertCurrency(parseFloat(extraData.FINANCIAMENTO_VALOR)) : '',
            PRAZO_APROVACAO_DIAS: extraData?.PRAZO_APROVACAO_DIAS || '',
            ITBI_RESPONSABILIDADE: extraData?.ITBI_RESPONSABILIDADE || '',
            PRAZO_LAVRATURA_DIAS: extraData?.PRAZO_LAVRATURA_DIAS || '',
            TAXA_OCUPACAO_MENSAL: formatBRL(extraData?.TAXA_OCUPACAO_MENSAL || 0),
            DATA_LIMITE_CHAVES: extraData?.DATA_LIMITE_CHAVES || '',
            
            // Vistorias e Inventário
            ESTADO_CONSERVACAO: extraData?.ESTADO_CONSERVACAO || '',
            LEITURA_AGUA: extraData?.LEITURA_AGUA || '',
            LEITURA_LUZ: extraData?.LEITURA_LUZ || '',
            MULTA_RESCISORIA_VALOR: formatBRL(extraData?.MULTA_RESCISORIA_VALOR || 0),
            OBSERVACOES_CHAVES: extraData?.OBSERVACOES_CHAVES || '',
            INVENTARIO_MOVEIS: extraData?.INVENTARIO_MOVEIS ? extraData.INVENTARIO_MOVEIS.replace(/\n/g, '<br/>') : ''
        };

        // Helper para qualificação detalhada com overrides
        const getQualification = (clientId: string) => {
            const client = clientes.find(c => c._id === clientId || c.id === clientId);
            if (!client && !extraData?.PARTICIPANT_DETAILS?.[clientId]) return '';

            const o = extraData?.PARTICIPANT_DETAILS?.[clientId] || {};
            const name = o.name || client?.clientName || client?.name || '';
            const gender = o.gender || (client as any)?.gender || 'Masculino';

            const isFem = gender === 'Feminino';

            const nationality = o.nationality || (client as any)?.nationality || (isFem ? 'brasileira' : 'brasileiro');
            const maritalStatus = o.maritalStatus || (client as any)?.maritalStatus || (isFem ? 'estado civil n/d' : 'estado civil n/d');
            const profession = o.profession || (client as any)?.profession || 'profissão n/d';
            const rg = o.rg || (client as any)?.rg || '';
            const cpf = o.cpf || client?.cpfCnpj || client?.document || '';
            const address = o.address || client?.address || (client?.street ? `${client.street}, ${client.number || 'S/N'} - ${client.city || ''}/${client.state || ''}` : '') || '';
            const email = o.email || client?.emailPrincipal || client?.email || '';

            // Qualificação de gênero nas palavras
            const portador = isFem ? 'portadora' : 'portador';
            const residente = 'residente'; // Neutro
            const domiciliado = isFem ? 'domiciliada' : 'domiciliado';

            let text = `${name}, ${nationality}, ${maritalStatus}, ${profession}, ${portador} do RG nº ${rg} e CPF nº ${cpf}, ${residente} e ${domiciliado} em ${address}`;
            if (email) text += `, e-mail ${email}`;

            // Interligação de Cônjuge
            if (o.spouseId && o.spouseId !== 'no_spouse') {
                const spouse = clientes.find(c => c._id === o.spouseId || c.id === o.spouseId);
                const so = extraData?.PARTICIPANT_DETAILS?.[o.spouseId] || {};
                const sName = so.name || spouse?.clientName || spouse?.name || '';
                const sCpf = so.cpf || spouse?.cpfCnpj || spouse?.document || '';
                const connector = isFem ? 'casada com' : 'casado com';
                text += `, ${connector} ${sName}, inscrito(a) no CPF sob o nº ${sCpf}`;
            }

            return text;
        };

        // Helper para labels individuais que detecta cônjuge e altera para plural
        const getIndividualLabel = (firstId: string, roleBase: string) => {
            const client = clientes.find(c => c._id === firstId || c.id === firstId);
            const o = extraData?.PARTICIPANT_DETAILS?.[firstId] || {};
            const spouseId = o.spouseId || (client as any)?.spouseRef;
            const hasSpouse = spouseId && spouseId !== 'no_spouse';
            const isFem = (o.gender || (client as any)?.gender) === 'Feminino';

            const mapSingular: any = {
                'Locador': { m: 'O LOCADOR', f: 'A LOCADORA' },
                'Locatário': { m: 'O LOCATÁRIO', f: 'A LOCATÁRIA' },
                'Vendedor': { m: 'O VENDEDOR', f: 'A VENDEDORA' },
                'Comprador': { m: 'O COMPRADOR', f: 'A COMPRADORA' },
            };
            const mapPlural: any = {
                'Locador': { mp: 'OS LOCADORES', fp: 'AS LOCADORAS' },
                'Locatário': { mp: 'OS LOCATÁRIOS', fp: 'AS LOCATÁRIAS' },
                'Vendedor': { mp: 'OS VENDEDORES', fp: 'AS VENDEDORAS' },
                'Comprador': { mp: 'OS COMPRADORES', fp: 'AS COMPRADORAS' },
            };

            const sing = mapSingular[roleBase] || { m: roleBase, f: roleBase };
            const plur = mapPlural[roleBase] || { mp: roleBase, fp: roleBase };

            if (hasSpouse) {
                let spouseIsFem = false;
                if (spouseId) {
                    const spouseClient = clientes.find(c => c._id === spouseId || c.id === spouseId);
                    const so = extraData?.PARTICIPANT_DETAILS?.[spouseId] || {};
                    spouseIsFem = (so.gender || (spouseClient as any)?.gender) === 'Feminino';
                }
                return (isFem && spouseIsFem) ? plur.fp : plur.mp;
            } else {
                return isFem ? sing.f : sing.m;
            }
        };

        // Helper para labels de grupo (Ex: VENDEDOR, VENDEDORA, VENDEDORES, VENDEDORAS)
        const getGroupRoleLabel = (ids: string[], roleBase: string) => {
            if (ids.length === 0) return '';

            const participantsWithSpouses: { gender: string }[] = [];
            let hasSpouse = false;

            ids.forEach(id => {
                const client = clientes.find(c => c._id === id || c.id === id);
                const o = extraData?.PARTICIPANT_DETAILS?.[id] || {};
                const g = o.gender || (client as any)?.gender || 'Masculino';
                participantsWithSpouses.push({ gender: g });

                const spouseId = o.spouseId || (client as any)?.spouseRef;
                if (spouseId && spouseId !== 'no_spouse') {
                    hasSpouse = true;
                    const spouseClient = clientes.find(c => c._id === spouseId || c.id === spouseId);
                    const so = extraData?.PARTICIPANT_DETAILS?.[spouseId] || {};
                    participantsWithSpouses.push({
                        gender: so.gender || (spouseClient as any)?.gender || 'Masculino'
                    });
                }
            });

            const allFem = participantsWithSpouses.every(p => p.gender === 'Feminino');
            const isPlural = ids.length > 1 || hasSpouse;

            const map: any = {
                'Locador': { ms: 'O LOCADOR', fs: 'A LOCADORA', mp: 'OS LOCADORES', fp: 'AS LOCADORAS' },
                'Locatário': { ms: 'O LOCATÁRIO', fs: 'A LOCATÁRIA', mp: 'OS LOCATÁRIOS', fp: 'AS LOCATÁRIAS' },
                'Vendedor': { ms: 'O VENDEDOR', fs: 'A VENDEDORA', mp: 'OS VENDEDORES', fp: 'AS VENDEDORAS' },
                'Comprador': { ms: 'O COMPRADOR', fs: 'A COMPRADORA', mp: 'OS COMPRADORES', fp: 'AS COMPRADORAS' },
                'Proprietário': { ms: 'O PROPRIETÁRIO', fs: 'A PROPRIETÁRIA', mp: 'OS PROPRIETÁRIOS', fp: 'AS PROPRIETÁRIAS' },
            };

            const labels = map[roleBase] || { ms: roleBase, fs: roleBase, mp: roleBase, fp: roleBase };

            if (isPlural) {
                return allFem ? labels.fp : labels.mp;
            } else {
                return participantsWithSpouses[0].gender === 'Feminino' ? labels.fs : labels.ms;
            }
        };

        // Mapear LOCADORA (Proprietário principal) - Mantendo por legado, mas agora com gênero
        const locadoraIds = extraData?.LOCADORES_IDS || [];
        if (locadoraIds.length > 0) {
            const firstId = locadoraIds[0];
            const client = clientes.find(c => c._id === firstId || c.id === firstId);
            const o = extraData?.PARTICIPANT_DETAILS?.[firstId] || {};
            const isFem = (o.gender || (client as any)?.gender) === 'Feminino';

            data.LOCADORA_LABEL = getIndividualLabel(firstId, 'Locador');
            data.LOCADORA_NOME = o.name || client?.clientName || client?.name || '';
            data.LOCADORA_QUALIFICACAO = getQualification(firstId);

            // Campos individuais
            const nationality = o.nationality || (client as any)?.nationality || (isFem ? 'brasileira' : 'brasileiro');
            data.LOCADORA_NACIONALIDADE = nationality;
            data.LOCADORA_ESTADO_CIVIL = o.maritalStatus || (client as any)?.maritalStatus || '';
            data.LOCADORA_PROFISSAO = o.profession || (client as any)?.profession || '';
            data.LOCADORA_DOCUMENTO_TIPO = 'RG'; // Padrão
            data.LOCADORA_DOCUMENTO_NUM = o.rg || (client as any)?.rg || '';
            data.LOCADORA_CPF = o.cpf || client?.cpfCnpj || client?.document || '';
            data.LOCADORA_EMAIL = o.email || client?.emailPrincipal || client?.email || '';
            data.LOCADORA_ENDERECO_COMPLETO = o.address || client?.address || (client?.street ? `${client.street}, ${client.number || 'S/N'} - ${client.city || ''}/${client.state || ''}` : '') || '';
        }

        // Mapear LOCATARIO (Inquilino principal) - Para preencher todos os dados individuais no contrato
        const locatarioIds = extraData?.LOCATARIOS_IDS || [];
        if (locatarioIds.length > 0) {
            const firstId = locatarioIds[0];
            const client = clientes.find(c => c._id === firstId || c.id === firstId);
            const o = extraData?.PARTICIPANT_DETAILS?.[firstId] || {};
            const isFem = (o.gender || (client as any)?.gender) === 'Feminino';

            data.LOCATARIO_LABEL = getIndividualLabel(firstId, 'Locatário');
            data.LOCATARIO_NOME = o.name || client?.clientName || client?.name || '';
            data.LOCATARIO_QUALIFICACAO = getQualification(firstId);

            // Campos individuais
            const nationality = o.nationality || (client as any)?.nationality || (isFem ? 'brasileira' : 'brasileiro');
            data.LOCATARIO_NACIONALIDADE = nationality;
            data.LOCATARIO_ESTADO_CIVIL = o.maritalStatus || (client as any)?.maritalStatus || '';
            data.LOCATARIO_PROFISSAO = o.profession || (client as any)?.profession || '';
            data.LOCATARIO_DOCUMENTO_TIPO = 'RG';
            data.LOCATARIO_DOCUMENTO_NUM = o.rg || (client as any)?.rg || '';
            data.LOCATARIO_CPF = o.cpf || client?.cpfCnpj || client?.document || '';
            data.LOCATARIO_EMAIL = o.email || client?.emailPrincipal || client?.email || '';
            data.LOCATARIO_ENDERECO_COMPLETO = o.address || client?.address || (client?.street ? `${client.street}, ${client.number || 'S/N'} - ${client.city || ''}/${client.state || ''}` : '') || '';
        }

        // Mapear VENDEDOR (Vendedor principal)
        const vendedorIds = extraData?.VENDEDORES_IDS || [];
        if (vendedorIds.length > 0) {
            const firstId = vendedorIds[0];
            const client = clientes.find(c => c._id === firstId || c.id === firstId);
            const o = extraData?.PARTICIPANT_DETAILS?.[firstId] || {};
            const isFem = (o.gender || (client as any)?.gender) === 'Feminino';

            data.VENDEDOR_LABEL = getIndividualLabel(firstId, 'Vendedor');
            data.VENDEDOR_NOME = o.name || client?.clientName || client?.name || '';
            data.VENDEDOR_QUALIFICACAO = getQualification(firstId);

            // Campos individuais
            const nationality = o.nationality || (client as any)?.nationality || (isFem ? 'brasileira' : 'brasileiro');
            data.VENDEDOR_NACIONALIDADE = nationality;
            data.VENDEDOR_ESTADO_CIVIL = o.maritalStatus || (client as any)?.maritalStatus || '';
            data.VENDEDOR_PROFISSAO = o.profession || (client as any)?.profession || '';
            data.VENDEDOR_DOCUMENTO_TIPO = 'RG';
            data.VENDEDOR_DOCUMENTO_NUM = o.rg || (client as any)?.rg || '';
            data.VENDEDOR_CPF = o.cpf || client?.cpfCnpj || client?.document || '';
            data.VENDEDOR_EMAIL = o.email || client?.emailPrincipal || client?.email || '';
            data.VENDEDOR_ENDERECO_COMPLETO = o.address || client?.address || (client?.street ? `${client.street}, ${client.number || 'S/N'} - ${client.city || ''}/${client.state || ''}` : '') || '';
        }

        // Mapear COMPRADOR (Comprador principal)
        const compradorIds = extraData?.COMPRADORES_IDS || [];
        if (compradorIds.length > 0) {
            const firstId = compradorIds[0];
            const client = clientes.find(c => c._id === firstId || c.id === firstId);
            const o = extraData?.PARTICIPANT_DETAILS?.[firstId] || {};
            const isFem = (o.gender || (client as any)?.gender) === 'Feminino';

            data.COMPRADOR_LABEL = getIndividualLabel(firstId, 'Comprador');
            data.COMPRADOR_NOME = o.name || client?.clientName || client?.name || '';
            data.COMPRADOR_QUALIFICACAO = getQualification(firstId);

            // Campos individuais
            const nationality = o.nationality || (client as any)?.nationality || (isFem ? 'brasileira' : 'brasileiro');
            data.COMPRADOR_NACIONALIDADE = nationality;
            data.COMPRADOR_ESTADO_CIVIL = o.maritalStatus || (client as any)?.maritalStatus || '';
            data.COMPRADOR_PROFISSAO = o.profession || (client as any)?.profession || '';
            data.COMPRADOR_DOCUMENTO_TIPO = 'RG';
            data.COMPRADOR_DOCUMENTO_NUM = o.rg || (client as any)?.rg || '';
            data.COMPRADOR_CPF = o.cpf || client?.cpfCnpj || client?.document || '';
            data.COMPRADOR_EMAIL = o.email || client?.emailPrincipal || client?.email || '';
            data.COMPRADOR_ENDERECO_COMPLETO = o.address || client?.address || (client?.street ? `${client.street}, ${client.number || 'S/N'} - ${client.city || ''}/${client.state || ''}` : '') || '';
        }

        // Mapear LISTAS e LABELS Dinâmicos
        const getName = (id: string) => {
            const client = clientes.find(c => c._id === id || c.id === id);
            const o = extraData?.PARTICIPANT_DETAILS?.[id] || {};
            return o.name || client?.clientName || client?.name || '';
        };

        const locadorIds = extraData?.LOCADORES_IDS || [];
        data.LOCADORES_LABEL = getGroupRoleLabel(locadorIds, 'Locador');
        data.LOCADORES_LISTA = locadorIds.map((id: string) => getQualification(id)).filter(Boolean).join('; ');
        data.LOCADORES_NOMES = locadorIds.map((id: string) => getName(id)).filter(Boolean).join(', ');

        data.LOCATARIOS_LABEL = getGroupRoleLabel(locatarioIds, 'Locatário');
        data.LOCATARIOS_LISTA = locatarioIds.map((id: string) => getQualification(id)).filter(Boolean).join('; ');
        data.LOCATARIOS_NOMES = locatarioIds.map((id: string) => getName(id)).filter(Boolean).join(', ');

        data.VENDEDORES_LABEL = getGroupRoleLabel(vendedorIds, 'Vendedor');
        data.VENDEDORES_LISTA = vendedorIds.map((id: string) => getQualification(id)).filter(Boolean).join('; ');
        data.VENDEDORES_NOMES = vendedorIds.map((id: string) => getName(id)).filter(Boolean).join(', ');

        data.COMPRADORES_LABEL = getGroupRoleLabel(compradorIds, 'Comprador');
        data.COMPRADORES_LISTA = compradorIds.map((id: string) => getQualification(id)).filter(Boolean).join('; ');
        data.COMPRADORES_NOMES = compradorIds.map((id: string) => getName(id)).filter(Boolean).join(', ');
        // -- GRAMMAR LOGIC --
        const locLabel = data.LOCATARIOS_LABEL || 'LOCATÁRIO(A)';
        const locIsPlural = locLabel.endsWith('S');
        const locIsFeminine = locLabel.includes('A');
        
        const dataEntrega = data.DATA_ENTREGA_CHAVES || '[PENDENTE]';

        if (locIsPlural) {
            data.TEXTO_COMPROMISSO_DEVOLUCAO = locIsFeminine 
                ? "As locatárias se comprometem a cobrir quaisquer prejuízos resultantes de perdas ou danos identificados no momento da devolução do imóvel. Além disso, comprometem-se a devolver o imóvel em condições iguais ou superiores às que foram encontradas na data de início da locação, conforme detalhado neste termo de vistoria."
                : "Os locatários se comprometem a cobrir quaisquer prejuízos resultantes de perdas ou danos identificados no momento da devolução do imóvel. Além disso, comprometem-se a devolver o imóvel em condições iguais ou superiores às que foram encontradas na data de início da locação, conforme detalhado neste termo de vistoria.";
            
            data.TEXTO_RESPONSABILIDADE_CHAVES = locIsFeminine
                ? "As locatárias assumem total responsabilidade pela conservação e segurança do imóvel, incluindo mobiliário e utensílios."
                : "Os locatários assumem total responsabilidade pela conservação e segurança do imóvel, incluindo mobiliário e utensílios.";
                
            data.TEXTO_RESPONSABILIDADE_CHAVES_DATA = locIsFeminine
                ? `Na data de ${dataEntrega}, as chaves do imóvel foram entregues às locatárias, que assumem total responsabilidade pela conservação e segurança do imóvel.`
                : `Na data de ${dataEntrega}, as chaves do imóvel foram entregues aos locatários, que assumem total responsabilidade pela conservação e segurança do imóvel.`;
        } else {
            data.TEXTO_COMPROMISSO_DEVOLUCAO = locIsFeminine
                ? "A locatária se compromete a cobrir quaisquer prejuízos resultantes de perdas ou danos identificados no momento da devolução do imóvel. Além disso, compromete-se a devolver o imóvel em condições iguais ou superiores às que foram encontradas na data de início da locação, conforme detalhado neste termo de vistoria."
                : "O locatário se compromete a cobrir quaisquer prejuízos resultantes de perdas ou danos identificados no momento da devolução do imóvel. Além disso, compromete-se a devolver o imóvel em condições iguais ou superiores às que foram encontradas na data de início da locação, conforme detalhado neste termo de vistoria.";
                
            data.TEXTO_RESPONSABILIDADE_CHAVES = locIsFeminine
                ? "A locatária assume total responsabilidade pela conservação e segurança do imóvel, incluindo mobiliário e utensílios."
                : "O locatário assume total responsabilidade pela conservação e segurança do imóvel, incluindo mobiliário e utensílios.";
                
            data.TEXTO_RESPONSABILIDADE_CHAVES_DATA = locIsFeminine
                ? `Na data de ${dataEntrega}, as chaves do imóvel foram entregues à locatária, que assume total responsabilidade pela conservação e segurança do imóvel.`
                : `Na data de ${dataEntrega}, as chaves do imóvel foram entregues ao locatário, que assume total responsabilidade pela conservação e segurança do imóvel.`;
        }

        // -- SIGNATURES --
        const group1: { role: string; name: string }[] = [];
        const group2: { role: string; name: string }[] = [];
        const witnesses: { role: string; name: string }[] = [];

        const isVenda = contractType === 'CompraEVenda' || (contractType || '').toLowerCase().includes('venda');

        if (isVenda) {
            const labelVendedor = (data.VENDEDORES_LABEL || 'VENDEDOR(A)').toUpperCase();
            const labelComprador = (data.COMPRADORES_LABEL || 'COMPRADOR(A)').toUpperCase();
            vendedorIds.forEach((id: string) => group1.push({ role: labelVendedor, name: getName(id) }));
            compradorIds.forEach((id: string) => group2.push({ role: labelComprador, name: getName(id) }));
        } else {
            const labelLocador = (data.LOCADORES_LABEL || 'LOCADOR(A)').toUpperCase();
            const labelLocatario = (data.LOCATARIOS_LABEL || 'LOCATÁRIO(A)').toUpperCase();
            locadorIds.forEach((id: string) => group1.push({ role: labelLocador, name: getName(id) }));
            locatarioIds.forEach((id: string) => group2.push({ role: labelLocatario, name: getName(id) }));
        }

        const isVistoria = contractType === 'VistoriaEntrada' || contractType === 'VistoriaSaida' || (contractType || '').toLowerCase().includes('vistoria') || contractType === 'EntregaChaves';

        if (!isVistoria) {
            const t1Name = extraData?.TESTEMUNHA_1_NOME || extraData?.TESTEMUNHA1_NOME || '';
            const t2Name = extraData?.TESTEMUNHA_2_NOME || extraData?.TESTEMUNHA2_NOME || '';
            const t1Doc = extraData?.TESTEMUNHA_1_CPF || extraData?.TESTEMUNHA1_RG || extraData?.TESTEMUNHA1_CPF || '';
            const t2Doc = extraData?.TESTEMUNHA_2_CPF || extraData?.TESTEMUNHA2_RG || extraData?.TESTEMUNHA2_CPF || '';

            if (t1Name) {
                witnesses.push({ role: 'TESTEMUNHA 1', name: `${t1Name}${t1Doc ? ' (CPF/RG: ' + t1Doc + ')' : ''}` });
            }
            if (t2Name) {
                witnesses.push({ role: 'TESTEMUNHA 2', name: `${t2Name}${t2Doc ? ' (CPF/RG: ' + t2Doc + ')' : ''}` });
            }
        }

        let sigHtml = '<div style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;" class="keep-together">';
        sigHtml += '<p><strong>ASSINATURAS:</strong></p>';
        sigHtml += '<table style="width: 100%; border-collapse: collapse; margin-top: 30px;">';

        const renderGroupRows = (items: { role: string; name: string }[]): string => {
            let html = '';
            for (let i = 0; i < items.length; i += 2) {
                html += '<tr>';
                // Primeira coluna
                html += `<td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                        <p style="margin-bottom: 40px; font-size: 13px;"><strong>${items[i].role}:</strong></p>
                        <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px; font-size: 13px;">
                            <strong>${items[i].name}</strong>
                        </div>
                    </td>`;
                
                html += '<td style="width: 4%;">&nbsp;</td>';
                
                // Segunda coluna
                if (i + 1 < items.length) {
                    html += `<td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                            <p style="margin-bottom: 40px; font-size: 13px;"><strong>${items[i+1].role}:</strong></p>
                            <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px; font-size: 13px;">
                                <strong>${items[i+1].name}</strong>
                            </div>
                        </td>`;
                } else {
                    html += '<td style="width: 48%;"></td>';
                }
                html += '</tr>';
            }
            return html;
        };

        const L = group1.length;
        const T = group2.length;

        if (L === 1 && T === 1) {
            // Caso simples: 1 locador e 1 locatário -> Lado a lado
            sigHtml += renderGroupRows([group1[0], group2[0]]);
        } else if (L === 1 && T === 2) {
            // Caso especial: 1 locador e 2 locatários -> Locador em sua linha, locatários lado a lado
            sigHtml += renderGroupRows([group1[0]]);
            sigHtml += renderGroupRows(group2);
        } else {
            // Caso geral: locadores lado a lado, locatários lado a lado
            if (L > 0) {
                sigHtml += renderGroupRows(group1);
            }
            if (T > 0) {
                sigHtml += renderGroupRows(group2);
            }
        }

        // Renderizar testemunhas
        if (witnesses.length > 0) {
            sigHtml += renderGroupRows(witnesses);
        }

        sigHtml += '</table></div>';
        
        data.ASSINATURAS_HTML = sigHtml;

        return data;
    }

    /**
     * Gera o HTML final pronto para o Preview e PDF, incluindo CSS básico e Logo.
     */
    static renderContract(template: string, data: ContractData): string {
        console.log(`[ContractEngine] Renderizando contrato. Tamanho do template: ${template?.length}`);
        if (template?.includes('EUZIQUE')) {
            console.warn('[ContractEngine] ALERTA: O template contém o nome "EUZIQUE" hardcoded!');
        }
        const body = this.processTemplate(template, data);

        return `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px; max-width: 800px; margin: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ed1c24; padding-bottom: 10px; margin-bottom: 30px;">
                    <img src="${data.LOGO_RSALES || ''}" style="width: 150px; height: auto;" />
                    <div style="text-align: right;">
                        <h1 style="margin: 0; font-size: 18px; color: #ed1c24;">CONTRATO DE LOCAÇÃO</h1>
                        <p style="margin: 0; font-size: 12px; color: #666;">Instrumento Particular / ${data.FINALIDADE || ''}</p>
                    </div>
                </div>
                
                <div style="font-size: 14px; text-align: left;">
                    ${body}
                </div>

                <div style="margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; text-align: center;">
                    Este documento é uma via digital gerada pelo sistema R.Sales Imóveis.
                </div>
            </div>
        `;
    }
}

