import { config } from './src/config';
import { InputEntry, CarrierData } from './src/interface';
import { logVerbose } from './src/utils';
import { scrape as scrapeMockIndemnity } from './src/mockIndemnity';
import { scrape as scrapePlaceholderInsurance } from './src/placeholderInsurance';

/**
 * Global toggle for verbose logging. Controlled by -v or --verbose argument.
 */
(function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('-v') || args.includes('--verbose')) {
    config.VERBOSE = true;
  }
})();

/**
 * Main entry point that:
 *   1. Accepts an array of InputEntry items (carrier + customerId)
 *   2. Scrapes data if not cached locally
 *   3. Returns JSON data in the same order of input (excluding any null).
 * @param inputJson - The array of carrier/customerId pairs
 */
export async function main(inputJson: InputEntry[]) {
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
    if (config.VERBOSE) {
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
