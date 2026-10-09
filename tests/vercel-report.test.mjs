import assert from 'node:assert/strict';
import {GET} from '../integrations/vercel-report-gateway/api/company-report.mjs';

const keys=['VERCEL_ENV','BD_GATEWAY_ENABLED','BD_SITES_URL','BD_SITES_SERVICE_TOKEN','BD_SERVICE_TOKEN'];
const before=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
const originalFetch=globalThis.fetch;
const request=(method='GET',headers={})=>new Request('https://preview.example/api/company-report',{method,headers});
let calls=0,checks=0;
try{
  for(const key of keys)delete process.env[key];
  globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://build-dreams-ops-mich.michmoramx.chatgpt.site/api/service-report');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer service-test');assert.equal(options.headers['OAI-Sites-Authorization'],'Bearer dispatch-test');assert.ok(!('Cookie'in options.headers));return Response.json({company:'Build Dreams MM',recordMode:'company',moneyUnit:'cents',counts:{projects:1},tasks:[],projects:[],followUps:[],key:'must-not-be-returned'});};
  assert.equal((await GET(request('POST'))).status,405);checks++;
  assert.equal((await GET(request())).status,503);checks++;
  Object.assign(process.env,{VERCEL_ENV:'production',BD_GATEWAY_ENABLED:'true',BD_SITES_URL:'https://build-dreams-ops-mich.michmoramx.chatgpt.site',BD_SITES_SERVICE_TOKEN:'dispatch-test',BD_SERVICE_TOKEN:'service-test'});
  assert.equal((await GET(request())).status,503);checks++;
  process.env.VERCEL_ENV='preview';
  assert.equal((await GET(request('GET',{Origin:'https://other.example'}))).status,403);checks++;
  process.env.BD_SITES_URL='https://other.example';assert.equal((await GET(request())).status,503);checks++;
  process.env.BD_SITES_URL='https://build-dreams-ops-mich.michmoramx.chatgpt.site';
  assert.equal(calls,0);checks++;
  const ok=await GET(request('GET',{Cookie:'private-browser-cookie',Authorization:'Bearer visitor-token'}));
  assert.equal(ok.status,200);assert.equal(ok.headers.get('Cache-Control'),'no-store');assert.ok(!(await ok.text()).includes('must-not-be-returned'));assert.equal(calls,1);checks+=4;
  globalThis.fetch=async()=>new Response(null,{status:403});assert.equal((await GET(request())).status,502);checks++;
  globalThis.fetch=async()=>{throw new Error('dispatch-test service-test');};const error=await GET(request());assert.equal(error.status,502);assert.ok(!(await error.text()).includes('dispatch-test'));checks+=2;
  console.log(JSON.stringify({passed:true,checks,externalRequests:0,scope:'gateway remains off, production refusal, origin and fixed destination, server-only headers, no secrets in output, failure handling'}));
}finally{globalThis.fetch=originalFetch;for(const key of keys){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}}
