package org.ohdsi.sandbox.spring_authn.authn.db;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;

import javax.sql.DataSource;

public class DatabaseUserDetailsService {

  private final JdbcTemplate jdbcTemplate;

  public DatabaseUserDetailsService(DataSource ds) {
    this.jdbcTemplate = new JdbcTemplate(ds);
  }

  public DatabaseUser loadUserByUsername(String username) {
    try {
      return jdbcTemplate.queryForObject(
          "SELECT username, password_hash, enabled, failed_attempts, locked_until FROM auth_user WHERE username = ?",
          (rs, rowNum) -> mapRow(rs),
          username);
    } catch (EmptyResultDataAccessException e) {
      return null;
    }
  }

  private DatabaseUser mapRow(ResultSet rs) throws SQLException {
    return new DatabaseUser(
        rs.getString("username"),
        rs.getString("password_hash"),
        rs.getBoolean("enabled"),
        rs.getInt("failed_attempts"),
        rs.getTimestamp("locked_until") != null ? rs.getTimestamp("locked_until").toLocalDateTime() : null);
  }

  public void incrementFailedAttempts(String username) {
    jdbcTemplate.update(
        "UPDATE auth_user SET failed_attempts = failed_attempts + 1 WHERE username = ?",
        username);
  }

  public void resetFailedAttempts(String username) {
    jdbcTemplate.update(
        "UPDATE auth_user SET failed_attempts = 0, locked_until = NULL WHERE username = ?",
        username);
  }

  public void lockUser(String username, LocalDateTime until) {
    jdbcTemplate.update(
        "UPDATE auth_user SET locked_until = ? WHERE username = ?",
        java.sql.Timestamp.valueOf(until),
        username);
  }
}
