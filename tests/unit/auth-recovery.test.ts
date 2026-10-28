import { beforeEach, describe, expect, it, vi } from 'vitest';
const h=vi.hoisted(()=>({reset:vi.fn(),claims:vi.fn(),update:vi.fn(),verify:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{resetPasswordForEmail:h.reset,getClaims:h.claims,updateUser:h.update,verifyOtp:h.verify}})}));
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw new Error('REDIRECT:'+url)}}));
vi.mock('@/lib/site',()=>({SITE_URL:'https://example.test'}));
import {requestPasswordReset,updatePassword} from '@/app/_actions/auth';
import {GET} from '@/app/auth/confirm/route';
import {NextRequest} from 'next/server';
const form=(obj:Record<string,string>)=>{const f=new FormData();Object.entries(obj).forEach(([k,v])=>f.set(k,v));return f};
beforeEach(()=>{vi.resetAllMocks();h.reset.mockResolvedValue({error:null});h.claims.mockResolvedValue({data:{claims:{sub:'fixture'}}});h.update.mockResolvedValue({error:null});h.verify.mockResolvedValue({error:null})});
describe('password recovery actions',()=>{
 it('rejects malformed email before contacting auth',async()=>{expect((await requestPasswordReset({},form({email:'bad'}))).fieldErrors?.email).toBeTruthy();expect(h.reset).not.toHaveBeenCalled()});
 it('uses an enumeration-safe message even for auth errors',async()=>{h.reset.mockResolvedValue({error:{message:'unknown account'}});expect((await requestPasswordReset({},form({email:'fixture@example.test'}))).message).toContain('If an account exists')});
 it('rejects weak passwords before updating auth',async()=>{expect((await updatePassword({},form({password:'a',confirm:'a'}))).fieldErrors?.password).toBeTruthy();expect(h.update).not.toHaveBeenCalled()});
 it('rejects mismatching password confirmation',async()=>{expect((await updatePassword({},form({password:'password123',confirm:'password456'}))).fieldErrors?.password).toContain('Passwords do not match.')});
 it('rejects a missing session',async()=>{h.claims.mockResolvedValue({data:null});expect((await updatePassword({},form({password:'password123',confirm:'password123'}))).error).toContain('invalid or has expired');expect(h.update).not.toHaveBeenCalled()});
 it('handles an auth update error without leaking it',async()=>{h.update.mockResolvedValue({error:{message:'private backend detail'}});const r=await updatePassword({},form({password:'password123',confirm:'password123'}));expect(r.error).toContain('Could not update');expect(r.error).not.toContain('private')});
 it('updates a valid password and redirects to the dashboard',async()=>{await expect(updatePassword({},form({password:'password123',confirm:'password123'}))).rejects.toThrow('REDIRECT:/dashboard');expect(h.update).toHaveBeenCalledWith({password:'password123'})});
});
describe('confirmation handler',()=>{
 it('uses canonical origin for recovery redirects behind a proxy',async()=>{const r=await GET(new NextRequest('http://localhost:3100/auth/confirm?token_hash=fixture&type=recovery'));expect(r.headers.get('location')).toBe('https://example.test/reset-password')});
 it('ignores off-site next targets',async()=>{const r=await GET(new NextRequest('http://localhost:3100/auth/confirm?token_hash=fixture&type=signup&next=//evil.example'));expect(r.headers.get('location')).toBe('https://example.test/onboarding')});
 it('rejects unsupported OTP types without verification',async()=>{const r=await GET(new NextRequest('http://localhost:3100/auth/confirm?token_hash=fixture&type=unknown'));expect(r.headers.get('location')).toBe('https://example.test/login?error=confirm');expect(h.verify).not.toHaveBeenCalled()});
 it('handles expired tokens',async()=>{h.verify.mockResolvedValue({error:{message:'expired'}});const r=await GET(new NextRequest('http://localhost:3100/auth/confirm?token_hash=fixture&type=recovery'));expect(r.headers.get('location')).toBe('https://example.test/login?error=confirm')});
});
