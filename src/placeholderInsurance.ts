import * as cheerio from 'cheerio';
import { config } from './config';
import { logVerbose, fetchPage } from './utils';
import { Agent, Customer, Policy, CarrierData } from './interface';

type CheerioRoot = ReturnType<typeof cheerio.load>;

/**
 * Extracts and returns Agent data for the Placeholder Insurance carrier.
 */
function fetchAgent($: CheerioRoot): Agent {
  const lines = $('.agency-details .nice-formatted-kv');
  return {
    name: lines.eq(0).find('span').text().trim(),
    producerCode: lines.eq(1).find('span').text().trim(),
    agencyName: lines.eq(2).find('span').text().trim(),
    agencyCode: lines.eq(3).find('span').text().trim(),
  };
}

/**
 * Extracts and returns Customer data for the Placeholder Insurance carrier.
 */
function fetchCustomer($: CheerioRoot): Customer {
  const name = $('.customer-details label[for="name"]')
    .parent()
    .find('span')
    .text()
    .trim();

  const id = $('.customer-details div').eq(2).find('span').text().trim();
  const email = $('.customer-details label:contains("Email")')
    .next()
    .text()
    .trim();

  const lastDiv = $('.customer-details div').last().text().trim();
  const address = lastDiv.replace('Address:', '').trim();

  return { name, id, email, address };
}

/**
 * Extracts and returns all Policy data for the Placeholder Insurance carrier.
 */
function fetchPolicies($: CheerioRoot): Policy[] {
  const policies: Policy[] = [];
  $('.policy-info-row').each((_i, row) => {
    const cells = cheerio.default(row).children('td');
    const id = cells.eq(0).text().trim();
    const premiumStr = cells.eq(1).text().trim();
    const status = cells.eq(2).text().trim();
    const effectiveDate = cells.eq(3).text().trim();
    const terminationDate = cells.eq(4).text().trim();
    // Some pages may not have lastPaymentDate
    const lastPaymentDate = '';
    policies.push({
      id,
      premium: parseFloat(premiumStr) || 0,
      status,
      effectiveDate,
      terminationDate,
      lastPaymentDate,
    });
  });
  return policies;
}

/**
 * Scrapes data for a single Placeholder Insurance customer, potentially
 * paginating if multiple policy pages exist.
 * @param customerId - The customer ID to scrape
 * @returns Agent, Customer, and combined Policy data
 */
export async function scrape(customerId: string) {
  logVerbose(`[scrapePlaceholderInsurance] Scraping data for customerId: ${customerId}`);
  let page = 1;
  let allPolicies: Policy[] = [];
  let agent: Agent | null = null;
  let customer: Customer | null = null;

  while (true) {
    const url = `${config.BASE_URLS.PLACEHOLDER_CARRIER}${customerId}/policies/${page}`;
    let html: string;
    try {
      html = await fetchPage(url);
    } catch (error) {
      logVerbose(
        `[scrapePlaceholderInsurance] No more pages or error at page ${page} for customerId: ${customerId}`
      );
      break;
    }

    const $ = cheerio.load(html);
    if (!agent) {
      agent = fetchAgent($);
    }
    if (!customer) {
      customer = fetchCustomer($);
    }

    const pagePolicies = fetchPolicies($);
    if (pagePolicies.length === 0) {
      logVerbose(
        `[scrapePlaceholderInsurance] No more policies found on page ${page} for customerId: ${customerId}`
      );
      break;
    }
    allPolicies.push(...pagePolicies);
    logVerbose(
      `[scrapePlaceholderInsurance] Fetched ${pagePolicies.length} policies from page ${page} for customerId: ${customerId}`
    );

    page++;
  }

  logVerbose(
    `[scrapePlaceholderInsurance] Scraping completed for customerId: ${customerId} with total policies: ${allPolicies.length}`
  );
  return {
    agent: agent || { name: '', producerCode: '', agencyName: '', agencyCode: '' },
    customer: customer || { name: '', id: '', email: '', address: '' },
    policies: allPolicies,
  };
}
