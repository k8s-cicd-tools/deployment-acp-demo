
import * as k8s from "@pulumi/kubernetes";
import * as fs from "fs";


export class Grafana {
    name: string;
    version: string;
    namespace: string = "";
    servicePort: number = 32000;
    dependsOn: any[] = [];

    constructor(name: string, version: string, servicePort: number, dependsOn: any[]) {
        this.name = name;
        this.version = version;
        this.servicePort = servicePort;
        this.dependsOn = dependsOn;
    }

    public create(namespace: string, dependsOn: any[]) {
        this.namespace = namespace;
        // add dependsOn
        this.dependsOn = this.dependsOn.concat(dependsOn);

        const configMap = new k8s.core.v1.ConfigMap(`${this.name} configmap`, {
            metadata: {
                namespace: this.namespace,
                name: "grafana-datasources"
            },
            data: {
                "prometheus.yaml": fs.readFileSync('./configs/grafana/prometheus.yaml').toString(),
            },
        }, { dependsOn: this.dependsOn });


        const appLabels = { app: this.name };
        const grafana = new k8s.apps.v1.Deployment(`${this.name} deployment`, {
            metadata: {
                name: this.name,
                namespace: this.namespace,
                labels: appLabels,
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: appLabels,
                },
                template: {
                    metadata: {
                        labels: appLabels,
                    },
                    spec: {
                        containers: [
                            {
                                name: this.name,
                                image: "grafana/grafana:latest",
                                ports: [
                                    {
                                        name: this.name,
                                        containerPort: 3000,
                                    },
                                ],
                                resources: {
                                    limits: {
                                        memory: "2Gi",
                                        cpu: "1000m",
                                    },
                                    requests: {
                                        memory: "1Gi",
                                        cpu: "500m",
                                    },
                                },
                                volumeMounts: [
                                    {
                                        mountPath: "/var/lib/grafana",
                                        name: "grafana-storage",
                                    },
                                    {
                                        mountPath: "/etc/grafana/provisioning/datasources",
                                        name: "grafana-datasources",
                                        readOnly: false,
                                    },
                                ],
                            },
                        ],
                        volumes: [
                            {
                                name: "grafana-storage",
                                emptyDir: {},
                            },
                            {
                                name: "grafana-datasources",
                                configMap: {
                                    defaultMode: 420,
                                    name: "grafana-datasources",
                                },
                            },
                        ],
                    },
                },
            },
        }, { dependsOn: configMap });


        // Create a Service
        const grafanaService = new k8s.core.v1.Service(this.name, {
            metadata: {
                name: this.name,
                namespace: this.namespace,
                annotations: {
                    "prometheus.io/scrape": "true",
                    "prometheus.io/port": "3000",
                },
            },
            spec: {
                type: "NodePort",
                ports: [
                    {
                        port: 3000,
                        targetPort: 3000,
                        nodePort: this.servicePort,
                    },
                ],
                selector: appLabels,
            },
        //});
        }, { dependsOn: grafana });

    }

    // getDependsOn() {
    //
    // }

}