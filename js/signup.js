import { auth, db } from "../firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// DOM Elements
const form = document.getElementById('signup-form');
const submitBtn = form.querySelector('button[type="submit"]');
const spinner = submitBtn.querySelector('.spinner-border');

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
    password: {
        min: 6,
        message: 'Password must be at least 6 characters'
    }
};

// Initialize form
function initForm() {
    setupValidation();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    form.addEventListener('submit', handleSignup);
}

// Setup validation
function setupValidation() {
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            validateField(input);
        });
    });
}

// Validate field
function validateField(input) {
    const value = input.value.trim();
    const fieldName = input.id;
    const rules = validationRules[fieldName];

    if (!value) {
        showError(input, 'This field is required');
        return false;
    }

    if (rules) {
        if (rules.pattern && !rules.pattern.test(value)) {
            showError(input, rules.message);
            return false;
        } else if (rules.min && value.length < rules.min) {
            showError(input, rules.message);
            return false;
        }
    }

    // Special validation for confirm password
    if (fieldName === 'confirmPassword') {
        const password = document.getElementById('password').value;
        if (value !== password) {
            showError(input, 'Passwords do not match');
            return false;
        }
    }

    clearError(input);
    return true;
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

// Handle signup
async function handleSignup(e) {
    e.preventDefault();

    // Validate all fields
    const inputs = form.querySelectorAll('input');
    let isValid = true;
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });

    if (!isValid) return;

    try {
        // Show loading state
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');
        submitBtn.textContent = 'Creating Account...';

        // Get form data
        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            createdAt: new Date().toISOString()
        };

        // Create user account
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            document.getElementById('password').value
        );

        // Store user data in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), formData);

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success';
        successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Account created successfully! Redirecting to login...';
        form.appendChild(successMessage);

        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('Error signing up:', error);
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-danger';
        
        let errorText = 'An error occurred while creating your account.';
        if (error.code === 'auth/email-already-in-use') {
            errorText = 'This email is already registered. Please login instead.';
        } else if (error.code === 'auth/weak-password') {
            errorText = 'Password should be at least 6 characters.';
        }
        
        errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorText}`;
        form.appendChild(errorMessage);

        // Reset button state
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
        submitBtn.textContent = 'Sign Up';
    }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', initForm); 