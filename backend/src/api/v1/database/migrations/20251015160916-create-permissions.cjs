"use strict";

/**
 * Migration: Create "permissions" table (Hoàn chỉnh)
 * ---------------------------------------------------
 * Bảng "permissions" lưu danh sách các quyền cụ thể trong hệ thống.
 *
 * Ví dụ:
 *   - VIEW_USER: Xem người dùng
 *   - CREATE_POST: Tạo bài viết
 *   - DELETE_COMMENT: Xóa bình luận
 *
 * Tính năng:
 *  - Hỗ trợ soft-delete
 *  - Có trigger tự động cập nhật updated_at khi UPDATE
 *  - Có seed dữ liệu quyền cơ bản
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, STRING, TEXT, BOOLEAN, DATE } = Sequelize;

    // ==========================================================
    // 1️⃣ CREATE TABLE
    // ==========================================================
    await queryInterface.createTable("permissions", {
      id: {
        type: INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: "Khóa chính",
      },
      permission_name: {
        type: STRING(100),
        allowNull: false,
        unique: true,
        comment: "Tên hiển thị của quyền (vd: Xem người dùng)",
      },
      permission_code: {
        type: STRING(100),
        allowNull: false,
        unique: true,
        comment: "Mã duy nhất cho quyền (vd: USER_VIEW)",
      },
      description: {
        type: TEXT,
        allowNull: true,
        comment: "Mô tả chi tiết quyền",
      },
      module: {
        type: STRING(50),
        allowNull: true,
        comment: "Tên module liên quan (vd: 'user', 'post')",
      },
      action: {
        type: STRING(50),
        allowNull: true,
        comment: "Hành động (vd: 'create', 'delete', 'update')",
      },
      resource: {
        type: STRING(50),
        allowNull: true,
        comment: "Tài nguyên (vd: 'profile', 'settings')",
      },
      is_system: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Quyền mặc định của hệ thống",
      },
      is_active: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Trạng thái hoạt động của quyền",
      },
      is_deleted: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Cờ đánh dấu quyền đã bị xóa mềm",
      },
      creator_id: {
        type: INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "Người tạo quyền",
      },
      modifier_id: {
        type: INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "Người chỉnh sửa quyền lần cuối",
      },
      deleted_at: {
        type: DATE,
        allowNull: true,
        comment: "Thời điểm xóa mềm",
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
    await queryInterface.addIndex("permissions", ["permission_name"], {
      name: "idx_permissions_name",
      unique: true,
    });
    await queryInterface.addIndex("permissions", ["permission_code"], {
      name: "idx_permissions_code",
      unique: true,
    });
    await queryInterface.addIndex("permissions", ["module"], {
      name: "idx_permissions_module",
    });
    await queryInterface.addIndex("permissions", ["is_active"], {
      name: "idx_permissions_active",
    });
    await queryInterface.addIndex("permissions", ["is_deleted"], {
      name: "idx_permissions_deleted",
    });
    await queryInterface.addIndex(
      "permissions",
      ["module", "action", "resource"],
      { name: "idx_permissions_module_action_resource" }
    );

    // ==========================================================
    // 3️⃣ CREATE TRIGGER — cập nhật updated_at khi UPDATE
    // ==========================================================
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_permissions_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_permissions_updated_at
      BEFORE UPDATE ON permissions
      FOR EACH ROW
      EXECUTE FUNCTION update_permissions_timestamp();
    `);

    // ==========================================================
    // 4️⃣ SEED DỮ LIỆU QUYỀN CƠ BẢN
    // ==========================================================
    await queryInterface.bulkInsert("permissions", [
      {
        permission_name: "Xem người dùng",
        permission_code: "USER_VIEW",
        module: "user",
        action: "view",
        resource: "profile",
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        permission_name: "Tạo người dùng",
        permission_code: "USER_CREATE",
        module: "user",
        action: "create",
        resource: "profile",
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        permission_name: "Cập nhật người dùng",
        permission_code: "USER_UPDATE",
        module: "user",
        action: "update",
        resource: "profile",
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        permission_name: "Xóa người dùng",
        permission_code: "USER_DELETE",
        module: "user",
        action: "delete",
        resource: "profile",
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  // ==========================================================
  // 🔙 ROLLBACK (down)
  // ==========================================================
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_permissions_updated_at ON permissions;
      DROP FUNCTION IF EXISTS update_permissions_timestamp;
    `);

    await queryInterface.bulkDelete("permissions", {
      permission_code: [
        "USER_VIEW",
        "USER_CREATE",
        "USER_UPDATE",
        "USER_DELETE",
      ],
    });

    await queryInterface.removeIndex("permissions", "idx_permissions_name");
    await queryInterface.removeIndex("permissions", "idx_permissions_code");
    await queryInterface.removeIndex("permissions", "idx_permissions_module");
    await queryInterface.removeIndex("permissions", "idx_permissions_active");
    await queryInterface.removeIndex("permissions", "idx_permissions_deleted");
    await queryInterface.removeIndex(
      "permissions",
      "idx_permissions_module_action_resource"
    );

    await queryInterface.dropTable("permissions");
  },
};
