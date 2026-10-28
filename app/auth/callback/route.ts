import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site';
import { safeNextPath } from '@/lib/schemas';
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get('code');
 if(code){const db=await createClient();const {error}=await db.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(safeNextPath(request.nextUrl.searchParams.get('next')),SITE_URL));}
 return NextResponse.redirect(new URL('/login?error=oauth',SITE_URL));
}
