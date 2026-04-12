module.exports = {
  async up({ pool }) {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS hotmart_webhook_events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        event_key VARCHAR(191) NOT NULL,
        event_name VARCHAR(120) NOT NULL,
        hottok VARCHAR(255) NULL,
        transaction_code VARCHAR(120) NULL,
        buyer_email VARCHAR(190) NULL,
        buyer_name VARCHAR(190) NULL,
        product_name VARCHAR(255) NULL,
        payload_json LONGTEXT NOT NULL,
        received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL DEFAULT NULL,
        UNIQUE KEY uk_hotmart_event_key (event_key),
        INDEX idx_hotmart_event_name (event_name),
        INDEX idx_hotmart_transaction_code (transaction_code),
        INDEX idx_hotmart_buyer_email (buyer_email)
      )`
    );
  },
};
