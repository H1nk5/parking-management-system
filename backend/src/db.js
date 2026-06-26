/**
 * 数据库连接模块
 * 功能：提供SQLite数据库连接和基础查询方法
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '..', 'parking.db');

let db = null;

/**
 * 初始化数据库连接
 * @returns {Promise<Object>} 数据库实例
 */
async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // 如果数据库文件存在则读取，否则创建新数据库
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

/**
 * 保存数据库到文件
 */
function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * 执行查询并返回结果
 * @param {string} sql SQL查询语句
 * @param {Array} params 参数数组
 * @returns {Array} 查询结果数组
 */
async function query(sql, params = []) {
  const database = await getDb();
  const stmt = database.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * 执行SQL语句（INSERT, UPDATE, DELETE）
 * @param {string} sql SQL语句
 * @param {Array} params 参数数组
 * @returns {Object} 执行结果
 */
async function run(sql, params = []) {
  const database = await getDb();
  database.run(sql, params);
  saveDb();

  // 返回最后插入的ID
  const lastId = database.exec('SELECT last_insert_rowid() as id');
  return {
    lastID: lastId[0]?.values[0][0] || 0,
    changes: database.getRowsModified()
  };
}

/**
 * 获取单条记录
 * @param {string} sql SQL查询语句
 * @param {Array} params 参数数组
 * @returns {Object|null} 记录对象或null
 */
async function getOne(sql, params = []) {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}

module.exports = {
  getDb,
  saveDb,
  query,
  run,
  getOne
};
