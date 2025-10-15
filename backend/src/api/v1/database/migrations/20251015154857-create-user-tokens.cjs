"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // =============================================
    // 🧱 1️⃣ Tạo bảng `user_tokens`
    // =============================================
    await queryInterface.createTable("user_tokens", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: "ID của token"
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "ID người dùng sở hữu token (FK tới bảng users)"
      },
      token_type: {
        type: Sequelize.ENUM(
          "ACCESS",
          "REFRESH",
          "API",
          "RESET_PASSWORD",
          "EMAIL_VERIFICATION"
        ),
        allowNull: false,
        defaultValue: "ACCESS",
        comment: "Loại token (Access, Refresh, API, v.v...)"
      },
      token_hash: {
        type: Sequelize.STRING(512),
        allowNull: false,
        unique: true,
        comment: "Giá trị hash của token (để không lưu token gốc)"
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "Thời điểm token hết hạn"
      },
      is_revoked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Cờ xác định token đã bị thu hồi hay chưa"
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: "Địa chỉ IP khi tạo token"
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Chuỗi User-Agent của trình duyệt / thiết bị"
      },
      device_info: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Thông tin chi tiết về thiết bị (OS, model, v.v)"
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
        comment: "Thời điểm tạo bản ghi"
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
        comment: "Thời điểm cập nhật bản ghi gần nhất"
      }
    });

    // =============================================
    // 🧩 2️⃣ Thêm khóa ngoại (Foreign Key)
    // =============================================
    await queryInterface.addConstraint("user_tokens", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_user_tokens_user",
      references: {
        table: "users",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    });

    // =============================================
    // ⚡ 3️⃣ Tạo các index để tối ưu truy vấn
    // =============================================
    await queryInterface.addIndex("user_tokens", ["user_id"], {
      name: "idx_user_tokens_user"
    });

    await queryInterface.addIndex("user_tokens", ["token_hash"], {
      name: "idx_user_tokens_hash",
      unique: true
    });

    await queryInterface.addIndex("user_tokens", ["expires_at"], {
      name: "idx_user_tokens_expires"
    });

    await queryInterface.addIndex("user_tokens", ["user_id", "token_type"], {
      name: "idx_user_tokens_user_type"
    });

    await queryInterface.addIndex(
      "user_tokens",
      ["user_id", "is_revoked", "expires_at"],
      { name: "idx_user_tokens_validity" }
    );

    // =============================================
    // 🧠 4️⃣ Trigger tự động cập nhật `updated_at`
    // =============================================
    // 🧩 Bước 1: Tạo function
    await queryInterface.sequelize.query(`
  CREATE OR REPLACE FUNCTION update_user_tokens_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`);

    // 🧩 Bước 2: Tạo trigger sử dụng function đó
    await queryInterface.sequelize.query(`
  CREATE TRIGGER trg_user_tokens_updated_at
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tokens_timestamp();
`);
  },

  // =============================================
  // 🔙 5️⃣ Hàm rollback (xóa bảng, enum, trigger)
  // =============================================
  async down(queryInterface, _Sequelize) {
    // Xóa trigger & function trước để tránh lỗi dependency
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_user_tokens_updated_at ON user_tokens;
      DROP FUNCTION IF EXISTS update_user_tokens_timestamp;
    `);

    // Xóa bảng
    await queryInterface.dropTable("user_tokens");

    // Xóa ENUM type để tránh xung đột trong lần migrate sau
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_user_tokens_token_type";
    `);
  }
};
