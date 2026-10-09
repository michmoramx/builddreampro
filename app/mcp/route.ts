import { z } from "zod";
import { allRecords, connectionSummary, getRecord, infrastructureSummary } from "@/lib/ops-db";
import { projectMath } from "@/lib/ops-core";
import { dailyReport } from "@/lib/ops-summary";

export const dynamic = "force-dynamic";

const empty = {type:"object",properties:{},additionalProperties:false};
const toolList = [
  {name:"company_daily_report",description:"Read Build Dreams MM's real daily priorities, overdue tasks, follow-ups and project balances. Amounts are USD cents. Contains at most 50 items per group. Does not send messages or change records.",inputSchema:empty,annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}},
  {name:"company_project_details",description:"Read one real project and its recorded financial totals. Use a project ID returned by company_daily_report. Does not change project status or collect payments.",inputSchema:{type:"object",properties:{projectId:{type:"string",minLength:1,maxLength:200}},required:["projectId"],additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}},
  {name:"company_connections",description:"Read provider connection states and last account checks, without credentials. A verified auth test does not establish all endpoint permissions.",inputSchema:empty,annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}},
  {name:"company_operating_guide",description:"Read the company's operating steps and daily routine. Does not execute any business action.",inputSchema:empty,annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}}
];

function rpc(id:unknown, body:Record<string,unknown>, status=200) {
  return Response.json({jsonrpc:"2.0",id,...body},{status,headers:{"Cache-Control":"no-store"}});
}
function failure(id:unknown,code:number,message:string,status=200){return rpc(id,{error:{code,message}},status);}
function content(value:unknown){return {content:[{type:"text",text:JSON.stringify(value)}],isError:false};}

export async function POST(request:Request){
  const origin=request.headers.get("Origin");
  if(origin&&![new URL(request.url).origin,"https://chatgpt.com","https://chat.openai.com"].includes(origin))return failure(null,-32003,"Origin not allowed",403);
  if(!request.headers.get("Content-Type")?.includes("application/json"))return failure(null,-32600,"JSON content type required",415);
  let body:any;
  try {const raw=await request.text();if(raw.length>65536)return failure(null,-32600,"Request too large",413);body=JSON.parse(raw);}
  catch{return failure(null,-32700,"Parse error",400);}
  if(!body||Array.isArray(body)||body.jsonrpc!=="2.0"||typeof body.method!=="string"||("id"in body&&body.id!==null&&typeof body.id!=="string"&&typeof body.id!=="number"))return failure(null,-32600,"Invalid request",400);
  const id=body.id??null;
  if(!("id"in body))return new Response(null,{status:202,headers:{"Cache-Control":"no-store"}});
  if(body.method==="initialize"){
    const supported=["2025-11-25","2025-06-18","2025-03-26","2024-11-05"];
    const protocolVersion=supported.includes(body.params?.protocolVersion)?body.params.protocolVersion:supported[0];
    return rpc(id,{result:{protocolVersion,capabilities:{tools:{listChanged:false}},serverInfo:{name:"Build Dreams MM Operations",version:"1.1.0"},instructions:"Private owner-only company system. Read-only tools. Work only from recorded facts; ask Mich about missing information."}});
  }
  if(body.method==="ping")return rpc(id,{result:{}});
  if(body.method==="tools/list")return rpc(id,{result:{tools:toolList}});
  if(body.method!=="tools/call")return failure(id,-32601,"Method not found");
  // Sites validates OAuth and the owner-private audience and supplies this identity.
  // A service bearer alone does not establish a signed-in user for these tools.
  if(!request.headers.get("oai-authenticated-user-id")?.trim())return failure(id,-32001,"Signed-in Site user required",401);
  const name=body.params?.name;
  if(!toolList.some(t=>t.name===name))return failure(id,-32602,"Unknown tool");
  try {
    const args=body.params?.arguments??{};
    if(name==="company_project_details"){
      const {projectId}=z.object({projectId:z.string().min(1).max(200)}).strict().parse(args);
      const project=await getRecord(projectId,false);
      if(project.kind!=="project")return rpc(id,{result:{content:[{type:"text",text:"Project not found"}],isError:true}});
      const records=await allRecords(false);
      return rpc(id,{result:content({id:project.id,title:project.data.title,status:project.data.status,owner:project.data.owner,scope:project.data.scope,startDate:project.data.startDate,checks:project.data.checks,currency:"USD",moneyUnit:"cents",...projectMath(project,records)})});
    }
    z.object({}).strict().parse(args);
    if(name==="company_daily_report")return rpc(id,{result:content(dailyReport(await allRecords(false)))});
    if(name==="company_connections")return rpc(id,{result:content({connections:await connectionSummary(),infrastructure:infrastructureSummary(),policy:"Credentials are never returned. Sign-in, API auth, endpoint eligibility and inference tests are separate."})});
    return rpc(id,{result:content({company:"Build Dreams MM",steps:["Registrar cliente, servicio, ciudad, responsable y siguiente fecha.","Verificar medidas y alcance; cotizar costos completos y margen.","Registrar aceptación escrita y anticipo recibido; confirmar proveedores, permisos y cuadrilla.","Registrar costos, tareas y cambios con aprobación escrita.","Registrar comprobantes de cobro y entrega; revisar saldo y margen."],daily:["Mañana: revisar vencidos, cobros y obras bloqueadas; asignar tres prioridades.","Cierre: registrar costos, comprobantes y siguientes pasos."],weekly:"Viernes: revisar oportunidades, cotizaciones, capacidad, saldos y respaldar registros.",limits:"El registro no realiza firma, envío, compra o cobro. Jobber conserva sus facturas y pagos; aquí se anotan referencias."})});
  } catch(e){
    if(e instanceof z.ZodError)return failure(id,-32602,"Invalid tool arguments");
    return rpc(id,{result:{content:[{type:"text",text:"No se pudo leer el registro solicitado. Verifica el ID y vuelve a intentar."}],isError:true}});
  }
}

export async function GET(){return new Response(null,{status:405,headers:{Allow:"POST","Cache-Control":"no-store"}});}
