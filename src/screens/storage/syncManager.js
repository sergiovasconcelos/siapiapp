import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import axios from 'axios';
import { SERVER_URL } from '../config';
import { getAllPendingActions, getAllPendingAttendances, initLocalDB } from './localdb';

/**
 * Helpers that run small queries to update rows by tempId.
 * Using expo-sqlite directly here to avoid circular imports.
 */
import * as SQLite from 'expo-sqlite';

// start the manager
export function startSyncManager() {
  initLocalDB();
  // subscribe
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      runSync();
    }
  });
}

async function runSync() {
  const token = await AsyncStorage.getItem('token');
  if (!token) return;

  const attendances = await getAllPendingAttendances();
  const actions = await getAllPendingActions();

  // Prepare payload using tempIds so server can map
  const attPayload = attendances.map(a => ({
    tempId: a.tempId,
    child_id: a.child_id,
    status: a.status,
    started_at: a.started_at,
    started_lat: a.started_lat,
    started_lng: a.started_lng,
    finished_at: a.finished_at,
    finished_lat: a.finished_lat,
    finished_lng: a.finished_lng
  }));

  const actPayload = actions.map(act => ({
    tempId: act.tempId,
    attendanceTempId: act.attendanceTempId,
    descricao: act.descricao
  }));

  if (attPayload.length === 0 && actPayload.length === 0) return;

  try {
    const res = await axios.post(`${SERVER_URL}/api/sync`, { attendances: attPayload, actions: actPayload }, { headers: { Authorization: `Bearer ${token}` }});
    if (res.data && res.data.mapping) {
      const mapping = res.data.mapping;

      // mark attendances as synced locally
      for (const m of mapping.attendances) {
        // find local by tempId and update serverId
        // we need localId to call markAttendanceSynced. Simplest: query local table for tempId -> but we didn't implement helper.
        // Quick approach: run a small SQL to update by tempId. For simplicity here, call markAttendanceSynced by scanning local table
        // Implement quick helper below (but for brevity we call markAttendanceSynced with localId = find it)
        // We'll implement a helper to find local id by tempId.

        await updateLocalAttendanceServerId(m.tempId, m.id);
      }

      // actions
      for (const a of mapping.actions) {
        await updateLocalActionServerId(a.tempId, a.id, a.attendanceId);
      }
    }
  } catch (err) {
    console.log('Erro ao sincronizar:', err.message || err);
  }
}
const db = SQLite.openDatabase('siapiapp.db');

function updateLocalAttendanceServerId(tempId, serverId) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE attendances_local SET serverId = ?, sync_status = 'synced' WHERE tempId = ?`,
        [serverId, tempId],
        (_, r) => resolve(r),
        (_, e) => reject(e)
      );
    });
  });
}

function updateLocalActionServerId(tempId, serverId, attendanceServerId) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE actions_local SET serverId = ?, attendanceServerId = ?, sync_status = 'synced' WHERE tempId = ?`,
        [serverId, attendanceServerId, tempId],
        (_, r) => resolve(r),
        (_, e) => reject(e)
      );
    });
  });
}
