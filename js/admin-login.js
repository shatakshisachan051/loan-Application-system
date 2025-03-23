// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const loginForm = document.getElementById('login-email').parentElement;
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');
const errorAlert = document.getElementById('error-alert');
const successAlert = document.getElementById('success-alert');
const togglePassword = document.getElementById('togglePassword');
const rememberMeCheckbox = document.getElementById('rememberMe');

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

// Event Listeners
loginButton.addEventListener('click', handleLogin);

async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';

        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if user is admin
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (userData && userData.role === 'admin') {
            showMessage('Login successful! Redirecting...', 'success');
            // Update last login
            await updateLastLogin(user.uid);
            // Redirect to admin dashboard
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } else {
            // If not admin, sign out and show error
            await auth.signOut();
            showMessage('Access denied. Admin privileges required.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            default:
                errorMessage = 'Login failed. Please try again.';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
}

async function updateLastLogin(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            lastLogin: new Date()
        });
    } catch (error) {
        console.error('Error updating last login:', error);
    }
}

function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = type === 'error' ? 'error' : 'success';
    loginMessage.style.display = 'block';
    
    // Clear message after 3 seconds
    setTimeout(() => {
        loginMessage.style.display = 'none';
    }, 3000);
}

// Initialize password toggle
togglePasswordVisibility(passwordInput, togglePassword);

// Check for saved email
const savedEmail = localStorage.getItem('adminEmail');
if (savedEmail) {
    document.getElementById('login-email').value = savedEmail;
    rememberMeCheckbox.checked = true;
}

// Save email if remember me is checked
rememberMeCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        localStorage.setItem('adminEmail', document.getElementById('login-email').value);
    } else {
        localStorage.removeItem('adminEmail');
    }
}); 