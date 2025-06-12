// Variables for managing game state
let playerCharge = 0; // Player's charge points
let aiCharge = 0; // AI's charge points
let playerAction = ''; // Player's chosen action
let aiAction = ''; // AI's chosen action
let gameOver = false; // Game over flag
let gameHistory = []; // Game history (for AI learning/thinking)
let turnCount = 0; // Turn counter

// Define cost for each action
const actionCosts = {
charge: 0, // "Charge" adds to charge, not costs
guard: 1, // Guard cost
reflect: 2, // Reflect cost
attack: 3 // Attack cost
};

// Get references to DOM elements
const playerChargeDisplay = document.getElementById('playerCharge');
const aiChargeDisplay = document.getElementById('aiCharge');
const messageArea = document.getElementById('messageArea');
const actionButtons = document.getElementById('actionButtons');
const restartButton = document.getElementById('restartButton');
const turnDisplayArea = document.getElementById('turnDisplayArea');
const playerChoiceIcon = document.getElementById('playerChoiceIcon');
const aiChoiceIcon = document.getElementById('aiChoiceIcon');

// Map for action names and display icons
const actionDisplayMap = {
charge: '貯',
guard: 'ガ',
reflect: '反',
attack: '攻'
};

/**
* Function to reset the game to its initial state
*/
function initializeGame() {
playerCharge = 0; // Reset player's charge
aiCharge = 0; // Reset AI's charge
playerAction = ''; // Reset player's action
aiAction = ''; // Reset AI's action
gameOver = false; // Reset game over flag
gameHistory = []; // Reset game history
turnCount = 0; // Reset turn count
updateUI(true); // Update UI (no animation during initialization)
messageArea.textContent = 'アクションを選んでください！'; // Initial message
messageArea.classList.add('visible'); // Show message area
messageArea.classList.remove('win-message', 'lose-message', 'draw-message'); // Remove outcome styles
actionButtons.classList.remove('hidden'); // Show action buttons
restartButton.classList.add('hidden'); // Hide "Play Again" button
playerChoiceIcon.classList.add('hidden'); // Hide icons
aiChoiceIcon.classList.add('hidden'); // Hide icons
turnDisplayArea.classList.remove('visible'); // Hide turn display area
// Enable all buttons
actionButtons.querySelectorAll('.action-button').forEach(button => button.disabled = false);
}

/**
* Function to update the display of charge points
* @param {boolean} [initial=false] - Whether it's during initialization (for animation control)
*/
function updateUI(initial = false) {
// Update player's charge points and animation
const oldPlayerCharge = parseInt(playerChargeDisplay.textContent);
if (oldPlayerCharge !== playerCharge && !initial) {
playerChargeDisplay.classList.add('pulse');
setTimeout(() => playerChargeDisplay.classList.remove('pulse'), 300);
}
playerChargeDisplay.textContent = playerCharge;

// Update AI's charge points and animation
const oldAiCharge = parseInt(aiChargeDisplay.textContent);
if (oldAiCharge !== aiCharge && !initial) {
aiChargeDisplay.classList.add('pulse');
setTimeout(() => aiChargeDisplay.classList.remove('pulse'), 300);
}
aiChargeDisplay.textContent = aiCharge;
}

