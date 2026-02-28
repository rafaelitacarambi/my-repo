# Guia de Importação de Imóveis

## 📋 Formato da Planilha

A planilha deve conter as seguintes colunas (adapte conforme necessário):

| Coluna | Descrição | Obrigatório | Exemplo |
|--------|-----------|-------------|---------|
| codigo | Código único do imóvel | ✅ | "12345" |
| link | URL da página do imóvel | ⚠️ | "https://site.com/imovel/12345" |
| titulo | Título do anúncio | ❌ | "Apartamento 3 quartos" |
| descricao | Descrição completa | ❌ | "Lindo apartamento..." |
| endereco | Endereço completo | ❌ | "Rua das Flores, 123" |
| bairro | Bairro | ❌ | "Centro" |
| cidade | Cidade | ❌ | "São Paulo" |
| estado | Estado (UF) | ❌ | "SP" |
| cep | CEP | ❌ | "01234-567" |
| tipo | Tipo do imóvel | ❌ | "Apartamento" |
| finalidade | Venda/Locação | ❌ | "Venda" |
| valor | Valor em R$ | ❌ | 450000 |
| area | Área em m² | ❌ | 85 |
| quartos | Número de quartos | ❌ | 3 |
| banheiros | Número de banheiros | ❌ | 2 |
| vagas | Vagas de garagem | ❌ | 1 |

⚠️ **Nota**: Se o campo `link` não for fornecido, o script tentará construir a URL usando o código do imóvel.

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd scripts
npm install
```

### 2. Preparar a Planilha

Salve sua planilha Excel (.xlsx) ou CSV com os dados dos imóveis.

### 3. Adaptar o Script

Antes de executar, você precisa adaptar algumas partes do código:

#### a) Seletores CSS para Scraping

No arquivo `import-properties.ts`, localize a função `scrapePropertyImages` e adapte os seletores CSS para o site específico:

```typescript
// EXEMPLO: Para um site com galeria em <div class="gallery">
$('.gallery img').each((i, elem) => {
  const src = $(elem).attr('src');
  if (src) images.push(src);
});

// EXEMPLO: Para um site com carrossel
$('.carousel-item img, .swiper-slide img').each((i, elem) => {
  const src = $(elem).attr('data-src') || $(elem).attr('src');
  if (src) images.push(src);
});
```

#### b) URL Base do Site

Se a planilha não tiver o link completo, defina o padrão de URL:

```typescript
const url = property.link || `https://SEU-SITE.com.br/imovel/${property.codigo}`;
```

#### c) Integração com Wix Media (Opcional)

Se quiser fazer upload direto para o Wix, implemente a função `uploadToWixMedia`:

```typescript
async function uploadToWixMedia(filePath: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  
  const response = await axios.post(
    'https://www.wixapis.com/v1/media-manager/files',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${process.env.WIX_API_KEY}`,
        ...formData.getHeaders()
      }
    }
  );
  
  return response.data.file.url;
}
```

### 4. Executar o Script

```bash
# Importar usando arquivo específico
npm run import-properties -- --file ../planilha-imoveis.xlsx

# Ou usar o arquivo padrão (imoveis.xlsx)
npm run import-properties
```

### 5. Verificar Resultados

As imagens serão baixadas em:
```
downloads/imoveis/
  ├── 12345/
  │   ├── 1.jpg
  │   ├── 2.jpg
  │   └── 3.jpg
  ├── 12346/
  │   ├── 1.jpg
  │   └── 2.jpg
  └── ...
```

## 🔧 Personalização Avançada

### Filtrar Imagens

Para evitar baixar logos, marcas d'água, etc:

```typescript
if (src && 
    !src.includes('logo') && 
    !src.includes('watermark') &&
    !src.includes('placeholder')) {
  images.push(src);
}
```

### Limitar Número de Imagens

```typescript
const images = await scrapePropertyImages(url, codigo);
const limitedImages = images.slice(0, 20); // Máximo 20 fotos
```

### Adicionar Delay Entre Requisições

```typescript
// Delay de 2 segundos entre cada imóvel
await new Promise(resolve => setTimeout(resolve, 2000));
```

## 📊 Exemplo de Uso Completo

1. **Preparar planilha** `imoveis.xlsx` com 100 imóveis
2. **Executar scraping**: `npm run import-properties`
3. **Verificar downloads** em `downloads/imoveis/`
4. **Revisar imagens** manualmente se necessário
5. **Descomentar seção de upload** no script
6. **Executar novamente** para fazer upload e cadastro

## ⚠️ Avisos Importantes

- **Respeite os Termos de Uso** do site de origem
- **Use delays** para não sobrecarregar o servidor
- **Teste com poucos imóveis** primeiro
- **Faça backup** dos dados antes de importar
- **Verifique direitos autorais** das imagens

## 🐛 Troubleshooting

### Erro: "Cannot find module 'cheerio'"
```bash
cd scripts
npm install
```

### Erro: "403 Forbidden" ao fazer scraping
Adicione headers mais completos:
```typescript
headers: {
  'User-Agent': 'Mozilla/5.0...',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'pt-BR,pt;q=0.9'
}
```

### Imagens não são encontradas
Inspecione o HTML da página e ajuste os seletores CSS.

## 📞 Suporte

Para dúvidas específicas sobre o site de origem, me envie:
1. URL de exemplo de um imóvel
2. Código HTML da galeria de fotos (F12 > Inspecionar)
3. Estrutura da sua planilha
