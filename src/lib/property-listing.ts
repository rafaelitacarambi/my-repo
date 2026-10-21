export function listingFields<T extends Record<string, any>>(item: T) {
  return {
    ...item,
    propertyType: item.tipoImovel ?? item.propertyType,
    transactionType: item.pretensao ?? item.transactionType,
    price: item.precoVenda || item.precoLocacao || item.price,
    bedrooms: item.quartos ?? item.dormitorios ?? item.bedrooms,
    area: item.areaUtil ?? item.areaTotal ?? item.area,
    status: item.statusImovel === 'Ativo' ? 'Disponível' : item.status,
  };
}
export function matchesTransaction(value: unknown, filter: string) {
  if (filter === 'all') return true;
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return typeof value === 'string' && normalize(value).includes(normalize(filter));
}
export function listingPrice(item: Record<string, any>, transaction: string) {
  return transaction === 'Locação' ? (item.precoLocacao ?? item.price ?? 0) : (item.precoVenda || item.precoLocacao || item.price || 0);
}
