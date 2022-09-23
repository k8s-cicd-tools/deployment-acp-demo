import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

export class Mysql {
    name: string;
    version: string;
    rootPassword: string;
    namespace: string = "";
    dependsOn: any[] = [];
    port: number = 3306;
    storage: string = "2Gi";
    mysqlService: any;
    mysqlDeployment: any;
    mysqlPersistentVolume: any;
    mysqlPersistentVolumeClaim: any;

    constructor(name: string, version: string, rootPassword: string, port: number, storage: string, dependsOn: any[]) {
        this.name = name;
        this.version = version;
        this.rootPassword = rootPassword;
        this.port = port;
        this.storage = storage;
        this.dependsOn = dependsOn;
    }

    create(namespace: string, dependsOn: any[]) {
        this.namespace = namespace;
        // add dependsOn
        this.dependsOn = this.dependsOn.concat(dependsOn);

        //Create Service
        /*
        this.mysqlService = new kubernetes.core.v1.Service(`${this.name} service`, {
            apiVersion: "v1",
            kind: "Service",
            metadata: {
                name: this.name,
                namespace: this.namespace
            },
            spec: {
                ports: [
                    {
                        port: this.port
                    },
                ],
                selector: {
                    app: this.name
                },
                clusterIP: "None"
            }
        //});
        }, {dependsOn: this.dependsOn});
        */


        //Create Deployment
        this.mysqlDeployment = new kubernetes.apps.v1.Deployment(`${this.name} deployment`, {
            metadata: {
                name: this.name,
                namespace: this.namespace
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: {
                        app: this.name
                    },
                },
                strategy: {
                    type: "Recreate"
                },
                template: {
                    metadata: {
                        labels: {
                            app: this.name
                        },
                    },
                    spec: {
                        containers: [
                            {
                                image: "mysql:" + this.version,
                                name: this.name,
                                env: [
                                    {
                                        name: "MYSQL_ROOT_PASSWORD",
                                        value: this.rootPassword
                                    },
                                ],
                                ports: [
                                    {
                                        containerPort: this.port,
                                        name: this.name
                                    },
                                ],
                                volumeMounts: [
                                    {
                                        name: this.name + "-persistent-storage",
                                        mountPath: "/var/lib/mysql"
                                    },
                                ],
                            },
                        ],
                        volumes: [
                            {
                                name: this.name + "-persistent-storage",
                                persistentVolumeClaim: {
                                    claimName: this.name + "-pv-claim"
                                },
                            },
                        ],
                    },
                },
            },
        }, {dependsOn: this.dependsOn});

        //Create Persistent Volume
        this.mysqlPersistentVolume = new kubernetes.core.v1.PersistentVolume(this.name + " pv", {
            metadata: {
                name: this.name + "-pv",
                labels: {
                    type: "local"
                },
            },
            spec: {
                storageClassName: "manual",
                capacity: {
                    storage: this.storage
                },
                accessModes: ["ReadWriteOnce"],
                hostPath: {
                    path: "/mnt/data"
                },
            },
        }, {dependsOn: this.mysqlDeployment});

        //Create Persistent Volume Claim
        this.mysqlPersistentVolumeClaim = new kubernetes.core.v1.PersistentVolumeClaim(this.name + " pv-claim", {
            metadata: {
                name: this.name + "-pv-claim",
                namespace: this.namespace
            },
            spec: {
                storageClassName: "manual",
                accessModes: ["ReadWriteOnce"],
                resources: {
                    requests: {
                        storage: this.storage
                    },
                },
            },
        }, {dependsOn: this.mysqlPersistentVolume});
    }

    getDependsOn() {
        return this.mysqlPersistentVolume;
    }



}