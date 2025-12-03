
export interface GS1Element {
  ai: string;
  label: string;
  value: string;
  rawValue: string;
  isValid: boolean;
  description?: string;
}

export interface GS1ParsedData {
  success: boolean;
  type: 'GS1-DataMatrix' | 'GS1-128' | 'EAN-13' | 'UPC-A' | 'GS1-DataBar' | 'QR-Code' | 'UNKNOWN';
  elements: Record<string, GS1Element>; // Keyed by AI
  gtin?: string;
  expiryDate?: string; // ISO
  batchNumber?: string;
  serialNumber?: string;
  ndc?: string; // National Drug Code derived from GTIN
  productionDate?: string;
  netWeight?: string;
  isExpired: boolean;
  daysToExpiry?: number;
  warnings: string[];
  rawData: string;
}

interface AIRule {
  label: string;
  fixedLength?: number;
  maxLength?: number;
  type: 'date' | 'string' | 'number' | 'weight';
  decimalPos?: number;
}

/**
 * GS1 Application Identifier Dictionary
 * Comprehensive list for Pharmacy & Healthcare
 */
const AI_RULES: Record<string, AIRule> = {
  '00': { label: 'SSCC (Serial Shipping Container Code)', fixedLength: 18, type: 'string' },
  '01': { label: 'GTIN (Global Trade Item Number)', fixedLength: 14, type: 'string' },
  '02': { label: 'GTIN of Content', fixedLength: 14, type: 'string' },
  '10': { label: 'Batch/Lot Number', maxLength: 20, type: 'string' },
  '11': { label: 'Production Date (YYMMDD)', fixedLength: 6, type: 'date' },
  '12': { label: 'Due Date', fixedLength: 6, type: 'date' },
  '13': { label: 'Packaging Date', fixedLength: 6, type: 'date' },
  '15': { label: 'Best Before Date', fixedLength: 6, type: 'date' },
  '17': { label: 'Expiration Date (YYMMDD)', fixedLength: 6, type: 'date' },
  '20': { label: 'Internal Variant', fixedLength: 2, type: 'string' },
  '21': { label: 'Serial Number', maxLength: 20, type: 'string' },
  '30': { label: 'Variable Count', maxLength: 8, type: 'number' },
  '37': { label: 'Count of Items', maxLength: 8, type: 'number' },
  // 310x - Net Weight (kg) logic handled dynamically in parser, but listed for reference
  '240': { label: 'Additional Product ID', maxLength: 30, type: 'string' },
  '241': { label: 'Customer Part Number', maxLength: 30, type: 'string' },
  '250': { label: 'Secondary Serial Number', maxLength: 30, type: 'string' },
  '400': { label: 'Customer Purchase Order', maxLength: 30, type: 'string' },
  '410': { label: 'Ship To - Deliver To GLN', fixedLength: 13, type: 'string' },
  '420': { label: 'Ship To Postal Code', maxLength: 20, type: 'string' },
  '710': { label: 'NHRN (National Healthcare Reimbursement No)', maxLength: 20, type: 'string' },
  '711': { label: 'NHRN Discount', maxLength: 20, type: 'string' },
  '712': { label: 'NHRN Region', maxLength: 20, type: 'string' },
  '713': { label: 'NHRN Tax', maxLength: 20, type: 'string' },
  '7003': { label: 'Expiration Time', fixedLength: 10, type: 'date' },
  '8003': { label: 'GRAI (Global Returnable Asset Identifier)', maxLength: 30, type: 'string' },
  '8006': { label: 'ITIP (Component/Part)', fixedLength: 18, type: 'string' },
  '8010': { label: 'CPID (Component/Part Identifier)', maxLength: 30, type: 'string' },
};

/**
 * Generate rules for weight AIs (3100-3105, etc)
 */
for (let i = 0; i <= 5; i++) {
  AI_RULES[`310${i}`] = { label: 'Net Weight (kg)', fixedLength: 6, type: 'weight', decimalPos: i };
  AI_RULES[`320${i}`] = { label: 'Net Weight (lb)', fixedLength: 6, type: 'weight', decimalPos: i };
}

/**
 * Helper: Validate GTIN Check Digit
 */
export const validateGTIN = (gtin: string): boolean => {
  if (!gtin || gtin.length !== 14 || !/^\d+$/.test(gtin)) return false;
  const digits = gtin.split('').map(Number);
  const checkDigit = digits.pop()!;
  const sum = digits.reverse().reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 3 : 1), 0);
  const nearestTen = Math.ceil(sum / 10) * 10;
  return checkDigit === (nearestTen - sum);
};

