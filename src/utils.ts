import axios, { AxiosResponse } from 'axios';
import { config } from './config';

/**
 * Helper function for conditional logging.
 */
export function logVerbose(...messages: any[]): void {
  if (config.VERBOSE) {
    console.log(...messages);
  }
}

/**
 * Fetches the HTML page content from a given URL.
 * @param url - The URL to fetch
 * @returns The raw HTML as a string
 */
export async function fetchPage(url: string): Promise<string> {
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
