import { allRecords, runtime } from "@/lib/ops-db";
import { dailyReport } from "@/lib/ops-summary";

export const dynamic="force-dynamic";

// Disabled until a separate, explicitly authorized service credential is configured.
// Sites dispatch must also authorize access to this owner-private Site.
export async function GET(request:Request){
  const token=runtime().BD_SERVICE_TOKEN;
  if(!token||request.headers.get("Authorization")!==`Bearer ${token}`)return Response.json({error:"Acceso de servicio no autorizado."},{status:401,headers:{"Cache-Control":"no-store"}});
  try{return Response.json(dailyReport(await allRecords(false)),{headers:{"Cache-Control":"no-store"}});}
  catch{return Response.json({error:"No se pudo obtener el reporte."},{status:503,headers:{"Cache-Control":"no-store"}});}
}
