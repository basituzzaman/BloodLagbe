CREATE DATABASE IF NOT EXISTS bloodlagbe
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bloodlagbe;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255),
  age INT,
  gender VARCHAR(50),
  blood_type VARCHAR(10),
  district VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  approved BIT(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_phone (phone)
);

CREATE TABLE IF NOT EXISTS donors (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  health_history VARCHAR(2000),
  last_donation_date DATE,
  availability BIT(1) NOT NULL DEFAULT b'1',
  donation_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_donors_user_id (user_id),
  CONSTRAINT fk_donors_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blood_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  requester_id BIGINT NOT NULL,
  donor_id BIGINT NOT NULL,
  request_for VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_blood_requests_requester_id (requester_id),
  KEY idx_blood_requests_donor_id (donor_id),
  CONSTRAINT fk_blood_requests_requester FOREIGN KEY (requester_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_blood_requests_donor FOREIGN KEY (donor_id) REFERENCES donors (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  message VARCHAR(1000) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_notifications_user_id (user_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

