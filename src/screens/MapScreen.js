// src/screens/MapScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { SERVER_URL } from '../config';

export default function MapScreen() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAttendances = async () => {
    setLoading(true);
    const state = await NetInfo.fetch();

    if (state.isConnected) {
      try {
        const res = await axios.get(`${SERVER_URL}/api/attendances`);
        setAttendances(res.data);
        await AsyncStorage.setItem('offlineAttendances', JSON.stringify(res.data));
      } catch (err) {
        console.log('Erro ao buscar atendimentos do servidor:', err.message);
        let offline = await AsyncStorage.getItem('offlineAttendances');
        setAttendances(offline ? JSON.parse(offline) : []);
      }
    } else {
      let offline = await AsyncStorage.getItem('offlineAttendances');
      setAttendances(offline ? JSON.parse(offline) : []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAttendances();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text>Carregando atendimentos...</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: attendances[0]?.latitude || -23.55052,
        longitude: attendances[0]?.longitude || -46.633308,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {attendances.map((att, index) => (
        <Marker
          key={index}
          coordinate={{ latitude: att.latitude, longitude: att.longitude }}
          title={att.childName}
          description={`${att.status} em ${new Date(att.date).toLocaleString()}`}
          pinColor={att.status.toLowerCase() === 'finalizada' ? 'green' : 'orange'}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
