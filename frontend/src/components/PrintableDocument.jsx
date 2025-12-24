import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';

// Helper for number formatting
const formatAmount = (amount) => (amount ? amount.toFixed(2) : '0.00');

// Bulgarian number to words conversion
const numberToWordsBg = (num, currency = 'EUR') => {
  if (num === 0) return 'нула';

  // Handle negative numbers (for credit notes)
  const isNegative = num < 0;
  num = Math.abs(num);

  const ones = ['', 'един', 'два', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'];
  const onesFemale = ['', 'една', 'две', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'];
  const teens = ['десет', 'единадесет', 'дванадесет', 'тринадесет', 'четиринадесет', 'петнадесет',
                 'шестнадесет', 'седемнадесет', 'осемнадесет', 'деветнадесет'];
  const tens = ['', '', 'двадесет', 'тридесет', 'четиридесет', 'петдесет',
                'шестдесет', 'седемдесет', 'осемдесет', 'деветдесет'];
  const hundreds = ['', 'сто', 'двеста', 'триста', 'четиристотин', 'петстотин',
                    'шестстотин', 'седемстотин', 'осемстотин', 'деветстотин'];

  const convertHundreds = (n, useFemale = false) => {
    const onesArr = useFemale ? onesFemale : ones;
    if (n === 0) return '';
    if (n < 10) return onesArr[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      if (one === 0) return tens[ten];
      return tens[ten] + ' и ' + onesArr[one];
    }
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    if (rest === 0) return hundreds[hundred];
    if (rest < 10) return hundreds[hundred] + ' и ' + onesArr[rest];
    if (rest < 20) return hundreds[hundred] + ' и ' + teens[rest - 10];
    const ten = Math.floor(rest / 10);
    const one = rest % 10;
    if (one === 0) return hundreds[hundred] + ' и ' + tens[ten];
    return hundreds[hundred] + ' ' + tens[ten] + ' и ' + onesArr[one];
  };

  const convertThousands = (n, useFemale = false) => {
    if (n === 0) return '';
    if (n < 1000) return convertHundreds(n, useFemale);

    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;

    let result = '';
    if (thousands === 1) {
      result = 'хиляда';
    } else if (thousands === 2) {
      result = 'две хиляди';
    } else {
      result = convertHundreds(thousands, true) + ' хиляди';
    }

    if (rest === 0) return result;
    if (rest < 100) return result + ' и ' + convertHundreds(rest, useFemale);
    return result + ' ' + convertHundreds(rest, useFemale);
  };

  const convertMillions = (n, useFemale = false) => {
    if (n === 0) return '';
    if (n < 1000000) return convertThousands(n, useFemale);

    const millions = Math.floor(n / 1000000);
    const rest = n % 1000000;

    let result = '';
    if (millions === 1) {
      result = 'един милион';
    } else {
      result = convertHundreds(millions) + ' милиона';
    }

    if (rest === 0) return result;
    if (rest < 1000) return result + ' и ' + convertThousands(rest, useFemale);
    return result + ' ' + convertThousands(rest, useFemale);
  };

  // Split into integer and decimal parts
  const parts = num.toFixed(2).split('.');
  const intPart = parseInt(parts[0], 10);
  const decPart = parseInt(parts[1], 10);

  // Currency uses female form for BGN (лева), male for EUR
  const useFemale = currency === 'BGN';

  let result = convertMillions(intPart, useFemale);

  // Add currency and decimal part
  result += ' ' + currency;
  if (decPart > 0) {
    result += ' .' + (decPart < 10 ? '0' : '') + decPart;
  }

  // Prepend "минус" for negative numbers (credit notes)
  if (isNegative) {
    result = 'минус ' + result;
  }

  return result;
};

const PrintableDocument = React.forwardRef(({ document, isCopy = false }, ref) => {
  const { company, client, documentItems = [], bankAccount, currencyCode, totalAmountWithVat, subtotalAmount, vatAmount, issueDate, vatDate, dueDate, fullDocumentNumber, documentType, notes, documentUuid, exchangeRate, exchangeRateDate, totalAmountWithVatBaseCurrency, status } = document;

  // Check if document is cancelled
  const isCancelled = status === 'CANCELLED';

  // Get VAT rate from first item (system uses single VAT rate per document)
  const vatRate = documentItems.length > 0 ? documentItems[0].vatRate : 0;

  const zeroVatItem = documentItems.find(item => item.vatRate === 0 && item.vatExemptionReason);
  const vatExemptionReason = zeroVatItem ? zeroVatItem.vatExemptionReason : null;

  // Helper function to get Bulgarian document type label
  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'INVOICE':
        return 'ФАКТУРА';
      case 'CREDIT_NOTE':
        return 'КРЕДИТНО ИЗВЕСТИЕ';
      case 'DEBIT_NOTE':
        return 'ДЕБИТНО ИЗВЕСТИЕ';
      case 'PROFORMA':
        return 'ПРОФОРМА ФАКТУРА';
      default:
        return type;
    }
  };

  // Helper function to get Bulgarian document type prefix for number display
  const getDocumentNumberPrefix = (type) => {
    switch (type) {
      case 'INVOICE':
        return '';
      case 'CREDIT_NOTE':
        return 'КИ-';
      case 'DEBIT_NOTE':
        return 'ДИ-';
      case 'PROFORMA':
        return 'ПФ-';
      default:
        return '';
    }
  };

  // Extract the numeric part from fullDocumentNumber
  const getCleanDocumentNumber = (fullNumber, type) => {
    // Remove the English prefix (INVOICE-, CREDIT_NOTE-, DEBIT_NOTE-, PROFORMA-)
    const prefixes = ['INVOICE-', 'CREDIT_NOTE-', 'DEBIT_NOTE-', 'PROFORMA-'];
    let cleanNumber = fullNumber;
    for (const prefix of prefixes) {
      if (fullNumber.startsWith(prefix)) {
        cleanNumber = fullNumber.substring(prefix.length);
        break;
      }
    }
    return getDocumentNumberPrefix(type) + cleanNumber;
  };

  const unitMapping = {
    'C62': 'бр.',
    'KGM': 'кг',
    'LTR': 'л',
    'MTR': 'м',
    'MTK': 'м2',
    'MTQ': 'м3',
    'DAY': 'ден',
    'HUR': 'час',
    'MON': 'мес',
    'KMT': 'км',
    'GRM': 'г',
    'SET': 'компл.',
    'PK': 'опак.'
  };

  const getUnitSymbol = (code) => {
    return unitMapping[code] || code || '';
  };

  // Styles for the "Terminal/DOS" look
  const styles = {
    container: {
      p: 2, // Reduced padding
      backgroundColor: 'white',
      color: 'black',
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '12px',
      lineHeight: '1.2',
      position: 'relative',
      width: '100%',
      // minHeight removed to prevent extra blank page
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
      borderBottom: '2px solid black',
      paddingBottom: '10px',
    },
    docTitle: {
      fontSize: '14px', // Reduced from 18px
      fontWeight: 'bold',
      textTransform: 'uppercase',
      maxWidth: '200px', // Prevent overlap
      lineHeight: '1.1',
    },
    docNumber: {
      fontSize: '14px', // Reduced from 18px
      fontWeight: 'bold',
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      marginBottom: '5px',
    },
    col: {
      flex: 1,
    },
    label: {
      fontWeight: 'bold',
      marginRight: '5px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '10px',
      marginBottom: '10px',
    },
    th: {
      borderBottom: '1px solid black',
      textAlign: 'left',
      padding: '5px 2px',
      fontWeight: 'bold',
    },
    td: {
      padding: '2px 2px',
      verticalAlign: 'top',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '2px 0',
    },
    watermark: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-45deg)',
      fontSize: '80px',
      fontWeight: 'bold',
      color: 'rgba(0, 0, 0, 0.1)',
      pointerEvents: 'none',
      zIndex: 1,
      border: '5px dashed rgba(0, 0, 0, 0.1)',
      padding: '10px 40px',
    }
  };

  return (
    <Box ref={ref} sx={styles.container}>
      {/* Воден знак АНУЛИРАНА */}
      {isCancelled && (
        <Box sx={styles.watermark}>
          АНУЛИРАНА
        </Box>
      )}

      {/* Header Section */}
      <Box sx={styles.header}>
        <Box>
          <Typography sx={styles.docTitle}>
            {getDocumentTypeLabel(documentType)}
          </Typography>
          <Typography sx={{ fontSize: '10px' }}>
             {isCopy ? '( КОПИЕ )' : '( ОРИГИНАЛ )'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
             <Typography sx={styles.docNumber}>
              № {getCleanDocumentNumber(fullDocumentNumber, documentType)}
             </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Box>Дата: {new Date(issueDate).toLocaleDateString('bg-BG')}</Box>
          {vatDate && <Box>Дан. дата: {new Date(vatDate).toLocaleDateString('bg-BG')}</Box>}
        </Box>
      </Box>

      {/* Client & Supplier Info */}
      <Box sx={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Supplier (Left per standard usually, but user layout had grid items xs=6. Let's keep standard left-supplier right-client or vice-versa. 
            Previous code: Left: Client, Right: Supplier. 
            Let's stick to previous logical flow but clean text. 
        */}
         <Box sx={{ flex: 1, border: '1px solid black', padding: '10px' }}>
          <Typography sx={{ fontWeight: 'bold', borderBottom: '1px solid black', display: 'inline-block', marginBottom: '5px' }}>
            ПОЛУЧАТЕЛ
          </Typography>
          <Box>{client.name}</Box>
          {client.address && <Box>{client.address}</Box>}
          <Box>ЕИК: {client.eik || 'N/A'}</Box>
          <Box>ДДС №: {client.vatNumber || 'N/A'}</Box>
          {client.mol && <Box>МОЛ: {client.mol}</Box>}
        </Box>

        <Box sx={{ flex: 1, border: '1px solid black', padding: '10px' }}>
          <Typography sx={{ fontWeight: 'bold', borderBottom: '1px solid black', display: 'inline-block', marginBottom: '5px' }}>
            ДОСТАВЧИК
          </Typography>
          <Box>{company.name}</Box>
          {company.address && <Box>{company.address}</Box>}
          <Box>ЕИК: {company.eik || 'N/A'}</Box>
          <Box>ДДС №: {company.vatNumber || 'N/A'}</Box>
          {company.mol && <Box>МОЛ: {company.mol}</Box>}
        </Box>
      </Box>

      {/* Items Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: '5%' }}>No</th>
            <th style={{ ...styles.th, width: '45%' }}>Стока / Услуга</th>
            <th style={{ ...styles.th, textAlign: 'right', width: '10%' }}>К-во</th>
            <th style={{ ...styles.th, textAlign: 'right', width: '15%' }}>Ед.цена</th>
            <th style={{ ...styles.th, textAlign: 'right', width: '25%' }}>Сума</th>
          </tr>
        </thead>
        <tbody>
          {documentItems.map((item, index) => (
            <tr key={item.id}>
              <td style={styles.td}>{index + 1}</td>
              <td style={styles.td}>{item.itemDescription || item.effectiveItemName}</td>
              <td style={{ ...styles.td, textAlign: 'right' }}>
                {item.quantity} {getUnitSymbol(item.item?.unitOfMeasure)}
              </td>
              <td style={{ ...styles.td, textAlign: 'right' }}>
                {formatAmount(item.unitPrice)}
              </td>
              <td style={{ ...styles.td, textAlign: 'right' }}>
                {formatAmount(item.lineTotal)}
              </td>
            </tr>
          ))}
          {/* Fill empty rows if needed for look, but skipping for now to keep it standard react loop */}
        </tbody>
      </table>

      {/* Totals & Bank Info */}
      <Box sx={{ display: 'flex', marginTop: '10px', borderTop: '2px solid black', paddingTop: '10px' }}>
        <Box sx={{ flex: 1 }}>
           {/* Bank Info */}
           {bankAccount && (
            <Box>
              <Typography sx={{ fontWeight: 'bold' }}>БАНКОВА СМЕТКА:</Typography>
              <Box>Банка: {bankAccount.bankName}</Box>
              <Box>IBAN: {bankAccount.iban}</Box>
              <Box>BIC:  {bankAccount.bic}</Box>
            </Box>
          )}
          
           {/* Payment Terms */}
           <Box sx={{ marginTop: '10px' }}>
              <Box>Срок за плащане: {new Date(dueDate).toLocaleDateString('bg-BG')}</Box>
              {notes && <Box sx={{ marginTop: '5px', fontStyle: 'italic' }}>Забележка: {notes}</Box>}
              
              {vatExemptionReason && (
                <Box sx={{ marginTop: '5px' }}>
                  <Typography sx={{ fontWeight: 'bold' }}>Основание за 0% ДДС:</Typography>
                  <Box>{vatExemptionReason.reasonName} - {vatExemptionReason.legalBasis}</Box>
                </Box>
              )}
           </Box>
        </Box>

        <Box sx={{ flex: 1, paddingLeft: '20px' }}>
          <Box sx={styles.totalRow}>
            <Box>Данъчна основа:</Box>
            <Box>{formatAmount(subtotalAmount)} {currencyCode}</Box>
          </Box>
          <Box sx={styles.totalRow}>
            <Box>ДДС {vatRate}%:</Box>
            <Box>{formatAmount(vatAmount)} {currencyCode}</Box>
          </Box>
          <Box sx={{ ...styles.totalRow, fontWeight: 'bold', fontSize: '14px', borderTop: '1px dashed black', marginTop: '5px', paddingTop: '5px' }}>
            <Box>ОБЩО ЗА ПЛАЩАНЕ:</Box>
            <Box>{formatAmount(totalAmountWithVat)} {currencyCode}</Box>
          </Box>
          
           {/* Words */}
           <Box sx={{ marginTop: '10px', fontSize: '10px' }}>
             Словом: {numberToWordsBg(totalAmountWithVat || 0, currencyCode)}
           </Box>
        </Box>
      </Box>

      {/* Signatures */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
        <Box>
           <Box>Получил: ....................</Box>
           <Box sx={{ fontSize: '10px', marginLeft: '60px' }}>(подпис)</Box>
        </Box>
        <Box>
           <Box>Съставил: {company.compiledBy || '....................'}</Box>
           <Box sx={{ fontSize: '10px', marginLeft: '60px' }}>(подпис)</Box>
        </Box>
      </Box>

      {/* Footer Info */}
      <Box sx={{ 
        marginTop: 'auto', 
        paddingTop: '30px', 
        textAlign: 'center', 
        fontSize: '10px', 
        width: '100%',
      }}>
         {documentUuid && <Box>ID: {documentUuid}</Box>}
         <Box>Стр. 1 / 1</Box>
      </Box>

    </Box>
  );
});

export default PrintableDocument;
