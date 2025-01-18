import * as cheerio from 'cheerio';
import { config } from './config';
import { logVerbose, fetchPage } from './utils';
import { Agent, Customer, Policy, CarrierData } from './interface';

type CheerioRoot = ReturnType<typeof cheerio.load>;

/**
 * Extracts and returns Agent data for the Mock Indemnity carrier.
 */
function fetchAgent($: CheerioRoot): Agent {
  // Briefly parse relevant fields from the HTML
  return {
    name: $('dl .value-name').first().text().trim(),
    producerCode: $('dl .value-producerCode').text().trim(),
    agencyName: $('dl .value-agencyName').text().trim(),
    agencyCode: $('dl .value-agencyCode').text().trim(),
  };
}

/**
 * Extracts and returns Customer data for the Mock Indemnity carrier.
 */
function fetchCustomer($: CheerioRoot): Customer {
  // Use .eq(...) to grab the second occurrence for name
  return {
    name: $('dl .value-name').eq(1).text().trim(),
    id: $('dl .value-id').text().trim(),
    email: $('dl .value-email').text().trim(),
    address: $('dl .value-address').text().trim(),
  };
}

/**
 * Extracts and returns all Policy data for the Mock Indemnity carrier.
 */
function fetchPolicies($: CheerioRoot): Policy[] {
  const policies: Policy[] = [];
  $('#policy-list li').each((_i, el) => {
    const row = cheerio.default(el);
    policies.push({
      id: row.find('.id').text().trim(),
      premium: parseFloat(row.find('.premium').text().trim()) || 0,
      status: row.find('.status').text().trim(),
      effectiveDate: row.find('.effectiveDate').text().trim(),
      terminationDate: row.find('.terminationDate').text().trim(),
      lastPaymentDate: row.find('.lastPaymentDate').text().trim(),
    });
  });
  return policies;
}

/**
 * Scrapes data for a single Mock Indemnity customer.
 * @param customerId - The customer ID to scrape
 * @returns Agent, Customer, and Policy data
 */
export async function scrape(customerId: string) {
  logVerbose(`[scrapeMockIndemnity] Scraping data for customerId: ${customerId}`);
  try {
    const url = `${config.BASE_URLS.MOCK_INDEMNITY}${customerId}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const agent = fetchAgent($);
    const customer = fetchCustomer($);
    const policies = fetchPolicies($);
    logVerbose(`[scrapeMockIndemnity] Scraping completed for customerId: ${customerId}`);
    return { agent, customer, policies };
  } catch (error) {
    logVerbose(`[scrapeMockIndemnity] Error scraping for customerId: ${customerId}`, error);
    throw error;
  }
}
