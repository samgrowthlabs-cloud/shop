import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

let DatabaseSync = null;
try {
  ({ DatabaseSync } = await import('node:sqlite'));
} catch {
  DatabaseSync = null;
}

const { newsRoute } = await import('../cloudflare-dashboard/news.js');

/* D1-shaped double over node:sqlite so the production SQL runs unmodified. */
function createDatabase(sqlite) {
  sqlite.exec('PRAGMA foreign_keys = ON');
  const statement = (sql, values = []) => ({
    sql,
    values,
    bind(...nextValues) { return statement(sql, nextValues); },
    async first(column) {
      const row = sqlite.prepare(sql).get(...values);
      if (!row) return null;
      return column ? row[column] : row;
    },
    async all() { return { results: sqlite.prepare(sql).all(...values) }; },
    async run() {
      const result = sqlite.prepare(sql).run(...values);
      return { success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
    },
  });
  return {
    prepare(sql) { return statement(sql); },
    async batch(statements) { const output = []; for (const item of statements) output.push(await item.run()); return output; },
  };
}

function buildDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of ['cloudflare-dashboard/schema.sql', 'cloudflare-dashboard/news-upgrade.sql', 'cloudflare-dashboard/news-saves-upgrade.sql']) {
    try { sqlite.exec(readFileSync(file, 'utf8')); } catch {}
  }
  sqlite.prepare("INSERT INTO products(id,name,slug,status,created_at,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").run('produto-testado', 'Produto testado', 'produto-testado', 'published');
  return { sqlite, DB: createDatabase(sqlite) };
}

const actor = { id: 'colaborador-testado', name: 'Equipe Testada', role: 'owner', roleLabel: 'Proprietário', permissions: ['*'] };
const baseArticle = {
  title: 'Notícia de teste',
  slug: 'noticia-de-teste',
  subtitle: 'Subtítulo',
  excerpt: 'Resumo',
  content: '<p>Conteúdo</p>',
  category: 'Tecnologia',
  author: 'Equipe Testada',
  tags: ['teste'],
  status: 'draft',
  publishedAt: null,
  readingTime: 2,
  imageAlt: '',
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  newsletterMode: 'off',
  newsletterSubject: '',
  isFeatured: false,
  productIds: [],
};

async function save(DB, body, method = 'POST', id = null) {
  const url = new URL(id ? `https://shoplab.test/api/v1/admin/news/${id}` : 'https://shoplab.test/api/v1/admin/news');
  const request = new Request(url.href, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const response = await newsRoute(request, { DB, MEDIA: null, NEWS_CACHE: null }, url, actor, null);
  return { status: response.status, payload: await response.json() };
}

test('salvar notícia grava artigo, produtos e autoria na mesma transação', { skip: !DatabaseSync }, async () => {
  const { sqlite, DB } = buildDatabase();
  const created = await save(DB, { ...baseArticle, productIds: ['produto-testado'] });
  assert.equal(created.status, 201);
  const articleId = created.payload.data.id;
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM news_articles').get().total, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM news_articles WHERE id=?').get(articleId).total, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM news_article_authorship WHERE article_id=?').get(articleId).total, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM news_article_products WHERE article_id=?').get(articleId).total, 1);

  const updated = await save(DB, { ...baseArticle, subtitle: 'Subtítulo atualizado', productIds: ['produto-testado'] }, 'PUT', articleId);
  assert.equal(updated.status, 200);
  assert.equal(sqlite.prepare('SELECT subtitle FROM news_articles WHERE id=?').get(articleId).subtitle, 'Subtítulo atualizado');
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM news_articles').get().total, 1);
});

test('produto relacionado inexistente responde 422 sem gravar notícia parcial', { skip: !DatabaseSync }, async () => {
  const { sqlite, DB } = buildDatabase();
  const result = await save(DB, { ...baseArticle, productIds: ['produto-removido'] });
  assert.equal(result.status, 422);
  assert.equal(result.payload.error.code, 'NEWS_RELATED_PRODUCTS_UNAVAILABLE');
  assert.equal(result.payload.success, false);
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM news_articles').get().total, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM news_article_authorship').get().total, 0);
});

function auditStatements() {
  const source = readFileSync('cloudflare-dashboard/worker.js', 'utf8');
  const statements = [];
  let index = source.indexOf('INSERT INTO admin_audit_logs(');
  while (index !== -1) {
    const end = source.indexOf('.run();', index);
    statements.push(source.slice(index, end + '.run();'.length));
    index = source.indexOf('INSERT INTO admin_audit_logs(', end);
  }
  return statements;
}

test('registro de auditoria mantém a mesma quantidade de colunas e de valores', () => {
  const statements = auditStatements();
  assert.ok(statements.length >= 2, `esperado ao menos dois INSERT de auditoria, encontrados ${statements.length}`);
  for (const statement of statements) {
    const columns = /admin_audit_logs\(([^)]*)\)/.exec(statement)[1].split(',').map((item) => item.trim());
    const valueTokens = /VALUES\(([^)]*)\)/i.exec(statement)[1].split(',').map((item) => item.trim());
    assert.equal(valueTokens.length, columns.length, `valores e colunas divergem em: ${statement.slice(0, 120)}`);
    for (const token of valueTokens) assert.ok(token === '?' || /^CURRENT_TIMESTAMP$/i.test(token), `valor inesperado: ${token}`);
  }
});

test('INSERT de auditoria executa no banco com as colunas atuais', { skip: !DatabaseSync }, () => {
  const { sqlite } = buildDatabase();
  const statements = auditStatements();
  for (const [position, statement] of auditStatements().entries()) {
    const placeholders = /VALUES\(([^)]*)\)/i.exec(statement)[1].split(',').filter((token) => token.trim() === '?').length;
    const sql = statement.slice(0, statement.indexOf('`).bind('));
    sqlite.prepare(sql).run(...Array.from({ length: placeholders }, (unused, index) => `valor-${position}-${index}`));
  }
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM admin_audit_logs').get().total, statements.length);
});

