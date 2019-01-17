// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onInstalled.addListener(function() {
  
  let options = {
    downpayment: 20,
    interest: 3.74,
    taxRate: 1.21,
    estimatedUtilities: 350,
    period: 25,
    useAssessedValue: true
  };

  chrome.storage.sync.set(options, function() {
    console.log('Set options!', options);
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'www.viewpoint.ca'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});
