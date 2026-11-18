import { getStore } from '@netlify/blobs';
import { scryptSync, timingSafeEqual } from 'node:crypto';
const EXPECTED = '68849539ec74b26d650f6b27eb5ac70520a60edbe77dcf0f69d14dd9584e746c';
const SALT = 'engetop-admin-v1-static-salt';
function validPassword(value='') {
  const got = scryptSync(String(value), SALT, 32);
  const expected = Buffer.from(EXPECTED, 'hex');
  return timingSafeEqual(got, expected);
}
export default async (req) => {
  const store = getStore('engetop-public-site');
  if (req.method === 'GET') {
    const content = await store.get('content', { type: 'json' });
    return Response.json(content || null, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'JSON inválido' }, { status: 400 }); }
  if (!validPassword(body.password)) return Response.json({ error: 'Acesso negado' }, { status: 401 });
  if (body.action === 'login') return Response.json({ ok: true });
  if (body.action !== 'save' || !body.content || !Array.isArray(body.content.services)) return Response.json({ error: 'Dados inválidos' }, { status: 400 });
  const bytes = Buffer.byteLength(JSON.stringify(body.content), 'utf8');
  if (bytes > 4_500_000) return Response.json({ error: 'Conteúdo muito grande. Reduza o tamanho das fotos.' }, { status: 413 });
  await store.setJSON('content', body.content);
  return Response.json({ ok: true });
};
