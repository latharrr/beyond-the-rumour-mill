import { expect,test } from '@playwright/test';

test('research catalog is linked, sourced and separate from verified evidence',async({page})=>{
 await page.goto('/companies');
 await expect(page.getByRole('heading',{name:'Company research',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Requirements, rounds & sources'})).toHaveCount(12);
 await page.getByRole('link',{name:'TCS',exact:true}).click();
 await expect(page).toHaveURL(/\/companies\/tcs$/);
 await expect(page.getByText('Closed / past cycle',{exact:true}).first()).toBeVisible();
 await expect(page.getByRole('heading',{name:'Candidate-reported interviews'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Official source',exact:false})).toHaveAttribute('href',/^https:\/\/www.tcs.com\//);
 await page.goto('/drives');
 await expect(page.getByRole('heading',{name:'Company research & public opportunities'})).toBeVisible();
 await expect(page.getByText(/not LPU campus announcements/)).toBeVisible();
 for(const path of ['/admin/users','/admin/content']){
  await page.goto(path); await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/Latest 100/)).toHaveCount(0);
 }
});
