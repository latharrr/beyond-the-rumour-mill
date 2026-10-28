import {expect,test} from '@playwright/test';
import {createE2EUser,deleteE2EUser,signIn} from './supabase';
test('mobile and desktop plan controls remain clickable with floating nav',async({page})=>{
 const u=await createE2EUser('nav-check');
 try{
  await signIn(page,u.email,'/drives');
  await page.getByRole('link',{name:'Amazon SDE-1 New Grad'}).click();
  await page.getByRole('button',{name:'Generate my prep plan'}).click();
  await expect(page).toHaveURL(/dashboard\/plans\//);
  for(const width of [390,1280]){
   await page.setViewportSize({width,height:844});
   const link=page.getByRole('link',{name:'Export as Markdown'});
   await link.scrollIntoViewIfNeeded();
   await page.waitForTimeout(600);
   await link.click({trial:true});
   await page.screenshot({path:test.info().outputPath(`plan-viewport-${width}.png`)});
   await page.getByRole('link',{name:'Back to the drive'}).click({trial:true});
  }
 }finally{await deleteE2EUser(u.id)}
});
