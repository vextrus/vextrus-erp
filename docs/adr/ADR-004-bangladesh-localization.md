# ADR-004: Bangladesh Localization Strategy

## Status
Accepted

## Date
2024-12-05

## Context
Vextrus ERP must be optimized for the Bangladesh market, addressing:
- Language requirements (Bengali/Bangla and English)
- Local payment systems (bKash, Nagad, Rocket)
- Regulatory compliance (NBR, RAJUK, DIFE)
- Cultural and business practices
- Infrastructure limitations (slow internet, power outages)
- Local currency and number formatting

Market research shows:
- 40% of B2B payments are digital via MFS
- bKash has 39.9% market share
- Average internet speed is 23.3 Mbps
- Fiscal year runs July-June
- Working week is Sunday-Thursday

## Decision

### Language Support

#### Implementation
```typescript
// i18n configuration
const i18nConfig = {
  locales: ['bn-BD', 'en-US'],
  defaultLocale: 'bn-BD',
  fallbackLocale: 'en-US',
  
  // Number formatting
  numberFormats: {
    'bn-BD': {
      currency: {
        style: 'currency',
        currency: 'BDT',
        notation: 'standard', // Lakh, Crore notation
      },
      decimal: {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    }
  },
  
  // Date formatting
  dateFormats: {
    'bn-BD': {
      short: 'dd/MM/yyyy',
      long: 'dd MMMM yyyy',
      fiscal: 'FY yyyy-yy' // July-June
    }
  }
};
```

#### Bengali Number System
```typescript
// Lakh/Crore formatting
function formatBDTAmount(amount: number): string {
  if (amount >= 10000000) {
    return `৳ ${(amount / 10000000).toFixed(2)} কোটি`;
  } else if (amount >= 100000) {
    return `৳ ${(amount / 100000).toFixed(2)} লক্ষ`;
  }
  return `৳ ${amount.toLocaleString('bn-BD')}`;
}
```

### Payment Integration

#### Mobile Financial Services (MFS)
```typescript
interface PaymentGateway {
  bKash: {
    apiUrl: 'https://checkout.pay.bka.sh/v1.2.0-beta',
    merchantId: string,
    appKey: string,
    appSecret: string,
  },
  nagad: {
    apiUrl: 'https://api.mynagad.com',
    merchantId: string,
    publicKey: string,
    privateKey: string,
  },
  rocket: {
    apiUrl: 'https://api.dutchbanglabank.com/rocket',
    merchantCode: string,
    accessToken: string,
  }
}
```

### Regulatory Compliance

#### NBR Tax Integration
```typescript
class NBRComplianceService {
  // VAT Calculation (15% standard rate)
  calculateVAT(amount: number, category: string): TaxBreakdown {
    const vatRates = {
      standard: 0.15,
      construction: 0.15,
      consultancy: 0.10,
      exempted: 0
    };
    
    return {
      baseAmount: amount,
      vatRate: vatRates[category],
      vatAmount: amount * vatRates[category],
      totalAmount: amount * (1 + vatRates[category]),
      mushak: this.generateMushak() // VAT invoice
    };
  }
  
  // AIT (Advance Income Tax)
  calculateAIT(payment: Payment): AITCertificate {
    const aitRates = {
      contractor: 0.07,
      consultant: 0.10,
      supplier: 0.05,
      transport: 0.03
    };
    
    return {
      rate: aitRates[payment.type],
      amount: payment.amount * aitRates[payment.type],
      certificateNumber: this.generateAITNumber(),
      eFiling: true
    };
  }
}
```

#### RAJUK Integration
```typescript
interface RAJUKIntegration {
  ecps: {
    apiUrl: 'https://rajuk.ecps.gov.bd/api/v1',
    services: [
      'building_permit',
      'land_use_clearance',
      'completion_certificate',
      'occupancy_certificate'
    ],
    compliance: ['DAP 2022-2035', 'BNBC 2020']
  }
}
```

### Infrastructure Optimization

#### Offline-First Architecture
```typescript
// PWA configuration for field workers
const offlineStrategy = {
  cacheFirst: [
    '/api/projects/active',
    '/api/tasks/assigned',
    '/api/resources/inventory'
  ],
  
  backgroundSync: {
    queue: 'vextrus-sync',
    options: {
      maxRetentionTime: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  dataCompression: {
    images: 'webp',
    api: 'gzip',
    threshold: 1024 // bytes
  }
};
```

### Business Calendar

```typescript
class BangladeshCalendar {
  // Bangladesh working week: Sunday-Thursday
  isWorkingDay(date: Date): boolean {
    const day = date.getDay();
    return day >= 0 && day <= 4; // Sunday = 0, Thursday = 4
  }
  
  // Public holidays
  getPublicHolidays(year: number): Holiday[] {
    return [
      { date: '21-02', name: 'শহীদ দিবস', type: 'national' },
      { date: '26-03', name: 'স্বাধীনতা দিবস', type: 'national' },
      { date: '14-04', name: 'পহেলা বৈশাখ', type: 'cultural' },
      { date: '01-05', name: 'মে দিবস', type: 'international' },
      { date: '15-08', name: 'জাতীয় শোক দিবস', type: 'national' },
      { date: '16-12', name: 'বিজয় দিবস', type: 'national' },
      // Islamic holidays (lunar calendar - dynamic)
      ...this.getIslamicHolidays(year)
    ];
  }
  
  // Fiscal year (July-June)
  getFiscalYear(date: Date): string {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    if (month >= 6) { // July onwards
      return `FY ${year}-${(year + 1) % 100}`;
    } else {
      return `FY ${year - 1}-${year % 100}`;
    }
  }
}
```

## Rationale

### Why Bengali as Primary Language?
- National language of Bangladesh
- Required for government contracts
- Increases adoption among local workers
- Competitive differentiation

### Why Multiple Payment Gateways?
- bKash has 60+ million users
- Different preferences by region/demographic
- Redundancy for payment processing
- B2B adoption increasing rapidly

### Why Offline-First?
- Frequent connectivity issues at construction sites
- Power outages common
- Field workers need uninterrupted access
- Reduces server load and costs

## Consequences

### Positive
- Market differentiation from international competitors
- Higher adoption rate among local businesses
- Compliance with local regulations built-in
- Better user experience for Bangladesh users

### Negative
- Additional complexity in codebase
- Need for Bengali language translators
- Multiple payment gateway maintenance
- Testing complexity for localization

### Mitigation
- Use i18n libraries (next-intl)
- Hire local QA team for language verification
- Payment gateway abstraction layer
- Automated localization testing

## Alternatives Considered

1. **English-Only Interface**:
   - Rejected: Limits market penetration
   
2. **Single Payment Gateway**:
   - Rejected: Too limiting for B2B transactions

3. **Cloud-Only Architecture**:
   - Rejected: Not suitable for Bangladesh infrastructure

## References
- [Bangladesh Digital Payment Statistics 2024](https://example.com)
- [NBR VAT Guidelines](https://nbr.gov.bd)
- [RAJUK ECPS API Documentation](https://rajuk.gov.bd/ecps)