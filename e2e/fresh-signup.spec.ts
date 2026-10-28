import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { serviceClient } from './supabase';

test('fresh browser signup -> caught confirmation mail -> first session -> persistent login', async ({page,request}) => {
 test.skip(!process.env.TEST_CONFIRMATION_MAILBOX, 'Requires local mail catcher and confirmation enabled');
 const email=`fresh-${randomUUID().slice(0,8)}@e2e.test`;
 const svc=serviceClient();
 let id:string|undefined;
 try {
  await page.goto('/login');
  await page.getByRole('button',{name:'New here? Create an account'}).click();
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill('password123');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByText('Check your email to confirm your account, then sign in.')).toBeVisible();
  const users=await svc.auth.admin.listUsers();
  const user=users.data.users.find(u=>u.email===email); id=user?.id;
  expect(user?.email_confirmed_at).toBeFalsy();
  let message: {ID: string; To: {Address: string}[]} | undefined;
  await expect.poll(async()=>{
   const r=await request.get(`${process.env.TEST_CONFIRMATION_MAILBOX}/api/v1/messages`);
   const body=await r.json();
   message=body.messages?.find((m: {ID: string; To: {Address: string}[]})=>m.To?.some(t=>t.Address===email));
   return !!message;
  }).toBeTruthy();
  const r=await request.get(`${process.env.TEST_CONFIRMATION_MAILBOX}/api/v1/message/${message!.ID}`);
  const mail=await r.json();
  const html=mail.HTML || mail.Text;
  const match=html.match(/href="([^"]*\/auth\/confirm[^"]*)"/);
  expect(match).toBeTruthy();
  const link=match![1].replace(/&amp;/g,'&');
  await page.goto(link);
  await expect(page).toHaveURL('/onboarding');
  await expect(page.getByRole('heading',{name:'Complete your profile'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Sign out'})).toBeVisible();
  await page.screenshot({path:test.info().outputPath('fresh-signup.png'),fullPage:true});
  const confirmed=await svc.auth.admin.getUserById(id!);
  expect(confirmed.data.user?.email_confirmed_at).toBeTruthy();
 } finally {if(id) await svc.auth.admin.deleteUser(id);}
});
