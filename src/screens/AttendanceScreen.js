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
  const [professionalCpf, setProfessionalCpf] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('professionalCpf').then(cpf => setProfessionalCpf(cpf));
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
      await axios.post(`${SERVER_URL}/api/attendance/start`, {
        childCpf: child.cpf,
        professionalCpf,
        latitude: coords.latitude,
        longitude: coords.longitude,
        startedAt: new Date().toISOString(),
      });
      Alert.alert('Sucesso', 'Atendimento iniciado.');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || err.message);
    }
  };

  const handleFinish = async () => {
    const coords = await getLocation();
    if (!coords) return;

    try {
      await axios.post(`${SERVER_URL}/api/attendance/finish`, {
        childCpf: child.cpf,
        professionalCpf,
        latitude: coords.latitude,
        longitude: coords.longitude,
        finishedAt: new Date().toISOString(),
        actionsPerformed: actions,
        status: 'FINALIZADA',
      });
      Alert.alert('Sucesso', 'Atendimento finalizado.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || err.message);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post(`${SERVER_URL}/api/attendance/save`, {
        childCpf: child.cpf,
        professionalCpf,
        actionsPerformed: actions,
      });
      Alert.alert('Sucesso', 'Ações salvas.');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome: {child.name}</Text>
      <Text style={styles.label}>Data de Nascimento: {child.birthDate}</Text>
      <Text style={styles.label}>Idade: {child.age}</Text>
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
        <Button title="Salvar" onPress={handleSave} />
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
