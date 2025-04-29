import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, isDev } from '../../../firebase';
import NetInfo from '@react-native-community/netinfo';

const MAX_BIO_LENGTH = 300;
const SOCIAL_MEDIA_REGEX = {
  twitter: /^@?[\w]{1,15}$/,
  instagram: /^[\w\.]{1,30}$/,
  facebook: /^[\w\.]{1,50}$/,
  linkedin: /^[\w\-]{1,100}$/
};

export default function EditProfileScreen() {
  const { user, updateUserData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    socialLinks: {
      twitter: user?.socialLinks?.twitter || '',
      instagram: user?.socialLinks?.instagram || '',
      facebook: user?.socialLinks?.facebook || '',
      linkedin: user?.socialLinks?.linkedin || ''
    }
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (formData.bio.length > MAX_BIO_LENGTH) {
      newErrors.bio = `Bio cannot exceed ${MAX_BIO_LENGTH} characters`;
    }
    
    Object.entries(SOCIAL_MEDIA_REGEX).forEach(([platform, regex]) => {
      const value = formData.socialLinks[platform];
      if (value && !regex.test(value)) {
        newErrors[platform] = `Invalid ${platform} username`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      Alert.alert(
        'No Connection',
        'You appear to be offline. Please check your connection and try again.'
      );
      return;
    }
    
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      const updatedData = {
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        socialLinks: formData.socialLinks
      };
      
      if (isDev) {
        console.log('Development mode: Skipping Firestore update');
      } else {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, updatedData);
      }
      
      updateUserData({
        ...user,
        ...updatedData
      });
      
      Alert.alert('Success', 'Your profile has been updated successfully.');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Update Failed',
        'There was a problem updating your profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      
      {!isConnected && (
        <View style={styles.offlineWarning}>
          <Text style={styles.offlineText}>
            You are currently offline. Changes won't be saved until you reconnect.
          </Text>
        </View>
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[styles.input, errors.username ? styles.inputError : null]}
            value={formData.username}
            onChangeText={(value) => handleChange('username', value)}
            placeholder="Your username"
          />
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.textArea, errors.bio ? styles.inputError : null]}
            value={formData.bio}
            onChangeText={(value) => handleChange('bio', value)}
            placeholder="Write something about yourself"
            multiline
            numberOfLines={5}
            maxLength={MAX_BIO_LENGTH + 1}
          />
          <Text style={styles.characterCount}>
            {formData.bio.length}/{MAX_BIO_LENGTH}
          </Text>
          {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
        </View>
        
        <Text style={styles.sectionTitle}>Social Media Links</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Twitter</Text>
          <TextInput
            style={[styles.input, errors.twitter ? styles.inputError : null]}
            value={formData.socialLinks.twitter}
            onChangeText={(value) => handleChange('socialLinks.twitter', value)}
            placeholder="@username"
          />
          {errors.twitter && <Text style={styles.errorText}>{errors.twitter}</Text>}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={[styles.input, errors.instagram ? styles.inputError : null]}
            value={formData.socialLinks.instagram}
            onChangeText={(value) => handleChange('socialLinks.instagram', value)}
            placeholder="username"
          />
          {errors.instagram && <Text style={styles.errorText}>{errors.instagram}</Text>}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Facebook</Text>
          <TextInput
            style={[styles.input, errors.facebook ? styles.inputError : null]}
            value={formData.socialLinks.facebook}
            onChangeText={(value) => handleChange('socialLinks.facebook', value)}
            placeholder="username"
          />
          {errors.facebook && <Text style={styles.errorText}>{errors.facebook}</Text>}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>LinkedIn</Text>
          <TextInput
            style={[styles.input, errors.linkedin ? styles.inputError : null]}
            value={formData.socialLinks.linkedin}
            onChangeText={(value) => handleChange('socialLinks.linkedin', value)}
            placeholder="username"
          />
          {errors.linkedin && <Text style={styles.errorText}>{errors.linkedin}</Text>}
        </View>
        
        <TouchableOpacity
          style={[styles.saveButton, loading ? styles.saveButtonDisabled : null]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  offlineWarning: {
    backgroundColor: '#ffebee',
    padding: 10,
    alignItems: 'center',
  },
  offlineText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#e91e63',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
