import { expect,test } from '@playwright/test';
import { createE2EUser,deleteE2EUser,signIn } from './supabase';

test('admin directory and content pages work; student cannot read either',async({browser})=>{
 const admin=await createE2EUser('directory-admin','admin');
 const student=await createE2EUser('directory-student');
 try{
  const p=await browser.newPage();await signIn(p,admin.email,'/admin');await expect(p).toHaveURL('/admin');
  await expect(p.getByRole('region',{name:'Admin overview'})).toBeVisible();
  await p.goto('/admin/users');await expect(p.getByRole('heading',{name:'Users',exact:true})).toBeVisible();
  await expect(p.getByText('Read-only by design.',{exact:false})).toBeVisible();
  for(const width of [390,1280]){await p.setViewportSize({width,height:844});await p.screenshot({path:test.info().outputPath(`admin-users-${width}.png`)});}
  await p.goto('/admin/content');await expect(p.getByRole('heading',{name:'Content & sources'})).toBeVisible();
  await expect(p.getByRole('heading',{name:'Public research catalog'})).toBeVisible();
  await p.screenshot({path:test.info().outputPath('admin-content.png')});await p.close();
  const s=await browser.newPage();await signIn(s,student.email,'/dashboard');await expect(s).toHaveURL(/dashboard|onboarding/);
  for(const route of ['/admin/users','/admin/content']){await s.goto(route);await expect(s).toHaveURL('/');await expect(s.getByText('Latest 100',{exact:false})).toHaveCount(0);}
  await s.close();
 }finally{await deleteE2EUser(admin.id);await deleteE2EUser(student.id)}
});
