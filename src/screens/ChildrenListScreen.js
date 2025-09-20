import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../config';

export default function ChildrenListScreen({ navigation }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const token = await AsyncStorage.getItem('token'); // token JWT do login
      if (!token) {
        Alert.alert('Erro', 'Usuário não autenticado');
        return;
      }

      const res = await axios.get(`${SERVER_URL}/api/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setChildren(res.data); // salva os dados no estado
      setLoading(false);
    } catch (err) {
      console.log(err);
      Alert.alert('Erro', 'Não foi possível carregar as crianças.');
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Attendance', { child: item })}
    >
      <Text style={styles.name}>{item.nome}</Text>
      <Text>CPF: {item.cpf}</Text>
      <Text>Data de Nascimento: {item.data_nascimento}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Carregando crianças...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={children}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 20 }}
      ListEmptyComponent={<Text>Nenhuma criança encontrada.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
