"use strict";

/**
 * Migration: Create "user_roles" table (hoàn chỉnh)
 * -------------------------------------------------
 * Bảng trung gian (junction table) giữa "users" và "roles"
 * trong mô hình RBAC (Role-Based Access Control).
 *
 * Một user có thể có nhiều role và ngược lại.
 * Bảng này dùng để xác định vai trò của mỗi người dùng.
 *
 * Tính năng bổ sung:
 *  - Ràng buộc FK chặt chẽ
 *  - Index tối ưu cho truy vấn
 *  - Trigger tự động cập nhật updated_at
 *  - Rollback sạch sẽ
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, BOOLEAN, DATE } = Sequelize;

    // ==========================================================
    // 1️⃣ CREATE TABLE
    // ==========================================================
    await queryInterface.createTable("user_roles", {
      id: {
        type: INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: "Khóa chính",
      },
      user_id: {
        type: INTEGER,
        allowNull: false,
        comment: "Khóa ngoại trỏ đến users.id",
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role_id: {
        type: INTEGER,
        allowNull: false,
        comment: "Khóa ngoại trỏ đến roles.id",
        references: { model: "roles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      is_active: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Cờ kích hoạt mối quan hệ user-role",
      },
      is_deleted: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Cờ đánh dấu xóa mềm",
      },
      deleted_at: {
        type: DATE,
        allowNull: true,
        comment: "Thời điểm bị xóa mềm",
      },
      created_at: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
        comment: "Thời điểm tạo bản ghi",
      },
      updated_at: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
        comment: "Thời điểm cập nhật bản ghi",
      },
    });

    // ==========================================================
    // 2️⃣ CREATE INDEXES
    // ==========================================================
    await queryInterface.addIndex("user_roles", ["user_id"], {
      name: "idx_user_roles_user",
    });
    await queryInterface.addIndex("user_roles", ["role_id"], {
      name: "idx_user_roles_role",
    });
    await queryInterface.addIndex("user_roles", ["user_id", "role_id"], {
      name: "idx_user_roles_composite",
      unique: true,
    });
    await queryInterface.addIndex("user_roles", ["is_active"], {
      name: "idx_user_roles_active",
    });
    await queryInterface.addIndex("user_roles", ["is_deleted"], {
      name: "idx_user_roles_deleted",
    });

    // ==========================================================
    // 3️⃣ CREATE TRIGGERS
    // ==========================================================
    await queryInterface.sequelize.query(`
      -- Trigger #1: Tự động cập nhật updated_at khi có UPDATE
      CREATE OR REPLACE FUNCTION update_user_roles_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_user_roles_update_timestamp
      BEFORE UPDATE ON user_roles
      FOR EACH ROW
      EXECUTE FUNCTION update_user_roles_timestamp();
    `);

    await queryInterface.sequelize.query(`
      -- Trigger #2: Tự động cập nhật deleted_at khi is_deleted = TRUE
      CREATE OR REPLACE FUNCTION set_user_roles_deleted_at()
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

      CREATE TRIGGER trg_user_roles_deleted_at
      BEFORE UPDATE OF is_deleted ON user_roles
      FOR EACH ROW
      EXECUTE FUNCTION set_user_roles_deleted_at();
    `);

    // ==========================================================
    // 4️⃣ SEED (Tùy chọn): Gán role Admin cho user đầu tiên
    // ==========================================================
    await queryInterface.bulkInsert("user_roles", [
      {
        user_id: 1,
        role_id: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  // ==========================================================
  // 🔙 ROLLBACK
  // ==========================================================
  async down(queryInterface) {
    // Xóa trigger
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_user_roles_update_timestamp ON user_roles;
      DROP FUNCTION IF EXISTS update_user_roles_timestamp;

      DROP TRIGGER IF EXISTS trg_user_roles_deleted_at ON user_roles;
      DROP FUNCTION IF EXISTS set_user_roles_deleted_at;
    `);

    // Xóa seed
    await queryInterface.bulkDelete("user_roles", { user_id: 1, role_id: 1 });

    // Xóa index
    await queryInterface.removeIndex("user_roles", "idx_user_roles_user");
    await queryInterface.removeIndex("user_roles", "idx_user_roles_role");
    await queryInterface.removeIndex("user_roles", "idx_user_roles_composite");
    await queryInterface.removeIndex("user_roles", "idx_user_roles_active");
    await queryInterface.removeIndex("user_roles", "idx_user_roles_deleted");

    // Cuối cùng: Xóa bảng
    await queryInterface.dropTable("user_roles");
  },
};
