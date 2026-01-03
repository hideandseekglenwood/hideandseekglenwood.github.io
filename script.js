// Game State
const state = {
    drawPile: [],
    discardPile: [],
    hand: [],
    maxHandSize: 6,
    isProcessing: false
};

// DOM Elements
const els = {
    drawPileScore: document.getElementById('deck-count'),
    discardPileScore: document.getElementById('discard-count'),
    handContainer: document.getElementById('player-hand'),
    handCount: document.getElementById('hand-count'),
    statusBar: document.getElementById('status-bar'),
    modalOverlay: document.getElementById('modal-overlay'),
    selectionModal: document.getElementById('selection-modal'),
    selectionGrid: document.getElementById('selection-grid'),
    selectionTitle: document.getElementById('selection-title'),
    selectionDesc: document.getElementById('selection-desc'),
    diceModal: document.getElementById('dice-modal'),
    diceResult: document.getElementById('dice-result'),
    cardDetailModal: document.getElementById('card-detail-modal'),
    detailCardView: document.getElementById('detail-card-view'),
    messageModal: document.getElementById('message-modal'),
    msgTitle: document.getElementById('msg-title'),
    msgBody: document.getElementById('msg-body'),

    // Buttons
    btnRollDice: document.getElementById('roll-dice-action'),
    btnCloseDice: document.getElementById('close-dice'),
    btnCastCard: document.getElementById('cast-card-btn'),
    btnCloseDetail: document.getElementById('close-detail'),
    btnCloseMsg: document.getElementById('close-msg'),
    diceTrigger: document.getElementById('dice-btn'),

    // Slider
    sliderContainer: document.getElementById('reset-slider-container'),
    sliderThumb: document.getElementById('reset-thumb'),

    // Confirmation
    confirmModal: document.getElementById('confirm-modal'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmBody: document.getElementById('confirm-body'),
    confirmYes: document.getElementById('confirm-yes'),
    confirmNo: document.getElementById('confirm-no'),

    // Selection Confirm
    btnConfirmSelection: document.getElementById('confirm-selection-btn')
};

// --- Initialization & Persistence ---

function initGame() {
    // Check local storage
    const savedState = localStorage.getItem('glenwood_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            state.drawPile = parsed.drawPile;
            state.discardPile = parsed.discardPile;
            state.hand = parsed.hand;
            updateUI();
            log("Game loaded from storage.");
            return;
        } catch (e) {
            console.error("Failed to load save", e);
        }
    }

    // New Game
    resetState();
}

function resetState() {
    // 1. Inflate Deck
    const rawDeck = [];
    CARD_DATA.forEach(cardTemplate => {
        for (let i = 0; i < cardTemplate.count; i++) {
            rawDeck.push({
                ...cardTemplate,
                uid: Math.random().toString(36).substr(2, 9)
            });
        }
    });

    state.drawPile = shuffle(rawDeck);
    state.discardPile = [];
    state.hand = [];
    saveState();
    updateUI();
    log("New game initialized.");
}

function saveState() {
    localStorage.setItem('glenwood_state', JSON.stringify({
        drawPile: state.drawPile,
        discardPile: state.discardPile,
        hand: state.hand
    }));
}

// --- Core Logic ---

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function drawCards(count) {
    if (state.drawPile.length < count) {
        if (state.discardPile.length > 0) {
            log("Reshuffling discard pile into deck...");
            state.drawPile = state.drawPile.concat(shuffle(state.discardPile));
            state.discardPile = [];
        } else {
            showMessage("Deck Empty", "No more cards in the draw pile!");
            return [];
        }
    }

    const drawn = [];
    for (let i = 0; i < count; i++) {
        if (state.drawPile.length > 0) drawn.push(state.drawPile.pop());
    }
    saveState();
    updateUI();
    return drawn;
}

function addToHand(card) {
    if (state.hand.length >= state.maxHandSize) {
        // Force discard
        promptDiscardForLimit(card);
    } else {
        state.hand.push(card);
        saveState();
        updateUI();
    }
}

