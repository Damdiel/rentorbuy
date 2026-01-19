// PMI rates based on down payment percentage and credit score (using average)
// PMI is typically required when down payment is less than 20%
export const PMI_RATE = 0.005; // 0.5% annual rate (average)

// Average cost of one mortgage point (1% of loan amount, reduces rate by ~0.25%)
export const POINT_COST_PERCENT = 0.01;
export const POINT_RATE_REDUCTION = 0.0025;

// Average home insurance rate (percentage of home value)
export const AVG_HOME_INSURANCE_RATE = 0.0035; // ~$1,750 on $500k home

// Average HOA (monthly)
export const AVG_HOA_MONTHLY = 250;

// Average S&P 500 annual return (historical)
export const SP500_AVG_RETURN = 0.10;

// Calculate monthly mortgage payment (principal + interest)
export function calculateMonthlyPayment(principal, annualRate, years) {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;

  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return payment;
}

// Calculate PMI (if applicable)
export function calculateMonthlyPMI(loanAmount, homeValue, includePMI) {
  if (!includePMI) return 0;

  const ltv = loanAmount / homeValue;
  if (ltv <= 0.8) return 0; // No PMI if 20%+ down payment

  return (loanAmount * PMI_RATE) / 12;
}

// Calculate the cost of points and adjusted rate
export function calculatePointsEffect(loanAmount, baseRate, numPoints) {
  const pointsCost = loanAmount * POINT_COST_PERCENT * numPoints;
  const adjustedRate = Math.max(0, baseRate - POINT_RATE_REDUCTION * numPoints);

  return {
    pointsCost,
    adjustedRate,
    rateReduction: POINT_RATE_REDUCTION * numPoints,
  };
}

// Generate amortization schedule with optional extra payments
export function generateAmortizationSchedule(principal, annualRate, years, extraMonthlyPayment = 0) {
  const monthlyRate = annualRate / 12;
  const baseMonthlyPayment = calculateMonthlyPayment(principal, annualRate, years);

  const schedule = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPrincipal = 0;
  let month = 0;

  while (balance > 0.01) { // Use small threshold to handle floating point
    month++;
    const interestPayment = balance * monthlyRate;

    // Calculate principal payment (base + extra, but not more than remaining balance)
    let principalPayment = baseMonthlyPayment - interestPayment + extraMonthlyPayment;
    principalPayment = Math.min(principalPayment, balance); // Don't overpay

    const totalPayment = interestPayment + principalPayment;

    totalInterest += interestPayment;
    totalPrincipal += principalPayment;
    balance -= principalPayment;

    schedule.push({
      month,
      payment: totalPayment,
      principal: principalPayment,
      interest: interestPayment,
      extraPayment: extraMonthlyPayment > 0 ? Math.min(extraMonthlyPayment, principalPayment - (baseMonthlyPayment - interestPayment)) : 0,
      totalInterest,
      totalPrincipal,
      balance: Math.max(0, balance),
    });

    // Safety check - don't exceed reasonable loan term
    if (month > years * 12 * 2) break;
  }

  return schedule;
}

// Get annual summary from amortization schedule
export function getAnnualSummary(schedule, maxYears = 30) {
  const annualSummary = [];
  const totalMonths = schedule.length;
  const payoffMonth = schedule.length;
  const payoffYear = Math.ceil(payoffMonth / 12);

  for (let year = 1; year <= maxYears; year++) {
    const startMonth = (year - 1) * 12;
    const endMonth = Math.min(year * 12, totalMonths);

    if (startMonth >= totalMonths) {
      // Mortgage is paid off, add zero entries
      annualSummary.push({
        year,
        interest: 0,
        principal: 0,
        totalPayment: 0,
        endBalance: 0,
        isPaidOff: true,
      });
      continue;
    }

    const yearPayments = schedule.slice(startMonth, endMonth);
    const yearInterest = yearPayments.reduce((sum, p) => sum + p.interest, 0);
    const yearPrincipal = yearPayments.reduce((sum, p) => sum + p.principal, 0);
    const endBalance = yearPayments[yearPayments.length - 1]?.balance || 0;

    annualSummary.push({
      year,
      interest: yearInterest,
      principal: yearPrincipal,
      totalPayment: yearInterest + yearPrincipal,
      endBalance,
      isPaidOff: endBalance === 0,
    });
  }

  return { annualSummary, payoffMonth, payoffYear };
}

// Calculate when PMI drops off (when LTV reaches 80%)
export function calculatePMIDropoffMonth(schedule, homeValue) {
  const targetBalance = homeValue * 0.8;

  for (const payment of schedule) {
    if (payment.balance <= targetBalance) {
      return payment.month;
    }
  }

  return null;
}

