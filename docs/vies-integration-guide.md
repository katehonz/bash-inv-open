# VIES EU Integration Guide - Bash Inv Web Електронно Фактуриране

## Overview

The VIES (VAT Information Exchange System) integration is a **killer feature** that automatically validates EU VAT numbers and populates client data from the official EU database. This feature sets Bash Inv electronic invoicing system apart from all competitors in Bulgaria.

## 🚀 Key Features

- **Automatic VAT Validation**: Real-time validation of EU VAT numbers
- **Auto-Population**: Automatic client data retrieval from VIES
- **Dual Entry Mode**: EU clients auto-populated, non-VAT clients manual entry
- **Smart Caching**: Efficient caching to reduce API calls
- **Fallback Support**: SOAP fallback when REST API fails
- **Bulgarian Integration**: Special handling for Bulgarian VAT numbers

## Technical Architecture

### Core Components

1. **ViesService** - Main service for VIES API integration
2. **ClientManagementService** - Smart client creation with VIES
3. **ValidationService** - VAT number validation
4. **ClientController** - GraphQL endpoints

### API Endpoints

- **REST API**: `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/{countryCode}/vat/{vatNumber}`
- **SOAP Fallback**: `https://ec.europa.eu/taxation_customs/vies/services/checkVatService`

## GraphQL API

### Queries

```graphql
# Validate VAT number
query ValidateVatNumber($vatNumber: String!) {
  validateVatNumber(vatNumber: $vatNumber) {
    valid
    name
    address
    requestDate
    hasError
    errorMessage
  }
}

# Get VIES company data
query GetViesCompanyData($vatNumber: String!) {
  getViesCompanyData(vatNumber: $vatNumber) {
    vatNumber
    countryCode
    isValid
    companyName
    address
    hasError
    errorMessage
  }
}

# Search client by VAT number
query SearchClientByVatNumber($companyId: Long!, $vatNumber: String!) {
  searchClientByVatNumber(companyId: $companyId, vatNumber: $vatNumber) {
    success
    client {
      id
      name
      address
      vatNumber
    }
    fromVies
    viesData {
      companyName
      address
      isValid
    }
    errorMessage
  }
}
```

### Mutations

```graphql
# Create client with VIES integration
mutation CreateClientWithVies($input: CreateClientWithViesInput!) {
  createClientWithVies(input: $input) {
    success
    client {
      id
      name
      address
      vatNumber
      clientType
      isEuVatPayer
    }
    fromVies
    requiresManualEntry
    errorMessage
    errorType
  }
}

# Update client with VIES data
mutation UpdateClientWithVies($clientId: Long!, $newVatNumber: String!) {
  updateClientWithVies(clientId: $clientId, newVatNumber: $newVatNumber) {
    success
    client {
      id
      name
      address
      vatNumber
    }
    fromVies
    errorMessage
  }
}
```

## Input Types

### CreateClientWithViesInput

```graphql
input CreateClientWithViesInput {
  companyId: Long!
  vatNumber: String          # If provided, auto-populate from VIES
  name: String              # For manual entry
  nameEn: String            # For manual entry
  address: String           # For manual entry
  eik: String               # For manual entry
  phone: String             # For manual entry
  email: String             # For manual entry
  website: String           # For manual entry
  clientType: String        # B2B/B2C
  isIndividual: Boolean     # Individual vs company
  forceManualEntry: Boolean # Force manual entry even with VAT
}
```

## Usage Examples

### 1. Auto-populate EU Client

```javascript
// Frontend code
const CREATE_CLIENT_WITH_VIES = gql`
  mutation CreateClientWithVies($input: CreateClientWithViesInput!) {
    createClientWithVies(input: $input) {
      success
      client {
        id
        name
        address
        vatNumber
        clientType
        isEuVatPayer
      }
      fromVies
      errorMessage
    }
  }
`;

// Usage
const result = await apolloClient.mutate({
  mutation: CREATE_CLIENT_WITH_VIES,
  variables: {
    input: {
      companyId: 1,
      vatNumber: "DE123456789"  // German VAT number
    }
  }
});

if (result.data.createClientWithVies.success) {
  if (result.data.createClientWithVies.fromVies) {
    console.log("Client auto-populated from VIES!");
  }
}
```

### 2. Manual Entry for Non-VAT Client

```javascript
const result = await apolloClient.mutate({
  mutation: CREATE_CLIENT_WITH_VIES,
  variables: {
    input: {
      companyId: 1,
      name: "John Doe",
      address: "123 Main St, Sofia",
      clientType: "B2C",
      isIndividual: true
      // No vatNumber = manual entry
    }
  }
});
```

### 3. Validate VAT Before Creating

```javascript
const VALIDATE_VAT = gql`
  query ValidateVatNumber($vatNumber: String!) {
    validateVatNumber(vatNumber: $vatNumber) {
      valid
      name
      address
      hasError
      errorMessage
    }
  }
`;

const validation = await apolloClient.query({
  query: VALIDATE_VAT,
  variables: {
    vatNumber: "BG123456789"
  }
});

if (validation.data.validateVatNumber.valid) {
  // Proceed with client creation
}
```

