console.log("Email Writer Extension - Content Script Loaded");

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7T-I-atl L3';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}

function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
    }
    return '';  // Return empty string if no content is found
}

function findComposeToolbar() {
    const selectors = [
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
    }
    return null;  // Return null if toolbar not found
}

async function generateAIReply() {
    try {
        const emailContent = getEmailContent();
        const response = await fetch('http://localhost:8080/api/email/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "emailContent": emailContent,
                "tone": "professional"
            })
        });
        if (!response.ok) {
            throw new Error('API Request Failed');
        }
        const generatedReply = await response.text();
        return generatedReply;
    } catch (error) {
        console.error(error);
        alert('Failed to generate reply');
        return null;
    }
}

async function handleAIButtonClick(button) {
    button.innerHTML = 'Generating...';
    button.disabled = true;
    
    const generatedReply = await generateAIReply();
    if (!generatedReply) {
        button.innerHTML = 'AI Reply';
        button.disabled = false;
        return;
    }
    
    // Use the updated selector for Gmail’s compose box.
    const composeBox = document.querySelector('.Am.Al.editable');
    if (composeBox) {
        composeBox.focus();
        // Insert the generated reply into the compose box.
        composeBox.innerHTML = generatedReply;
    } else {
        console.error('Compose box not found');
    }
    
    button.innerHTML = 'AI Reply';
    button.disabled = false;
}

function injectButton() {
    // Remove any existing button to prevent duplicates.
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }
    console.log("Toolbar found, creating AI button");
    const button = createAIButton();
    button.classList.add('ai-reply-button');

    button.addEventListener('click', () => {
        handleAIButtonClick(button);
    });

    // Insert the button at the beginning of the toolbar.
    toolbar.insertBefore(button, toolbar.firstChild);
}

// Use MutationObserver to detect when the Gmail compose window is added.
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        const addedNodes = mutation.addedNodes ? Array.from(mutation.addedNodes) : [];
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );
        if (hasComposeElements) {
            console.log("Compose Window Detected");
            // Wait a moment for the UI to settle before injecting the button.
            setTimeout(injectButton, 500);
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
