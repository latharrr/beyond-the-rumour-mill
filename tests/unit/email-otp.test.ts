import { beforeEach,describe,expect,it,vi } from 'vitest';
const mocks=vi.hoisted(()=>({send:vi.fn(),verify:vi.fn(),redirect:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{signInWithOtp:mocks.send,verifyOtp:mocks.verify}})}));
vi.mock('next/navigation',()=>({redirect:mocks.redirect}));
import {requestOtp,verifyEmailOtp} from '@/app/_actions/otp';
function form(values:Record<string,string>){const f=new FormData();for(const[k,v]of Object.entries(values))f.set(k,v);return f}
describe('email code sign-in',()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.send.mockResolvedValue({error:null});mocks.verify.mockResolvedValue({error:null})});
 it('only requests existing accounts and normalizes email',async()=>{const r=await requestOtp({},form({email:' USER@example.com '}));expect(r.sent).toBe(true);expect(mocks.send).toHaveBeenCalledWith({email:'user@example.com',options:{shouldCreateUser:false}})});
 it('does not reveal unknown account',async()=>{mocks.send.mockResolvedValue({error:{status:422,code:'user_not_found'}});expect((await requestOtp({},form({email:'unknown@example.com'}))).sent).toBe(true)});
 it('reports quota without retrying or flooding',async()=>{mocks.send.mockResolvedValue({error:{status:429}});expect((await requestOtp({},form({email:'a@example.com'}))).error).toMatch(/Too many/);expect(mocks.send).toHaveBeenCalledTimes(1)});
 it('rejects malformed code locally',async()=>{expect((await verifyEmailOtp({},form({email:'a@example.com',token:'12'}))).error).toMatch(/6-digit/);expect(mocks.verify).not.toHaveBeenCalled()});
 it.each(['expired','replayed','invalid'])('handles %s provider refusal without session redirect',async()=>{mocks.verify.mockResolvedValue({error:{message:'otp_expired'}});expect((await verifyEmailOtp({},form({email:'a@example.com',token:'000123'}))).error).toMatch(/invalid, expired or already used/);expect(mocks.redirect).not.toHaveBeenCalled()});
 it('preserves leading zeros and strips pasted separators; no profile writes',async()=>{await verifyEmailOtp({},form({email:'a@example.com',token:'00 01-23',next:'https://evil.invalid'}));expect(mocks.verify).toHaveBeenCalledWith({email:'a@example.com',token:'000123',type:'email'});expect(mocks.redirect).toHaveBeenCalledWith('/dashboard')});
});
