"use strict";

/**
 * Migration: Create "role_permissions" table
 * --------------------------------------------
 * Bảng "role_permissions" là bảng trung gian giữa "roles" và "permissions"
 * để xác định quyền cụ thể mà mỗi vai trò (role) được phép thực hiện.
 *
 * Một role có thể có nhiều permissions.
 * Một permission có thể thuộc về nhiều roles.
 *
 * Bao gồm:
 *  - Khóa ngoại đến roles & permissions
 *  - Các cột kiểm soát trạng thái
 *  - Trigger tự động cập nhật updated_at và xóa mềm
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const { INTEGER, BOOLEAN, DATE } = _Sequelize;

    // =============================================
    // 🧱 1️⃣ Tạo bảng role_permissions
    // =============================================
    await queryInterface.createTable("role_permissions", {
      id: {
        type: INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: "Khóa chính",
      },
      role_id: {
        type: INTEGER,
        allowNull: false,
        comment: "ID vai trò (FK → roles.id)",
        references: {
          model: "roles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      permission_id: {
        type: INTEGER,
        allowNull: false,
        comment: "ID quyền (FK → permissions.id)",
        references: {
          model: "permissions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      is_active: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Cờ kích hoạt mối quan hệ role-permission",
      },
      is_deleted: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Cờ xóa mềm (soft delete)",
      },
      deleted_at: {
        type: DATE,
        allowNull: true,
        comment: "Thời điểm bị xóa mềm",
      },
      created_at: {
        type: DATE,
        allowNull: false,
        defaultValue: _Sequelize.literal("NOW()"),
        comment: "Thời điểm tạo bản ghi",
      },
      updated_at: {
        type: DATE,
        allowNull: false,
        defaultValue: _Sequelize.literal("NOW()"),
        comment: "Thời điểm cập nhật bản ghi",
      },
    });

    // =============================================
    // ⚡ 2️⃣ Tạo các chỉ mục (indexes)
    // =============================================
    await queryInterface.addIndex("role_permissions", ["role_id"], {
      name: "idx_role_permissions_role",
    });
    await queryInterface.addIndex("role_permissions", ["permission_id"], {
      name: "idx_role_permissions_perm",
    });
    await queryInterface.addIndex(
      "role_permissions",
      ["role_id", "permission_id"],
      {
        name: "idx_role_permissions_composite",
        unique: true,
      }
    );
    await queryInterface.addIndex("role_permissions", ["is_active"], {
      name: "idx_role_permissions_active",
    });
    await queryInterface.addIndex("role_permissions", ["is_deleted"], {
      name: "idx_role_permissions_deleted",
    });

    // =============================================
    // 🧠 3️⃣ Trigger tự động cập nhật updated_at và soft delete
    // =============================================
    await queryInterface.sequelize.query(`
      -- 🔄 Cập nhật tự động cột updated_at khi UPDATE
      CREATE OR REPLACE FUNCTION update_role_permissions_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_role_permissions_updated_at
      BEFORE UPDATE ON role_permissions
      FOR EACH ROW
      EXECUTE FUNCTION update_role_permissions_timestamp();

      -- 🧹 Xóa mềm (soft delete) thay cho DELETE thực sự
      CREATE OR REPLACE FUNCTION soft_delete_role_permissions()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE role_permissions
        SET is_deleted = TRUE,
            deleted_at = NOW()
        WHERE id = OLD.id;
        RETURN NULL; -- Ngăn DELETE thực tế
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_soft_delete_role_permissions
      BEFORE DELETE ON role_permissions
      FOR EACH ROW
      EXECUTE FUNCTION soft_delete_role_permissions();
    `);
  },

  // =============================================
  // 🔙 4️⃣ Rollback: Xóa trigger và bảng
  // =============================================
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_role_permissions_updated_at ON role_permissions;
      DROP TRIGGER IF EXISTS trg_soft_delete_role_permissions ON role_permissions;
      DROP FUNCTION IF EXISTS update_role_permissions_timestamp;
      DROP FUNCTION IF EXISTS soft_delete_role_permissions;
    `);

    await queryInterface.dropTable("role_permissions");
  },
};
