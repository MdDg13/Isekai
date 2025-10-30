import { test, expect } from '@playwright/test';

test('e2e connectivity via bypass token', async ({ request, baseURL }) => {
  const token = process.env.E2E_BYPASS_TOKEN || '';
  expect(token, 'E2E_BYPASS_TOKEN must be set for this test').not.toEqual('');

  const res = await request.get(`${baseURL}/api/e2e-check`, {
    headers: { 'x-bypass-token': token },
  });

  // Break early with diagnosis on failures
  if (res.status() !== 200) {
    const body = await res.text();
    throw new Error(`E2E check failed: HTTP ${res.status()} — ${body}`);
  }

  const json = await res.json();
  expect(json.ok).toBeTruthy();
  expect(json.campaignId).toBeTruthy();
  expect(json.entityId).toBeTruthy();
});


