// Initialize EmailJS
// Replace 'YOUR_PUBLIC_KEY' with your actual EmailJS public key
// Get it from https://www.emailjs.com/
emailjs.init('wGCHz9o_cmCWfHpKw');

let uploadedData = null;
let resultData = null;
let fileName = '';

// DOM Elements
const form = document.getElementById('topsisForm');
const inputFile = document.getElementById('inputFile');
const weightsInput = document.getElementById('weights');
const impactsInput = document.getElementById('impacts');
const emailInput = document.getElementById('email');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const downloadBtn = document.getElementById('downloadBtn');

// File Upload Handler
inputFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileName = file.name;
    hideMessages();

    try {
        const data = await readFile(file);
        uploadedData = data;
        showSuccess('File uploaded successfully!');
    } catch (error) {
        showError(error.message);
        uploadedData = null;
    }
});

// Read File (CSV or XLSX)
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                let parsedData;

                if (file.name.endsWith('.csv')) {
                    parsedData = parseCSV(data);
                } else if (file.name.endsWith('.xlsx')) {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    parsedData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                } else {
                    reject(new Error('Unsupported file format. Please upload .csv or .xlsx file.'));
                    return;
                }

                if (parsedData.length < 2) {
                    reject(new Error('File must contain at least 2 rows (header + data).'));
                    return;
                }

                if (parsedData[0].length < 3) {
                    reject(new Error('File must contain at least 3 columns.'));
                    return;
                }

                resolve(parsedData);
            } catch (error) {
                reject(new Error('Error reading file: ' + error.message));
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
}

// Parse CSV
function parseCSV(text) {
    const lines = text.trim().split('\n');
    return lines.map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    });
}

// Form Submit Handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    if (!uploadedData) {
        showError('Please upload a file first.');
        return;
    }

    // Get form values
    const weights = weightsInput.value.trim();
    const impacts = impactsInput.value.trim();
    const email = emailInput.value.trim();

    // Validate inputs
    try {
        validateInputs(weights, impacts, email);
        
        // Show loading
        setLoading(true);

        // Perform TOPSIS
        const result = performTOPSIS(uploadedData, weights, impacts);
        resultData = result;

        // Display results
        displayResults(result);

        // Send email
        await sendEmail(email, result);

        showSuccess('TOPSIS analysis completed! Results have been sent to your email.');
        
    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
});

// Validate Inputs
function validateInputs(weights, impacts, email) {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.');
    }

    // Weights validation
    const weightArray = weights.split(',').map(w => w.trim());
    if (weightArray.some(w => isNaN(parseFloat(w)) || w === '')) {
        throw new Error('Weights must be numeric values separated by commas.');
    }

    // Impacts validation
    const impactArray = impacts.split(',').map(i => i.trim());
    if (impactArray.some(i => i !== '+' && i !== '-')) {
        throw new Error('Impacts must be either + or - separated by commas.');
    }

    // Check if weights and impacts match
    if (weightArray.length !== impactArray.length) {
        throw new Error('Number of weights must equal number of impacts.');
    }

    // Check if weights and impacts match number of criteria
    const numCriteria = uploadedData[0].length - 1;
    if (weightArray.length !== numCriteria) {
        throw new Error(`Number of weights/impacts (${weightArray.length}) must match number of criteria (${numCriteria}).`);
    }
}

