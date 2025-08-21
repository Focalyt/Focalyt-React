import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HomeScreenProps {
  onNavigateToLocation: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToLocation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FocalytPortal</Text>
        <Text style={styles.subtitle}>Location Tracking App</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={onNavigateToLocation}>
          <Text style={styles.buttonText}>Start Location Tracking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 