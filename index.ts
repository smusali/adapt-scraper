/**
 * This module scrapes policy, agent, and customer data for two carriers:
 *   1. MOCK_INDEMNITY
 *   2. PLACEHOLDER_CARRIER
 *
 * It fetches and parses HTML pages using Axios and Cheerio, then
 * returns the data in JSON format.
 */

import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

/**
 * Represents a single policy's key details.
 */
interface Policy {
  id: string;
  premium: number;
  status: string;
  effectiveDate: string;
  terminationDate: string;
  lastPaymentDate: string;
}

/**
 * Represents an agent's identifying information.
 */
interface Agent {
  name: string;
  producerCode: string;
  agencyName: string;
  agencyCode: string;
}

/**
 * Represents a customer's identifying information.
 */
interface Customer {
  name: string;
  id: string;
  email: string;
  address: string;
}

/**
 * Container for agent, customer, and policy data.
 */
interface CarrierData {
  agent: Agent;
  customer: Customer;
  policies: Policy[];
}

/**
 * Acceptable carrier types for input.
 */
interface InputEntry {
  carrier: 'MOCK_INDEMNITY' | 'PLACEHOLDER_CARRIER';
  customerId: string;
}

/**
 * Maps carrier short-names to their base URLs.
 */
const baseUrls: { [key: string]: string } = {
  MOCK_INDEMNITY: 'https://scraping-interview.onrender.com/mock_indemnity/',
  PLACEHOLDER_CARRIER: 'https://scraping-interview.onrender.com/placeholder_carrier/',
};

/**
 * Global toggle for verbose logging. Controlled by -v or --verbose argument.
 */
let VERBOSE = false;
(function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('-v') || args.includes('--verbose')) {
    VERBOSE = true;
  }
})();

/**
 * Helper function for conditional logging.
 */
function logVerbose(...messages: any[]): void {
  if (VERBOSE) {
    console.log(...messages);
  }
}

/**
 * Fetches the HTML page content from a given URL.
 * @param url - The URL to fetch
 * @returns The raw HTML as a string
 */
async function fetchPage(url: string) {
  logVerbose(`[fetchPage] Attempting to fetch: ${url}`);
  try {
    const response: AxiosResponse<string> = await axios.get<string>(url);
    logVerbose(`[fetchPage] Successfully fetched: ${url}`);
    return response.data;
  } catch (error) {
    logVerbose(`[fetchPage] Error fetching from ${url}`, error);
    throw error;
  }
}

/**
 * Type alias for Cheerio's root object.
 */
type CheerioRoot = ReturnType<typeof cheerio.load>;

/**
 * Extracts and returns Agent data for the Mock Indemnity carrier.
 */
function fetchAgent_Mock($: CheerioRoot): Agent {
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
function fetchCustomer_Mock($: CheerioRoot): Customer {
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
function fetchPolicies_Mock($: CheerioRoot): Policy[] {
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
 * Extracts and returns Agent data for the Placeholder Insurance carrier.
 */
function fetchAgent_Placeholder($: CheerioRoot): Agent {
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
function fetchCustomer_Placeholder($: CheerioRoot): Customer {
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
function fetchPolicies_Placeholder($: CheerioRoot): Policy[] {
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
 * Scrapes data for a single Mock Indemnity customer.
 * @param customerId - The customer ID to scrape
 * @returns Agent, Customer, and Policy data
 */
async function scrapeMockIndemnity(customerId: string) {
  logVerbose(`[scrapeMockIndemnity] Scraping data for customerId: ${customerId}`);
  try {
    const url = `${baseUrls.MOCK_INDEMNITY}${customerId}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const agent = fetchAgent_Mock($);
    const customer = fetchCustomer_Mock($);
    const policies = fetchPolicies_Mock($);
    logVerbose(`[scrapeMockIndemnity] Scraping completed for customerId: ${customerId}`);
    return { agent, customer, policies };
  } catch (error) {
    logVerbose(`[scrapeMockIndemnity] Error scraping for customerId: ${customerId}`, error);
    throw error;
  }
}

/**
 * Scrapes data for a single Placeholder Insurance customer, potentially
 * paginating if multiple policy pages exist.
 * @param customerId - The customer ID to scrape
 * @returns Agent, Customer, and combined Policy data
 */
async function scrapePlaceholderInsurance(customerId: string) {
  logVerbose(`[scrapePlaceholderInsurance] Scraping data for customerId: ${customerId}`);
  let page = 1;
  let allPolicies: Policy[] = [];
  let agent: Agent | null = null;
  let customer: Customer | null = null;

  while (true) {
    const url = `${baseUrls.PLACEHOLDER_CARRIER}${customerId}/policies/${page}`;
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
      agent = fetchAgent_Placeholder($);
    }
    if (!customer) {
      customer = fetchCustomer_Placeholder($);
    }

    const pagePolicies = fetchPolicies_Placeholder($);
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

/**
 * Main entry point that:
 *   1. Accepts an array of InputEntry items (carrier + customerId)
 *   2. Scrapes data if not cached locally
 *   3. Returns JSON data in the same order of input (excluding any null).
 * @param inputJson - The array of carrier/customerId pairs
 */
async function main(inputJson: InputEntry[]) {
  logVerbose('[main] Received input entries:', inputJson);

  // Cache structure to avoid redundant scraping
  const carrierDataMap: { [key: string]: { [custId: string]: CarrierData } } = {
    MOCK_INDEMNITY: {},
    PLACEHOLDER_CARRIER: {},
  };

  for (const entry of inputJson) {
    const { carrier, customerId } = entry;
    // If not already scraped, do so now
    if (!carrierDataMap[carrier][customerId]) {
      logVerbose(`[main] Scraping carrier: ${carrier}, customerId: ${customerId}`);
      if (carrier === 'MOCK_INDEMNITY') {
        carrierDataMap[carrier][customerId] = await scrapeMockIndemnity(customerId);
      } else if (carrier === 'PLACEHOLDER_CARRIER') {
        carrierDataMap[carrier][customerId] = await scrapePlaceholderInsurance(customerId);
      }
    }
  }

  // Construct results in same order as input
  const results = inputJson.map((entry) => {
    const data = carrierDataMap[entry.carrier][entry.customerId];
    return data || null;
  });

  // Filter out nulls and convert to pretty JSON
  const finalJson = JSON.stringify(results.filter((r) => r !== null), null, 2);
  logVerbose('[main] Final results prepared.');
  return finalJson;
}

// Self-invoking block for demonstration; keep logic unchanged
(async () => {
  try {
    logVerbose('[Demo] Starting main execution.');
    const results = await main([
      { carrier: 'MOCK_INDEMNITY', customerId: 'a0dfjw9a' },
      { carrier: 'PLACEHOLDER_CARRIER', customerId: 'f02dkl4e' },
    ]);

    // In verbose mode, print the labeled logs.
    // Otherwise, print ONLY the final JSON array per requirements.
    if (VERBOSE) {
      console.log('[Demo] Results:', results);
    } else {
      console.log(results);
    }
  } catch (error) {
    console.error('[Demo] Error in main execution:', error);
  } finally {
    logVerbose('[Demo] Done with main function execution.');
  }
})();
