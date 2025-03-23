
document.addEventListener("DOMContentLoaded", function() {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    function updateCalendar(year, month) {
        document.getElementById('currentMonth').textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
        const calendarDiv = document.getElementById('calendar');
        calendarDiv.innerHTML = '';
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 0; i < firstDay; i++) {
            calendarDiv.innerHTML += '<div class="day"></div>';
        }
        for (let day = 1; day <= daysInMonth; day++) {
            let paymentStatus = Math.random() > 0.7 ? 'paid' : Math.random() > 0.5 ? 'overdue' : 'upcoming';
            calendarDiv.innerHTML += `
                <div class="day" data-date="${year}-${month + 1}-${day}">
                    ${day}
                    <div class="payment ${paymentStatus}"></div>
                    <div class="summary">
                        <p>Amount: $${Math.floor(Math.random() * 500)}</p>
                        <p>Status: ${paymentStatus}</p>
                        <p>Interest: $${Math.floor(Math.random() * 50)}</p>
                        <button class="make-payment">Make Payment</button>
                        <button class="request-extension">Request Extension</button>
                    </div>
                </div>
            `;
        }
    }
    
    document.getElementById("prevMonth").addEventListener("click", function() {
        currentMonth--;
        updateCalendar(currentYear, currentMonth);
    });
    
    document.getElementById("nextMonth").addEventListener("click", function() {
        currentMonth++;
        updateCalendar(currentYear, currentMonth);
    });
    
    updateCalendar(currentYear, currentMonth);
});