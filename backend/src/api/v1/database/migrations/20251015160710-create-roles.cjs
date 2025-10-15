"use strict";

/**
 * Migration: Create "roles" table (Hoàn chỉnh)
 * ---------------------------------------------
 * Bảng roles quản lý các vai trò người dùng (RBAC).
 *
 * Bao gồm:
 *  - role_name, role_code: định danh vai trò
 *  - permissions: quyền dạng JSONB
 *  - is_system / is_active / is_deleted: trạng thái
 *  - creator_id, modifier_id: audit
 *
 * Trigger:
 *  - Tự động cập nhật updated_at khi có UPDATE
 *
 * Seed:
 *  - Tạo sẵn 2 vai trò mặc định: ADMIN, USER
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, STRING, TEXT, JSONB, BOOLEAN, DATE } = Sequelize;

    // ==========================================================
    // 1️⃣ CREATE TABLE "roles"
    // ==========================================================
    await queryInterface.createTable("roles", {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: "Khóa chính",
      },
      role_name: {
        type: STRING(50),
        allowNull: false,
        unique: true,
        comment: "Tên vai trò (VD: Administrator, User)",
      },
      role_code: {
        type: STRING(50),
        allowNull: false,
        unique: true,
        comment: "Mã định danh duy nhất cho role (VD: ADMIN, USER)",
      },
      description: {
        type: TEXT,
        allowNull: true,
        comment: "Mô tả ngắn gọn về vai trò",
      },
      permissions: {
        type: JSONB,
        allowNull: false,
        defaultValue: {},
        comment: "Danh sách quyền của vai trò ở dạng JSONB",
      },
      is_system: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Đánh dấu vai trò mặc định của hệ thống",
      },
      is_active: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Vai trò đang hoạt động",
      },
      is_deleted: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Soft delete flag",
      },
      creator_id: {
        type: INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "Người tạo vai trò",
      },
      modifier_id: {
        type: INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "Người chỉnh sửa gần nhất",
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
        comment: "Thời điểm cập nhật bản ghi gần nhất",
      },
    });

    // ==========================================================
    // 2️⃣ ADD INDEXES
    // ==========================================================
    await queryInterface.addIndex("roles", ["role_name"], { name: "idx_roles_name", unique: true });
    await queryInterface.addIndex("roles", ["role_code"], { name: "idx_roles_code", unique: true });
    await queryInterface.addIndex("roles", ["is_active"], { name: "idx_roles_active" });
    await queryInterface.addIndex("roles", ["is_deleted"], { name: "idx_roles_deleted" });
    await queryInterface.addIndex("roles", ["is_system"], { name: "idx_roles_system" });

    // ==========================================================
    // 3️⃣ CREATE TRIGGER - cập nhật updated_at khi UPDATE
    // ==========================================================
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_roles_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_roles_updated_at
      BEFORE UPDATE ON roles
      FOR EACH ROW
      EXECUTE FUNCTION update_roles_timestamp();
    `);

    // ==========================================================
    // 4️⃣ SEED DỮ LIỆU MẶC ĐỊNH
    // ==========================================================
    await queryInterface.bulkInsert("roles", [
      {
        role_name: "Administrator",
        role_code: "ADMIN",
        description: "Quyền quản trị toàn hệ thống",
        permissions: JSON.stringify({ full_access: true }),
        is_system: true,
        is_active: true,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role_name: "User",
        role_code: "USER",
        description: "Quyền cơ bản cho người dùng thường",
        permissions: JSON.stringify({ view_profile: true }),
        is_system: true,
        is_active: true,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  // ==========================================================
  // 🔙 ROLLBACK (down)
  // ==========================================================
  async down(queryInterface) {
    // Xóa trigger và function trước
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
      DROP FUNCTION IF EXISTS update_roles_timestamp;
    `);

    // Xóa dữ liệu seed (nếu rollback)
    await queryInterface.bulkDelete("roles", {
      role_code: ["ADMIN", "USER"],
    });

    // Xóa indexes
    await queryInterface.removeIndex("roles", "idx_roles_name");
    await queryInterface.removeIndex("roles", "idx_roles_code");
    await queryInterface.removeIndex("roles", "idx_roles_active");
    await queryInterface.removeIndex("roles", "idx_roles_deleted");
    await queryInterface.removeIndex("roles", "idx_roles_system");

    // Cuối cùng: xóa bảng
    await queryInterface.dropTable("roles");
  },
};