/**
* Function to determine AI's action (smarter logic)
* @param {number} currentAiCharge - Current AI's charge points
* @param {number} currentPlayerCharge - Current player's charge points
* @param {Array<Object>} history - Past game history
* @returns {string} AI's chosen action ('charge', 'guard', 'reflect', 'attack')
*/
function getAiAction(currentAiCharge, currentPlayerCharge, history) {
let chosenAction = 'charge'; // Default to charge

// AI's action possibilities
const canAiAttack = currentAiCharge >= actionCosts.attack;
const canAiReflect = currentAiCharge >= actionCosts.reflect;
const canAiGuard = currentAiCharge >= actionCosts.guard;

// Player's action possibilities
const playerCanAttack = currentPlayerCharge >= actionCosts.attack;
const playerCanReflect = currentPlayerCharge >= actionCosts.reflect;
const playerCanGuard = currentPlayerCharge >= actionCosts.guard;

// Get player's last actual action (for AI thinking)
const lastPlayerActualAction = history.length > 0 ? history[history.length - 1].playerActual : null;
const lastAiActualAction = history.length > 0 ? history[history.length - 1].aiActual : null;

// AI decision-making logic
// Priority: Aim for victory > Defend against player attack > Increase charge / Exploit player's low charge > Learn from history > Random

// 1. Aim for decisive victory (if AI can attack and player cannot defend)
// If the player cannot guard or reflect, prioritize attack
if (canAiAttack && (!playerCanGuard && !playerCanReflect && currentPlayerCharge < actionCosts.guard)) {
if (Math.random() < 0.9) return 'attack'; // 90% chance to attack
}

// 2. Defend/reflect player's attack (if player can attack)
if (playerCanAttack) {
// If player is likely to attack, try to reflect or guard
if (canAiReflect && Math.random() < 0.6) { // If AI can reflect, 60% chance to reflect
return 'reflect';
} else if (canAiGuard && Math.random() < 0.7) { // Even if cannot reflect, guard (70% chance to guard)
return 'guard';
}
}

// 3. If player's charge is low, or they just charged, AI considers attacking
if (currentPlayerCharge < actionCosts.attack || lastPlayerActualAction === 'charge') {
if (canAiAttack && Math.random() < 0.75) { // 75% chance to attack
return 'attack';
}
}

// 4. If AI's charge is low, or player just defended, AI considers charging
if (currentAiCharge < actionCosts.attack) { // If AI's charge is less than attack cost
if (Math.random() < 0.8) return 'charge'; // 80% chance to charge
}

// 5. Learn player's common tendencies (simplified)
// Analyze player's actions in the last 5 turns
const recentPlayerActions = history.slice(Math.max(0, history.length - 5)).map(h => h.playerActual);
const chargeCount = recentPlayerActions.filter(a => a === 'charge').length;
const attackCount = recentPlayerActions.filter(a => a === 'attack').length;
const guardCount = recentPlayerActions.filter(a => a === 'guard').length;
const reflectCount = recentPlayerActions.filter(a => a === 'reflect').length;


if (chargeCount >= 3 && canAiAttack) { // If player charged 3 or more times, consider attacking
if (Math.random() < 0.85) return 'attack'; // 85% chance to attack
}
if (attackCount >= 3) { // If player attacked 3 or more times, consider defending
if (canAiReflect && Math.random() < 0.7) return 'reflect'; // Prioritize reflect
if (canAiGuard && Math.random() < 0.9) return 'guard';
}
if (guardCount >= 3 && currentAiCharge < actionCosts.attack) { // If player guarded 3 or more times, AI charges
if (Math.random() < 0.75) return 'charge';
}
if (reflectCount >= 3 && canAiAttack) { // If player reflected 3 or more times, AI avoids attacking and charges
if (Math.random() < 0.6) return 'charge'; // 60% chance to charge
}

// 6. If player's charge is higher than AI's, AI prioritizes increasing charge
if (currentPlayerCharge > currentAiCharge && currentAiCharge < actionCosts.attack) {
if (Math.random() < 0.9) return 'charge';
}

// 7. Final fallback (if costs are not met, or no optimal action found)
// Random element
const randomChance = Math.random();
if (currentAiCharge >= actionCosts.attack && randomChance < 0.3) return 'attack';
if (currentAiCharge >= actionCosts.reflect && randomChance < 0.6) return 'reflect';
if (currentAiCharge >= actionCosts.guard && randomChance < 0.9) return 'guard';

return 'charge'; // If none of the above apply, or cost is insufficient, charge
}