function discardCard(cardUid) {
    const idx = state.hand.findIndex(c => c.uid === cardUid);
    if (idx > -1) {
        const card = state.hand.splice(idx, 1)[0];
        state.discardPile.push(card);
        saveState();
        updateUI();
        return card;
    }
    return null;
}

// --- Interaction Flows ---

function startDrawFlow(drawCount, keepCount = 1) {
    const drawnDetails = drawCards(drawCount);
    if (drawnDetails.length === 0) return;

    // Show Modal - Logic adjusted to verify total count
    // If hand is full, user will have (6 + keepCount) candidates eventually? 
    // Actually the flow is: Draw X -> Pick Y to Keep.
    // If Hand + Y > 6, we must discard (Hand + Y - 6).

    // CURRENT FLOW:
    // 1. Show X new cards.
    // 2. Select Y to keep.
    // 3. Add Y to hand.

    // NEW FLOW for Full Hand Support:
    // User picks Y to KEEP from the NEW cards.
    // THEN, if Hand + Y > 6, we trigger a "Trim Hand" flow.

    showSelectionModal(drawnDetails, keepCount, "Keep", (selectedNewCards) => {
        // 1. Identify discard pile candidates (unselected new cards)
        const unselected = drawnDetails.filter(d => !selectedNewCards.includes(d));
        unselected.forEach(c => state.discardPile.push(c));

        // 2. Add selected to hand TEMP (might overflow)
        selectedNewCards.forEach(c => state.hand.push(c));

        // 3. Check for overflow
        if (state.hand.length > state.maxHandSize) {
            const overflow = state.hand.length - state.maxHandSize;

            // Trigger Discard from Hand, BUT exclude the newly added cards from being discarded immediately?
            // User request: "shouldnt include the card that was just drawn... in the popup where you have to discard".
            // So we pass the `selectedNewCards` UIDs as an exclusion list.
            const protectedUids = selectedNewCards.map(c => c.uid);

            handleDiscardPrompt(overflow, () => {
                saveState();
                updateUI();
                log(`Drew ${drawCount}, Kept ${keepCount}, Trimmed ${overflow}.`);
            }, protectedUids);
        } else {
            saveState();
            updateUI();
            log(`Drew ${drawCount}, kept ${keepCount}.`);
        }
    }, true); // Add a "Cancel/Skip" option to the modal?
}

function handleDiscardPrompt(count, onComplete, protectedUids = []) {
    // Check if we HAVE enough cards first (handled by caller usually, but safety check)
    // We reuse the Selection Modal but populate it with HAND cards

    // Filter out protected cards
    const discardableOptions = state.hand.filter(c => !protectedUids.includes(c.uid));

    showSelectionModal(discardableOptions, count, "Discard", (selectedCards) => {
        // These are the cards to discard
        selectedCards.forEach(c => discardCard(c.uid));
        onComplete();
    });
}


// --- UI Updates ---

function createCardEl(card) {
    const el = document.createElement('div');
    el.className = `card ${card.type.replace(/\s/g, ' ')}`; // Fix space replacement
    el.dataset.uid = card.uid;
    el.innerHTML = `
        <div class="card-header">
            <span class="card-type">${card.type}</span>
        </div>
        <h3 class="card-title">${card.title}</h3>
        <p class="card-desc">${card.description}</p>
        <div class="card-cost">${card.cost}</div>
    `;
    return el;
}

function updateUI() {
    // Scores
    els.drawPileScore.textContent = state.drawPile.length;
    els.discardPileScore.textContent = state.discardPile.length;
    els.handCount.textContent = `${state.hand.length}/${state.maxHandSize}`;

    // Hand
    els.handContainer.innerHTML = '';
    state.hand.forEach(card => {
        const el = createCardEl(card);
        el.addEventListener('click', () => openCardDetail(card));
        els.handContainer.appendChild(el);
    });
}

function log(msg) {
    els.statusBar.innerHTML = `<p>${msg}</p>`;
    console.log(msg);
}

// --- Modals ---

