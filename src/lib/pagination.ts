export function paginationParams(params: URLSearchParams) {
  const read = (key: string, fallback: number, min: number, max: number) => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw)) throw new Error('Paginação inválida.');
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error('Paginação inválida.');
    return value;
  };
  return { take: read('limit', 2000, 1, 5000), skip: read('skip', 0, 0, 1_000_000) };
}
