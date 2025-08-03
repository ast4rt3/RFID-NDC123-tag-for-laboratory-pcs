import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export default function NfcScanScreen() {
  const [scanning, setScanning] = useState(false);
  const [tagData, setTagData] = useState<string | null>(null);

  const scanNfcTag = async () => {
    try {
      await NfcManager.start();
      setScanning(true);
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      if (tag) {
        setTagData(JSON.stringify(tag, null, 2));
        Alert.alert('Tag scanned!', JSON.stringify(tag));
      } else {
        setTagData(null);
        Alert.alert('No tag detected', 'Please try again.');
      }
    } catch (e) {
      let errorMsg = 'Unknown error';
      if (e instanceof Error) errorMsg = e.message;
      else if (typeof e === 'string') errorMsg = e;
      Alert.alert('Error', errorMsg);
    } finally {
      setScanning(false);
      NfcManager.cancelTechnologyRequest();
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>NFC/RFID Tag Scanner</Text>
      <Button title={scanning ? "Hold tag near phone..." : "Scan NFC Tag"} onPress={scanNfcTag} disabled={scanning} />
      {tagData && (
        <View style={{ marginTop: 20 }}>
          <Text>Tag Data:</Text>
          <Text selectable style={{ fontFamily: 'monospace' }}>{tagData}</Text>
        </View>
      )}
    </View>
  );
}