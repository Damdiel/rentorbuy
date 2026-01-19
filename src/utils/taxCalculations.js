// 2024 Federal Tax Brackets
export const FEDERAL_TAX_BRACKETS = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
};

// 2024 Standard Deductions
export const STANDARD_DEDUCTION = {
  single: 14600,
  married: 29200,
};

// SALT Deduction Caps (2025+)
export const SALT_CAP_UNDER_500K = 40000; // For income under $500k
export const SALT_CAP_OVER_500K = 10000;  // For income $500k+

// Get applicable SALT cap based on income
export function getSaltCap(income) {
  return income < 500000 ? SALT_CAP_UNDER_500K : SALT_CAP_OVER_500K;
}

// State Income Tax Rates (simplified - using top marginal rates for estimation)
// Some states have flat taxes, some have graduated, some have no income tax
export const STATE_TAX_DATA = {
  AL: { name: 'Alabama', rate: 0.05, hasIncomeTax: true },
  AK: { name: 'Alaska', rate: 0, hasIncomeTax: false },
  AZ: { name: 'Arizona', rate: 0.025, hasIncomeTax: true },
  AR: { name: 'Arkansas', rate: 0.047, hasIncomeTax: true },
  CA: { name: 'California', rate: 0.1230, hasIncomeTax: true },
  CO: { name: 'Colorado', rate: 0.044, hasIncomeTax: true },
  CT: { name: 'Connecticut', rate: 0.0699, hasIncomeTax: true },
  DE: { name: 'Delaware', rate: 0.066, hasIncomeTax: true },
  FL: { name: 'Florida', rate: 0, hasIncomeTax: false },
  GA: { name: 'Georgia', rate: 0.0549, hasIncomeTax: true },
  HI: { name: 'Hawaii', rate: 0.11, hasIncomeTax: true },
  ID: { name: 'Idaho', rate: 0.058, hasIncomeTax: true },
  IL: { name: 'Illinois', rate: 0.0495, hasIncomeTax: true },
  IN: { name: 'Indiana', rate: 0.0315, hasIncomeTax: true },
  IA: { name: 'Iowa', rate: 0.057, hasIncomeTax: true },
  KS: { name: 'Kansas', rate: 0.057, hasIncomeTax: true },
  KY: { name: 'Kentucky', rate: 0.04, hasIncomeTax: true },
  LA: { name: 'Louisiana', rate: 0.0425, hasIncomeTax: true },
  ME: { name: 'Maine', rate: 0.0715, hasIncomeTax: true },
  MD: { name: 'Maryland', rate: 0.0575, hasIncomeTax: true },
  MA: { name: 'Massachusetts', rate: 0.09, hasIncomeTax: true },
  MI: { name: 'Michigan', rate: 0.0425, hasIncomeTax: true },
  MN: { name: 'Minnesota', rate: 0.0985, hasIncomeTax: true },
  MS: { name: 'Mississippi', rate: 0.05, hasIncomeTax: true },
  MO: { name: 'Missouri', rate: 0.0495, hasIncomeTax: true },
  MT: { name: 'Montana', rate: 0.059, hasIncomeTax: true },
  NE: { name: 'Nebraska', rate: 0.0584, hasIncomeTax: true },
  NV: { name: 'Nevada', rate: 0, hasIncomeTax: false },
  NH: { name: 'New Hampshire', rate: 0, hasIncomeTax: false },
  NJ: { name: 'New Jersey', rate: 0.1075, hasIncomeTax: true },
  NM: { name: 'New Mexico', rate: 0.059, hasIncomeTax: true },
  NY: { name: 'New York', rate: 0.109, hasIncomeTax: true },
  NC: { name: 'North Carolina', rate: 0.0475, hasIncomeTax: true },
  ND: { name: 'North Dakota', rate: 0.029, hasIncomeTax: true },
  OH: { name: 'Ohio', rate: 0.0399, hasIncomeTax: true },
  OK: { name: 'Oklahoma', rate: 0.0475, hasIncomeTax: true },
  OR: { name: 'Oregon', rate: 0.099, hasIncomeTax: true },
  PA: { name: 'Pennsylvania', rate: 0.0307, hasIncomeTax: true },
  RI: { name: 'Rhode Island', rate: 0.0599, hasIncomeTax: true },
  SC: { name: 'South Carolina', rate: 0.064, hasIncomeTax: true },
  SD: { name: 'South Dakota', rate: 0, hasIncomeTax: false },
  TN: { name: 'Tennessee', rate: 0, hasIncomeTax: false },
  TX: { name: 'Texas', rate: 0, hasIncomeTax: false },
  UT: { name: 'Utah', rate: 0.0465, hasIncomeTax: true },
  VT: { name: 'Vermont', rate: 0.0875, hasIncomeTax: true },
  VA: { name: 'Virginia', rate: 0.0575, hasIncomeTax: true },
  WA: { name: 'Washington', rate: 0, hasIncomeTax: false },
  WV: { name: 'West Virginia', rate: 0.055, hasIncomeTax: true },
  WI: { name: 'Wisconsin', rate: 0.0765, hasIncomeTax: true },
  WY: { name: 'Wyoming', rate: 0, hasIncomeTax: false },
  DC: { name: 'District of Columbia', rate: 0.1075, hasIncomeTax: true },
};

