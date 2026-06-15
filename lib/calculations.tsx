export const MARKET_RATE = 6.49;

export interface RoastGrade {
  grade: string;
  label: string;
  color: string;
  bg: string;
  ring: string;
  msg: string;
}

export function getRoastGrade(rate: number): RoastGrade {
  if (rate <= 6.5)  return { grade: 'A', label: 'Excellent',    color: 'text-emerald-600', bg: 'bg-emerald-50',  ring: 'ring-emerald-400', msg: "You're already getting a competitive rate. Well done." };
  if (rate <= 8.0)  return { grade: 'B', label: 'Average',      color: 'text-amber-500',   bg: 'bg-amber-50',    ring: 'ring-amber-400',   msg: "Not terrible — but there may be room to improve." };
  if (rate <= 10.0) return { grade: 'C', label: 'Above Market', color: 'text-[#FF4C0C]', bg: 'bg-[#FFF1EC]', ring: 'ring-[#FF4C0C]/60', msg: "You're paying more than you should. Time to check your options." };
  return             { grade: 'D', label: 'Ouch',               color: 'text-[#FF4C0C]', bg: 'bg-[#FFE0CC]', ring: 'ring-[#FF4C0C]',    msg: "Your rate is significantly above market. You could save thousands." };
}

export function calcSavings(balance: number, currentRate: number, marketRate: number, termYears: number): number {
  const monthly = (r: number, p: number, t: number): number => {
    const mr = r / 100 / 12;
    const n = t * 12;
    if (mr === 0) return p / n;
    return (p * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
  };
  const current = monthly(currentRate, balance, termYears) * termYears * 12;
  const market  = monthly(marketRate,  balance, termYears) * termYears * 12;
  return Math.max(0, Math.round(current - market));
}
