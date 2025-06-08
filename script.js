// Matrix rain effect
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
const drops = Array(Math.floor(canvas.width/20)).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0F0';
    
    drops.forEach((drop, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i*20, drop*20);
        drops[i] = (drop*20 > canvas.height && Math.random() > 0.975) ? 0 : drop + 1;
    });
}

setInterval(drawMatrix, 50);

// Custom cursor
// Custom cursor
const cursor = document.querySelector('.custom-cursor');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

document.addEventListener('mousedown', () => {
    cursor.classList.add('clicked');
    cursor.style.width = '15px';
    cursor.style.height = '15px';
});

document.addEventListener('mouseup', () => {
    cursor.classList.remove('clicked');
    cursor.style.width = '20px';
    cursor.style.height = '20px';
});

document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.classList.contains('project-card')) {
        cursor.classList.add('active');
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.classList.contains('project-card')) {
        cursor.classList.remove('active');
    }
});


// Add new console functionality
const consoleInput = document.getElementById('console-input');
const consoleOutput = document.getElementById('console-output');

const COMMANDS = {
    whoami: {
        description: 'Display identity information',
        execute: () => {
            return `USER: NAVEENRAJ_R
ROLE: SECURITY_ENGINEER
STATUS: Active
ACCESS_LEVEL: Root
CURRENT_COMPANY: Freshworks`;
        }
    },
    help: {
        description: 'Show available commands',
        execute: () => {
            return `AVAILABLE COMMANDS:
------------------
whoami          Display identity information
ls skills       List technical skills
pwd            Show current position
cat exp        Display work experience details
cat cert       Display certifications
contact        Show contact information
clear          Clear the console screen

Usage: Type any command and press Enter`;
        }
    },
    'ls skills': {
        description: 'List technical skills',
        execute: () => {
            return `SECURITY_PRACTICES/
  ├── DAST_SAST_OSL
  ├── API_SECURITY
  ├── WEB_APP_PENTESTING
  ├── DEVSECOPS_PIPELINE
  └── AZURE_WAF_CONFIG

TOOLS_ARSENAL/
  ├── PYTHON_JAVA
  ├── BURPSUITE_NMAP
  ├── METASPLOIT_NIKTO
  ├── FORTIFY_COVERITY
  └── MEND_WHITESOURCE`;
        }
    },
    pwd: {
        description: 'Show current position',
        execute: () => {
            return `/freshworks/security-engineer`;
        }
    },
    'cat exp': {
        description: 'Display work experience',
        execute: () => {
            return `FILE: experience.txt
------------------
CURRENT_POSITION {
    COMPANY: Freshworks
    ROLE: Security Engineer
    DURATION: Sep 2024 - Present
    LOCATION: Chennai, Tamil Nadu, India
}

PREVIOUS_POSITIONS [
    {
        COMPANY: Temenos
        ROLE: Associate Engineer - Product Security
        DURATION: Oct 2022 - Sep 2024
        LOCATION: Tamil Nadu, India
    },
    {
        COMPANY: Temenos
        ROLE: Internship Trainee
        DURATION: Mar 2022 - Sep 2022
        LOCATION: Chennai, Tamil Nadu, India
    }
]`;
        }
    },
    'cat cert': {
        description: 'Display certifications',
        execute: () => {
            return `FILE: certifications.txt
------------------
CERTIFICATIONS [
    {
        TITLE: Certified DevSecOps Professional (CDP)
        ISSUED: Jan 2025
        CREDENTIAL: https://www.credly.com/badges/da5b007d-2425-4e26-97d8-ea8e9f732f93
    },
    {
        TITLE: Certified Appsec Practitioner
        ISSUED: Feb 2023
        CREDENTIAL: https://drive.google.com/file/d/1mMWkp4IJ5_HVtYR2TxY9V2p7386MqZMw/view?usp=drivesdk
    }
]`;
        }
    },
    contact: {
        description: 'Display contact information',
        execute: () => {
            return `CONTACT_INFO {
    EMAIL: naveenraj2001ravi@gmail.com
    LOCATION: Chennai, Tamil Nadu, India
    LINKEDIN: naveenraj-r-658658150
}`;
        }
    },
    clear: {
        description: 'Clear the console',
        execute: () => {
            consoleOutput.innerHTML = '';
            return '';
        }
    }
};

function addConsoleOutput(text, className = '') {
    const line = document.createElement('p');
    line.className = `console-line ${className}`;
    line.textContent = text; // Use textContent to prevent script execution
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

consoleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const command = consoleInput.value.trim().toLowerCase();
        addConsoleOutput(`> ${command}`);
        
        if (command in COMMANDS) {
            const output = COMMANDS[command].execute();
            if (output) {
                addConsoleOutput(`> ${output}`);
            }
        } else if (command) {
            addConsoleOutput(`> Command not found: ${command}. Type 'help' for available commands.`, 'error-text');
        }

        consoleInput.value = '';
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
});

// Add terminal typing effect
const heroText = document.querySelector('.hero p');
const originalText = heroText.innerHTML;
heroText.innerHTML = '';

let i = 0;
function typeWriter() {
    if (i < originalText.length) {
        heroText.innerHTML += originalText.charAt(i);
        i++;
        setTimeout(typeWriter, Math.random() * 50);
    }
}
typeWriter();

// Automatic image toggle
const profileImages = document.querySelectorAll('.profile-img');
let currentImageIndex = 0;

function toggleImages() {
    profileImages.forEach((img, index) => {
        img.classList.toggle('active', index === currentImageIndex);
    });
    currentImageIndex = (currentImageIndex + 1) % profileImages.length;
}

setInterval(toggleImages, 1200);

// Image toggle functionality
const toggleBtn = document.querySelector('.image-toggle-btn');

toggleBtn.addEventListener('click', () => {
    profileImages.forEach(img => {
        img.classList.toggle('active');
    });
});