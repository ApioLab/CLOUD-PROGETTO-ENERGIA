module.exports = {
    name: "Board",
    autoinstall: {
        default: false
    },
    database: {
        database: "apio",
        hostname: "127.0.0.1",
        port: "27017"
    },
    dependencies: {
        cloud: {
            boardSync: "1.0.0",
            dongle: "1.0.0",
            log: "1.0.0",
            notification: "1.0.0"
        },
        gateway: {
            autoInstall: "1.0.0",
            cloud: "1.0.0",
            dongle: "1.0.0",
            enocean: "1.0.0",
            githubUpdate: "1.0.0",
            log: "1.0.0",
            notification: "1.0.0",
            shutdown: "1.0.0",
            zwave: "1.0.0"
        }
    },
    http: {
        port: 8086
    },
    logging: {
        enabled: true,
        logfile: "./logs/log.json"
    },
    remote: {
        enabled: false,
        uri: "http://www.apio.cloud"
    },
    serial: {
        baudrate: 115200,
        dataRate: "3",
        enabled: true,
        firmwareVersion: "1",
        manufacturer: "Apio_Dongle",
        panId: "0x01",
        port: "/dev/ttyACM0",
        radioPower: "0"
    },
    type: "cloud"
};
