import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SensorListScreen from '../screens/SensorListScreen';
import SensorDetailsScreen from '../screens/SensorDetailsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Sensores"
          component={SensorListScreen}
          options={{ title: 'Monitoramento de Sensores' }}
        />
        <Stack.Screen
          name="Detalhes"
          component={SensorDetailsScreen}
          options={{ title: 'Detalhes do sensor' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}