"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // =============================================
    // 🧱 1️⃣ Tạo bảng `otp_tokens`
    // =============================================
    await queryInterface.createTable("otp_tokens", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        comment: "ID của OTP token"
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "ID người dùng (nếu đã có tài khoản)"
      },
      email: {
        type: Sequelize.STRING(254),
        allowNull: false,
        comment: "Email nhận OTP"
      },
      phone_number: {
        type: Sequelize.STRING(15),
        allowNull: true,
        comment: "Số điện thoại nhận OTP"
      },
      otp_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "Hash của mã OTP (bảo mật, không lưu OTP gốc)"
      },
      token_type: {
        type: Sequelize.ENUM(
          "REGISTRATION",
          "LOGIN",
          "EMAIL_VERIFICATION",
          "PHONE_VERIFICATION",
          "PASSWORD_RESET",
          "TRANSACTION"
        ),
        allowNull: false,
        comment: "Loại OTP (đăng ký, login, reset password, v.v)"
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Cờ xác định OTP đã được sử dụng chưa"
      },
      is_revoked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Cờ xác định OTP đã bị thu hồi chưa"
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Số lần người dùng đã thử xác thực OTP"
      },
      max_attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
        comment: "Số lần thử tối đa được phép"
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: "Địa chỉ IP khi yêu cầu OTP"
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Chuỗi User-Agent của trình duyệt / thiết bị"
      },
      device_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "ID thiết bị gửi yêu cầu OTP (nếu có)"
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "Thời điểm OTP hết hạn"
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Thời điểm OTP được sử dụng (nếu có)"
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
        comment: "Thời điểm tạo OTP"
      }
    });

    // =============================================
    // 🔗 2️⃣ Thêm khóa ngoại (Foreign Key)
    // =============================================
    await queryInterface.addConstraint("otp_tokens", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_otp_tokens_user",
      references: {
        table: "users",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    // =============================================
    // ⚡ 3️⃣ Tạo các index tối ưu truy vấn
    // =============================================
    await queryInterface.addIndex(
      "otp_tokens",
      ["email", "token_type", "is_used", "expires_at"],
      { name: "idx_otp_verification" }
    );

    await queryInterface.addIndex(
      "otp_tokens",
      ["phone_number", "token_type", "is_used", "expires_at"],
      { name: "idx_otp_phone_verification" }
    );

    await queryInterface.addIndex("otp_tokens", ["expires_at"], {
      name: "idx_otp_expires"
    });

    await queryInterface.addIndex("otp_tokens", ["user_id"], {
      name: "idx_otp_user"
    });

    await queryInterface.addIndex("otp_tokens", ["created_at"], {
      name: "idx_otp_created"
    });

    await queryInterface.addIndex("otp_tokens", ["email", "created_at"], {
      name: "idx_otp_email_created"
    });

    // =============================================
    // 🧠 4️⃣ Trigger tự động giới hạn số lần nhập OTP
    // =============================================
    await queryInterface.sequelize.query(`
  CREATE OR REPLACE FUNCTION limit_otp_attempts()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.attempts > NEW.max_attempts THEN
      RAISE EXCEPTION 'Số lần nhập OTP vượt quá giới hạn (%).', NEW.max_attempts;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`);

    await queryInterface.sequelize.query(`
  CREATE TRIGGER trg_limit_otp_attempts
  BEFORE UPDATE ON otp_tokens
  FOR EACH ROW
  EXECUTE FUNCTION limit_otp_attempts();
`);
  },

  // =============================================
  // 🔙 5️⃣ Rollback: Xóa trigger, enum, bảng
  // =============================================
  async down(queryInterface) {
    // 🧩 Xóa trigger
    await queryInterface.sequelize.query(`
    DROP TRIGGER IF EXISTS trg_limit_otp_attempts ON otp_tokens;
  `);

    // 🧩 Xóa function
    await queryInterface.sequelize.query(`
    DROP FUNCTION IF EXISTS limit_otp_attempts();
  `);

    // 🧩 Xóa bảng
    await queryInterface.dropTable("otp_tokens");

    // 🧩 Xóa ENUM type (nếu có)
    await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS "enum_otp_tokens_token_type";
  `);
  }
};
