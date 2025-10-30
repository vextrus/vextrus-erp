import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ApolloClient, gql, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map, catchError, of } from 'rxjs';

// Data Transfer Objects
export interface Vendor {
  id: string;
  name: string;
  tin?: string;
  bin?: string;
  address: Address;
  contact: Contact;
  bankAccounts: BankAccount[];
  status: string;
  creditLimit?: number;
  paymentTerms?: number;
}

export interface Customer {
  id: string;
  name: string;
  tin?: string;
  bin?: string;
  nid?: string;
  address: Address;
  contact: Contact;
  creditLimit?: number;
  paymentTerms?: number;
  type: string;
}

export interface Address {
  street: string;
  city: string;
  district: string;
  division: string;
  postalCode: string;
  country: string;
}

export interface Contact {
  name: string;
  phone: string;
  mobile: string;
  email: string;
  designation?: string;
}

export interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  branch: string;
  routingNumber?: string;
  swiftCode?: string;
}

export interface TINValidationResult {
  isValid: boolean;
  details?: {
    name: string;
    address: string;
    status: string;
    registrationDate?: Date;
  };
  errors?: string[];
}

export interface BINValidationResult {
  isValid: boolean;
  details?: {
    businessName: string;
    legalName: string;
    address: string;
    status: string;
    vatRegistrationDate?: Date;
  };
  errors?: string[];
}

// GraphQL Queries and Mutations
const GET_VENDOR_QUERY = gql`
  query GetVendor($id: String!) {
    vendor(id: $id) {
      id
      name
      tin
      bin
      address {
        street
        city
        district
        division
        postalCode
        country
      }
      contact {
        name
        phone
        mobile
        email
        designation
      }
      bankAccounts {
        accountNumber
        accountName
        bankName
        branch
        routingNumber
        swiftCode
      }
      status
      creditLimit
      paymentTerms
    }
  }
`;

const GET_CUSTOMER_QUERY = gql`
  query GetCustomer($id: String!) {
    customer(id: $id) {
      id
      name
      tin
      bin
      nid
      address {
        street
        city
        district
        division
        postalCode
        country
      }
      contact {
        name
        phone
        mobile
        email
      }
      creditLimit
      paymentTerms
      type
    }
  }
`;

const VALIDATE_TIN_MUTATION = gql`
  mutation ValidateTIN($tin: String!) {
    validateTIN(tin: $tin) {
      isValid
      details {
        name
        address
        status
        registrationDate
      }
      errors
    }
  }
`;

const VALIDATE_BIN_MUTATION = gql`
  mutation ValidateBIN($bin: String!) {
    validateBIN(bin: $bin) {
      isValid
      details {
        businessName
        legalName
        address
        status
        vatRegistrationDate
      }
      errors
    }
  }
`;

const SEARCH_VENDORS_QUERY = gql`
  query SearchVendors($searchTerm: String!, $limit: Int) {
    searchVendors(searchTerm: $searchTerm, limit: $limit) {
      vendors {
        id
        name
        tin
        bin
        status
      }
      totalCount
    }
  }
`;

const SEARCH_CUSTOMERS_QUERY = gql`
  query SearchCustomers($searchTerm: String!, $limit: Int) {
    searchCustomers(searchTerm: $searchTerm, limit: $limit) {
      customers {
        id
        name
        tin
        bin
        type
      }
      totalCount
    }
  }
`;

const GET_VENDORS_BATCH_QUERY = gql`
  query GetVendorsBatch($ids: [String!]!) {
    vendorsBatch(ids: $ids) {
      id
      name
      tin
      bin
      address {
        street
        city
        district
        division
        postalCode
        country
      }
      contact {
        name
        phone
        mobile
        email
        designation
      }
      bankAccounts {
        accountNumber
        accountName
        bankName
        branch
        routingNumber
        swiftCode
      }
      status
      creditLimit
      paymentTerms
    }
  }
`;

const GET_CUSTOMERS_BATCH_QUERY = gql`
  query GetCustomersBatch($ids: [String!]!) {
    customersBatch(ids: $ids) {
      id
      name
      tin
      bin
      nid
      address {
        street
        city
        district
        division
        postalCode
        country
      }
      contact {
        name
        phone
        mobile
        email
      }
      creditLimit
      paymentTerms
      type
    }
  }
`;

@Injectable()
export class MasterDataClient {
  private readonly logger = new Logger(MasterDataClient.name);
  private apolloClient: ApolloClient<NormalizedCacheObject>;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('MASTER_DATA_SERVICE_URL', 'http://localhost:3004');

