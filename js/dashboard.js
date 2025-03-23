// dashboard.js
import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// DOM Elements
const loanApplicationsTable = document.getElementById('loan-applications');
const logoutBtn = document.getElementById('logout-btn');
const statusModal = new bootstrap.Modal(document.getElementById('statusModal'));

// Initialize dashboard
function initDashboard() {
    checkAuth();
    setupEventListeners();
}

// Check authentication status
function checkAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadLoanApplications(user.uid);
        } else {
            window.location.href = 'index.html';
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle logout
async function handleLogout(e) {
    e.preventDefault();
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}

// Load loan applications
async function loadLoanApplications(userId) {
    try {
        // Create a query to get only the current user's applications
        const loansRef = collection(db, "loans");
        const q = query(
            loansRef,
            where("userId", "==", userId),
            orderBy("submittedAt", "desc")
        );
        
        // Get the documents
        const querySnapshot = await getDocs(q);
        
        loanApplicationsTable.innerHTML = '';

        if (querySnapshot.empty) {
            loanApplicationsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No loan applications found.</td>
                </tr>
            `;
            return;
        }

        // Add each application to the table
        querySnapshot.forEach((doc) => {
            const loan = doc.data();
            const row = createLoanApplicationRow(loan);
            loanApplicationsTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading loan applications:', error);
        loanApplicationsTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">Error loading loan applications.</td>
            </tr>
        `;
    }
}

// Create loan application row
function createLoanApplicationRow(loan) {
    const row = document.createElement('tr');
    const statusClass = getStatusClass(loan.status);
    
    row.innerHTML = `
        <td>${loan.applicationId}</td>
        <td>${formatLoanType(loan.loanPurpose)}</td>
        <td>₹${formatNumber(loan.loanAmount)}</td>
        <td><span class="status-badge ${statusClass}">${loan.status}</span></td>
        <td>${formatDate(loan.submittedAt)}</td>
        <td>
            <button class="btn btn-sm btn-primary btn-action" onclick="showStatusDetails('${loan.applicationId}')">
                <i class="fas fa-eye"></i> View Details
            </button>
        </td>
    `;
    
    return row;
}

// Find loan application by ID
async function findLoanApplication(applicationId) {
    try {
        const loansRef = collection(db, "loans");
        const q = query(
            loansRef,
            where("applicationId", "==", applicationId),
            where("userId", "==", auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
        }
        return null;
    } catch (error) {
        console.error('Error finding loan application:', error);
        return null;
    }
}

// Show status details in modal
window.showStatusDetails = async function(applicationId) {
    const loan = await findLoanApplication(applicationId);
    if (!loan) {
        alert('You do not have permission to view this application.');
        return;
    }

    const statusDetails = document.getElementById('status-details');
    statusDetails.innerHTML = createStatusTimeline(loan);
    statusModal.show();
};

// Format loan type
function formatLoanType(type) {
    const types = {
        'personal': 'Personal Loan',
        'home': 'Home Loan',
        'education': 'Education Loan',
        'business': 'Business Loan'
    };
    return types[type] || type;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get status class for styling
function getStatusClass(status) {
    const classes = {
        'Pending': 'status-pending',
        'Approved': 'status-approved',
        'Rejected': 'status-rejected',
        'Processing': 'status-processing'
    };
    return classes[status] || 'status-pending';
}

// Create status timeline
function createStatusTimeline(loan) {
    return `
        <div class="timeline">
            <div class="timeline-item">
                <div class="timeline-date">${formatDate(loan.submittedAt)}</div>
                <div class="timeline-content">
                    <h5>Application Submitted</h5>
                    <p>Your loan application has been submitted successfully.</p>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-date">${formatDate(new Date())}</div>
                <div class="timeline-content">
                    <h5>Under Review</h5>
                    <p>Your application is currently being reviewed by our team.</p>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-date">Pending</div>
                <div class="timeline-content">
                    <h5>Final Decision</h5>
                    <p>Awaiting final decision on your application.</p>
                </div>
            </div>
        </div>
    `;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', initDashboard);