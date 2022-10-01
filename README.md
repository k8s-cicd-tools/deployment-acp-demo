## Deployment - ACP Demo  

This project is an example of how to deploy a group of applications with ACP (Access Control & Permissions) in Kubernetes.
For more information on ACP, visit [ACP](https://github.com/k8s-cicd-tools/app-acp).

When deploying this project, the following tasks are performed:
- Creates a Kops user in aws.
- Creates a bucket in aws to store the Kops state.
- Creates a Kubernetes cluster in aws.
- Creates a namespace called `test`.
- Creates a pulumi user in aws to query in s3.
- Creates a bucket in aws to store the state of pulumi.
- Uploads the ACP rule configurations to the same pulumi bucket.
- Creates a cronjob that runs every 2 minutes and that executes the ACP script to apply the configured permissions and run the applications.
- In each execution, it uploads the ACP rule configurations to the pulumi bucket, which allows the rules to be modified and the changes to be applied in the Kubernetes cluster.

The Acp cronjob runs in the `test` namespace and has the following tasks:
- Download the ACP rules from the pulumi bucket.
- Depending on the configurations of the rules, it creates mysql services, restores the databases and applies the configured permissions.
- It also configures the database connections and runs the applications required in the ACP rules.
- If the ACP rules are modified, the cronjob downloads and applies the changes.
- If an ACP rule is deleted, the cronjob deletes the mysql services, databases and configured permissions.
- If an application is deleted from an ACP rule, the cronjob deletes the configured permissions for that application.
- If a database is deleted from an ACP rule, the cronjob deletes the configured permissions for that database.
- Any change in the ACP rules is applied in the ACP cronjob.


![Demo](./img/demo.png "Demo.").


### How to get started

1. Configure your aws environment variables.
2. Clone this repository.
3. Run `$ npm install`.
4. Configure a pulumi stack.
5. Configure the cluster features and other details in the `index.ts` file.
6. Configure the ACP rules in the ./configs/acp/rules/*.json file, or leave the example rules.
7. Run `$ pulumi up`. and wait for the Kubernetes cluster to deploy.
8. Using the example rules, the applications mysql, demo1 and demo2 will be deployed.
9. To see the deployed applications, run `$ kubectl get all -n test`.
```
pod/demo1-b5c4fcb56-pc9sx      1/1     Running     0          46s
pod/demo2-646c6447b4-2xqd4     1/1     Running     0          45s
pod/server1-7b75cdf868-6htc4   1/1     Running     0          62s
```
10. Review the demo1 logs to see that it connects to the database.
``` 
--------30 - demo1 - table1 - database_a--------
SELECT OK
INSERT OK
UPDATE OK
DELETE OK
```
11. Review the demo2 logs to see that it connects to the database.
```
--------37 - demo2 - table2 - database_a--------
SELECT OK
INSERT OK
```
12. Edit the ./configs/acp/rules/UserRules.json file and remove the UPDATE rule from table 1 for application demo1.
```
{
    "namespace": "test",
    "appName": "demo1",
    "databaseName": "database_a",
    "tables": [
      {
        "name": "table1",
        "actions": [
          "SELECT",
          "INSERT",
          "DELETE"
        ]
      },
      {
        "name": "table2",
        "actions": [
          "SELECT"
        ]
      }
    ]
  },
```
13. Run `$ pulumi up` and wait for the changes to apply.
14. Review the demo1 logs to see that it no longer has permission to update table 1.
```
--------184 - demo1 - table1 - database_a--------
SELECT OK
INSERT OK
UPDATE ERROR
DELETE OK
```
15. Edit the ./configs/acp/rules/mysqlServers.json file and remove the server, it should be an empty list.
```
[]
```
16. Run `$ pulumi up` and wait for the changes to apply.
17. Review that all mysql services and applications have been deleted by running `$ kubectl get all -n test`.
```
NAME                     READY   STATUS      RESTARTS   AGE
pod/acp-27743026-ff8l8   0/1     Completed   0          5m29s
pod/acp-27743028-95pss   0/1     Completed   0          3m29s
pod/acp-27743030-wd7v4   0/1     Completed   0          89s

NAME                SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob.batch/acp   */2 * * * *   False     0        90s             125m

NAME                     COMPLETIONS   DURATION   AGE
job.batch/acp-27743026   1/1           21s        5m30s
job.batch/acp-27743028   1/1           21s        3m30s
job.batch/acp-27743030   1/1           41s        90s
```
18. Only the ACP cronjobs remain, which run every 2 minutes to apply the ACP rules and run the applications.
19. To delete the Kubernetes cluster, run `$ pulumi destroy`.


### index.ts
```
const kubeConfigPath = "/home/desarrollo/.kube/config";
const awsRegion = "us-east-1";
const awsRegionZone = "us-east-1a";
const developerUser = "dev1";
const namespace = "test";
const clusterName = "myfirstcluster.k8s.local";
const masterSize = "t3.medium";
const masterCount = 1;
const nodeSize = "t3.medium";
const nodeCount = 2;
const kubernetesVersion = "v1.21.1";

//create the namespace
const namespaceTest = new NameSpace(namespace, {app: "test"}, []);

//create the mysql app
const acp = new Acp(namespaceTest.name, developerUser, awsRegion, kubeConfigPath);

//add the app to the namespace
namespaceTest.addApplication(acp);

//create the cluster
const cluster = new Cluster(
    clusterName,
    masterSize,
    masterCount,
    awsRegion,
    awsRegionZone,
    kubernetesVersion,
    nodeSize,
    nodeCount
);

//add the namespace to the cluster
cluster.addNamespace(namespaceTest);

//Open ports for the cluster
//const openPort80 = new OpenPort("ingress", 80, "tcp", ["0.0.0.0/0"]);
//const openPort443 = new OpenPort("ingress", 443, "tcp", ["0.0.0.0/0"]);
//cluster.addNodeOpenPorts([openPort80, openPort443]);

const kops = new Kops(
    "TestKops",
    awsRegion,
    [cluster]
);

```

### Screenshots
![Create](./img/create.png "Create.").




