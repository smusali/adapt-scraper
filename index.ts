import axios from 'axios';
import * as cheerio from 'cheerio';

interface Policy {
  id: string;
  premium: number;
  status: string;
  effectiveDate: string;
  terminationDate: string;
  lastPaymentDate: string;
}

interface Agent {
  name: string;
  producerCode: string;
  agencyName: string;
  agencyCode: string;
}

interface Customer {
  name: string;
  id: string;
  email: string;
  address: string;
}

interface CarrierData {
  agent: Agent;
  customer: Customer;
  policies: Policy[];
}

// We'll pass these into main:
interface InputEntry {
  carrier: 'MOCK_INDEMNITY' | 'PLACEHOLDER_CARRIER';
  customerId: string;
}

interface CarrierDataMap {
  MOCK_INDEMNITY: CarrierData[];
  PLACEHOLDER_CARRIER: CarrierData[];
}

const baseUrls = {
  MOCK_INDEMNITY: 'https://scraping-interview.onrender.com/mock_indemnity/',
  PLACEHOLDER_CARRIER: 'https://scraping-interview.onrender.com/placeholder_carrier/',
};

async function fetchPage(url: string) {
  const response = await axios.get(url);
  return response.data;
}

type CheerioRoot = ReturnType<typeof cheerio.load>;
function fetchAgent_Mock($: CheerioRoot): Agent {
  return {
    name: $('dl .value-name').first().text().trim(),
    producerCode: $('dl .value-producerCode').text().trim(),
    agencyName: $('dl .value-agencyName').text().trim(),
    agencyCode: $('dl .value-agencyCode').text().trim(),
  };
}

function fetchCustomer_Mock($: CheerioRoot): Customer {
  return {
    name: $('dl .value-name').eq(1).text().trim(),
    id: $('dl .value-id').text().trim(),
    email: $('dl .value-email').text().trim(),
    address: $('dl .value-address').text().trim(),
  };
}

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

function fetchAgent_Placeholder($: CheerioRoot): Agent {
  const lines = $('.agency-details .nice-formatted-kv');
  return {
    name: lines.eq(0).find('span').text().trim(),
    producerCode: lines.eq(1).find('span').text().trim(),
    agencyName: lines.eq(2).find('span').text().trim(),
    agencyCode: lines.eq(3).find('span').text().trim(),
  };
}

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

function fetchPolicies_Placeholder($: CheerioRoot): Policy[] {
  const policies: Policy[] = [];
  // Each row with class .policy-info-row
  $('.policy-info-row').each((_i, row) => {
    const cells = cheerio.default(row).children('td');
    const id = cells.eq(0).text().trim();
    const premiumStr = cells.eq(1).text().trim();
    const status = cells.eq(2).text().trim();
    const effectiveDate = cells.eq(3).text().trim();
    const terminationDate = cells.eq(4).text().trim();
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

async function scrapeMockIndemnity(customerId: string) {
  const url = `${baseUrls.MOCK_INDEMNITY}${customerId}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const agent = fetchAgent_Mock($);
  const customer = fetchCustomer_Mock($);
  const policies = fetchPolicies_Mock($);
  return { agent, customer, policies };
}

async function scrapePlaceholderInsurance(customerId: string) {
  let page = 1;
  let allPolicies: Policy[] = [];

  // We'll store whichever we parse last
  let agent: Agent | null = null;
  let customer: Customer | null = null;

  while (true) {
    const url = `${baseUrls.PLACEHOLDER_CARRIER}${customerId}/policies/${page}`;
    let html: string;
    try {
      html = await fetchPage(url);
    } catch (error) {
      // If a page 404s or times out, we assume no more data
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
      // No more policies => stop
      break;
    }
    allPolicies.push(...pagePolicies);
    page++;
  }

  // Return final result
  return {
    agent: agent || { name: '', producerCode: '', agencyName: '', agencyCode: '' },
    customer: customer || { name: '', id: '', email: '', address: '' },
    policies: allPolicies,
  };
}

async function main(inputJson: InputEntry[]) {
  const carrierDataMap: { [key: string]: { [custId: string]: CarrierData } } = {
    MOCK_INDEMNITY: {},
    PLACEHOLDER_CARRIER: {},
  };

  // For each input, if not scraped yet, then scrape & store
  for (const entry of inputJson) {
    const { carrier, customerId } = entry;

    if (!carrierDataMap[carrier][customerId]) {
      if (carrier === 'MOCK_INDEMNITY') {
        const data = await scrapeMockIndemnity(customerId);
        carrierDataMap[carrier][customerId] = data;
      } else if (carrier === 'PLACEHOLDER_CARRIER') {
        const data = await scrapePlaceholderInsurance(customerId);
        carrierDataMap[carrier][customerId] = data;
      }
    }
  }

  // Now produce output in the same order as input
  const results = inputJson.map((entry) => {
    const data = carrierDataMap[entry.carrier][entry.customerId];
    return data || null;
  });

  // Return only non-null
  return JSON.stringify(
    results.filter((r) => r !== null),
    null,
    2
  );
}

(async () => {
  try {
    const results = await main([
      { carrier: 'MOCK_INDEMNITY', customerId: 'a0dfjw9a' },
      { carrier: 'PLACEHOLDER_CARRIER', customerId: 'f02dkl4e' },
    ]);

    // Should return data for both a0dfjw9a and f02dkl4e
    console.log(results);
  } catch (error) {
    console.error('Error in main execution:', error);
  }
})();
