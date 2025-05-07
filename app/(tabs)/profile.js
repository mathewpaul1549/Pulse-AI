import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Button, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

export default function ProfileScreen() {
  const { user, logout, updateUserData } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const uploadImageToStorage = async (uri, retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
      
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        photoURL: downloadURL
      });
      
      updateUserData({
        ...user,
        photoURL: downloadURL
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      
      if (retryCount < MAX_RETRIES && 
          (error.message?.includes('network') || 
           error.code === 'storage/canceled' || 
           error.code === 'storage/retry-limit-exceeded')) {
        console.log(`Retrying upload (${retryCount + 1}/${MAX_RETRIES})...`);
        
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        
        return uploadImageToStorage(uri, retryCount + 1);
      }
      
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUploadImage = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        Alert.alert(
          'No Connection',
          'You appear to be offline. Please check your connection and try again.'
        );
        return;
      }
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photo library.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileExtension = asset.uri.split('.').pop()?.toLowerCase();
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        
        if (!validExtensions.includes(fileExtension)) {
          Alert.alert(
            'Invalid File Type', 
            'Please select a valid image file (JPG, PNG, or GIF).'
          );
          return;
        }
        
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const fileSize = fileInfo.size / (1024 * 1024); // Size in MB
        
        if (fileSize > 5) {
          Alert.alert(
            'File Too Large', 
            'The selected image is too large. Please select an image smaller than 5MB.'
          );
          return;
        }
        
        setUploading(true);
        
        try {
          const manipResult = await ImagePicker.manipulateAsync(
            asset.uri,
            [{ resize: { width: 500, height: 500 } }],
            { compress: 0.7, format: 'jpeg' }
          );
          
          await uploadImageToStorage(manipResult.uri);
          
          Alert.alert('Success', 'Your profile picture has been updated!');
        } catch (error) {
          console.error('Error uploading image:', error);
          
          if (error.message?.includes('network')) {
            Alert.alert(
              'Network Error', 
              'There was a network problem uploading your profile picture. Please check your connection and try again.'
            );
          } else if (error.code === 'storage/unauthorized') {
            Alert.alert(
              'Permission Denied', 
              'You do not have permission to upload this image.'
            );
          } else if (error.code === 'storage/quota-exceeded') {
            Alert.alert(
              'Storage Limit Reached', 
              'Your storage quota has been exceeded. Please delete some files and try again.'
            );
          } else if (error.code === 'storage/invalid-format') {
            Alert.alert(
              'Invalid Format', 
              'The image format is not supported. Please try a different image.'
            );
          } else {
            Alert.alert(
              'Upload Failed',
              'There was a problem uploading your profile picture. Please try again.'
            );
          }
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'There was a problem selecting your image.');
      setUploading(false);
    }
  };
  
  const handleRemoveProfilePicture = async () => {
    if (!isConnected) {
      Alert.alert(
        'No Connection',
        'You appear to be offline. Please check your connection and try again.'
      );
      return;
    }
    
    try {
      setUploading(true);
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        photoURL: null
      });
      
      updateUserData({
        ...user,
        photoURL: null
      });
      
      Alert.alert('Success', 'Your profile picture has been removed.');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      Alert.alert(
        'Removal Failed',
        'There was a problem removing your profile picture. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'There was a problem signing out.');
    }
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Profile' }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleUploadImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="large" color="white" />
            ) : user?.photoURL ? (
              <Image 
                source={{ uri: user.photoURL }} 
                style={styles.avatarImage} 
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.username}>{user?.username || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'Anonymous User'}</Text>
          
          {user?.photoURL && (
            <TouchableOpacity onPress={handleRemoveProfilePicture} disabled={uploading}>
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {user?.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {user?.socialLinks && Object.values(user.socialLinks).some(link => link) && (
          <View style={styles.socialLinksContainer}>
            <Text style={styles.sectionTitle}>Connect With Me</Text>
            <View style={styles.socialLinksGrid}>
              {user.socialLinks.twitter && (
                <TouchableOpacity style={styles.socialItem}>
                  <Text style={styles.socialIcon}>🐦</Text>
                  <Text style={styles.socialText}>@{user.socialLinks.twitter}</Text>
                </TouchableOpacity>
              )}
              {user.socialLinks.instagram && (
                <TouchableOpacity style={styles.socialItem}>
                  <Text style={styles.socialIcon}>📸</Text>
                  <Text style={styles.socialText}>{user.socialLinks.instagram}</Text>
                </TouchableOpacity>
              )}
              {user.socialLinks.facebook && (
                <TouchableOpacity style={styles.socialItem}>
                  <Text style={styles.socialIcon}>👤</Text>
                  <Text style={styles.socialText}>{user.socialLinks.facebook}</Text>
                </TouchableOpacity>
              )}
              {user.socialLinks.linkedin && (
                <TouchableOpacity style={styles.socialItem}>
                  <Text style={styles.socialIcon}>💼</Text>
                  <Text style={styles.socialText}>{user.socialLinks.linkedin}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.hintsReceived || 0}</Text>
            <Text style={styles.statLabel}>Hints Received</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.hintsSent || 0}</Text>
            <Text style={styles.statLabel}>Hints Sent</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => router.push('/(tabs)/profile/edit')}
        >
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarText: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editIcon: {
    fontSize: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  removePhotoText: {
    color: '#e91e63',
    fontSize: 14,
    marginTop: 5,
  },
  bioContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    margin: 15,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  socialLinksContainer: {
    padding: 15,
    margin: 15,
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  socialLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  socialText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  editProfileButton: {
    backgroundColor: '#e91e63',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  editProfileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  signOutButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