// Perform TOPSIS Algorithm
function performTOPSIS(data, weightsStr, impactsStr) {
    const weights = weightsStr.split(',').map(w => parseFloat(w.trim()));
    const impacts = impactsStr.split(',').map(i => i.trim());

    // Extract headers and data
    const headers = data[0];
    const rows = data.slice(1);

    // Extract numeric data (from 2nd column onwards)
    const numericData = rows.map(row => 
        row.slice(1).map(val => parseFloat(val))
    );

    // Check if all values are numeric
    for (let i = 0; i < numericData.length; i++) {
        for (let j = 0; j < numericData[i].length; j++) {
            if (isNaN(numericData[i][j])) {
                throw new Error(`Non-numeric value found at row ${i + 2}, column ${j + 2}`);
            }
        }
    }

    // Step 1: Normalize the decision matrix
    const normalized = normalizeMatrix(numericData);

    // Step 2: Apply weights
    const weighted = applyWeights(normalized, weights);

    // Step 3: Calculate ideal best and worst
    const { idealBest, idealWorst } = calculateIdeals(weighted, impacts);

    // Step 4: Calculate distances
    const distanceBest = calculateDistances(weighted, idealBest);
    const distanceWorst = calculateDistances(weighted, idealWorst);

    // Step 5: Calculate TOPSIS score
    const scores = distanceBest.map((db, i) => 
        distanceWorst[i] / (db + distanceWorst[i])
    );

    // Step 6: Rank
    const ranked = scores.map((score, index) => ({ score, index }));
    ranked.sort((a, b) => b.score - a.score);
    const ranks = new Array(scores.length);
    ranked.forEach((item, rank) => {
        ranks[item.index] = rank + 1;
    });

    // Create result
    const result = rows.map((row, i) => {
        return {
            data: row,
            score: scores[i].toFixed(4),
            rank: ranks[i]
        };
    });

    // Add headers
    result.headers = [...headers, 'Topsis Score', 'Rank'];

    return result;
}

// Normalize Matrix
function normalizeMatrix(matrix) {
    const numCols = matrix[0].length;
    const normalized = [];

    for (let j = 0; j < numCols; j++) {
        let sumSquares = 0;
        for (let i = 0; i < matrix.length; i++) {
            sumSquares += matrix[i][j] ** 2;
        }
        const norm = Math.sqrt(sumSquares);

        for (let i = 0; i < matrix.length; i++) {
            if (!normalized[i]) normalized[i] = [];
            normalized[i][j] = matrix[i][j] / norm;
        }
    }

    return normalized;
}

// Apply Weights
function applyWeights(matrix, weights) {
    return matrix.map(row => 
        row.map((val, j) => val * weights[j])
    );
}

// Calculate Ideal Best and Worst
function calculateIdeals(matrix, impacts) {
    const numCols = matrix[0].length;
    const idealBest = [];
    const idealWorst = [];

    for (let j = 0; j < numCols; j++) {
        const column = matrix.map(row => row[j]);
        if (impacts[j] === '+') {
            idealBest[j] = Math.max(...column);
            idealWorst[j] = Math.min(...column);
        } else {
            idealBest[j] = Math.min(...column);
            idealWorst[j] = Math.max(...column);
        }
    }

    return { idealBest, idealWorst };
}

// Calculate Euclidean Distance
function calculateDistances(matrix, ideal) {
    return matrix.map(row => {
        let sum = 0;
        for (let j = 0; j < row.length; j++) {
            sum += (row[j] - ideal[j]) ** 2;
        }
        return Math.sqrt(sum);
    });
}

// Display Results
function displayResults(result) {
    // Show download button
    downloadBtn.style.display = 'block';
}

// Send Email using EmailJS
async function sendEmail(email, result) {
    // Convert result to HTML table
    const htmlTable = convertToHTMLTable(result);
    
    // EmailJS parameters
    const templateParams = {
        to_email: email,
        file_name: fileName,
        results: htmlTable
    };

    try {
        await emailjs.send('topsis-arshia', 'template_yo1lufg', templateParams);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send email. Please download the results manually.');
    }
}

// Convert Result to HTML Table for Email
function convertToHTMLTable(result) {
    let html = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif; width: 100%;">';
    
    // Add headers
    html += '<thead><tr style="background-color: #4f46e5; color: white;">';
    result.headers.forEach(header => {
        html += `<th style="padding: 10px; text-align: left;">${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Add data rows
    result.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
        html += `<tr style="background-color: ${bgColor};">`;
        row.data.forEach(cell => {
            html += `<td style="padding: 8px; border: 1px solid #e5e7eb;">${cell}</td>`;
        });
        html += `<td style="padding: 8px; border: 1px solid #e5e7eb;">${row.score}</td>`;
        html += `<td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${row.rank}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

// Convert Result to CSV
function convertToCSV(result) {
    let csv = result.headers.join(',') + '\n';
    
    result.forEach(row => {
        const line = [...row.data, row.score, row.rank].map(cell => {
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',');
        csv += line + '\n';
    });

    return csv;
}

// Download Results
downloadBtn.addEventListener('click', () => {
    if (!resultData) return;

    const csv = convertToCSV(resultData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'topsis_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Helper Functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

function hideMessages() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

function setLoading(loading) {
    if (loading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}
