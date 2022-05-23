module.exports = {
    project: {
        ios: {},
        android: {}, // grouped into "project"
    },
    assets: ["./assets/fonts/karla"], // stays the same
    dependencies: {
        'react-native-threads': {
        platforms: {android: null},
        },
    },
};