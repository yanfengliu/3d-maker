import { mkdir,writeFile } from 'node:fs/promises';
import { studioBrowser } from './browser.mjs';

const browser = await studioBrowser();
try {
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  page.on('pageerror',error=>console.error(error.message));
  await page.goto(process.env.SHOT_BASE || 'http://127.0.0.1:5199/');
  const rows=await page.evaluate(async()=> (await import('./src/studio/thumbnails.ts')).starterPosters());
  await mkdir('public/previews',{recursive:true});
  for(const {id,image} of rows){
    const bytes=Buffer.from(image.split(',')[1],'base64');
    if(bytes.byteLength<1000)throw new Error('Empty poster: '+id);
    await writeFile('public/previews/'+id+'.webp',bytes);
    console.log(id,bytes.byteLength);
  }
} finally {await browser.close();}
