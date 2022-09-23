#!/bin/bash

export CLUSTER_NAME=myfirstcluster.k8s.local
export AWS_REGION=us-east-1
export PROTOCOL=tcp
export PORT=22
export CIDR=0.0.0.0/0

GroupId=$(aws ec2 describe-security-groups --region ${AWS_REGION} --query 'SecurityGroups[?GroupName==`nodes.${CLUSTER_NAME}`].{ID:GroupId}' --output text)
echo "GroupId: $GroupId"
#aws ec2 authorize-security-group-ingress --group-id "$GroupId" --protocol "${PROTOCOL}" --port "${PORT}" --cidr "${CIDR}"




