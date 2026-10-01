export type Wilaya = { code: number; name: string; communes: string[] };

let cache: Wilaya[] | null = null;

export async function loadWilayas(): Promise<Wilaya[]> {
  if (cache) return cache;
  const res = await fetch("/data/wilaya-commune.json");
  const raw = (await res.json()) as {
    code: number;
    name: string;
    communes: { name: string }[];
  }[];
  cache = raw.map((w) => ({
    code: w.code,
    name: w.name,
    communes: w.communes.map((c) => c.name),
  }));
  return cache;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
