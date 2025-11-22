// Main application controller
class App {
    constructor() {
        this.currentScreen = 'landing-page';
        this.isInitialized = false;
        this.gameUpdateInterval = null;
    }

    // Initialize the application
    async init() {
        try {
            this.showLoading(true);
            
            // Initialize authentication
            await window.authManager.init();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Clean up expired rooms periodically
            GameManager.cleanupExpiredRooms();
            
            this.isInitialized = true;
            this.showLoading(false);
            
            console.log('XOXO Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    // Set up all event listeners
    setupEventListeners() {
        // Landing page
        const playNowBtn = document.getElementById('play-now-btn');
        const joinRoomBtn = document.getElementById('join-room-btn');
        
        playNowBtn.addEventListener('click', (e) => {
            window.animationManager?.animateButtonPress(e.target);
            window.soundManager?.play('click');
            this.handlePlayNow();
        });
        
        joinRoomBtn.addEventListener('click', (e) => {
            window.animationManager?.animateButtonPress(e.target);
            window.soundManager?.play('click');
            this.handleJoinRoom();
        });
        
        document.getElementById('room-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleJoinRoom();
        });

        // Username page
        const usernameSubmitBtn = document.getElementById('username-submit-btn');
        usernameSubmitBtn.addEventListener('click', (e) => {
            window.animationManager?.animateButtonPress(e.target);
            window.soundManager?.play('click');
            this.handleUsernameSubmit();
        });
        
        document.getElementById('username-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUsernameSubmit();
        });

        // Lobby page
        const leaveRoomBtn = document.getElementById('leave-room-btn');
        leaveRoomBtn.addEventListener('click', (e) => {
            window.animationManager?.animateButtonPress(e.target);
            window.soundManager?.play('click');
            this.handleLeaveRoom();
        });

        // Game page
        const quitGameBtn = document.getElementById('quit-game-btn');
        quitGameBtn.addEventListener('click', (e) => {
            window.animationManager?.animateButtonPress(e.target);
            window.soundManager?.play('click');
            this.handleQuitGame();
        });
        
        document.querySelectorAll('.board-cell').forEach((cell, index) => {
            cell.addEventListener('click', () => {
                window.soundManager?.play('move');
                this.handleCellClick(index);
            });
        });

        // Result modal
        const playAgainBtn = document.getElementById('play-again-btn');
        const backHomeBtn = document.getElementById('back-home-btn');
        
        playAgainBtn.addEventListener('click', (e) => {
            window.animationManager?.animateButtonPress(e.target);
            window.soundManager?.play('click');
            this.handlePlayAgain();
        });
        
        backHomeBtn.addEventListener('click', (e) => {
            window.animationManager?.animateButtonPress(e.target);
            window.soundManager?.play('click');
            this.handleBackHome();
        });

        // Input formatting
        document.getElementById('room-code-input').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
        });
        
