const fs = require('fs');
const path = require('path');
const { analyzeResume } = require('./analyzer');

async function test() {
    console.log('Testing analyzer...');
    // We don't have a real file here easily without creating one, 
    // but we can check if the imports work.
    try {
        console.log('Analyze function exists:', typeof analyzeResume === 'function');
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
