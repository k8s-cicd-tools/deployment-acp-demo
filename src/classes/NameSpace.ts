import * as k8s from "@pulumi/kubernetes";


export class NameSpace {
    name: string;
    labels: any;
    namespace: any;
    applications: any[] = [];
    dependsOn: any[] = [];

    constructor(name: string, labels: any, dependsOn: any[]) {
        this.name = name;
        this.labels = labels;
        this.dependsOn = dependsOn;
    }

    addApplication(application: any) {
        this.applications.push(application);
    }

    create(dependsOn: any[]) {
        // add dependsOn
        this.dependsOn = this.dependsOn.concat(dependsOn);

        this.namespace = new k8s.core.v1.Namespace(`${this.name} namespace`, {
            metadata: {
                name: this.name,
                labels: this.labels
            }
        }, {dependsOn: this.dependsOn});

        this.applications.forEach(application => {
            application.create(this.name, [this.namespace]);
        });
    }
}