import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site';
import { safeNextPath } from '@/lib/schemas';

export async function GET(request:NextRequest){
 const next=safeNextPath(request.nextUrl.searchParams.get('next'));
 const db=await createClient();
 const callback=new URL('/auth/callback',SITE_URL);callback.searchParams.set('next',next);
 const {data,error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:callback.toString(),scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
 if(error||!data.url)return NextResponse.redirect(new URL('/login?error=oauth',SITE_URL));
 return NextResponse.redirect(data.url);
}