        // Add hover effects to all buttons
        document.querySelectorAll('.neon-button').forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
            });
        });
    }

    // Handle Play Now button
    async handlePlayNow() {
        try {
            await this.ensureUserAuthenticated();
            
            this.showLoading(true);
            const roomCode = await window.gameManager.createRoom();
            this.showLoading(false);
            
            this.showScreen('lobby-page');
            this.updateLobbyDisplay();
            this.startRoomListener();
        } catch (error) {
            this.showLoading(false);
            this.showError(error.message);
        }
    }

    // Handle Join Room button
    async handleJoinRoom() {
        const roomCode = document.getElementById('room-code-input').value.trim();
        
        if (roomCode.length !== 5) {
            this.showError('Please enter a valid 5-digit room code');
            return;
        }

        try {
            await this.ensureUserAuthenticated();
            
            this.showLoading(true);
            await window.gameManager.joinRoom(roomCode);
            this.showLoading(false);
            
            this.showScreen('lobby-page');
            this.updateLobbyDisplay();
            this.startRoomListener();
        } catch (error) {
            this.showLoading(false);
            this.showError(error.message);
        }
    }

    // Handle username submission
    async handleUsernameSubmit() {
        const username = document.getElementById('username-input').value.trim();
        const errorElement = document.getElementById('username-error');
        
        errorElement.textContent = '';
        
        if (username.length < 3) {
            errorElement.textContent = 'Username must be at least 3 characters long';
            return;
        }

        try {
            this.showLoading(true);
            await window.authManager.registerUsername(username);
            this.showLoading(false);
            
            // Return to previous action
            if (this.pendingAction) {
                this.pendingAction();
                this.pendingAction = null;
            } else {
                this.showScreen('landing-page');
            }
        } catch (error) {
            this.showLoading(false);
            errorElement.textContent = error.message;
        }
    }

    // Handle cell click in game
    async handleCellClick(index) {
        try {
            await window.gameManager.makeMove(index);
        } catch (error) {
            console.error('Move failed:', error);
            // Error is handled by the game state update
        }
    }

    // Handle leave room
    async handleLeaveRoom() {
        try {
            this.showLoading(true);
            await window.gameManager.leaveRoom();
            this.showLoading(false);
            this.showScreen('landing-page');
        } catch (error) {
            this.showLoading(false);
            this.showError(error.message);
        }
    }

    // Handle quit game
    async handleQuitGame() {
        if (confirm('Are you sure you want to quit? You will lose 10 XP.')) {
            await this.handleLeaveRoom();
        }
    }

    // Handle play again
    async handlePlayAgain() {
        this.hideModal();
        try {
            this.showLoading(true);
            await window.gameManager.leaveRoom();
            const roomCode = await window.gameManager.createRoom();
            this.showLoading(false);
            
            this.showScreen('lobby-page');
            this.updateLobbyDisplay();
            this.startRoomListener();
        } catch (error) {
            this.showLoading(false);
            this.showError(error.message);
        }
    }

    // Handle back to home
    async handleBackHome() {
        this.hideModal();
        try {
            await window.gameManager.leaveRoom();
            this.showScreen('landing-page');
        } catch (error) {
            this.showError(error.message);
        }
    }

    // Ensure user is authenticated and has username
    async ensureUserAuthenticated() {
        if (!window.authManager.isUserReady()) {
            if (!window.authManager.currentUser) {
                await window.authManager.signInAnonymously();
            }
            
            if (!window.authManager.userData || !window.authManager.userData.username) {
                this.pendingAction = () => this.handlePlayNow();
                this.showScreen('username-page');
                throw new Error('Username required');
            }
        }
    }

    // Start listening to room updates
    startRoomListener() {
        window.gameManager.startRoomListener((roomData) => {
            this.handleRoomUpdate(roomData);
        });
    }

    // Handle room updates
    handleRoomUpdate(roomData) {
        if (this.currentScreen === 'lobby-page') {
            this.updateLobbyDisplay();
            
            // Start game when both players are ready
            if (roomData.status === 'playing' && roomData.playerX && roomData.playerO) {
                setTimeout(() => {
                    this.showScreen('game-page');
                    this.updateGameDisplay();
                }, 1000);
            }
        } else if (this.currentScreen === 'game-page') {
            this.updateGameDisplay();
            
            // Check for game end
            if (roomData.status === 'ended') {
                setTimeout(() => {
                    this.showGameResult(roomData);
                }, 1000);
            }
        }
    }

    // Update lobby display
    updateLobbyDisplay() {
        const gameInfo = window.gameManager.getCurrentGame();
        const roomData = gameInfo.room;
        
        if (!roomData) return;

        // Update room code
        document.getElementById('room-code-display').textContent = gameInfo.roomCode;

        // Update player 1 (X)
        if (roomData.playerX) {
            document.getElementById('player1-name').textContent = roomData.playerX.username;
            document.getElementById('player1-stats').textContent = 
                `XP: ${roomData.playerX.xp} | Rank: ${roomData.playerX.rank}`;
        }

        // Update player 2 (O)
        if (roomData.playerO) {
            document.getElementById('player2-name').textContent = roomData.playerO.username;
            document.getElementById('player2-stats').textContent = 
                `XP: ${roomData.playerO.xp} | Rank: ${roomData.playerO.rank}`;
            document.getElementById('waiting-message').style.display = 'none';
        } else {
            document.getElementById('player2-name').textContent = 'Waiting...';
            document.getElementById('player2-stats').textContent = 'XP: 0 | Rank: Newbie';
            document.getElementById('waiting-message').style.display = 'flex';
        }
    }

    // Update game display
    updateGameDisplay() {
        const gameInfo = window.gameManager.getCurrentGame();
        const roomData = gameInfo.room;
        
        if (!roomData) return;

        // Update player names
        document.getElementById('player-x-name').textContent = roomData.playerX.username;
        document.getElementById('player-o-name').textContent = roomData.playerO.username;

        // Update turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        if (gameInfo.gameState.status === 'ended') {
            turnIndicator.textContent = 'Game Over';
        } else if (gameInfo.isMyTurn) {
            turnIndicator.textContent = 'Your Turn';
            turnIndicator.style.color = '#00ff00';
        } else {
            turnIndicator.textContent = "Opponent's Turn";
            turnIndicator.style.color = '#ff6600';
        }

        // Update board
        this.updateBoard(gameInfo.gameState.board, gameInfo.gameState.winner);
    }

    // Update game board with animations
    updateBoard(board, winner) {
        const cells = document.querySelectorAll('.board-cell');
        const gameInfo = window.gameManager.getCurrentGame();
        const winningPattern = winner ? window.gameManager.getWinningPattern(board) : null;

        cells.forEach((cell, index) => {
            const previousContent = cell.textContent;
            const newContent = board[index];
            
            // Clear previous classes
            cell.className = 'board-cell';
            cell.textContent = newContent;

            // Add symbol class
            if (newContent === 'X') {
                cell.classList.add('x');
            } else if (newContent === 'O') {
                cell.classList.add('o');
            }

            // Animate new placements
            if (previousContent !== newContent && newContent !== '') {
                window.animationManager?.animateCellPlacement(cell, newContent);
                cell.classList.add('placed');
                setTimeout(() => cell.classList.remove('placed'), 500);
            }

            // Add winning class with animation
            if (winningPattern && winningPattern.includes(index)) {
                cell.classList.add('winning');
            }

            // Disable if not player's turn or cell is occupied
            if (!gameInfo.isMyTurn || newContent !== '' || gameInfo.gameState.status !== 'playing') {
                cell.classList.add('disabled');
            }
        });

        // Animate win celebration
        if (winner && winningPattern) {
            const winningCells = winningPattern.map(index => cells[index]);
            setTimeout(() => {
                window.animationManager?.animateWin(winningCells);
            }, 500);
        }
    }

    // Show game result with enhanced effects
    showGameResult(roomData) {
        const gameInfo = window.gameManager.getCurrentGame();
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('result-title');
        const message = document.getElementById('result-message');
        const xpChange = document.getElementById('xp-change');

        let resultText = '';
        let xpChangeValue = 0;

        if (roomData.winner) {
            if (roomData.winner === gameInfo.playerSymbol) {
                resultText = '🎉 You Win! 🎉';
                xpChangeValue = 10;
                window.soundManager?.play('win');
            } else {
                resultText = '😔 You Lose';
                xpChangeValue = -5;
                window.soundManager?.play('lose');
            }
        } else {
            resultText = '🤝 It\'s a Draw!';
            xpChangeValue = 2;
            window.soundManager?.play('move'); // Neutral sound for draw
        }

        title.textContent = resultText;
        message.textContent = `Game completed!`;
        
        const xpText = xpChangeValue > 0 ? `+${xpChangeValue}` : `${xpChangeValue}`;
        const xpColor = xpChangeValue > 0 ? '#00ff00' : xpChangeValue < 0 ? '#ff4444' : '#ffff00';
        xpChange.innerHTML = `<span style="color: ${xpColor}">XP Change: ${xpText}</span>`;

        this.showModal();
    }

    // Screen management with animations
    showScreen(screenId) {
        const currentScreen = document.querySelector('.screen.active');
        const targetScreen = document.getElementById(screenId);
        
        if (currentScreen && currentScreen !== targetScreen) {
            // Use animation manager for smooth transitions
            window.animationManager.animateScreenTransition(currentScreen, targetScreen);
        } else {
            // Hide all screens
            document.querySelectorAll('.screen').forEach(screen => {
                screen.cl
(Content truncated due to size limit. Use line ranges to read in chunks)