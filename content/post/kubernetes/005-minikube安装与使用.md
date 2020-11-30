---
title:          005-minikube安装与使用.md
date:           2020-11-18T16:48:14+08:00
draft:          true
tags:           [2020-11]
topics:         [Minikube,kubernetes]
---
## 简介

&nbsp;&nbsp;&nbsp;&nbsp;在开发与学习kubernetes相关知识时,往往我们需要搭建许多个测试环境,而个人往往在搭建的过程耗费很多精力,所以才有了minikube这个项目,[minikube项目地址](https://github.com/kubernetes/minikube),这里将记录我在使用minikube的一些方法与场景。

<!--more-->
## 环境

    Mac OS X 10.15.7

## 软件包

## 拓扑图

## 正文
---

### 1.基础环境

安装Xcode Command Line Tools

    $ xcode-select --install

安装Homebrew

    安装方法
    $ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    国内用户可以使用gitee加速
    $ /bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"

    卸载方法
    $ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/uninstall.sh)"
    国内用户
    $ /bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/HomebrewUninstall.sh)"

安装virtualbox

    $ brew cask install virtualbox

或安装docker

    $ brew install cask docker

Ps:

注意在安装docker时会附带安装kubectl,如果virtualbox与docker都要安装的情况下,在装minikube时不需要安装kubernetes-cli包。


### 2.安装minikube

Homebrew安装

    $ brew install kubernetes-cli

    $ brew cask install minikube

二进制安装

    $ curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64

    $ sudo install minikube-darwin-amd64 /usr/local/bin/minikube


### 3.minikube使用

#### 示例

    $ minikube start --network-plugin=cni --driver=virtualbox --cni=calico --cpus=4  --memory=8g --image-mirror-country cn --docker-env http_proxy=http://192.168.99.1:8000 --docker-env https_proxy=http://192.168.99.1:8000 --docker-env no_proxy=localhost,127.0.0.1,::1,192.168.99.0/24

#### 选项：

    start          启动本地minikube集群
    status         获取本地minikube集群的状态
    stop           停止正在运行的本地minikube集群 
    delete         删除本地minikube集群 
    dashboard      访问在minikube集群中运行的Kubernetes dashboard 
    pause          暂停minikube集群
    unpause        恢复minikube集群
    docker-env     配置环境以使用minikube的Docker守护程序
    podman-env     配置环境以使用minikube的Podman服务 
    cache          添加，删除或将本地图像推送到minikube 
    addons         启用或禁用minikube插件 
    config         修改配置
    profile        获取或列出当前配置文件（集群）
    update-context 在IP或端口更改的情况下更新kubeconfig
    service        返回连接到服务的URL
    tunnel         连接到LoadBalancer服务
    mount          将指定的目录挂载到 minikube
    ssh            SSH登录到minikube环境（用于调试）
    kubectl        运行与集群版本匹配的kubectl二进制文件
    node           添加，删除或列出其他节点
    ssh-key        检索指定集群的 ssh 密钥路径
    ip             检索正在运行的群集的 IP 地址
    logs           返回日志以调试本地Kubernetes集群 
    update-check   打印当前和最新版本版本
    version        打印 minikube 版本

#### 参数:

    --network-plugin    设置网络插件
    --extra-config=apiserver.enable-swagger-ui=true 



#### 4.其他使用

minikube 设置kubernetes的swagger

    $ kubectl run swagger-ui --image=swaggerapi/swagger-ui:latest
    $ kubectl expose pod swagger-ui --port=8080 --external-ip=$(minikube ip) --type=NodePort

访问http://{minikube ip}:8080

---
## 结束