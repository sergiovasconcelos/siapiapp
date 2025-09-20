import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useState } from 'react';
import { Alert, Button, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SERVER_URL } from '../config';

export default function LoginScreen({ navigation }) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${SERVER_URL}/api/login`, { cpf, password });
      const { token } = res.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('professionalCpf', res.data.cpf);
      navigation.replace('ChildrenList');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || err.message);
    }
  };

  return (
    <View style={{flex:1,justifyContent:'center',padding:20}}>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:12}}>
        <Icon name="user" size={22} />
        <TextInput placeholder="CPF" value={cpf} onChangeText={setCpf} style={{flex:1,marginLeft:8,borderBottomWidth:1}} />
      </View>
      <View style={{flexDirection:'row',alignItems:'center',marginBottom:20}}>
        <Icon name="lock" size={22} />
        <TextInput placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} style={{flex:1,marginLeft:8,borderBottomWidth:1}} />
      </View>
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}
