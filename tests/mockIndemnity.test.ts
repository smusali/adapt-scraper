import { test } from 'tap';
import { scrape } from '../src/mockIndemnity';
import * as fs from 'fs';
import * as path from 'path';

test('scrape() for a0dfjw9a in Mock Indemnity', async (t) => {
  const customerId = 'a0dfjw9a';
  const expectedFile = path.join(process.cwd(), 'tests', 'data', `${customerId}.json`);
  const expectedData = JSON.parse(fs.readFileSync(expectedFile, 'utf-8'));
  const result = await scrape(customerId);

  t.same(
    result,
    expectedData,
    'Scraped data should match the expected JSON output for a0dfjw9a'
  );
});
