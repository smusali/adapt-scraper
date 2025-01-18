import { test } from 'tap';
import { scrape } from '../src/placeholderInsurance';
import * as fs from 'fs';
import * as path from 'path';

test('scrape() for f02dkl4e in Placeholder Insurance', async (t) => {
  const customerId = 'f02dkl4e';
  const expectedFile = path.join(process.cwd(), 'tests', 'data', `${customerId}.json`);
  const expectedData = JSON.parse(fs.readFileSync(expectedFile, 'utf-8'));
  const result = await scrape(customerId);

  t.same(
    result,
    expectedData,
    'Scraped data should match the expected JSON output for f02dkl4e'
  );
});