// Reused for Drawing (Keep) AND Discarding (Discard)
function showSelectionModal(cards, count, actionLabel, callback) {
    els.modalOverlay.classList.remove('hidden');
    els.selectionModal.style.display = 'block';

    // Hide others
    els.diceModal.style.display = 'none';
    els.cardDetailModal.style.display = 'none';
    els.messageModal.style.display = 'none';
    els.confirmModal.style.display = 'none';

    els.selectionGrid.innerHTML = '';

    if (actionLabel === "Keep") {
        els.selectionTitle.textContent = `Pick ${count} to Keep`;
        els.selectionDesc.textContent = `Select ${count} card${count > 1 ? 's' : ''} to add to your hand.`;
    } else {
        els.selectionTitle.textContent = `Discard ${count} Cards`;
        els.selectionDesc.textContent = `Select ${count} card${count > 1 ? 's' : ''} to discard as cost.`;
    }

    // Configure Close Button behavior
    const closeBtn = document.getElementById('close-selection-x');

    // Clear old event listeners by cloning
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    if (actionLabel === "Keep") {
        newCloseBtn.onclick = () => {
            // Skip Draw Logic
            cards.forEach(c => state.discardPile.push(c));
            saveState();
            updateUI();
            closeAllModals();
            log("Draw skipped. Cards discarded.");
        };
        newCloseBtn.style.display = 'flex';
    } else {
        // Discard Mode - just close (Cancel)
        newCloseBtn.onclick = closeAllModals;
        newCloseBtn.style.display = 'flex';
    }

    // Confirm Button Logic
    els.btnConfirmSelection.style.display = 'none'; // reset
    // Clone to remove listener
    const newConfirmBtn = els.btnConfirmSelection.cloneNode(true);
    els.btnConfirmSelection.parentNode.replaceChild(newConfirmBtn, els.btnConfirmSelection);
    els.btnConfirmSelection = newConfirmBtn; // update ref

    let selected = [];

    const checkConfirmStatus = () => {
        if (selected.length === count) {
            els.btnConfirmSelection.style.display = 'block';
            els.btnConfirmSelection.textContent = actionLabel === "Keep" ? `Keep ${count} Cards` : `Discard ${count} Cards`;

            // Highlight visually?
            els.btnConfirmSelection.onclick = () => {
                closeAllModals();
                callback(selected);
            };
        } else {
            els.btnConfirmSelection.style.display = 'none';
        }
    };

    cards.forEach(card => {
        const el = createCardEl(card);
        el.addEventListener('click', () => {
            // Toggle logic
            if (selected.includes(card)) {
                selected.splice(selected.indexOf(card), 1);
                el.style.border = '1px solid var(--border-color)';
                el.style.opacity = '1';
                el.style.transform = 'none';
            } else {
                if (selected.length < count) {
                    selected.push(card);
                    el.style.border = '2px solid var(--accent-secondary)';
                    el.style.opacity = '0.8';
                    el.style.transform = 'scale(0.95)';
                }
            }
            // Update confirm button visibility
            checkConfirmStatus();
        });
        els.selectionGrid.appendChild(el);
    });
}

