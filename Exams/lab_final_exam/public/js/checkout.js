
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('checkoutForm');
    const successMessage = document.getElementById('successMessage');
    
    function validateName(input) {
        const nameRegex = /^[A-Za-z]+$/;
        return nameRegex.test(input.value);
    }
    
    function validateEmail(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input.value);
    }
    
    function validatePhone(input) {
        const phoneRegex = /^[0-9]{10,15}$/;
        return phoneRegex.test(input.value);
    }
    
    function validateRequired(input) {
        return input.value.trim() !== '';
    }
    
    function validateCardNumber(input) {
        const cardRegex = /^[0-9]{16}$/;
        return cardRegex.test(input.value);
    }
    
    function validateExpiryDate(input) {
        const dateRegex = /^(0[1-9]|1[0-2])\/20[2-9][0-9]$/;
        if (!dateRegex.test(input.value)) {
            return false;
        }
        
        const [month, year] = input.value.split('/');
        const expiryDate = new Date(parseInt(year), parseInt(month) - 1);
        const currentDate = new Date();
        
        return expiryDate > currentDate;
    }
    
    function validateCVV(input) {
        const cvvRegex = /^[0-9]{3}$/;
        return cvvRegex.test(input.value);
    }
    
    function showError(input, errorDiv) {
        input.classList.add('invalid');
        errorDiv.style.display = 'block';
    }
    
    function hideError(input, errorDiv) {
        input.classList.remove('invalid');
        errorDiv.style.display = 'none';
    }
    
    const validationFields = [
        { input: document.getElementById('title'), error: document.getElementById('titleError'), validator: validateRequired },
        { input: document.getElementById('firstName'), error: document.getElementById('firstNameError'), validator: validateName },
        { input: document.getElementById('lastName'), error: document.getElementById('lastNameError'), validator: validateName },
        { input: document.getElementById('phone'), error: document.getElementById('phoneError'), validator: validatePhone },
        { input: document.getElementById('email'), error: document.getElementById('emailError'), validator: validateEmail },
        { input: document.getElementById('address'), error: document.getElementById('addressError'), validator: validateRequired },
        { input: document.getElementById('city'), error: document.getElementById('cityError'), validator: validateRequired },
        { input: document.getElementById('postcode'), error: document.getElementById('postcodeError'), validator: validateRequired },
        { input: document.getElementById('country'), error: document.getElementById('countryError'), validator: validateRequired },
        { input: document.getElementById('cardNumber'), error: document.getElementById('cardNumberError'), validator: validateCardNumber },
        { input: document.getElementById('expiryDate'), error: document.getElementById('expiryDateError'), validator: validateExpiryDate },
        { input: document.getElementById('cvv'), error: document.getElementById('cvvError'), validator: validateCVV }
    ];
    
    validationFields.forEach(field => {
        field.input.addEventListener('input', function() {
            if (field.validator(field.input)) {
                hideError(field.input, field.error);
            }
        });
        
        field.input.addEventListener('blur', function() {
            if (!field.validator(field.input)) {
                showError(field.input, field.error);
            }
        });
    });
    
    document.getElementById('cardNumber').addEventListener('input', function(e) {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 16) {
            value = value.slice(0, 16);
        }
        
        this.value = value;
    });
    
    document.getElementById('expiryDate').addEventListener('input', function(e) {
        let value = this.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 2) {
                this.value = value;
            } 
            else if (value.length <= 6) {
                this.value = value.slice(0, 2) + '/' + value.slice(2);
            }
        }
    });
    
    const deliveryOptions = document.querySelectorAll('.delivery-option');
    deliveryOptions.forEach(option => {
        option.addEventListener('click', function() {
            deliveryOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let hasError = false;
        validationFields.forEach(field => {
            if (!field.validator(field.input)) {
                showError(field.input, field.error);
                hasError = true;
            } else {
                hideError(field.input, field.error);
            }
        });
        
        if (!hasError) {
            successMessage.style.display = 'block';
            document.getElementById('deliveryForm').style.display = 'none';
            setTimeout(() => {
                form.reset();
                successMessage.style.display = 'none';
                document.getElementById('deliveryForm').style.display = 'block';
            }, 3000);

            document.querySelector('.step.active').classList.remove('active');
            document.querySelectorAll('.step')[1].classList.add('active');
        }
    });
});