// Calculate total cost of buying over N years
export function calculateBuyingCosts(params) {
  const {
    homePrice,
    downPayment,
    mortgageRate,
    loanTermYears,
    extraMonthlyPayment = 0,
    includePMI,
    buyingPoints,
    numPoints,
    propertyTaxRate,
    homeInsurance,
    hoaMonthly,
    maintenanceRate = 0.01,
    homeAppreciationRate = 0.03,
    sellingCostRate = 0.06,
    yearsToAnalyze,
    // Tax parameters for yearly deduction calculation
    taxableIncome,
    filingStatus,
    stateCode,
    calculateDeductionBenefit, // Function passed from tax utils
    getMarginalRate, // Function passed from tax utils
    calculateStateTax, // Function passed from tax utils
    // Renting costs for comparison (to invest savings when buying is cheaper)
    monthlyRent,
    annualRentIncrease = 0.04,
    rentersInsurance = 200,
    investmentReturn = SP500_AVG_RETURN,
  } = params;

  const loanAmount = homePrice - downPayment;

  // Apply points if buying them
  let effectiveRate = mortgageRate;
  let pointsCost = 0;
  if (buyingPoints && numPoints > 0) {
    const pointsEffect = calculatePointsEffect(loanAmount, mortgageRate, numPoints);
    effectiveRate = pointsEffect.adjustedRate;
    pointsCost = pointsEffect.pointsCost;
  }

  const baseMonthlyMortgage = calculateMonthlyPayment(loanAmount, effectiveRate, loanTermYears);
  const schedule = generateAmortizationSchedule(loanAmount, effectiveRate, loanTermYears, extraMonthlyPayment);
  const { annualSummary, payoffMonth, payoffYear } = getAnnualSummary(schedule, yearsToAnalyze);

  // Calculate PMI dropoff based on actual schedule with extra payments
  const pmiDropoffMonth = includePMI ? calculatePMIDropoffMonth(schedule, homePrice) : 0;

  const yearlyBreakdown = [];
  let totalCost = downPayment + pointsCost; // Upfront costs
  let totalEquity = downPayment;
  let totalTaxSavings = 0;
  let savingsInvestmentBalance = 0; // Investment from savings when buying is cheaper

  // Get marginal rate and state tax for deduction calculations
  const marginalRate = getMarginalRate ? getMarginalRate(taxableIncome, filingStatus) : 0.24;
  const stateIncomeTax = calculateStateTax ? calculateStateTax(taxableIncome, stateCode) : 0;

  for (let year = 1; year <= yearsToAnalyze; year++) {
    const yearData = annualSummary[year - 1] || { interest: 0, principal: 0, endBalance: 0, isPaidOff: true };

    // Calculate home value with appreciation
    const homeValueThisYear = homePrice * Math.pow(1 + homeAppreciationRate, year);

    // Property tax based on appreciated value
    const propertyTax = homeValueThisYear * propertyTaxRate;

    // PMI (check if still applicable)
    let pmiCost = 0;
    if (includePMI && !yearData.isPaidOff) {
      const startMonth = (year - 1) * 12 + 1;
      const endMonth = Math.min(year * 12, schedule.length);
      for (let m = startMonth; m <= endMonth; m++) {
        if (pmiDropoffMonth && m >= pmiDropoffMonth) break;
        // Calculate PMI based on current balance
        const monthData = schedule[m - 1];
        if (monthData && monthData.balance > homePrice * 0.8) {
          pmiCost += (monthData.balance * PMI_RATE) / 12;
        }
      }
    }

    // Other costs
    const insurance = homeInsurance || homeValueThisYear * AVG_HOME_INSURANCE_RATE;
    const hoa = hoaMonthly * 12;
    const maintenance = homeValueThisYear * maintenanceRate;

    // Calculate tax benefit for THIS year (only if mortgage has interest)
    let taxBenefit = 0;
    let deductionInfo = null;
    if (calculateDeductionBenefit && yearData.interest > 0) {
      deductionInfo = calculateDeductionBenefit(
        yearData.interest,
        propertyTax,
        stateIncomeTax,
        filingStatus,
        marginalRate,
        taxableIncome
      );
      // Only count benefit if itemizing is better than standard deduction
      if (deductionInfo.shouldItemize) {
        taxBenefit = deductionInfo.taxSavings;
      }
    }
    totalTaxSavings += taxBenefit;

    // Total yearly cost (before tax benefit)
    const yearCostBeforeTax =
      yearData.interest +
      yearData.principal +
      propertyTax +
      pmiCost +
      insurance +
      hoa +
      maintenance;

    // Net cost after tax benefit
    const yearCostAfterTax = yearCostBeforeTax - taxBenefit;

    totalCost += yearCostAfterTax;

    // Calculate what renting would cost this year (for savings comparison)
    const rentThisYear = monthlyRent
      ? monthlyRent * 12 * Math.pow(1 + annualRentIncrease, year - 1) + rentersInsurance
      : 0;

    // If buying is cheaper than renting, invest the difference
    // First, grow existing savings investment
    savingsInvestmentBalance *= (1 + investmentReturn);

    // Then add this year's savings (if buying is cheaper)
    const savingsVsRent = Math.max(0, rentThisYear - yearCostAfterTax);
    savingsInvestmentBalance += savingsVsRent;

    // Equity = home value - remaining mortgage
    const remainingMortgage = yearData.endBalance;
    totalEquity = homeValueThisYear - remainingMortgage;

    yearlyBreakdown.push({
      year,
      mortgagePayment: yearData.interest + yearData.principal,
      principal: yearData.principal,
      interest: yearData.interest,
      propertyTax,
      pmi: pmiCost,
      insurance,
      hoa,
      maintenance,
      taxBenefit,
      shouldItemize: deductionInfo?.shouldItemize || false,
      totalCostBeforeTax: yearCostBeforeTax,
      totalCost: yearCostAfterTax,
      cumulativeCost: totalCost,
      homeValue: homeValueThisYear,
      remainingMortgage,
      equity: totalEquity,
      isPaidOff: yearData.isPaidOff,
      rentComparison: rentThisYear,
      savingsVsRent,
      savingsInvestmentBalance,
    });
  }

  // Calculate net position if selling at end of period
  const finalHomeValue = homePrice * Math.pow(1 + homeAppreciationRate, yearsToAnalyze);
  const sellingCosts = finalHomeValue * sellingCostRate;
  const netFromSale = totalEquity - sellingCosts + savingsInvestmentBalance;

  return {
    yearlyBreakdown,
    totalCost,
    totalEquity,
    totalTaxSavings,
    finalHomeValue,
    sellingCosts,
    netFromSale,
    savingsInvestmentBalance,
    pointsCost,
    effectiveRate,
    monthlyMortgage: baseMonthlyMortgage,
    totalMonthlyWithExtra: baseMonthlyMortgage + extraMonthlyPayment,
    pmiDropoffMonth,
    payoffMonth,
    payoffYear,
    originalPayoffMonths: loanTermYears * 12,
    monthsSaved: (loanTermYears * 12) - payoffMonth,
  };
}

