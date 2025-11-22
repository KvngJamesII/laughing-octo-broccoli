// Authentication and user management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.auth = window.firebaseServices.auth;
        this.database = window.firebaseServices.database;
    }

    // Initialize authentication
    async init() {
        return new Promise((resolve) => {
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.loadUserData();
                }
                resolve(user);
            });
        });
    }

    // Sign in anonymously
    async signInAnonymously() {
        try {
            const result = await this.auth.signInAnonymously();
            this.currentUser = result.user;
            return result.user;
        } catch (error) {
            console.error('Anonymous sign-in failed:', error);
            throw error;
        }
    }

    // Check if username is available
    async isUsernameAvailable(username) {
        try {
            const snapshot = await this.database.ref('usernames').child(username.toLowerCase()).once('value');
            return !snapshot.exists();
        } catch (error) {
            console.error('Error checking username availability:', error);
            return false;
        }
    }

    // Register username for current user
    async registerUsername(username) {
        if (!this.currentUser) {
            throw new Error('No authenticated user');
        }

        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
            throw new Error('Username must be between 3 and 20 characters');
        }

        // Check if username contains only valid characters
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
        }

        const isAvailable = await this.isUsernameAvailable(trimmedUsername);
        if (!isAvailable) {
            throw new Error('Username is already taken');
        }

        try {
            // Create user data
            const userData = {
                username: trimmedUsername,
                xp: 0,
                rank: this.calculateRank(0),
                gamesPlayed: 0,
                gamesWon: 0,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            // Save user data and reserve username
            await Promise.all([
                this.database.ref('users').child(this.currentUser.uid).set(userData),
                this.database.ref('usernames').child(trimmedUsername.toLowerCase()).set(this.currentUser.uid)
            ]);

            this.userData = userData;
            return userData;
        } catch (error) {
            console.error('Error registering username:', error);
            throw error;
        }
    }

    // Load user data from database
    async loadUserData() {
        if (!this.currentUser) return null;

        try {
            const snapshot = await this.database.ref('users').child(this.currentUser.uid).once('value');
            if (snapshot.exists()) {
                this.userData = snapshot.val();
                return this.userData;
            }
            return null;
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }

    // Update user XP and rank
    async updateUserXP(xpChange) {
        if (!this.currentUser || !this.userData) return;

        try {
            const newXP = Math.max(0, this.userData.xp + xpChange);
            const newRank = this.calculateRank(newXP);
            
            const updates = {
                xp: newXP,
                rank: newRank
            };

            // Update games played counter
            if (xpChange !== 0) {
                updates.gamesPlayed = (this.userData.gamesPlayed || 0) + 1;
                
                // Update games won counter
                if (xpChange > 0) {
                    updates.gamesWon = (this.userData.gamesWon || 0) + 1;
                }
            }

            await this.database.ref('users').child(this.currentUser.uid).update(updates);
            
            // Update local data
            Object.assign(this.userData, updates);
            
            return { newXP, newRank, xpChange };
        } catch (error) {
            console.error('Error updating user XP:', error);
            throw error;
        }
    }

    // Calculate rank based on XP
    calculateRank(xp) {
        if (xp >= 1000) return 'Champion';
        if (xp >= 500) return 'Pro';
        if (xp >= 200) return 'Rookie';
        return 'Newbie';
    }

    // Get rank color for display
    getRankColor(rank) {
        switch (rank) {
            case 'Champion': return '#ffff00';
            case 'Pro': return '#ff00ff';
            case 'Rookie': return '#00ffff';
            case 'Newbie': return '#ffffff';
            default: return '#ffffff';
        }
    }

    // Sign out
    async signOut() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            this.userData = null;
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    // Get current user info
    getCurrentUser() {
        return {
            user: this.currentUser,
            userData: this.userData
        };
    }

    // Check if user is authenticated and has username
    isUserReady() {
        return this.currentUser && this.userData && this.userData.username;
    }
}

// Export auth manager
window.authManager = new AuthManager();