    // Initialize Apollo Client for GraphQL
    this.apolloClient = new ApolloClient({
      uri: `${this.baseUrl}/graphql`,
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'network-only',
        },
        query: {
          fetchPolicy: 'network-only',
        },
      },
    });
  }

  // Vendor Operations
  async getVendor(vendorId: string): Promise<Vendor> {
    try {
      const result = await this.apolloClient.query({
        query: GET_VENDOR_QUERY,
        variables: { id: vendorId },
      });

      if (!result.data?.vendor) {
        throw new Error(`Vendor not found: ${vendorId}`);
      }

      return result.data.vendor;
    } catch (error) {
      this.logger.error(`Failed to get vendor ${vendorId}:`, error);
      throw error;
    }
  }

  async searchVendors(searchTerm: string, limit = 10): Promise<{ vendors: Vendor[]; totalCount: number }> {
    try {
      const result = await this.apolloClient.query({
        query: SEARCH_VENDORS_QUERY,
        variables: { searchTerm, limit },
      });

      return result.data.searchVendors;
    } catch (error) {
      this.logger.error(`Failed to search vendors with term ${searchTerm}:`, error);
      throw error;
    }
  }

  async getVendorByTIN(tin: string): Promise<Vendor | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/vendors/by-tin/${tin}`).pipe(
          map(response => response.data),
          catchError(error => {
            if (error.response?.status === 404) {
              return of(null);
            }
            throw error;
          }),
        ),
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get vendor by TIN ${tin}:`, error);
      throw error;
    }
  }

  // Customer Operations
  async getCustomer(customerId: string): Promise<Customer> {
    try {
      const result = await this.apolloClient.query({
        query: GET_CUSTOMER_QUERY,
        variables: { id: customerId },
      });

      if (!result.data?.customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      return result.data.customer;
    } catch (error) {
      this.logger.error(`Failed to get customer ${customerId}:`, error);
      throw error;
    }
  }

  async searchCustomers(searchTerm: string, limit = 10): Promise<{ customers: Customer[]; totalCount: number }> {
    try {
      const result = await this.apolloClient.query({
        query: SEARCH_CUSTOMERS_QUERY,
        variables: { searchTerm, limit },
      });

      return result.data.searchCustomers;
    } catch (error) {
      this.logger.error(`Failed to search customers with term ${searchTerm}:`, error);
      throw error;
    }
  }

  // Batch Operations for DataLoader
  async getVendorsBatch(vendorIds: readonly string[]): Promise<Vendor[]> {
    try {
      this.logger.debug(`Fetching ${vendorIds.length} vendors in batch`);

      const result = await this.apolloClient.query({
        query: GET_VENDORS_BATCH_QUERY,
        variables: { ids: vendorIds },
      });

      if (!result.data?.vendorsBatch) {
        this.logger.warn(`No vendors returned for batch request`);
        return [];
      }

      this.logger.debug(`Successfully fetched ${result.data.vendorsBatch.length} vendors`);
      return result.data.vendorsBatch;
    } catch (error) {
      this.logger.error(`Failed to batch fetch vendors:`, error);
      // Return empty array instead of throwing to allow DataLoader to continue
      return [];
    }
  }

  async getCustomersBatch(customerIds: readonly string[]): Promise<Customer[]> {
    try {
      this.logger.debug(`Fetching ${customerIds.length} customers in batch`);

      const result = await this.apolloClient.query({
        query: GET_CUSTOMERS_BATCH_QUERY,
        variables: { ids: customerIds },
      });

      if (!result.data?.customersBatch) {
        this.logger.warn(`No customers returned for batch request`);
        return [];
      }

      this.logger.debug(`Successfully fetched ${result.data.customersBatch.length} customers`);
      return result.data.customersBatch;
    } catch (error) {
      this.logger.error(`Failed to batch fetch customers:`, error);
      // Return empty array instead of throwing to allow DataLoader to continue
      return [];
    }
  }

  async getCustomerByTIN(tin: string): Promise<Customer | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/customers/by-tin/${tin}`).pipe(
          map(response => response.data),
          catchError(error => {
            if (error.response?.status === 404) {
              return of(null);
            }
            throw error;
          }),
        ),
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get customer by TIN ${tin}:`, error);
      throw error;
    }
  }

  // TIN/BIN Validation Operations
  async validateTIN(tin: string): Promise<TINValidationResult> {
    try {
      // Validate format first (Bangladesh TIN is 10-12 digits)
      if (!this.isValidTINFormat(tin)) {
        return {
          isValid: false,
          errors: ['Invalid TIN format. Bangladesh TIN should be 10-12 digits.'],
        };
      }

      const result = await this.apolloClient.mutate({
        mutation: VALIDATE_TIN_MUTATION,
        variables: { tin },
      });

      return result.data.validateTIN;
    } catch (error) {
      this.logger.error(`Failed to validate TIN ${tin}:`, error);
      return {
        isValid: false,
        errors: ['TIN validation service unavailable'],
      };
    }
  }

  async validateBIN(bin: string): Promise<BINValidationResult> {
    try {
      // Validate format first (Bangladesh BIN is 9 digits)
      if (!this.isValidBINFormat(bin)) {
        return {
          isValid: false,
          errors: ['Invalid BIN format. Bangladesh BIN should be 9 digits.'],
        };
      }

      const result = await this.apolloClient.mutate({
        mutation: VALIDATE_BIN_MUTATION,
        variables: { bin },
      });

      return result.data.validateBIN;
    } catch (error) {
      this.logger.error(`Failed to validate BIN ${bin}:`, error);
      return {
        isValid: false,
        errors: ['BIN validation service unavailable'],
      };
    }
  }

  // NID Validation (Bangladesh National ID)
  async validateNID(nid: string): Promise<boolean> {
    try {
      // Bangladesh NID can be 10 or 17 digits
      if (!this.isValidNIDFormat(nid)) {
        return false;
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/validation/nid`, { nid }).pipe(
          map(response => response.data.isValid),
          catchError(() => of(false)),
        ),
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to validate NID ${nid}:`, error);
      return false;
    }
  }

  // Mobile Number Validation (Bangladesh)
  async validateMobileNumber(mobile: string): Promise<boolean> {
    try {
      // Bangladesh mobile format: 01[3-9]XXXXXXXX or +8801[3-9]XXXXXXXX
      if (!this.isValidMobileFormat(mobile)) {
        return false;
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/validation/mobile`, { mobile }).pipe(
          map(response => response.data.isValid),
          catchError(() => of(false)),
        ),
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to validate mobile ${mobile}:`, error);
      return false;
    }
  }

  // Bank Account Validation
  async validateBankAccount(accountNumber: string, routingNumber: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/validation/bank-account`, {
          accountNumber,
          routingNumber,
        }).pipe(
          map(response => response.data.isValid),
          catchError(() => of(false)),
        ),
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to validate bank account ${accountNumber}:`, error);
      return false;
    }
  }

  // Format Validation Methods
  private isValidTINFormat(tin: string): boolean {
    // Bangladesh TIN: 10-12 digits
    const tinRegex = /^\d{10,12}$/;
    return tinRegex.test(tin);
  }

  private isValidBINFormat(bin: string): boolean {
    // Bangladesh BIN: 9 digits
    const binRegex = /^\d{9}$/;
    return binRegex.test(bin);
  }

  private isValidNIDFormat(nid: string): boolean {
    // Bangladesh NID: 10 or 17 digits
    const nidRegex = /^(\d{10}|\d{17})$/;
    return nidRegex.test(nid);
  }

  private isValidMobileFormat(mobile: string): boolean {
    // Bangladesh mobile: 01[3-9]XXXXXXXX or +8801[3-9]XXXXXXXX
    const mobileRegex = /^(\+?8801[3-9]\d{8}|01[3-9]\d{8})$/;
    return mobileRegex.test(mobile);
  }

  // Caching layer for frequently accessed data
  private vendorCache = new Map<string, { vendor: Vendor; timestamp: number }>();
  private customerCache = new Map<string, { customer: Customer; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getCachedVendor(vendorId: string): Promise<Vendor> {
    const cached = this.vendorCache.get(vendorId);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.vendor;
    }

    const vendor = await this.getVendor(vendorId);
    this.vendorCache.set(vendorId, { vendor, timestamp: Date.now() });

    return vendor;
  }

  async getCachedCustomer(customerId: string): Promise<Customer> {
    const cached = this.customerCache.get(customerId);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.customer;
    }

    const customer = await this.getCustomer(customerId);
    this.customerCache.set(customerId, { customer, timestamp: Date.now() });

    return customer;
  }

  // Clear cache
  clearCache(): void {
    this.vendorCache.clear();
    this.customerCache.clear();
  }
}