// Calculate total cost of renting over N years with investment of savings
export function calculateRentingCosts(params) {
  const {
    monthlyRent,
    annualRentIncrease = 0.04,
    yearsToAnalyze,
    initialInvestment,
    yearlyBuyingCosts, // Array of yearly buying costs to calculate savings each year
    investmentReturn = SP500_AVG_RETURN,
    rentersInsurance = 200,
  } = params;

  const yearlyBreakdown = [];
  let totalRentPaid = 0;
  let investmentBalance = initialInvestment;

  for (let year = 1; year <= yearsToAnalyze; year++) {
    // Rent for this year (with annual increases)
    const yearlyRent = monthlyRent * 12 * Math.pow(1 + annualRentIncrease, year - 1);
    totalRentPaid += yearlyRent + rentersInsurance;

    // Investment growth at start of year
    const startBalance = investmentBalance;
    investmentBalance *= 1 + investmentReturn;

    // Calculate savings from renting vs buying this year
    const buyingCostThisYear = yearlyBuyingCosts?.[year - 1]?.totalCost || 0;
    const rentingCostThisYear = yearlyRent + rentersInsurance;
    const savingsThisYear = Math.max(0, buyingCostThisYear - rentingCostThisYear);

    // Add savings to investment
    investmentBalance += savingsThisYear;

    yearlyBreakdown.push({
      year,
      rent: yearlyRent,
      rentersInsurance,
      totalCost: rentingCostThisYear,
      cumulativeRent: totalRentPaid,
      savingsVsBuying: savingsThisYear,
      investmentStartBalance: startBalance,
      investmentEndBalance: investmentBalance,
      investmentGrowth: investmentBalance - startBalance - savingsThisYear,
    });
  }

  return {
    yearlyBreakdown,
    totalRentPaid,
    finalInvestmentBalance: investmentBalance,
  };
}
