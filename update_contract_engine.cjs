const fs = require('fs');
const file = 'src/services/ContractEngine.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. UPDATE LAUDO_FOTOS_HTML
content = content.replace(/LAUDO_FOTOS_HTML:\s*\(\(\)\s*=>\s*\{[\s\S]*?\}\)\(\),/, `LAUDO_FOTOS_HTML: (() => {
                if (!extraData?.LAUDO_FOTOS || extraData.LAUDO_FOTOS.length === 0) return '';
                let html = '<div style="margin-top: 40px;">';
                html += '<h3 style="font-size: 14px; color: #000; font-weight: bold; margin-bottom: 10px;">Relação de Fotos</h3>';
                html += '<p style="font-size: 12px; margin-bottom: 20px;">Abaixo segue uma relação de fotos que ilustram o estado atual do imóvel, dos ambientes mencionados e de outros itens que foram deixados no imóvel, servindo como referência para a vistoria inicial.</p>';
                
                const fotos = extraData.LAUDO_FOTOS;
                
                for (let chunkStart = 0; chunkStart < fotos.length; chunkStart += 4) {
                    const chunk = fotos.slice(chunkStart, chunkStart + 4);
                    
                    html += '<div style="page-break-inside: avoid; margin-bottom: 20px;">';
                    html += '<table style="width: 100%; border-collapse: separate; border-spacing: 15px 15px; table-layout: fixed;">';
                    for (let i = 0; i < chunk.length; i += 2) {
                        html += '<tr>';
                        html += \`<td style="width: 50%; padding: 5px; border: 1px solid #ddd; text-align: center; vertical-align: middle;"><img src="\${chunk[i]}" style="width: 100%; height: auto; max-height: 250px; object-fit: contain;" /></td>\`;
                        if (i + 1 < chunk.length) {
                            html += \`<td style="width: 50%; padding: 5px; border: 1px solid #ddd; text-align: center; vertical-align: middle;"><img src="\${chunk[i+1]}" style="width: 100%; height: auto; max-height: 250px; object-fit: contain;" /></td>\`;
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
            })(),`);

