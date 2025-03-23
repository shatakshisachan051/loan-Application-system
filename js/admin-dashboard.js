// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCplSGJ290aIqVQ4GL9vv63keSG3nZv-kE",
    authDomain: "loan-application-system-8fc65.firebaseapp.com",
    projectId: "loan-application-system-8fc65",
    storageBucket: "loan-application-system-8fc65.firebasestorage.app",
    messagingSenderId: "945483136628",
    appId: "1:945483136628:web:6b0f4bb5688e05f79a1b21",
    measurementId: "G-SYPDZXKEDM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const applicationsTable = document.getElementById('applications-table-body');
const usersTable = document.getElementById('users-table-body');
const analyticsSection = document.getElementById('analytics');
const applicationDetailsModal = new bootstrap.Modal(document.getElementById('applicationModal'));
const statusFilter = document.getElementById('status-filter');
const searchInput = document.getElementById('search-input');
const toastContainer = document.querySelector('.toast-container');
const approveBtn = document.getElementById('approve-btn');
const rejectBtn = document.getElementById('reject-btn');
const logoutBtn = document.getElementById('logout-btn');

// State
let currentUser = null;
let applications = [];
let users = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Auth State Observer
    onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        if (user) {
            try {
                // Check if user is admin
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();
                
                if (userData && userData.role === 'admin') {
                    console.log('Admin user verified');
                    currentUser = user;
                    await loadDashboard();
                } else {
                    console.log('User is not an admin');
                    await signOut(auth);
                    window.location.href = 'admin-login.html';
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                await signOut(auth);
                window.location.href = 'admin-login.html';
            }
        } else {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'admin-login.html';
        }
    });

    // Global event listeners
    window.addEventListener('viewApplication', (event) => {
        console.log('View application event received:', event.detail);
        viewApplication(event.detail);
    });

    window.addEventListener('viewUserDetails', (event) => {
        console.log('View user details event received:', event.detail);
        viewUserDetails(event.detail);
    });

    // Filter and search listeners
    if (statusFilter) {
        statusFilter.addEventListener('change', filterApplications);
    }
    if (searchInput) {
        searchInput.addEventListener('input', filterApplications);
    }

    // Logout listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'admin-login.html';
            }).catch((error) => {
                console.error('Error signing out:', error);
                showToast('Error signing out', 'error');
            });
        });
    }

    // Navigation listeners
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-section');
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            
            // Show target section
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(target).classList.add('active');
        });
    });
});