// Property tax rates by state (average effective rates)
export const PROPERTY_TAX_RATES = {
  AL: 0.0040, AK: 0.0119, AZ: 0.0062, AR: 0.0062, CA: 0.0071,
  CO: 0.0051, CT: 0.0214, DE: 0.0057, FL: 0.0089, GA: 0.0092,
  HI: 0.0028, ID: 0.0063, IL: 0.0227, IN: 0.0085, IA: 0.0157,
  KS: 0.0141, KY: 0.0086, LA: 0.0055, ME: 0.0136, MD: 0.0109,
  MA: 0.0123, MI: 0.0154, MN: 0.0111, MS: 0.0081, MO: 0.0097,
  MT: 0.0074, NE: 0.0173, NV: 0.0055, NH: 0.0218, NJ: 0.0247,
  NM: 0.0080, NY: 0.0172, NC: 0.0084, ND: 0.0098, OH: 0.0157,
  OK: 0.0090, OR: 0.0097, PA: 0.0153, RI: 0.0163, SC: 0.0057,
  SD: 0.0128, TN: 0.0067, TX: 0.0180, UT: 0.0058, VT: 0.0190,
  VA: 0.0082, WA: 0.0093, WV: 0.0058, WI: 0.0185, WY: 0.0057,
  DC: 0.0056,
};

// Calculate federal income tax
export function calculateFederalTax(income, filingStatus) {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  return tax;
}

// Calculate state income tax (simplified)
export function calculateStateTax(income, stateCode) {
  const stateData = STATE_TAX_DATA[stateCode];
  if (!stateData || !stateData.hasIncomeTax) return 0;
  return income * stateData.rate;
}

// Calculate property tax
export function calculatePropertyTax(homeValue, stateCode) {
  const rate = PROPERTY_TAX_RATES[stateCode] || 0.01;
  return homeValue * rate;
}

// Calculate itemized deductions benefit
export function calculateDeductionBenefit(
  mortgageInterest,
  propertyTax,
  stateIncomeTax,
  filingStatus,
  marginalRate,
  income
) {
  const standardDeduction = STANDARD_DEDUCTION[filingStatus];

  // SALT cap depends on income: $40k if under $500k, $10k if $500k+
  const saltCap = getSaltCap(income);
  const saltDeduction = Math.min(propertyTax + stateIncomeTax, saltCap);

  // Total itemized deductions
  const itemizedDeductions = mortgageInterest + saltDeduction;

  // Only beneficial if itemized exceeds standard
  const excessDeduction = Math.max(0, itemizedDeductions - standardDeduction);

  return {
    mortgageInterest,
    saltDeduction,
    saltCap,
    totalItemized: itemizedDeductions,
    standardDeduction,
    excessDeduction,
    taxSavings: excessDeduction * marginalRate,
    shouldItemize: itemizedDeductions > standardDeduction,
  };
}

// Get marginal tax rate
export function getMarginalRate(income, filingStatus) {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  for (const bracket of brackets) {
    if (income <= bracket.max) {
      return bracket.rate;
    }
  }
  return brackets[brackets.length - 1].rate;
}
