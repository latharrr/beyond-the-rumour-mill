"use client";
import { useActionState,useEffect,useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { requestOtp,verifyEmailOtp,type OtpState } from '@/app/_actions/otp';
import { input,label } from '@/components/ui/field';
import { Button } from '@/components/ui/pill';

export function OtpForm(){
 const [sent,send,sending]=useActionState(requestOtp,{} as OtpState);
 const [result,verify,verifying]=useActionState(verifyEmailOtp,{} as OtpState);
 const [email,setEmail]=useState('');const [manual,setManual]=useState(false);const [token,setToken]=useState('');const [cooldown,setCooldown]=useState(0);const params=useSearchParams();

 useEffect(()=>{if(cooldown<=0)return;const timer=setTimeout(()=>setCooldown(c=>c-1),1000);return()=>clearTimeout(timer)},[cooldown]);
 return <div className="grid gap-5">
 <p className="type-small text-ink-muted">For an existing account. New here? Create an account below first.</p>
 <form action={async form=>{send(form);setCooldown(60);setToken('')}} className="grid gap-3"><label htmlFor="otp-email" className={label}>Email for sign-in code</label><input id="otp-email" name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required className={input}/>
 <Button type="submit" disabled={sending||cooldown>0}>{sending?'Sending...':cooldown>0?`Resend in ${cooldown}s`:'Email me a code'}</Button>
 {sent.error&&<p role="alert" className="type-small text-rumour">{sent.error}</p>}
 </form>
 <button type="button" onClick={()=>setManual(true)} className="min-h-11 type-small text-amber underline">Already have a code? Enter it</button>
 {(sent.sent||manual)&&<form action={verify} className="grid gap-3">
  <p role="status" className="type-small text-ink-muted">If this email has an account, a code is on its way. Use the newest code within 1 hour. Check spam too.</p>
  <input type="hidden" name="email" value={email}/><input type="hidden" name="next" value={params.get('next')??'/dashboard'}/>
  <label htmlFor="email-code" className={label}>6-digit email code</label>
  <input id="email-code" name="token" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={token} onChange={e=>setToken(e.target.value.replace(/[^0-9]/g,'').slice(0,6))} onPaste={e=>{e.preventDefault();setToken(e.clipboardData.getData('text').replace(/[^0-9]/g,'').slice(0,6))}} required aria-describedby="otp-help" className={`${input} tracking-[.3em] text-xl`}/>
  <p id="otp-help" className="type-small text-ink-dim">Paste all six digits at once. Use the same email address above. Your keyboard may offer the code when your device supports email-code autofill.</p>
  {result.error&&<p role="alert" className="type-small text-rumour">{result.error}</p>}
  <Button type="submit" disabled={verifying||token.length!==6}>{verifying?'Checking...':'Verify code & sign in'}</Button>
 </form>}
 </div>;
}