// Load Dashboard Data
async function loadDashboard() {
    try {
        console.log('Loading dashboard data...');
        await Promise.all([
            loadApplications(),
            loadUsers(),
            loadAnalytics()
        ]);
        console.log('Dashboard data loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Load Applications
async function loadApplications() {
    try {
        console.log('Loading applications...');
        const applicationsRef = collection(db, 'loans');
        const q = query(applicationsRef, orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        applications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Applications loaded:', applications);
        renderApplications();
    } catch (error) {
        console.error('Error loading applications:', error);
        showToast('Error loading applications', 'error');
    }
}

// Render Applications
function renderApplications() {
    console.log('Rendering applications...');
    const tbody = applicationsTable;
    if (!tbody) {
        console.error('Applications table body not found');
        return;
    }

    tbody.innerHTML = '';

    if (applications.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="text-center">No applications found</td>
        `;
        tbody.appendChild(row);
        return;
    }

    applications.forEach(application => {
        // Handle date formatting
        let submissionDate = 'N/A';
        if (application.submittedAt) {
            if (application.submittedAt.toDate) {
                // If it's a Firestore Timestamp
                submissionDate = new Date(application.submittedAt.toDate()).toLocaleDateString();
            } else if (application.submittedAt instanceof Date) {
                // If it's already a Date object
                submissionDate = application.submittedAt.toLocaleDateString();
            } else {
                // If it's a string or other format
                submissionDate = new Date(application.submittedAt).toLocaleDateString();
            }
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${application.id}</td>
            <td>${application.fullName || 'N/A'}</td>
            <td>${application.loanType || 'Personal'}</td>
            <td>$${application.loanAmount || '0'}</td>
            <td><span class="status-badge status-${application.status?.toLowerCase() || 'pending'}">${application.status || 'Pending'}</span></td>
            <td>${submissionDate}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewApplication('${application.id}')">
                    View Details
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View Application Details
async function viewApplication(applicationId) {
    try {
        const application = applications.find(app => app.id === applicationId);
        if (!application) return;

        const modalBody = document.getElementById('application-details');
        modalBody.innerHTML = `
            <div class="application-details">
                <div class="detail-group">
                    <div class="detail-label">Full Name</div>
                    <div class="detail-value">${application.fullName}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${application.email}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${application.phone}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Loan Amount</div>
                    <div class="detail-value">$${application.loanAmount}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Loan Purpose</div>
                    <div class="detail-value">${application.loanPurpose}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Employment Status</div>
                    <div class="detail-value">${application.employmentStatus}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Monthly Income</div>
                    <div class="detail-value">$${application.monthlyIncome}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="status-badge status-${application.status?.toLowerCase() || 'pending'}">${application.status || 'Pending'}</span>
                    </div>
                </div>
            </div>
        `;

        // Store current application ID for approve/reject actions
        approveBtn.onclick = () => updateApplicationStatus(applicationId, 'Approved');
        rejectBtn.onclick = () => updateApplicationStatus(applicationId, 'Rejected');

        applicationDetailsModal.show();
    } catch (error) {
        console.error('Error viewing application:', error);
        showToast('Error loading application details', 'error');
    }
}

// Update Application Status
async function updateApplicationStatus(applicationId, newStatus) {
    try {
        const applicationRef = doc(db, 'loans', applicationId);
        await updateDoc(applicationRef, {
            status: newStatus,
            updatedAt: new Date(),
            updatedBy: currentUser.uid,
            updatedByEmail: currentUser.email
        });

        await loadApplications();
        applicationDetailsModal.hide();
        showToast(`Application ${newStatus.toLowerCase()} successfully`, 'success');
    } catch (error) {
        console.error('Error updating application status:', error);
        showToast('Error updating application status', 'error');
    }
}

// Load Users
async function loadUsers() {
    try {
        console.log('Loading users...');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        users = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Users loaded:', users);
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users', 'error');
    }
}

// Render Users
function renderUsers() {
    console.log('Rendering users...');
    const tbody = usersTable;
    if (!tbody) {
        console.error('Users table body not found');
        return;
    }

    tbody.innerHTML = '';

    if (users.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="text-center">No users found</td>
        `;
        tbody.appendChild(row);
        return;
    }

    users.forEach(user => {
        // Handle date formatting
        let createdAtDate = 'N/A';
        let lastLoginDate = 'N/A';
        
        if (user.createdAt) {
            if (user.createdAt.toDate) {
                createdAtDate = new Date(user.createdAt.toDate()).toLocaleDateString();
            } else if (user.createdAt instanceof Date) {
                createdAtDate = user.createdAt.toLocaleDateString();
            } else {
                createdAtDate = new Date(user.createdAt).toLocaleDateString();
            }
        }

        if (user.lastLogin) {
            if (user.lastLogin.toDate) {
                lastLoginDate = new Date(user.lastLogin.toDate()).toLocaleDateString();
            } else if (user.lastLogin instanceof Date) {
                lastLoginDate = user.lastLogin.toLocaleDateString();
            } else {
                lastLoginDate = new Date(user.lastLogin).toLocaleDateString();
            }
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.fullName || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.phone || 'N/A'}</td>
            <td><span class="badge bg-${user.role === 'admin' ? 'danger' : 'primary'}">${user.role || 'user'}</span></td>
            <td>${createdAtDate}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewUserDetails('${user.id}')">
                    View Details
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View User Details
async function viewUserDetails(userId) {
    try {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Handle date formatting
        let createdAtDate = 'N/A';
        let lastLoginDate = 'N/A';
        
        if (user.createdAt) {
            if (user.createdAt.toDate) {
                createdAtDate = new Date(user.createdAt.toDate()).toLocaleDateString();
            } else if (user.createdAt instanceof Date) {
                createdAtDate = user.createdAt.toLocaleDateString();
            } else {
                createdAtDate = new Date(user.createdAt).toLocaleDateString();
            }
        }

        if (user.lastLogin) {
            if (user.lastLogin.toDate) {
                lastLoginDate = new Date(user.lastLogin.toDate()).toLocaleDateString();
            } else if (user.lastLogin instanceof Date) {
                lastLoginDate = user.lastLogin.toLocaleDateString();
            } else {
                lastLoginDate = new Date(user.lastLogin).toLocaleDateString();
            }
        }

        const modalBody = document.getElementById('user-details');
        modalBody.innerHTML = `
            <div class="user-details">
                <div class="detail-group">
                    <div class="detail-label">Full Name</div>
                    <div class="detail-value">${user.fullName || 'N/A'}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${user.email || 'N/A'}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${user.phone || 'N/A'}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Role</div>
                    <div class="detail-value">
                        <span class="badge bg-${user.role === 'admin' ? 'danger' : 'primary'}">${user.role || 'user'}</span>
                    </div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Created At</div>
                    <div class="detail-value">${createdAtDate}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Last Login</div>
                    <div class="detail-value">${lastLoginDate}</div>
                </div>
            </div>
        `;

        const userModal = new bootstrap.Modal(document.getElementById('userModal'));
        userModal.show();
    } catch (error) {
        console.error('Error viewing user details:', error);
        showToast('Error loading user details', 'error');
    }
}

// Load Analytics
async function loadAnalytics() {
    try {
        const applicationsRef = collection(db, 'loans');
        const q = query(applicationsRef, orderBy('submittedAt', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        
        const analytics = {
            totalApplications: querySnapshot.size,
            pendingApplications: 0,
            approvedApplications: 0,
            rejectedApplications: 0,
            totalLoanAmount: 0
        };

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const status = data.status?.toLowerCase() || 'pending';
            analytics[`${status}Applications`]++;
            analytics.totalLoanAmount += parseFloat(data.loanAmount || 0);
        });

        renderAnalytics(analytics);
    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Error loading analytics', 'error');
    }
}

// Render Analytics
function renderAnalytics(analytics) {
    document.getElementById('total-applications').textContent = analytics.totalApplications;
    document.getElementById('approved-applications').textContent = analytics.approvedApplications;
    document.getElementById('rejected-applications').textContent = analytics.rejectedApplications;
}

// Filter Applications
function filterApplications() {
    const status = statusFilter.value;
    const searchTerm = searchInput.value.toLowerCase();

    const filteredApplications = applications.filter(application => {
        const matchesStatus = status === 'all' || (application.status?.toLowerCase() || 'pending') === status.toLowerCase();
        const matchesSearch = application.fullName.toLowerCase().includes(searchTerm) ||
                            application.email.toLowerCase().includes(searchTerm) ||
                            application.id.includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    renderFilteredApplications(filteredApplications);
}

// Render Filtered Applications
function renderFilteredApplications(filteredApplications) {
    const tbody = applicationsTable;
    tbody.innerHTML = '';

    filteredApplications.forEach(application => {
        // Handle date formatting
        let submissionDate = 'N/A';
        if (application.submittedAt) {
            if (application.submittedAt.toDate) {
                // If it's a Firestore Timestamp
                submissionDate = new Date(application.submittedAt.toDate()).toLocaleDateString();
            } else if (application.submittedAt instanceof Date) {
                // If it's already a Date object
                submissionDate = application.submittedAt.toLocaleDateString();
            } else {
                // If it's a string or other format
                submissionDate = new Date(application.submittedAt).toLocaleDateString();
            }
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${application.id}</td>
            <td>${application.fullName || 'N/A'}</td>
            <td>${application.loanType || 'Personal'}</td>
            <td>$${application.loanAmount || '0'}</td>
            <td><span class="status-badge status-${application.status?.toLowerCase() || 'pending'}">${application.status || 'Pending'}</span></td>
            <td>${submissionDate}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewApplication('${application.id}')">
                    View Details
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
} 