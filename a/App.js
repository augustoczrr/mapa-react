import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Image,
    Alert,
} from "react-native";

import MapView, { Marker } from "react-native-maps";

import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

export default function App() {
    const [region, setRegion] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        initializeApp();
    }, []);

    async function initializeApp() {
        await loadLocation();
        await loadMarkers();
    }

    async function loadLocation() {
        try {
            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Permissão negada",
                    "É necessário permitir acesso à localização."
                );
                return;
            }

            const location =
                await Location.getCurrentPositionAsync({});

            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        } catch (error) {
            console.log(error);
        }
    }

    async function loadMarkers() {
        try {
            const snapshot = await getDocs(
                collection(db, "markers")
            );

            const list = [];

            snapshot.forEach((docItem) => {
                list.push({
                    id: docItem.id,
                    ...docItem.data(),
                });
            });

            setMarkers(list);
        } catch (error) {
            console.log(error);
            Alert.alert(
                "Erro",
                "Não foi possível carregar os markers."
            );
        }
    }

    async function uploadToCloudinary(uri) {
        const formData = new FormData();

        formData.append("file", {
            uri,
            type: "image/jpeg",
            name: "photo.jpg",
        });

        formData.append(
            "upload_preset",
            "fotos_app"
        );

        const response = await fetch(
            "https://api.cloudinary.com/v1_1/dfd2dsfon/image/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        const data = await response.json();

        console.log("Cloudinary:", data);

        if (!data.secure_url) {
            throw new Error(
                data.error?.message ||
                "Falha ao enviar imagem para o Cloudinary."
            );
        }

        return data.secure_url;
    }

    async function takePhoto() {
        try {
            const permission =
                await ImagePicker.requestCameraPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    "Permissão negada",
                    "É necessário permitir acesso à câmera."
                );
                return;
            }

            const result =
                await ImagePicker.launchCameraAsync({
                    mediaTypes:
                    ImagePicker.MediaTypeOptions.Images,
                    quality: 1,
                });

            if (result.canceled) return;

            const imageUri =
                result.assets[0].uri;

            const location =
                await Location.getCurrentPositionAsync({});

            const imageUrl =
                await uploadToCloudinary(imageUri);

            const markerData = {
                imageUrl,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            const docRef = await addDoc(
                collection(db, "markers"),
                markerData
            );

            setMarkers((prevMarkers) => [
                ...prevMarkers,
                {
                    id: docRef.id,
                    ...markerData,
                },
            ]);

            Alert.alert(
                "Sucesso",
                "Foto salva com sucesso."
            );
        } catch (error) {
            console.log(error);

            Alert.alert(
                "Erro",
                error.message || "Erro ao salvar foto."
            );
        }
    }

    function removeMarker(marker) {
        Alert.alert(
            "Excluir Marker",
            "Deseja realmente excluir este marker?",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(
                                doc(db, "markers", marker.id)
                            );

                            setMarkers((prevMarkers) =>
                                prevMarkers.filter(
                                    (item) => item.id !== marker.id
                                )
                            );

                            setSelectedImage(null);

                            Alert.alert(
                                "Sucesso",
                                "Marker removido."
                            );
                        } catch (error) {
                            console.log(error);

                            Alert.alert(
                                "Erro",
                                "Não foi possível excluir o marker."
                            );
                        }
                    },
                },
            ]
        );
    }

    if (!region) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Carregando mapa...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={region}
                showsUserLocation
            >
                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        coordinate={{
                            latitude: marker.latitude,
                            longitude: marker.longitude,
                        }}
                        onPress={() =>
                            setSelectedImage(marker.imageUrl)
                        }
                        onLongPress={() =>
                            removeMarker(marker)
                        }
                    />
                ))}
            </MapView>

            {selectedImage && (
                <View style={styles.previewContainer}>
                    <Image
                        source={{ uri: selectedImage }}
                        style={styles.previewImage}
                    />
                </View>
            )}

            <TouchableOpacity
                style={styles.button}
                onPress={takePhoto}
            >
                <Text style={styles.buttonText}>
                    Tirar Foto
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    map: {
        flex: 1,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    button: {
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        backgroundColor: "#2196F3",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 10,
    },

    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },

    previewContainer: {
        position: "absolute",

        top: 120,
        right: 20,

        width: 140,
        height: 180,

        backgroundColor: "#fff",
        borderRadius: 14,

        overflow: "hidden",

        elevation: 10,
    },

    previewImage: {
        width: "100%",
        height: "100%",
    },
});