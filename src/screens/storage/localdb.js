import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('siapiapp.db');

export function initLocalDB() {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS attendances_local (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tempId INTEGER,
        serverId INTEGER,
        child_id INTEGER,
        professional_cpf TEXT,
        status TEXT,
        started_at TEXT,
        started_lat REAL,
        started_lng REAL,
        finished_at TEXT,
        finished_lat REAL,
        finished_lng REAL,
        sync_status TEXT
      );`
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS actions_local (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tempId INTEGER,
        serverId INTEGER,
        attendanceTempId INTEGER,
        attendanceServerId INTEGER,
        descricao TEXT,
        sync_status TEXT
      );`
    );
  });
}

export function saveAttendanceLocal(att) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO attendances_local (tempId, serverId, child_id, professional_cpf, status, started_at, started_lat, started_lng, finished_at, finished_lat, finished_lng, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          att.tempId,
          att.serverId || null,
          att.child_id,
          att.professional_cpf,
          att.status,
          att.started_at,
          att.started_lat,
          att.started_lng,
          att.finished_at,
          att.finished_lat,
          att.finished_lng,
          att.sync_status || 'pending'
        ],
        (_, result) => resolve(result.insertId),
        (_, error) => reject(error)
      );
    });
  });
}

export function getAttendanceLocalByTempId(tempId) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM attendances_local WHERE tempId = ?`,
        [tempId],
        (_, { rows }) => resolve(rows._array[0]),
        (_, err) => reject(err)
      );
    });
  });
}

export function getAllPendingAttendances() {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM attendances_local WHERE sync_status = 'pending'`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, err) => reject(err)
      );
    });
  });
}

export function markAttendanceSynced(localId, serverId) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE attendances_local SET sync_status = 'synced', serverId = ? WHERE id = ?`,
        [serverId, localId],
        (_, r) => resolve(r),
        (_, e) => reject(e)
      );
    });
  });
}

export function markAttendanceLocalFinished(tempId, finish) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE attendances_local SET finished_at = ?, finished_lat = ?, finished_lng = ?, status = 'FINALIZADO', sync_status = 'pending' WHERE tempId = ?`,
        [finish.finished_at, finish.finished_lat, finish.finished_lng, tempId],
        (_, r) => resolve(r),
        (_, e) => reject(e)
      );
    });
  });
}

// actions local
export function saveActionLocal({ attendanceTempId, descricao }) {
  return new Promise((resolve, reject) => {
    const tempId = Date.now() * -1;
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO actions_local (tempId, serverId, attendanceTempId, attendanceServerId, descricao, sync_status) VALUES (?, ?, ?, ?, ?, ?)`,
        [tempId, null, attendanceTempId, null, descricao, 'pending'],
        (_, r) => resolve(r.insertId),
        (_, e) => reject(e)
      );
    });
  });
}

export function getActionsLocalByAttendanceTempId(attendanceTempId) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM actions_local WHERE attendanceTempId = ? ORDER BY id`,
        [attendanceTempId],
        (_, { rows }) => resolve(rows._array),
        (_, e) => reject(e)
      );
    });
  });
}

export function getAllPendingActions() {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM actions_local WHERE sync_status = 'pending'`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, e) => reject(e)
      );
    });
  });
}

export function markActionSynced(localId, serverId, attendanceServerId) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE actions_local SET sync_status = 'synced', serverId = ?, attendanceServerId = ? WHERE id = ?`,
        [serverId, attendanceServerId, localId],
        (_, r) => resolve(r),
        (_, e) => reject(e)
      );
    });
  });
}

// atualizar ação local (edição)
export function updateActionLocal(localId, descricao) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE actions_local SET descricao = ?, sync_status = 'pending' WHERE id = ?`,
        [descricao, localId],
        (_, r) => resolve(r),
        (_, e) => reject(e)
      );
    });
  });
}

// deletar ação local
export function deleteActionLocal(localId) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM actions_local WHERE id = ?`,
        [localId],
        (_, r) => resolve(r),
        (_, e) => reject(e)
      );
    });
  });
}