function openCardDetail(card) {
    els.modalOverlay.classList.remove('hidden');
    els.cardDetailModal.style.display = 'block';
    els.selectionModal.style.display = 'none';
    els.diceModal.style.display = 'none';
    els.messageModal.style.display = 'none';
    els.confirmModal.style.display = 'none';

    els.detailCardView.innerHTML = '';
    els.detailCardView.appendChild(createCardEl(card));

    // Handle Time Bonus (Passive/Discard Only)
    if (card.type === 'Time Bonus') {
        els.btnCastCard.style.display = 'none';
    } else {
        els.btnCastCard.style.display = 'block';
    }

    els.btnCastCard.onclick = () => {
        // Parse cost
        const costLower = card.cost.toLowerCase();

        // 1. Discard Cost
        if (costLower.includes('discard')) {
            let costAmount = 1;
            if (costLower.includes('2')) costAmount = 2;
            if (costLower.includes('3')) costAmount = 3;

            // Check if we have enough other cards (excluding self if in hand)
            // The card is currently IN hand.
            if (state.hand.length - 1 < costAmount) {
                showMessage("Cannot Cast", "Not enough cards to discard!");
                return;
            }

            closeAllModals(); // Close detail view first

            // Trigger Discard Selection
            // filter out the card itself so we don't discard the spell being cast as cost for itself
            // Wait - usually you discard OTHER cards.
            const discardables = state.hand.filter(c => c.uid !== card.uid);

            showSelectionModal(discardables, costAmount, "Discard", (selectedDiscards) => {
                // 1. Remove played card
                discardCard(card.uid);
                // 2. Remove cost cards
                selectedDiscards.forEach(c => discardCard(c.uid));

                showMessage("Card Played", `You activated: ${card.title}`);
                log(`Played ${card.title} (Cost: Discard ${costAmount})`);
            });
            return;
        }

        // 2. Dice Cost
        if (costLower.includes('roll')) {
            closeAllModals();
            openDiceModal((roll) => {
                // Check criteria
                let success = true; // Default to allow, logic depends on specifics
                let msg = `Rolled a ${roll}.`;

                // Specific Logic for "Curse of the Waiting Bench"
                if (card.id === 'curse_bench' || costLower.includes('even')) {
                    if (roll % 2 === 0) {
                        // Even = Discard without effect
                        discardCard(card.uid);
                        showMessage("Cast Failed", `Rolled ${roll} (Even). The curse fizzles and is discarded!`);
                    } else {
                        // Odd = Success
                        // "If its not even then you can cast it"
                        // This implies we now proceed to actually "Cast" it.
                        // In this app, "Open Dice Modal" was the casting step.
                        // So if we reach here, we succeed.
                        discardCard(card.uid);
                        showMessage("Cast Success", `Rolled ${roll} (Odd). Curse of the Waiting Bench activated!`);
                        log(`Played ${card.title} (Rolled ${roll})`);
                    }
                    return;
                }

                // Default handle for other dice rolls (just informational for now)
                discardCard(card.uid);
                showMessage("Card Played", `Rolled ${roll}. ${card.title} Activated.`);
            });
            return;
        }

        // 3. Free / Other
        closeAllModals();
        discardCard(card.uid);
        showMessage("Card Played", `You activated: ${card.title}`);
    };
}

let diceCallback = null;

function openDiceModal(cb) {
    els.modalOverlay.classList.remove('hidden');
    els.diceModal.style.display = 'block';

    // Hide others
    els.selectionModal.style.display = 'none';
    els.cardDetailModal.style.display = 'none';
    els.messageModal.style.display = 'none';
    els.confirmModal.style.display = 'none';

    els.diceResult.textContent = '?';

    // If we have a callback (from casting), store it.
    // If just random roll (from header btn), cb is null.
    diceCallback = cb;

    // Update close button behavior?
    // If in casting mode, closing cancel cast?
    // Let's keep it simple.
}

function showMessage(title, body) {
    els.modalOverlay.classList.remove('hidden');

    // Hide all other specific modals
    els.selectionModal.style.display = 'none';
    els.diceModal.style.display = 'none';
    els.cardDetailModal.style.display = 'none';

    els.messageModal.style.display = 'block';

    // Ensure others are hidden in case
    els.confirmModal.style.display = 'none';

    els.msgTitle.textContent = title;
    els.msgBody.textContent = body;
}

function showConfirm(title, body, onConfirm) {
    els.modalOverlay.classList.remove('hidden');
    els.confirmModal.style.display = 'block';

    // Hide others
    els.selectionModal.style.display = 'none';
    els.diceModal.style.display = 'none';
    els.cardDetailModal.style.display = 'none';
    els.messageModal.style.display = 'none';

    els.confirmTitle.textContent = title;
    els.confirmBody.textContent = body;

    // Handlers
    els.confirmYes.onclick = () => {
        onConfirm();
        closeAllModals();
    };
    els.confirmNo.onclick = () => {
        closeAllModals();
        // Callback for cancel if needed?
        // For reset slider, we handle cancel via visual reset in caller?
        // Actually, if we use this for slider, we need to know when it closed to reset slider.
        // Let's rely on closeAllModals logic or explicit cancel.
        if (title.includes("Reset")) resetSlider();
    };
}

