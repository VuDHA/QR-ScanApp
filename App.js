import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  Linking,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import QRCode from "react-native-qrcode-svg";
import RNQRGenerator from "rn-qr-generator";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [text, setText] = useState("Not yet scanned");
  const [qrCodeData, setQrCodeData] = useState(""); // State for QR code data

  const askForCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const askForLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasPermission(status === "granted");
  };

  // const askForCameraAccess = async () => {
  //   const { status } = await Camera.requestCameraPermissionsAsync();
  //   setCameraPermission(status === "granted");
  // };

  // Request Camera and Library Permissions
  useEffect(() => {
    askForCameraPermission();
    askForLibraryPermission();
    // askForCameraAccess();
  }, []);

  // What happens when we scan the bar code
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setText(data);
    console.log("Type: " + type + "\nData: " + data);
    showConfirmationDialog(data);
  };

  // Show confirmation dialog before opening the scanned link
  const showConfirmationDialog = (url) => {
    Alert.alert(
      "Open Link",
      "Do you want to open the scanned link?",
      [
        {
          text: "Cancel",
          onPress: () => setScanned(false),
          style: "cancel",
        },
        {
          text: "Open",
          onPress: () => openLink(url),
        },
      ],
      { cancelable: false }
    );
  };

  // Open the scanned link
  const openLink = (url) => {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.log("Cannot open URL: " + url);
        }
      })
      .catch((error) => console.log(error));
  };

  const readQRFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    const str = result.assets[0].base64;
    RNQRGenerator.detect({
      base64: str,
    })
      .then((response) => {
        const { values } = response; // Array of detected QR code values. Empty if nothing found.
        console.log(values);
      })
      .catch((error) => console.log("Cannot detect QR code in image", error));
  };

  // Open the device's library to select an image for scanning
  const openLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === "granted") {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const { uri } = result.assets[0];
        console.log(uri);
        decodeQRCodeFromImage(uri);
      }
    } else {
      console.log("No access to media library");
    }
  };

  const captureImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === "granted") {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const imageAsset = await MediaLibrary.createAssetAsync(
          result.assets[0].uri
        );
        saveImage(imageAsset);
      }
    } else {
      console.log("No access to the camera");
    }
  };

  const saveImage = async (imageAsset) => {
    try {
      const album = await MediaLibrary.getAlbumAsync("MyAlbum");
      if (album === null) {
        await MediaLibrary.createAlbumAsync("MyAlbum", imageAsset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([imageAsset], album, false);
      }
      Alert.alert("Image saved successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Failed to save image.");
    }
  };

  // Handle the scanned image
  const decodeQRCodeFromImage = async (imageUri) => {
    try {
      const { status } =
        await RNImagePicker.requestMediaLibraryPermissionsAsync();

      const results = await BarCodeScanner.scanFromURLAsync(imageUri);
      console.log(results[0]); // many information
    } catch (error) {
      console.debug(error);
    }
  };

  const generateQRCode = (data) => {
    if (data.trim() === "") {
      return null; // Return null if no input text
    }
    return (
      <KeyboardAvoidingView style={styles.qrCodeContainer}>
        <QRCode value={data} size={200} />
      </KeyboardAvoidingView>
    );
  };

  // Check permissions and return the screens
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{ margin: 10 }}>No access to camera</Text>
        <Button
          title={"Allow Camera"}
          onPress={() => askForCameraPermission()}
        />
      </View>
    );
  }

  // Return the View
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.barcodebox}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={{ height: 400, width: 400 }}
          />
          {/* <Camera
            ref={(ref) => setCameraRef(ref)}
            style={styles.camera}
            type={Camera.Constants.Type.back}
            autoFocus={Camera.Constants.AutoFocus.on}
          /> */}
        </View>
        <Text style={styles.maintext}>{text}</Text>

        <View style={styles.qrCodeContainer}>
          {/* Generate a QR code with the desired data */}
          {generateQRCode(qrCodeData)}
        </View>

        <TextInput
          style={styles.textInput}
          onChangeText={setQrCodeData}
          value={qrCodeData}
          placeholder="Input text to create QR code"
        />

        <Button
          style={styles.but}
          title={"Open Library"}
          onPress={() => readQRFromGallery()}
        />

        <Button
          style={styles.but}
          title={"Capture Image"}
          onPress={() => captureImage()}
        />

        {scanned && (
          <Button
            title={"Scan Again"}
            onPress={() => setScanned(false)}
            color="tomato"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  maintext: {
    fontSize: 16,
    margin: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 10,
    overflow: "hidden",
    paddingTop: 30,
    paddingBottom: 30,
  },
  but: {
    height: 40,
    width: 200,
    marginBottom: 20,
    paddingHorizontal: 10,
    textAlign: "center",
    backgroundColor: "#f7f7f7",
  },
  camera: {
    flex: 1,
    width: 300,
  },
  barcodebox: {
    alignItems: "center",
    justifyContent: "center",
    height: "40%",
    width: "80%",
    overflow: "hidden",
    borderRadius: 30,
  },
  qrCodeContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  textInput: {
    height: 40,
    width: 300,
    marginBottom: 20,
    paddingHorizontal: 10,
    textAlign: "center",
    backgroundColor: "#f7f7f7",
  },
});
