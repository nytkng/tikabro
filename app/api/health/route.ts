export function GET(){return Response.json({ok:true,db:!!process.env.SUPABASE_URL})}