/**
 * Helper: Parse GS1 Date (YYMMDD) to ISO
 */
export const parseGS1Date = (yymmdd: string): { iso: string; dateObj: Date; isExpired: boolean; isValid: boolean } => {
  if (!yymmdd || yymmdd.length < 6) return { iso: '', dateObj: new Date(), isExpired: false, isValid: false };
  
  const yy = parseInt(yymmdd.substring(0, 2));
  const mm = parseInt(yymmdd.substring(2, 4));
  const dd = parseInt(yymmdd.substring(4, 6));

  if (mm < 1 || mm > 12) return { iso: '', dateObj: new Date(), isExpired: false, isValid: false };

  // 00 day adjustment (last day of month)
  const fullYear = yy >= 50 ? 1900 + yy : 2000 + yy; // Standard 50-year pivot
  const daysInMonth = new Date(fullYear, mm, 0).getDate();
  const day = dd === 0 ? daysInMonth : dd;
  
  if (day > daysInMonth) return { iso: '', dateObj: new Date(), isExpired: false, isValid: false };

  const dateObj = new Date(fullYear, mm - 1, day);
  dateObj.setHours(23, 59, 59, 999); // Expiry is end of day

  const today = new Date();
  const iso = `${fullYear}-${String(mm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    iso,
    dateObj,
    isExpired: dateObj < today,
    isValid: true
  };
};

/**
 * Helper: Derive NDC from GTIN-14 (Hypothetical mapping)
 * Converts GTIN to potential FDA NDC formats.
 */
const deriveNDC = (gtin: string): string | undefined => {
  if (!gtin || gtin.length !== 14) return undefined;
  
  // Standard conversion: remove leading zeros and check digit to get UPC/EAN base
  // GTIN: 0 03 00456 12345 2 -> Labeler: 00456, Product: 12345
  // This is a heuristic. Real NDC lookup requires database.
  const raw = gtin.substring(2, 13);
  
  // Format 5-4-2 heuristic
  return `${raw.substring(0, 5)}-${raw.substring(5, 9)}-${raw.substring(9)}`;
};

/**
 * Main GS1 Parsing Engine
 */
export const parseBarcode = (input: string): GS1ParsedData => {
  const warnings: string[] = [];
  let rawData = input.trim();
  
  // Clean Symbology Identifiers
  if (rawData.startsWith(']d2') || rawData.startsWith(']Q3')) {
      rawData = rawData.substring(3);
  } else if (rawData.startsWith(']C1')) {
      rawData = rawData.substring(3); // GS1-128
  }

  const result: GS1ParsedData = {
    success: false,
    type: 'UNKNOWN',
    elements: {},
    isExpired: false,
    warnings: [],
    rawData: input
  };

  // 2. Handle EAN/UPC Linear Barcodes
  if (/^\d{12,13}$/.test(rawData)) {
    const padded = rawData.padStart(14, '0');
    if (validateGTIN(padded)) {
      result.type = rawData.length === 13 ? 'EAN-13' : 'UPC-A';
      result.gtin = padded;
      result.success = true;
      result.elements['01'] = {
        ai: '01',
        label: 'GTIN',
        value: padded,
        rawValue: rawData,
        isValid: true
      };
      return result;
    }
  }

  // 3. GS1 Parsing Logic
  let stream = rawData;
  let hasGTIN = false;

  // Handle human readable format with brackets (01)...
  if (stream.includes('(') && stream.includes(')')) {
    const bracketRegex = /\((\d+)\)([^(]+)/g;
    let match;
    while ((match = bracketRegex.exec(stream)) !== null) {
      const ai = match[1];
      const value = match[2];
      processAI(ai, value, result, warnings);
    }
  } else {
    // FNC1 / Raw Stream Parsing
    // Sort AIs by length descending to prevent partial matching (e.g. match 400 before 40)
    const aiKeys = Object.keys(AI_RULES).sort((a, b) => b.length - a.length);

    let loopSafety = 0;
    while (stream.length > 0 && loopSafety < 50) {
      loopSafety++;
      let aiFound = false;

      for (const ai of aiKeys) {
        if (stream.startsWith(ai)) {
          const rule = AI_RULES[ai];
          let value = '';
          let nextStream = '';

          if (rule.fixedLength) {
             if (stream.length >= ai.length + rule.fixedLength) {
               value = stream.substring(ai.length, ai.length + rule.fixedLength);
               nextStream = stream.substring(ai.length + rule.fixedLength);
             } else {
               break; // Stream too short for this fixed AI
             }
          } else if (rule.maxLength) {
             // Variable Length
             const rawVal = stream.substring(ai.length);
             const gsIndex = rawVal.indexOf(String.fromCharCode(29)); // FNC1
             
             if (gsIndex !== -1) {
                 value = rawVal.substring(0, gsIndex);
                 nextStream = rawVal.substring(gsIndex + 1);
             } else {
                 // No Separator: greedy capture up to maxLength, or end of string
                 // Note: If this is the last element, take it all.
                 // If there are more elements but no FNC1, valid GS1 requires fixed length preceding variable.
                 // If variable is last, it takes rest.
                 // However, "Greedy" parsing without FNC1 is risky. We limit to maxLength.
                 
                 if (rawVal.length <= rule.maxLength) {
                     value = rawVal;
                     nextStream = '';
                 } else {
                     // Try to match next AI? Heuristic needed here if FNC1 missing.
                     // For this engine, we assume strict GS1 compliance or end of stream.
                     value = rawVal.substring(0, rule.maxLength);
                     nextStream = rawVal.substring(rule.maxLength);
                     warnings.push(`Variable length AI (${ai}) matched max length without FNC1 separator. Check data integrity.`);
                 }
             }
          }

          if (value) {
            processAI(ai, value, result, warnings);
            stream = nextStream;
            aiFound = true;
          }
          break; // Break inner loop, match found
        }
      }

      if (!aiFound) {
         // Skip unrecognized char or terminate
         // Often garbage data follows valid data in some scans
         if (Object.keys(result.elements).length > 0) {
            warnings.push(`Unparsed trailing data: ${stream}`);
         } else {
            warnings.push(`Unknown format or AI at: ${stream.substring(0, 10)}`);
         }
         break;
      }
    }
  }

  // Post-Processing & Validation
  if (result.elements['01']) {
    result.gtin = result.elements['01'].value;
    result.ndc = deriveNDC(result.gtin);
    hasGTIN = true;
  }
  
  if (result.elements['17']) {
     const dateInfo = parseGS1Date(result.elements['17'].rawValue);
     if (dateInfo.isValid) {
        result.expiryDate = dateInfo.iso;
        result.isExpired = dateInfo.isExpired;
        
        const today = new Date();
        const diff = dateInfo.dateObj.getTime() - today.getTime();
        result.daysToExpiry = Math.ceil(diff / (1000 * 3600 * 24));
     } else {
       warnings.push('Invalid Expiry Date Format');
     }
  }

  if (result.elements['11']) {
      const d = parseGS1Date(result.elements['11'].rawValue);
      if (d.isValid) result.productionDate = d.iso;
  }

  if (result.elements['10']) result.batchNumber = result.elements['10'].value;
  if (result.elements['21']) result.serialNumber = result.elements['21'].value;

  // Determine Symbology Type
  if (hasGTIN && (result.batchNumber || result.serialNumber || result.expiryDate)) {
    // Likely DataMatrix or GS1-128
    result.type = rawData.length > 40 ? 'GS1-DataMatrix' : 'GS1-128'; 
  } else if (hasGTIN) {
     result.type = 'GS1-128'; // Fallback
  }

  // Weight Handling
  const weightAI = Object.keys(result.elements).find(k => k.startsWith('310') || k.startsWith('320'));
  if (weightAI) {
      result.netWeight = result.elements[weightAI].value;
  }

  result.success = Object.keys(result.elements).length > 0 && warnings.length === 0;
  result.warnings = warnings;

  return result;
};

/**
 * Internal Processor for a single AI match
 */
const processAI = (ai: string, value: string, result: GS1ParsedData, warnings: string[]) => {
  const rule = AI_RULES[ai];
  let isValid = true;
  let formattedValue = value;

  if (!rule) return;

  // Specific Validation
  if (ai === '01' || ai === '02') {
     isValid = validateGTIN(value);
     if (!isValid) warnings.push(`Invalid Check Digit for AI (${ai})`);
  }

  if (rule.type === 'date') {
     const d = parseGS1Date(value);
     if (!d.isValid) {
       isValid = false; 
     } else {
       formattedValue = d.iso;
     }
  }

  if (rule.type === 'weight' && rule.decimalPos !== undefined) {
      const numVal = parseInt(value);
      if (!isNaN(numVal)) {
          formattedValue = (numVal / Math.pow(10, rule.decimalPos)).toFixed(rule.decimalPos) + ' kg';
      }
  }

  result.elements[ai] = {
    ai,
    label: rule.label,
    value: formattedValue,
    rawValue: value,
    isValid
  };
};
