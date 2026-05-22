import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return new Response(JSON.stringify({ error: 'Arquivo é obrigatório e deve ser válido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const filename = file.name;
        const mimeType = file.type;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let htmlContent = '';
        let extractedText = '';

        if (filename.toLowerCase().endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Processar DOCX com mammoth (importação dinâmica para não quebrar a página se não estiver instalado)
            try {
                let mammoth: any;
                try {
                    mammoth = (await import('mammoth')).default || await import('mammoth');
                } catch (err) {
                    return new Response(JSON.stringify({ error: 'A biblioteca mammoth não está instalada. Por favor, rode "npm install mammoth" no terminal.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
                }

                const result = await mammoth.convertToHtml({ buffer });
                htmlContent = result.value; // The generated HTML
                
                if (result.messages && result.messages.length > 0) {
                    console.warn('Mammoth warnings:', result.messages);
                }
            } catch (mammothError) {
                console.error('Erro no mammoth:', mammothError);
                return new Response(JSON.stringify({ error: 'Falha ao converter o documento DOCX. Verifique se a biblioteca mammoth está instalada.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        } else if (filename.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf') {
            // Processar PDF com pdf-parse
            try {
                const { PDFParse } = await import('pdf-parse');
                const parser = new PDFParse({ data: buffer });
                const textResult = await parser.getText();
                extractedText = textResult.text;
                
                // Converter quebras de linha simples em <br> ou <p>
                htmlContent = extractedText
                    .split('\n\n')
                    .map((paragraph: string) => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
                    .join('');
            } catch (pdfError: any) {
                 console.error('Erro no pdf-parse:', pdfError);
                 return new Response(JSON.stringify({ error: `Falha ao extrair texto do PDF. Detalhe: ${pdfError.message || pdfError}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        } else {
            return new Response(JSON.stringify({ error: 'Formato de arquivo não suportado. Envie apenas .docx ou .pdf.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Detectar variáveis (qualquer coisa entre {{ }})
        const variablesFound = htmlContent.match(/\{\{([^}]+)\}\}/g) || [];
        const uniqueVariables = [...new Set(variablesFound.map(v => v.replace(/[{}]/g, '').trim()))];

        return new Response(JSON.stringify({
            success: true,
            htmlContent,
            variablesDetected: uniqueVariables,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Error parsing document:', error);
        return new Response(JSON.stringify({ error: 'Erro interno ao processar o documento' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