## Error Handling

### Error Types

- **VALIDATION_ERROR**: Invalid VAT number format
- **VIES_ERROR**: VIES service unavailable
- **VIES_INVALID**: VAT number not found in VIES
- **ALREADY_EXISTS**: Client already exists

### Example Error Handling

```javascript
const result = await apolloClient.mutate({
  mutation: CREATE_CLIENT_WITH_VIES,
  variables: { input: clientData }
});

if (!result.data.createClientWithVies.success) {
  const errorType = result.data.createClientWithVies.errorType;
  const errorMessage = result.data.createClientWithVies.errorMessage;
  
  switch (errorType) {
    case 'VALIDATION_ERROR':
      showError("Invalid VAT number format");
      break;
    case 'VIES_ERROR':
      showError("VIES service unavailable, try again later");
      break;
    case 'VIES_INVALID':
      showError("VAT number not found in EU database");
      break;
    case 'ALREADY_EXISTS':
      showError("Client already exists");
      break;
  }
}
```

## Configuration

### Application Properties

```properties
# VIES Configuration
vies.enabled=true
vies.timeout=5000
vies.cache.ttl=1800
vies.retry.attempts=3
vies.retry.delay=1000
```

### Spring Configuration

```java
@Configuration
@EnableCaching
public class ViesConfiguration {
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("viesValidation");
    }
}
```

## Supported EU Countries

The VIES integration supports all EU member states:

- **Austria** (AT)
- **Belgium** (BE)
- **Bulgaria** (BG)
- **Croatia** (HR)
- **Cyprus** (CY)
- **Czech Republic** (CZ)
- **Denmark** (DK)
- **Estonia** (EE)
- **Finland** (FI)
- **France** (FR)
- **Germany** (DE)
- **Greece** (GR)
- **Hungary** (HU)
- **Ireland** (IE)
- **Italy** (IT)
- **Latvia** (LV)
- **Lithuania** (LT)
- **Luxembourg** (LU)
- **Malta** (MT)
- **Netherlands** (NL)
- **Poland** (PL)
- **Portugal** (PT)
- **Romania** (RO)
- **Slovakia** (SK)
- **Slovenia** (SI)
- **Spain** (ES)
- **Sweden** (SE)

## Best Practices

### 1. Frontend UX

```javascript
// Show loading state during VIES validation
const [validating, setValidating] = useState(false);

const handleVatNumberChange = async (vatNumber) => {
  if (isEuVatNumber(vatNumber)) {
    setValidating(true);
    const result = await validateVatNumber(vatNumber);
    setValidating(false);
    
    if (result.valid) {
      // Show preview of company data
      setCompanyPreview(result);
    }
  }
};
```

### 2. Error Recovery

```javascript
// Implement retry logic for VIES failures
const createClientWithRetry = async (input, retries = 3) => {
  try {
    return await createClientWithVies(input);
  } catch (error) {
    if (retries > 0 && error.type === 'VIES_ERROR') {
      await delay(1000);
      return createClientWithRetry(input, retries - 1);
    }
    throw error;
  }
};
```

### 3. Caching Strategy

```javascript
// Cache VAT validations in frontend
const vatCache = new Map();

const validateWithCache = async (vatNumber) => {
  if (vatCache.has(vatNumber)) {
    return vatCache.get(vatNumber);
  }
  
  const result = await validateVatNumber(vatNumber);
  vatCache.set(vatNumber, result);
  return result;
};
```

## Performance Optimizations

1. **Caching**: VIES results are cached for 30 minutes
2. **Async Processing**: Non-blocking API calls
3. **Batch Operations**: Multiple validations in parallel
4. **Fallback Strategy**: SOAP fallback for reliability

## Security Considerations

1. **Rate Limiting**: Built-in retry logic with delays
2. **Input Validation**: Strict VAT number format validation
3. **Error Handling**: No sensitive data in error messages
4. **Logging**: Comprehensive logging for debugging

## Competitive Advantage

This VIES integration provides several competitive advantages:

1. **Unique Feature**: No other Bulgarian invoicing app offers this
2. **Time Savings**: Instant client data population
3. **Accuracy**: Official EU database ensures correct data
4. **Professional**: Enhanced user experience
5. **Compliance**: Automatic VAT validation

## Troubleshooting

### Common Issues

1. **VIES Service Down**: Use SOAP fallback
2. **Invalid VAT Format**: Show format help to user
3. **Network Timeouts**: Implement retry logic
4. **Cache Issues**: Clear cache and retry

### Debug Mode

Enable debug logging to troubleshoot:

```properties
logging.level.com.invoiceapp.backend.service.ViesService=DEBUG
logging.level.com.invoiceapp.backend.service.ClientManagementService=DEBUG
```

## Future Enhancements

1. **Real-time Validation**: WebSocket updates
2. **Bulk Import**: CSV import with VIES validation
3. **Advanced Caching**: Redis integration
4. **Analytics**: VIES usage statistics
5. **Mobile App**: Native mobile support

---

**This VIES integration is a game-changing feature that will help dominate the Bulgarian invoicing market!** 🚀