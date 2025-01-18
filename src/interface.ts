/**
 * Represents a single policy's key details.
 */
export interface Policy {
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
export interface Agent {
  name: string;
  producerCode: string;
  agencyName: string;
  agencyCode: string;
}

/**
 * Represents a customer's identifying information.
 */
export interface Customer {
  name: string;
  id: string;
  email: string;
  address: string;
}

/**
 * Container for agent, customer, and policy data.
 */
export interface CarrierData {
  agent: Agent;
  customer: Customer;
  policies: Policy[];
}

/**
 * Acceptable carrier types for input.
 */
export interface InputEntry {
  carrier: 'MOCK_INDEMNITY' | 'PLACEHOLDER_CARRIER';
  customerId: string;
}
