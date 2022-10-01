import { Acp } from "./src/apps/Acp";
import { NameSpace } from "./src/classes/NameSpace";
import { Cluster } from "./src/classes/Cluster";
import { Kops } from "./src/classes/Kops";
import {OpenPort} from "./src/classes/OpenPort";


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

