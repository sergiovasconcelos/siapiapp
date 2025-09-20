import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { SERVER_URL } from '../config';

export default function ChildrenListScreen({ navigation }) {
  const [children, setChildren] = useState([]);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/api/children`);
        setChildren(res.data);
      } catch (err) {
        console.log(err.message);
      }
    };
    loadChildren();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={children}
        keyExtractor={(item) => item.cpf}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.childItem}
            onPress={() => navigation.navigate('Attendance', { child: item })}
          >
            <Text style={styles.childName}>{item.name}</Text>
            <Text>{item.cpf}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  childItem: { padding: 15, borderBottomWidth: 1, borderColor: '#ccc' },
  childName: { fontWeight: 'bold', fontSize: 16 },
});
