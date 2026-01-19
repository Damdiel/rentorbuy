# Rent vs Buy Calculator

A comprehensive financial calculator that helps you decide whether renting or buying a home makes more sense for your situation. Built with React and designed with an editorial-style interface.

## Features

### Core Calculator
- **Full cost comparison** between buying and renting over a customizable time horizon (5-50 years)
- **Mortgage calculations** including principal, interest, PMI, and extra payments
- **Tax deduction modeling** with mortgage interest deduction, SALT caps ($40k under $500k income, $10k above), and automatic itemize vs. standard deduction comparison each year
- **Investment comparison** - models investing the down payment in S&P 500 if renting
- **Home appreciation** and equity building over time
- **All 50 states + DC** with accurate property tax rates and state income tax rates

### Sensitivity Analysis
- Interactive tool to see how changing any single variable affects the rent vs. buy decision
- Variables include: mortgage rate, home price, down payment, monthly rent, home appreciation, investment returns, rent increases, and time horizon
- Visual bar chart showing buy vs. rent advantage across the range
- Automatic breakeven point calculation

### Inputs
- Home price and down payment
- Mortgage rate and term (15, 20, or 30 years)
- Extra monthly payments with early payoff calculation
- PMI toggle
- Mortgage points
- State selection (affects property tax and income tax)
- Filing status (single/married)
- Taxable income
- Home insurance and HOA
- Maintenance rate (% of home value)
- Monthly rent and annual increase rate
- Home appreciation rate
- Expected S&P 500 returns

### Output
- Clear verdict on whether buying or renting is better
- Year-by-year breakdown table showing costs, equity, tax benefits, and investments
- Detailed tax deduction analysis
- Summary cards for both scenarios with net position calculations

## Tech Stack

- React 18
- Vite
- CSS (no frameworks - custom editorial design)

## Running Locally

```bash
npm install
npm run dev
```

## Building for Production

```bash
npm run build
```

Output will be in the `dist` folder.

## Deployment

Configured for deployment at a subpath (`/rentorbuy/`). The base path is set in `vite.config.js`.

## Assumptions

- Selling costs: 6% of sale price
- Renter's insurance: $200/year
- PMI drops off when LTV reaches 80%
- Tax benefits recalculated each year
- When buying becomes cheaper than renting (e.g., after mortgage payoff), savings are invested at the S&P rate
