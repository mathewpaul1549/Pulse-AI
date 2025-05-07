import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          headerTitle: "Chats",
          headerBackTitle: "Back"
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{
          headerTitle: "",
          headerBackTitle: "Chats"
        }}
      />
    </Stack>
  );
}
