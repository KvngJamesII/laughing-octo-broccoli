// Game logic and room management
class GameManager {
    constructor() {
        this.database = window.firebaseServices.database;
        this.currentRoom = null;
        this.currentRoomCode = null;
        this.playerSymbol = null;
        this.isMyTurn = false;
        this.gameState = {
            board: Array(9).fill(''),
            currentTurn: 'X',
            winner: null,
            status: 'waiting'
        };
        this.roomListener = null;
        this.winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
    }

    // Generate random 5-digit room code
    generateRoomCode() {
        return Math.floor(10000 + Math.random() * 90000).toString();
    }

    // Create a new room
    async createRoom() {
        const authData = window.authManager.getCurrentUser();
        if (!authData.user || !authData.userData) {
            throw new Error('User not authenticated');
        }

        let roomCode;
        let attempts = 0;
        const maxAttempts = 10;

        // Try to find an available room code
        do {
            roomCode = this.generateRoomCode();
            const snapshot = await this.database.ref('rooms').child(roomCode).once('value');
            if (!snapshot.exists()) break;
            attempts++;
        } while (attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            throw new Error('Unable to generate unique room code');
        }

        try {
            const roomData = {
                status: 'waiting',
                playerX: {
                    uid: authData.user.uid,
                    username: authData.userData.username,
                    xp: authData.userData.xp,
                    rank: authData.userData.rank
                },
                playerO: null,
                board: Array(9).fill(''),
                currentTurn: 'X',
                winner: null,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            await this.database.ref('rooms').child(roomCode).set(roomData);
            
            this.currentRoomCode = roomCode;
            this.playerSymbol = 'X';
            this.currentRoom = roomData;
            
            return roomCode;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    // Join an existing room
    async joinRoom(roomCode) {
        const authData = window.authManager.getCurrentUser();
        if (!authData.user || !authData.userData) {
            throw new Error('User not authenticated');
        }

        try {
            const snapshot = await this.database.ref('rooms').child(roomCode).once('value');
            if (!snapshot.exists()) {
                throw new Error('Room not found');
            }

            const roomData = snapshot.val();
            
            if (roomData.status !== 'waiting') {
                throw new Error('Room is not available');
            }

            if (roomData.playerO) {
                throw new Error('Room is full');
            }

            // Check if user is already in the room as playerX
            if (roomData.playerX && roomData.playerX.uid === authData.user.uid) {
                throw new Error('You are already in this room');
            }

            // Join as playerO
            const updates = {
                playerO: {
                    uid: authData.user.uid,
                    username: authData.userData.username,
                    xp: authData.userData.xp,
                    rank: authData.userData.rank
                },
                status: 'playing'
            };

            await this.database.ref('rooms').child(roomCode).update(updates);
            
            this.currentRoomCode = roomCode;
            this.playerSymbol = 'O';
            this.currentRoom = { ...roomData, ...updates };
            
            return roomCode;
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        }
    }

    // Start listening to room updates
    startRoomListener(onUpdate) {
        if (!this.currentRoomCode) return;

        this.roomListener = this.database.ref('rooms').child(this.currentRoomCode).on('value', (snapshot) => {
            if (snapshot.exists()) {
                const roomData = snapshot.val();
                this.currentRoom = roomData;
                this.updateGameState(roomData);
                onUpdate(roomData);
            }
        });
    }

    // Stop listening to room updates
    stopRoomListener() {
        if (this.roomListener && this.currentRoomCode) {
            this.database.ref('rooms').child(this.currentRoomCode).off('value', this.roomListener);
            this.roomListener = null;
        }
    }

    // Update local game state
    updateGameState(roomData) {
        this.gameState = {
            board: roomData.board || Array(9).fill(''),
            currentTurn: roomData.currentTurn || 'X',
            winner: roomData.winner || null,
            status: roomData.status || 'waiting'
        };
        
        this.isMyTurn = this.gameState.currentTurn === this.playerSymbol;
    }

    // Make a move
    async makeMove(cellIndex) {
        if (!this.currentRoomCode || !this.isMyTurn) {
            throw new Error('Not your turn');
        }

        if (this.gameState.board[cellIndex] !== '') {
            throw new Error('Cell already occupied');
        }

        if (this.gameState.status !== 'playing') {
            throw new Error('Game not in progress');
        }

        try {
            const newBoard = [...this.gameState.board];
            newBoard[cellIndex] = this.playerSymbol;

            const winner = this.checkWinner(newBoard);
            const isDraw = !winner && newBoard.every(cell => cell !== '');
            const nextTurn = this.playerSymbol === 'X' ? 'O' : 'X';

            const updates = {
                board: newBoard,
                currentTurn: winner || isDraw ? this.gameState.currentTurn : nextTurn,
                winner: winner,
                status: winner || isDraw ? 'ended' : 'playing'
            };

            await this.database.ref('rooms').child(this.currentRoomCode).update(updates);

            // Update XP if game ended
            if (winner || isDraw) {
                await this.updatePlayerXP(winner, isDraw);
            }

            return true;
        } catch (error) {
            console.error('Error making move:', error);
            throw error;
        }
    }

    // Check for winner
    checkWinner(board) {
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    // Get winning pattern
    getWinningPattern(board) {
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return pattern;
            }
        }
        return null;
    }

    // Update player XP based on game result
    async updatePlayerXP(winner, isDraw) {
        let xpChange = 0;
        
        if (isDraw) {
            xpChange = 2; // Draw: +2 XP
        } else if (winner === this.playerSymbol) {
            xpChange = 10; // Win: +10 XP
        } else {
            xpChange = -5; // Loss: -5 XP
        }

        try {
            await window.authManager.updateUserXP(xpChange);
            return xpChange;
        } catch (error) {
            console.error('Error updating XP:', error);
            return 0;
        }
    }

    // Leave current room
    async leaveRoom() {
        if (!this.currentRoomCode) return;

        try {
            // If game is in progress, mark as abandoned
            if (this.currentRoom && this.currentRoom.status === 'playing') {
                await this.database.ref('rooms').child(this.currentRoomCode).update({
                    status: 'abandoned',
                    winner: this.playerSymbol === 'X' ? 'O' : 'X'
                });
                
                // Apply penalty for leaving
                await window.authManager.updateUserXP(-10);
            } else {
                // Remove room if waiting
                await this.database.ref('rooms').child(this.currentRoomCode).remove();
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        } finally {
            this.stopRoomListener();
            this.currentRoom = null;
            this.currentRoomCode = null;
            this.playerSymbol = null;
            this.isMyTurn = false;
        }
    }

    // Get current game info
    getCurrentGame() {
        return {
            roomCode: this.currentRoomCode,
            playerSymbol: this.playerSymbol,
            isMyTurn: this.isMyTurn,
            gameState: this.gameState,
            room: this.currentRoom
        };
    }

    // Clean up expired rooms (utility function)
    static async cleanupExpiredRooms() {
        try {
            const database = window.firebaseServices.database;
            const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
            
            const snapshot = await database.ref('rooms').once('value');
            const rooms = snapshot.val();
            
            if (rooms) {
                const expiredRooms = Object.keys(rooms).filter(roomCode => {
                    const room = rooms[roomCode];
                    return room.createdAt && room.createdAt < cutoffTime;
                });
                
                const deletePromises = expiredRooms.map(roomCode => 
                    database.ref('rooms').child(roomCode).remove()
                );
                
                await Promise.all(deletePromises);
                console.log(`Cleaned up ${expiredRooms.length} expired rooms`);
            }
        } catch (error) {
            console.error('Error cleaning up expired rooms:', error);
        }
    }
}

// Export game manager
window.gameManager = new GameManager();

