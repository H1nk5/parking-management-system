/**
 * 数据库初始化脚本
 * 功能：创建SQLite数据库表结构并插入模拟测试数据
 * 使用sql.js（纯JavaScript实现，无需编译）
 */

const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '..', 'parking.db');

async function initDatabase() {
  console.log('🗄️  正在初始化数据库...');

  // 初始化SQL.js
  const SQL = await initSqlJs();

  // 创建新数据库
  const db = new SQL.Database();

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON');

  // ============================================================
  // 创建表结构
  // ============================================================

  // 1. 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. 业主信息表
  db.run(`
    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      building TEXT NOT NULL,
      unit TEXT NOT NULL,
      room TEXT NOT NULL,
      car_plate TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 3. 车位表
  db.run(`
    CREATE TABLE IF NOT EXISTS parking_spots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spot_number TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
      owner_id INTEGER,
      rent_start DATE,
      rent_end DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES owners(id)
    )
  `);

  // 4. 报修表
  db.run(`
    CREATE TABLE IF NOT EXISTS repair_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      spot_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('parking', 'public')) DEFAULT 'parking',
      status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
    )
  `);

  // 5. 维修表
  db.run(`
    CREATE TABLE IF NOT EXISTS repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL UNIQUE,
      worker_name TEXT NOT NULL,
      start_time DATETIME,
      end_time DATETIME,
      result TEXT,
      cost REAL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES repair_requests(id)
    )
  `);

  // 6. 费用表
  db.run(`
    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('rent', 'management', 'repair')),
      amount REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('unpaid', 'paid')) DEFAULT 'unpaid',
      due_date DATE NOT NULL,
      paid_date DATE,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 7. 材料表
  db.run(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specification TEXT,
      unit TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 8. 材料使用记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS material_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      repair_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (repair_id) REFERENCES repairs(id)
    )
  `);

  // 9. 评价表
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      repair_id INTEGER NOT NULL UNIQUE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (repair_id) REFERENCES repairs(id)
    )
  `);

  console.log('✅ 表结构创建完成');

  // ============================================================
  // 插入模拟测试数据（使用真正的 bcrypt 哈希）
  // ============================================================

  // 使用 bcrypt 生成真正的密码哈希
  const hashPassword = (pwd) => bcrypt.hashSync(pwd, 10);

  // 插入用户数据
  const insertUser = `INSERT OR IGNORE INTO users (username, password, real_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)`;

  // 管理员账号
  db.run(insertUser, ['admin', hashPassword('admin123'), '张经理', '13800138000', 'admin@parking.com', 'admin']);

  // 业主账号
  const users = [
    ['user1', hashPassword('123456'), '李明', '13900139001', 'liming@email.com', 'user'],
    ['user2', hashPassword('123456'), '王芳', '13900139002', 'wangfang@email.com', 'user'],
    ['user3', hashPassword('123456'), '赵强', '13900139003', 'zhaoqiang@email.com', 'user'],
    ['user4', hashPassword('123456'), '刘洋', '13900139004', 'liuyang@email.com', 'user'],
    ['user5', hashPassword('123456'), '陈静', '13900139005', 'chenjing@email.com', 'user'],
  ];

  users.forEach(u => db.run(insertUser, u));
  console.log('✅ 用户数据插入完成');

  // 插入业主信息
  const insertOwner = `INSERT OR IGNORE INTO owners (user_id, building, unit, room, car_plate) VALUES (?, ?, ?, ?, ?)`;

  const owners = [
    [2, 'A栋', '1单元', '101', '京A12345'],
    [3, 'A栋', '1单元', '102', '京B23456'],
    [4, 'A栋', '2单元', '201', '京C34567'],
    [5, 'B栋', '1单元', '301', '京D45678'],
    [6, 'B栋', '2单元', '401', '京E56789'],
  ];

  owners.forEach(o => db.run(insertOwner, o));
  console.log('✅ 业主信息插入完成');

  // 插入车位数据
  const insertSpot = `INSERT OR IGNORE INTO parking_spots (spot_number, location, status, owner_id, rent_start, rent_end) VALUES (?, ?, ?, ?, ?, ?)`;

  const spots = [
    ['A-001', 'A栋地下一层', 'occupied', 1, '2026-01-01', '2027-01-01'],
    ['A-002', 'A栋地下一层', 'occupied', 2, '2026-01-01', '2027-01-01'],
    ['A-003', 'A栋地下一层', 'available', null, null, null],
    ['A-004', 'A栋地下二层', 'occupied', 3, '2026-03-01', '2027-03-01'],
    ['B-001', 'B栋地下一层', 'occupied', 4, '2026-02-01', '2027-02-01'],
    ['B-002', 'B栋地下一层', 'occupied', 5, '2026-02-01', '2027-02-01'],
    ['B-003', 'B栋地下一层', 'maintenance', null, null, null],
    ['B-004', 'B栋地下二层', 'available', null, null, null],
  ];

  spots.forEach(s => db.run(insertSpot, s));
  console.log('✅ 车位数据插入完成');

  // 插入报修数据
  const insertRequest = `INSERT OR IGNORE INTO repair_requests (user_id, spot_id, title, description, type, status) VALUES (?, ?, ?, ?, ?, ?)`;

  const requests = [
    [2, 1, '车位地面破损', '车位A-001地面出现裂缝，需要修补', 'parking', 'completed'],
    [3, null, '地下车库照明故障', 'A栋地下一层多个灯管不亮', 'public', 'processing'],
    [4, 4, '车位锁损坏', '车位锁无法正常升降', 'parking', 'pending'],
    [5, null, '消防栓漏水', 'B栋地下一层消防栓有渗水现象', 'public', 'completed'],
  ];

  requests.forEach(r => db.run(insertRequest, r));
  console.log('✅ 报修数据插入完成');

  // 插入维修数据
  const insertRepair = `INSERT OR IGNORE INTO repairs (request_id, worker_name, start_time, end_time, result, cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const repairs = [
    [1, '王师傅', '2026-06-05 09:00:00', '2026-06-05 11:30:00', '地面修补完成，已养护24小时', 350, 'completed'],
    [2, '李师傅', '2026-06-18 14:00:00', null, null, 0, 'in_progress'],
    [4, '张师傅', '2026-06-03 10:00:00', '2026-06-03 12:00:00', '更换消防栓密封圈，已测试无渗漏', 180, 'completed'],
  ];

  repairs.forEach(r => db.run(insertRepair, r));
  console.log('✅ 维修数据插入完成');

  // 插入费用数据
  const insertFee = `INSERT OR IGNORE INTO fees (user_id, type, amount, status, due_date, paid_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const fees = [
    [2, 'rent', 3600, 'paid', '2026-12-31', '2026-01-10', '2026年车位租金'],
    [3, 'rent', 3600, 'unpaid', '2026-12-31', null, '2026年车位租金'],
    [2, 'management', 1200, 'paid', '2026-06-30', '2026-06-01', '2026上半年物业管理费'],
    [4, 'management', 1200, 'unpaid', '2026-06-30', null, '2026上半年物业管理费'],
    [2, 'repair', 350, 'paid', '2026-06-15', '2026-06-08', '车位地面修补费用'],
    [5, 'repair', 180, 'paid', '2026-06-10', '2026-06-05', '消防栓维修费用'],
  ];

  fees.forEach(f => db.run(insertFee, f));
  console.log('✅ 费用数据插入完成');

  // 插入材料数据
  const insertMaterial = `INSERT OR IGNORE INTO materials (name, specification, unit, quantity, unit_price) VALUES (?, ?, ?, ?, ?)`;

  const materials = [
    ['水泥', 'P.O 42.5', '袋', 50, 25],
    ['沙子', '中砂', '方', 20, 120],
    ['灯管', 'LED 18W T8', '根', 100, 15],
    ['消防栓密封圈', 'DN65', '个', 30, 8],
    ['车位锁', '标准型', '套', 10, 280],
    ['油漆', '环氧地坪漆', '桶', 15, 180],
  ];

  materials.forEach(m => db.run(insertMaterial, m));
  console.log('✅ 材料数据插入完成');

  // 插入材料使用记录
  const insertUsage = `INSERT OR IGNORE INTO material_usage (material_id, repair_id, quantity) VALUES (?, ?, ?)`;

  const usages = [
    [1, 1, 2],
    [2, 1, 0.5],
    [6, 1, 1],
    [4, 3, 2],
  ];

  usages.forEach(u => db.run(insertUsage, u));
  console.log('✅ 材料使用记录插入完成');

  // 插入评价数据
  const insertReview = `INSERT OR IGNORE INTO reviews (user_id, repair_id, rating, comment) VALUES (?, ?, ?, ?)`;

  const reviews = [
    [2, 1, 5, '维修师傅很专业，修补效果很好！'],
    [5, 3, 4, '维修及时，但希望能提前通知停水时间'],
  ];

  reviews.forEach(r => db.run(insertReview, r));
  console.log('✅ 评价数据插入完成');

  // 导出数据库到文件
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);

  // 关闭数据库
  db.close();

  console.log('\n🎉 数据库初始化完成！');
  console.log(`📁 数据库文件位置: ${DB_PATH}`);
  console.log('\n📋 测试账号:');
  console.log('   管理员: admin / admin123');
  console.log('   业  主: user1 / 123456 (或 user2~user5)');
}

// 执行初始化
initDatabase().catch(err => {
  console.error('❌ 数据库初始化失败:', err);
  process.exit(1);
});
