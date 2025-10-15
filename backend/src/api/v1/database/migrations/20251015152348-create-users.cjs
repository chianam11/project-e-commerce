"use strict";

/**
 * Migration: Create table `users` + triggers
 * -----------------------------------------
 * Mục đích:
 *  - Tạo bảng `users` chứa thông tin tài khoản người dùng
 *  - Tạo các chỉ mục (index) tối ưu truy vấn
 *  - Tạo trigger tự động cập nhật các cột kỹ thuật (`updated_at`, `deleted_at`, `last_login_at`)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ==========================================================
    // 1️⃣  CREATE TABLE `users`
    // ==========================================================
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: "ID người dùng (tự tăng)",

      },
      email: {
        type: Sequelize.STRING(254),
        allowNull: false,
        unique: true,
        comment: "Email đăng nhập (duy nhất)"
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "Bạn",
        comment: "Tên hiển thị của người dùng"
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "Mật khẩu đã được hash"
      },
      phone_number: {
        type: Sequelize.STRING(15),
        allowNull: true,
        comment: "Số điện thoại người dùng"
      },
      avatar_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Đường dẫn ảnh đại diện"
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: "Ngày sinh"
      },
      gender: {
        type: Sequelize.ENUM("MALE", "FEMALE", "OTHER"),
        allowNull: true,
        comment: "Giới tính (MALE/FEMALE/OTHER)"
      },
      is_admin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Quyền quản trị viên"
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Đã xác thực email hay chưa"
      },
      phone_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Đã xác thực số điện thoại hay chưa"
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Tài khoản còn hoạt động không"
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Đã bị xóa mềm (soft delete)"
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Thời điểm đăng nhập cuối cùng"
      },
      creator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "ID người tạo bản ghi"
      },
      modifier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "ID người sửa bản ghi gần nhất"
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Thời điểm xóa mềm"
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
        comment: "Thời điểm cập nhật gần nhất"
      }
    });

    // ==========================================================
    // 2️⃣  CREATE INDEXES
    // ==========================================================
    await queryInterface.addIndex("users", ["email"], {
      name: "idx_users_email",
      unique: true
    });

    await queryInterface.addIndex("users", ["name"], {
      name: "idx_users_name"
    });

    await queryInterface.addIndex("users", ["phone_number"], {
      name: "idx_users_phone"
    });

    await queryInterface.addIndex("users", ["is_active"], {
      name: "idx_users_active"
    });

    await queryInterface.addIndex("users", ["is_deleted"], {
      name: "idx_users_deleted"
    });

    await queryInterface.addIndex("users", ["created_at"], {
      name: "idx_users_created"
    });

    await queryInterface.addIndex("users", ["email", "is_active", "is_deleted"], {
      name: "idx_users_login_status"
    });

    // ==========================================================
    // 3️⃣  CREATE TRIGGERS
    // ==========================================================

    // Trigger #1: Tự động cập nhật `updated_at` mỗi khi record được UPDATE
    await queryInterface.sequelize.query(`
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`);

    await queryInterface.sequelize.query(`
  CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`);


    // 🧩 Trigger #2: Cập nhật deleted_at khi is_deleted = TRUE
    await queryInterface.sequelize.query(`
  CREATE OR REPLACE FUNCTION set_deleted_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.is_deleted = TRUE THEN
      NEW.deleted_at = NOW();
    ELSE
      NEW.deleted_at = NULL;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`);

    await queryInterface.sequelize.query(`
  CREATE TRIGGER trg_users_set_deleted_timestamp
  BEFORE UPDATE OF is_deleted ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_deleted_timestamp();
`);


    // 🧩 Trigger #3: Khi email_verified từ FALSE → TRUE → cập nhật last_login_at
    await queryInterface.sequelize.query(`
  CREATE OR REPLACE FUNCTION set_last_login_on_verify()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.email_verified = TRUE AND OLD.email_verified = FALSE THEN
      NEW.last_login_at = NOW();
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`);

    await queryInterface.sequelize.query(`
  CREATE TRIGGER trg_users_set_last_login
  BEFORE UPDATE OF email_verified ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_last_login_on_verify();
`);
    await queryInterface.bulkInsert("users", [
      {
        email: "chinam31x@gmail.com",
        name: "Nguyen Chi Nam",
        password: "$2a$10$vyEWb5vXwVWm4jbaIQF8BuUKp3cQXLk9tvqXRuDBROoqFp68i5eWq",
        phone_number: "0867444255",
        avatar_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSu6cKtWlkI9zS9n8a84MjaMSgwnsgNKIDUmw&s",
        is_admin: true,
        email_verified: true,
        phone_verified: true,

      },
    ]);

  },

  async down(queryInterface, _Sequelize) {
    // 🔹 Xóa trigger + function nếu tồn tại
    await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_set_updated_at') THEN
        DROP TRIGGER trg_users_set_updated_at ON users;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP FUNCTION update_updated_at_column();
      END IF;
    END;
    $$;
  `);

    await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_set_deleted_timestamp') THEN
        DROP TRIGGER trg_users_set_deleted_timestamp ON users;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_deleted_timestamp') THEN
        DROP FUNCTION set_deleted_timestamp();
      END IF;
    END;
    $$;
  `);

    await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_set_last_login') THEN
        DROP TRIGGER trg_users_set_last_login ON users;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_last_login_on_verify') THEN
        DROP FUNCTION set_last_login_on_verify();
      END IF;
    END;
    $$;
  `);

    // 🔹 Cuối cùng mới drop table
    await queryInterface.dropTable("users");
  }

};
