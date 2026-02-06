/** Extract numeric value; API returns raw number or [[n]]/[n]. Coerces safely to number. */
export const scalar = (r: unknown): number => {
  const v =
    typeof r === "number"
      ? r
      : Array.isArray(r)
        ? Array.isArray(r[0])
          ? r[0][0]
          : r[0]
        : 0;

  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
