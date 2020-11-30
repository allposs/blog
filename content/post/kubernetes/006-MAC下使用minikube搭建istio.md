---
title:          006-MAC下使用minikube搭建istio
date:           2020-11-13T11:02:32+08:00
draft:          true
tags:           [2020-11]
topics:         [mac,minikube,istio]
---
## 简介
 
&nbsp;&nbsp;&nbsp;&nbsp;
 
<!--more-->
## 环境
 
无
 
## 软件包
 
无
 
## 拓扑图
 
无
 
## 正文
---

### 1. 安装集群

    初始化集群  
    $ minikube start --network-plugin=cni --driver=virtualbox --cni=calico --cpus=4  --memory=8g --image-mirror-country cn --docker-env http_proxy=http://192.168.99.1:8000 --docker-env https_proxy=http://192.168.99.1:8000 --docker-env no_proxy=localhost,127.0.0.1,::1,192.168.99.0/24
    添加节点(如果需要)
    $ minikube  --cpus=4  --memory=8192mb  --image-mirror-country cn node add

### 2. 安装istioctl

    $ wget https://github.com/istio/istio/releases/download/1.7.4/istio-1.7.4-osx.tar.gz
    $ mkdir -p /usr/local/istio/1.7.4/
    $ tar xf istio-1.7.4-osx.tar.gz -C /usr/local/istio/1.7.4/
    $ export PATH=$PATH:/usr/local/istio/1.7.3/bin
     $ cat >~/.zshrc<< EOF
    #istio
    export PATH=$PATH:/usr/local/istio/1.7.3/bin
    EOF

### 3. 安装istio
    $ istioctl manifest install --set profile=demo --set values.tracing.enabled=true --set values.grafana.enabled=true --set values.kiali.enabled=true --set values.prometheus.enabled=true 
    $ kubectl -n istio-system get svc kiali


    $ cat << EOF > ./istio-gateway.yaml
    apiVersion: networking.istio.io/v1alpha3
    kind: Gateway
    metadata:
      name: istio-gateway
      namespace: istio-system
    spec:
      selector:
        istio: ingressgateway # use istio default controller
      servers:
      - port:
          number: 80
          name: http
          protocol: HTTP
        hosts:
        - "*.istio.example.local"
    ---
    apiVersion: networking.istio.io/v1alpha3
    kind: VirtualService
    metadata:
      name: kiali
      namespace: istio-system
    spec:
      hosts:
      - "kiali.istio.example.local"
      gateways:
      - istio-gateway
      http:
      - match:
        - port: 80
        route:
        - destination:
            host: kiali
            port:
              number: 20001
    ---
    apiVersion: networking.istio.io/v1alpha3
    kind: VirtualService
    metadata:
      name: grafana
      namespace: istio-system
    spec:
      hosts:
      - "grafana.istio.example.local"
      gateways:
      - istio-gateway
      http:
      - match:
        - port: 80
        route:
        - destination:
            host: grafana
            port:
              number: 3000
    EOF
    kubectl apply -f istio-gateway.yaml

### 4. 验证

    $ kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml
    $ kubectl apply -f samples/bookinfo/networking/bookinfo-gateway.yaml
    $ kubectl label namespace default istio-injection=enabled

    $ export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
    $ export SECURE_INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="https")].nodePort}')

    $ export INGRESS_HOST=$(minikube ip)
    $ export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT
    $ curl -s http://${GATEWAY_URL}/productpage | grep -o "<title>.*</title>"

    $ http://${GATEWAY_URL}/dashboard/db/istio-mesh-dashboard 


### 5.安装knative
    $ kubectl apply --filename https://github.com/knative/serving/releases/download/v0.18.0/serving-crds.yaml
    $ kubectl apply --filename https://github.com/knative/net-istio/releases/download/v0.18.0/release.yaml
    $ kubectl --namespace istio-system get service istio-ingressgateway
    $ kubectl get pods --namespace knative-serving


Ps:
1. 修改ingressgateway的LB的地址为主机地址

    $ kubectl edit  service istio-ingressgateway -n istio-system
      externalIPs:
      - 192.168.99.114
    
---
## 结束