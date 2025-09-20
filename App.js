// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Suas telas
import AttendanceScreen from './src/screens/AttendanceScreen.js';
import ChildrenListScreen from './src/screens/ChildrenListScreen.js';
import LoginScreen from './src/screens/LoginScreen.js';
import MapScreen from './src/screens/MapScreen.js';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: true, // mostra cabeçalho em todas as telas
          headerStyle: { backgroundColor: '#1976d2' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
        <Stack.Screen name="ChildrenList" component={ChildrenListScreen} options={{ title: 'Crianças' }} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Atendimento' }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Mapa de Atendimentos' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
