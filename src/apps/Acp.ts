import * as k8s from "@pulumi/kubernetes";
import * as fs from "fs";
import {AwsPulumiUser} from "../classes/AwsPulumiUser";
import * as pulumi from "@pulumi/pulumi";
import {AwsS3} from "../classes/AwsS3";
const hasha = require('hasha');
import { local } from "@pulumi/command";
const { exec } = require('child_process');


export class Acp {
    name: string = "acp";
    namespace: string = "";
    dependsOn: any[] = [];
    acp_object: any = null;
    acpPersistentVolume: any = null;
    acpPersistentVolumeClaim: any = null;
    developerUser: string = "";
    awsDefaultRegion: any;
    pulumiBackendUrl: string = "";
    awsPulumiUser: any = null;
    pulumiBackend: any = null;
    kubeConfigPath: string = "";
    
    constructor(namespace: string, developerUser: string, awsDefaultRegion: string, kubeConfigPath: string) {
        this.namespace = namespace;
        this.developerUser = developerUser;
        this.awsDefaultRegion = awsDefaultRegion;
        this.kubeConfigPath = kubeConfigPath;
    }

    getPulumiPassphrase() {
        //concatenate all the strings
        let stringToHash = this.developerUser + this.awsDefaultRegion + this.namespace + this.name;
        //return the 31 character hash
        return hasha(stringToHash).substring(0, 31);
    }

    create(namespace: string, dependsOn: any[]) {
        // add dependsOn
        this.dependsOn = this.dependsOn.concat(dependsOn);
        this.namespace = namespace;
        this.awsPulumiUser = new AwsPulumiUser("pulumi-acp", this.dependsOn);
        this.pulumiBackend = new AwsS3(`pulumi-backend-${this.name.toLowerCase().replace(" ", "-")}-yt54fe2`, [this.awsPulumiUser.getDependsOn()]);
        this.pulumiBackendUrl = `s3://${this.pulumiBackend.bucketName}`;

        const uploadComand = `aws s3 cp ./configs/acp ${this.pulumiBackendUrl}/acp --recursive`;
        const uploadObject = new local.Command(`uploads rules`, {
            create: uploadComand,
        }, { dependsOn: this.pulumiBackend.getDependsOn() });

        exec(uploadComand, (err: any, stdout: any, stderr: any) => {
            console.log("uploading acp files to s3");
        });

        const configMap = new k8s.core.v1.ConfigMap("kube-config", {
            metadata: {
                name: "kube-config",
                namespace: this.namespace,
            },
            data: {
                "config": fs.readFileSync(this.kubeConfigPath).toString(),
            },
        }, { dependsOn: uploadObject });

        //Create Persistent Volume
        this.acpPersistentVolume = new k8s.core.v1.PersistentVolume(this.name + " pv", {
            metadata: {
                name: this.name + "-pv",
                labels: {
                    type: "local"
                },
            },
            spec: {
                storageClassName: "manual",
                capacity: {
                    storage: "100Mi"
                },
                accessModes: ["ReadWriteOnce"],
                hostPath: {
                    path: `/mnt/data/${this.name}`
                },
            },
        }, {dependsOn: configMap });

        //Create Persistent Volume Claim
        this.acpPersistentVolumeClaim = new k8s.core.v1.PersistentVolumeClaim(this.name + " pv-claim", {
            metadata: {
                name: this.name + "-pv-claim",
                namespace: this.namespace
            },
            spec: {
                storageClassName: "manual",
                accessModes: ["ReadWriteOnce"],
                resources: {
                    requests: {
                        storage: "100Mi"
                    },
                },
            },
        }, {dependsOn: this.acpPersistentVolume});


        //Create a cronjob to run the image "jhonwg/acp:1.8", every 5 minutes
        this.acp_object = new k8s.batch.v1.CronJob(`${this.name} cronjob`, {
            metadata: {
                name: this.name,
                namespace: this.namespace,
                labels: {
                    app: this.name
                },
            },
            spec: {
                schedule: "*/2 * * * *",
                jobTemplate: {
                    spec: {
                        template: {
                            metadata: {
                                labels: {
                                    app: this.name
                                },
                            },
                            spec: {
                                containers: [
                                    {
                                        name: this.name,
                                        image: "jhonwg/acp:1.8",
                                        env: [
                                            {
                                                name: "APP_NAME",
                                                value: this.name
                                            },
                                            {
                                                name: "PULUMI_BACKEND_URL",
                                                value: this.pulumiBackendUrl
                                            },
                                            {
                                                name: "PULUMI_CONFIG_PASSPHRASE",
                                                value: this.getPulumiPassphrase()
                                            },
                                            {
                                                name: "AWS_ACCESS_KEY_ID",
                                                value: pulumi.interpolate`${this.awsPulumiUser.accessKey.id}`
                                            },
                                            {
                                                name: "AWS_SECRET_ACCESS_KEY",
                                                value: pulumi.interpolate`${this.awsPulumiUser.accessKey.secret}`
                                            },
                                            {
                                                name: "AWS_DEFAULT_REGION",
                                                value: this.awsDefaultRegion
                                            },
                                            {
                                                name: "DEVELOPER_MYSQL_USER",
                                                value: this.developerUser
                                            },
                                            {
                                                name: "DEVELOPER_NAMESPACE",
                                                value: this.namespace
                                            },
                                        ],
                                        volumeMounts: [
                                            {
                                                name: "kube-config-volume",
                                                mountPath: "/home/pulumi/.kube",
                                            },
                                            {
                                                name: "acp-persistent-storage",
                                                mountPath: "/home/pulumi/data",
                                            }
                                        ],
                                    },
                                ],
                                volumes: [
                                    {
                                        name: "kube-config-volume",
                                        configMap: {
                                            name: "kube-config",
                                            items: [
                                                {
                                                    key: "config",
                                                    path: "config",
                                                },
                                            ],
                                        },
                                    },
                                    {
                                        name: "acp-persistent-storage",
                                        persistentVolumeClaim: {
                                            claimName: "acp-pv-claim",
                                        },
                                    },
                                ],
                                restartPolicy: "Never",
                                initContainers: [
                                    {
                                        name: `${this.name}-init`,
                                        image: "busybox:latest",
                                        command: ["sh", "-c", "chown -R 999:999 /home/pulumi/data"],
                                        resources: {
                                            limits: {
                                                cpu: "1",
                                                memory: "1Gi",
                                            },
                                        },
                                        volumeMounts: [
                                            {
                                                name: "acp-persistent-storage",
                                                mountPath: "/home/pulumi/data",
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        }, { dependsOn: this.acpPersistentVolumeClaim });
    }

    getDependsOn() {
        return this.acp_object;
    }

}