// loan-application.js
import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { collection, addDoc, getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Form state management
let currentStep = 1;
const totalSteps = 4;
const formData = {};

// DOM Elements
const form = document.getElementById('loan-application-form');
const steps = document.querySelectorAll('.form-step');
const progressBar = document.querySelector('.progress-bar');
const stepIndicators = document.querySelectorAll('.step');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const logoutBtn = document.getElementById('logout-btn');

// Initialize Firebase Auth state listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log('No user is signed in');
        window.location.href = 'index.html';
        return;
    }
    console.log('User is signed in:', user.uid);
});

// Validation rules
const validationRules = {
    fullName: {
        pattern: /^[a-zA-Z\s]{2,50}$/,
        message: 'Please enter a valid name (2-50 characters)'
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    phone: {
        pattern: /^[0-9]{10}$/,
        message: 'Please enter a valid 10-digit phone number'
    },
    monthlyIncome: {
        min: 10000,
        message: 'Monthly income must be at least ₹10,000'
    },
    loanAmount: {
        min: 5000,
        message: 'Loan amount must be at least ₹5,000'
    }
};

// Initialize form
function initForm() {
    updateProgress();
    updateButtons();
    setupValidation();
    setupFileUploads();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    form.addEventListener('submit', handleSubmit);
    prevBtn.addEventListener('click', handlePrevStep);
    nextBtn.addEventListener('click', handleNextStep);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Add direct click handler for submit button
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleSubmit(e);
    });
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    console.log('Submit button clicked');
    
    if (validateStep(currentStep)) {
        // Save final step data
        const currentStepElement = steps[currentStep - 1];
        currentStepElement.querySelectorAll('input, select').forEach(input => {
            if (input.id) {
                formData[input.id] = input.value;
            }
        });

        try {
            // Check if user is authenticated
            const user = auth.currentUser;
            if (!user) {
                console.log('No authenticated user found');
                alert('Please login to submit your application.');
                window.location.href = 'index.html';
                return;
            }

            console.log('User authenticated:', user.uid);
            
            // Create loan application data
            const loanData = {
                ...formData,
                userId: user.uid,
                status: 'Pending',
                submittedAt: new Date().toISOString(),
                applicationId: `LOAN-${Date.now()}`,
                // documents: {
                //     idProof: formData.idProof,
                //     addressProof: formData.addressProof,
                //     incomeProof: formData.incomeProof
                // }
            };

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';

            // Save to Firestore
            try {
                const loansCollection = collection(db, "loans");
                const docRef = await addDoc(loansCollection, loanData);
                console.log('Document written with ID:', docRef.id);

                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'alert alert-success mt-3';
                successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Loan application submitted successfully!';
                form.appendChild(successMessage);

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (firestoreError) {
                console.error('Firestore Error:', firestoreError);
                throw firestoreError;
            }
        } catch (error) {
            console.error('Error:', error);
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger mt-3';
            errorMessage.innerHTML = '<i class="fas fa-exclamation-circle"></i> There was an error submitting your application. Please try again.';
            form.appendChild(errorMessage);
            
            // Reset submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
        }
    } else {
        console.log('Form validation failed');
    }
}

// Handle previous step
function handlePrevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgress();
        updateButtons();
    }
}

// Handle next step
function handleNextStep() {
    if (validateStep(currentStep)) {
        // Save current step data
        const currentStepElement = steps[currentStep - 1];
        currentStepElement.querySelectorAll('input, select').forEach(input => {
            if (input.id) {
                formData[input.id] = input.value;
            }
        });

        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
            updateProgress();
            updateButtons();

            if (currentStep === totalSteps) {
                updateReviewSummary();
            }
        }
    }
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    signOut(auth)
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        });
}

// Update progress bar and step indicators
function updateProgress() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${progress}%`;

    stepIndicators.forEach((step, index) => {
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Update navigation buttons
function updateButtons() {
    prevBtn.disabled = currentStep === 1;
    nextBtn.style.display = currentStep === totalSteps ? 'none' : 'block';
    submitBtn.style.display = currentStep === totalSteps ? 'block' : 'none';
}

// Show current step
function showStep(step) {
    steps.forEach((s, index) => {
        if (index + 1 === step) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
}

// Validate current step
function validateStep(step) {
    const currentStepElement = steps[step - 1];
    const inputs = currentStepElement.querySelectorAll('input, select');
    let isValid = true;

    inputs.forEach(input => {
        if (input.required) {
            const value = input.value.trim();
            const fieldName = input.id;
            const rules = validationRules[fieldName];

            if (!value) {
                isValid = false;
                showError(input, 'This field is required');
            } else if (rules) {
                if (rules.pattern && !rules.pattern.test(value)) {
                    isValid = false;
                    showError(input, rules.message);
                } else if (rules.min && Number(value) < rules.min) {
                    isValid = false;
                    showError(input, rules.message);
                } else {
                    clearError(input);
                }
            }
        }
    });

    return isValid;
}

// Show error message
function showError(input, message) {
    input.classList.add('is-invalid');
    const feedback = input.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
    }
}

// Clear error message
function clearError(input) {
    input.classList.remove('is-invalid');
}

// Setup real-time validation
function setupValidation() {
    form.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => {
            if (input.required) {
                const value = input.value.trim();
                const fieldName = input.id;
                const rules = validationRules[fieldName];

                if (!value) {
                    showError(input, 'This field is required');
                } else if (rules) {
                    if (rules.pattern && !rules.pattern.test(value)) {
                        showError(input, rules.message);
                    } else if (rules.min && Number(value) < rules.min) {
                        showError(input, rules.message);
                    } else {
                        clearError(input);
                    }
                }
            }
        });
    });
}

// Setup file upload preview
function setupFileUploads() {
    form.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const fileSize = file.size / 1024 / 1024; // Convert to MB
                if (fileSize > 5) {
                    showError(input, 'File size must be less than 5MB');
                    e.target.value = '';
                } else {
                    clearError(input);
                }
            }
        });
    });
}

// Update review summary
function updateReviewSummary() {
    const summary = document.getElementById('review-summary');
    summary.innerHTML = '';

    Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'idProof' && key !== 'addressProof' && key !== 'incomeProof') {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const item = document.createElement('div');
            item.className = 'review-item';
            item.innerHTML = `
                <span class="review-label">${label}:</span>
                <span class="review-value">${value}</span>
            `;
            summary.appendChild(item);
        }
    });
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', initForm);