import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2.57.4";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type, x-family-pin","Access-Control-Allow-Methods":"GET, POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 const pin=Deno.env.get('FAMILY_HUB_PIN');
 if(!pin||req.headers.get('x-family-pin')!==pin)return json({error:'Invalid PIN'},401);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key)return json({error:'Server configuration is missing.'},500);
 const db=createClient(url,key),requestUrl=new URL(req.url);
 if(req.method==='GET'){
  const snapshot=requestUrl.searchParams.get('snapshot');
  if(snapshot){
   if(!/^\d+$/.test(snapshot))return json({error:'Invalid history ID'},400);
   const {data,error}=await db.from('family_hub_history').select('data,saved_at').eq('state_id','main').eq('id',snapshot).maybeSingle();
   return error?json({error:error.message},500):data?json(data):json({error:'Snapshot not found'},404);
  }
  if(requestUrl.searchParams.get('history')==='1'){
   const {data,error}=await db.from('family_hub_history').select('id,saved_at,archived_at').eq('state_id','main').order('id',{ascending:false}).limit(30);
   return error?json({error:error.message},500):json({history:data});
  }
  const {data,error}=await db.from('family_hub_state').select('data,updated_at').eq('id','main').single();
  return error?json({error:error.message},500):json(data);
 }
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const body=await req.json();
  if(!body?.data||typeof body.data!=='object'||Array.isArray(body.data))return json({error:'Invalid Family Hub data.'},400);
  if(typeof body.expected_updated_at!=='string'||!Number.isFinite(Date.parse(body.expected_updated_at)))return json({error:'Refresh Family Hub before saving. This device is using an older version.'},409);
  const {data,error}=await db.from('family_hub_state').update({data:body.data,updated_at:new Date(Math.max(Date.now(),Date.parse(body.expected_updated_at)+1)).toISOString()}).eq('id','main').eq('updated_at',body.expected_updated_at).select('updated_at').maybeSingle();
  if(error)return json({error:error.message},500);
  if(!data)return json({error:'Another device saved first. Reload the latest copy and merge before retrying.'},409);
  return json({success:true,updated_at:data.updated_at});
 }catch{return json({error:'Invalid request.'},400)}
});
