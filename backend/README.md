# Backend Thế giới di động
** Tech stack :
- Nodejs + expressjs 
- express-rate-limit 
  - [x] limted;
- helmet
- jsonwebtoken
- redis
- postgres + sequelize-CLI

## Database has 42 tables

# === BATCH 1: CORE AUTH ===
npx sequelize-cli migration:generate --name create-users
npx sequelize-cli migration:generate --name create-user-tokens
npx sequelize-cli migration:generate --name create-otp-tokens
npx sequelize-cli migration:generate --name create-roles
npx sequelize-cli migration:generate --name create-permissions
npx sequelize-cli migration:generate --name create-user-roles
npx sequelize-cli migration:generate --name create-role-permissions






