import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    PanResponder,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTAINER_HEIGHT = SCREEN_HEIGHT * 0.55;
const MIN_CROP_SIZE = 30;
const HANDLE_SIZE = 30;

const ImageCropper = ({ imageUri, imageWidth, imageHeight, onCropComplete, onCancel }) => {
    const [cropping, setCropping] = useState(false);
    const [containerLayout, setContainerLayout] = useState(null);

    // Calculer les dimensions de l'image affichée
    const layout = useMemo(() => {
        const imageAspect = imageWidth / imageHeight;
        const containerAspect = SCREEN_WIDTH / CONTAINER_HEIGHT;

        let dw, dh, ox, oy;
        if (imageAspect > containerAspect) {
            dw = SCREEN_WIDTH - 40;
            dh = dw / imageAspect;
            ox = 20;
            oy = (CONTAINER_HEIGHT - dh) / 2;
        } else {
            dh = CONTAINER_HEIGHT;
            dw = dh * imageAspect;
            ox = (SCREEN_WIDTH - dw) / 2;
            oy = 0;
        }
        return { displayWidth: dw, displayHeight: dh, offsetX: ox, offsetY: oy };
    }, [imageWidth, imageHeight]);

    const { displayWidth, displayHeight, offsetX, offsetY } = layout;

    // Initialiser cropBox avec toute l'image par défaut
    const [cropBox, setCropBox] = useState(null);

    // Initialiser cropBox avec les dimensions de l'image au montage
    useEffect(() => {
        if (displayWidth > 0 && displayHeight > 0 && cropBox === null) {
            setCropBox({ x: 0, y: 0, width: displayWidth, height: displayHeight });
        }
    }, [displayWidth, displayHeight]);

    // Ref pour suivre l'état du geste
    const gestureData = useRef({
        mode: null, // 'move', 'resize'
        handle: null,
        startX: 0,
        startY: 0,
        startBox: null,
    });

    // Convertir coordonnées page vers coordonnées image
    const pageToImage = useCallback((pageX, pageY) => {
        if (!containerLayout) return { x: 0, y: 0 };

        const relX = pageX - containerLayout.x - offsetX;
        const relY = pageY - containerLayout.y - offsetY;

        return {
            x: Math.max(0, Math.min(relX, displayWidth)),
            y: Math.max(0, Math.min(relY, displayHeight)),
        };
    }, [containerLayout, offsetX, offsetY, displayWidth, displayHeight]);

    // Vérifier quelle poignée est touchée
    const getHandle = useCallback((x, y, box) => {
        if (!box) return null;

        const corners = {
            tl: { x: box.x, y: box.y },
            tr: { x: box.x + box.width, y: box.y },
            bl: { x: box.x, y: box.y + box.height },
            br: { x: box.x + box.width, y: box.y + box.height },
        };

        for (const [key, corner] of Object.entries(corners)) {
            if (Math.abs(x - corner.x) < HANDLE_SIZE && Math.abs(y - corner.y) < HANDLE_SIZE) {
                return key;
            }
        }
        return null;
    }, []);

    // Vérifier si dans la zone de crop
    const isInsideBox = useCallback((x, y, box) => {
        if (!box) return false;
        const margin = HANDLE_SIZE / 2;
        return x >= box.x + margin && x <= box.x + box.width - margin &&
               y >= box.y + margin && y <= box.y + box.height - margin;
    }, []);

    // PanResponder pour gérer les gestes
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
            const { pageX, pageY } = evt.nativeEvent;
            const imgCoords = pageToImage(pageX, pageY);

            const gd = gestureData.current;
            gd.startX = imgCoords.x;
            gd.startY = imgCoords.y;

            // Vérifier si on touche une poignée (resize)
            const handle = getHandle(imgCoords.x, imgCoords.y, cropBox);
            if (handle) {
                gd.mode = 'resize';
                gd.handle = handle;
                gd.startBox = cropBox ? { ...cropBox } : null;
                return;
            }

            // Vérifier si on est dans la zone (move)
            if (isInsideBox(imgCoords.x, imgCoords.y, cropBox)) {
                gd.mode = 'move';
                gd.startBox = cropBox ? { ...cropBox } : null;
                return;
            }

            // Si on touche en dehors des poignées et du centre, ne rien faire
            gd.mode = null;
        },
        onPanResponderMove: (evt) => {
            const { pageX, pageY } = evt.nativeEvent;
            const imgCoords = pageToImage(pageX, pageY);
            const gd = gestureData.current;

            if (gd.mode === 'move' && gd.startBox) {
                // Déplacer la zone
                const dx = imgCoords.x - gd.startX;
                const dy = imgCoords.y - gd.startY;

                let newX = gd.startBox.x + dx;
                let newY = gd.startBox.y + dy;

                newX = Math.max(0, Math.min(newX, displayWidth - gd.startBox.width));
                newY = Math.max(0, Math.min(newY, displayHeight - gd.startBox.height));

                setCropBox({
                    ...gd.startBox,
                    x: newX,
                    y: newY,
                });
            } else if (gd.mode === 'resize' && gd.startBox && gd.handle) {
                // Redimensionner
                const box = gd.startBox;
                let newBox = { ...box };

                switch (gd.handle) {
                    case 'tl':
                        newBox.width = box.x + box.width - imgCoords.x;
                        newBox.height = box.y + box.height - imgCoords.y;
                        newBox.x = imgCoords.x;
                        newBox.y = imgCoords.y;
                        break;
                    case 'tr':
                        newBox.width = imgCoords.x - box.x;
                        newBox.height = box.y + box.height - imgCoords.y;
                        newBox.y = imgCoords.y;
                        break;
                    case 'bl':
                        newBox.width = box.x + box.width - imgCoords.x;
                        newBox.height = imgCoords.y - box.y;
                        newBox.x = imgCoords.x;
                        break;
                    case 'br':
                        newBox.width = imgCoords.x - box.x;
                        newBox.height = imgCoords.y - box.y;
                        break;
                }

                // Appliquer les contraintes
                if (newBox.width < MIN_CROP_SIZE) {
                    if (gd.handle === 'tl' || gd.handle === 'bl') {
                        newBox.x = box.x + box.width - MIN_CROP_SIZE;
                    }
                    newBox.width = MIN_CROP_SIZE;
                }
                if (newBox.height < MIN_CROP_SIZE) {
                    if (gd.handle === 'tl' || gd.handle === 'tr') {
                        newBox.y = box.y + box.height - MIN_CROP_SIZE;
                    }
                    newBox.height = MIN_CROP_SIZE;
                }

                newBox.x = Math.max(0, Math.min(newBox.x, displayWidth - MIN_CROP_SIZE));
                newBox.y = Math.max(0, Math.min(newBox.y, displayHeight - MIN_CROP_SIZE));
                newBox.width = Math.min(newBox.width, displayWidth - newBox.x);
                newBox.height = Math.min(newBox.height, displayHeight - newBox.y);

                setCropBox(newBox);
            }
        },
        onPanResponderRelease: () => {
            const gd = gestureData.current;
            gd.mode = null;
            gd.handle = null;
            gd.startBox = null;
        },
    }), [containerLayout, pageToImage, getHandle, isInsideBox, cropBox, displayWidth, displayHeight]);

    const handleContainerLayout = useCallback((event) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        // Mesurer la position absolue du container sur l'écran
        event.target.measure((fx, fy, fWidth, fHeight, px, py) => {
            setContainerLayout({ x: px, y: py, width: fWidth, height: fHeight });
        });
    }, []);

    const handleCrop = async () => {
        if (!cropBox) {
            onCropComplete({ uri: imageUri, width: imageWidth, height: imageHeight });
            return;
        }

        setCropping(true);
        try {
            const scaleX = imageWidth / displayWidth;
            const scaleY = imageHeight / displayHeight;

            const cropData = {
                originX: Math.max(0, Math.round(cropBox.x * scaleX)),
                originY: Math.max(0, Math.round(cropBox.y * scaleY)),
                width: Math.round(cropBox.width * scaleX),
                height: Math.round(cropBox.height * scaleY),
            };

            const result = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ crop: cropData }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            onCropComplete(result);
        } catch (error) {
            console.error('Erreur de recadrage:', error);
            onCropComplete({ uri: imageUri, width: imageWidth, height: imageHeight });
        } finally {
            setCropping(false);
        }
    };

    const resetSelection = () => {
        setCropBox({ x: 0, y: 0, width: displayWidth, height: displayHeight });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Recadrer l'image</Text>
            <Text style={styles.subtitle}>
                Ajustez la zone de selection avec les coins
            </Text>

            <View
                style={[styles.imageContainer, { height: CONTAINER_HEIGHT }]}
                onLayout={handleContainerLayout}
                {...panResponder.panHandlers}
            >
                <Image
                    source={{ uri: imageUri }}
                    style={[styles.image, {
                        width: displayWidth,
                        height: displayHeight,
                        left: offsetX,
                        top: offsetY
                    }]}
                    resizeMode="contain"
                />

                {/* Overlay sombre */}
                {cropBox && (
                    <>
                        <View style={[styles.overlay, {
                            left: offsetX, top: offsetY,
                            width: displayWidth, height: cropBox.y
                        }]} />
                        <View style={[styles.overlay, {
                            left: offsetX,
                            top: offsetY + cropBox.y + cropBox.height,
                            width: displayWidth,
                            height: displayHeight - cropBox.y - cropBox.height
                        }]} />
                        <View style={[styles.overlay, {
                            left: offsetX,
                            top: offsetY + cropBox.y,
                            width: cropBox.x,
                            height: cropBox.height
                        }]} />
                        <View style={[styles.overlay, {
                            left: offsetX + cropBox.x + cropBox.width,
                            top: offsetY + cropBox.y,
                            width: displayWidth - cropBox.x - cropBox.width,
                            height: cropBox.height
                        }]} />
                    </>
                )}

                {/* Zone de crop */}
                {cropBox && (
                    <View
                        style={[
                            styles.cropBox,
                            {
                                left: offsetX + cropBox.x,
                                top: offsetY + cropBox.y,
                                width: cropBox.width,
                                height: cropBox.height,
                            },
                        ]}
                        pointerEvents="none"
                    >
                        {/* Grille */}
                        <View style={styles.gridContainer}>
                            <View style={styles.gridLineH} />
                            <View style={[styles.gridLineH, { top: '66.66%' }]} />
                            <View style={styles.gridLineV} />
                            <View style={[styles.gridLineV, { left: '66.66%' }]} />
                        </View>

                        {/* Coins */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                    </View>
                )}

            </View>

            <View style={styles.hint}>
                <Text style={styles.hintText}>
                    Tirez les coins pour ajuster la zone
                </Text>
            </View>

            <View style={styles.buttons}>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.resetButton} onPress={resetSelection}>
                    <Text style={styles.buttonText}>Reinitialiser</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cropButton}
                    onPress={handleCrop}
                    disabled={cropping}
                >
                    {cropping ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>Valider</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginTop: 50,
    },
    subtitle: {
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        backgroundColor: '#000',
    },
    image: {
        position: 'absolute',
    },
    overlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    cropBox: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#fff',
    },
    gridContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridLineH: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '33.33%',
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    gridLineV: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '33.33%',
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#fff',
    },
    cornerTL: {
        top: -2,
        left: -2,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    cornerTR: {
        top: -2,
        right: -2,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    cornerBL: {
        bottom: -2,
        left: -2,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    cornerBR: {
        bottom: -2,
        right: -2,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    hint: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    hintText: {
        color: '#888',
        fontSize: 14,
    },
    buttons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#333',
        alignItems: 'center',
    },
    resetButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#555',
        alignItems: 'center',
    },
    cropButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#27ae60',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ImageCropper;
