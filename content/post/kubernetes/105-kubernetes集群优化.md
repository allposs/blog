---
title:          105-kubernetes集群优化
date:           2020-08-13T14:20:23+08:00
draft:          true
tags:           [2020-08]
topics:         [容器,kubernetes]
---

## 简介
    最近在使用kubernetes发现诸多坑,所以这里记录一下。

<!--more-->
## 环境

    1.kubernetes集群

## 软件包

无

## 拓扑图

无

## 正文
---

### 1. Docker
#### 1.1 配置文件
说明：
    docker安装后默认没有daemon.json这个配置文件，需要进行手动创建。配置文件的默认路径：/etc/docker/daemon.json，一般情况，配置文件 daemon.json中配置的项目参数，在启动参数中同样适用，有些可能不一样（具体可以查看官方文档），但需要注意的一点，配置文件中如果已经有某个配置项，则无法在启动参数中增加，会出现冲突的错误。如果在daemon.json文件中进行配置，需要docker版本高于1.12.6(在这个版本上不生效，1.13.1以上是生效的)

[官方的配置地址](https://docs.docker.com/engine/reference/commandline/dockerd/)

优化配置示例
    cat > /etc/docker/daemon.json << EOF
    {
        "exec-opts": ["native.cgroupdriver=systemd"],
        "log-driver": "json-file",
        "log-opts": {
            "max-size": "100m",
            "max-file": "10"
        },
        "oom-score-adjust": -1000,
        "storage-driver": "devicemapper",       #使用裸设备
        "storage-opts": [
            "dm.thinpooldev=/dev/mapper/docker-thinpool",
            "dm.use_deferred_removal=true",
            "dm.use_deferred_deletion=true"
        ]
        "live-restore": false,
        "data-root": "/opt/docker",             ＃Docker运行时使用的根路径,根路径下的内容稍后介绍，默认/var/lib/docker
        "exec-root": "/opt/docker",             #执行状态文件的根目录（默认为’/var/run/docker‘）
        "bridge": "none",                       #设定绑定设备
        "dns": ["114.114.114.114"],             #设定容器DNS的地址，在容器的 /etc/resolv.conf文件中可查看。
        "dns-opts": [],                         #容器 /etc/resolv.conf 文件，其他设置
        "dns-search": [],                       #设定容器的搜索域，当设定搜索域为 .example.com 时，在搜索一个名为 host 的 主机时，DNS不仅搜索host，还会搜索host.example.com 。 注意：如果不设置， Docker 会默认用主机上的 /etc/resolv.conf 来配置容器。
        "hosts": [],                            #设置容器hosts
        "bip":"192.168.88.0/22",                #指定网桥IP
        "iptables": false,                      #启用iptables规则添加。默认为true
        "selinux-enabled": false,               #默认 false，启用selinux支持
        "debug": true,                          #启用debug的模式，启用后，可以看到很多的启动信息。默认false
        "default-ulimits": {
            "nofile": {
                "Name": "nofile",
                "Hard": 1024000,
                "Soft": 1024000
            },
            "nproc": {
                "Name": "nproc",
                "Hard": 1024000,
                "Soft": 1024000
            },
          "core": {
                "Name": "core",
                "Hard": -1,
                "Soft": -1    
          }
        }                                       #容器内部ulimit值。默认{}
    }
    EOF


### 2. kubernetes


### 3. Calico
---
## 结束