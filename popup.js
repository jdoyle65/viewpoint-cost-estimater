// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let optionsForm = document.getElementById('options-form');
let saveButton = document.getElementById('save-button');

chrome.storage.sync.get(['downpayment', 'interest', 'taxRate', 'estimatedUtilities', 'period', 'useAssessedValue'], function(data) {
  document.getElementsByName('downpaymentPercent')[0].value = data.downpayment;
  document.getElementsByName('interestRate')[0].value = data.interest;
  document.getElementsByName('taxRate')[0].value = data.taxRate;
  document.getElementsByName('estimatedUtilities')[0].value = data.estimatedUtilities;
  document.getElementsByName('period')[0].value = data.period;
  document.getElementsByName('useAssessedValue')[0].checked = data.useAssessedValue;
});

saveButton.onclick = function(element) {
  const formData = new FormData(optionsForm);
  const downpayment = parseFloat(formData.get('downpaymentPercent'));
  const interest = parseFloat(formData.get('interestRate'));
  const taxRate = parseFloat(formData.get('taxRate'));
  const estimatedUtilities = parseInt(formData.get('estimatedUtilities'))
  const period = parseInt(formData.get('period'));
  const useAssessedValue = formData.get('useAssessedValue') === 'on' ? true : false;
  const options = {
    downpayment,
    interest,
    taxRate,
    estimatedUtilities,
    period,
    useAssessedValue
  };

  chrome.storage.sync.set(options, function() {
    console.log('Set options!', options);
    window.close();
  });
}
