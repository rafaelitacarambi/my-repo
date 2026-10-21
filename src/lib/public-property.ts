// Explicit public fields: never spread database rows or owner metadata.
const fields = ['_id', 'codigoReference', 'codImovel', 'resumoImovel', 'tipoImovel',
  'finalidade', 'pretensao', 'statusImovel', 'precoVenda', 'precoLocacao',
  'valorCondominio', 'valorIPTU', 'periodicidadeIPTU', 'entradaMinimaEstimada',
  'pacoteLocacao', 'aceitaFinanciamento', 'aceitaFgts', 'imovelCondominio',
  'investimentoOportunidade', 'permiteFinanciamento', 'descricaoAnuncio',
  'propertyImages', 'galeriaFotos', 'areaTotal', 'areaConstruida', 'areaUtil',
  'dormitorios', 'quartos', 'suites', 'banheiros', 'vagas', 'vagasCobertas',
  'piscina', 'academia', 'elevador', 'seguranca24h', 'acessibilidade',
  'churrasqueira', 'playground', 'sacadaVaranda', '_createdDate',
  'bairro', 'enderecoBairro', 'cidade', 'enderecoCidade', 'estado', 'enderecoEstado'];
export function publicProperty(item: Record<string, unknown> | null) {
  if (!item) return null;
  return Object.fromEntries(fields.filter(key => key in item).map(key => [key, item[key]]));
}
