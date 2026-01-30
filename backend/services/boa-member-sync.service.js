const { promisePool } = require('../config/database');

class BOAMemberSyncService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.checkInterval = 5000; // 5 seconds
  }

  async syncMembers() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      // Set is_boa_member = TRUE for users with membership_no
      const [updateResult] = await promisePool.query(`
        UPDATE users 
        SET is_boa_member = TRUE 
        WHERE membership_no IS NOT NULL 
        AND membership_no != '' 
        AND is_boa_member = FALSE
      `);

      if (updateResult.affectedRows > 0) {
        console.log(`[BOA Sync] ✓ Activated ${updateResult.affectedRows} BOA members`);
      }

      // Set is_boa_member = FALSE for users without membership_no
      const [deactivateResult] = await promisePool.query(`
        UPDATE users 
        SET is_boa_member = FALSE 
        WHERE (membership_no IS NULL OR membership_no = '') 
        AND is_boa_member = TRUE
      `);

      if (deactivateResult.affectedRows > 0) {
        console.log(`[BOA Sync] ✓ Deactivated ${deactivateResult.affectedRows} non-BOA members`);
      }

    } catch (error) {
      console.error('[BOA Sync] Error:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    if (this.intervalId) {
      return;
    }

    console.log('[BOA Sync] 🚀 Service started');
    
    // Run immediately
    this.syncMembers();
    
    // Then run every 5 seconds
    this.intervalId = setInterval(() => {
      this.syncMembers();
    }, this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[BOA Sync] 🛑 Service stopped');
    }
  }
}

// Create singleton instance
const boaSyncService = new BOAMemberSyncService();

module.exports = boaSyncService;
