import { z } from "zod";
export type Entity = { id: string; kind: string; demo: boolean; data: any; version: number; createdAt: string; updatedAt: string };
export const STAGES = ["new", "qualified", "visit", "quoted", "won", "lost"] as const;
export const STAGE_LABELS: Record<string, string[]> = {
 new:["Nuevo","New"],qualified:["Calificado","Qualified"],visit:["Visita","Site visit"],quoted:["Cotizado","Quoted"],won:["Ganado","Won"],lost:["Perdido","Lost"],
 scheduled:["Programada","Scheduled"],active:["En ejecución","Active"],blocked:["Bloqueada","Blocked"],complete:["Terminada","Complete"],draft:["Borrador","Draft"],sent:["Enviada","Sent"],accepted:["Aceptada","Accepted"]
};
const short = z.string().trim().min(1).max(180);
const long = z.string().trim().min(1).max(5000);
const note = z.string().trim().max(5000).default("");
const cents = z.number().int().min(0).max(10_000_000_000);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v,"Fecha inválida");
const date = dateSchema;
export const contactSchema = z.object({name:short,company:z.string().max(180).default(""),email:z.union([z.string().email(),z.literal("")]).default(""),phone:z.string().max(40).default(""),city:z.string().max(100).default("DFW"),service:short,source:short,owner:short,nextDue:date,valueCents:cents.default(0),notes:note,consent:z.boolean().default(false),stage:z.enum(STAGES).default("new"),externalId:z.string().max(180).optional()});
export const estimateSchema = z.object({contactId:short,title:short,scope:long,exclusions:note,items:z.array(z.object({description:short,quantity:z.number().positive().max(1e6),unit:z.string().max(30).default("unidad"),unitCostCents:cents})).min(1).max(100),overheadPct:z.number().min(0).max(100),contingencyPct:z.number().min(0).max(100),marginPct:z.number().min(1).max(80),depositPct:z.number().min(0).max(100),validUntil:date,owner:short});
export const ledgerSchema = z.object({projectId:short,type:z.enum(["expense","payment"]),description:short,amountCents:cents.refine(x=>x>0),date,paid:z.boolean().default(true),reference:z.string().trim().max(180).default("")});
export const taskSchema = z.object({title:short,owner:short,due:date,contactId:z.string().default(""),projectId:z.string().default(""),notes:note});
export const changeSchema = z.object({projectId:short,title:short,scope:long,priceCents:cents,costCents:cents,signedRef:short,acceptedBy:short});
export function estimateMath(input:{items:{quantity:number;unitCostCents:number}[];overheadPct:number;contingencyPct:number;marginPct:number}) {
 if(!Number.isFinite(input.marginPct)||input.marginPct<=0||input.marginPct>=100) throw new Error("El margen debe estar entre 0 y 100%.");
 const direct=input.items.reduce((s,i)=>s+Math.round(i.quantity*i.unitCostCents),0);const overhead=Math.round(direct*input.overheadPct/100);const contingency=Math.round((direct+overhead)*input.contingencyPct/100);const costCents=direct+overhead+contingency;const priceCents=Math.round(costCents/(1-input.marginPct/100));
 if(![direct,overhead,contingency,costCents,priceCents].every(v=>Number.isSafeInteger(v)&&v>=0))throw new Error("El importe supera el límite de cálculo seguro.");
 return{directCents:direct,overheadCents:overhead,contingencyCents:contingency,costCents,priceCents,profitCents:priceCents-costCents};
}
export function projectMath(project:Entity,records:Entity[]) {
 const changes=records.filter(r=>r.kind==="change"&&r.data.projectId===project.id);const entries=records.filter(r=>r.kind==="ledger"&&r.data.projectId===project.id);
 const contractCents=project.data.priceCents+changes.reduce((s,r)=>s+r.data.priceCents,0);const budgetCents=project.data.costCents+changes.reduce((s,r)=>s+r.data.costCents,0);
 const receivedCents=entries.filter(r=>r.data.type==="payment").reduce((s,r)=>s+r.data.amountCents,0);const costsCents=entries.filter(r=>r.data.type==="expense").reduce((s,r)=>s+r.data.amountCents,0);const paidCostsCents=entries.filter(r=>r.data.type==="expense"&&r.data.paid).reduce((s,r)=>s+r.data.amountCents,0);
 return{contractCents,budgetCents,receivedCents,costsCents,paidCostsCents,balanceCents:contractCents-receivedCents,remainingBudgetCents:budgetCents-costsCents,cashCents:receivedCents-paidCostsCents,projectedProfitCents:contractCents-Math.max(costsCents,budgetCents)};
}
export function activationErrors(project:Entity,records:Entity[]) {
 const p=project.data,m=projectMath(project,records),errors:string[]=[];if(!p.owner?.trim())errors.push("Asigna un responsable de obra.");
 for(const[key,label]of[["scope","Alcance aceptado"],["quotes","Cotizaciones de proveedores verificadas"],["permits","Diseño y permisos revisados según aplique"],["crew","Cuadrilla asignada"]])if(!p.checks?.[key])errors.push(label);
 if(m.receivedCents<Math.round(p.priceCents*p.depositPct/100))errors.push("Registra el anticipo requerido antes de iniciar.");return errors;
}
export function todayChicago(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
export function addDays(days:number){const d=new Date(todayChicago()+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function contactKeys(c:any){const email=c.email?.trim().toLowerCase(),phone=c.phone?.replace(/\D/g,"").replace(/^1(?=\d{10}$)/,"");return[email?`email:${email}`:"",phone?`phone:${phone}`:"",c.externalId?`source:${c.source}:${c.externalId}`:""].filter(Boolean)as string[];}
export function contactKey(c:any){return contactKeys(c)[0]||"";}
export function sameContact(a:any,b:any){const keys=new Set(contactKeys(a));return contactKeys(b).some(k=>keys.has(k));}
export function csvCell(v:unknown){let s=String(v??"");if(/^[=+@\-]/.test(s))s="'"+s;return'"'+s.replace(/"/g,'""')+'"';}
export function parseCSV(input:string){const rows:string[][]=[];let row:string[]=[],field="",quoted=false;for(let i=0;i<input.length;i++){const c=input[i];if(c==='"'){if(quoted&&input[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===","&&!quoted){row.push(field);field="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&input[i+1]==="\n")i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field="";}else field+=c;}if(quoted)throw new Error("CSV inválido: comillas sin cerrar.");row.push(field);if(row.some(x=>x.trim()))rows.push(row);if(rows.length<2)throw new Error("El CSV necesita encabezados y al menos un contacto.");const heads=rows.shift()!.map(h=>h.replace(/^\uFEFF/,"").trim().toLowerCase().replace(/[ _]/g,""));return rows.map(r=>Object.fromEntries(heads.map((h,i)=>[h,r[i]?.trim()||""])));}