/**
* Function to process one turn of the game
*/
function processTurn() {
turnCount++; // Increment turn count

// Record charge points at the beginning of the turn (for AI learning)
const initialPlayerCharge = playerCharge;
const initialAiCharge = aiCharge;

// Variables for player and AI's actual actions (adjusted if charge is insufficient)
let actualPlayerAction = playerAction;
let actualAiAction = aiAction;
let currentMessage = ''; // Message for the current turn

// If player's charge is insufficient, force to "charge"
if (playerAction !== 'charge' && playerCharge < actionCosts[playerAction]) {
actualPlayerAction = 'charge';
}

// If AI's charge is insufficient, force to "charge"
if (aiAction !== 'charge' && aiCharge < actionCosts[aiAction]) {
actualAiAction = 'charge';
}

// Update and display action icons
playerChoiceIcon.textContent = actionDisplayMap[actualPlayerAction];
aiChoiceIcon.textContent = actionDisplayMap[actualAiAction];
playerChoiceIcon.classList.remove('hidden');
aiChoiceIcon.classList.remove('hidden');
turnDisplayArea.classList.add('visible'); // Show turn display area

// Consume and gain charge points
if (actualPlayerAction === 'charge') {
playerCharge += 1; // Charge adds +1
} else {
playerCharge -= actionCosts[actualPlayerAction]; // Otherwise, consume cost
}

if (actualAiAction === 'charge') {
aiCharge += 1; // Charge adds +1
} else {
aiCharge -= actionCosts[actualAiAction]; // Otherwise, consume cost
}

// Win/Loss determination logic
let roundWinner = null; // Stores 'player', 'ai', 'draw', or null

// Player's attack vs. AI's action combinations
if (actualPlayerAction === 'attack') {
if (actualAiAction === 'charge') {
roundWinner = 'player';
currentMessage = 'あなたの攻撃がAIに命中！'; // Only the core message
} else if (actualAiAction === 'guard') {
currentMessage = 'あなたの攻撃はAIにガードされた！';
} else if (actualAiAction === 'reflect') {
roundWinner = 'ai';
currentMessage = 'あなたの攻撃はAIに反射された！';
} else if (actualAiAction === 'attack') {
roundWinner = 'draw';
currentMessage = '両者攻撃！';
}
}
// AI's attack vs. Player's action combinations
else if (actualAiAction === 'attack') {
if (actualPlayerAction === 'charge') {
roundWinner = 'ai';
currentMessage = 'AIの攻撃があなたに命中！';
} else if (actualPlayerAction === 'guard') {
currentMessage = 'AIの攻撃はあなたにガードされた！';
} else if (actualPlayerAction === 'reflect') {
roundWinner = 'player';
currentMessage = 'AIの攻撃はあなたに反射された！';
}
}
// Other action combinations (not attack)
else {
currentMessage = '特になにも起こらなかった。'; // Draw, game continues
}

// Bonus every 3 turns for the player with less charge
if (turnCount % 3 === 0 && !roundWinner) { // Only if game is not over
const bonus = Math.floor(Math.random() * 3) + 1; // Random number from 1 to 3
let bonusRecipient = null;
if (playerCharge < aiCharge) {
playerCharge += bonus;
bonusRecipient = 'あなた';
} else if (aiCharge < playerCharge) {
aiCharge += bonus;
bonusRecipient = 'AI';
}

if (bonusRecipient) {
currentMessage += `\n\nボーナス！ ${bonusRecipient}に貯めポイントが${bonus}加算されました！`;
}
}

// Apply animation before updating message area
messageArea.classList.remove('visible', 'win-message', 'lose-message', 'draw-message'); // Hide and remove previous styles
setTimeout(() => {
messageArea.textContent = currentMessage;
// Add outcome specific classes
if (roundWinner === 'player') {
messageArea.textContent += ' あなたの勝ち！';
messageArea.classList.add('win-message');
} else if (roundWinner === 'ai') {
messageArea.textContent += ' AIの勝ち！';
messageArea.classList.add('lose-message');
} else if (roundWinner === 'draw' && (actualPlayerAction === 'attack' || actualAiAction === 'attack')) {
messageArea.textContent += ' 引き分け！';
messageArea.classList.add('draw-message');
} else if (currentMessage === '特になにも起こらなかった。') {
messageArea.classList.add('draw-message'); // Use draw-message style for neutral outcome
}
messageArea.classList.add('visible'); // Show message with animation
updateUI(); // Update charge points (with animation)
}, 300); // Show new message after 300ms

// Add to game history (for AI learning)
gameHistory.push({
turn: turnCount,
playerChosen: playerAction, // Player's chosen action
playerActual: actualPlayerAction, // Player's actual action (corrected if charge insufficient)
aiChosen: aiAction, // AI's chosen action
aiActual: actualAiAction, // AI's actual action
playerChargeBefore: initialPlayerCharge,
aiChargeBefore: initialAiCharge,
outcome: roundWinner // 'player', 'ai', 'draw', null (continue)
});

// Temporarily disable action buttons
actionButtons.querySelectorAll('.action-button').forEach(button => button.disabled = true);

if (roundWinner) { // If game ends
gameOver = true;
setTimeout(() => {
actionButtons.classList.add('hidden'); // Hide action buttons
restartButton.classList.remove('hidden'); // Show "Play Again" button
turnDisplayArea.classList.remove('visible'); // Hide turn display area
playerChoiceIcon.classList.add('hidden');
aiChoiceIcon.classList.add('hidden');
}, 1200); // Wait a bit longer when game ends (1.2 seconds)
} else { // If game continues
setTimeout(() => {
messageArea.classList.remove('visible', 'win-message', 'lose-message', 'draw-message'); // Hide and remove styles for next message
turnDisplayArea.classList.remove('visible'); // Hide turn display area
playerChoiceIcon.classList.add('hidden');
aiChoiceIcon.classList.add('hidden');

setTimeout(() => {
messageArea.textContent = 'アクションを選んでください！'; // Reset message
messageArea.classList.add('visible'); // Show message area
actionButtons.querySelectorAll('.action-button').forEach(button => button.disabled = false); // Enable action buttons
playerAction = ''; // Reset player's action
aiAction = ''; // Reset AI's action
}, 300); // Reset message after 300ms
}, 800); // Normal turn progression waits shorter (0.8 seconds)
}
}

/**
* Helper function to convert English action names to Japanese
* @param {string} action - English action name
* @returns {string} Japanese action name
*/
function getActionName(action) {
switch (action) {
case 'charge': return '貯める';
case 'guard': return 'ガード';
case 'reflect': return '反射';
case 'attack': return '攻撃';
default: return ''; // Unknown action
}
}

// Register event listeners
// Handler for action button clicks
actionButtons.addEventListener('click', (event) => {
// Check if a button with class 'action-button' was clicked and game is not over
if (event.target.closest('.action-button') && !gameOver) {
playerAction = event.target.closest('.action-button').dataset.action; // Set player's action
// Determine AI's action, passing current player and AI charge, and game history
aiAction = getAiAction(aiCharge, playerCharge, gameHistory);
processTurn(); // Start turn processing
}
});

// Handler for "Play Again" button click
restartButton.addEventListener('click', () => {
initializeGame(); // Initialize and restart game
});

// Start the game when the page loads
initializeGame();
