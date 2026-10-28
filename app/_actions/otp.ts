"use server";
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/schemas';
import { z } from 'zod';
export type OtpState={error?:string;sent?:boolean;email?:string};
const emailSchema=z.string().trim().toLowerCase().pipe(z.email());
export async function requestOtp(_previous:OtpState,form:FormData):Promise<OtpState>{
 const email=emailSchema.safeParse(form.get('email'));
 if(!email.success)return {error:'Enter a valid email address.'};
 const db=await createClient();const {error}=await db.auth.signInWithOtp({email:email.data,options:{shouldCreateUser:false}});
 if(error&&error.status===429)return {error:'Too many requests. Wait a while before requesting another code.',email:email.data};
 // Unknown account and accepted request have the same response. Other provider
 // failures are generic and never imply that a particular email exists.
 if(error&&error.status!==400&&error.status!==422)return {error:'Could not send a code right now. Try again later or use your password.',email:email.data};
 return {sent:true,email:email.data};
}
export async function verifyEmailOtp(_previous:OtpState,form:FormData):Promise<OtpState>{
 const email=emailSchema.safeParse(form.get('email'));const token=String(form.get('token')??'').replace(/[\s-]/g,'');
 if(!email.success||!/^\d{6}$/.test(token))return {error:'Enter the full 6-digit code.',sent:true,email:String(form.get('email')??'')};
 const db=await createClient();const {error}=await db.auth.verifyOtp({email:email.data,token,type:'email'});
 if(error)return {error:'That code is invalid, expired or already used. Check the newest email or request a new code.',sent:true,email:email.data};
 redirect(safeNextPath(form.get('next')));
}