// 2. ADD LOGIC BEFORE return data;
const beforeReturnData = `
        // -- GRAMMAR LOGIC --
        const locIsPlural = locatarioIds.length > 1;
        const firstLocatarioId = locatarioIds[0];
        let locIsFeminine = false;
        if (firstLocatarioId) {
            const locObj = extraData?.PARTICIPANT_DETAILS?.[firstLocatarioId];
            if (locObj?.gender === 'female') locIsFeminine = true;
            else if (!locObj?.gender) {
                const c = clientes.find(c => c._id === firstLocatarioId || c.id === firstLocatarioId);
                if (c?.genero === 'Feminino') locIsFeminine = true;
            }
        }

        if (locIsPlural) {
            data.TEXTO_COMPROMISSO_DEVOLUCAO = locIsFeminine 
                ? "As locatárias se comprometem a cobrir quaisquer prejuízos resultantes de perdas ou danos identificados no momento da devolução do imóvel. Além disso, comprometem-se a devolver o imóvel em condições iguais ou superiores às que foram encontradas na data de início da locação, conforme detalhado neste termo de vistoria."
                : "Os locatários se comprometem a cobrir quaisquer prejuízos resultantes de perdas ou danos identificados no momento da devolução do imóvel. Além disso, comprometem-se a devolver o imóvel em condições iguais ou superiores às que foram encontradas na data de início da locação, conforme detalhado neste termo de vistoria.";
            
            data.TEXTO_RESPONSABILIDADE_CHAVES = locIsFeminine
                ? "As locatárias assumem total responsabilidade pela conservação e segurança do imóvel, incluindo mobiliário e utensílios."
                : "Os locatários assumem total responsabilidade pela conservação e segurança do imóvel, incluindo mobiliário e utensílios.";
                
            data.TEXTO_RESPONSABILIDADE_CHAVES_DATA = locIsFeminine
                ? "Na data de {{DATA_ENTREGA_CHAVES}}, as chaves do imóvel foram entregues às locatárias, que assumem total responsabilidade pela conservação e segurança do imóvel."
                : "Na data de {{DATA_ENTREGA_CHAVES}}, as chaves do imóvel foram entregues aos locatários, que assumem total responsabilidade pela conservação e segurança do imóvel.";
        } else {
            data.TEXTO_COMPROMISSO_DEVOLUCAO = locIsFeminine
                ? "A locatária se compromete a cobrir quaisquer prejuízos resultantes de perdas ou danos identificados no momento da devolução do imóvel. Além disso, compromete-se a devolver o imóvel em condições iguais ou superiores às que foram encontradas na data de início da locação, conforme detalhado neste termo de vistoria."
                : "O locatário se compromete a cobrir quaisquer prejuízos resultantes de perdas ou danos identificados no momento da devolução do imóvel. Além disso, compromete-se a devolver o imóvel em condições iguais ou superiores às que foram encontradas na data de início da locação, conforme detalhado neste termo de vistoria.";
                
            data.TEXTO_RESPONSABILIDADE_CHAVES = locIsFeminine
                ? "A locatária assume total responsabilidade pela conservação e segurança do imóvel, incluindo mobiliário e utensílios."
                : "O locatário assume total responsabilidade pela conservação e segurança do imóvel, incluindo mobiliário e utensílios.";
                
            data.TEXTO_RESPONSABILIDADE_CHAVES_DATA = locIsFeminine
                ? "Na data de {{DATA_ENTREGA_CHAVES}}, as chaves do imóvel foram entregues à locatária, que assume total responsabilidade pela conservação e segurança do imóvel."
                : "Na data de {{DATA_ENTREGA_CHAVES}}, as chaves do imóvel foram entregues ao locatário, que assume total responsabilidade pela conservação e segurança do imóvel.";
        }

        // -- SIGNATURES --
        const parties = [];
        locadorIds.forEach(id => parties.push({ role: (data.LOCADORES_LABEL || 'LOCADOR(A)').toUpperCase(), name: getName(id) }));
        locatarioIds.forEach(id => parties.push({ role: (data.LOCATARIOS_LABEL || 'LOCATÁRIO(A)').toUpperCase(), name: getName(id) }));
        if (extraData?.TESTEMUNHA_1_NOME) parties.push({ role: 'TESTEMUNHA 1', name: extraData.TESTEMUNHA_1_NOME });
        if (extraData?.TESTEMUNHA_2_NOME) parties.push({ role: 'TESTEMUNHA 2', name: extraData.TESTEMUNHA_2_NOME });

        let sigHtml = '<div style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;" class="keep-together">';
        sigHtml += '<p><strong>ASSINATURAS:</strong></p>';
        sigHtml += '<table style="width: 100%; border-collapse: collapse; margin-top: 30px;">';
        
        for (let i = 0; i < parties.length; i += 2) {
            sigHtml += '<tr>';
            // First column
            sigHtml += \`<td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                    <p style="margin-bottom: 40px; font-size: 13px;"><strong>\${parties[i].role}:</strong></p>
                    <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px; font-size: 13px;">
                        <strong>\${parties[i].name}</strong>
                    </div>
                </td>\`;
            
            sigHtml += '<td style="width: 4%;">&nbsp;</td>';
            
            // Second column
            if (i + 1 < parties.length) {
                sigHtml += \`<td style="width: 48%; vertical-align: top; padding-bottom: 30px;">
                        <p style="margin-bottom: 40px; font-size: 13px;"><strong>\${parties[i+1].role}:</strong></p>
                        <div style="border-top: 1px solid #999; width: 90%; padding-top: 5px; font-size: 13px;">
                            <strong>\${parties[i+1].name}</strong>
                        </div>
                    </td>\`;
            } else {
                sigHtml += '<td style="width: 48%;"></td>';
            }
            sigHtml += '</tr>';
        }
        sigHtml += '</table></div>';
        
        data.ASSINATURAS_HTML = sigHtml;

        return data;`;

content = content.replace(/\s*return data;/, beforeReturnData);

fs.writeFileSync(file, content);
console.log('ContractEngine updated!');
