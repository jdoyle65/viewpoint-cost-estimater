"use strict";

const storageKeys = ['downpayment', 'interest', 'taxRate', 'estimatedUtilities', 'period'];
let cutsheet = document.documentElement.querySelector('.overview,#v3-cutsheet');
const observer = new MutationObserver((mutations, observer) => updateCosts(mutations));

if (cutsheet) {
  if (cutsheet.id === 'v3-cutsheet') {
    updateCosts();
  } else {
    // Observe changes to the cutsheet's class to see loading new listing
    observer.observe(cutsheet, {
      attributes: true,          
      attributeFilter: ['class'],
      attributeOldValue: true
    });
  }

  // Listen for options updates
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && Object.keys(changes).some(key => storageKeys.includes(key))) {
      updateCosts();
    }
  });
} else {
  console.warn('Not cutsheet (div.overview,#v3-cutsheet) is present');
}

/**
 * Updates the element containing the calculated costs
 * @param {MutationRecord[]} mutations 
 */
async function updateCosts(mutations) {
  if (mutations) {
    const wasLoading = mutations[0].oldValue.split(/\s+/).includes('show-vp-loader');
    const isLoading = mutations[0].target.classList.contains('show-vp-loader');
    if (!(wasLoading && !isLoading)) {
      return;
    }
  }

  const priceStatusElement = cutsheet.querySelector('.price-status');
  const priceElement = cutsheet.querySelector('span.price');
  let monthlyElement = cutsheet.querySelector('div.monthly-calculation');

  if (!monthlyElement) {
    monthlyElement = insertMonthlyElementIntoCutsheet(priceStatusElement);
  }
  
  if (priceElement && priceElement.innerText !== undefined && monthlyElement) {
    const priceText = priceElement.innerText.split('\n')[0];
    const price = parsePrice(priceText);
    
    if (price) {
      const assessedValue = findAssessedValue(cutsheet, price);
      const calculatedCost = await calculateMonthlyCost(price, assessedValue);
      monthlyElement.innerHTML = `${formatPrice(calculatedCost.total)}/month<br>Mortgage: ${formatPrice(calculatedCost.mortgage)}<br>Tax: ${formatPrice(calculatedCost.taxes)}`;
    }
  }
}

/**
 * Calculates the total monthly costs, mortgage (monthly) and taxes (monthly),
 * 
 * @param {number} price 
 * @param {number} assessedValue
 */
async function calculateMonthlyCost(price, assessedValue) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(storageKeys, (data) => {
      const { downpayment, interest, taxRate, estimatedUtilities, period } = data;
      const principal = price - (price * (downpayment / 100));
      const years = period;
      
      const mortgagePayment = calculateMortgagePayment(principal, years, interest);
      const taxes = (taxRate / 100 / 12) * assessedValue;
      const utilities = estimatedUtilities;
      
      return resolve({
        total: mortgagePayment + taxes + utilities,
        mortgage: mortgagePayment,
        taxes: taxes
      });
    });
  })
}

/**
 * Inserts the monthly cost div after the element passed
 * 
 * @param {Element} insertAfterElement 
 */
function insertMonthlyElementIntoCutsheet(insertAfterElement) {
  const element = document.createElement('div');
  element.classList.add('monthly-calculation');
  insertAfterElement.parentNode.insertBefore(element, insertAfterElement.nextSibling);
  element.style.backgroundColor = '#8000d8';
  element.style.color = '#fff';
  element.style.marginBottom = '5px';
  element.style.padding = '5px 10px';
  element.style.fontWeight = '300';

  return element;
}

/**
 * Finds the element with the tax assessed value in the parentElement, and then
 * returns a parsed version of the value, or the default value if it can't find it.
 * 
 * @param {Element} parentElement 
 * @param {number} defaultValue 
 * @returns {number}
 */
function findAssessedValue(parentElement, defaultValue) {
  for(let e of parentElement.querySelectorAll('small')) {
    if (e.innerText.match(/[0-9]{4} Assessment:/)) {
      return parseAssessedValue(e.innerText);
    }
  }

  return defaultValue;
}

/**
 * Calculate monthly mortgage payment.
 * 
 * TODO: Add default insurance
 * 
 * @param {number} principal 
 * @param {number} years 
 * @param {number} interestRate 
 */
function calculateMortgagePayment(principal, years, interestRate) {
  let months = years * 12;
  let monthlyInterestRate = interestRate / 100 / 12;
  return principal * monthlyInterestRate * (Math.pow(1 + monthlyInterestRate, months)) / (Math.pow(1 + monthlyInterestRate, months) - 1);
}

function formatPrice(price) {
  const numbers = new String(parseInt(price)).split('');
  const charArray = []

  for (let i = 0; i < numbers.length; i++) {
    if (i % 3 === 0 && i > 0) {
      charArray.unshift(',');
    }
    charArray.unshift(numbers[numbers.length - (i + 1)]);
  }
  return '$' + charArray.join('');
}

/**
 * Parses an integer from a price string with no decimals
 * 
 * @param {string} string 
 * @returns {number|null}
 */
function parsePrice(string) {
  let price = parseInt(string.replace(/[^0-9]/g, ''));

  if (isNaN(price)) {
    return null;
  }

  return price;
}

function parseAssessedValue(string) {
  return parsePrice(string.replace(/[0-9]{4} Assessment:/, ''));
}