function closeAllModals() {
    els.modalOverlay.classList.add('hidden');
    diceCallback = null;
    els.confirmModal.style.display = 'none';
}

// --- Event Listeners ---

// Action Buttons
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        switch (action) {
            case 'radar': startDrawFlow(3, 1); break;
            case 'thermometer': startDrawFlow(2, 1); break;
            case 'measuring': startDrawFlow(1, 1); break;
            case 'photos': startDrawFlow(1, 1); break;
            case 'oddball': startDrawFlow(2, 1); break;
            case 'oddball': startDrawFlow(2, 1); break;
            case 'draw1':
                // Manual Draw 1 is just Draw 1 Keep 1
                startDrawFlow(1, 1);
                break;
        }
    });
});

// Dice
els.diceTrigger.addEventListener('click', () => openDiceModal(null));

els.btnRollDice.addEventListener('click', () => {
    let rolls = 0;
    const interval = setInterval(() => {
        els.diceResult.textContent = Math.floor(Math.random() * 6) + 1;
        rolls++;
        if (rolls > 10) {
            clearInterval(interval);
            const final = Math.floor(Math.random() * 6) + 1;
            els.diceResult.textContent = final;
            log(`Rolled a ${final}`);

            if (diceCallback) {
                setTimeout(() => {
                    diceCallback(final);
                    diceCallback = null; // consume
                }, 1000);
            }
        }
    }, 80);
});

els.btnCloseDice.addEventListener('click', closeAllModals);
els.btnCloseDetail.addEventListener('click', closeAllModals);
els.btnCloseMsg.addEventListener('click', closeAllModals);

// Slider Reset Logic
let isDragging = false;
let startX = 0;
let currentX = 0;
let maxMove = 0; // Dynamic
const thumbWidth = 50;

els.sliderThumb.addEventListener('mousedown', startDrag);
els.sliderThumb.addEventListener('touchstart', startDrag, { passive: false });

function startDrag(e) {
    isDragging = true;
    startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;

    // Calculate max move based on current container width
    const containerWidth = els.sliderContainer.offsetWidth;
    maxMove = containerWidth - thumbWidth;

    els.sliderThumb.style.transition = 'none';
}

window.addEventListener('mousemove', moveDrag);
window.addEventListener('touchmove', moveDrag, { passive: false });

function moveDrag(e) {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scroll on touch
    const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    const diff = x - startX;

    currentX = Math.max(0, Math.min(diff, maxMove));
    els.sliderThumb.style.transform = `translateX(${currentX}px)`;

    // Visual feedback
    const opacity = 1 - (currentX / maxMove);
    document.querySelector('.slider-bg').style.opacity = opacity;
}

window.addEventListener('mouseup', endDrag);
window.addEventListener('touchend', endDrag);

function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    els.sliderThumb.style.transition = 'transform 0.3s';

    if (currentX > maxMove * 0.9) {
        // Unlock / Reset
        els.sliderThumb.style.transform = `translateX(${maxMove}px)`;
        els.sliderContainer.classList.add('unlocked');
        // Small delay to allow visual completion
        // Small delay to allow visual completion
        setTimeout(() => {
            showConfirm("Factory Reset", "Are you sure you want to delete all progress? This cannot be undone.", () => {
                localStorage.removeItem('glenwood_state');
                location.reload();
            });
            // We need to handle 'Cancel' case to reset slider.
            // Updated showConfirm to resetSlider if cancelled.
        }, 100);
    } else {
        resetSlider();
    }
}

function resetSlider() {
    currentX = 0;
    els.sliderThumb.style.transform = `translateX(0px)`;
    document.querySelector('.slider-bg').style.opacity = 1;
    els.sliderContainer.classList.remove('unlocked');
}

// Init
initGame();
