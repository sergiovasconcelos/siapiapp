// src/screens/AttendanceScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SERVER_URL } from '../config';

export default function AttendanceScreen({ route, navigation }) {
  const { child } = route.params; // Recebe os dados da criança da tela anterior
  const [actions, setActions] = useState('');
  const [location, setLocation] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Recupera token salvo no login
    AsyncStorage.getItem('token').then(t => {
      if (t) setToken(t);
    });
  }, []);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da sua localização para registrar o atendimento.');
      return null;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
    return loc.coords;
  };

  const handleStart = async () => {
    const coords = await getLocation();
    if (!coords) return;

    try {
      const res = await axios.post(
        `${SERVER_URL}/api/attendances/start`,
        {
          child_id: child.id, // usa o id da criança, conforme backend
          started_lat: coords.latitude,
          started_lng: coords.longitude,
          started_at: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Sucesso', `Atendimento iniciado (ID ${res.data.attendanceId}).`);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', err.response?.data?.error || err.message);
    }
  };

  const handleFinish = async () => {
    const coords = await getLocation();
    if (!coords) return;

    try {
      // Buscar último atendimento ativo dessa criança
      const resAttendances = await axios.get(
        `${SERVER_URL}/api/attendances?status=INICIADO`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const activeAttendance = resAttendances.data.find(a => a.child_id === child.id);
      if (!activeAttendance) {
        Alert.alert('Erro', 'Nenhum atendimento iniciado para esta criança.');
        return;
      }

      await axios.post(
        `${SERVER_URL}/api/attendances/${activeAttendance.id}/finish`,
        {
          finished_lat: coords.latitude,
          finished_lng: coords.longitude,
          finished_at: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Salva ações no banco
      if (actions.trim()) {
        await axios.post(
          `${SERVER_URL}/api/attendances/${activeAttendance.id}/actions`,
          { descricao: actions },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      Alert.alert('Sucesso', 'Atendimento finalizado.');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', err.response?.data?.error || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome: {child.nome}</Text>
      <Text style={styles.label}>Data de Nascimento: {child.data_nascimento}</Text>
      <Text style={styles.label}>CPF: {child.cpf}</Text>

      <Text style={styles.label}>Ações Realizadas:</Text>
      <TextInput
        style={styles.input}
        value={actions}
        onChangeText={setActions}
        multiline
      />

      <View style={styles.buttonContainer}>
        <Button title="Iniciar Atendimento" onPress={handleStart} />
        <Button title="Finalizar Atendimento" onPress={handleFinish} />
      </View>

      <TouchableOpacity style={styles.mapButton} onPress={() => navigation.navigate('Map')}>
        <Text style={styles.mapButtonText}>Atendimentos Realizados</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontWeight: 'bold', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, minHeight: 80 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  mapButton: {
    marginTop: 20,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
