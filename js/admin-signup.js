// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const form = document.getElementById('adminSignupForm');
const errorAlert = document.getElementById('error-alert');
const successAlert = document.getElementById('success-alert');
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

// Admin code for verification
const ADMIN_CODE = "admin123"; // In production, this should be stored securely

// Show/Hide Password
function togglePasswordVisibility(input, toggle) {
    toggle.addEventListener('click', () => {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggle.classList.toggle('fa-eye');
        toggle.classList.toggle('fa-eye-slash');
    });
}

// Show Alert
function showAlert(message, type) {
    const alert = type === 'error' ? errorAlert : successAlert;
    alert.textContent = message;
    alert.style.display = 'block';
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Validate Phone Number
function validatePhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
}

// Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset alerts
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';

    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const adminCode = document.getElementById('adminCode').value;

    // Validation
    if (!fullName || !email || !phone || !password || !confirmPassword || !adminCode) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }

    if (!validatePhone(phone)) {
        showAlert('Please enter a valid phone number', 'error');
        return;
    }

    if (adminCode !== ADMIN_CODE) {
        showAlert('Invalid admin code', 'error');
        return;
    }

    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store additional user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            fullName,
            email,
            phone,
            role: 'admin',
            createdAt: new Date(),
            lastLogin: new Date()
        });

        showAlert('Admin account created successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 2000);
    } catch (error) {
        console.error('Error creating admin account:', error);
        let errorMessage = 'Error creating admin account';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email is already registered';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak';
                break;
            default:
                errorMessage = error.message;
        }
        
        showAlert(errorMessage, 'error');
    }
});

// Initialize password toggles
togglePasswordVisibility(passwordInput, togglePassword);
togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword); 