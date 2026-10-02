export type Wilaya = { code: number; name: string; communes: string[] };

let cache: Wilaya[] | null = null;
let inflight: Promise<Wilaya[]> | null = null;

export function loadWilayas(): Promise<Wilaya[]> {
  if (cache) return Promise.resolve(cache);
  // Share one in-flight request: N components mounting at once = 1 fetch.
  if (!inflight) {
    inflight = fetch("/data/wilaya-commune.json")
      .then((res) => {
        if (!res.ok) throw new Error(`wilayas ${res.status}`);
        return res.json() as Promise<
          { code: number; name: string; communes: { name: string }[] }[]
        >;
      })
      .then((raw) => {
        cache = raw.map((w) => ({
          code: w.code,
          name: w.name,
          communes: w.communes.map((c) => c.name),
        }));
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
