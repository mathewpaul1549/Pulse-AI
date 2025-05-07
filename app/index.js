import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { user } = useAuth();
  return user ? <Redirect href="/(tabs)/home" /> : <Redirect href="/(auth)/login" />;
}
