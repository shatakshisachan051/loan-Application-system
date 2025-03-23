
function calculateLoan() {
    const amount = parseFloat(document.getElementById('calcLoanAmount').value);
    const rate = parseFloat(document.getElementById('calcInterestRate').value) / 100 / 12;
    const term = parseFloat(document.getElementById('calcLoanTerm').value) * 12;

    if (amount && rate && term) {
        const monthly = (amount * rate) / (1 - Math.pow(1 + rate, -term));
        const interest = (monthly * term) - amount;

        document.getElementById('calcMonthlyPayment').textContent = monthly.toFixed(2);
        document.getElementById('calcTotalInterest').textContent = interest.toFixed(2);
    } else {
        document.getElementById('calcMonthlyPayment').textContent = 'Invalid';
        document.getElementById('calcTotalInterest').textContent = 'Invalid';
    }
}

function filterTable() {
    const termFilter = document.getElementById('termFilter').value;
    const rateFilter = document.getElementById('rateFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const rows = document.getElementById('loanTable').getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    for (let row of rows) {
        const term = row.getAttribute('data-term');
        const rate = row.getAttribute('data-rate');
        const type = row.getAttribute('data-type');

        const termMatch = termFilter === '' || term === termFilter;
        const rateMatch = rateFilter === '' || rate === rateFilter;
        const typeMatch = typeFilter === '' || type === typeFilter;

        if (termMatch && rateMatch && typeMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
    highlightBestMatch(termFilter, rateFilter)
}
function highlightBestMatch(targetTerm, targetRate) {
    const rows = document.getElementById('loanTable').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    let bestMatchRow = null;
    let smallestDifference = Infinity;

    for(let row of rows) {
        const term = parseFloat(row.getAttribute('data-term'));
        const rate = parseFloat(row.getAttribute('data-rate'));

        const termDifference = Math.abs(term - (parseFloat(targetTerm) || 0));
        const rateDifference = Math.abs(rate - (parseFloat(targetRate) || 0));

        const totalDifference = termDifference + rateDifference;

        if(totalDifference < smallestDifference) {
            smallestDifference = totalDifference;
            bestMatchRow = row;
        }
    }
    if(bestMatchRow){
        rows.forEach(row => row.classList.remove('highlight'));
        bestMatchRow.classList.add('highlight');
    }
}