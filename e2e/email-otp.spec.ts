import {expect,test} from '@playwright/test';
import {createE2EUser,deleteE2EUser} from './supabase';
test('email-code request submits and mobile whole-code paste keeps leading zeros',async({page})=>{
 const user=await createE2EUser('otp-mobile');
 try{
 await page.setViewportSize({width:390,height:844});await page.goto('/login');
 await expect(page.getByRole('heading',{name:'Sign in with an email code',exact:true})).toBeVisible();
 await page.getByLabel('Email for sign-in code').fill(user.email);
 const request=page.getByRole('button',{name:'Email me a code',exact:true});await expect(request).toHaveAttribute('type','submit');await request.click();
 const code=page.getByLabel('6-digit email code');await expect(code).toBeVisible();await expect(code).toHaveAttribute('autocomplete','one-time-code');await expect(code).toHaveAttribute('inputmode','numeric');
 await code.evaluate(e=>{const data=new DataTransfer();data.setData('text','00 01-23');e.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}))});await expect(code).toHaveValue('000123');
 const verify=page.getByRole('button',{name:'Verify code & sign in',exact:true});await expect(verify).toHaveAttribute('type','submit');await expect(verify).toBeEnabled();
 await verify.click();await expect(page.locator('form [role=alert]')).toContainText('invalid, expired or already used');
 }finally{await deleteE2EUser(user.id)}
});
