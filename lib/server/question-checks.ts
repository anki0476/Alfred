import { z } from "zod";
import { polynomial, solutions, normalizeRoot } from "../math.mjs";
export const checkSchema=z.object({
 kind:z.enum(["arithmetic","roots","identity"]),
 input:z.string().min(1).max(180),expected:z.string().min(1).max(180),
 purpose:z.string().min(10).max(300)
}).strict();
export type MathCheck=z.infer<typeof checkSchema>;
export function verifyChecks(checks:MathCheck[]) {
 for(const raw of checks) {
  const c=checkSchema.parse(raw);
  if(c.kind==="arithmetic") {
   if(normalizeRoot(c.input)!==normalizeRoot(c.expected)) throw new Error("Arithmetic check failed");
  } else if(c.kind==="roots") {
   const result=solutions(c.input.includes("=")?c.input:c.input+"=0");
   const expected=[...new Set(c.expected.split(",").map(x=>normalizeRoot(x.trim())))].sort();
   if(result.kind!=="finite"||JSON.stringify(result.roots)!==JSON.stringify(expected)) throw new Error("Root check failed");
  } else {
   const key=(s:string)=>polynomial(s).map((n:{n:bigint;d:bigint})=>String(n.n)+"/"+String(n.d)).join(",");
   if(key(c.input)!==key(c.expected)) throw new Error("Identity check failed");
  }
 }
 return checks.length;
}
