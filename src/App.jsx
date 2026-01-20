import { useState, useMemo } from 'react';
import {
  STATE_TAX_DATA,
  PROPERTY_TAX_RATES,
  calculateStateTax,
  calculatePropertyTax,
  calculateDeductionBenefit,
  getMarginalRate,
  STANDARD_DEDUCTION,
} from './utils/taxCalculations';
import {
  calculateBuyingCosts,
  calculateRentingCosts,
  calculateMonthlyPayment,
  calculateMonthlyPMI,
  calculatePointsEffect,
  AVG_HOME_INSURANCE_RATE,
  AVG_HOA_MONTHLY,
} from './utils/mortgageCalculations';
import './App.css';

function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState('calculator');
  const [sensitivityVariable, setSensitivityVariable] = useState('mortgageRate');

  // Home purchase inputs
  const [homePrice, setHomePrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(0);
  const [includePMI, setIncludePMI] = useState(true);
  const [buyingPoints, setBuyingPoints] = useState(false);
  const [numPoints, setNumPoints] = useState(1);

  // Location and tax inputs
  const [state, setState] = useState('AZ');
  const [filingStatus, setFilingStatus] = useState('married');
  const [taxableIncome, setTaxableIncome] = useState(200000);

  // Housing costs
  const [homeInsurance, setHomeInsurance] = useState(Math.round(500000 * AVG_HOME_INSURANCE_RATE));
  const [hoaMonthly, setHoaMonthly] = useState(AVG_HOA_MONTHLY);
  const [maintenanceRate, setMaintenanceRate] = useState(1); // 1% of home value annually

  // Renting inputs
  const [monthlyRent, setMonthlyRent] = useState(2300);
  const [annualRentIncrease, setAnnualRentIncrease] = useState(4);

  // Analysis period
  const [yearsToAnalyze, setYearsToAnalyze] = useState(10);

  // Assumptions
  const [homeAppreciation, setHomeAppreciation] = useState(3);
  const [investmentReturn, setInvestmentReturn] = useState(10);
  const [includeSellingCosts, setIncludeSellingCosts] = useState(true);

  // Calculate everything
  const calculations = useMemo(() => {
    const loanAmount = homePrice - downPayment;
    const downPaymentPercent = (downPayment / homePrice) * 100;

    // Points calculation
    let effectiveRate = mortgageRate / 100;
    let pointsCost = 0;
    if (buyingPoints && numPoints > 0) {
      const pointsEffect = calculatePointsEffect(loanAmount, mortgageRate / 100, numPoints);
      effectiveRate = pointsEffect.adjustedRate;
      pointsCost = pointsEffect.pointsCost;
    }

    // Monthly mortgage (P&I only)
    const monthlyMortgagePI = calculateMonthlyPayment(loanAmount, effectiveRate, loanTermYears);

    // PMI
    const monthlyPMI = includePMI ? calculateMonthlyPMI(loanAmount, homePrice, true) : 0;

    // Property tax
    const propertyTaxRate = PROPERTY_TAX_RATES[state] || 0.01;
    const annualPropertyTax = calculatePropertyTax(homePrice, state);
    const monthlyPropertyTax = annualPropertyTax / 12;

    // Insurance and HOA
    const monthlyInsurance = homeInsurance / 12;

    // Total monthly housing cost (buying) - base costs without extra payment
    const totalMonthlyBuying = monthlyMortgagePI + monthlyPMI + monthlyPropertyTax + monthlyInsurance + hoaMonthly;
    const totalMonthlyWithExtra = totalMonthlyBuying + extraMonthlyPayment;

    // State income tax
    const stateIncomeTax = calculateStateTax(taxableIncome, state);

    // Marginal tax rate
    const marginalRate = getMarginalRate(taxableIncome, filingStatus);

    // First year deduction calculation (for display purposes)
    const firstYearInterest = loanAmount * effectiveRate * 0.97;
    const firstYearDeduction = calculateDeductionBenefit(
      firstYearInterest,
      annualPropertyTax,
      stateIncomeTax,
      filingStatus,
      marginalRate,
      taxableIncome
    );

    // Calculate full buying costs over analysis period with yearly tax calculations
    const buyingResults = calculateBuyingCosts({
      homePrice,
      downPayment,
      mortgageRate: effectiveRate,
      loanTermYears,
      extraMonthlyPayment,
      includePMI,
      buyingPoints,
      numPoints,
      propertyTaxRate,
      homeInsurance,
      hoaMonthly,
      maintenanceRate: maintenanceRate / 100,
      homeAppreciationRate: homeAppreciation / 100,
      sellingCostRate: includeSellingCosts ? 0.06 : 0,
      yearsToAnalyze,
      // Pass tax calculation functions
      taxableIncome,
      filingStatus,
      stateCode: state,
      calculateDeductionBenefit,
      getMarginalRate,
      calculateStateTax,
      // Pass rent info for savings comparison (when buying becomes cheaper)
      monthlyRent,
      annualRentIncrease: annualRentIncrease / 100,
      rentersInsurance: 200,
      investmentReturn: investmentReturn / 100,
    });

    // Calculate renting costs with investment using yearly buying costs
    const rentingResults = calculateRentingCosts({
      monthlyRent,
      annualRentIncrease: annualRentIncrease / 100,
      yearsToAnalyze,
      initialInvestment: downPayment + pointsCost,
      yearlyBuyingCosts: buyingResults.yearlyBreakdown,
      investmentReturn: investmentReturn / 100,
      rentersInsurance: 200,
    });

    // Comparison
    const buyNetPosition = buyingResults.netFromSale;
    const rentNetPosition = rentingResults.finalInvestmentBalance;
    const difference = buyNetPosition - rentNetPosition;
    const buyingIsBetter = difference > 0;

    // Calculate first year tax benefit for monthly display
    const firstYearTaxBenefit = buyingResults.yearlyBreakdown[0]?.taxBenefit || 0;
    const monthlyTaxBenefit = firstYearTaxBenefit / 12;
    const monthlyMaintenance = (homePrice * maintenanceRate / 100) / 12;
    const netMonthlyBuying = totalMonthlyWithExtra + monthlyMaintenance - monthlyTaxBenefit;

    return {
      loanAmount,
      downPaymentPercent,
      effectiveRate: effectiveRate * 100,
      pointsCost,
      monthlyMortgagePI,
      monthlyPMI,
      monthlyPropertyTax,
      annualPropertyTax,
      monthlyInsurance,
      monthlyMaintenance,
      totalMonthlyBuying,
      totalMonthlyWithExtra,
      firstYearInterest,
      stateIncomeTax,
      marginalRate: marginalRate * 100,
      firstYearDeduction,
      monthlyTaxBenefit,
      netMonthlyBuying,
      buyingResults,
      rentingResults,
      buyNetPosition,
      rentNetPosition,
      difference: Math.abs(difference),
      buyingIsBetter,
    };
  }, [
    homePrice,
    downPayment,
    mortgageRate,
    loanTermYears,
    extraMonthlyPayment,
    includePMI,
    buyingPoints,
    numPoints,
    state,
    filingStatus,
    taxableIncome,
    homeInsurance,
    hoaMonthly,
    maintenanceRate,
    monthlyRent,
    annualRentIncrease,
    yearsToAnalyze,
    homeAppreciation,
    investmentReturn,
    includeSellingCosts,
  ]);

  // Sensitivity analysis configuration
  const sensitivityConfig = {
    mortgageRate: {
      label: 'Mortgage Rate',
      min: 3,
      max: 9,
      step: 0.5,
      unit: '%',
      getValue: (v) => v,
      format: (v) => `${v}%`,
    },
    homePrice: {
      label: 'Home Price',
      min: 300000,
      max: 1000000,
      step: 50000,
      unit: '$',
      getValue: (v) => v,
      format: (v) => `$${(v / 1000).toFixed(0)}k`,
    },
    downPayment: {
      label: 'Down Payment',
      min: 50000,
      max: 300000,
      step: 25000,
      unit: '$',
      getValue: (v) => v,
      format: (v) => `$${(v / 1000).toFixed(0)}k`,
    },
    monthlyRent: {
      label: 'Monthly Rent',
      min: 1500,
      max: 6000,
      step: 250,
      unit: '$',
      getValue: (v) => v,
      format: (v) => `$${v.toLocaleString()}`,
    },
    homeAppreciation: {
      label: 'Home Appreciation',
      min: 0,
      max: 6,
      step: 0.5,
      unit: '%',
      getValue: (v) => v,
      format: (v) => `${v}%`,
    },
    investmentReturn: {
      label: 'S&P 500 Return',
      min: 4,
      max: 14,
      step: 1,
      unit: '%',
      getValue: (v) => v,
      format: (v) => `${v}%`,
    },
    annualRentIncrease: {
      label: 'Annual Rent Increase',
      min: 1,
      max: 7,
      step: 0.5,
      unit: '%',
      getValue: (v) => v,
      format: (v) => `${v}%`,
    },
    yearsToAnalyze: {
      label: 'Years to Analyze',
      min: 5,
      max: 50,
      step: 5,
      unit: 'yrs',
      getValue: (v) => v,
      format: (v) => `${v} yrs`,
    },
  };

  // Calculate sensitivity analysis data
  const sensitivityData = useMemo(() => {
    const config = sensitivityConfig[sensitivityVariable];
    if (!config) return [];

    const results = [];
    const currentValues = {
      homePrice,
      downPayment,
      mortgageRate,
      monthlyRent,
      homeAppreciation,
      investmentReturn,
      annualRentIncrease,
      yearsToAnalyze,
    };

    for (let value = config.min; value <= config.max; value += config.step) {
      const testValues = { ...currentValues, [sensitivityVariable]: value };

      const loanAmount = testValues.homePrice - testValues.downPayment;
      let effectiveRate = testValues.mortgageRate / 100;
      let pointsCost = 0;

      if (buyingPoints && numPoints > 0) {
        const pointsEffect = calculatePointsEffect(loanAmount, testValues.mortgageRate / 100, numPoints);
        effectiveRate = pointsEffect.adjustedRate;
        pointsCost = pointsEffect.pointsCost;
      }

      const propertyTaxRate = PROPERTY_TAX_RATES[state] || 0.01;

      const buyingResults = calculateBuyingCosts({
        homePrice: testValues.homePrice,
        downPayment: testValues.downPayment,
        mortgageRate: effectiveRate,
        loanTermYears,
        extraMonthlyPayment,
        includePMI,
        buyingPoints,
        numPoints,
        propertyTaxRate,
        homeInsurance,
        hoaMonthly,
        maintenanceRate: maintenanceRate / 100,
        homeAppreciationRate: testValues.homeAppreciation / 100,
        sellingCostRate: includeSellingCosts ? 0.06 : 0,
        yearsToAnalyze: testValues.yearsToAnalyze,
        taxableIncome,
        filingStatus,
        stateCode: state,
        calculateDeductionBenefit,
        getMarginalRate,
        calculateStateTax,
        monthlyRent: testValues.monthlyRent,
        annualRentIncrease: testValues.annualRentIncrease / 100,
        rentersInsurance: 200,
        investmentReturn: testValues.investmentReturn / 100,
      });

      const rentingResults = calculateRentingCosts({
        monthlyRent: testValues.monthlyRent,
        annualRentIncrease: testValues.annualRentIncrease / 100,
        yearsToAnalyze: testValues.yearsToAnalyze,
        initialInvestment: testValues.downPayment + pointsCost,
        yearlyBuyingCosts: buyingResults.yearlyBreakdown,
        investmentReturn: testValues.investmentReturn / 100,
        rentersInsurance: 200,
      });

      const buyNet = buyingResults.netFromSale;
      const rentNet = rentingResults.finalInvestmentBalance;
      const difference = buyNet - rentNet;

      results.push({
        value,
        label: config.format(value),
        buyNet,
        rentNet,
        difference,
        buyingIsBetter: difference > 0,
        isCurrent: value === currentValues[sensitivityVariable],
      });
    }

    return results;
  }, [
    sensitivityVariable,
    homePrice,
    downPayment,
    mortgageRate,
    monthlyRent,
    homeAppreciation,
    investmentReturn,
    annualRentIncrease,
    yearsToAnalyze,
    loanTermYears,
    extraMonthlyPayment,
    includePMI,
    buyingPoints,
    numPoints,
    state,
    filingStatus,
    taxableIncome,
    homeInsurance,
    hoaMonthly,
    maintenanceRate,
    includeSellingCosts,
  ]);

  // Find breakeven point
  const breakevenPoint = useMemo(() => {
    for (let i = 0; i < sensitivityData.length - 1; i++) {
      const curr = sensitivityData[i];
      const next = sensitivityData[i + 1];
      if ((curr.difference > 0 && next.difference < 0) || (curr.difference < 0 && next.difference > 0)) {
        // Linear interpolation
        const ratio = Math.abs(curr.difference) / (Math.abs(curr.difference) + Math.abs(next.difference));
        const config = sensitivityConfig[sensitivityVariable];
        const breakevenValue = curr.value + ratio * config.step;
        return {
          value: breakevenValue,
          label: config.format(breakevenValue),
          between: [curr.label, next.label],
        };
      }
    }
    return null;
  }, [sensitivityData, sensitivityVariable]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercent = (num) => {
    return `${num.toFixed(2)}%`;
  };

  const formatMonths = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths} months`;
    if (remainingMonths === 0) return `${years} years`;
    return `${years}y ${remainingMonths}m`;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Rent or Buy Calculator</h1>
        <p>Calculate whether renting or buying makes more financial sense</p>
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            Calculator
          </button>
          <button
            className={`tab ${activeTab === 'sensitivity' ? 'active' : ''}`}
            onClick={() => setActiveTab('sensitivity')}
          >
            Sensitivity Analysis
          </button>
        </nav>
      </header>

      <main className="main">
        <div className="inputs-section">
          <div className="input-group">
            <h2>Home Purchase Details</h2>

            <div className="input-row">
              <label htmlFor="homePrice">Home Price</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  id="homePrice"
                  value={homePrice}
                  onChange={(e) => setHomePrice(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="input-row">
              <label htmlFor="downPayment">
                Down Payment ({calculations.downPaymentPercent.toFixed(1)}%)
              </label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  id="downPayment"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="input-row">
              <label htmlFor="mortgageRate">Mortgage Interest Rate</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="mortgageRate"
                  value={mortgageRate}
                  step="0.125"
                  onChange={(e) => setMortgageRate(Number(e.target.value))}
                />
                <span>%</span>
              </div>
            </div>

            <div className="input-row">
              <label htmlFor="loanTerm">Loan Term</label>
              <select
                id="loanTerm"
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(Number(e.target.value))}
              >
                <option value={15}>15 years</option>
                <option value={20}>20 years</option>
                <option value={30}>30 years</option>
              </select>
            </div>

            <div className="input-row">
              <label htmlFor="extraMonthlyPayment">Extra Monthly Payment</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  id="extraMonthlyPayment"
                  value={extraMonthlyPayment}
                  min={0}
                  step={100}
                  onChange={(e) => setExtraMonthlyPayment(Number(e.target.value))}
                />
              </div>
              {extraMonthlyPayment > 0 && calculations.buyingResults.monthsSaved > 0 && (
                <span className="note success">
                  Saves {formatMonths(calculations.buyingResults.monthsSaved)} &bull; Payoff in {formatMonths(calculations.buyingResults.payoffMonth)}
                </span>
              )}
            </div>

            <div className="input-row toggle-row">
              <label htmlFor="includePMI">Include PMI</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="includePMI"
                  checked={includePMI}
                  onChange={(e) => setIncludePMI(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              {includePMI && calculations.downPaymentPercent >= 20 && (
                <span className="note">No PMI needed with 20%+ down</span>
              )}
            </div>

            <div className="input-row toggle-row">
              <label htmlFor="buyingPoints">Buy Mortgage Points</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="buyingPoints"
                  checked={buyingPoints}
                  onChange={(e) => setBuyingPoints(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {buyingPoints && (
              <div className="input-row sub-input">
                <label htmlFor="numPoints">Number of Points</label>
                <select
                  id="numPoints"
                  value={numPoints}
                  onChange={(e) => setNumPoints(Number(e.target.value))}
                >
                  <option value={1}>1 point (-0.25%)</option>
                  <option value={2}>2 points (-0.50%)</option>
                  <option value={3}>3 points (-0.75%)</option>
                </select>
                <span className="note">
                  Cost: {formatCurrency(calculations.pointsCost)} | New Rate: {formatPercent(calculations.effectiveRate)}
                </span>
              </div>
            )}
          </div>

          <div className="input-group">
            <h2>Location & Taxes</h2>

            <div className="input-row">
              <label htmlFor="state">State</label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                {Object.entries(STATE_TAX_DATA)
                  .sort((a, b) => a[1].name.localeCompare(b[1].name))
                  .map(([code, data]) => (
                    <option key={code} value={code}>
                      {data.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="input-row">
              <label>Filing Status</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="filingStatus"
                    value="single"
                    checked={filingStatus === 'single'}
                    onChange={(e) => setFilingStatus(e.target.value)}
                  />
                  Single
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="filingStatus"
                    value="married"
                    checked={filingStatus === 'married'}
                    onChange={(e) => setFilingStatus(e.target.value)}
                  />
                  Married Filing Jointly
                </label>
              </div>
            </div>

            <div className="input-row">
              <label htmlFor="taxableIncome">Household Taxable Income</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  id="taxableIncome"
                  value={taxableIncome}
                  onChange={(e) => setTaxableIncome(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <h2>Housing Costs</h2>

            <div className="input-row">
              <label htmlFor="homeInsurance">Annual Home Insurance</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  id="homeInsurance"
                  value={homeInsurance}
                  onChange={(e) => setHomeInsurance(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="input-row">
              <label htmlFor="hoaMonthly">Monthly HOA</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  id="hoaMonthly"
                  value={hoaMonthly}
                  onChange={(e) => setHoaMonthly(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="input-row">
              <label htmlFor="maintenanceRate">Annual Maintenance</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="maintenanceRate"
                  value={maintenanceRate}
                  min={0.5}
                  max={3}
                  step={0.25}
                  onChange={(e) => setMaintenanceRate(Number(e.target.value))}
                />
                <span>%</span>
              </div>
              <span className="note">% of home value. Typical: 1-2%</span>
            </div>
          </div>

          <div className="input-group">
            <h2>Renting Alternative</h2>

            <div className="input-row">
              <label htmlFor="monthlyRent">Monthly Rent</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  id="monthlyRent"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="input-row">
              <label htmlFor="annualRentIncrease">Annual Rent Increase</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="annualRentIncrease"
                  value={annualRentIncrease}
                  min={3}
                  max={5}
                  step={0.5}
                  onChange={(e) => setAnnualRentIncrease(Number(e.target.value))}
                />
                <span>%</span>
              </div>
              <span className="note">Typical range: 3-5%</span>
            </div>
          </div>

          <div className="input-group">
            <h2>Analysis Settings</h2>

            <div className="input-row">
              <label htmlFor="yearsToAnalyze">Years to Analyze: {yearsToAnalyze}</label>
              <div className="slider-container">
                <input
                  type="range"
                  id="yearsToAnalyze"
                  min={5}
                  max={50}
                  step={1}
                  value={yearsToAnalyze}
                  onChange={(e) => setYearsToAnalyze(Number(e.target.value))}
                  className="range-slider"
                />
                <div className="slider-labels">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>
            </div>

            <div className="input-row">
              <label htmlFor="homeAppreciation">Home Appreciation Rate</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="homeAppreciation"
                  value={homeAppreciation}
                  step={0.5}
                  onChange={(e) => setHomeAppreciation(Number(e.target.value))}
                />
                <span>%</span>
              </div>
            </div>

            <div className="input-row">
              <label htmlFor="investmentReturn">S&P 500 Return (Renting)</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  id="investmentReturn"
                  value={investmentReturn}
                  step={0.5}
                  onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                />
                <span>%</span>
              </div>
            </div>

            <div className="input-row toggle-row">
              <label htmlFor="includeSellingCosts">Include Selling Costs (6%)</label>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="includeSellingCosts"
                  checked={includeSellingCosts}
                  onChange={(e) => setIncludeSellingCosts(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="results-section">
          {activeTab === 'calculator' && (
            <>
          <div className={`verdict ${calculations.buyingIsBetter ? 'buy' : 'rent'}`}>
            <h2>
              {calculations.buyingIsBetter ? 'Buying' : 'Renting'} is Better
            </h2>
            <p className="verdict-amount">
              by {formatCurrency(calculations.difference)} over {yearsToAnalyze} years
            </p>
          </div>

          <div className="comparison-cards">
            <div className="comparison-card buying">
              <h3>Buying</h3>
              <div className="card-content">
                <div className="stat">
                  <span className="label">Monthly Payment (P&I)</span>
                  <span className="value">{formatCurrency(calculations.monthlyMortgagePI)}</span>
                </div>
                {extraMonthlyPayment > 0 && (
                  <div className="stat">
                    <span className="label">Extra Principal Payment</span>
                    <span className="value">{formatCurrency(extraMonthlyPayment)}</span>
                  </div>
                )}
                {calculations.monthlyPMI > 0 && (
                  <div className="stat">
                    <span className="label">Monthly PMI</span>
                    <span className="value">{formatCurrency(calculations.monthlyPMI)}</span>
                  </div>
                )}
                <div className="stat">
                  <span className="label">Monthly Property Tax</span>
                  <span className="value">{formatCurrency(calculations.monthlyPropertyTax)}</span>
                </div>
                <div className="stat">
                  <span className="label">Monthly Insurance</span>
                  <span className="value">{formatCurrency(calculations.monthlyInsurance)}</span>
                </div>
                <div className="stat">
                  <span className="label">Monthly HOA</span>
                  <span className="value">{formatCurrency(hoaMonthly)}</span>
                </div>
                <div className="stat">
                  <span className="label">Monthly Maintenance</span>
                  <span className="value">{formatCurrency(calculations.monthlyMaintenance)}</span>
                </div>
                <div className="stat total">
                  <span className="label">Total Monthly Cost</span>
                  <span className="value">{formatCurrency(calculations.totalMonthlyWithExtra + calculations.monthlyMaintenance)}</span>
                </div>
                {calculations.monthlyTaxBenefit > 0 && (
                  <div className="stat highlight">
                    <span className="label">Monthly Tax Benefit (Year 1)</span>
                    <span className="value">-{formatCurrency(calculations.monthlyTaxBenefit)}</span>
                  </div>
                )}
                <div className="stat net">
                  <span className="label">Net Monthly Cost (Year 1)</span>
                  <span className="value">{formatCurrency(calculations.netMonthlyBuying)}</span>
                </div>
                <hr />
                {calculations.buyingResults.payoffMonth < loanTermYears * 12 && (
                  <div className="stat highlight">
                    <span className="label">Mortgage Payoff</span>
                    <span className="value">{formatMonths(calculations.buyingResults.payoffMonth)}</span>
                  </div>
                )}
                <div className="stat">
                  <span className="label">Home Value at Year {yearsToAnalyze}</span>
                  <span className="value">{formatCurrency(calculations.buyingResults.finalHomeValue)}</span>
                </div>
                <div className="stat">
                  <span className="label">Total Equity Built</span>
                  <span className="value">{formatCurrency(calculations.buyingResults.totalEquity)}</span>
                </div>
                <div className="stat">
                  <span className="label">Total Tax Savings</span>
                  <span className="value">{formatCurrency(calculations.buyingResults.totalTaxSavings)}</span>
                </div>
                {calculations.buyingResults.savingsInvestmentBalance > 0 && (
                  <div className="stat highlight">
                    <span className="label">Invested Savings vs Rent</span>
                    <span className="value">{formatCurrency(calculations.buyingResults.savingsInvestmentBalance)}</span>
                  </div>
                )}
                {includeSellingCosts && (
                  <div className="stat">
                    <span className="label">Selling Costs (6%)</span>
                    <span className="value">-{formatCurrency(calculations.buyingResults.sellingCosts)}</span>
                  </div>
                )}
                <div className="stat final">
                  <span className="label">Net Position</span>
                  <span className="value">{formatCurrency(calculations.buyNetPosition)}</span>
                </div>
              </div>
            </div>

            <div className="comparison-card renting">
              <h3>Renting</h3>
              <div className="card-content">
                <div className="stat">
                  <span className="label">Starting Monthly Rent</span>
                  <span className="value">{formatCurrency(monthlyRent)}</span>
                </div>
                <div className="stat">
                  <span className="label">Rent at Year {yearsToAnalyze}</span>
                  <span className="value">
                    {formatCurrency(
                      monthlyRent * Math.pow(1 + annualRentIncrease / 100, yearsToAnalyze - 1)
                    )}
                  </span>
                </div>
                <div className="stat">
                  <span className="label">Annual Rent Increase</span>
                  <span className="value">{formatPercent(annualRentIncrease)}</span>
                </div>
                <hr />
                <div className="stat">
                  <span className="label">Initial Investment</span>
                  <span className="value">{formatCurrency(downPayment + calculations.pointsCost)}</span>
                </div>
                <div className="stat">
                  <span className="label">Investment Return</span>
                  <span className="value">{formatPercent(investmentReturn)}/year</span>
                </div>
                <hr />
                <div className="stat">
                  <span className="label">Total Rent Paid</span>
                  <span className="value">{formatCurrency(calculations.rentingResults.totalRentPaid)}</span>
                </div>
                <div className="stat final">
                  <span className="label">Investment Balance</span>
                  <span className="value">{formatCurrency(calculations.rentingResults.finalInvestmentBalance)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tax-details">
            <h3>Tax Deduction Analysis (Year 1)</h3>
            <div className="tax-grid">
              <div className="tax-item">
                <span className="label">Mortgage Interest</span>
                <span className="value">{formatCurrency(calculations.firstYearInterest)}</span>
              </div>
              <div className="tax-item">
                <span className="label">Property Tax</span>
                <span className="value">{formatCurrency(calculations.annualPropertyTax)}</span>
              </div>
              <div className="tax-item">
                <span className="label">State Income Tax</span>
                <span className="value">{formatCurrency(calculations.stateIncomeTax)}</span>
              </div>
              <div className="tax-item">
                <span className="label">SALT Deduction (Cap: {formatCurrency(calculations.firstYearDeduction.saltCap)})</span>
                <span className="value">{formatCurrency(calculations.firstYearDeduction.saltDeduction)}</span>
              </div>
              <div className="tax-item">
                <span className="label">Total Itemized Deductions</span>
                <span className="value">{formatCurrency(calculations.firstYearDeduction.totalItemized)}</span>
              </div>
              <div className="tax-item">
                <span className="label">Standard Deduction ({filingStatus})</span>
                <span className="value">{formatCurrency(calculations.firstYearDeduction.standardDeduction)}</span>
              </div>
              <div className="tax-item highlight">
                <span className="label">Excess Over Standard</span>
                <span className="value">{formatCurrency(calculations.firstYearDeduction.excessDeduction)}</span>
              </div>
              <div className="tax-item">
                <span className="label">Marginal Tax Rate</span>
                <span className="value">{formatPercent(calculations.marginalRate)}</span>
              </div>
              <div className="tax-item highlight">
                <span className="label">Year 1 Tax Savings</span>
                <span className="value">{formatCurrency(calculations.firstYearDeduction.shouldItemize ? calculations.firstYearDeduction.taxSavings : 0)}</span>
              </div>
              <div className="tax-item">
                <span className="label">Should Itemize?</span>
                <span className="value">{calculations.firstYearDeduction.shouldItemize ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <p className="tax-note">
              Tax benefits are calculated each year. As your mortgage interest decreases,
              you may switch to the standard deduction. Tax benefits stop when mortgage is paid off.
            </p>
          </div>

          <div className="yearly-breakdown">
            <h3>Year-by-Year Comparison</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Buy: Cost</th>
                    <th>Buy: Tax Benefit</th>
                    <th>Buy: Equity</th>
                    <th>Buy: Savings Inv.</th>
                    <th>Rent: Cost</th>
                    <th>Rent: Investment</th>
                    <th>Better</th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.buyingResults.yearlyBreakdown.map((buyYear, i) => {
                    const rentYear = calculations.rentingResults.yearlyBreakdown[i];
                    if (!rentYear) return null;
                    // Buy net = equity + invested savings from being cheaper than rent - selling costs
                    const buyNet = buyYear.equity + (buyYear.savingsInvestmentBalance || 0) - (buyYear.homeValue * 0.06);
                    const rentNet = rentYear.investmentEndBalance || 0;
                    const better = buyNet > rentNet ? 'Buy' : 'Rent';
                    return (
                      <tr key={buyYear.year} className={buyYear.isPaidOff ? 'paid-off' : ''}>
                        <td>
                          {buyYear.year}
                          {buyYear.isPaidOff && <span className="badge">Paid</span>}
                        </td>
                        <td>{formatCurrency(buyYear.totalCost)}</td>
                        <td className={buyYear.taxBenefit > 0 ? 'has-benefit' : 'no-benefit'}>
                          {buyYear.taxBenefit > 0 ? formatCurrency(buyYear.taxBenefit) : '-'}
                          {buyYear.taxBenefit > 0 && buyYear.shouldItemize && <span className="itemize-badge">I</span>}
                        </td>
                        <td>{formatCurrency(buyYear.equity)}</td>
                        <td className={buyYear.savingsInvestmentBalance > 0 ? 'has-benefit' : ''}>
                          {buyYear.savingsInvestmentBalance > 0 ? formatCurrency(buyYear.savingsInvestmentBalance) : '-'}
                        </td>
                        <td>{formatCurrency(rentYear?.totalCost || 0)}</td>
                        <td className={rentYear?.investmentEndBalance > 0 ? 'has-benefit' : ''}>
                          {formatCurrency(rentYear?.investmentEndBalance || 0)}
                        </td>
                        <td className={better.toLowerCase()}>{better}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="table-note">
              <span className="badge-legend"><span className="badge">Paid</span> = Mortgage paid off</span>
              <span className="badge-legend"><span className="itemize-badge">I</span> = Itemizing deductions</span>
            </p>
          </div>

          <div className="assumptions">
            <h3>Assumptions</h3>
            <ul>
              <li>Home appreciation rate: {formatPercent(homeAppreciation)} annually</li>
              <li>Maintenance costs: {formatPercent(maintenanceRate)} of home value annually</li>
              <li>Selling costs: {includeSellingCosts ? '6% of sale price (agent fees, closing costs)' : 'Not included'}</li>
              <li>S&P 500 average return: {formatPercent(investmentReturn)} annually</li>
              <li>Renter's insurance: $200/year</li>
              <li>PMI drops off when LTV reaches 80%</li>
              <li>Tax benefits recalculated each year (itemize vs. standard)</li>
              <li>No tax benefits after mortgage payoff (no interest to deduct)</li>
              <li>When buying is cheaper than renting (e.g., after payoff), savings are invested at S&P rate</li>
            </ul>
          </div>

          <div className="disclaimers">
            <h3>Disclaimers</h3>
            <p>This calculator provides estimates for educational purposes only and should not be considered financial advice. Notable limitations include:</p>
            <ul>
              <li>Does not model refinancing scenarios, including starting with an adjustable-rate mortgage (ARM) and refinancing to a fixed rate when rates drop</li>
              <li>Does not factor in moving costs or security deposits for renters — US renters move more frequently than homeowners on average, incurring repeated costs</li>
              <li>Tax calculations are simplified estimates and may not reflect your actual tax situation</li>
              <li>Investment returns are not guaranteed and actual market performance varies significantly year to year</li>
              <li>Does not account for major home repairs, renovations, or unexpected expenses</li>
            </ul>
          </div>
            </>
          )}

          {activeTab === 'sensitivity' && (
            <div className="sensitivity-section">
              <div className="sensitivity-header">
                <h2>Sensitivity Analysis</h2>
                <p>See how changing a single variable affects the rent vs. buy decision</p>
              </div>

              <div className="sensitivity-controls">
                <label htmlFor="sensitivityVar">Variable to Analyze</label>
                <select
                  id="sensitivityVar"
                  value={sensitivityVariable}
                  onChange={(e) => setSensitivityVariable(e.target.value)}
                >
                  {Object.entries(sensitivityConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {breakevenPoint && (
                <div className="breakeven-callout">
                  <span className="breakeven-label">Breakeven Point</span>
                  <span className="breakeven-value">{breakevenPoint.label}</span>
                  <span className="breakeven-note">
                    Below this: {sensitivityVariable === 'monthlyRent' || sensitivityVariable === 'investmentReturn' ? 'Renting' : 'Buying'} is better
                  </span>
                </div>
              )}

              <div className="sensitivity-chart">
                {sensitivityData.map((item, i) => {
                  const maxAbs = Math.max(...sensitivityData.map(d => Math.abs(d.difference)));
                  // Bar extends from center, so max width is 50% of container
                  const barWidthPercent = (Math.abs(item.difference) / maxAbs) * 50;
                  const isPositive = item.difference > 0;

                  return (
                    <div key={i} className={`sensitivity-row ${item.isCurrent ? 'current' : ''}`}>
                      <div className="sensitivity-label">{item.label}</div>
                      <div className="sensitivity-bar-container">
                        <div className="sensitivity-bar-wrapper">
                          <div className="sensitivity-bar-left">
                            {!isPositive && (
                              <div
                                className="sensitivity-bar rent"
                                style={{ width: `${barWidthPercent * 2}%` }}
                              />
                            )}
                          </div>
                          <div className="sensitivity-zero-line" />
                          <div className="sensitivity-bar-right">
                            {isPositive && (
                              <div
                                className="sensitivity-bar buy"
                                style={{ width: `${barWidthPercent * 2}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`sensitivity-value ${isPositive ? 'buy' : 'rent'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(item.difference)}
                      </div>
                      <div className={`sensitivity-winner ${isPositive ? 'buy' : 'rent'}`}>
                        {isPositive ? 'Buy' : 'Rent'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="sensitivity-legend">
                <div className="legend-item">
                  <span className="legend-color buy"></span>
                  <span>Buying is better (positive = buy advantage)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color rent"></span>
                  <span>Renting is better (negative = rent advantage)</span>
                </div>
                <div className="legend-item current">
                  <span className="legend-marker"></span>
                  <span>Your current setting</span>
                </div>
              </div>

              <div className="sensitivity-table">
                <h3>Detailed Values</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>{sensitivityConfig[sensitivityVariable]?.label}</th>
                        <th>Buy Net Position</th>
                        <th>Rent Net Position</th>
                        <th>Difference</th>
                        <th>Better Option</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivityData.map((item, i) => (
                        <tr key={i} className={item.isCurrent ? 'current-row' : ''}>
                          <td>{item.label} {item.isCurrent && <span className="badge">Current</span>}</td>
                          <td>{formatCurrency(item.buyNet)}</td>
                          <td>{formatCurrency(item.rentNet)}</td>
                          <td className={item.buyingIsBetter ? 'buy' : 'rent'}>
                            {item.buyingIsBetter ? '+' : ''}{formatCurrency(item.difference)}
                          </td>
                          <td className={item.buyingIsBetter ? 'buy' : 'rent'}>
                            {item.buyingIsBetter ? 'Buy' : 'Rent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
