import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ACCOUNT_REPOSITORY } from '../src/accounts/accounts.tokens.js';
import { ALLOWED_ORIGIN, createTestApp } from './create-test-app.js';

describe('Accounts API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('GET /accounts/tree', () => {
    it('returns the seeded catalog as a nested tree', async () => {
      const { status, body } = await http().get('/accounts/tree');

      expect(status).toBe(200);
      expect(body.map((node: { code: string }) => node.code)).toEqual([
        '1',
        '2',
      ]);
      expect(body[0].children[0].children[0].children).toHaveLength(2);
    });
  });

  describe('POST /accounts', () => {
    it('creates a class with its nature', async () => {
      const { status, body } = await http()
        .post('/accounts')
        .send({ code: '3', name: 'Patrimonio', nature: 'credit' });

      expect(status).toBe(201);
      expect(body).toEqual({
        code: '3',
        name: 'Patrimonio',
        nature: 'credit',
        level: 'class',
      });
    });

    it('creates a child that inherits the nature and shows up in the tree', async () => {
      const created = await http()
        .post('/accounts')
        .send({ code: '2110', name: 'Proveedores' });
      const tree = await http().get('/accounts/tree');

      expect(created.status).toBe(201);
      expect(created.body.nature).toBe('credit');
      expect(
        tree.body[1].children[0].children.map((n: { code: string }) => n.code),
      ).toContain('2110');
    });

    it('returns 409 on a duplicated code, pointing at the code field', async () => {
      const { status, body } = await http()
        .post('/accounts')
        .send({ code: '1105', name: 'Otra caja' });

      expect(status).toBe(409);
      expect(body.code).toBe('ACCOUNT_CODE_ALREADY_EXISTS');
      expect(body.errors).toEqual([
        { field: 'code', message: expect.any(String) },
      ]);
    });

    it('returns 422 when the parent does not exist', async () => {
      const { status, body } = await http()
        .post('/accounts')
        .send({ code: '3105', name: 'Capital' });

      expect(status).toBe(422);
      expect(body.code).toBe('PARENT_NOT_FOUND');
      expect(body.errors[0].field).toBe('code');
    });

    it('returns 400 when a class has no nature', async () => {
      const { status, body } = await http()
        .post('/accounts')
        .send({ code: '3', name: 'Patrimonio' });

      expect(status).toBe(400);
      expect(body.errors[0].field).toBe('nature');
    });

    it.each([
      ['letters', { code: '12a', name: 'X' }, 'code'],
      ['too long', { code: '1234567', name: 'X' }, 'code'],
      ['sql fragment', { code: "1' OR '1'='1", name: 'X' }, 'code'],
      ['numeric type', { code: 1105, name: 'X' }, 'code'],
      ['missing name', { code: '3', nature: 'debit' }, 'name'],
      ['blank name', { code: '3', name: '   ', nature: 'debit' }, 'name'],
      [
        'long name',
        { code: '3', name: 'a'.repeat(121), nature: 'debit' },
        'name',
      ],
      ['bad nature', { code: '3', name: 'X', nature: 'both' }, 'nature'],
    ])('returns 400 for invalid input (%s)', async (_label, payload, field) => {
      const { status, body } = await http().post('/accounts').send(payload);

      expect(status).toBe(400);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.errors.map((e: { field: string }) => e.field)).toContain(
        field,
      );
    });

    it('rejects unknown properties instead of ignoring them', async () => {
      const { status, body } = await http()
        .post('/accounts')
        .send({ code: '3', name: 'X', nature: 'debit', isAdmin: true });

      expect(status).toBe(400);
      expect(body.errors.map((e: { field: string }) => e.field)).toContain(
        'isAdmin',
      );
    });

    it('rejects an oversized body with 413', async () => {
      const { status, body } = await http()
        .post('/accounts')
        .send({ code: '3', name: 'x'.repeat(50_000), nature: 'debit' });

      expect(status).toBe(413);
      expect(body.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('DELETE /accounts/:code', () => {
    it('deletes a leaf account and returns 204', async () => {
      const deleted = await http().delete('/accounts/110510');
      const tree = await http().get('/accounts/tree');

      expect(deleted.status).toBe(204);
      expect(JSON.stringify(tree.body)).not.toContain('110510');
    });

    it('returns 409 when the account has children', async () => {
      const { status, body } = await http().delete('/accounts/1105');

      expect(status).toBe(409);
      expect(body.code).toBe('ACCOUNT_HAS_CHILDREN');
    });

    it('returns 404 when the account does not exist', async () => {
      const { status, body } = await http().delete('/accounts/3');

      expect(status).toBe(404);
      expect(body.code).toBe('ACCOUNT_NOT_FOUND');
    });

    it('returns 400 for a malformed code', async () => {
      const { status } = await http().delete('/accounts/abc');

      expect(status).toBe(400);
    });
  });

  describe('security', () => {
    it('sends hardening headers and hides the framework', async () => {
      const { headers } = await http().get('/accounts/tree');

      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-powered-by']).toBeUndefined();
    });

    it('allows CORS only from the configured origin', async () => {
      const allowed = await http()
        .get('/accounts/tree')
        .set('Origin', ALLOWED_ORIGIN);
      const other = await http()
        .get('/accounts/tree')
        .set('Origin', 'https://evil.example');

      expect(allowed.headers['access-control-allow-origin']).toBe(
        ALLOWED_ORIGIN,
      );
      expect(other.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('returns a generic 500 without leaking internal details', async () => {
      await app.close();
      app = await createTestApp((builder) =>
        builder.overrideProvider(ACCOUNT_REPOSITORY).useValue({
          findAll: () => Promise.reject(new Error('secret db credentials')),
        }),
      );

      const { status, body } = await http().get('/accounts/tree');

      expect(status).toBe(500);
      expect(body.code).toBe('INTERNAL_ERROR');
      expect(JSON.stringify(body)).not.toContain('secret');
    });

    it('answers 404 with the common error shape for unknown routes', async () => {
      const { status, body } = await http().get('/nope');

      expect(status).toBe(404);
      expect(body).toEqual({
        code: 'NOT_FOUND',
        message: expect.any(String),
        errors: [],
      });
    });
  });
});
