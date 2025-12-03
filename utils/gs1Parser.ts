
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
  type: 'GS1-DataMatrix' | 'GS1-128' | 'EAN-13' | 'UPC-A' | 'UNKNOWN';
  elements: Record<string, GS1Element>; // Keyed by AI
  gtin?: string;
  expiryDate?: string; // ISO
  batchNumber?: string;
  serialNumber?: string;
  ndc?: string; // National Drug Code derived from GTIN
  isExpired: boolean;
  daysToExpiry?: number;
  warnings: string[];
  rawData: string;
}

/**
 * GS1 Application Identifier Dictionary
 * Defines length rules for parsing raw streams.
 */
const AI_RULES: Record<string, { label: string; fixedLength?: number; maxLength?: number; type: 'date' | 'string' | 'number' }> = {
  '00': { label: 'SSCC', fixedLength: 18, type: 'string' },
  '01': { label: 'GTIN', fixedLength: 14, type: 'string' },
  '02': { label: 'GTIN of Content', fixedLength: 14, type: 'string' },
  '10': { label: 'Batch/Lot', maxLength: 20, type: 'string' },
  '11': { label: 'Prod. Date', fixedLength: 6, type: 'date' },
  '12': { label: 'Due Date', fixedLength: 6, type: 'date' },
  '13': { label: 'Pack Date', fixedLength: 6, type: 'date' },
  '15': { label: 'Best Before', fixedLength: 6, type: 'date' },
  '17': { label: 'Expiration', fixedLength: 6, type: 'date' },
  '20': { label: 'Variant', fixedLength: 2, type: 'string' },
  '21': { label: 'Serial No', maxLength: 20, type: 'string' },
  '30': { label: 'Count', maxLength: 8, type: 'number' },
  '37': { label: 'Count', maxLength: 8, type: 'number' },
  '240': { label: 'Addl. Prod ID', maxLength: 30, type: 'string' },
  '241': { label: 'Cust. Part No', maxLength: 30, type: 'string' },
  '250': { label: 'Secondary Serial', maxLength: 30, type: 'string' },
  '400': { label: 'Customer PO', maxLength: 30, type: 'string' },
  '410': { label: 'Ship to GLN', fixedLength: 13, type: 'string' },
  '420': { label: 'Ship to Post', maxLength: 20, type: 'string' },
  '7003': { label: 'Expiry Time', fixedLength: 10, type: 'date' },
  '8003': { label: 'GRAI', maxLength: 30, type: 'string' },
  '703': { label: 'Proc. Date', fixedLength: 10, type: 'date' }, // Processor approval
};

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
export const parseGS1Date = (yymmdd: string): { iso: string; dateObj: Date; isExpired: boolean } | null => {
  if (!yymmdd || yymmdd.length < 6) return null;
  
  const yy = parseInt(yymmdd.substring(0, 2));
  const mm = parseInt(yymmdd.substring(2, 4));
  const dd = parseInt(yymmdd.substring(4, 6));

  // 00 day adjustment (last day of month)
  const day = dd === 0 ? new Date(2000 + yy, mm, 0).getDate() : dd;
  
  // Pivot year logic (assume 2000s for pharmacy context)
  const fullYear = yy > 70 ? 1900 + yy : 2000 + yy; 

  const dateObj = new Date(fullYear, mm - 1, day);
  dateObj.setHours(23, 59, 59, 999); // Expiry is end of day

  const today = new Date();
  const iso = `${fullYear}-${String(mm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    iso,
    dateObj,
    isExpired: dateObj < today
  };
};

/**
 * Helper: Derive NDC from GTIN-14 (Hypothetical mapping)
 * Real mapping requires an FDA database lookup. 
 * We convert GTIN to UPC-12 equivalents which often contain Labeler-Product codes.
 */
const deriveNDC = (gtin: string): string | undefined => {
  // If GTIN starts with '0003' or similar US prefixes, extract middle
  if (!gtin) return undefined;
  // This is a naive heuristic for display purposes
  const core = gtin.substring(2, 13); // Drop leading 0, check digit
  if (core.length === 11) {
    // Format 5-4-2 or 5-3-3 etc. We'll default to 5-4-2
    return `${core.substring(0, 5)}-${core.substring(5, 9)}-${core.substring(9)}`;
  }
  return undefined;
};

/**
 * Main GS1 Parsing Engine
 */
export const parseBarcode = (input: string): GS1ParsedData => {
  const warnings: string[] = [];
  let rawData = input.trim();
  
  // 1. Remove Symbology Identifier (e.g. ]d2)
  if (rawData.startsWith(']d2')) {
      rawData = rawData.substring(3);
  } else if (rawData.startsWith(']C1')) {
      rawData = rawData.substring(3);
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
    // Handle Raw Stream (FNC1 or Fixed Length logic)
    // Replace non-printable group separators (\x1D) with a placeholder if needed, 
    // or rely on parsing logic.
    
    while (stream.length > 0) {
      let aiFound = false;

      // Iterate through AI dictionary to find match
      // We sort keys by length desc to match '400' before '40'
      const aiKeys = Object.keys(AI_RULES).sort((a, b) => b.length - a.length);

      for (const ai of aiKeys) {
        if (stream.startsWith(ai)) {
          const rule = AI_RULES[ai];
          let value = '';
          let nextStream = '';

          // Determine Value Length
          if (rule.fixedLength) {
             // Fixed
             if (stream.length >= ai.length + rule.fixedLength) {
               value = stream.substring(ai.length, ai.length + rule.fixedLength);
               nextStream = stream.substring(ai.length + rule.fixedLength);
             } else {
               // Stream too short
               break; 
             }
          } else if (rule.maxLength) {
             // Variable - Read until End, FNC1 (ASCII 29), or heuristic
             const rawVal = stream.substring(ai.length);
             // Split by Group Separator
             const parts = rawVal.split(String.fromCharCode(29));
             value = parts[0];
             
             // If no GS, we have a problem. "Greedy" parsing is dangerous.
             // We'll assume strict GS usage OR look-ahead for other common fixed AIs 
             // like 17, 11 if the value looks numeric and valid.
             if (parts.length === 1 && rawVal.length > rule.maxLength) {
                 // Try to split at max length if longer
                 value = rawVal.substring(0, rule.maxLength);
                 nextStream = rawVal.substring(rule.maxLength);
             } else if (parts.length > 1) {
                 // GS found
                 nextStream = parts.slice(1).join(String.fromCharCode(29));
                 // Also handle nextStream sometimes having the AI immediately
             } else {
                 // Consume rest of string
                 value = rawVal;
                 nextStream = '';
             }

             // Heuristic: If value contains another known AI start that makes sense?
             // Skipping advanced heuristic for now to prioritize valid FNC1 streams
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
         // Could not parse remainder
         warnings.push(`Unparsed data segment: ${stream.substring(0, 10)}...`);
         break;
      }
    }
  }

  // Final Validation
  if (result.elements['01']) {
    result.gtin = result.elements['01'].value;
    result.ndc = deriveNDC(result.gtin);
    hasGTIN = true;
  }
  
  if (result.elements['17']) {
     const dateInfo = parseGS1Date(result.elements['17'].value);
     if (dateInfo) {
        result.expiryDate = dateInfo.iso;
        result.isExpired = dateInfo.isExpired;
        
        const today = new Date();
        const diff = dateInfo.dateObj.getTime() - today.getTime();
        result.daysToExpiry = Math.ceil(diff / (1000 * 3600 * 24));
     }
  }

  if (result.elements['10']) result.batchNumber = result.elements['10'].value;
  if (result.elements['21']) result.serialNumber = result.elements['21'].value;

  // Type Detection
  if (hasGTIN && (result.batchNumber || result.serialNumber || result.expiryDate)) {
    result.type = 'GS1-DataMatrix'; // Assumed 2D for rich data
  } else if (hasGTIN) {
    result.type = 'GS1-128'; 
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

  // Specific Validation Rules
  if (ai === '01') {
     isValid = validateGTIN(value);
     if (!isValid) warnings.push('Invalid GTIN Check Digit');
  }

  if (rule.type === 'date') {
     const d = parseGS1Date(value);
     if (!d) {
       isValid = false; 
       warnings.push(`Invalid Date for AI (${ai})`);
     } else {
       formattedValue = d.iso;
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
