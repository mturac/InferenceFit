import { readFile } from 'node:fs/promises';

const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const image = await readFile(new URL('../docs/assets/inferencefit-hero.png', import.meta.url));
const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!image.subarray(0, 8).equals(signature)) throw new Error('InferenceFit hero is not a PNG.');
const ihdr = image.indexOf(Buffer.from('IHDR'));
if (ihdr < 0) throw new Error('InferenceFit hero has no IHDR chunk.');
const width = image.readUInt32BE(ihdr + 4);
const height = image.readUInt32BE(ihdr + 8);
if (width !== 1536 || height !== 860) throw new Error(`InferenceFit hero must be 1536x860, got ${width}x${height}.`);
if (image.length < 12000) throw new Error(`InferenceFit hero is unexpectedly small (${image.length}).`);
if (new Set(image.subarray(Math.max(0, image.length - 20000))).size < 48) throw new Error('InferenceFit hero lacks visual variation.');
if (!readme.includes('docs/assets/inferencefit-hero.png')) throw new Error('README does not reference PNG hero.');
if (/<img[^>]+src=["'][^"']+\.svg/i.test(readme)) throw new Error('SVG hero is forbidden.');
process.stdout.write(`Hero verified: ${width}x${height}, ${image.length} bytes.\n`);
