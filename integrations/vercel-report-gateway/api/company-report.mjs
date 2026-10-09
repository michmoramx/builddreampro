const SITE_ORIGIN="https://build-dreams-ops-mich.michmoramx.chatgpt.site";

export async function GET(request){
  const send=(status,payload)=>Response.json(payload,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Allow":"GET"}});
  if(request.method!=="GET")return send(405,{error:"Solo lectura."});
  // Deployment Protection must be enabled for every preview deployment.
  // This draft refuses production and remains off unless explicitly activated.
  if(process.env.VERCEL_ENV!=="preview"||process.env.BD_GATEWAY_ENABLED!=="true")return send(503,{error:"Reporte de prueba sin activar."});
  const origin=request.headers.get("Origin");
  if(origin&&origin!==new URL(request.url).origin)return send(403,{error:"Origen no permitido."});
  if(process.env.BD_SITES_URL!==SITE_ORIGIN||!process.env.BD_SITES_SERVICE_TOKEN||!process.env.BD_SERVICE_TOKEN)return send(503,{error:"Falta configurar el acceso autorizado."});
  try{
    const upstream=await fetch(`${SITE_ORIGIN}/api/service-report`,{
      method:"GET",redirect:"error",signal:AbortSignal.timeout(12000),
      headers:{"OAI-Sites-Authorization":`Bearer ${process.env.BD_SITES_SERVICE_TOKEN}`,"Authorization":`Bearer ${process.env.BD_SERVICE_TOKEN}`,"Accept":"application/json"}
    });
    if(!upstream.ok)return send(502,{error:"El centro privado no permitió obtener el reporte."});
    if(!upstream.headers.get("Content-Type")?.includes("application/json"))return send(502,{error:"Respuesta de reporte no válida."});
    const report=await upstream.json();
    if(report.company!=="Build Dreams MM"||report.recordMode!=="company"||report.moneyUnit!=="cents")return send(502,{error:"Formato de reporte no válido."});
    // Forward only a bounded business report, never provider credentials or raw records.
    return send(200,{company:report.company,date:report.date,timezone:report.timezone,currency:"USD",moneyUnit:"cents",recordMode:"company",counts:report.counts,tasks:(report.tasks||[]).slice(0,50),projects:(report.projects||[]).slice(0,50),followUps:(report.followUps||[]).slice(0,50),policy:report.policy});
  }catch{return send(502,{error:"No se pudo conectar con el centro privado."});}
}
