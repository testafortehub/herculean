const fs = require('fs');
const { minify } = require('terser');

async function obfuscate() {
  const html = fs.readFileSync('index.html', 'utf8');
  
  // Extract JS between <script> tags and minify
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    console.log('No script found');
    return;
  }

  const result = await minify(scriptMatch[1], {
    compress: { drop_console: false },
    mangle: true,
    output: { beautify: false }
  });

  if (result.error) {
    console.error('Minify error:', result.error);
    return;
  }

  const minifiedHtml = html.replace(
    /<script[^>]*>[\s\S]*?<\/script>/,
    `<script>${result.code}</script>`
  );

  fs.writeFileSync('index.min.html', minifiedHtml);
  console.log('✓ Minified to index.min.html');
  console.log(`Original: ${html.length} bytes | Minified: ${minifiedHtml.length} bytes`);
}

obfuscate().catch(console.error);
