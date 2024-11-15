import { ShadeSwap } from 'shade.js';

// Initialize ShadeSwap
const shadeSwap = new ShadeSwap();

// Function to fetch and display SHD token price
export async function fetchShdPrice() {
    try {
        const shdPrice = await shadeSwap.getTokenPrice('SHD');
        document.getElementById('shd-price').innerText = `Current SHD Price: ${shdPrice} USD`;
    } catch (error) {
        console.error('Error fetching SHD price:', error);
        document.getElementById('shd-price').innerText = 'Error fetching SHD price';
    }
}

// Optionally, you can set a refresh interval
setInterval(fetchShdPrice, 60000); // Refresh every 60 seconds
